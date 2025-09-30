const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config/database.js').development;

const sequelize = new Sequelize(config.database, config.username, config.password, config);

async function fix2024ITBudget() {
  try {
    console.log('🔧 2024년 IT 시스템 구축 사업예산 초과 문제 해결...');
    
    // 1. 2024년 IT 시스템 구축 사업예산 현황 확인
    console.log('\\n1. 2024년 IT 시스템 구축 사업예산 현황 확인...');
    
    const itBudget = await sequelize.query(\
      SELECT 
        bb.id,
        bb.project_name,
        bb.budget_amount,
        bb.executed_amount,
        (bb.executed_amount - bb.budget_amount) as over_amount
      FROM business_budgets bb 
      WHERE bb.project_name LIKE '%IT 시스템 구축%' 
      AND bb.budget_year = 2024
    \, { type: Sequelize.QueryTypes.SELECT });
    
    if (itBudget.length === 0) {
      console.log('❌ 2024년 IT 시스템 구축 사업예산을 찾을 수 없습니다.');
      return;
    }
    
    const budget = itBudget[0];
    console.log(\사업명: \\);
    console.log(\예산: \원\);
    console.log(\집행: \원\);
    console.log(\초과: \원\);
    console.log(\예산ID: \\);
    
    if (budget.over_amount <= 0) {
      console.log('✅ 예산 초과가 없습니다.');
      return;
    }
    
    // 2. 해당 사업의 품의서들 확인
    console.log('\\n2. 해당 사업의 품의서들 확인...');
    
    const proposals = await sequelize.query(\
      SELECT 
        p.id,
        p.purpose,
        p.total_amount,
        p.created_by,
        p.proposal_date
      FROM proposals p 
      WHERE p.budget_id = \ 
      AND p.status = 'approved'
      ORDER BY p.total_amount DESC
    \, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(\\\n총 \건의 품의서가 있습니다:\);
    proposals.forEach((proposal, index) => {
      console.log(\\. \\);
      console.log(\   금액: \원\);
      console.log(\   작성자: \\);
      console.log(\   품의서ID: \\);
      console.log('');
    });
    
    // 3. 예산 초과를 해결하기 위해 품의서 삭제
    console.log('\\n3. 예산 초과를 해결하기 위해 품의서 삭제...');
    
    let totalToDelete = 0;
    const proposalsToDelete = [];
    
    // 예산 초과 금액만큼 품의서를 삭제
    for (const proposal of proposals) {
      if (totalToDelete >= budget.over_amount) {
        break;
      }
      proposalsToDelete.push(proposal);
      totalToDelete += parseInt(proposal.total_amount);
    }
    
    console.log(\\\n삭제할 품의서 \건:\);
    proposalsToDelete.forEach((proposal, index) => {
      console.log(\\. \ (\원)\);
    });
    
    console.log(\\\n총 삭제 예정 금액: \원\);
    console.log(\예산 초과 금액: \원\);
    
    // 4. 품의서 삭제 실행
    console.log('\\n4. 품의서 삭제 실행...');
    
    for (const proposal of proposalsToDelete) {
      console.log(\삭제 중: \ (\원)\);
      
      // 관련 구매품목 삭제
      await sequelize.query(\
        DELETE FROM purchase_items 
        WHERE proposal_id = \
      \);
      
      // 관련 용역항목 삭제
      await sequelize.query(\
        DELETE FROM service_items 
        WHERE proposal_id = \
      \);
      
      // 품의서 삭제
      await sequelize.query(\
        DELETE FROM proposals 
        WHERE id = \
      \);
      
      console.log(\✅ 삭제 완료: \\);
    }
    
    // 5. 삭제 후 현황 확인
    console.log('\\n5. 삭제 후 현황 확인...');
    
    const remainingProposals = await sequelize.query(\
      SELECT COUNT(*) as count
      FROM proposals p 
      WHERE p.budget_id = \ 
      AND p.status = 'approved'
    \, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(\✅ 남은 품의서: \건\);
    
    // 6. 최종 예산 현황 확인
    console.log('\\n6. 최종 예산 현황 확인...');
    
    const finalBudget = await sequelize.query(\
      SELECT 
        bb.project_name,
        bb.budget_amount,
        bb.executed_amount,
        (bb.executed_amount - bb.budget_amount) as over_amount
      FROM business_budgets bb 
      WHERE bb.id = \
    \, { type: Sequelize.QueryTypes.SELECT });
    
    const final = finalBudget[0];
    console.log(\\\n=== 최종 예산 현황 ===\);
    console.log(\사업명: \\);
    console.log(\예산: \원\);
    console.log(\집행: \원\);
    console.log(\초과: \원\);
    
    if (final.over_amount <= 0) {
      console.log('\\n🎉 예산 초과 문제가 해결되었습니다!');
    } else {
      console.log('\\n⚠️ 아직 예산 초과가 있습니다. 추가 삭제가 필요할 수 있습니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

fix2024ITBudget();
