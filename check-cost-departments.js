const axios = require('axios');

async function checkCostDepartments() {
  try {
    console.log('=== 비용귀속부서 정보 확인 ===');
    
    const proposalId = 78; // 최근 생성된 품의서 ID
    
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

checkCostDepartments(); 