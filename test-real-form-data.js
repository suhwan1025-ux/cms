const axios = require('axios');

async function testRealFormData() {
  try {
    console.log('=== 실제 폼 데이터 시뮬레이션 테스트 ===');

    // ProposalForm.js에서 생성되는 실제 데이터 형식
    const testData = {
      contractType: 'purchase',
      purpose: '실제 폼 데이터 테스트',
      basis: '실제 폼 데이터 테스트 근거',
      budget: 1,
      contractMethod: '일반계약',
      accountSubject: '일반관리비',
      totalAmount: 5000000,
      createdBy: '테스트사용자',

      // 구매품목 (ProposalForm.js에서 생성되는 형식)
      purchaseItems: [
        {
          item: '첫 번째 구매품목',
          productName: '첫 번째 제품',
          quantity: 1,
          unitPrice: 1000000,
          amount: 1000000,
          supplier: '첫 번째 공급업체',
          requestDepartment: 'IT개발팀',
          costAllocation: {
            allocations: [
              {
                department: 'IT개발팀',
                type: 'percentage',
                value: 50
              },
              {
                department: '경영관리팀',
                type: 'percentage',
                value: 30
              },
              {
                department: '마케팅팀',
                type: 'percentage',
                value: 20
              }
            ]
          }
        },
        {
          item: '두 번째 구매품목',
          productName: '두 번째 제품',
          quantity: 1,
          unitPrice: 1500000,
          amount: 1500000,
          supplier: '두 번째 공급업체',
          requestDepartment: '마케팅팀',
          costAllocation: {
            allocations: [
              {
                department: '마케팅팀',
                type: 'percentage',
                value: 60
              },
              {
                department: '영업팀',
                type: 'percentage',
                value: 25
              },
              {
                department: 'IT개발팀',
                type: 'percentage',
                value: 15
              }
            ]
          }
        },
        {
          item: '세 번째 구매품목',
          productName: '세 번째 제품',
          quantity: 1,
          unitPrice: 2500000,
          amount: 2500000,
          supplier: '세 번째 공급업체',
          requestDepartment: '영업팀',
          costAllocation: {
            allocations: [
              {
                department: '영업팀',
                type: 'percentage',
                value: 40
              },
              {
                department: '경영관리팀',
                type: 'percentage',
                value: 35
              },
              {
                department: 'IT개발팀',
                type: 'percentage',
                value: 25
              }
            ]
          }
        }
      ],

      // ProposalForm.js에서 생성되는 purchaseItemCostAllocations
      purchaseItemCostAllocations: [
        // 첫 번째 구매품목의 비용분배
        {
          itemIndex: 0,
          itemName: '첫 번째 구매품목',
          department: 'IT개발팀',
          type: 'percentage',
          value: 50,
          amount: 1000000
        },
        {
          itemIndex: 0,
          itemName: '첫 번째 구매품목',
          department: '경영관리팀',
          type: 'percentage',
          value: 30,
          amount: 1000000
        },
        {
          itemIndex: 0,
          itemName: '첫 번째 구매품목',
          department: '마케팅팀',
          type: 'percentage',
          value: 20,
          amount: 1000000
        },
        // 두 번째 구매품목의 비용분배
        {
          itemIndex: 1,
          itemName: '두 번째 구매품목',
          department: '마케팅팀',
          type: 'percentage',
          value: 60,
          amount: 1500000
        },
        {
          itemIndex: 1,
          itemName: '두 번째 구매품목',
          department: '영업팀',
          type: 'percentage',
          value: 25,
          amount: 1500000
        },
        {
          itemIndex: 1,
          itemName: '두 번째 구매품목',
          department: 'IT개발팀',
          type: 'percentage',
          value: 15,
          amount: 1500000
        },
        // 세 번째 구매품목의 비용분배
        {
          itemIndex: 2,
          itemName: '세 번째 구매품목',
          department: '영업팀',
          type: 'percentage',
          value: 40,
          amount: 2500000
        },
        {
          itemIndex: 2,
          itemName: '세 번째 구매품목',
          department: '경영관리팀',
          type: 'percentage',
          value: 35,
          amount: 2500000
        },
        {
          itemIndex: 2,
          itemName: '세 번째 구매품목',
          department: 'IT개발팀',
          type: 'percentage',
          value: 25,
          amount: 2500000
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
        },
        {
          name: '영업팀',
          code: 'SL001'
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

    console.log('1. 전송할 데이터:');
    console.log('purchaseItemCostAllocations 개수:', testData.purchaseItemCostAllocations.length);
    testData.purchaseItemCostAllocations.forEach((alloc, index) => {
      console.log(`  ${index + 1}. ${alloc.itemName} - ${alloc.department}: ${alloc.value}%`);
    });

    console.log('\n2. 서버로 데이터 전송 중...');
    const createResponse = await axios.post('http://localhost:3001/api/proposals/draft', testData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('생성 성공:', createResponse.data);
    const proposalId = createResponse.data.proposalId;

    // 3. 생성된 데이터 조회
    console.log('\n3. 생성된 데이터 조회...');
    const getResponse = await axios.get(`http://localhost:3001/api/proposals/${proposalId}`);
    const savedData = getResponse.data;

    console.log('저장된 비용귀속부서:', JSON.stringify(savedData.costDepartments, null, 2));
    console.log('비용귀속부서 개수:', savedData.costDepartments?.length || 0);

    // 4. 예상 결과 계산
    console.log('\n4. 예상 결과 계산:');
    const expectedAllocations = {
      'IT개발팀': (1000000 * 0.50) + (1500000 * 0.15) + (2500000 * 0.25), // 500000 + 225000 + 625000 = 1350000
      '경영관리팀': (1000000 * 0.30) + (2500000 * 0.35), // 300000 + 875000 = 1175000
      '마케팅팀': (1000000 * 0.20) + (1500000 * 0.60), // 200000 + 900000 = 1100000
      '영업팀': (1500000 * 0.25) + (2500000 * 0.40) // 375000 + 1000000 = 1375000
    };

    console.log('예상 비용분배:');
    Object.entries(expectedAllocations).forEach(([dept, amount]) => {
      console.log(`  ${dept}: ${amount.toLocaleString()}원`);
    });

    // 5. 실제 저장된 결과와 비교
    console.log('\n5. 실제 저장된 결과와 비교:');
    if (savedData.costDepartments && savedData.costDepartments.length > 0) {
      const actualAllocations = {};
      
      savedData.costDepartments.forEach(dept => {
        if (!actualAllocations[dept.department]) {
          actualAllocations[dept.department] = 0;
        }
        actualAllocations[dept.department] += parseFloat(dept.amount);
      });

      console.log('실제 비용분배:');
      Object.entries(actualAllocations).forEach(([dept, amount]) => {
        const expected = expectedAllocations[dept] || 0;
        const difference = Math.abs(amount - expected);
        const isCorrect = difference < 1; // 1원 이하 차이는 정상으로 간주
        console.log(`  ${dept}: ${amount.toLocaleString()}원 ${isCorrect ? '✅' : '❌'} (예상: ${expected.toLocaleString()}원)`);
      });

      // 6. 구매품목별 비용분배 검증
      console.log('\n6. 구매품목별 비용분배 검증:');
      const itemAllocations = {};
      savedData.costDepartments.forEach(dept => {
        if (dept.purchaseItemId) {
          if (!itemAllocations[dept.purchaseItemId]) {
            itemAllocations[dept.purchaseItemId] = [];
          }
          itemAllocations[dept.purchaseItemId].push(dept);
        }
      });

      Object.keys(itemAllocations).forEach(itemId => {
        const purchaseItem = savedData.purchaseItems.find(item => item.id == itemId);
        console.log(`구매품목 "${purchaseItem?.item}" (ID: ${itemId}):`);
        itemAllocations[itemId].forEach(alloc => {
          console.log(`  - ${alloc.department}: ${alloc.amount}원 (${alloc.ratio}%)`);
        });
      });

    } else {
      console.log('❌ 비용귀속부서 정보가 저장되지 않았습니다.');
    }

    console.log('\n✅ 테스트 완료!');

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

testRealFormData(); 