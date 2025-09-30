const { Sequelize } = require('sequelize');
const config = require('./config/database.js');

const sequelize = new Sequelize(config.development);

async function listTables() {
  try {
    const query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name";
    const tables = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('데이터베이스 테이블 목록:');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    await sequelize.close();
  }
}

listTables(); 