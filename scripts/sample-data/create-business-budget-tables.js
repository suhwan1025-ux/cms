const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

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

async function createBusinessBudgetTables() {
  try {
    console.log('🔧 사업예산 관리 테이블 생성 중...');

    // 사업예산 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS business_budgets (
        id SERIAL PRIMARY KEY,
        project_name VARCHAR(255) NOT NULL,
        initiator_department VARCHAR(100) NOT NULL,
        executor_department VARCHAR(100) NOT NULL,
        budget_type VARCHAR(50) NOT NULL,
        budget_category VARCHAR(100) NOT NULL,
        budget_amount DECIMAL(15,2) NOT NULL,
        executed_amount DECIMAL(15,2) DEFAULT 0,
        start_date VARCHAR(7) NOT NULL,
        end_date VARCHAR(7) NOT NULL,
        is_essential BOOLEAN DEFAULT false,
        project_purpose VARCHAR(10) NOT NULL,
        budget_year INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT '승인대기',
        created_by VARCHAR(100) DEFAULT '작성자',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 사업예산 상세 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS business_budget_details (
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
      )
    `);

    // 사업예산 승인 이력 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS business_budget_approvals (
        id SERIAL PRIMARY KEY,
        budget_id INTEGER REFERENCES business_budgets(id) ON DELETE CASCADE,
        approver_name VARCHAR(100) NOT NULL,
        approver_title VARCHAR(100) NOT NULL,
        approval_status VARCHAR(20) NOT NULL,
        approval_comment TEXT,
        approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ 사업예산 관리 테이블 생성 완료!');

    // 테이블 구조 확인
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'business_budget%'
      ORDER BY table_name
    `);
    
    console.log('📋 생성된 테이블:', tables[0].map(t => t.table_name));

  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error.message);
  } finally {
    await sequelize.close();
  }
}

createBusinessBudgetTables(); 