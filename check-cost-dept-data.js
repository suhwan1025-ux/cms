const axios = require('axios');

async function checkCostDeptData() {
  try {
    console.log('=== 비용귀속부서 데이터 확인 ===');
    
    const proposalId = 85; // 최근 생성된 품의서 ID
    
    const response = await axios.get(`http://localhost:3001/api/proposals/${proposalId}`);
    const savedData = response.data;
    
    console.log('품의서 정보:', {
      id: savedData.id,
      purpose: savedData.purpose,
      totalAmount: savedData.totalAmount
    });
    
    console.log('\n=== 비용귀속부서 정보 ===');
    if (savedData.costDepartments && savedData.costDepartments.length > 0) {
      console.log('비용귀속부서 개수:', savedData.costDepartments.length);
      savedData.costDepartments.forEach((dept, index) => {
        console.log(`${index + 1}. 부서: ${dept.department}, 금액: ${dept.amount}, 비율: ${dept.ratio}%`);
      });
    } else {
      console.log('❌ 비용귀속부서 정보가 없습니다!');
    }
    
    console.log('\n=== 구매품목 정보 ===');
    if (savedData.purchaseItems && savedData.purchaseItems.length > 0) {
      console.log('구매품목 개수:', savedData.purchaseItems.length);
      savedData.purchaseItems.forEach((item, index) => {
        console.log(`${index + 1}. 품목: ${item.item}, 금액: ${item.amount}`);
      });
    } else {
      console.log('❌ 구매품목 정보가 없습니다!');
    }
    
    // 비용귀속부서와 구매품목 매칭 테스트
    console.log('\n=== 비용귀속부서와 구매품목 매칭 테스트 ===');
    if (savedData.costDepartments && savedData.purchaseItems) {
      savedData.purchaseItems.forEach((item, itemIndex) => {
        console.log(`\n구매품목 ${itemIndex + 1}: ${item.item} (${item.amount}원)`);
        
        const itemAmount = parseFloat(item.amount);
        const matchingCostDepts = savedData.costDepartments.filter(dept => {
          const deptAmount = parseFloat(dept.amount);
          return Math.abs(deptAmount - itemAmount) < 1;
        });
        
        if (matchingCostDepts.length > 0) {
          console.log('  - 매칭되는 비용귀속부서:');
          matchingCostDepts.forEach((dept, deptIndex) => {
            console.log(`    ${deptIndex + 1}. ${dept.department}: ${dept.amount}원 (${dept.ratio}%)`);
          });
        } else {
          console.log('  - 매칭되는 비용귀속부서 없음');
        }
      });
    }
    
  } catch (error) {
    console.log('❌ 오류 발생:');
    if (error.response) {
      console.log('응답 상태:', error.response.status);
      console.log('오류 데이터:', error.response.data);
    } else {
      console.log('네트워크 오류:', error.message);
    }
  }
}

checkCostDeptData(); 