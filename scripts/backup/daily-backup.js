/**
 * 일일 데이터베이스 백업 스크립트
 * 모든 테이블의 데이터를 백업 테이블로 복사
 * 실행 시간: 매일 자정 (00:00)
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

// 백업할 테이블 목록 (테이블명, 컬럼 목록)
const TABLES_TO_BACKUP = [
  {
    table: 'departments',
    columns: ['id', 'name', 'code', 'parent_id', 'manager', 'description', 'is_active', 'created_at', 'updated_at']
  },
  {
    table: 'tasks',
    columns: ['id', 'task_name', 'description', 'shared_folder_path', 'start_date', 'end_date', 'status', 'assigned_department', 'assigned_person', 'priority', 'is_active', 'created_at', 'updated_at']
  },
  {
    table: 'budgets',
    columns: ['id', 'name', 'year', 'type', 'total_amount', 'used_amount', 'remaining_amount', 'department', 'description', 'is_active', 'created_at', 'updated_at']
  },
  {
    table: 'suppliers',
    columns: ['id', 'name', 'business_number', 'representative', 'address', 'phone', 'email', 'credit_rating', 'business_type', 'registration_date', 'is_active', 'notes', 'created_at', 'updated_at']
  },
  {
    table: 'document_templates',
    columns: ['id', 'name', 'description', 'content', 'category', 'is_active', 'created_at', 'updated_at']
  },
  {
    table: 'proposals',
    columns: ['id', 'contract_type', 'title', 'purpose', 'basis', 'budget_id', 'contract_method', 'contract_method_id', 'account_subject', 'total_amount', 'change_reason', 'extension_reason', 'contract_period', 'contract_start_date', 'contract_end_date', 'payment_method', 'status', 'created_by', 'proposal_date', 'approval_date', 'is_draft', 'wysiwyg_content', 'other', 'created_at', 'updated_at']
  },
  {
    table: 'contracts',
    columns: ['id', 'proposal_id', 'contract_number', 'contract_type', 'supplier_id', 'contract_amount', 'start_date', 'end_date', 'payment_method', 'status', 'description', 'attachments', 'created_at', 'updated_at']
  },
  {
    table: 'approval_lines',
    columns: ['id', 'proposal_id', 'step', 'name', 'title', 'description', 'is_conditional', 'is_final', 'status', 'approved_at', 'approved_by', 'comment', 'created_at', 'updated_at']
  },
  {
    table: 'proposal_histories',
    columns: ['id', 'proposal_id', 'changed_by', 'changed_at', 'change_type', 'field_name', 'old_value', 'new_value', 'description', 'created_at', 'updated_at']
  },
  {
    table: 'purchase_items',
    columns: ['id', 'proposal_id', 'supplier_id', 'item', 'product_name', 'quantity', 'unit_price', 'amount', 'supplier', 'request_department', 'contract_period_type', 'custom_contract_period', 'contract_start_date', 'contract_end_date', 'created_at', 'updated_at']
  },
  {
    table: 'cost_departments',
    columns: ['id', 'proposal_id', 'department_id', 'department', 'amount', 'ratio', 'purchase_item_id', 'allocation_type', 'service_item_id', 'created_at', 'updated_at']
  },
  {
    table: 'request_departments',
    columns: ['id', 'proposal_id', 'department_id', 'department', 'name', 'code', 'created_at', 'updated_at']
  },
  {
    table: 'contract_methods',
    columns: ['id', 'name', 'code', 'description', 'is_active', 'created_at', 'updated_at']
  },
  {
    table: 'service_items',
    columns: ['id', 'proposal_id', 'supplier_id', 'item', 'name', 'personnel', 'skill_level', 'period', 'monthly_rate', 'contract_amount', 'supplier', 'credit_rating', 'contract_period_start', 'contract_period_end', 'payment_method', 'created_at', 'updated_at']
  },
  {
    table: 'personnel',
    columns: ['id', 'division', 'department', 'position', 'employee_number', 'name', 'rank', 'duties', 'job_function', 'bok_job_function', 'job_category', 'is_it_personnel', 'is_security_personnel', 'birth_date', 'gender', 'age', 'group_join_date', 'join_date', 'resignation_date', 'total_service_years', 'career_base_date', 'it_career_years', 'current_duty_date', 'current_duty_period', 'previous_department', 'major', 'is_it_major', 'it_certificate_1', 'it_certificate_2', 'it_certificate_3', 'it_certificate_4', 'is_active', 'notes', 'created_at', 'updated_at']
  }
];

/**
 * 테이블 백업 실행
 */
async function backupTable(tableInfo) {
  const { table, columns } = tableInfo;
  const backupTable = `${table}_backup`;
  
  try {
    // 컬럼 목록 생성
    const columnList = columns.join(', ');
    
    // INSERT SELECT 쿼리 실행
    const query = `
      INSERT INTO ${backupTable} (backup_date, backup_timestamp, ${columnList})
      SELECT CURRENT_DATE, CURRENT_TIMESTAMP, ${columnList}
      FROM ${table}
    `;
    
    const [results, metadata] = await sequelize.query(query);
    
    const rowCount = metadata.rowCount || 0;
    console.log(`✅ ${table}: ${rowCount}건 백업 완료`);
    
    return { table, success: true, rowCount };
  } catch (error) {
    console.error(`❌ ${table} 백업 실패:`, error.message);
    return { table, success: false, error: error.message };
  }
}

/**
 * 모든 테이블 백업 실행
 */
async function backupAllTables() {
  console.log('====================================');
  console.log('일일 데이터베이스 백업 시작');
  console.log('시작 시간:', new Date().toLocaleString('ko-KR'));
  console.log('====================================\n');
  
  const results = [];
  let successCount = 0;
  let failCount = 0;
  let totalRows = 0;
  
  // 각 테이블 백업 실행
  for (const tableInfo of TABLES_TO_BACKUP) {
    const result = await backupTable(tableInfo);
    results.push(result);
    
    if (result.success) {
      successCount++;
      totalRows += result.rowCount;
    } else {
      failCount++;
    }
  }
  
  console.log('\n====================================');
  console.log('백업 완료 요약');
  console.log('====================================');
  console.log(`총 테이블 수: ${TABLES_TO_BACKUP.length}개`);
  console.log(`성공: ${successCount}개`);
  console.log(`실패: ${failCount}개`);
  console.log(`총 백업 레코드 수: ${totalRows}건`);
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
 * 메인 실행 함수
 */
async function main() {
  try {
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공\n');
    
    // 백업 실행
    const results = await backupAllTables();
    
    // 실패가 있으면 에러 코드 반환
    const hasFailures = results.some(r => !r.success);
    
    await sequelize.close();
    process.exit(hasFailures ? 1 : 0);
    
  } catch (error) {
    console.error('백업 실행 중 오류 발생:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// 스크립트 실행
main();

