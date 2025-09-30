const axios = require('axios');

async function testDebugMapping() {
  try {
    console.log('=== 품의서-사업예산 매칭 디버깅 ===\n');

    const response = await axios.get('http://localhost:3001/api/debug/proposal-budget-mapping');
    const data = response.data;

    console.log('1. 결재완료된 품의서 현황:');
    if (data.approvedProposals.length === 0) {
      console.log('   ❌ 결재완료된 품의서가 없습니다.\n');
    } else {
      data.approvedProposals.forEach((proposal, index) => {
        console.log(`   ${index + 1}. ${proposal.purpose}`);
        console.log(`      예산: "${proposal.budget || '미지정'}"`);
        console.log(`      금액: ${parseFloat(proposal.total_amount || 0).toLocaleString()}원`);
        console.log(`      상태: ${proposal.status}\n`);
      });
    }

    console.log('2. 사업예산 목록:');
    data.budgets.forEach((budget, index) => {
      console.log(`   ${index + 1}. "${budget.project_name}"`);
      console.log(`      예산금액: ${parseFloat(budget.budget_amount || 0).toLocaleString()}원`);
      console.log(`      기존 집행금액: ${parseFloat(budget.executed_amount || 0).toLocaleString()}원\n`);
    });

    console.log('3. 품의서-사업예산 매칭 현황:');
    let matchedCount = 0;
    let unmatchedCount = 0;

    data.matching.forEach((item, index) => {
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
    console.log(`매칭되지 않은 품의서: ${unmatchedCount}건\n`);

    console.log('4. 실제 집행금액 계산 결과:');
    if (data.executions.length === 0) {
      console.log('   ❌ 매칭되는 집행 내역이 없습니다.');
    } else {
      data.executions.forEach((exec, index) => {
        console.log(`   ${index + 1}. "${exec.budget_name}"`);
        console.log(`      품의서 수: ${exec.proposal_count}건`);
        console.log(`      집행금액: ${parseFloat(exec.total_executed || 0).toLocaleString()}원\n`);
      });
    }

  } catch (error) {
    console.error('디버깅 실패:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
  }
}

testDebugMapping(); 