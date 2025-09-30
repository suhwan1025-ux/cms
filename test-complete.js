const axios = require('axios');

async function testComplete() {
  try {
    console.log('=== 완전한 임시저장 테스트 ===');
    
    // 모든 항목을 포함한 완전한 데이터
    const testData = {
      contractType: 'purchase',
      purpose: '테스트 목적',
      basis: '테스트 근거',
      budget: 1,
      contractMethod: '일반계약',
      accountSubject: '일반관리비',
      totalAmount: 1000000,
      changeReason: '변경 사유',
      extensionReason: '연장 사유',
      contractPeriod: '12개월',
      paymentMethod: 'monthly',
      createdBy: '테스트사용자',
      
      // 구매품목
      purchaseItems: [
        {
          item: '테스트 품목 1',
          productName: '테스트 제품 1',
          quantity: 2,
          unitPrice: 500000,
          amount: 1000000,
          supplier: '테스트 공급업체 1',
          requestDepartment: 'IT개발팀'
        },
        {
          item: '테스트 품목 2',
          productName: '테스트 제품 2',
          quantity: 1,
          unitPrice: 300000,
          amount: 300000,
          supplier: '테스트 공급업체 2',
          requestDepartment: '경영관리팀'
        }
      ],
      
      // 용역항목
      serviceItems: [
        {
          item: '테스트 용역 1',
          personnel: 3,
          skillLevel: '고급',
          period: 6,
          monthlyRate: 200000,
          contractAmount: 3600000,
          supplier: '테스트 용역업체 1',
          creditRating: 'A'
        }
      ],
      
      // 비용귀속부서
      costDepartments: [
        {
          department: 'IT개발팀',
          amount: 800000,
          ratio: 80
        },
        {
          department: '경영관리팀',
          amount: 200000,
          ratio: 20
        }
      ],
      
      // 요청부서
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
        },
        {
          step: 3,
          name: '대표이사',
          title: '대표이사',
          description: '최종 승인',
          final: true
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

testComplete(); 