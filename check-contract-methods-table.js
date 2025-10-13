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

async function checkTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    console.log('');
    
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'contract_methods' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 contract_methods 테이블 구조:');
    console.log('');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '[필수]' : '[선택]'}`);
    });
    console.log('');
    
    const [data] = await sequelize.query('SELECT * FROM contract_methods LIMIT 1;');
    if (data.length > 0) {
      console.log('📊 샘플 데이터 (첫 번째 행):');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️  테이블이 비어있습니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTable();

