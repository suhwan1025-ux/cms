const axios = require('axios');

async function testPurchaseCostAllocation() {
  try {
    console.log('=== 구매품목 비용분배 정보 임시저장 테스트 ===');

    const testData = {
      contractType: 'purchase',
      purpose: '구매품목 비용분배 테스트',
      basis: '구매품목 비용분배 테스트 근거',
      budget: 1,
      contractMethod: '일반계약',
      accountSubject: '일반관리비',
      totalAmount: 2000000,
      createdBy: '테스트사용자',

      // 구매품목 (비용분배 포함)
      purchaseItems: [
        {
          item: '테스트 품목 1',
          productName: '테스트 제품 1',
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
                value: 60
              },
              {
                department: '경영관리팀',
                type: 'percentage',
                value: 40
              }
            ]
          }
        },
        {
          item: '테스트 품목 2',
          productName: '테스트 제품 2',
          quantity: 1,
          unitPrice: 1000000,
          amount: 1000000,
          supplier: '테스트 공급업체',
          requestDepartment: '마케팅팀',
          costAllocation: {
            allocations: [
              {
                department: '마케팅팀',
                type: 'percentage',
                value: 70
              },
              {
                department: 'IT개발팀',
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

    console.log('저장된 구매품목:', JSON.stringify(savedData.purchaseItems, null, 2));
    console.log('구매품목 개수:', savedData.purchaseItems?.length || 0);

    // 각 구매품목의 비용분배 정보 확인
    if (savedData.purchaseItems && savedData.purchaseItems.length > 0) {
      console.log('\n=== 구매품목 비용분배 상세 정보 ===');
      savedData.purchaseItems.forEach((item, index) => {
        console.log(`${index + 1}. 품목: ${item.item}, 금액: ${item.amount}`);
        if (item.costAllocations && item.costAllocations.length > 0) {
          item.costAllocations.forEach((alloc, allocIndex) => {
            console.log(`   - 분배 ${allocIndex + 1}: ${alloc.department}, ${alloc.type}, ${alloc.value}, ${alloc.allocatedAmount}`);
          });
        } else {
          console.log('   - 비용분배 정보 없음');
        }
      });
    } else {
      console.log('❌ 구매품목 데이터가 저장되지 않았습니다!');
    }

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

testPurchaseCostAllocation(); 