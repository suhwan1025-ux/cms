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

async function createAllTables() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    console.log('🔄 모든 테이블 생성 시작...');
    
    // 부서 테이블
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS departments (
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
    
    // 공급업체 테이블
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
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
    
    // 예산 테이블
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
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
    
    // 품의서 테이블
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS proposals (
        id SERIAL PRIMARY KEY,
        contract_type VARCHAR(50) NOT NULL,
        purpose TEXT NOT NULL,
        basis TEXT NOT NULL,
        budget_id INTEGER,
        contract_method VARCHAR(50),
        account_subject VARCHAR(255),
        total_amount DECIMAL(15,2) DEFAULT 0,
        change_reason TEXT,
        extension_reason TEXT,
        contract_period VARCHAR(255),
        payment_method VARCHAR(50),
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ proposals 테이블 생성 완료');
    
    // 구매품목 테이블
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS purchase_items (
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ purchase_items 테이블 생성 완료');
    
    // 용역항목 테이블
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS service_items (
        id SERIAL PRIMARY KEY,
        proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
        supplier_id INTEGER REFERENCES suppliers(id),
        item VARCHAR(255) NOT NULL,
        personnel INTEGER NOT NULL,
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
    
    // 비용귀속부서 테이블
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS cost_departments (
        id SERIAL PRIMARY KEY,
        proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
        department_id INTEGER REFERENCES departments(id),
        department VARCHAR(255) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        ratio DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ cost_departments 테이블 생성 완료');
    
    // 결재라인 테이블
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS approval_lines (
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
    
    // 계약 테이블
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS contracts (
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
    
    console.log('✅ 모든 테이블 생성 완료!');
    
    // 생성된 테이블 확인
    console.log('📋 생성된 테이블 확인...');
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📁 생성된 테이블들:');
    results.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

createAllTables(); 