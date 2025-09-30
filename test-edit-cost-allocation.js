const axios = require('axios');

async function testEditCostAllocation() {
  try {
    console.log('=== 편집 모드 비용분배 정보 로드 테스트 ===');

    // 1. 먼저 테스트 데이터 생성
    const testData = {
      contractType: 'purchase',
      purpose: '편집 테스트',
      basis: '편집 테스트 근거',
      budget: 1,
      contractMethod: '일반계약',
      accountSubject: '일반관리비',
      totalAmount: 1000000,
      createdBy: '테스트사용자',

      // 구매품목 (비용분배 포함)
      purchaseItems: [
        {
          item: '편집 테스트 품목',
          productName: '편집 테스트 제품',
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

    console.log('저장된 구매품목:', JSON.stringify(savedData.purchaseItems, null, 2));
    console.log('구매품목 개수:', savedData.purchaseItems?.length || 0);

    // 3. 각 구매품목의 비용분배 정보 확인
    if (savedData.purchaseItems && savedData.purchaseItems.length > 0) {
      console.log('\n3. 구매품목 비용분배 상세 정보:');
      savedData.purchaseItems.forEach((item, index) => {
        console.log(`${index + 1}. 품목: ${item.item}, 금액: ${item.amount}`);
        if (item.costAllocations && item.costAllocations.length > 0) {
          console.log('   - 비용분배 정보 있음:', item.costAllocations.length, '개');
          item.costAllocations.forEach((alloc, allocIndex) => {
            console.log(`     ${allocIndex + 1}. ${alloc.department}: ${alloc.type}, ${alloc.value}, ${alloc.allocatedAmount}`);
          });
        } else {
          console.log('   - 비용분배 정보 없음');
        }
      });
    }

    // 4. 편집 모드에서 사용할 데이터 구조 시뮬레이션
    console.log('\n4. 편집 모드 데이터 구조 시뮬레이션:');
    const editData = {
      id: savedData.id,
      purpose: savedData.purpose,
      basis: savedData.basis,
      budget: savedData.budgetId,
      contractMethod: savedData.contractMethod,
      accountSubject: savedData.accountSubject,
      totalAmount: savedData.totalAmount,
      purchaseItems: savedData.purchaseItems?.map(item => ({
        item: item.item,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        supplier: item.supplier,
        requestDepartment: item.requestDepartment,
        costAllocation: item.costAllocations ? {
          allocations: item.costAllocations.map(alloc => ({
            department: alloc.department,
            type: alloc.type,
            value: alloc.value
          }))
        } : { allocations: [] }
      })) || [],
      requestDepartments: savedData.requestDepartments?.map(dept => ({
        name: dept.name,
        code: dept.code
      })) || [],
      approvalLine: savedData.approvalLines?.map(line => ({
        step: line.step,
        name: line.name,
        title: line.title,
        description: line.description
      })) || []
    };

    console.log('편집 모드 데이터:', JSON.stringify(editData, null, 2));
    console.log('구매품목 비용분배:', JSON.stringify(editData.purchaseItems.map(item => ({
      item: item.item,
      costAllocation: item.costAllocation
    })), null, 2));

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

testEditCostAllocation(); 