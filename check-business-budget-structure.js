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

async function checkBusinessBudgetStructure() {
  try {
    console.log('🔍 business_budget 테이블 구조 확인...\n');
    await sequelize.authenticate();
    
    const tables = ['business_budgets', 'business_budget_details', 'business_budget_approvals'];
    
    for (const tableName of tables) {
      console.log('='.repeat(80));
      console.log(`📋 테이블: ${tableName}`);
      console.log('='.repeat(80));
      
      const [columns] = await sequelize.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
        ORDER BY ordinal_position;
      `);
      
      console.log(`\n✅ 실제 DB 컬럼 (${columns.length}개):\n`);
      columns.forEach((col, idx) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const maxLen = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default.substring(0, 30)}` : '';
        console.log(`   ${(idx + 1).toString().padStart(2)}. ${col.column_name.padEnd(30)} ${col.data_type}${maxLen.padEnd(10)} ${nullable}${defaultVal}`);
      });
      
      // 레코드 수 확인
      const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`\n📊 레코드 수: ${countResult[0].count}개\n`);
    }
    
    console.log('='.repeat(80));
    console.log('🎯 확인 완료!\n');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  checkBusinessBudgetStructure();
}

module.exports = { checkBusinessBudgetStructure }; 