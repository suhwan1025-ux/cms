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
    logging: console.log
  }
);

async function createTables() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 모델 로드
    console.log('📋 모델 로드 중...');
    const models = require('./src/models');
    console.log('✅ 모델 로드 완료!');
    
    // 테이블 생성
    console.log('🔄 테이블 생성 시작...');
    await sequelize.sync({ force: true });
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

createTables(); 