/**
 * 오래된 백업 데이터 정리 스크립트
 * 10일 이상 지난 백업 데이터를 자동으로 삭제
 * 실행 시간: 매일 자정 (백업 후)
 */

const { Sequelize } = require('sequelize');
const config = require('../../config/database.js');

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

// 보관 기간 (일)
const RETENTION_DAYS = 10;

// 백업 테이블 목록
const BACKUP_TABLES = [
  'departments_backup',
  'tasks_backup',
  'budgets_backup',
  'suppliers_backup',
  'document_templates_backup',
  'proposals_backup',
  'contracts_backup',
  'approval_lines_backup',
  'proposal_histories_backup',
  'purchase_items_backup',
  'cost_departments_backup',
  'request_departments_backup',
  'contract_methods_backup',
  'service_items_backup'
];

/**
 * 특정 백업 테이블의 오래된 데이터 삭제
 */
async function cleanupBackupTable(tableName) {
  try {
    const query = `
      DELETE FROM ${tableName}
      WHERE backup_date < CURRENT_DATE - INTERVAL '${RETENTION_DAYS} days'
    `;
    
    const [results, metadata] = await sequelize.query(query);
    
    const deletedCount = metadata.rowCount || 0;
    
    if (deletedCount > 0) {
      console.log(`✅ ${tableName}: ${deletedCount}건 삭제`);
    } else {
      console.log(`ℹ️  ${tableName}: 삭제할 데이터 없음`);
    }
    
    return { table: tableName, success: true, deletedCount };
  } catch (error) {
    console.error(`❌ ${tableName} 정리 실패:`, error.message);
    return { table: tableName, success: false, error: error.message };
  }
}

/**
 * 백업 데이터 통계 조회
 */
async function getBackupStats(tableName) {
  try {
    const query = `
      SELECT 
        backup_date,
        COUNT(*) as record_count,
        MIN(backup_timestamp) as first_backup,
        MAX(backup_timestamp) as last_backup
      FROM ${tableName}
      GROUP BY backup_date
      ORDER BY backup_date DESC
      LIMIT 15
    `;
    
    const [results] = await sequelize.query(query);
    return results;
  } catch (error) {
    console.error(`${tableName} 통계 조회 실패:`, error.message);
    return [];
  }
}

/**
 * 모든 백업 테이블 정리
 */
async function cleanupAllBackups() {
  console.log('====================================');
  console.log('오래된 백업 데이터 정리 시작');
  console.log('시작 시간:', new Date().toLocaleString('ko-KR'));
  console.log(`보관 기간: ${RETENTION_DAYS}일`);
  console.log('====================================\n');
  
  const results = [];
  let successCount = 0;
  let failCount = 0;
  let totalDeleted = 0;
  
  // 각 백업 테이블 정리
  for (const tableName of BACKUP_TABLES) {
    const result = await cleanupBackupTable(tableName);
    results.push(result);
    
    if (result.success) {
      successCount++;
      totalDeleted += result.deletedCount;
    } else {
      failCount++;
    }
  }
  
  console.log('\n====================================');
  console.log('백업 정리 완료 요약');
  console.log('====================================');
  console.log(`총 테이블 수: ${BACKUP_TABLES.length}개`);
  console.log(`성공: ${successCount}개`);
  console.log(`실패: ${failCount}개`);
  console.log(`총 삭제 레코드 수: ${totalDeleted}건`);
  console.log('완료 시간:', new Date().toLocaleString('ko-KR'));
  console.log('====================================');
  
  // 실패한 테이블 목록 출력
  if (failCount > 0) {
    console.log('\n실패한 테이블:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.table}: ${r.error}`);
    });
  }
  
  return results;
}

/**
 * 백업 데이터 현황 출력
 */
async function printBackupStatus() {
  console.log('\n====================================');
  console.log('현재 백업 데이터 현황');
  console.log('====================================\n');
  
  for (const tableName of BACKUP_TABLES) {
    const stats = await getBackupStats(tableName);
    
    if (stats.length > 0) {
      console.log(`📊 ${tableName}:`);
      console.log(`   총 백업 일수: ${stats.length}일`);
      
      // 최근 5일 데이터만 표시
      const recentStats = stats.slice(0, 5);
      recentStats.forEach(stat => {
        const date = new Date(stat.backup_date).toLocaleDateString('ko-KR');
        console.log(`   - ${date}: ${stat.record_count}건`);
      });
      
      if (stats.length > 5) {
        console.log(`   ... 외 ${stats.length - 5}일 데이터`);
      }
      console.log('');
    }
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공\n');
    
    // 오래된 백업 데이터 정리
    const results = await cleanupAllBackups();
    
    // 현재 백업 데이터 현황 출력
    await printBackupStatus();
    
    // 실패가 있으면 에러 코드 반환
    const hasFailures = results.some(r => !r.success);
    
    await sequelize.close();
    process.exit(hasFailures ? 1 : 0);
    
  } catch (error) {
    console.error('백업 정리 중 오류 발생:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// 스크립트 실행
main();

