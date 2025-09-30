const axios = require('axios');

async function testCostAllocationLog() {
  try {
    console.log('=== 구매품목 비용분배 로그 테스트 ===');

    const testData = {
      contractType: 'purchase',
      purpose: '비용분배 로그 테스트',
      basis: '비용분배 로그 테스트 근거',
      budget: 1,
      contractMethod: '일반계약',
      accountSubject: '일반관리비',
      totalAmount: 1000000,
      createdBy: '테스트사용자',

      // 구매품목 (비용분배 포함)
      purchaseItems: [
        {
          item: '로그 테스트 품목',
          productName: '로그 테스트 제품',
          quantity: 1,
          unitPrice: 1000000,
          amount: 1000000,
          supplier: '테스트 공급업체',
          requestDepartment: 'IT개발팀',
          costAllocation: {
            allocations: [
              {
                department: 'IT개발팀',
                type: 'percentage',
                value: 70
              },
              {
                department: '경영관리팀',
                type: 'percentage',
                value: 30
              }
            ]
          }
        }
      ],

      // 요청부서
      requestDepartments: [
        {
          name: 'IT개발팀',
          code: 'IT001'
        }
      ],

      // 결재라인
      approvalLine: [
        {
          step: 1,
          name: '요청부서',
          title: '담당자',
          description: '품의서 작성 및 검토'
        }
      ]
    };

    console.log('전송할 데이터:', JSON.stringify(testData, null, 2));
    console.log('구매품목 비용분배:', JSON.stringify(testData.purchaseItems.map(item => ({
      item: item.item,
      amount: item.amount,
      costAllocation: item.costAllocation
    })), null, 2));

    // 클라이언트에서 계산되는 비용귀속부서 데이터 시뮬레이션
    const purchaseItemAllocations = {};
    console.log('구매품목 비용분배 처리 시작:', testData.purchaseItems);
    testData.purchaseItems.forEach(item => {
      console.log('구매품목 처리:', item.item, '비용분배:', item.costAllocation);
      if (item.costAllocation && item.costAllocation.allocations) {
        console.log('비용분배 정보 있음:', item.costAllocation.allocations);
        item.costAllocation.allocations.forEach(alloc => {
          if (!purchaseItemAllocations[alloc.department]) {
            purchaseItemAllocations[alloc.department] = 0;
          }
          
          if (alloc.type === 'percentage') {
            purchaseItemAllocations[alloc.department] += (item.amount * (alloc.value / 100));
          } else {
            purchaseItemAllocations[alloc.department] += alloc.value;
          }
        });
      } else {
        console.log('비용분배 정보 없음');
      }
    });
    console.log('구매품목 비용분배 결과:', purchaseItemAllocations);
    
    const totalAmount = 1000000;
    const costDepartments = Object.entries(purchaseItemAllocations).map(([department, amount]) => ({
      department: department,
      amount: amount,
      ratio: totalAmount > 0 ? ((amount / totalAmount) * 100) : 0
    }));

    // 비용귀속부서 데이터 추가
    testData.costDepartments = costDepartments;

    console.log('최종 비용귀속부서 데이터:', JSON.stringify(testData.costDepartments, null, 2));

    const response = await axios.post('http://localhost:3001/api/proposals/draft', testData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('임시저장 성공:', response.data);
    const proposalId = response.data.proposalId;

    // 저장된 데이터 조회
    console.log('\n=== 저장된 데이터 조회 ===');
    const getResponse = await axios.get(`http://localhost:3001/api/proposals/${proposalId}`);
    const savedData = getResponse.data;

    console.log('저장된 비용귀속부서:', JSON.stringify(savedData.costDepartments, null, 2));
    console.log('비용귀속부서 개수:', savedData.costDepartments?.length || 0);

  } catch (error) {
    console.log('❌ 오류 발생:');
    if (error.response) {
      console.log('응답 상태:', error.response.status);
      console.log('오류 데이터:', error.response.data);
      console.log('오류 메시지:', error.response.data.error);
      if (error.response.data.details) {
        console.log('상세 정보:', error.response.data.details);
      }
    } else {
      console.log('네트워크 오류:', error.message);
    }
  }
}

testCostAllocationLog(); 