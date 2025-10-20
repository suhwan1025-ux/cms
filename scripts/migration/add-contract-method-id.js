const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'meritz123!',
  database: process.env.DB_NAME || 'contract_management',
  logging: false
});

async function addContractMethodId() {
  try {
    console.log('🔧 contract_method_id 칼럼 추가 중...');
    
    // contract_method_id 칼럼 추가
    await sequelize.query(`
      ALTER TABLE proposals 
      ADD COLUMN IF NOT EXISTS contract_method_id INTEGER NULL
    `);
    
    console.log('✅ contract_method_id 칼럼 추가 완료!');
    
    // 테이블 구조 확인
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'proposals' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 proposals 테이블 구조:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
  } catch (error) {
    console.error('❌ 칼럼 추가 실패:', error.message);
  } finally {
    await sequelize.close();
  }
}

addContractMethodId(); 