/**
 * 백업 데이터 복구 스크립트
 * 특정 날짜의 백업 데이터를 조회하고 필요시 복원
 * 
 * 사용법:
 *   node scripts/backup/restore-from-backup.js
 *   node scripts/backup/restore-from-backup.js --date=2025-01-03
 *   node scripts/backup/restore-from-backup.js --table=departments --date=2025-01-03
 */

const { Sequelize } = require('sequelize');
const config = require('../../config/database.js');
const readline = require('readline');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false
  }
);

// 명령줄 인자 파싱
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value;
  return acc;
}, {});

// 백업 테이블 정보
const BACKUP_TABLES = {
  'departments': {
    backup: 'departments_backup',
    columns: ['id', 'name', 'code', 'parent_id', 'manager', 'description', 'is_active', 'created_at', 'updated_at'],
    pk: 'id'
  },
  'budgets': {
    backup: 'budgets_backup',
    columns: ['id', 'name', 'year', 'type', 'total_amount', 'used_amount', 'remaining_amount', 'department', 'description', 'is_active', 'created_at', 'updated_at'],
    pk: 'id'
  },
  'proposals': {
    backup: 'proposals_backup',
    columns: ['id', 'title', 'type', 'department', 'requester', 'request_date', 'amount', 'budget_id', 'supplier_id', 'contract_type', 'description', 'status', 'approval_status', 'content', 'created_at', 'updated_at'],
    pk: 'id'
  },
  'suppliers': {
    backup: 'suppliers_backup',
    columns: ['id', 'name', 'business_number', 'representative', 'address', 'phone', 'email', 'credit_rating', 'business_type', 'registration_date', 'is_active', 'notes', 'created_at', 'updated_at'],
    pk: 'id'
  },
  'contracts': {
    backup: 'contracts_backup',
    columns: ['id', 'contract_number', 'contract_name', 'supplier_id', 'contract_type', 'contract_amount', 'start_date', 'end_date', 'status', 'department', 'manager', 'description', 'created_at', 'updated_at'],
    pk: 'id'
  }
};

/**
 * 사용 가능한 백업 날짜 목록 조회
 */
async function getAvailableBackupDates(tableName) {
  const tableInfo = BACKUP_TABLES[tableName];
  if (!tableInfo) return [];
  
  try {
    const [dates] = await sequelize.query(`
      SELECT DISTINCT backup_date, COUNT(*) as record_count
      FROM ${tableInfo.backup}
      GROUP BY backup_date
      ORDER BY backup_date DESC
      LIMIT 10
    `);
    
    return dates;
  } catch (error) {
    console.error(`백업 날짜 조회 실패:`, error.message);
    return [];
  }
}

/**
 * 특정 날짜의 백업 데이터 조회
 */
async function viewBackupData(tableName, backupDate, limit = 10) {
  const tableInfo = BACKUP_TABLES[tableName];
  if (!tableInfo) {
    console.log(`❌ 지원하지 않는 테이블: ${tableName}`);
    return null;
  }
  
  try {
    const [data] = await sequelize.query(`
      SELECT ${tableInfo.columns.join(', ')}, backup_date, backup_timestamp
      FROM ${tableInfo.backup}
      WHERE backup_date = '${backupDate}'
      ORDER BY ${tableInfo.pk}
      LIMIT ${limit}
    `);
    
    return data;
  } catch (error) {
    console.error(`백업 데이터 조회 실패:`, error.message);
    return null;
  }
}

/**
 * 특정 레코드 복원
 */
