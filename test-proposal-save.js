const axios = require('axios');

async function testProposalSave() {
  try {
    console.log('🧪 작성완료 API 테스트 시작...\n');
    
    // 테스트 데이터 (작성완료용)
    const testData = {
      contractType: 'purchase',
      purpose: '테스트 품의서 - 작성완료',
      basis: '테스트 계약 근거',
      budget: '1', // 예산 ID
      contractMethod: '일반경쟁입찰',
      accountSubject: '테스트 계정과목',
      totalAmount: 1000000,
      requestDepartments: ['IT부서'],
      purchaseItems: [
        {
          item: '테스트 품목',
          productName: '테스트 제품',
          quantity: 1,
          unitPrice: 1000000,
          amount: 1000000,
          supplier: '테스트 공급업체',
          costAllocation: {
            type: 'percentage',
            allocations: [
              {
                id: Date.now(),
                department: 'IT부서',
                type: 'percentage',
                value: 100
              }
            ]
          }
        }
      ],
      serviceItems: [],
      suppliers: [],
      changeReason: '',
      extensionReason: '',
      beforeItems: [],
      afterItems: [],
      contractPeriod: '',
      paymentMethod: '',
      biddingType: '',
      qualificationRequirements: '',
      evaluationCriteria: '',
      priceComparison: [],
      createdBy: '테스트사용자',
      isDraft: false, // 작성완료
      status: 'submitted', // 검토중
      purchaseItemCostAllocations: [
        {
          itemIndex: 0,
          allocationIndex: 0,
          department: 'IT부서',
          type: 'percentage',
          value: 100,
          amount: 1000000,
          itemName: '테스트 품목',
          productName: '테스트 제품'
        }
      ]
    };
    
    console.log('📤 작성완료 API 호출...');
    console.log('전송 데이터:', {
      isDraft: testData.isDraft,
      status: testData.status,
      purpose: testData.purpose,
      purchaseItemCostAllocations: testData.purchaseItemCostAllocations.length
    });
    
    // POST 요청 (신규 작성완료)
    const response = await axios.post('http://localhost:3001/api/proposals', testData);
    
    console.log('✅ 작성완료 API 응답:', response.data);
    
    if (response.data.proposalId) {
      console.log(`\n🔍 생성된 품의서 상세 조회 (ID: ${response.data.proposalId})`);
      
      // 상세 조회
      const detailResponse = await axios.get(`http://localhost:3001/api/proposals/${response.data.proposalId}`);
      const proposal = detailResponse.data;
      
      console.log('📋 품의서 기본 정보:', {
        id: proposal.id,
        purpose: proposal.purpose,
        isDraft: proposal.isDraft,
        status: proposal.status,
        contractType: proposal.contractType
      });
      
      console.log('🛒 구매품목 정보:', proposal.purchaseItems?.map(item => ({
        item: item.item,
        productName: item.productName,
        costAllocations: item.costAllocations?.length || 0
      })));
      
      console.log('💰 비용분배 정보:', proposal.costDepartments?.map(dept => ({
        department: dept.department,
        purchaseItemId: dept.purchaseItemId,
        ratio: dept.ratio,
        allocationValue: dept.allocationValue,
        amount: dept.amount
      })));
      
      // 구매품목별 비용분배 확인
      if (proposal.purchaseItems && proposal.purchaseItems.length > 0) {
        proposal.purchaseItems.forEach((item, index) => {
          console.log(`\n📦 구매품목 ${index + 1}: ${item.item}`);
          console.log('  비용분배:', item.costAllocations || []);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.response?.data || error.message);
  }
}

testProposalSave(); 