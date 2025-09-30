const axios = require('axios');

async function debugServerAllocation() {
  try {
    console.log('=== 서버 비용분배 디버깅 ===');

    const testData = {
      contractType: 'purchase',
      purpose: '서버 디버깅 테스트',
      basis: '서버 디버깅 테스트 근거',
      budget: 1,
      contractMethod: '일반계약',
      accountSubject: '일반관리비',
      totalAmount: 2000000,
      createdBy: '테스트사용자',

      // 구매품목 (비용분배 포함)
      purchaseItems: [
        {
          item: '디버깅 테스트 품목',
          productName: '디버깅 테스트 제품',
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
        }
      ],

      // 구매품목별 비용분배 정보를 별도로 전송
      purchaseItemCostAllocations: [
        {
          itemIndex: 0,
          itemName: '디버깅 테스트 품목',
          department: 'IT개발팀',
          type: 'percentage',
          value: 60,
          amount: 1000000
        },
        {
          itemIndex: 0,
          itemName: '디버깅 테스트 품목',
          department: '경영관리팀',
          type: 'percentage',
          value: 40,
          amount: 1000000
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

    console.log('1. 전송할 데이터:');
    console.log('purchaseItemCostAllocations:', JSON.stringify(testData.purchaseItemCostAllocations, null, 2));

    console.log('\n2. 서버로 데이터 전송 중...');
    const createResponse = await axios.post('http://localhost:3001/api/proposals/draft', testData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('생성 성공:', createResponse.data);
    const proposalId = createResponse.data.proposalId;

    // 3. 생성된 데이터 조회
    console.log('\n3. 생성된 데이터 조회...');
    const getResponse = await axios.get(`http://localhost:3001/api/proposals/${proposalId}`);
    const savedData = getResponse.data;

    console.log('저장된 비용귀속부서:', JSON.stringify(savedData.costDepartments, null, 2));
    console.log('비용귀속부서 개수:', savedData.costDepartments?.length || 0);

    // 4. 구매품목별 비용분배 검증
    console.log('\n4. 구매품목별 비용분배 검증:');
    if (savedData.costDepartments && savedData.costDepartments.length > 0) {
      savedData.costDepartments.forEach((dept, index) => {
        console.log(`비용귀속부서 ${index + 1}:`, {
          department: dept.department,
          amount: dept.amount,
          ratio: dept.ratio,
          purchaseItemId: dept.purchaseItemId,
          allocationType: dept.allocationType
        });
      });
    } else {
      console.log('❌ 비용귀속부서 정보가 저장되지 않았습니다.');
    }

    console.log('\n✅ 디버깅 완료!');

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

debugServerAllocation(); 