const axios = require('axios');

async function testBudgetExecution() {
  try {
    console.log('=== 사업예산 집행금액 테스트 ===\n');

    // 1. 사업예산 통계 조회
    console.log('1. 사업예산 통계 조회...');
    const statsResponse = await axios.get('http://localhost:3001/api/budget-statistics');
    const stats = statsResponse.data;
    
    console.log(`전체 예산 개수: ${stats.totalBudgets}`);
    console.log(`전체 예산 금액: ${stats.totalBudgetAmount.toLocaleString()}원`);
    console.log(`실제 집행 금액: ${stats.executedBudgetAmount.toLocaleString()}원`);
    console.log(`잔여 예산 금액: ${stats.remainingBudgetAmount.toLocaleString()}원`);
    console.log(`결재완료 품의서 수: ${stats.approvedProposalsCount}건\n`);

    // 2. 개별 예산의 집행현황
    console.log('2. 개별 사업예산 집행현황:');
    stats.budgetData.forEach((budget, index) => {
      console.log(`${index + 1}. ${budget.projectName}`);
      console.log(`   예산금액: ${parseFloat(budget.budgetAmount || 0).toLocaleString()}원`);
      console.log(`   집행금액: ${parseFloat(budget.executedAmount || 0).toLocaleString()}원`);
      console.log(`   집행률: ${budget.executionRate || 0}%`);
      console.log(`   잔여금액: ${parseFloat(budget.remainingAmount || 0).toLocaleString()}원\n`);
    });

    // 3. 예산별 집행 내역 (budgetExecutions)
    if (stats.budgetExecutions) {
      console.log('3. 품의서 기반 예산별 집행 내역:');
      Object.entries(stats.budgetExecutions).forEach(([budgetName, amount]) => {
        console.log(`   ${budgetName}: ${amount.toLocaleString()}원`);
      });
    }

  } catch (error) {
    console.error('테스트 실패:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
  }
}

// 테스트 실행
testBudgetExecution(); 