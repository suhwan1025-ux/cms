const axios = require('axios');

async function testRealtimeCalculation() {
  try {
    console.log('=== 실시간 자동합산 기능 테스트 ===');

    // 1. 테스트 데이터 생성 (구매품목에 비용분배 정보 포함)
    const testData = {
      contractType: 'purchase',
      purpose: '실시간 자동합산 테스트',
      basis: '테스트 목적',
      budget: 1000000,
      contractMethod: '일반계약',
      accountSubject: '테스트 계정과목',
      requestDepartments: ['IT개발팀'],
      purchaseItems: [
        {
          item: '첫 번째 품목',
          productName: '테스트 제품 1',
          quantity: 1,
          unitPrice: 500000,
          amount: 500000,
          supplier: '테스트 공급업체',
          requestDepartment: 'IT개발팀',
          costAllocation: {
            allocations: [
              { department: 'IT개발팀', type: 'percentage', value: 60 },
              { department: '경영관리팀', type: 'percentage', value: 40 }
            ]
          }
        },
        {
          item: '두 번째 품목',
          productName: '테스트 제품 2',
          quantity: 1,
          unitPrice: 300000,
          amount: 300000,
          supplier: '테스트 공급업체',
          requestDepartment: 'IT개발팀',
          costAllocation: {
            allocations: [
              { department: 'IT개발팀', type: 'percentage', value: 50 },
              { department: '경영관리팀', type: 'percentage', value: 50 }
            ]
          }
        }
      ],
      costDepartments: [], // 수동 입력 없음
      createdBy: '시스템관리자',
      isDraft: true
    };

    console.log('1. 테스트 데이터 생성 중...');
    console.log('구매품목 1:', testData.purchaseItems[0].item, '- 비용분배:', testData.purchaseItems[0].costAllocation.allocations);
    console.log('구매품목 2:', testData.purchaseItems[1].item, '- 비용분배:', testData.purchaseItems[1].costAllocation.allocations);

    // 2. 서버로 전송
    const response = await axios.post('http://localhost:3001/api/proposals/draft', testData);
    console.log('2. 서버 응답:', response.data);

    if (response.data.proposalId) {
      const proposalId = response.data.proposalId;
      console.log('생성된 품의서 ID:', proposalId);

      // 3. 편집 모드로 데이터 조회
      const getResponse = await axios.get(`http://localhost:3001/api/proposals/${proposalId}`);
      const proposalData = getResponse.data;

      console.log('\n3. 편집 모드 데이터 조회:');
      console.log('- 구매품목 개수:', proposalData.purchaseItems?.length || 0);
      console.log('- 비용귀속부서 개수:', proposalData.costDepartments?.length || 0);

      // 4. 실시간 자동합산 결과 확인
      console.log('\n4. 실시간 자동합산 결과:');
      if (proposalData.costDepartments) {
        proposalData.costDepartments.forEach((dept, index) => {
          console.log(`비용귀속부서 ${index + 1}: ${dept.department}`);
          console.log(`  - 금액: ${dept.amount}원`);
          console.log(`  - 비율: ${dept.ratio}%`);
          console.log(`  - 실시간 계산: ${dept.isCalculated ? '예' : '아니오'}`);
        });
      }

      // 5. 예상 결과와 비교
      console.log('\n5. 예상 결과와 비교:');
      const expectedResults = {
        'IT개발팀': {
          amount: (500000 * 0.6) + (300000 * 0.5), // 300000 + 150000 = 450000
          percentage: 45 // 450000 / 800000 * 100
        },
        '경영관리팀': {
          amount: (500000 * 0.4) + (300000 * 0.5), // 200000 + 150000 = 350000
          percentage: 43.75 // 350000 / 800000 * 100
        }
      };

      console.log('예상 결과:');
      Object.entries(expectedResults).forEach(([dept, result]) => {
        console.log(`  ${dept}: ${result.amount}원 (${result.percentage}%)`);
      });

      // 6. 실제 결과 확인
      const actualResults = {};
      proposalData.costDepartments?.forEach(dept => {
        actualResults[dept.department] = {
          amount: parseFloat(dept.amount),
          percentage: parseFloat(dept.ratio)
        };
      });

      console.log('\n실제 결과:');
      Object.entries(actualResults).forEach(([dept, result]) => {
        console.log(`  ${dept}: ${result.amount}원 (${result.percentage}%)`);
      });

      // 7. 정확성 검증
      let isCorrect = true;
      Object.keys(expectedResults).forEach(dept => {
        const expected = expectedResults[dept];
        const actual = actualResults[dept];
        
        if (!actual || Math.abs(actual.amount - expected.amount) > 1 || Math.abs(actual.percentage - expected.percentage) > 1) {
          isCorrect = false;
          console.log(`❌ ${dept} 결과 불일치`);
        }
      });

      if (isCorrect) {
        console.log('\n✅ 실시간 자동합산 기능이 정상적으로 작동합니다!');
      } else {
        console.log('\n❌ 실시간 자동합산 기능에 문제가 있습니다.');
      }

    } else {
      console.log('❌ 품의서 생성 실패');
    }

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  }
}

testRealtimeCalculation(); 