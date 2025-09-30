const axios = require('axios');

async function testRecycleData() {
  try {
    console.log('🔍 재활용 데이터 테스트 시작...\n');
    
    // 먼저 모든 품의서 목록을 가져와서 테스트할 품의서 찾기
    const listResponse = await axios.get('http://localhost:3001/api/proposals');
    const proposals = listResponse.data;
    
    console.log(`📋 총 품의서 개수: ${proposals.length}`);
    
    // 구매품목이 있는 품의서 찾기 (비용분배 정보가 있는 품의서 우선)
    const proposalsWithCostData = [187, 188, 189, 190, 191, 192, 197, 198]; // 비용분배가 있는 품의서 ID들
    let proposalWithPurchaseItems = proposals.find(p => 
      proposalsWithCostData.includes(p.id) && p.purchaseItems && p.purchaseItems.length > 0
    );
    
    // 비용분배가 있는 품의서가 없으면 일반 구매품목이 있는 품의서 찾기
    if (!proposalWithPurchaseItems) {
      proposalWithPurchaseItems = proposals.find(p => 
        p.purchaseItems && p.purchaseItems.length > 0
      );
    }
    
    if (!proposalWithPurchaseItems) {
      console.log('❌ 구매품목이 있는 품의서를 찾을 수 없습니다.');
      return;
    }
    
    console.log(`🎯 테스트 대상 품의서: ${proposalWithPurchaseItems.purpose} (ID: ${proposalWithPurchaseItems.id})`);
    
    // 해당 품의서의 상세 정보 조회
    const detailResponse = await axios.get(`http://localhost:3001/api/proposals/${proposalWithPurchaseItems.id}`);
    const proposalDetail = detailResponse.data;
    
    console.log('\n=== 서버에서 받은 원본 데이터 ===');
    console.log('품의서 키들:', Object.keys(proposalDetail));
    console.log('구매품목 개수:', proposalDetail.purchaseItems?.length || 0);
    
    if (proposalDetail.purchaseItems) {
      proposalDetail.purchaseItems.forEach((item, index) => {
        console.log(`\n구매품목 ${index + 1}: ${item.item}`);
        console.log('  - 품목 키들:', Object.keys(item));
        console.log('  - costAllocations 존재:', !!item.costAllocations);
        console.log('  - costAllocations 개수:', item.costAllocations?.length || 0);
        if (item.costAllocations && item.costAllocations.length > 0) {
          item.costAllocations.forEach((alloc, allocIndex) => {
            console.log(`    할당 ${allocIndex + 1}:`, alloc);
          });
        }
      });
    }
    
    console.log('\n=== 재활용 데이터 변환 테스트 ===');
    
    // 재활용 데이터 변환 (실제 재활용 함수와 동일한 로직)
    const recycleData = {
      contractType: proposalDetail.contractType,
      purpose: `[재활용] ${proposalDetail.purpose || ''}`,
      basis: proposalDetail.basis || '',
      budget: proposalDetail.budgetId || proposalDetail.budget || '',
      contractMethod: proposalDetail.contractMethod || '',
      accountSubject: proposalDetail.accountSubject || '',
      requestDepartments: (proposalDetail.requestDepartments || []).map(dept => 
        typeof dept === 'string' ? dept : dept.name || dept
      ),
      purchaseItems: (proposalDetail.purchaseItems || []).map(item => ({
        id: Date.now() + Math.random(),
        item: item.item || '',
        productName: item.productName || '',
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        amount: item.amount || 0,
        supplier: item.supplier || '',
        requestDepartments: item.requestDepartments || [],
        costAllocation: {
          type: 'percentage',
          allocations: (item.costAllocations || []).map(alloc => ({
            id: Date.now() + Math.random(),
            department: alloc.department || '',
            type: alloc.type || 'percentage',
            value: parseFloat(alloc.value) || 0
          }))
        }
      }))
    };
    
    console.log('변환된 구매품목 비용분배 정보:');
    recycleData.purchaseItems.forEach((item, index) => {
      console.log(`\n구매품목 ${index + 1}: ${item.item}`);
      console.log('  - costAllocation 존재:', !!item.costAllocation);
      console.log('  - allocations 개수:', item.costAllocation?.allocations?.length || 0);
      if (item.costAllocation?.allocations && item.costAllocation.allocations.length > 0) {
        item.costAllocation.allocations.forEach((alloc, allocIndex) => {
          console.log(`    할당 ${allocIndex + 1}:`, alloc);
        });
      }
    });
    
    console.log('\n✅ 재활용 데이터 테스트 완료!');
    
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
  testRecycleData();
}

module.exports = testRecycleData; 