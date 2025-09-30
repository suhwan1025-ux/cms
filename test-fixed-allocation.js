const axios = require('axios');

async function testFixedAllocation() {
  try {
    console.log('=== 수정된 비용분배 시스템 테스트 ===');

    const testData = {
      contractType: 'purchase',
      purpose: '수정된 비용분배 테스트',
      basis: '수정된 비용분배 테스트 근거',
      budget: 1,
      contractMethod: '일반계약',
      accountSubject: '일반관리비',
      totalAmount: 1000000,
      createdBy: '테스트사용자',

      // 구매품목 (비용분배 포함)
      purchaseItems: [
        {
          item: '수정된 테스트 품목',
          productName: '수정된 테스트 제품',
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

    // 3. 비율 합계 검증
    console.log('\n3. 비율 합계 검증');
    if (savedData.costDepartments && savedData.costDepartments.length > 0) {
      const totalRatio = savedData.costDepartments.reduce((sum, dept) => sum + parseFloat(dept.ratio), 0);
      console.log(`총 비율: ${totalRatio}% (${Math.abs(totalRatio - 100) < 1 ? '✅ 정상' : '❌ 오류'})`);
    }

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

testFixedAllocation(); 