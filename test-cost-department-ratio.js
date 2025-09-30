// 비용귀속부서 비율 자동 설정 테스트
function testCostDepartmentRatio() {
  console.log('=== 비용귀속부서 비율 자동 설정 테스트 ===');

  // 시뮬레이션용 상태
  let costDepartments = [];

  // 비용귀속부서 추가 함수 시뮬레이션
  function addCostDepartment() {
    const newCostDepartment = {
      id: Date.now(),
      department: '',
      amount: 0,
      ratio: 0
    };
    
    const updatedCostDepartments = [...costDepartments, newCostDepartment];
    
    // 비용귀속부서 개수에 따라 균등 분배 계산
    const totalDepartments = updatedCostDepartments.length;
    const equalRatio = totalDepartments > 0 ? Math.round(100 / totalDepartments) : 0;
    
    // 모든 비용귀속부서의 비율을 균등하게 설정
    const equalizedCostDepartments = updatedCostDepartments.map((dept, index) => {
      // 마지막 부서는 나머지 비율을 모두 가져가도록 설정
      if (index === totalDepartments - 1) {
        const remainingRatio = 100 - (equalRatio * (totalDepartments - 1));
        return {
          ...dept,
          ratio: remainingRatio
        };
      } else {
        return {
          ...dept,
          ratio: equalRatio
        };
      }
    });
    
    costDepartments = equalizedCostDepartments;
    return equalizedCostDepartments;
  }

  // 비용귀속부서 삭제 함수 시뮬레이션
  function removeCostDepartment(index) {
    const updated = costDepartments.filter((_, i) => i !== index);
    
    // 삭제 후 나머지 부서들의 비율을 균등하게 재분배
    if (updated.length > 0) {
      const equalRatio = Math.round(100 / updated.length);
      const equalizedCostDepartments = updated.map((dept, idx) => {
        // 마지막 부서는 나머지 비율을 모두 가져가도록 설정
        if (idx === updated.length - 1) {
          const remainingRatio = 100 - (equalRatio * (updated.length - 1));
          return {
            ...dept,
            ratio: remainingRatio
          };
        } else {
          return {
            ...dept,
            ratio: equalRatio
          };
        }
      });
      
      costDepartments = equalizedCostDepartments;
      return equalizedCostDepartments;
    } else {
      costDepartments = updated;
      return updated;
    }
  }

  // 테스트 1: 부서 추가 테스트
  console.log('\n1. 부서 추가 테스트');
  
  console.log('1개 부서 추가:');
  let result = addCostDepartment();
  console.log('결과:', result.map(dept => `${dept.department || '부서'}: ${dept.ratio}%`));
  
  console.log('\n2개 부서 추가:');
  result = addCostDepartment();
  console.log('결과:', result.map(dept => `${dept.department || '부서'}: ${dept.ratio}%`));
  
  console.log('\n3개 부서 추가:');
  result = addCostDepartment();
  console.log('결과:', result.map(dept => `${dept.department || '부서'}: ${dept.ratio}%`));
  
  console.log('\n4개 부서 추가:');
  result = addCostDepartment();
  console.log('결과:', result.map(dept => `${dept.department || '부서'}: ${dept.ratio}%`));

  // 테스트 2: 부서 삭제 테스트
  console.log('\n2. 부서 삭제 테스트');
  
  console.log('첫 번째 부서 삭제:');
  result = removeCostDepartment(0);
  console.log('결과:', result.map(dept => `${dept.department || '부서'}: ${dept.ratio}%`));
  
  console.log('두 번째 부서 삭제:');
  result = removeCostDepartment(0);
  console.log('결과:', result.map(dept => `${dept.department || '부서'}: ${dept.ratio}%`));
  
  console.log('세 번째 부서 삭제:');
  result = removeCostDepartment(0);
  console.log('결과:', result.map(dept => `${dept.department || '부서'}: ${dept.ratio}%`));

  // 테스트 3: 비율 합계 검증
  console.log('\n3. 비율 합계 검증');
  const totalRatio = result.reduce((sum, dept) => sum + dept.ratio, 0);
  console.log(`총 비율: ${totalRatio}% (${totalRatio === 100 ? '✅ 정상' : '❌ 오류'})`);

  console.log('\n✅ 테스트 완료!');
}

testCostDepartmentRatio(); 