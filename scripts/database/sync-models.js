const { Sequelize, DataTypes } = require('sequelize');
const config = require('../../config/database.js');

const sequelize = new Sequelize(config.development);

// 모델 로드
const ServiceItem = require('../../src/models/ServiceItem')(sequelize, DataTypes);

async function syncModels() {
  try {
    console.log('데이터베이스 모델 동기화 시작...');
    
    // ServiceItem 모델 동기화 (alter: true로 기존 테이블 수정)
    await ServiceItem.sync({ alter: true });
    
    console.log('✅ ServiceItem 모델 동기화 완료');
    
    // 테이블 구조 확인
    const tableInfo = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ServiceItems' ORDER BY ordinal_position",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📊 ServiceItems 테이블 구조:');
    tableInfo.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

syncModels(); 