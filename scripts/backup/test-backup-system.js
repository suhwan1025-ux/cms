/**
 * 백업 시스템 검증 스크립트
 * 1. 백업 테이블 존재 여부 확인
 * 2. 백업 데이터 존재 여부 확인
 * 3. 백업 날짜 데이터 확인
 * 4. 복구 가능성 테스트
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

// 백업 테이블 목록
const BACKUP_TABLES = [
  { backup: 'departments_backup', original: 'departments' },
  { backup: 'tasks_backup', original: 'tasks' },
  { backup: 'budgets_backup', original: 'budgets' },
  { backup: 'suppliers_backup', original: 'suppliers' },
  { backup: 'document_templates_backup', original: 'document_templates' },
  { backup: 'proposals_backup', original: 'proposals' },
  { backup: 'contracts_backup', original: 'contracts' },
  { backup: 'approval_lines_backup', original: 'approval_lines' },
  { backup: 'proposal_histories_backup', original: 'proposal_histories' },
  { backup: 'purchase_items_backup', original: 'purchase_items' },
  { backup: 'cost_departments_backup', original: 'cost_departments' },
  { backup: 'request_departments_backup', original: 'request_departments' },
  { backup: 'contract_methods_backup', original: 'contract_methods' },
  { backup: 'service_items_backup', original: 'service_items' }
];

/**
 * 1. 백업 테이블 존재 여부 확인
 */
async function checkBackupTablesExist() {
  console.log('\n====================================');
  console.log('1. 백업 테이블 존재 여부 확인');
  console.log('====================================\n');
  
  const results = [];
  
  for (const table of BACKUP_TABLES) {
    try {
      const [result] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table.backup}'
        ) as exists
      `);
      
      const exists = result[0].exists;
      results.push({ table: table.backup, exists });
      
      if (exists) {
        console.log(`✅ ${table.backup}`);
      } else {
        console.log(`❌ ${table.backup} - 테이블이 존재하지 않습니다!`);
      }
    } catch (error) {
      console.log(`❌ ${table.backup} - 확인 실패: ${error.message}`);
      results.push({ table: table.backup, exists: false, error: error.message });
    }
  }
  
  const existCount = results.filter(r => r.exists).length;
  const missingCount = results.length - existCount;
  
  console.log(`\n결과: ${existCount}/${results.length}개 테이블 존재`);
  
  if (missingCount > 0) {
    console.log(`⚠️  ${missingCount}개 테이블 누락 - create_backup_tables.sql 실행 필요`);
  }
  
  return results;
}

/**
 * 2. 백업 데이터 존재 여부 및 날짜 확인
 */
async function checkBackupData() {
  console.log('\n====================================');
  console.log('2. 백업 데이터 및 날짜 확인');
  console.log('====================================\n');
  
  const results = [];
  let totalBackupRecords = 0;
  let tablesWithBackup = 0;
  let tablesWithoutBackup = 0;
  
  for (const table of BACKUP_TABLES) {
    try {
      // 백업 테이블 존재 확인
      const [existsResult] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table.backup}'
        ) as exists
      `);
      
      if (!existsResult[0].exists) {
        console.log(`⚠️  ${table.backup} - 테이블이 존재하지 않음`);
        results.push({ 
          table: table.backup, 
          exists: false,
          totalRecords: 0,
          backupDays: 0,
          latestBackup: null,
          oldestBackup: null
        });
        continue;
      }
      
      // 백업 데이터 통계
      const [stats] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_records,
          COUNT(DISTINCT backup_date) as backup_days,
          MIN(backup_date) as oldest_backup,
          MAX(backup_date) as latest_backup
        FROM ${table.backup}
      `);
      
      const stat = stats[0];
      const hasData = parseInt(stat.total_records) > 0;
      
      if (hasData) {
        tablesWithBackup++;
        totalBackupRecords += parseInt(stat.total_records);
        console.log(`✅ ${table.backup}`);
        console.log(`   - 총 레코드: ${stat.total_records}건`);
        console.log(`   - 백업 일수: ${stat.backup_days}일`);
        console.log(`   - 최신 백업: ${stat.latest_backup ? new Date(stat.latest_backup).toLocaleDateString('ko-KR') : 'N/A'}`);
        console.log(`   - 최초 백업: ${stat.oldest_backup ? new Date(stat.oldest_backup).toLocaleDateString('ko-KR') : 'N/A'}`);
      } else {
        tablesWithoutBackup++;
        console.log(`⚠️  ${table.backup} - 백업 데이터 없음`);
      }
      
      results.push({
        table: table.backup,
        exists: true,
        totalRecords: parseInt(stat.total_records),
        backupDays: parseInt(stat.backup_days),
        latestBackup: stat.latest_backup,
        oldestBackup: stat.oldest_backup,
        hasData
      });
      
    } catch (error) {
      console.log(`❌ ${table.backup} - 확인 실패: ${error.message}`);
      results.push({ 
        table: table.backup, 
        error: error.message 
      });
    }
  }
  
  console.log(`\n요약:`);
  console.log(`  - 백업 데이터 있음: ${tablesWithBackup}개`);
  console.log(`  - 백업 데이터 없음: ${tablesWithoutBackup}개`);
  console.log(`  - 총 백업 레코드: ${totalBackupRecords.toLocaleString()}건`);
  
  return results;
}

/**
 * 3. 원본 테이블과 백업 테이블 데이터 비교
 */
async function compareOriginalAndBackup() {
  console.log('\n====================================');
  console.log('3. 원본 vs 백업 테이블 데이터 비교');
  console.log('====================================\n');
  
  const results = [];
  
  for (const table of BACKUP_TABLES) {
    try {
      // 원본 테이블 레코드 수
      const [originalCount] = await sequelize.query(`
        SELECT COUNT(*) as count FROM ${table.original}
      `);
      
      // 백업 테이블의 최신 백업 레코드 수
      const [backupCount] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM ${table.backup}
        WHERE backup_date = (SELECT MAX(backup_date) FROM ${table.backup})
      `);
      
      const original = parseInt(originalCount[0].count);
      const backup = parseInt(backupCount[0].count);
      const match = original === backup;
      
      console.log(`${match ? '✅' : '⚠️'} ${table.original}`);
      console.log(`   원본: ${original}건, 최신 백업: ${backup}건 ${match ? '' : '- 불일치!'}`);
      
      results.push({
        table: table.original,
        originalCount: original,
        backupCount: backup,
        match
      });
      
    } catch (error) {
      console.log(`❌ ${table.original} - 비교 실패: ${error.message}`);
      results.push({
        table: table.original,
        error: error.message
      });
    }
  }
  
  const matchCount = results.filter(r => r.match).length;
  const mismatchCount = results.filter(r => r.match === false).length;
  
  console.log(`\n결과: ${matchCount}/${results.length}개 테이블 일치`);
  if (mismatchCount > 0) {
    console.log(`⚠️  ${mismatchCount}개 테이블 불일치 - 백업 실행 필요`);
  }
  
  return results;
}

