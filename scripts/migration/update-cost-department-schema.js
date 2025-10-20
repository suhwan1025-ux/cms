const models = require('../../src/models');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function updateCostDepartmentSchema() {
  try {
    console.log('=== CostDepartment 스키마 업데이트 시작 ===');
    
    // purchaseItemId 컬럼 추가
    await models.sequelize.query(`
      ALTER TABLE cost_departments 
      ADD COLUMN IF NOT EXISTS purchase_item_id INTEGER REFERENCES purchase_items(id)
    `);
    console.log('✅ purchase_item_id 컬럼 추가 완료');
    
    // allocation_type 컬럼 추가
    await models.sequelize.query(`
      ALTER TABLE cost_departments 
      ADD COLUMN IF NOT EXISTS allocation_type VARCHAR(20)
    `);
    console.log('✅ allocation_type 컬럼 추가 완료');
    
    console.log('✅ CostDepartment 스키마 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ 스키마 업데이트 오류:', error);
  } finally {
    await models.sequelize.close();
  }
}

updateCostDepartmentSchema(); 