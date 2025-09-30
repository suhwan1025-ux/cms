const { Sequelize } = require('sequelize');
const config = require('./config/database.js');

const sequelize = new Sequelize(config.development);

async function checkTables() {
  try {
    console.log('데이터베이스 테이블 목록 조회 중...\n');
    
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('📋 데이터베이스 테이블 목록:');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    
    // ServiceItems와 유사한 테이블 찾기
    const serviceTable = tables.find(t => 
      t.table_name.toLowerCase().includes('service')
    );
    
    if (serviceTable) {
      console.log(`\n🔍 Service 관련 테이블 발견: ${serviceTable.table_name}`);
      
      // 해당 테이블의 컬럼 정보 확인
      const columns = await sequelize.query(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns 
         WHERE table_name = $1 
         ORDER BY ordinal_position;`,
        { 
          bind: [serviceTable.table_name],
          type: Sequelize.QueryTypes.SELECT 
        }
      );
      
      console.log(`\n📊 ${serviceTable.table_name} 테이블 컬럼:');
      columns.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL 허용' : 'NOT NULL'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTables(); 