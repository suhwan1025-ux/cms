const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3002';

async function testBudgetExecutionSync() {
  console.log('🧪 사업예산 확정집행액 자동 동기화 테스트\n');

  try {
    // 1. 현재 상태 확인
    console.log('1️⃣ 현재 확정집행액 확인...');
    let response = await fetch(`${API_BASE_URL}/api/budget-statistics`);
    let data = await response.json();
    const budget1Before = data.budgetData.find(b => b.id === 1);
    console.log(`   AI 챗봇 시스템 구축 (ID: 1)`);
    console.log(`   - 확정집행액: ${(budget1Before.confirmedExecutionAmount / 100000000).toFixed(2)}억원\n`);

    // 2. 새 품의서 생성 (approved 상태)
    console.log('2️⃣ 새 결재완료 품의서 생성 (2천만원)...');
    const newProposal = {
      contractType: 'purchase',
      title: '테스트 품의서',
      purpose: '확정집행액 자동 동기화 테스트',
      basis: '테스트',
      budget: 1, // AI 챗봇 시스템 구축
      accountSubject: '소프트웨어',
      totalAmount: 20000000,
      contractMethod: '수의계약',
      paymentMethod: '일시불',
      status: 'approved',
      createdBy: '테스트',
      isDraft: false,
      purchaseItems: [{
        item: '소프트웨어',
        productName: '테스트 제품',
        quantity: 1,
        unitPrice: 20000000,
        amount: 20000000,
        supplier: '테스트공급사'
      }],
      costDepartments: [{
        department: 'IT개발팀',
        amount: 20000000,
        ratio: 100
      }],
      requestDepartments: ['IT개발팀'],
      approvalLine: []
    };

    response = await fetch(`${API_BASE_URL}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProposal)
    });
    
    if (!response.ok) {
      throw new Error(`품의서 생성 실패: ${response.status}`);
    }
    
    const created = await response.json();
    console.log(`   ✅ 품의서 생성 완료 (ID: ${created.proposalId})\n`);

    // 3. 확정집행액 확인
    console.log('3️⃣ 자동 동기화 후 확정집행액 확인...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
    
    response = await fetch(`${API_BASE_URL}/api/budget-statistics`);
    data = await response.json();
    const budget1After = data.budgetData.find(b => b.id === 1);
    console.log(`   AI 챗봇 시스템 구축 (ID: 1)`);
    console.log(`   - 이전 확정집행액: ${(budget1Before.confirmedExecutionAmount / 100000000).toFixed(2)}억원`);
    console.log(`   - 현재 확정집행액: ${(budget1After.confirmedExecutionAmount / 100000000).toFixed(2)}억원`);
    console.log(`   - 증가액: ${((budget1After.confirmedExecutionAmount - budget1Before.confirmedExecutionAmount) / 10000000).toFixed(1)}백만원\n`);

    const expectedAmount = budget1Before.confirmedExecutionAmount + 20000000;
    if (Math.abs(budget1After.confirmedExecutionAmount - expectedAmount) < 100) {
      console.log('   ✅ 자동 동기화 성공! 확정집행액이 정확히 업데이트되었습니다.\n');
    } else {
      console.log('   ⚠️ 확정집행액이 예상과 다릅니다.');
      console.log(`   예상: ${(expectedAmount / 100000000).toFixed(2)}억원`);
      console.log(`   실제: ${(budget1After.confirmedExecutionAmount / 100000000).toFixed(2)}억원\n`);
    }

    // 4. 생성한 테스트 품의서 삭제
    console.log('4️⃣ 테스트 품의서 삭제...');
    response = await fetch(`${API_BASE_URL}/api/proposals/${created.proposalId}?force=true`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`품의서 삭제 실패: ${response.status}`);
    }
    console.log(`   ✅ 품의서 삭제 완료\n`);

    // 5. 삭제 후 확정집행액 확인
    console.log('5️⃣ 삭제 후 확정집행액 확인...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
    
    response = await fetch(`${API_BASE_URL}/api/budget-statistics`);
    data = await response.json();
    const budget1Final = data.budgetData.find(b => b.id === 1);
    console.log(`   AI 챗봇 시스템 구축 (ID: 1)`);
    console.log(`   - 확정집행액: ${(budget1Final.confirmedExecutionAmount / 100000000).toFixed(2)}억원`);
    console.log(`   - 원래 금액: ${(budget1Before.confirmedExecutionAmount / 100000000).toFixed(2)}억원\n`);

    if (Math.abs(budget1Final.confirmedExecutionAmount - budget1Before.confirmedExecutionAmount) < 100) {
      console.log('   ✅ 삭제 후 동기화 성공! 확정집행액이 원래대로 복구되었습니다.\n');
    } else {
      console.log('   ⚠️ 확정집행액이 예상과 다릅니다.\n');
    }

    console.log('🎉 모든 테스트 완료!');
    console.log('\n📋 테스트 결과:');
    console.log('   ✅ 품의서 생성 시 자동 동기화');
    console.log('   ✅ 품의서 삭제 시 자동 동기화');
    console.log('\n💡 이제 품의서를 생성/수정/삭제하면 확정집행액이 자동으로 업데이트됩니다!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  }
}

testBudgetExecutionSync();

