const axios = require('axios');

console.log('=== 계약기간 날짜 필드 임시저장 테스트 ===');

const testData = {
  contractType: 'purchase',
  purpose: '계약기간 날짜 테스트',
  basis: '테스트용',
  budget: 1,
  contractMethod: 'direct',
  accountSubject: '테스트계정',
  totalAmount: 1000000,
  purchaseItems: [
    {
      id: Date.now(),
      item: '테스트 소프트웨어',
      productName: '테스트 제품',
      quantity: 1,
      unitPrice: 500000,
      amount: 500000,
      supplier: '테스트 공급업체',
      contractPeriodType: 'custom',
      contractStartDate: '2025-01-01',
      contractEndDate: '2025-12-31',
      costAllocation: {
        type: 'percentage',
        allocations: []
      }
    },
    {
      id: Date.now() + 1,
      item: '영구 라이선스',
      productName: '영구 제품',
      quantity: 1,
      unitPrice: 500000,
      amount: 500000,
      supplier: '영구 공급업체',
      contractPeriodType: 'permanent',
      contractStartDate: '',
      contractEndDate: '',
      costAllocation: {
        type: 'percentage',
        allocations: []
      }
    }
  ],
  serviceItems: [],
  costDepartments: [
    {
      department: 'IT개발팀',
      amount: 1000000,
      ratio: 100,
      allocationType: 'percentage'
    }
  ],
  approvalLines: [],
  requestDepartments: []
};

async function testContractPeriodDates() {
  try {
    console.log('\n🔄 임시저장 테스트 시작...');
    
    // 임시저장 요청
    const response = await axios.post('http://localhost:3001/api/proposals/draft', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ 임시저장 성공!');
    console.log('📄 서버 응답:', JSON.stringify(response.data, null, 2));
    console.log('📄 저장된 품의서 ID:', response.data.proposal?.id || response.data.id || response.data.proposalId);

    // 저장된 데이터 조회
    const proposalId = response.data.proposal?.id || response.data.id || response.data.proposalId;
    if (proposalId) {
      console.log('\n🔍 저장된 데이터 조회 중...');
      
      const getResponse = await axios.get(`http://localhost:3001/api/proposals/${proposalId}`);
      
      console.log('\n📊 저장된 구매품목 데이터:');
      if (getResponse.data.purchaseItems) {
        getResponse.data.purchaseItems.forEach((item, index) => {
          console.log(`\n품목 ${index + 1}:`);
          console.log(`  - 품목명: ${item.item}`);
          console.log(`  - 계약기간 타입: ${item.contractPeriodType}`);
          console.log(`  - 계약 시작일: ${item.contractStartDate}`);
          console.log(`  - 계약 종료일: ${item.contractEndDate}`);
        });
      }

      // 예상 결과와 비교
      console.log('\n🔍 검증 결과:');
      const firstItem = getResponse.data.purchaseItems?.[0];
      const secondItem = getResponse.data.purchaseItems?.[1];

      if (firstItem) {
        const startDateCorrect = firstItem.contractStartDate === '2025-01-01';
        const endDateCorrect = firstItem.contractEndDate === '2025-12-31';
        const typeCorrect = firstItem.contractPeriodType === 'custom';
        
        console.log(`첫 번째 품목 (직접입력):`);
        console.log(`  ✅ 계약기간 타입: ${typeCorrect ? '정상' : '오류'} (${firstItem.contractPeriodType})`);
        console.log(`  ${startDateCorrect ? '✅' : '❌'} 시작일: ${startDateCorrect ? '정상' : '오류'} (${firstItem.contractStartDate})`);
        console.log(`  ${endDateCorrect ? '✅' : '❌'} 종료일: ${endDateCorrect ? '정상' : '오류'} (${firstItem.contractEndDate})`);
      }

      if (secondItem) {
        const typeCorrect = secondItem.contractPeriodType === 'permanent';
        const startDateEmpty = !secondItem.contractStartDate;
        const endDateEmpty = !secondItem.contractEndDate;
        
        console.log(`두 번째 품목 (영구):`);
        console.log(`  ✅ 계약기간 타입: ${typeCorrect ? '정상' : '오류'} (${secondItem.contractPeriodType})`);
        console.log(`  ${startDateEmpty ? '✅' : '❌'} 시작일 비어있음: ${startDateEmpty ? '정상' : '오류'} (${secondItem.contractStartDate})`);
        console.log(`  ${endDateEmpty ? '✅' : '❌'} 종료일 비어있음: ${endDateEmpty ? '정상' : '오류'} (${secondItem.contractEndDate})`);
      }
    }

  } catch (error) {
    console.error('❌ 테스트 실패:', error.response?.data || error.message);
  }
}

testContractPeriodDates(); 