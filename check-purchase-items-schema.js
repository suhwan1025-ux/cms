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

async function checkPurchaseItemsSchema() {
  try {
    await sequelize.authenticate();
    
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'purchase_items'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 purchase_items 테이블의 실제 컬럼:\n');
    columns.forEach((col, idx) => {
      console.log(`${(idx + 1).toString().padStart(2)}. ${col.column_name.padEnd(30)} ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ 오류:', error.message);
    await sequelize.close();
  }
}

checkPurchaseItemsSchema(); 