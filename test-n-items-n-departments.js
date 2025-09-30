const axios = require('axios');

async function testNItemsNDepartments() {
  try {
    console.log('=== N개 품목 × N개 비용귀속부서 편집 복원 테스트 ===');

    // 1. 3개 품목에 각각 3개 부서씩 비용분배 설정
    const testData = {
      contractType: 'purchase',
      purpose: 'N개 품목 × N개 부서 테스트',
      basis: 'N개 품목 × N개 부서 테스트 근거',
      budget: 1,
      contractMethod: '일반계약',
      accountSubject: '일반관리비',
      totalAmount: 9000000,
      createdBy: '테스트사용자',

      // 3개 구매품목 (각각 3개 부서 비용분배)
      purchaseItems: [
        {
          item: '첫 번째 품목',
          productName: '첫 번째 제품',
          quantity: 1,
          unitPrice: 3000000,
          amount: 3000000,
          supplier: '테스트 공급업체1',
          requestDepartment: 'IT개발팀',
          costAllocation: {
            allocations: [
              { department: 'IT개발팀', type: 'percentage', value: 50 },
              { department: '경영관리팀', type: 'percentage', value: 30 },
              { department: '마케팅팀', type: 'percentage', value: 20 }
            ]
          }
        },
        {
          item: '두 번째 품목',
          productName: '두 번째 제품',
          quantity: 1,
          unitPrice: 3000000,
          amount: 3000000,
          supplier: '테스트 공급업체2',
          requestDepartment: '마케팅팀',
          costAllocation: {
            allocations: [
              { department: '마케팅팀', type: 'percentage', value: 60 },
              { department: '영업팀', type: 'percentage', value: 25 },
              { department: 'IT개발팀', type: 'percentage', value: 15 }
            ]
          }
        },
        {
          item: '세 번째 품목',
          productName: '세 번째 제품',
          quantity: 1,
          unitPrice: 3000000,
          amount: 3000000,
          supplier: '테스트 공급업체3',
          requestDepartment: '영업팀',
          costAllocation: {
            allocations: [
              { department: '영업팀', type: 'percentage', value: 40 },
              { department: '경영관리팀', type: 'percentage', value: 35 },
              { department: 'IT개발팀', type: 'percentage', value: 25 }
            ]
          }
        }
      ],

      // 구매품목별 비용분배 정보 (3×3=9개)
      purchaseItemCostAllocations: [
        // 첫 번째 품목 (3개 부서)
        { itemIndex: 0, itemName: '첫 번째 품목', department: 'IT개발팀', type: 'percentage', value: 50, amount: 3000000 },
        { itemIndex: 0, itemName: '첫 번째 품목', department: '경영관리팀', type: 'percentage', value: 30, amount: 3000000 },
        { itemIndex: 0, itemName: '첫 번째 품목', department: '마케팅팀', type: 'percentage', value: 20, amount: 3000000 },
        // 두 번째 품목 (3개 부서)
        { itemIndex: 1, itemName: '두 번째 품목', department: '마케팅팀', type: 'percentage', value: 60, amount: 3000000 },
        { itemIndex: 1, itemName: '두 번째 품목', department: '영업팀', type: 'percentage', value: 25, amount: 3000000 },
        { itemIndex: 1, itemName: '두 번째 품목', department: 'IT개발팀', type: 'percentage', value: 15, amount: 3000000 },
        // 세 번째 품목 (3개 부서)
        { itemIndex: 2, itemName: '세 번째 품목', department: '영업팀', type: 'percentage', value: 40, amount: 3000000 },
        { itemIndex: 2, itemName: '세 번째 품목', department: '경영관리팀', type: 'percentage', value: 35, amount: 3000000 },
        { itemIndex: 2, itemName: '세 번째 품목', department: 'IT개발팀', type: 'percentage', value: 25, amount: 3000000 }
      ],

      // 요청부서
      requestDepartments: [
        { name: 'IT개발팀', code: 'IT001' },
        { name: '마케팅팀', code: 'MK001' },
        { name: '영업팀', code: 'SL001' }
      ],

      // 결재라인
      approvalLine: [
        { step: 1, name: '요청부서', title: '담당자', description: '품의서 작성 및 검토' }
      ]
    };

    console.log('1. N개 품목 × N개 부서 데이터 생성 중...');
    console.log('설정된 비용분배:');
    testData.purchaseItems.forEach((item, index) => {
      console.log(`  품목 ${index + 1} (${item.item}):`);
      item.costAllocation.allocations.forEach(alloc => {
        console.log(`    - ${alloc.department}: ${alloc.value}%`);
      });
    });

    const createResponse = await axios.post('http://localhost:3001/api/proposals/draft', testData, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('생성 성공:', createResponse.data);
    const proposalId = createResponse.data.proposalId;

    // 2. 편집 모드에서 데이터 조회
    console.log('\n2. 편집 모드 데이터 조회...');
    const getResponse = await axios.get(`http://localhost:3001/api/proposals/${proposalId}`);
    const savedData = getResponse.data;

    console.log('서버에서 받은 데이터:');
    console.log('- 구매품목 개수:', savedData.purchaseItems?.length || 0);
    console.log('- 비용귀속부서 개수:', savedData.costDepartments?.length || 0);

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

    // 4. 복원 결과 검증
    console.log('\n4. 복원 결과 검증:');
    let totalRestoredAllocations = 0;
    restoredPurchaseItems.forEach((item, index) => {
      console.log(`구매품목 ${index + 1} (${item.item}):`);
      console.log(`  - 금액: ${item.amount}원`);
      console.log(`  - 비용분배 개수: ${item.costAllocation?.allocations?.length || 0}`);
      totalRestoredAllocations += item.costAllocation?.allocations?.length || 0;
      
      if (item.costAllocation && item.costAllocation.allocations) {
        item.costAllocation.allocations.forEach(alloc => {
          console.log(`    - ${alloc.department}: ${alloc.value}%`);
        });
      }
    });

    console.log(`\n총 복원된 비용분배 개수: ${totalRestoredAllocations}개`);
    console.log(`예상 비용분배 개수: ${testData.purchaseItems.length * 3}개 (3개 품목 × 3개 부서)`);

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

    // 6. 성공/실패 판정
    const expectedAllocations = testData.purchaseItems.length * 3; // 3개 품목 × 3개 부서
    const isSuccess = totalRestoredAllocations === expectedAllocations;
    
    console.log(`\n${isSuccess ? '✅' : '❌'} 테스트 결과: ${isSuccess ? '성공' : '실패'}`);
    console.log(`- 예상: ${expectedAllocations}개 비용분배`);
    console.log(`- 실제: ${totalRestoredAllocations}개 비용분배`);

    console.log('\n✅ N개 품목 × N개 부서 편집 복원 테스트 완료!');

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

testNItemsNDepartments(); 