async function restoreRecord(tableName, recordId, backupDate) {
  const tableInfo = BACKUP_TABLES[tableName];
  if (!tableInfo) {
    console.log(`❌ 지원하지 않는 테이블: ${tableName}`);
    return false;
  }
  
  try {
    // 백업 데이터 조회
    const [backupData] = await sequelize.query(`
      SELECT ${tableInfo.columns.join(', ')}
      FROM ${tableInfo.backup}
      WHERE ${tableInfo.pk} = ${recordId} 
      AND backup_date = '${backupDate}'
      ORDER BY backup_timestamp DESC
      LIMIT 1
    `);
    
    if (backupData.length === 0) {
      console.log(`❌ 백업 데이터를 찾을 수 없습니다. (ID: ${recordId}, 날짜: ${backupDate})`);
      return false;
    }
    
    const record = backupData[0];
    
    // 현재 데이터 확인
    const [currentData] = await sequelize.query(`
      SELECT * FROM ${tableName} WHERE ${tableInfo.pk} = ${recordId}
    `);
    
    console.log('\n복원 전 데이터:');
    if (currentData.length > 0) {
      console.log(JSON.stringify(currentData[0], null, 2));
    } else {
      console.log('  (데이터 없음 - 새로 삽입됩니다)');
    }
    
    console.log('\n복원할 백업 데이터:');
    console.log(JSON.stringify(record, null, 2));
    
    // 확인
    const answer = await askQuestion('\n정말로 이 데이터로 복원하시겠습니까? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('복원이 취소되었습니다.');
      return false;
    }
    
    // 복원 실행
    if (currentData.length > 0) {
      // UPDATE
      const setClause = tableInfo.columns
        .filter(col => col !== tableInfo.pk)
        .map(col => `${col} = $${col}`)
        .join(', ');
      
      await sequelize.query(`
        UPDATE ${tableName}
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE ${tableInfo.pk} = ${recordId}
      `, {
        bind: record
      });
      
      console.log(`\n✅ 복원 완료: ${tableName} 테이블의 ID ${recordId} 레코드가 업데이트되었습니다.`);
    } else {
      // INSERT
      const columns = tableInfo.columns.join(', ');
      const values = tableInfo.columns.map(col => `$${col}`).join(', ');
      
      await sequelize.query(`
        INSERT INTO ${tableName} (${columns})
        VALUES (${values})
      `, {
        bind: record
      });
      
      console.log(`\n✅ 복원 완료: ${tableName} 테이블에 ID ${recordId} 레코드가 삽입되었습니다.`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`\n❌ 복원 실패:`, error.message);
    return false;
  }
}

/**
 * 사용자 입력 받기
 */
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * 대화형 모드
 */
async function interactiveMode() {
  console.log('====================================');
  console.log('백업 데이터 복구 도구');
  console.log('====================================\n');
  
  // 테이블 선택
  console.log('복원 가능한 테이블:');
  const tables = Object.keys(BACKUP_TABLES);
  tables.forEach((table, idx) => {
    console.log(`  ${idx + 1}. ${table}`);
  });
  
  const tableAnswer = await askQuestion('\n테이블 번호를 선택하세요 (1-5): ');
  const tableIndex = parseInt(tableAnswer) - 1;
  
  if (tableIndex < 0 || tableIndex >= tables.length) {
    console.log('❌ 잘못된 선택입니다.');
    return;
  }
  
  const tableName = tables[tableIndex];
  console.log(`\n선택된 테이블: ${tableName}`);
  
  // 백업 날짜 조회
  console.log('\n백업 날짜 조회 중...');
  const dates = await getAvailableBackupDates(tableName);
  
  if (dates.length === 0) {
    console.log('❌ 백업 데이터가 없습니다.');
    return;
  }
  
  console.log('\n사용 가능한 백업 날짜:');
  dates.forEach((date, idx) => {
    console.log(`  ${idx + 1}. ${new Date(date.backup_date).toLocaleDateString('ko-KR')} (${date.record_count}건)`);
  });
  
  const dateAnswer = await askQuestion('\n날짜 번호를 선택하세요: ');
  const dateIndex = parseInt(dateAnswer) - 1;
  
  if (dateIndex < 0 || dateIndex >= dates.length) {
    console.log('❌ 잘못된 선택입니다.');
    return;
  }
  
  const backupDate = dates[dateIndex].backup_date;
  console.log(`\n선택된 날짜: ${new Date(backupDate).toLocaleDateString('ko-KR')}`);
  
  // 백업 데이터 미리보기
  console.log('\n백업 데이터 미리보기 (최대 10건):');
  const data = await viewBackupData(tableName, backupDate, 10);
  
  if (!data || data.length === 0) {
    console.log('❌ 백업 데이터가 없습니다.');
    return;
  }
  
  console.log(`\n총 ${data.length}건의 데이터:`);
  data.forEach((row, idx) => {
    const tableInfo = BACKUP_TABLES[tableName];
    const pk = row[tableInfo.pk];
    const displayCols = tableInfo.columns.slice(0, 3);
    const displayInfo = displayCols.map(col => `${col}: ${row[col]}`).join(', ');
    console.log(`  ${idx + 1}. ID ${pk}: ${displayInfo}`);
  });
  
  // 복원 여부 선택
  const actionAnswer = await askQuestion('\n작업을 선택하세요 (1: 특정 레코드 복원, 2: 전체 조회만, 3: 종료): ');
  
  if (actionAnswer === '1') {
    const idAnswer = await askQuestion('\n복원할 레코드의 ID를 입력하세요: ');
    const recordId = parseInt(idAnswer);
    
    if (isNaN(recordId)) {
      console.log('❌ 잘못된 ID입니다.');
      return;
    }
    
    await restoreRecord(tableName, recordId, backupDate);
  } else if (actionAnswer === '2') {
    console.log('\n✅ 조회 완료');
  } else {
    console.log('\n종료합니다.');
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    await sequelize.authenticate();
    
    if (args.table && args.date && args.id) {
      // 직접 복원 모드
      await restoreRecord(args.table, args.id, args.date);
    } else if (args.table && args.date) {
      // 데이터 조회 모드
      console.log(`\n${args.table} 테이블의 ${args.date} 백업 데이터:\n`);
      const data = await viewBackupData(args.table, args.date, 100);
      if (data && data.length > 0) {
        console.table(data);
      } else {
        console.log('백업 데이터가 없습니다.');
      }
    } else {
      // 대화형 모드
      await interactiveMode();
    }
    
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.error('오류 발생:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// 스크립트 실행
main();

