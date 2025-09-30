const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 소스 데이터베이스 설정 (기존 DB)
const sourceConfig = {
  database: process.env.SOURCE_DB_NAME || 'contract_management_old',
  username: process.env.SOURCE_DB_USERNAME || 'postgres',
  password: process.env.SOURCE_DB_PASSWORD || 'meritz123!',
  host: process.env.SOURCE_DB_HOST || 'localhost',
  port: process.env.SOURCE_DB_PORT || 5432,
  dialect: 'postgres',
  logging: false
};

// 타겟 데이터베이스 설정 (새 DB)
const targetConfig = {
  database: process.env.DB_NAME || 'contract_management',
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'meritz123!',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false
};

const sourceDB = new Sequelize(sourceConfig.database, sourceConfig.username, sourceConfig.password, sourceConfig);
const targetDB = new Sequelize(targetConfig.database, targetConfig.username, targetConfig.password, targetConfig);

// 이관할 테이블 목록 (순서 중요 - 외래키 관계 고려)
const MIGRATION_TABLES = [
  'departments',
  'budgets',
  'suppliers',
  'contract_methods',
  'cost_departments',
  'proposals',
  'request_departments',
  'purchase_items',
  'purchase_item_cost_allocations',
  'service_items',
  'contracts',
  'approval_lines',
  'proposal_histories'
];

// 로그 함수
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📋';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

// 데이터베이스 연결 테스트
async function testConnections() {
  try {
    log('소스 데이터베이스 연결 테스트...');
    await sourceDB.authenticate();
    log('소스 데이터베이스 연결 성공!', 'success');

    log('타겟 데이터베이스 연결 테스트...');
    await targetDB.authenticate();
    log('타겟 데이터베이스 연결 성공!', 'success');

    return true;
  } catch (error) {
    log(`데이터베이스 연결 실패: ${error.message}`, 'error');
    return false;
  }
}

