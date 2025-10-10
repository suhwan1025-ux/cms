const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'contract_management',
  process.env.DB_USERNAME || 'postgres',
  process.env.DB_PASSWORD || 'meritz123!',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function createCompleteTables() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    console.log('\n⚠️  경고: 기존 테이블을 모두 삭제하고 재생성합니다!');
    console.log('⚠️  모든 데이터가 삭제됩니다!\n');
    
    // 외래키 제약조건 순서대로 테이블 삭제
    console.log('🗑️  기존 테이블 삭제 중...');
    const tables = [
      'proposal_histories',
      'approval_rules',
      'approval_references',
      'approval_conditions',
      'approval_approvers',
      'approval_lines',
      'contracts',
      'service_items',
      'purchase_item_cost_allocations',
      'purchase_items',
      'request_departments',
      'cost_departments',
      'proposals',
      'business_budget_approvals',
      'business_budget_details',
      'business_budgets',
      'contract_methods',
      'budgets',
      'suppliers',
      'departments'
    ];
    
    for (const table of tables) {
      await sequelize.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
      console.log(`   ✓ ${table} 삭제됨`);
    }
    
    console.log('✅ 모든 테이블 삭제 완료\n');
    console.log('🔄 Sequelize 모델과 일치하는 모든 테이블 생성 시작...');
    
    // 1. 부서 테이블
    await sequelize.query(`
      CREATE TABLE departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        code VARCHAR(50) UNIQUE,
        parent_id INTEGER REFERENCES departments(id),
        manager VARCHAR(255),
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ departments 테이블 생성 완료');
    
    // 2. 공급업체 테이블
    await sequelize.query(`
      CREATE TABLE suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        business_number VARCHAR(50) UNIQUE,
        representative VARCHAR(255),
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        credit_rating VARCHAR(10),
        business_type VARCHAR(255),
        registration_date DATE,
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ suppliers 테이블 생성 완료');
    
    // 3. 예산 테이블 (type 컬럼 추가!)
    await sequelize.query(`
      CREATE TABLE budgets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        type VARCHAR(20) DEFAULT 'general',
        total_amount DECIMAL(15,2) NOT NULL,
        used_amount DECIMAL(15,2) DEFAULT 0,
        remaining_amount DECIMAL(15,2),
        department VARCHAR(255),
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ budgets 테이블 생성 완료');
    
    // 4. 사업예산 테이블
    await sequelize.query(`
      CREATE TABLE business_budgets (
        id SERIAL PRIMARY KEY,
        project_name VARCHAR(255) NOT NULL,
        initiator_department VARCHAR(100) NOT NULL,
        executor_department VARCHAR(100) NOT NULL,
        budget_type VARCHAR(50) NOT NULL,
        budget_category VARCHAR(100) NOT NULL,
        budget_amount DECIMAL(15,2) NOT NULL,
        executed_amount DECIMAL(15,2) DEFAULT 0,
        pending_amount DECIMAL(15,2) DEFAULT 0,
        confirmed_execution_amount DECIMAL(15,2) DEFAULT 0,
        unexecuted_amount DECIMAL(15,2) DEFAULT 0,
        additional_budget DECIMAL(15,2) DEFAULT 0,
        start_date VARCHAR(7) NOT NULL,
        end_date VARCHAR(7) NOT NULL,
        is_essential BOOLEAN DEFAULT false,
        project_purpose VARCHAR(10) NOT NULL,
        budget_year INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT '승인대기',
        hold_cancel_reason TEXT,
        notes TEXT,
        it_plan_reported BOOLEAN DEFAULT FALSE,
        created_by VARCHAR(100) DEFAULT '작성자',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ business_budgets 테이블 생성 완료');
    
    // 5. 사업예산 상세 테이블
    await sequelize.query(`
      CREATE TABLE business_budget_details (
        id SERIAL PRIMARY KEY,
        budget_id INTEGER REFERENCES business_budgets(id) ON DELETE CASCADE,
        item_name VARCHAR(255) NOT NULL,
        item_description TEXT,
        unit_price DECIMAL(15,2) NOT NULL,
        quantity INTEGER NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        executed_amount DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ business_budget_details 테이블 생성 완료');
    
    // 6. 사업예산 승인 이력 테이블
    await sequelize.query(`
      CREATE TABLE business_budget_approvals (
        id SERIAL PRIMARY KEY,
        budget_id INTEGER REFERENCES business_budgets(id) ON DELETE CASCADE,
        approver_name VARCHAR(100) NOT NULL,
        approver_title VARCHAR(100) NOT NULL,
        approval_status VARCHAR(20) NOT NULL,
        approval_comment TEXT,
        approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ business_budget_approvals 테이블 생성 완료');
    
    // 6-1. 사업예산 변경이력 테이블
    await sequelize.query(`
      CREATE TABLE business_budget_history (
        id SERIAL PRIMARY KEY,
        budget_id INTEGER NOT NULL REFERENCES business_budgets(id) ON DELETE CASCADE,
        change_type VARCHAR(20) NOT NULL,
        changed_field VARCHAR(100),
        old_value TEXT,
        new_value TEXT,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        changed_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ business_budget_history 테이블 생성 완료');
    
    // 7. 계약방식 테이블
    await sequelize.query(`
      CREATE TABLE contract_methods (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        value VARCHAR(255),
        description TEXT,
        basis TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ contract_methods 테이블 생성 완료');
    
    // 8. 품의서 테이블 (전체 컬럼!)
    await sequelize.query(`
      CREATE TABLE proposals (
        id SERIAL PRIMARY KEY,
        contract_type VARCHAR(50) NOT NULL,
        title VARCHAR(500),
        purpose TEXT NOT NULL,
        basis TEXT NOT NULL,
        budget_id INTEGER,
        contract_method VARCHAR(50),
        contract_method_id INTEGER,
        account_subject VARCHAR(255),
        total_amount DECIMAL(15,2) DEFAULT 0,
        change_reason TEXT,
        extension_reason TEXT,
        contract_period VARCHAR(255),
        contract_start_date DATE,
        contract_end_date DATE,
        payment_method VARCHAR(50),
        status VARCHAR(50) DEFAULT 'draft',
        created_by VARCHAR(255),
        proposal_date DATE,
        approval_date DATE,
        is_draft BOOLEAN DEFAULT false,
        wysiwyg_content TEXT,
        other TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ proposals 테이블 생성 완료 (전체 컬럼)');
    
    // 6. 요청부서 테이블
    await sequelize.query(`
      CREATE TABLE request_departments (
        id SERIAL PRIMARY KEY,
        proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
        department_id INTEGER REFERENCES departments(id),
        department VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        code VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ request_departments 테이블 생성 완료');
    
    // 7. 구매품목 테이블 (계약기간 컬럼 추가!)
    await sequelize.query(`
      CREATE TABLE purchase_items (
        id SERIAL PRIMARY KEY,
        proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
        supplier_id INTEGER REFERENCES suppliers(id),
        item VARCHAR(255) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(15,2) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        supplier VARCHAR(255) NOT NULL,
        request_department VARCHAR(255),
        contract_period_type VARCHAR(50) DEFAULT 'permanent',
        custom_contract_period TEXT,
        contract_start_date DATE,
        contract_end_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ purchase_items 테이블 생성 완료');
    
    // 8. 용역항목 테이블 (name 컬럼 추가!)
    await sequelize.query(`
      CREATE TABLE service_items (
        id SERIAL PRIMARY KEY,
        proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
        supplier_id INTEGER REFERENCES suppliers(id),
        item VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        personnel INTEGER NOT NULL DEFAULT 1,
        skill_level VARCHAR(50),
        period INTEGER NOT NULL,
        monthly_rate DECIMAL(15,2) NOT NULL,
        contract_amount DECIMAL(15,2) NOT NULL,
        supplier VARCHAR(255) NOT NULL,
        credit_rating VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ service_items 테이블 생성 완료');
    
    // 9. 비용귀속부서 테이블 (구매품목별 배분 컬럼 추가!)
    await sequelize.query(`
      CREATE TABLE cost_departments (
        id SERIAL PRIMARY KEY,
        proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
        department_id INTEGER REFERENCES departments(id),
        department VARCHAR(255) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        ratio DECIMAL(5,2) DEFAULT 0,
        purchase_item_id INTEGER REFERENCES purchase_items(id) ON DELETE CASCADE,
        allocation_type VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ cost_departments 테이블 생성 완료');
    
    // 10. 구매품목 비용배분 테이블
    await sequelize.query(`
      CREATE TABLE purchase_item_cost_allocations (
        id SERIAL PRIMARY KEY,
        purchase_item_id INTEGER NOT NULL REFERENCES purchase_items(id) ON DELETE CASCADE,
        department_id INTEGER REFERENCES departments(id),
        department VARCHAR(255) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        ratio DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ purchase_item_cost_allocations 테이블 생성 완료');
    
    // 11. 결재라인 테이블
    await sequelize.query(`
      CREATE TABLE approval_lines (
        id SERIAL PRIMARY KEY,
        proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
        step INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        is_conditional BOOLEAN DEFAULT false,
        is_final BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'pending',
        approved_at TIMESTAMP WITH TIME ZONE,
        approved_by VARCHAR(255),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ approval_lines 테이블 생성 완료');
    
    // 12. 계약 테이블
    await sequelize.query(`
      CREATE TABLE contracts (
        id SERIAL PRIMARY KEY,
        proposal_id INTEGER NOT NULL REFERENCES proposals(id),
        contract_number VARCHAR(255) NOT NULL UNIQUE,
        contract_type VARCHAR(50) NOT NULL,
        supplier_id INTEGER REFERENCES suppliers(id),
        contract_amount DECIMAL(15,2) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        payment_method VARCHAR(50),
        status VARCHAR(50) DEFAULT 'draft',
        description TEXT,
        attachments JSON,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ contracts 테이블 생성 완료');
    
    // 13. 품의서 변경이력 테이블
    await sequelize.query(`
      CREATE TABLE proposal_histories (
        id SERIAL PRIMARY KEY,
        proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
        changed_by VARCHAR(255) NOT NULL,
        changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        change_type VARCHAR(50) NOT NULL,
        field_name VARCHAR(255),
        old_value TEXT,
        new_value TEXT,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ proposal_histories 테이블 생성 완료');
    
    // 14-17. 결재 참조 테이블들
    await sequelize.query(`
      CREATE TABLE approval_approvers (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        basis TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ approval_approvers 테이블 생성 완료');
    
    await sequelize.query(`
      CREATE TABLE approval_conditions (
        id SERIAL PRIMARY KEY,
        approver_id INTEGER NOT NULL REFERENCES approval_approvers(id) ON DELETE CASCADE,
        condition_type VARCHAR(50) NOT NULL,
        condition_value VARCHAR(255) NOT NULL,
        condition_label VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ approval_conditions 테이블 생성 완료');
    
    await sequelize.query(`
      CREATE TABLE approval_rules (
        id SERIAL PRIMARY KEY,
        rule_type VARCHAR(50) NOT NULL,
        rule_name VARCHAR(255) NOT NULL,
        rule_content TEXT NOT NULL,
        basis TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ approval_rules 테이블 생성 완료');
    
    await sequelize.query(`
      CREATE TABLE approval_references (
        id SERIAL PRIMARY KEY,
        amount_range VARCHAR(255) NOT NULL,
        min_amount DECIMAL(15,2),
        max_amount DECIMAL(15,2),
        included_approvers TEXT NOT NULL,
        final_approver VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ approval_references 테이블 생성 완료');
    
    console.log('='.repeat(60));
    console.log('✅ 모든 테이블 생성 완료! (Sequelize 모델과 100% 일치)');
    console.log('='.repeat(60));
    
    // 생성된 테이블 확인
    console.log('📋 생성된 테이블 확인...');
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log(`\n📁 총 ${results.length}개 테이블 생성됨:`);
    results.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  createCompleteTables();
}

module.exports = { createCompleteTables }; 