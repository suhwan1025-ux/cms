const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

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

async function updateBudgetExecutionAmount() {
  try {
    console.log('🔄 확정집행액 동기화 시작...\n');
    
    // 결재완료된 품의서들의 총 계약금액 조회
    const approvedProposals = await sequelize.query(`
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

    const proposalData = approvedProposals[0] || [];
    
    console.log(`📋 결재완료된 품의서: ${proposalData.length}건\n`);
    
    // 사업예산별로 집행금액 계산
    const budgetExecutions = {};
    
    proposalData.forEach(proposal => {
      if (proposal.budget_id) {
        if (!budgetExecutions[proposal.budget_id]) {
          budgetExecutions[proposal.budget_id] = 0;
        }
        // 비용귀속부서 금액이 품의서 총액과 일치하는지 검증
        let amount;
        if (proposal.total_dept_amount > 0 && Math.abs(proposal.total_dept_amount - proposal.totalAmount) < 100) {
          amount = proposal.total_dept_amount;
        } else {
          amount = proposal.totalAmount;
        }
        budgetExecutions[proposal.budget_id] += parseFloat(amount || 0);
      }
    });

    console.log('💰 사업예산별 확정집행액:');
    for (const [budgetId, amount] of Object.entries(budgetExecutions)) {
      console.log(`   예산 ID ${budgetId}: ${(amount / 100000000).toFixed(2)}억원`);
    }
    console.log('');

    // 각 사업예산의 확정집행액 업데이트
    for (const [budgetId, confirmedAmount] of Object.entries(budgetExecutions)) {
      await sequelize.query(`
        UPDATE business_budgets 
        SET 
          confirmed_execution_amount = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, {
        replacements: [confirmedAmount, budgetId]
      });
    }

    console.log('✅ 확정집행액 동기화 완료!\n');
    
    // 결과 확인
    const [results] = await sequelize.query(`
      SELECT 
        bb.id,
        bb.project_name,
        bb.confirmed_execution_amount,
        COUNT(p.id) as proposal_count,
        COALESCE(SUM(p.total_amount), 0) as total_approved
      FROM business_budgets bb
      LEFT JOIN proposals p ON p.budget_id = bb.id AND p.status = 'approved'
      WHERE bb.id IN (1,2,3,4,5)
      GROUP BY bb.id, bb.project_name, bb.confirmed_execution_amount
      ORDER BY bb.id
    `);
    
    console.log('📊 동기화 결과:');
    results.forEach(r => {
      const match = Math.abs(r.confirmed_execution_amount - r.total_approved) < 100 ? '✅' : '⚠️';
      console.log(`${match} ${r.project_name}`);
      console.log(`   확정집행액: ${(r.confirmed_execution_amount / 100000000).toFixed(2)}억원`);
      console.log(`   품의 금액: ${(r.total_approved / 100000000).toFixed(2)}억원`);
      console.log(`   품의 건수: ${r.proposal_count}건\n`);
    });

  } catch (error) {
    console.error('❌ 동기화 실패:', error.message);
  } finally {
    await sequelize.close();
  }
}

updateBudgetExecutionAmount();

