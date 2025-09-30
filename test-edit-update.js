const axios = require('axios');

async function testEditUpdate() {
  try {
    console.log('=== 편집 모드 업데이트 테스트 ===');

    // 1. 먼저 새 품의서 생성
    console.log('1. 새 품의서 생성...');
    const createData = {
      contractType: 'purchase',
      purpose: '편집 테스트 품의서',
      basis: '편집 테스트 근거',
      budget: 1,
      contractMethod: '일반계약',
      accountSubject: '일반관리비',
      totalAmount: 1000000,
      createdBy: '테스트사용자',
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
      costDepartments: [
        {
          department: 'IT개발팀',
          amount: 1000000,
          ratio: 100
        }
      ],
      requestDepartments: [
        {
          name: 'IT개발팀',
          code: 'IT001'
        }
      ],
      approvalLine: [
        {
          step: 1,
          name: '요청부서',
          title: '담당자',
          description: '품의서 작성 및 검토'
        }
      ]
    };

    const createResponse = await axios.post('http://localhost:3001/api/proposals/draft', createData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('새 품의서 생성 성공:', createResponse.data);
    const proposalId = createResponse.data.proposalId;

    // 2. 생성된 품의서 조회
    console.log('\n2. 생성된 품의서 조회...');
    const getResponse = await axios.get(`http://localhost:3001/api/proposals/${proposalId}`);
    const originalData = getResponse.data;
    console.log('원본 데이터:', JSON.stringify(originalData, null, 2));

    // 3. 편집 모드로 업데이트
    console.log('\n3. 편집 모드로 업데이트...');
    const updateData = {
      ...createData,
      proposalId: proposalId, // 편집 모드 표시
      purpose: '편집된 품의서',
      basis: '편집된 근거',
      totalAmount: 2000000,
      purchaseItems: [
        {
          item: '편집된 품목',
          productName: '편집된 제품',
          quantity: 2,
          unitPrice: 1000000,
          amount: 2000000,
          supplier: '편집된 공급업체',
          requestDepartment: 'IT개발팀'
        }
      ],
      costDepartments: [
        {
          department: 'IT개발팀',
          amount: 1200000,
          ratio: 60
        },
        {
          department: '경영관리팀',
          amount: 800000,
          ratio: 40
        }
      ],
      requestDepartments: [
        {
          name: 'IT개발팀',
          code: 'IT001'
        },
        {
          name: '경영관리팀',
          code: 'MG001'
        }
      ]
    };

    const updateResponse = await axios.post('http://localhost:3001/api/proposals/draft', updateData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('편집 모드 업데이트 성공:', updateResponse.data);

    // 4. 업데이트된 품의서 조회
    console.log('\n4. 업데이트된 품의서 조회...');
    const updatedGetResponse = await axios.get(`http://localhost:3001/api/proposals/${proposalId}`);
    const updatedData = updatedGetResponse.data;
    console.log('업데이트된 데이터:', JSON.stringify(updatedData, null, 2));

    // 5. 결과 비교
    console.log('\n5. 결과 비교...');
    console.log('원본 ID:', originalData.id);
    console.log('업데이트된 ID:', updatedData.id);
    console.log('ID가 같은가?', originalData.id === updatedData.id);
    console.log('원본 목적:', originalData.purpose);
    console.log('업데이트된 목적:', updatedData.purpose);
    console.log('원본 총액:', originalData.totalAmount);
    console.log('업데이트된 총액:', updatedData.totalAmount);
    console.log('원본 비용귀속부서 개수:', originalData.costDepartments?.length || 0);
    console.log('업데이트된 비용귀속부서 개수:', updatedData.costDepartments?.length || 0);

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

testEditUpdate(); 