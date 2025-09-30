const { Sequelize } = require('sequelize');
const path = require('path');

// 데이터베이스 연결
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

async function checkProposalBudgetMapping() {
  try {
    console.log('=== 품의서와 사업예산 연결 상태 확인 ===\n');

    // 1. 결재완료된 품의서 조회
    console.log('1. 결재완료된 품의서 현황:');
    const approvedProposals = await sequelize.query(`
      SELECT 
        id,
        purpose,
        budget,
        total_amount,
        status,
        created_at
      FROM proposals 
      WHERE status = 'approved'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (approvedProposals[0].length === 0) {
      console.log('   ❌ 결재완료된 품의서가 없습니다.');
    } else {
      approvedProposals[0].forEach((proposal, index) => {
        console.log(`   ${index + 1}. ${proposal.purpose}`);
        console.log(`      예산: ${proposal.budget || '미지정'}`);
        console.log(`      금액: ${parseFloat(proposal.total_amount || 0).toLocaleString()}원`);
        console.log(`      상태: ${proposal.status}\n`);
      });
    }

    // 2. 사업예산 목록 조회
    console.log('2. 사업예산 목록:');
    const budgets = await sequelize.query(`
      SELECT 
        id,
        project_name,
        budget_amount,
        executed_amount
      FROM business_budgets 
      ORDER BY created_at DESC
      LIMIT 10
    `);

    budgets[0].forEach((budget, index) => {
      console.log(`   ${index + 1}. ${budget.project_name}`);
      console.log(`      예산금액: ${parseFloat(budget.budget_amount || 0).toLocaleString()}원`);
      console.log(`      기존 집행금액: ${parseFloat(budget.executed_amount || 0).toLocaleString()}원\n`);
    });

    // 3. 품의서의 budget 필드와 사업예산의 project_name 매칭 확인
    console.log('3. 품의서-사업예산 매칭 현황:');
    const matchingQuery = await sequelize.query(`
      SELECT 
        p.id as proposal_id,
        p.purpose,
        p.budget as proposal_budget,
        p.total_amount,
        bb.id as budget_id,
        bb.project_name as budget_project_name,
        bb.budget_amount
      FROM proposals p
      LEFT JOIN business_budgets bb ON p.budget = bb.project_name
      WHERE p.status = 'approved'
      ORDER BY p.created_at DESC
    `);

    let matchedCount = 0;
    let unmatchedCount = 0;

    matchingQuery[0].forEach((item, index) => {
      if (item.budget_id) {
        matchedCount++;
        console.log(`   ✅ 매칭됨 ${index + 1}. ${item.purpose}`);
        console.log(`      품의서 예산: "${item.proposal_budget}"`);
        console.log(`      사업예산명: "${item.budget_project_name}"`);
        console.log(`      품의서 금액: ${parseFloat(item.total_amount || 0).toLocaleString()}원\n`);
      } else {
        unmatchedCount++;
        console.log(`   ❌ 매칭 안됨 ${index + 1}. ${item.purpose}`);
        console.log(`      품의서 예산: "${item.proposal_budget || '미지정'}"`);
        console.log(`      품의서 금액: ${parseFloat(item.total_amount || 0).toLocaleString()}원\n`);
      }
    });

    console.log(`매칭된 품의서: ${matchedCount}건`);
    console.log(`매칭되지 않은 품의서: ${unmatchedCount}건`);

    // 4. 실제 집행금액 계산
    console.log('\n4. 실제 집행금액 계산 결과:');
    const executionQuery = await sequelize.query(`
      SELECT 
        p.budget as budget_name,
        COUNT(p.id) as proposal_count,
        SUM(p.total_amount) as total_executed
      FROM proposals p
      INNER JOIN business_budgets bb ON p.budget = bb.project_name
      WHERE p.status = 'approved'
      GROUP BY p.budget
      ORDER BY total_executed DESC
    `);

    if (executionQuery[0].length === 0) {
      console.log('   ❌ 매칭되는 집행 내역이 없습니다.');
    } else {
      executionQuery[0].forEach((exec, index) => {
        console.log(`   ${index + 1}. ${exec.budget_name}`);
        console.log(`      품의서 수: ${exec.proposal_count}건`);
        console.log(`      집행금액: ${parseFloat(exec.total_executed || 0).toLocaleString()}원\n`);
      });
    }

  } catch (error) {
    console.error('확인 실패:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkProposalBudgetMapping(); 