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

async function createApprovalReferenceTables() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');

    // 1. 결재자 마스터 테이블 생성
    console.log('🔄 결재자 마스터 테이블 생성...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS approval_approvers (
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

    // 2. 결재자 조건 테이블 생성
    console.log('🔄 결재자 조건 테이블 생성...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS approval_conditions (
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

    // 3. 결재라인 규칙 테이블 생성
    console.log('🔄 결재라인 규칙 테이블 생성...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS approval_rules (
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

    // 4. 결재라인 참고자료 테이블 생성
    console.log('🔄 결재라인 참고자료 테이블 생성...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS approval_references (
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

    console.log('✅ 결재라인 참조 테이블 생성 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

createApprovalReferenceTables(); 