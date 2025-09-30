const axios = require('axios');

async function testEditFlow() {
  try {
    console.log('=== 전체 편집 플로우 테스트 ===');

    // 1. 테스트 데이터 생성
    const testData = {
      contractType: 'purchase',
      purpose: '편집 플로우 테스트',
      basis: '편집 플로우 테스트 근거',
      budget: 1,
      contractMethod: '일반계약',
      accountSubject: '일반관리비',
      totalAmount: 2000000,
      createdBy: '테스트사용자',

      // 구매품목 (비용분배 포함)
      purchaseItems: [
        {
          item: '편집 플로우 테스트 품목',
          productName: '편집 플로우 테스트 제품',
          quantity: 1,
          unitPrice: 2000000,
          amount: 2000000,
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

    // 2. 생성된 데이터 조회 (서버에서)
    console.log('\n2. 서버에서 데이터 조회...');
    const getResponse = await axios.get(`http://localhost:3001/api/proposals/${proposalId}`);
    const savedData = getResponse.data;

    console.log('서버 데이터 - 구매품목:', JSON.stringify(savedData.purchaseItems, null, 2));

    // 3. DraftList에서 편집 데이터 준비 시뮬레이션
    console.log('\n3. DraftList 편집 데이터 준비 시뮬레이션...');
    const editData = {
      ...savedData,
      purchaseItems: (savedData.purchaseItems || []).map(item => ({
        ...item,
        // 서버에서 costAllocations가 있으면 costAllocation으로 변환
        costAllocation: item.costAllocations ? {
          allocations: item.costAllocations.map(alloc => ({
            department: alloc.department,
            type: alloc.type,
            value: alloc.value
          }))
        } : { allocations: [] }
      }))
    };

    console.log('편집 데이터 - 구매품목:', JSON.stringify(editData.purchaseItems, null, 2));

    // 4. ProposalForm에서 로드 시뮬레이션
    console.log('\n4. ProposalForm 로드 시뮬레이션...');
    const loadedData = {
      purpose: editData.purpose || '',
      basis: editData.basis || '',
      budget: editData.budgetId || '',
      contractMethod: editData.contractMethod || '',
      accountSubject: editData.accountSubject || '',
      purchaseItems: (editData.purchaseItems || []).map(item => ({
        item: item.item || '',
        productName: item.productName || '',
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        amount: item.amount || 0,
        supplier: item.supplier || '',
        requestDepartment: item.requestDepartment || '',
        // 서버에서 costAllocations가 없으면 빈 배열로 초기화
        costAllocation: item.costAllocations ? {
          allocations: item.costAllocations.map(alloc => ({
            department: alloc.department,
            type: alloc.type,
            value: alloc.value
          }))
        } : { allocations: [] }
      }))
    };

    console.log('로드된 데이터 - 구매품목:', JSON.stringify(loadedData.purchaseItems, null, 2));

    // 5. 각 구매품목의 비용분배 정보 확인
    console.log('\n5. 비용분배 정보 확인:');
    loadedData.purchaseItems.forEach((item, index) => {
      console.log(`${index + 1}. 품목: ${item.item}`);
      console.log(`   - 비용분배 개수: ${item.costAllocation?.allocations?.length || 0}`);
      if (item.costAllocation?.allocations?.length > 0) {
        item.costAllocation.allocations.forEach((alloc, allocIndex) => {
          console.log(`     ${allocIndex + 1}. ${alloc.department}: ${alloc.type}, ${alloc.value}`);
        });
      } else {
        console.log('   - 비용분배 정보 없음');
      }
    });

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

testEditFlow(); 