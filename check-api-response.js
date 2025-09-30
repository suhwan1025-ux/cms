const axios = require('axios');

async function checkApiResponse() {
  try {
    console.log('🔍 API 응답 확인 중...\n');
    
    const response = await axios.get('http://localhost:3001/api/proposals/198');
    const data = response.data;
    
    console.log('품의서 ID:', data.id);
    console.log('제목:', data.purpose);
    console.log('구매품목 개수:', data.purchaseItems?.length || 0);
    console.log('비용부서 개수:', data.costDepartments?.length || 0);
    
    if (data.purchaseItems && data.purchaseItems.length > 0) {
      console.log('\n=== 구매품목 정보 ===');
      data.purchaseItems.forEach((item, index) => {
        console.log(`\n구매품목 ${index + 1}:`);
        console.log('  - 품목:', item.item);
        console.log('  - 제품명:', item.productName);
        console.log('  - ID:', item.id);
        console.log('  - costAllocations 존재:', !!item.costAllocations);
        console.log('  - costAllocations 개수:', item.costAllocations?.length || 0);
        
        if (item.costAllocations && item.costAllocations.length > 0) {
          item.costAllocations.forEach((alloc, allocIndex) => {
            console.log(`    분배 ${allocIndex + 1}:`, alloc);
          });
        }
      });
    }
    
    if (data.costDepartments && data.costDepartments.length > 0) {
      console.log('\n=== 비용부서 정보 ===');
      data.costDepartments.forEach((dept, index) => {
        console.log(`${index + 1}. 부서: ${dept.department}, 구매품목ID: ${dept.purchaseItemId}, 비율: ${dept.ratio}%, 금액: ${dept.amount}`);
      });
    }
    
    console.log('\n✅ API 응답 확인 완료!');
    
  } catch (error) {
    console.error('❌ API 호출 실패:', error.message);
  }
}

checkApiResponse(); 