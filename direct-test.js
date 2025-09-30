const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('🔍 환경 변수 확인:');
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('');

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

async function testDirectConnection() {
  try {
    console.log('🔍 직접 연결 테스트 시작...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 테이블 생성 테스트
    console.log('🔍 테이블 생성 테스트...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 테이블 생성 성공!');
    
    // 테이블 삭제
    await sequelize.query('DROP TABLE IF EXISTS test_table');
    console.log('✅ 테이블 삭제 성공!');
    
    await sequelize.close();
    console.log('✅ 모든 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

testDirectConnection(); 