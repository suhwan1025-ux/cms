const { Sequelize } = require('sequelize');
const config = require('./config/database');

// 데이터베이스 연결 설정
const dbConfig = config.development;
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: console.log
});

async function debugCostDepartments() {
  try {
    console.log('🔍 비용분배 데이터베이스 테이블 확인...\n');
    
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');
    
    // cost_departments 테이블 조회
    console.log('=== cost_departments 테이블 조회 ===');
    const [costDepartments] = await sequelize.query(`
      SELECT * FROM cost_departments 
      ORDER BY proposal_id, purchase_item_id, id
    `);
    
    console.log(`총 비용분배 레코드 수: ${costDepartments.length}`);
    
    if (costDepartments.length > 0) {
      console.log('\n비용분배 데이터 샘플:');
      costDepartments.slice(0, 10).forEach((dept, index) => {
        console.log(`${index + 1}. 품의서ID: ${dept.proposal_id}, 구매품목ID: ${dept.purchase_item_id}, 부서: ${dept.department}, 비율: ${dept.ratio}%, 금액: ${dept.amount}`);
      });
    }
    
    // 특정 품의서의 비용분배 정보 조회
    console.log('\n=== 품의서별 비용분배 정보 ===');
    const [proposalCosts] = await sequelize.query(`
      SELECT 
        p.id as proposal_id,
        p.purpose,
        cd.purchase_item_id,
        pi.item as item_name,
        cd.department,
        cd.ratio,
        cd.amount,
        cd.allocation_type
      FROM proposals p
      LEFT JOIN cost_departments cd ON p.id = cd.proposal_id
      LEFT JOIN purchase_items pi ON cd.purchase_item_id = pi.id
      WHERE cd.id IS NOT NULL
      ORDER BY p.id, cd.purchase_item_id
    `);
    
    console.log(`비용분배가 있는 품의서 수: ${proposalCosts.length}`);
    
    if (proposalCosts.length > 0) {
      const groupedByProposal = {};
      proposalCosts.forEach(cost => {
        if (!groupedByProposal[cost.proposal_id]) {
          groupedByProposal[cost.proposal_id] = {
            purpose: cost.purpose,
            items: {}
          };
        }
        if (!groupedByProposal[cost.proposal_id].items[cost.purchase_item_id]) {
          groupedByProposal[cost.proposal_id].items[cost.purchase_item_id] = {
            itemName: cost.item_name,
            allocations: []
          };
        }
        groupedByProposal[cost.proposal_id].items[cost.purchase_item_id].allocations.push({
          department: cost.department,
          ratio: cost.ratio,
          amount: cost.amount,
          type: cost.allocation_type
        });
      });
      
      console.log('\n품의서별 비용분배 상세:');
      Object.entries(groupedByProposal).forEach(([proposalId, data]) => {
        console.log(`\n품의서 ${proposalId}: ${data.purpose}`);
        Object.entries(data.items).forEach(([itemId, itemData]) => {
          console.log(`  구매품목 ${itemId} (${itemData.itemName}):`);
          itemData.allocations.forEach((alloc, index) => {
            console.log(`    ${index + 1}. ${alloc.department}: ${alloc.ratio}% (${alloc.amount}원)`);
          });
        });
      });
    }
    
    console.log('\n✅ 비용분배 데이터베이스 확인 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  debugCostDepartments();
}

module.exports = debugCostDepartments; 