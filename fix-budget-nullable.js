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

async function fixBudgetNullable() {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');
    
    await sequelize.query('ALTER TABLE proposals ALTER COLUMN budget_id DROP NOT NULL');
    console.log('✅ budget_id 컬럼을 nullable로 변경 완료');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await sequelize.close();
  }
}

fixBudgetNullable(); 