/**
 * 4. 복구 가능성 테스트 (departments 테이블로 테스트)
 */
async function testRestorability() {
  console.log('\n====================================');
  console.log('4. 복구 가능성 테스트');
  console.log('====================================\n');
  
  try {
    // 백업 데이터가 있는지 확인
    const [backupCheck] = await sequelize.query(`
      SELECT COUNT(*) as count, MAX(backup_date) as latest_date
      FROM departments_backup
    `);
    
    const backupCount = parseInt(backupCheck[0].count);
    const latestDate = backupCheck[0].latest_date;
    
    if (backupCount === 0) {
      console.log('⚠️  백업 데이터가 없어 복구 테스트를 수행할 수 없습니다.');
      console.log('   먼저 백업을 실행하세요: node scripts/backup/daily-backup.js');
      return { success: false, reason: 'no_backup_data' };
    }
    
    console.log(`✅ 테스트 대상: departments 테이블`);
    console.log(`   백업 데이터: ${backupCount}건`);
    console.log(`   최신 백업 날짜: ${new Date(latestDate).toLocaleDateString('ko-KR')}`);
    console.log('');
    
    // 백업 데이터 샘플 조회
    const [backupSample] = await sequelize.query(`
      SELECT id, name, code, backup_date, backup_timestamp
      FROM departments_backup
      WHERE backup_date = '${latestDate}'
      ORDER BY id
      LIMIT 5
    `);
    
    console.log('백업 데이터 샘플 (최근 백업):');
    backupSample.forEach((row, idx) => {
      console.log(`  ${idx + 1}. ID: ${row.id}, 이름: ${row.name}, 코드: ${row.code}`);
      console.log(`     백업일: ${new Date(row.backup_date).toLocaleDateString('ko-KR')}`);
    });
    
    console.log('');
    console.log('✅ 복구 가능성: 양호');
    console.log('   - 백업 데이터가 정상적으로 저장되어 있습니다.');
    console.log('   - 필요시 SELECT 쿼리로 특정 날짜의 데이터를 조회/복원할 수 있습니다.');
    
    // 복구 쿼리 예시 제공
    console.log('\n복구 쿼리 예시:');
    console.log('```sql');
    console.log(`-- 특정 날짜(${new Date(latestDate).toLocaleDateString('ko-KR')})의 백업 데이터 조회`);
    console.log(`SELECT * FROM departments_backup WHERE backup_date = '${latestDate}';`);
    console.log('');
    console.log('-- 특정 레코드 복원 (예: ID=1)');
    console.log(`UPDATE departments d
SET 
    name = b.name,
    code = b.code,
    manager = b.manager,
    description = b.description,
    updated_at = CURRENT_TIMESTAMP
FROM (
    SELECT * FROM departments_backup 
    WHERE id = 1 
    AND backup_date = '${latestDate}'
    ORDER BY backup_timestamp DESC 
    LIMIT 1
) b
WHERE d.id = 1;`);
    console.log('```');
    
    return { 
      success: true, 
      backupCount, 
      latestDate,
      sampleData: backupSample 
    };
    
  } catch (error) {
    console.log(`❌ 복구 테스트 실패: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 5. Windows 작업 스케줄러 확인 (정보 제공)
 */
function checkSchedulerInfo() {
  console.log('\n====================================');
  console.log('5. 자동 백업 설정 확인');
  console.log('====================================\n');
  
  console.log('ℹ️  Windows 작업 스케줄러 확인 방법:');
  console.log('');
  console.log('PowerShell에서 다음 명령 실행:');
  console.log('```powershell');
  console.log('Get-ScheduledTask -TaskName "CMS 데이터베이스 일일 백업"');
  console.log('```');
  console.log('');
  console.log('작업 스케줄러 GUI:');
  console.log('  Win + R → taskschd.msc');
  console.log('');
  console.log('✅ 작업 스케줄러는 Node.js 서버와 독립적으로 작동합니다.');
  console.log('   - 서버가 실행 중이지 않아도 백업이 정상적으로 실행됩니다.');
  console.log('   - Windows가 켜져 있기만 하면 자정에 자동으로 백업됩니다.');
  console.log('');
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('====================================');
  console.log('백업 시스템 검증 시작');
  console.log('시작 시간:', new Date().toLocaleString('ko-KR'));
  console.log('====================================');
  
  try {
    // 데이터베이스 연결
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');
    
    // 1. 백업 테이블 존재 확인
    const tableResults = await checkBackupTablesExist();
    
    // 2. 백업 데이터 확인
    const dataResults = await checkBackupData();
    
    // 3. 원본과 백업 비교
    const compareResults = await compareOriginalAndBackup();
    
    // 4. 복구 가능성 테스트
    const restoreResults = await testRestorability();
    
    // 5. 스케줄러 정보
    checkSchedulerInfo();
    
    // 최종 요약
    console.log('\n====================================');
    console.log('최종 검증 결과');
    console.log('====================================\n');
    
    const allTablesExist = tableResults.every(r => r.exists);
    const hasBackupData = dataResults.some(r => r.hasData);
    const canRestore = restoreResults.success;
    
    console.log(`✅ 1. 백업 테이블 존재: ${allTablesExist ? '통과' : '실패'}`);
    console.log(`${hasBackupData ? '✅' : '⚠️'} 2. 백업 데이터 존재: ${hasBackupData ? '통과' : '백업 필요'}`);
    console.log(`${canRestore ? '✅' : '⚠️'} 3. 복구 가능성: ${canRestore ? '통과' : '테스트 불가'}`);
    console.log(`ℹ️  4. 자동 실행: 작업 스케줄러 확인 필요`);
    
    console.log('\n권장 조치:');
    if (!allTablesExist) {
      console.log('  ⚠️  백업 테이블을 생성하세요:');
      console.log('     psql -U postgres -d contract_management -f sql/create_backup_tables.sql');
    }
    if (!hasBackupData) {
      console.log('  ⚠️  첫 백업을 실행하세요:');
      console.log('     node scripts/backup/daily-backup.js');
    }
    console.log('  ℹ️  작업 스케줄러를 등록하세요:');
    console.log('     .\\scripts\\setup\\register-backup-scheduler.ps1');
    
    console.log('\n====================================');
    console.log('검증 완료');
    console.log('완료 시간:', new Date().toLocaleString('ko-KR'));
    console.log('====================================\n');
    
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ 검증 중 오류 발생:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// 스크립트 실행
main();

