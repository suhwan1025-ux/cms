const { Sequelize } = require('sequelize');
const config = require('./config/database.js');

const sequelize = new Sequelize(config.development);

async function checkTables() {
  try {
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('데이터베이스 테이블 목록:');
    tables.forEach(table => console.log('-', table.table_name));
    
    // ServiceItems 테이블이 있는지 확인
    const serviceItemsExists = tables.find(t => t.table_name.toLowerCase() === 'serviceitems');
    if (serviceItemsExists) {
      console.log('\nServiceItems 테이블이 존재합니다.');
      
      // 컬럼 정보 확인
      const columns = await sequelize.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ServiceItems' ORDER BY ordinal_position;",
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      console.log('ServiceItems 테이블 컬럼:');
      columns.forEach(col => console.log('-', col.column_name, ':', col.data_type));
    } else {
      console.log('\nServiceItems 테이블이 존재하지 않습니다.');
    }
    
  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
  }
}

checkTables(); 