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

async function syncDatabase() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    console.log('🔄 모델 동기화 시작...');
    const models = require('./src/models');
    
    // 각 모델을 개별적으로 동기화
    console.log('📋 동기화할 모델들:');
    Object.keys(models).forEach(modelName => {
      if (modelName !== 'sequelize' && modelName !== 'Sequelize') {
        console.log(`   - ${modelName}`);
      }
    });
    
    // 전체 동기화
    await sequelize.sync({ force: true });
    console.log('✅ 모든 테이블 생성 완료!');
    
    // 초기 데이터 생성
    console.log('🌱 초기 데이터 생성 시작...');
    const { seedInitialData } = require('./src/database');
    await seedInitialData();
    
    console.log('✅ 데이터베이스 설정 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

syncDatabase(); 