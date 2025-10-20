const { Sequelize, DataTypes } = require('sequelize');
const config = require('../../config/database.js').development;

const sequelize = new Sequelize(config.database, config.username, config.password, config);

async function cleanupITBudgetProposals() {
  try {
    console.log('🧹 2024년 IT 시스템 구축 사업예산 품의서 정리 시작...');
    
    // 1. 2024년 IT 시스템 구축 사업예산 찾기
    console.log('\n1. 2024년 IT 시스템 구축 사업예산 확인...');
    
    const itBudgetResult = await sequelize.query(`
      SELECT id, project_name, budget_amount, executed_amount
      FROM business_budgets 
      WHERE project_name LIKE '%IT 시스템 구축%' 
      AND budget_year = 2024
    `, { type: Sequelize.QueryTypes.SELECT });
    
    if (itBudgetResult.length === 0) {
      console.log('❌ 2024년 IT 시스템 구축 사업예산을 찾을 수 없습니다.');
      return;
    }
    
    const itBudget = itBudgetResult[0];
    console.log(`찾은 사업예산: ${itBudget.project_name} (ID: ${itBudget.id})`);
    console.log(`예산: ${parseInt(itBudget.budget_amount).toLocaleString()}원`);
    console.log(`집행: ${parseInt(itBudget.executed_amount).toLocaleString()}원`);
    
    // 2. 해당 사업예산의 품의서들 확인
    console.log('\n2. 해당 사업예산의 품의서들 확인...');
    
    const proposals = await sequelize.query(`
      SELECT 
        p.id,
        p.purpose,
        p.total_amount,
        p.created_by,
        p.status,
        p.created_at
      FROM proposals p 
      WHERE p.budget_id = ${itBudget.id}
      ORDER BY p.created_at ASC
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`\n총 ${proposals.length}건의 품의서가 있습니다:`);
    proposals.forEach((proposal, index) => {
      console.log(`${index + 1}. ${proposal.purpose}`);
      console.log(`   금액: ${parseInt(proposal.total_amount).toLocaleString()}원`);
      console.log(`   상태: ${proposal.status}`);
      console.log(`   작성자: ${proposal.created_by}`);
      console.log(`   ID: ${proposal.id}`);
      console.log('');
    });
    
    if (proposals.length <= 5) {
      console.log('✅ 품의서가 5개 이하입니다. 삭제할 필요가 없습니다.');
      return;
    }
    
    // 3. 최근 5개만 남기고 나머지 삭제 (생성일 기준)
    const proposalsToKeep = proposals.slice(-5); // 최근 5개
    const proposalsToDelete = proposals.slice(0, -5); // 나머지
    
    console.log('\n3. 삭제할 품의서들:');
    proposalsToDelete.forEach((proposal, index) => {
      console.log(`${index + 1}. ${proposal.purpose} (ID: ${proposal.id})`);
    });
    
    console.log('\n4. 남길 품의서들:');
    proposalsToKeep.forEach((proposal, index) => {
      console.log(`${index + 1}. ${proposal.purpose} (ID: ${proposal.id})`);
    });
    
    // 4. 삭제 실행
    console.log(`\n5. ${proposalsToDelete.length}개 품의서 삭제 실행...`);
    
    for (const proposal of proposalsToDelete) {
      console.log(`삭제 중: ${proposal.purpose} (ID: ${proposal.id})`);
      
      // 외래키 제약 조건을 고려한 순서로 삭제
      
      // 1. cost_departments에서 purchase_item_id, service_item_id 참조 제거
      await sequelize.query(`
        DELETE FROM cost_departments 
        WHERE proposal_id = ${proposal.id}
      `);
      
      // 2. 관련 결재라인 삭제
      await sequelize.query(`
        DELETE FROM approval_lines 
        WHERE proposal_id = ${proposal.id}
      `);
      
      // 3. 관련 신청부서 삭제
      await sequelize.query(`
        DELETE FROM request_departments 
        WHERE proposal_id = ${proposal.id}
      `);
      
      // 4. 구매품목 삭제
      await sequelize.query(`
        DELETE FROM purchase_items 
        WHERE proposal_id = ${proposal.id}
      `);
      
      // 5. 용역항목 삭제
      await sequelize.query(`
        DELETE FROM service_items 
        WHERE proposal_id = ${proposal.id}
      `);
      
      // 6. 품의서 삭제
      await sequelize.query(`
        DELETE FROM proposals 
        WHERE id = ${proposal.id}
      `);
      
      console.log(`✅ 삭제 완료: ${proposal.purpose}`);
    }
    
    // 5. 삭제 후 현황 확인
    console.log('\n6. 삭제 후 현황 확인...');
    
    const remainingProposals = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM proposals p 
      WHERE p.budget_id = ${itBudget.id}
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`✅ 2024년 IT 시스템 구축 사업예산 남은 품의서: ${remainingProposals[0].count}건`);
    
    // 6. 최종 품의서 목록 확인
    console.log('\n7. 최종 남은 품의서 목록:');
    
    const finalProposals = await sequelize.query(`
      SELECT 
        p.id,
        p.purpose,
        p.total_amount,
        p.created_by,
        p.status
      FROM proposals p 
      WHERE p.budget_id = ${itBudget.id}
      ORDER BY p.created_at ASC
    `, { type: Sequelize.QueryTypes.SELECT });
    
    finalProposals.forEach((proposal, index) => {
      console.log(`${index + 1}. ${proposal.purpose}`);
      console.log(`   금액: ${parseInt(proposal.total_amount).toLocaleString()}원`);
      console.log(`   상태: ${proposal.status}`);
      console.log(`   작성자: ${proposal.created_by}`);
      console.log(`   ID: ${proposal.id}`);
      console.log('');
    });
    
    // 7. 다른 사업예산 품의서 현황 확인
    console.log('\n8. 다른 사업예산 품의서 현황 (확인용):');
    
    const otherBudgetProposals = await sequelize.query(`
      SELECT 
        bb.project_name,
        COUNT(p.id) as proposal_count
      FROM business_budgets bb
      LEFT JOIN proposals p ON bb.id = p.budget_id
      WHERE bb.budget_year = 2024 
      AND bb.id != ${itBudget.id}
      GROUP BY bb.id, bb.project_name
      ORDER BY bb.project_name
    `, { type: Sequelize.QueryTypes.SELECT });
    
    otherBudgetProposals.forEach(budget => {
      console.log(`- ${budget.project_name}: ${budget.proposal_count}건`);
    });
    
    console.log('\n🎉 2024년 IT 시스템 구축 사업예산 품의서 정리 완료!');
    console.log('📋 다른 사업예산의 품의서들은 그대로 유지되었습니다.');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

cleanupITBudgetProposals();
