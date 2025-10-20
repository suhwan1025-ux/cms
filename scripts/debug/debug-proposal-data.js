const axios = require('axios');

async function debugProposalData() {
  try {
    console.log('=== 품의서 데이터 디버깅 ===');

    // 최근 생성된 품의서 조회
    console.log('1. 최근 품의서 목록 조회...');
    const listResponse = await axios.get('http://localhost:3001/api/proposals');
    const proposals = listResponse.data;
    
    if (proposals.length === 0) {
      console.log('품의서가 없습니다.');
      return;
    }

    // 가장 최근 품의서 선택
    const latestProposal = proposals[proposals.length - 1];
    console.log('최근 품의서 ID:', latestProposal.id);

    // 2. 품의서 상세 조회
    console.log('\n2. 품의서 상세 조회...');
    const getResponse = await axios.get(`http://localhost:3001/api/proposals/${latestProposal.id}`);
    const proposalData = getResponse.data;

    console.log('품의서 기본 정보:', {
      id: proposalData.id,
      purpose: proposalData.purpose,
      totalAmount: proposalData.totalAmount
    });

    console.log('\n구매품목 정보:');
    if (proposalData.purchaseItems) {
      proposalData.purchaseItems.forEach((item, index) => {
        console.log(`구매품목 ${index + 1}:`, {
          id: item.id,
          item: item.item,
          amount: item.amount,
          costAllocations: item.costAllocations || []
        });
      });
    }

    console.log('\n비용귀속부서 정보:');
    if (proposalData.costDepartments) {
      proposalData.costDepartments.forEach((dept, index) => {
        console.log(`비용귀속부서 ${index + 1}:`, {
          id: dept.id,
          department: dept.department,
          amount: dept.amount,
          ratio: dept.ratio,
          purchaseItemId: dept.purchaseItemId,
          allocationType: dept.allocationType
        });
      });
    }

    // 3. 구매품목별 비용분배 매핑 확인
    console.log('\n3. 구매품목별 비용분배 매핑 확인:');
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

    console.log('\n✅ 디버깅 완료!');

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

debugProposalData(); 