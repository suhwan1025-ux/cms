const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

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

// 간단한 테스트 모델
const TestModel = sequelize.define('TestModel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'test_models',
  timestamps: true
});

async function createSimpleTable() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    console.log('🔄 테스트 테이블 생성...');
    await TestModel.sync({ force: true });
    console.log('✅ 테스트 테이블 생성 완료!');
    
    console.log('📝 테스트 데이터 삽입...');
    await TestModel.create({
      name: '테스트 데이터'
    });
    console.log('✅ 테스트 데이터 삽입 완료!');
    
    console.log('📋 테이블 목록 확인...');
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📁 발견된 테이블들:');
    results.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

createSimpleTable(); 