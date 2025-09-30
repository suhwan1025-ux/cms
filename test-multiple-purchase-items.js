const axios = require('axios');

async function testMultiplePurchaseItems() {
  try {
    console.log('=== 여러 구매품목 비용분배 테스트 ===');

    const testData = {
      contractType: 'purchase',
      purpose: '여러 구매품목 비용분배 테스트',
      basis: '여러 구매품목 비용분배 테스트 근거',
      budget: 1,
      contractMethod: '일반계약',
      accountSubject: '일반관리비',
      totalAmount: 2000000,
      createdBy: '테스트사용자',

      // 여러 구매품목 (각각 다른 비용분배)
      purchaseItems: [
        {
          item: '첫 번째 구매품목',
          productName: '첫 번째 제품',
          quantity: 1,
          unitPrice: 1000000,
          amount: 1000000,
          supplier: '첫 번째 공급업체',
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
          item: '두 번째 구매품목',
          productName: '두 번째 제품',
          quantity: 1,
          unitPrice: 1000000,
          amount: 1000000,
          supplier: '두 번째 공급업체',
          requestDepartment: '마케팅팀',
          costAllocation: {
            allocations: [
              {
                department: '마케팅팀',
                type: 'percentage',
                value: 70
              },
              {
                department: '영업팀',
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
        },
        {
          name: '마케팅팀',
          code: 'MK001'
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

    console.log('1. 테스트 데이터 생성 중...');
    const createResponse = await axios.post('http://localhost:3001/api/proposals/draft', testData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('생성 성공:', createResponse.data);
    const proposalId = createResponse.data.proposalId;

    // 2. 생성된 데이터 조회
    console.log('\n2. 생성된 데이터 조회...');
    const getResponse = await axios.get(`http://localhost:3001/api/proposals/${proposalId}`);
    const savedData = getResponse.data;

    console.log('저장된 비용귀속부서:', JSON.stringify(savedData.costDepartments, null, 2));
    console.log('비용귀속부서 개수:', savedData.costDepartments?.length || 0);
    console.log('저장된 구매품목:', JSON.stringify(savedData.purchaseItems, null, 2));

    // 3. 각 구매품목별 비용분배 검증
    console.log('\n3. 구매품목별 비용분배 검증');
    savedData.costDepartments.forEach((dept, index) => {
      console.log(`비용귀속부서 ${index + 1}:`, {
        department: dept.department,
        amount: dept.amount,
        ratio: dept.ratio,
        purchaseItemId: dept.purchaseItemId,
        allocationType: dept.allocationType
      });
    });

    // 4. 구매품목별로 그룹화하여 검증
    const itemAllocations = {};
    savedData.costDepartments.forEach(dept => {
      if (dept.purchaseItemId) {
        if (!itemAllocations[dept.purchaseItemId]) {
          itemAllocations[dept.purchaseItemId] = [];
        }
        itemAllocations[dept.purchaseItemId].push(dept);
      }
    });

    console.log('\n4. 구매품목별 비용분배 그룹화:');
    Object.keys(itemAllocations).forEach(itemId => {
      console.log(`구매품목 ID ${itemId}:`, itemAllocations[itemId]);
    });

    console.log('\n✅ 테스트 완료!');

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

testMultiplePurchaseItems(); 