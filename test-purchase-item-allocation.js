// 구매품목 비용분배 비율 자동 설정 테스트
function testPurchaseItemAllocation() {
  console.log('=== 구매품목 비용분배 비율 자동 설정 테스트 ===');

  // 시뮬레이션용 상태
  let purchaseItems = [
    {
      id: 1,
      item: '테스트 품목',
      costAllocation: {
        allocations: []
      }
    }
  ];

  // 구매품목 비용분배 추가 함수 시뮬레이션
  function addCostAllocation(itemIndex) {
    const updated = [...purchaseItems];
    if (!updated[itemIndex].costAllocation) updated[itemIndex].costAllocation = { type: 'percentage', allocations: [] };
    
    // 새로운 비용분배 추가
    const newAllocation = {
      id: Date.now(),
      department: '',
      type: 'percentage',
      value: 0
    };
    
    const updatedAllocations = [...(updated[itemIndex].costAllocation.allocations ?? []), newAllocation];
    
    // 비용분배 개수에 따라 균등 분배 계산
    const totalAllocations = updatedAllocations.length;
    const equalRatio = totalAllocations > 0 ? Math.round(100 / totalAllocations) : 0;
    
    // 모든 비용분배의 비율을 균등하게 설정
    const equalizedAllocations = updatedAllocations.map((alloc, index) => {
      // 마지막 분배는 나머지 비율을 모두 가져가도록 설정
      if (index === totalAllocations - 1) {
        const remainingRatio = 100 - (equalRatio * (totalAllocations - 1));
        return {
          ...alloc,
          value: remainingRatio
        };
      } else {
        return {
          ...alloc,
          value: equalRatio
        };
      }
    });
    
    updated[itemIndex].costAllocation.allocations = equalizedAllocations;
    purchaseItems = updated;
    return equalizedAllocations;
  }

  // 구매품목 비용분배 삭제 함수 시뮬레이션
  function removeCostAllocation(itemIndex, allocationIndex) {
    const updated = [...purchaseItems];
    if (!updated[itemIndex].costAllocation) updated[itemIndex].costAllocation = { type: 'percentage', allocations: [] };
    
    // 해당 분배 제거
    const updatedAllocations = (updated[itemIndex].costAllocation.allocations ?? []).filter((_, index) => index !== allocationIndex);
    
    // 삭제 후 나머지 분배들의 비율을 균등하게 재분배
    if (updatedAllocations.length > 0) {
      const equalRatio = Math.round(100 / updatedAllocations.length);
      const equalizedAllocations = updatedAllocations.map((alloc, index) => {
        // 마지막 분배는 나머지 비율을 모두 가져가도록 설정
        if (index === updatedAllocations.length - 1) {
          const remainingRatio = 100 - (equalRatio * (updatedAllocations.length - 1));
          return {
            ...alloc,
            value: remainingRatio
          };
        } else {
          return {
            ...alloc,
            value: equalRatio
          };
        }
      });
      
      updated[itemIndex].costAllocation.allocations = equalizedAllocations;
    } else {
      updated[itemIndex].costAllocation.allocations = updatedAllocations;
    }
    
    purchaseItems = updated;
    return updated[itemIndex].costAllocation.allocations;
  }

  // 테스트 1: 비용분배 추가 테스트
  console.log('\n1. 비용분배 추가 테스트');
  
  console.log('1개 분배 추가:');
  let result = addCostAllocation(0);
  console.log('결과:', result.map(alloc => `${alloc.department || '부서'}: ${alloc.value}%`));
  
  console.log('\n2개 분배 추가:');
  result = addCostAllocation(0);
  console.log('결과:', result.map(alloc => `${alloc.department || '부서'}: ${alloc.value}%`));
  
  console.log('\n3개 분배 추가:');
  result = addCostAllocation(0);
  console.log('결과:', result.map(alloc => `${alloc.department || '부서'}: ${alloc.value}%`));
  
  console.log('\n4개 분배 추가:');
  result = addCostAllocation(0);
  console.log('결과:', result.map(alloc => `${alloc.department || '부서'}: ${alloc.value}%`));

  // 테스트 2: 비용분배 삭제 테스트
  console.log('\n2. 비용분배 삭제 테스트');
  
  console.log('첫 번째 분배 삭제:');
  result = removeCostAllocation(0, 0);
  console.log('결과:', result.map(alloc => `${alloc.department || '부서'}: ${alloc.value}%`));
  
  console.log('두 번째 분배 삭제:');
  result = removeCostAllocation(0, 0);
  console.log('결과:', result.map(alloc => `${alloc.department || '부서'}: ${alloc.value}%`));
  
  console.log('세 번째 분배 삭제:');
  result = removeCostAllocation(0, 0);
  console.log('결과:', result.map(alloc => `${alloc.department || '부서'}: ${alloc.value}%`));

  // 테스트 3: 비율 합계 검증
  console.log('\n3. 비율 합계 검증');
  const totalRatio = result.reduce((sum, alloc) => sum + alloc.value, 0);
  console.log(`총 비율: ${totalRatio}% (${totalRatio === 100 ? '✅ 정상' : '❌ 오류'})`);

  console.log('\n✅ 테스트 완료!');
}

testPurchaseItemAllocation(); 