const { Sequelize } = require('sequelize');
const config = require('../../config/database.js');

const sequelize = new Sequelize(config.development);

async function addNameColumn() {
  try {
    console.log('ServiceItems 테이블에 name 컬럼을 추가합니다...');
    
    // name 컬럼 추가
    await sequelize.query(`
      ALTER TABLE "ServiceItems" 
      ADD COLUMN IF NOT EXISTS "name" VARCHAR(255);
    `);
    
    console.log('✅ name 컬럼이 성공적으로 추가되었습니다.');
    
    // 컬럼 확인
    const columns = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ServiceItems' 
      ORDER BY ordinal_position;
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('\nServiceItems 테이블 컬럼 목록:');
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

addNameColumn(); 