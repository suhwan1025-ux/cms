const axios = require('axios');

async function testContractDetail() {
  try {
    console.log('🔍 품의서 상세보기 데이터 테스트 시작...\n');
    
    // 품의서 목록 조회
    const listResponse = await axios.get('http://localhost:3001/api/proposals');
    const proposals = listResponse.data;
    
    console.log(`📋 총 품의서 개수: ${proposals.length}`);
    
    // 비용분배 정보가 있는 품의서 찾기
    const proposalsWithCostData = [187, 188, 189, 190, 191, 192, 197, 198];
    const testProposal = proposals.find(p => 
      proposalsWithCostData.includes(p.id) && p.purchaseItems && p.purchaseItems.length > 0
    );
    
    if (!testProposal) {
      console.log('❌ 테스트할 품의서를 찾을 수 없습니다.');
      return;
    }
    
    console.log(`🎯 테스트 대상 품의서: ${testProposal.purpose} (ID: ${testProposal.id})`);
    
    // ContractList에서 사용하는 형태로 데이터 변환
    const formattedContract = {
      id: testProposal.id,
      title: testProposal.purpose,
      type: testProposal.contractType === 'purchase' ? '구매계약' : 
            testProposal.contractType === 'service' ? '용역계약' : 
            testProposal.contractType === 'change' ? '변경계약' : 
            testProposal.contractType === 'extension' ? '연장계약' : '입찰계약',
      purpose: testProposal.purpose,
      basis: testProposal.basis,
      budget: testProposal.budget,
      contractMethod: testProposal.contractMethod,
      accountSubject: testProposal.accountSubject,
      requestDepartments: testProposal.requestDepartments || [],
      items: testProposal.purchaseItems?.map(item => ({
        item: item.item,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        supplier: item.supplier,
        // 비용분배 정보 포함
        costAllocations: item.costAllocations || []
      })) || []
    };
    
    console.log('\n=== ContractList 형태로 변환된 데이터 ===');
    console.log('품의서 정보:', {
      id: formattedContract.id,
      title: formattedContract.title,
      type: formattedContract.type,
      itemsCount: formattedContract.items.length
    });
    
    console.log('\n구매품목 및 비용분배 정보:');
    formattedContract.items.forEach((item, index) => {
      console.log(`\n구매품목 ${index + 1}: ${item.item}`);
      console.log(`  - 제품명: ${item.productName}`);
      console.log(`  - 수량: ${item.quantity}`);
      console.log(`  - 단가: ${item.unitPrice}`);
      console.log(`  - 공급업체: ${item.supplier}`);
      console.log(`  - 비용분배 개수: ${item.costAllocations.length}`);
      
      if (item.costAllocations.length > 0) {
        item.costAllocations.forEach((alloc, allocIndex) => {
          console.log(`    분배 ${allocIndex + 1}:`, {
            department: alloc.department,
            type: alloc.type,
            value: alloc.value,
            amount: alloc.amount
          });
        });
      } else {
        console.log('    비용분배 정보 없음');
      }
    });
    
    // 비용귀속분배 정보 섹션 테스트
    console.log('\n=== 비용귀속분배 섹션 데이터 ===');
    const costAllocations = [];
    if (formattedContract.items && formattedContract.items.length > 0) {
      formattedContract.items.forEach((item, itemIndex) => {
        if (item.costAllocations && item.costAllocations.length > 0) {
          item.costAllocations.forEach(alloc => {
            costAllocations.push({
              itemName: item.item,
              productName: item.productName,
              department: alloc.department,
              type: alloc.type,
              value: alloc.value,
              amount: alloc.amount
            });
          });
        }
      });
    }
    
    console.log(`총 비용분배 항목 수: ${costAllocations.length}`);
    costAllocations.forEach((alloc, index) => {
      console.log(`${index + 1}. ${alloc.itemName} (${alloc.productName}) → ${alloc.department}: ${alloc.type === 'percentage' ? alloc.value + '%' : alloc.value + '원'} (${alloc.amount}원)`);
    });
    
    console.log('\n✅ 품의서 상세보기 데이터 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  testContractDetail();
}

module.exports = testContractDetail; 