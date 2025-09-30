const axios = require('axios');

async function testManualCostDepartments() {
  try {
    console.log('=== 수동 비용귀속부서 추가 테스트 ===');

    const testData = {
      contractType: 'purchase',
      purpose: '수동 비용귀속부서 테스트',
      basis: '수동 비용귀속부서 테스트 근거',
      budget: 1,
      contractMethod: '일반계약',
      accountSubject: '일반관리비',
      totalAmount: 2000000,
      createdBy: '테스트사용자',

      // 구매품목
      purchaseItems: [
        {
          item: '테스트 품목',
          productName: '테스트 제품',
          quantity: 1,
          unitPrice: 1000000,
          amount: 1000000,
          supplier: '테스트 공급업체',
          requestDepartment: 'IT개발팀'
        }
      ],

      // 수동으로 입력된 비용귀속부서
      costDepartments: [
        {
          department: 'IT개발팀',
          amount: 1200000,
          ratio: 60
        },
        {
          department: '경영관리팀',
          amount: 600000,
          ratio: 30
        },
        {
          department: '마케팅팀',
          amount: 200000,
          ratio: 10
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
    console.log('수동 비용귀속부서:', JSON.stringify(testData.costDepartments, null, 2));

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

    // 각 비용귀속부서 상세 확인
    if (savedData.costDepartments && savedData.costDepartments.length > 0) {
      console.log('\n=== 비용귀속부서 상세 정보 ===');
      savedData.costDepartments.forEach((dept, index) => {
        console.log(`${index + 1}. 부서: ${dept.department}, 금액: ${dept.amount}, 비율: ${dept.ratio}%`);
      });
    } else {
      console.log('❌ 비용귀속부서 데이터가 저장되지 않았습니다!');
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

testManualCostDepartments(); 