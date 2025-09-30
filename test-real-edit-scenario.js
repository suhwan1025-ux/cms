const axios = require('axios');

async function testRealEditScenario() {
  try {
    console.log('=== 실제 편집 시나리오 테스트 ===');

    // 1. 실제 폼 데이터로 품의서 생성
    const testData = {
      contractType: 'purchase',
      purpose: '실제 편집 테스트',
      basis: '실제 편집 테스트 근거',
      budget: 1,
      contractMethod: '일반계약',
      accountSubject: '일반관리비',
      totalAmount: 3000000,
      createdBy: '테스트사용자',

      // 구매품목 (비용분배 포함)
      purchaseItems: [
        {
          item: '첫 번째 품목',
          productName: '첫 번째 제품',
          quantity: 1,
          unitPrice: 1500000,
          amount: 1500000,
          supplier: '테스트 공급업체1',
          requestDepartment: 'IT개발팀',
          costAllocation: {
            allocations: [
              {
                department: 'IT개발팀',
                type: 'percentage',
                value: 60
              },
              {
                department: '경영관리팀',
                type: 'percentage',
                value: 40
              }
            ]
          }
        },
        {
          item: '두 번째 품목',
          productName: '두 번째 제품',
          quantity: 1,
          unitPrice: 1500000,
          amount: 1500000,
          supplier: '테스트 공급업체2',
          requestDepartment: '마케팅팀',
          costAllocation: {
            allocations: [
              {
                department: '마케팅팀',
                type: 'percentage',
                value: 70
              },
              {
                department: '영업팀',
                type: 'percentage',
                value: 30
              }
            ]
          }
        }
      ],

      // 구매품목별 비용분배 정보를 별도로 전송 (실제 ProposalForm.js에서 생성되는 형태)
      purchaseItemCostAllocations: [
        {
          itemIndex: 0,
          itemName: '첫 번째 품목',
          department: 'IT개발팀',
          type: 'percentage',
          value: 60,
          amount: 1500000
        },
        {
          itemIndex: 0,
          itemName: '첫 번째 품목',
          department: '경영관리팀',
          type: 'percentage',
          value: 40,
          amount: 1500000
        },
        {
          itemIndex: 1,
          itemName: '두 번째 품목',
          department: '마케팅팀',
          type: 'percentage',
          value: 70,
          amount: 1500000
        },
        {
          itemIndex: 1,
          itemName: '두 번째 품목',
          department: '영업팀',
          type: 'percentage',
          value: 30,
          amount: 1500000
        }
      ],

      // 요청부서
      requestDepartments: [
        {
          name: 'IT개발팀',
          code: 'IT001'
        },
        {
          name: '마케팅팀',
          code: 'MK001'
        }
      ],

      // 결재라인
      approvalLine: [
        {
          step: 1,
          name: '요청부서',
          title: '담당자',
          description: '품의서 작성 및 검토'
        }
      ]
    };

    console.log('1. 실제 폼 데이터로 품의서 생성 중...');
    const createResponse = await axios.post('http://localhost:3001/api/proposals/draft', testData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('생성 성공:', createResponse.data);
    const proposalId = createResponse.data.proposalId;

    // 2. 편집 모드에서 데이터 조회 (실제 DraftList.js에서 ProposalForm.js로 전달되는 형태)
    console.log('\n2. 편집 모드 데이터 조회...');
    const getResponse = await axios.get(`http://localhost:3001/api/proposals/${proposalId}`);
    const savedData = getResponse.data;

    console.log('서버에서 받은 데이터:');
    console.log('- 구매품목 개수:', savedData.purchaseItems?.length || 0);
    console.log('- 비용귀속부서 개수:', savedData.costDepartments?.length || 0);

    // 3. 편집 모드에서 복원되는 데이터 시뮬레이션 (실제 ProposalForm.js의 fetchData 로직)
    console.log('\n3. 편집 모드 데이터 복원 시뮬레이션...');
    const restoredPurchaseItems = (savedData.purchaseItems || []).map(item => ({
      item: item.item || '',
      productName: item.productName || '',
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      amount: item.amount || 0,
      supplier: item.supplier || '',
      requestDepartment: item.requestDepartment || '',
      // 서버에서 받은 costAllocations 정보 사용 (실제 ProposalForm.js 로직)
      costAllocation: (() => {
        if (item.costAllocations && item.costAllocations.length > 0) {
          console.log(`구매품목 "${item.item}" 비용분배 정보 복원:`, item.costAllocations);
          return {
            allocations: item.costAllocations.map(alloc => ({
              department: alloc.department,
              type: alloc.type || 'percentage',
              value: alloc.value || alloc.ratio || 0
            }))
          };
        }
        
        console.log(`구매품목 "${item.item}" 비용분배 정보 없음`);
        return { allocations: [] };
      })()
    }));

    console.log('\n복원된 구매품목:');
    restoredPurchaseItems.forEach((item, index) => {
      console.log(`구매품목 ${index + 1} (${item.item}):`);
      console.log(`  - 금액: ${item.amount}원`);
      console.log(`  - 비용분배 개수: ${item.costAllocation?.allocations?.length || 0}`);
      if (item.costAllocation && item.costAllocation.allocations) {
        item.costAllocation.allocations.forEach(alloc => {
          console.log(`    - ${alloc.department}: ${alloc.value}%`);
        });
      }
    });

    // 4. 자동합산 검증
    console.log('\n4. 자동합산 검증:');
    const totalAllocation = {};
    restoredPurchaseItems.forEach(item => {
      if (item.costAllocation && item.costAllocation.allocations) {
        item.costAllocation.allocations.forEach(alloc => {
          if (!totalAllocation[alloc.department]) {
            totalAllocation[alloc.department] = 0;
          }
          totalAllocation[alloc.department] += (item.amount * (alloc.value / 100));
        });
      }
    });

    console.log('자동합산 결과:');
    Object.entries(totalAllocation).forEach(([dept, amount]) => {
      console.log(`  ${dept}: ${amount.toLocaleString()}원`);
    });

    // 5. 비용귀속부서 배분 섹션 검증
    console.log('\n5. 비용귀속부서 배분 섹션 검증:');
    const costDepartments = (savedData.costDepartments || []).filter(dept => !dept.purchaseItemId);
    console.log('상위 비용귀속부서 배분:', costDepartments.length, '개');
    costDepartments.forEach(dept => {
      console.log(`  - ${dept.department}: ${dept.amount}원 (${dept.ratio}%)`);
    });

    console.log('\n✅ 실제 편집 시나리오 테스트 완료!');

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

testRealEditScenario(); 