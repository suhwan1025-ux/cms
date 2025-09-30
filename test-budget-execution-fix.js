const { Sequelize } = require('sequelize');

// 데이터베이스 연결
const sequelize = new Sequelize(
  'contract_management',
  'postgres',
  'meritz123!',
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function testBudgetExecution() {
  try {
    console.log('=== 사업예산 집행금액 동기화 테스트 ===\n');

    // 1. 결재완료된 품의서 현황 확인
    console.log('1. 결재완료된 품의서 현황:');
    const approvedProposals = await sequelize.query(`
      SELECT 
        p.id,
        p.contract_type,
        p.total_amount,
        p.budget_id,
        bb.project_name,
        bb.budget_amount,
        bb.executed_amount
      FROM proposals p
      LEFT JOIN business_budgets bb ON p.budget_id = bb.id
      WHERE p.status = 'approved'
      ORDER BY p.id
    `);

    if (approvedProposals[0].length === 0) {
      console.log('   ❌ 결재완료된 품의서가 없습니다.\n');
    } else {
      approvedProposals[0].forEach(proposal => {
        console.log(`   - ID ${proposal.id}: ${proposal.contract_type} (${proposal.project_name || '예산미지정'})`);
        console.log(`     품의서 금액: ${parseFloat(proposal.total_amount || 0).toLocaleString()}원`);
        console.log(`     예산 금액: ${parseFloat(proposal.budget_amount || 0).toLocaleString()}원`);
        console.log(`     현재 집행 금액: ${parseFloat(proposal.executed_amount || 0).toLocaleString()}원\n`);
      });
    }

    // 2. 비용귀속부서 분배 현황 확인
    console.log('2. 비용귀속부서 분배 현황:');
    const costAllocations = await sequelize.query(`
      SELECT 
        p.id as proposal_id,
        p.contract_type,
        p.total_amount,
        p.budget_id,
        bb.project_name,
        COALESCE(SUM(cd.amount), 0) as total_dept_amount
      FROM proposals p
      LEFT JOIN business_budgets bb ON p.budget_id = bb.id
      LEFT JOIN cost_departments cd ON p.id = cd.proposal_id
      WHERE p.status = 'approved'
      GROUP BY p.id, p.contract_type, p.total_amount, p.budget_id, bb.project_name
      ORDER BY p.id
    `);

    if (costAllocations[0].length === 0) {
      console.log('   ❌ 비용귀속부서 분배 정보가 없습니다.\n');
    } else {
      costAllocations[0].forEach(allocation => {
        console.log(`   - 품의서 ID ${allocation.proposal_id}: ${allocation.contract_type} (${allocation.project_name || '예산미지정'})`);
        console.log(`     품의서 총액: ${parseFloat(allocation.total_amount || 0).toLocaleString()}원`);
        console.log(`     부서분배 총액: ${parseFloat(allocation.total_dept_amount || 0).toLocaleString()}원`);
        console.log(`     차이: ${parseFloat(allocation.total_amount - allocation.total_dept_amount).toLocaleString()}원\n`);
      });
    }

    // 3. 사업예산별 집행금액 계산
    console.log('3. 사업예산별 집행금액 계산:');
    const budgetExecutions = await sequelize.query(`
      SELECT 
        p.budget_id,
        bb.project_name,
        bb.budget_amount,
        bb.executed_amount,
        COUNT(p.id) as proposal_count,
        COALESCE(SUM(p.total_amount), 0) as total_proposal_amount,
        COALESCE(SUM(
          CASE 
            WHEN EXISTS (SELECT 1 FROM cost_departments cd WHERE cd.proposal_id = p.id) 
            THEN (SELECT COALESCE(SUM(cd.amount), 0) FROM cost_departments cd WHERE cd.proposal_id = p.id)
            ELSE p.total_amount
          END
        ), 0) as calculated_execution_amount
      FROM proposals p
      LEFT JOIN business_budgets bb ON p.budget_id = bb.id
      WHERE p.status = 'approved' AND p.budget_id IS NOT NULL
      GROUP BY p.budget_id, bb.project_name, bb.budget_amount, bb.executed_amount
      ORDER BY p.budget_id
    `);

    if (budgetExecutions[0].length === 0) {
      console.log('   ❌ 집행할 예산이 없습니다.\n');
    } else {
      budgetExecutions[0].forEach(budget => {
        console.log(`   - 예산 ID ${budget.budget_id}: ${budget.project_name}`);
        console.log(`     품의서 건수: ${budget.proposal_count}건`);
        console.log(`     품의서 총액: ${parseFloat(budget.total_proposal_amount || 0).toLocaleString()}원`);
        console.log(`     계산된 집행액: ${parseFloat(budget.calculated_execution_amount || 0).toLocaleString()}원`);
        console.log(`     현재 집행액: ${parseFloat(budget.executed_amount || 0).toLocaleString()}원`);
        console.log(`     차이: ${parseFloat(budget.calculated_execution_amount - (budget.executed_amount || 0)).toLocaleString()}원\n`);
      });
    }

    // 4. 수동으로 집행금액 동기화 실행
    console.log('4. 수동 집행금액 동기화 실행:');
    
    // 결재완료된 품의서들의 총 계약금액 조회
    const approvedProposalsForSync = await sequelize.query(`
      SELECT 
        p.id as proposal_id,
        p.total_amount as totalAmount,
        p.budget_id as budget_id,
        COALESCE(SUM(cd.amount), 0) as total_dept_amount
      FROM proposals p
      LEFT JOIN cost_departments cd ON p.id = cd.proposal_id
      WHERE p.status = 'approved'
      GROUP BY p.id, p.total_amount, p.budget_id
    `);

    const proposalData = approvedProposalsForSync[0] || [];
    
    // 사업예산별로 집행금액 계산
    const newBudgetExecutions = {};
    
    proposalData.forEach(proposal => {
      if (proposal.budget_id) {
        if (!newBudgetExecutions[proposal.budget_id]) {
          newBudgetExecutions[proposal.budget_id] = 0;
        }
        // 비용귀속부서 금액이 있으면 해당 금액을, 없으면 품의서 전체 금액을 사용
        const amount = proposal.total_dept_amount > 0 ? proposal.total_dept_amount : proposal.totalAmount;
        newBudgetExecutions[proposal.budget_id] += parseFloat(amount || 0);
      }
    });

    console.log('   계산된 집행금액:', newBudgetExecutions);

    // 각 사업예산의 집행금액 업데이트
    for (const [budgetId, executedAmount] of Object.entries(newBudgetExecutions)) {
      await sequelize.query(`
        UPDATE business_budgets 
        SET executed_amount = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, {
        replacements: [executedAmount, budgetId]
      });
      console.log(`   - 예산 ID ${budgetId}: ${parseFloat(executedAmount).toLocaleString()}원으로 업데이트`);
    }

    console.log('\n✅ 집행금액 동기화 완료!');

  } catch (error) {
    console.error('❌ 테스트 실행 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 테스트 실행
testBudgetExecution(); 