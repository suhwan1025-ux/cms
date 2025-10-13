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
    
    // 테이블 존재 확인
    const [exists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'proposal_histories'
      );
    `);
    
    if (!exists[0].exists) {
      console.log('❌ proposal_histories 테이블이 존재하지 않습니다.');
      console.log('테이블을 생성해야 합니다.');
      return;
    }
    
    console.log('✅ proposal_histories 테이블 존재');
    console.log('');
    
    // 컬럼 확인
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'proposal_histories' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 proposal_histories 테이블 컬럼:');
    console.log('');
    columns.forEach(c => {
      console.log(`  - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'NO' ? '[필수]' : '[선택]'}`);
    });
    console.log('');
    
    // 데이터 개수 확인
    const [count] = await sequelize.query('SELECT COUNT(*) as count FROM proposal_histories;');
    console.log(`📊 현재 히스토리 레코드 수: ${count[0].count}개`);
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTable();

