const axios = require('axios');

async function testDraftWithDepartments() {
  try {
    console.log('=== 요청부서 포함 임시저장 테스트 ===');

    // 요청부서가 포함된 데이터로 테스트
    const testData = {
      contractType: 'purchase',
      purpose: '요청부서 테스트',
      basis: '요청부서 테스트 근거',
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

      // 비용귀속부서
      costDepartments: [
        {
          department: 'IT개발팀',
          amount: 1000000,
          ratio: 50
        },
        {
          department: '경영관리팀',
          amount: 1000000,
          ratio: 50
        }
      ],

      // 요청부서 (객체 형태로 테스트)
      requestDepartments: [
        {
          name: 'IT개발팀',
          code: 'IT001'
        },
        {
          name: '경영관리팀',
          code: 'MG001'
        }
      ],

      // 결재라인
      approvalLine: [
        {
          step: 1,
          name: '요청부서',
          title: '담당자',
          description: '품의서 작성 및 검토'
        },
        {
          step: 2,
          name: '경영관리팀',
          title: '팀장',
          description: '예산 및 경영 효율성 검토',
          conditional: true
        }
      ]
    };

    console.log('전송할 데이터:', JSON.stringify(testData, null, 2));

    const response = await axios.post('http://localhost:3001/api/proposals/draft', testData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('응답 상태:', response.status);
    console.log('✅ 성공:', response.data);
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

testDraftWithDepartments(); 