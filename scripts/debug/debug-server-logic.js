const axios = require('axios');

async function debugServerLogic() {
  try {
    console.log('=== 서버 로직 디버깅 ===');

    // 최근 품의서 조회
    const listResponse = await axios.get('http://localhost:3001/api/proposals');
    const proposals = listResponse.data;
    
    if (proposals.length === 0) {
      console.log('품의서가 없습니다.');
      return;
    }

    const latestProposal = proposals[proposals.length - 1];
    console.log('최근 품의서 ID:', latestProposal.id);

    // 품의서 상세 조회
    const getResponse = await axios.get(`http://localhost:3001/api/proposals/${latestProposal.id}`);
    const proposalData = getResponse.data;

    console.log('\n=== 서버 응답 데이터 ===');
    console.log('구매품목:', JSON.stringify(proposalData.purchaseItems, null, 2));
    console.log('\n비용귀속부서:', JSON.stringify(proposalData.costDepartments, null, 2));

    // 구매품목별 비용분배 매핑 확인
    console.log('\n=== 구매품목별 비용분배 매핑 ===');
    if (proposalData.purchaseItems && proposalData.costDepartments) {
      proposalData.purchaseItems.forEach(purchaseItem => {
        const itemCostAllocations = proposalData.costDepartments.filter(dept => 
          dept.purchaseItemId === purchaseItem.id
        );
        
        console.log(`구매품목 "${purchaseItem.item}" (ID: ${purchaseItem.id}):`);
        console.log(`  - 매칭된 비용분배 개수: ${itemCostAllocations.length}`);
        itemCostAllocations.forEach(alloc => {
          console.log(`    - ${alloc.department}: ${alloc.amount}원 (${alloc.ratio}%)`);
        });
      });
    }

    // 서버 로직 시뮬레이션
    console.log('\n=== 서버 로직 시뮬레이션 ===');
    const proposalDataCopy = JSON.parse(JSON.stringify(proposalData));
    
    // 각 구매품목에 비용분배 정보 추가
    if (proposalDataCopy.purchaseItems) {
      proposalDataCopy.purchaseItems.forEach(purchaseItem => {
        // 해당 구매품목의 비용분배 정보 찾기
        const itemCostAllocations = proposalDataCopy.costDepartments.filter(dept => 
          dept.purchaseItemId === purchaseItem.id
        );
        
        console.log(`구매품목 "${purchaseItem.item}" (ID: ${purchaseItem.id}):`);
        console.log(`  - 찾은 비용분배 개수: ${itemCostAllocations.length}`);
        
        // costAllocations 필드 추가
        purchaseItem.costAllocations = itemCostAllocations.map(dept => ({
          department: dept.department,
          type: dept.allocationType || 'percentage',
          value: dept.ratio,
          amount: dept.amount
        }));
        
        console.log(`  - 추가된 costAllocations 개수: ${purchaseItem.costAllocations.length}`);
      });
    }

    console.log('\n=== 최종 결과 ===');
    proposalDataCopy.purchaseItems.forEach((item, index) => {
      console.log(`구매품목 ${index + 1} (${item.item}):`);
      console.log(`  - costAllocations 개수: ${item.costAllocations?.length || 0}`);
      if (item.costAllocations) {
        item.costAllocations.forEach(alloc => {
          console.log(`    - ${alloc.department}: ${alloc.value}%`);
        });
      }
    });

    console.log('\n✅ 서버 로직 디버깅 완료!');

  } catch (error) {
    console.log('❌ 오류 발생:', error.message);
  }
}

debugServerLogic(); 