// 테이블 존재 여부 확인
async function checkTableExists(sequelize, tableName) {
  try {
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      );
    `);
    return results[0].exists;
  } catch (error) {
    return false;
  }
}

// 테이블 데이터 개수 확인
async function getTableCount(sequelize, tableName) {
  try {
    const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(results[0].count);
  } catch (error) {
    return 0;
  }
}

// 테이블 스키마 비교
async function compareTableSchemas(tableName) {
  try {
    const [sourceSchema] = await sourceDB.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = '${tableName}'
      ORDER BY ordinal_position;
    `);

    const [targetSchema] = await targetDB.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = '${tableName}'
      ORDER BY ordinal_position;
    `);

    return {
      source: sourceSchema,
      target: targetSchema,
      compatible: sourceSchema.length > 0 && targetSchema.length > 0
    };
  } catch (error) {
    return { source: [], target: [], compatible: false };
  }
}

// 단일 테이블 데이터 이관
async function migrateTable(tableName) {
  const transaction = await targetDB.transaction();
  
  try {
    log(`${tableName} 테이블 이관 시작...`);

    // 1. 테이블 존재 여부 확인
    const sourceExists = await checkTableExists(sourceDB, tableName);
    const targetExists = await checkTableExists(targetDB, tableName);

    if (!sourceExists) {
      log(`소스에 ${tableName} 테이블이 없습니다. 건너뜁니다.`);
      await transaction.rollback();
      return { success: true, skipped: true };
    }

    if (!targetExists) {
      log(`타겟에 ${tableName} 테이블이 없습니다. 건너뜁니다.`);
      await transaction.rollback();
      return { success: true, skipped: true };
    }

    // 2. 데이터 개수 확인
    const sourceCount = await getTableCount(sourceDB, tableName);
    log(`${tableName}: 소스 데이터 ${sourceCount}개`);

    if (sourceCount === 0) {
      log(`${tableName} 테이블에 데이터가 없습니다. 건너뜁니다.`);
      await transaction.rollback();
      return { success: true, skipped: true };
    }

    // 3. 스키마 비교
    const schemaComparison = await compareTableSchemas(tableName);
    if (!schemaComparison.compatible) {
      log(`${tableName} 테이블 스키마가 호환되지 않습니다.`, 'error');
      await transaction.rollback();
      return { success: false, error: 'Schema incompatible' };
    }

    // 4. 기존 데이터 삭제 (선택적)
    const targetCount = await getTableCount(targetDB, tableName);
    if (targetCount > 0) {
      log(`${tableName} 테이블의 기존 데이터 ${targetCount}개를 삭제합니다...`);
      await targetDB.query(`DELETE FROM ${tableName}`, { transaction });
    }

    // 5. 데이터 복사
    log(`${tableName} 데이터 복사 중...`);
    
    // 소스에서 모든 데이터 조회
    const [sourceData] = await sourceDB.query(`SELECT * FROM ${tableName}`);
    
    if (sourceData.length > 0) {
      // 컬럼 목록 가져오기
      const columns = Object.keys(sourceData[0]);
      const columnList = columns.join(', ');
      const placeholders = columns.map(() => '?').join(', ');

      // 배치 단위로 데이터 삽입 (1000개씩)
      const batchSize = 1000;
      let insertedCount = 0;

      for (let i = 0; i < sourceData.length; i += batchSize) {
        const batch = sourceData.slice(i, i + batchSize);
        
        // VALUES 절 생성
        const values = batch.map(row => {
          const rowValues = columns.map(col => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (typeof value === 'boolean') return value ? 'true' : 'false';
            if (value instanceof Date) return `'${value.toISOString()}'`;
            return value;
          }).join(', ');
          return `(${rowValues})`;
        }).join(', ');

        const insertQuery = `INSERT INTO ${tableName} (${columnList}) VALUES ${values}`;
        await targetDB.query(insertQuery, { transaction });
        
        insertedCount += batch.length;
        log(`${tableName}: ${insertedCount}/${sourceData.length} 개 완료`);
      }

      // 시퀀스 재설정 (PostgreSQL)
      try {
        const [sequences] = await targetDB.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          AND column_default LIKE 'nextval%'
        `);

        for (const seq of sequences) {
          const sequenceName = `${tableName}_${seq.column_name}_seq`;
          await targetDB.query(`
            SELECT setval('${sequenceName}', COALESCE((SELECT MAX(${seq.column_name}) FROM ${tableName}), 1))
          `, { transaction });
        }
      } catch (seqError) {
        log(`시퀀스 재설정 중 오류 (무시됨): ${seqError.message}`);
      }
    }

    await transaction.commit();
    log(`${tableName} 테이블 이관 완료! (${sourceData.length}개)`, 'success');
    
    return { 
      success: true, 
      sourceCount: sourceData.length, 
      targetCount: sourceData.length 
    };

  } catch (error) {
    await transaction.rollback();
    log(`${tableName} 테이블 이관 실패: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// 전체 데이터 이관
async function migrateAllData() {
  const results = {};
  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  log('='.repeat(50));
  log('데이터베이스 이관 시작');
  log('='.repeat(50));

  // 연결 테스트
  if (!(await testConnections())) {
    return;
  }

  // 각 테이블 이관
  for (const tableName of MIGRATION_TABLES) {
    const result = await migrateTable(tableName);
    results[tableName] = result;

    if (result.success) {
      if (result.skipped) {
        totalSkipped++;
      } else {
        totalSuccess++;
      }
    } else {
      totalFailed++;
    }
  }

  // 결과 요약
  log('='.repeat(50));
  log('이관 결과 요약');
  log('='.repeat(50));
  log(`성공: ${totalSuccess}개`);
  log(`건너뜀: ${totalSkipped}개`);
  log(`실패: ${totalFailed}개`);
  log('='.repeat(50));

  // 상세 결과
  for (const [tableName, result] of Object.entries(results)) {
    if (result.success && !result.skipped) {
      log(`✅ ${tableName}: ${result.sourceCount} → ${result.targetCount}`);
    } else if (result.skipped) {
      log(`⏭️  ${tableName}: 건너뜀`);
    } else {
      log(`❌ ${tableName}: ${result.error}`, 'error');
    }
  }

  return results;
}

// 백업 생성
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `backup_${targetConfig.database}_${timestamp}.sql`;
  
  try {
    log('타겟 데이터베이스 백업 생성 중...');
    
    const { exec } = require('child_process');
    const command = `pg_dump -h ${targetConfig.host} -p ${targetConfig.port} -U ${targetConfig.username} -d ${targetConfig.database} > ${backupFile}`;
    
    await new Promise((resolve, reject) => {
      exec(command, { env: { ...process.env, PGPASSWORD: targetConfig.password } }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
    
    log(`백업 파일 생성 완료: ${backupFile}`, 'success');
    return backupFile;
  } catch (error) {
    log(`백업 생성 실패: ${error.message}`, 'error');
    return null;
  }
}

// 메인 실행 함수
async function main() {
  try {
    // 백업 생성 (선택적)
    if (process.argv.includes('--backup')) {
      await createBackup();
    }

    // 데이터 이관 실행
    await migrateAllData();

  } catch (error) {
    log(`전체 프로세스 실패: ${error.message}`, 'error');
  } finally {
    // 연결 종료
    await sourceDB.close();
    await targetDB.close();
    log('데이터베이스 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = {
  migrateAllData,
  migrateTable,
  testConnections,
  createBackup
}; 