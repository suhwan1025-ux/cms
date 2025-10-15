require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'contract_management',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'meritz123!',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function checkColumns() {
  try {
    await sequelize.authenticate();
    
    const tables = ['service_items', 'suppliers', 'project_purposes'];
    
    for (const table of tables) {
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = '${table}'
        ORDER BY ordinal_position;
      `);
      
      console.log(`\n📊 ${table} 테이블 컬럼:`);
      console.log('='.repeat(60));
      columns.forEach(col => {
        console.log(`  ${col.column_name.padEnd(30)} ${col.data_type}`);
      });
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ 오류:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

checkColumns();

