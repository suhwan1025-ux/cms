const axios = require('axios');

async function testEditRestore() {
  try {
    console.log('=== 편집 모드 데이터 복원 테스트 ===');

    // 1. 먼저 테스트 데이터 생성
    const testData = {
      contractType: 'purchase',
      purpose: '편집 모드 테스트',
      basis: '편집 모드 테스트 근거',
      budget: 1,
      contractMethod: '일반계약',
      accountSubject: '일반관리비',
      totalAmount: 2000000,
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
          itemName: '편집 테스트 품목',
          department: 'IT개발팀',
          type: 'percentage',
          value: 60,
          amount: 1000000
        },
        {
          itemIndex: 0,
          itemName: '편집 테스트 품목',
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

    console.log('1. 테스트 데이터 생성 중...');
    const createResponse = await axios.post('http://localhost:3001/api/proposals/draft', testData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('생성 성공:', createResponse.data);
    const proposalId = createResponse.data.proposalId;

    // 2. 생성된 데이터 조회 (편집 모드 시뮬레이션)
    console.log('\n2. 편집 모드 데이터 조회...');
    const getResponse = await axios.get(`http://localhost:3001/api/proposals/${proposalId}`);
    const savedData = getResponse.data;

    console.log('저장된 구매품목:', JSON.stringify(savedData.purchaseItems, null, 2));

    // 3. 편집 모드에서 복원되는 데이터 시뮬레이션
    console.log('\n3. 편집 모드 데이터 복원 시뮬레이션...');
    const restoredPurchaseItems = (savedData.purchaseItems || []).map(item => ({
      item: item.item || '',
      productName: item.productName || '',
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      amount: item.amount || 0,
      supplier: item.supplier || '',
      requestDepartment: item.requestDepartment || '',
      // 서버에서 받은 costAllocations 정보 사용
      costAllocation: (() => {
        if (item.costAllocations && item.costAllocations.length > 0) {
          console.log(`구매품목 "${item.item}" 비용분배 정보 복원:`, item.costAllocations);
          return {
            allocations: item.costAllocations.map(alloc => ({
              department: alloc.department,
              type: alloc.type || 'percentage',
              value: alloc.value || alloc.ratio || 0
            }))
          };
        }
        
        console.log(`구매품목 "${item.item}" 비용분배 정보 없음`);
        return { allocations: [] };
      })()
    }));

    console.log('복원된 구매품목:', JSON.stringify(restoredPurchaseItems, null, 2));

    // 4. 비용분배 정보 검증
    console.log('\n4. 비용분배 정보 검증:');
    restoredPurchaseItems.forEach((item, index) => {
      console.log(`구매품목 ${index + 1} (${item.item}):`);
      if (item.costAllocation && item.costAllocation.allocations) {
        item.costAllocation.allocations.forEach(alloc => {
          console.log(`  - ${alloc.department}: ${alloc.value}%`);
        });
      } else {
        console.log('  - 비용분배 정보 없음');
      }
    });

    // 5. 자동합산 검증
    console.log('\n5. 자동합산 검증:');
    const totalAllocation = {};
    restoredPurchaseItems.forEach(item => {
      if (item.costAllocation && item.costAllocation.allocations) {
        item.costAllocation.allocations.forEach(alloc => {
          if (!totalAllocation[alloc.department]) {
            totalAllocation[alloc.department] = 0;
          }
          totalAllocation[alloc.department] += (item.amount * (alloc.value / 100));
        });
      }
    });

    console.log('자동합산 결과:');
    Object.entries(totalAllocation).forEach(([dept, amount]) => {
      console.log(`  ${dept}: ${amount.toLocaleString()}원`);
    });

    console.log('\n✅ 편집 모드 테스트 완료!');

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

testEditRestore(); 