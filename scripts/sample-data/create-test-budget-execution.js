const { Sequelize } = require('sequelize');

// 데이터베이스 연결
const sequelize = new Sequelize(
  'contract_management',
  'postgres',
  'meritz123!',
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function createTestProposals() {
  try {
    console.log('=== 예산 집행현황 테스트를 위한 품의서 샘플 생성 ===\n');

    // 1. 기존 테스트 데이터 정리
    console.log('1. 기존 테스트 데이터 정리 중...');
    await sequelize.query('DELETE FROM cost_departments WHERE proposal_id IN (SELECT id FROM proposals WHERE status = \'approved\' AND id > 100)');
    await sequelize.query('DELETE FROM purchase_items WHERE proposal_id IN (SELECT id FROM proposals WHERE status = \'approved\' AND id > 100)');
    await sequelize.query('DELETE FROM service_items WHERE proposal_id IN (SELECT id FROM proposals WHERE status = \'approved\' AND id > 100)');
    await sequelize.query('DELETE FROM proposals WHERE status = \'approved\' AND id > 100');
    console.log('   ✅ 기존 테스트 데이터 정리 완료\n');

    // 2. 다양한 품의서 샘플 생성
    console.log('2. 다양한 품의서 샘플 생성 중...');

    const testProposals = [
      // === 예산 ID 1 (2024년 IT 시스템 구축) ===
      {
        contractType: 'purchase',
        purpose: '2025년 개발용 노트북 구매',
        basis: '개발팀 업무 효율성 향상',
        budgetId: 1,
        contractMethod: '일반계약',
        accountSubject: '전산장비',
        totalAmount: 15000000,
        status: 'approved',
        purchaseItems: [
          {
            item: '노트북',
            productName: 'MacBook Pro 16인치',
            quantity: 5,
            unitPrice: 3000000,
            amount: 15000000,
            supplier: '애플코리아',
            requestDepartment: 'IT개발팀'
          }
        ],
        costDepartments: [
          { department: 'IT개발팀', amount: 15000000, ratio: 100 }
        ]
      },

      // === 예산 ID 2 (2024년 보안 시스템 강화) ===
      {
        contractType: 'purchase',
        purpose: '2025년 보안 장비 구매',
        basis: '보안 인프라 강화',
        budgetId: 2,
        contractMethod: '일반계약',
        accountSubject: '보안장비',
        totalAmount: 45000000,
        status: 'approved',
        purchaseItems: [
          {
            item: '보안 장비',
            productName: '방화벽, IDS/IPS, VPN',
            quantity: 1,
            unitPrice: 45000000,
            amount: 45000000,
            supplier: '보안솔루션즈',
            requestDepartment: '보안팀'
          }
        ],
        costDepartments: [
          { department: '보안팀', amount: 45000000, ratio: 100 }
        ]
      },

      {
        contractType: 'service',
        purpose: '2025년 보안 컨설팅 용역',
        basis: '정보보안 강화',
        budgetId: 2,
        contractMethod: '일반계약',
        accountSubject: '용역비',
        totalAmount: 35000000,
        status: 'approved',
        serviceItems: [
          {
            item: '보안 컨설팅',
            personnel: 3,
            skillLevel: '시니어',
            period: 8,
            monthlyRate: 4000000,
            contractAmount: 35000000,
            supplier: '보안컨설팅그룹',
            creditRating: 'A'
          }
        ],
        costDepartments: [
          { department: '보안팀', amount: 35000000, ratio: 100 }
        ]
      },

      // === 예산 ID 3 (2024년 전산 운영비) ===
      {
        contractType: 'purchase',
        purpose: '2025년 사무용품 구매',
        basis: '사무환경 개선',
        budgetId: 3,
        contractMethod: '일반계약',
        accountSubject: '사무용품',
        totalAmount: 8000000,
        status: 'approved',
        purchaseItems: [
          {
            item: '사무용품',
            productName: '책상, 의자, 캐비닛',
            quantity: 1,
            unitPrice: 8000000,
            amount: 8000000,
            supplier: '오피스플러스',
            requestDepartment: '기획팀'
          }
        ],
        costDepartments: [
          { department: '기획팀', amount: 5000000, ratio: 62.5 },
          { department: '인사팀', amount: 3000000, ratio: 37.5 }
        ]
      },

      {
        contractType: 'service',
        purpose: '2025년 시스템 유지보수',
        basis: '시스템 안정성 확보',
        budgetId: 3,
        contractMethod: '일반계약',
        accountSubject: '유지보수비',
        totalAmount: 12000000,
        status: 'approved',
        serviceItems: [
          {
            item: '시스템 유지보수',
            personnel: 2,
            skillLevel: '중급',
            period: 12,
            monthlyRate: 1000000,
            contractAmount: 12000000,
            supplier: 'IT유지보수사',
            creditRating: 'B'
          }
        ],
        costDepartments: [
          { department: 'IT운영팀', amount: 12000000, ratio: 100 }
        ]
      },

      // === 예산 ID 4 (2025년 AI 시스템 도입) ===
      {
        contractType: 'bidding',
        purpose: '2025년 AI 시스템 구축',
        basis: 'AI 기술 도입',
        budgetId: 4,
        contractMethod: '입찰',
        accountSubject: '자본예산',
        totalAmount: 150000000,
        status: 'approved',
        purchaseItems: [
          {
            item: 'AI 시스템',
            productName: '머신러닝 플랫폼, GPU 서버',
            quantity: 1,
            unitPrice: 150000000,
            amount: 150000000,
            supplier: 'AI솔루션즈',
            requestDepartment: '데이터팀'
          }
        ],
        costDepartments: [
          { department: '데이터팀', amount: 90000000, ratio: 60 },
          { department: 'IT개발팀', amount: 60000000, ratio: 40 }
        ]
      },

      {
        contractType: 'service',
        purpose: '2025년 AI 컨설팅 용역',
        basis: 'AI 시스템 설계 및 구축',
        budgetId: 4,
        contractMethod: '일반계약',
        accountSubject: '용역비',
        totalAmount: 80000000,
        status: 'approved',
        serviceItems: [
          {
            item: 'AI 컨설팅',
            personnel: 4,
            skillLevel: '시니어',
            period: 18,
            monthlyRate: 4000000,
            contractAmount: 80000000,
            supplier: 'AI컨설팅그룹',
            creditRating: 'A'
          }
        ],
        costDepartments: [
          { department: '데이터팀', amount: 50000000, ratio: 62.5 },
          { department: 'IT개발팀', amount: 30000000, ratio: 37.5 }
        ]
      },

      // === 예산 ID 1 (2024년 IT 시스템 구축) - 추가 ===
      {
        contractType: 'service',
        purpose: '2025년 시스템 통합 개발 용역',
        basis: '업무 시스템 통합',
        budgetId: 1,
        contractMethod: '일반계약',
        accountSubject: '용역비',
        totalAmount: 50000000,
        status: 'approved',
        serviceItems: [
          {
            item: '시스템 개발',
            personnel: 5,
            skillLevel: '시니어',
            period: 12,
            monthlyRate: 4000000,
            contractAmount: 50000000,
            supplier: '시스템개발사',
            creditRating: 'A'
          }
        ],
        costDepartments: [
          { department: 'IT개발팀', amount: 30000000, ratio: 60 },
          { department: 'IT운영팀', amount: 20000000, ratio: 40 }
        ]
      },

      {
        contractType: 'bidding',
        purpose: '2025년 클라우드 인프라 구축',
        basis: '클라우드 마이그레이션',
        budgetId: 1,
        contractMethod: '입찰',
        accountSubject: '자본예산',
        totalAmount: 200000000,
        status: 'approved',
        purchaseItems: [
          {
            item: '클라우드 서비스',
            productName: 'AWS, Azure 인프라',
            quantity: 1,
            unitPrice: 200000000,
            amount: 200000000,
            supplier: '클라우드솔루션즈',
            requestDepartment: 'IT기획팀'
          }
        ],
        costDepartments: [
          { department: 'IT기획팀', amount: 120000000, ratio: 60 },
          { department: 'IT개발팀', amount: 60000000, ratio: 30 },
          { department: 'IT운영팀', amount: 20000000, ratio: 10 }
        ]
      },

      // === 예산 ID 1 (2024년 IT 시스템 구축) - 추가 ===
      {
        contractType: 'purchase',
        purpose: '2025년 소프트웨어 라이선스 구매',
        basis: '개발팀 필요 소프트웨어',
        budgetId: 1,
        contractMethod: '일반계약',
        accountSubject: '소프트웨어',
        totalAmount: 5000000,
        status: 'approved',
        purchaseItems: [
          {
            item: '소프트웨어',
            productName: 'Visual Studio Pro 라이선스',
            quantity: 10,
            unitPrice: 500000,
            amount: 5000000,
            supplier: '마이크로소프트',
            requestDepartment: 'IT개발팀'
          }
        ],
        costDepartments: [
          { department: 'IT개발팀', amount: 5000000, ratio: 100 }
        ]
      },

      {
        contractType: 'service',
        purpose: '2025년 데이터베이스 최적화',
        basis: '시스템 성능 향상',
        budgetId: 1,
        contractMethod: '일반계약',
        accountSubject: '용역비',
        totalAmount: 15000000,
        status: 'approved',
        serviceItems: [
          {
            item: 'DB 최적화',
            personnel: 1,
            skillLevel: '시니어',
            period: 3,
            monthlyRate: 5000000,
            contractAmount: 15000000,
            supplier: 'DB컨설팅',
            creditRating: 'A'
          }
        ],
        costDepartments: [
          { department: 'IT운영팀', amount: 15000000, ratio: 100 }
        ]
      },

      {
        contractType: 'bidding',
        purpose: '2025년 네트워크 보안 장비 구축',
        basis: '보안 인프라 강화',
        budgetId: 1,
        contractMethod: '입찰',
        accountSubject: '자본예산',
        totalAmount: 80000000,
        status: 'approved',
        purchaseItems: [
          {
            item: '보안 장비',
            productName: '방화벽, IDS/IPS',
            quantity: 1,
            unitPrice: 80000000,
            amount: 80000000,
            supplier: '보안솔루션즈',
            requestDepartment: 'IT운영팀'
          }
        ],
        costDepartments: [
          { department: 'IT운영팀', amount: 60000000, ratio: 75 },
          { department: 'IT기획팀', amount: 20000000, ratio: 25 }
        ]
      }
    ];

    // 품의서 생성
    for (let i = 0; i < testProposals.length; i++) {
      const proposalData = testProposals[i];
      
      // 품의서 생성
      const proposalResult = await sequelize.query(`
        INSERT INTO proposals (
          contract_type, purpose, basis, budget_id, contract_method, 
          account_subject, total_amount, status, created_by, is_draft, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()) RETURNING id
      `, {
        replacements: [
          proposalData.contractType,
          proposalData.purpose,
          proposalData.basis,
          proposalData.budgetId,
          proposalData.contractMethod,
          proposalData.accountSubject,
          proposalData.totalAmount,
          proposalData.status,
          '테스트사용자',
          false
        ]
      });

      const proposalId = proposalResult[0][0].id;

      // 구매품목 생성
      if (proposalData.purchaseItems) {
        for (const item of proposalData.purchaseItems) {
          await sequelize.query(`
            INSERT INTO purchase_items (
              proposal_id, item, product_name, quantity, unit_price, 
              amount, supplier, request_department, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, {
            replacements: [
              proposalId,
              item.item,
              item.productName,
              item.quantity,
              item.unitPrice,
              item.amount,
              item.supplier,
              item.requestDepartment
            ]
          });
        }
      }

      // 용역항목 생성
      if (proposalData.serviceItems) {
        for (const item of proposalData.serviceItems) {
          await sequelize.query(`
            INSERT INTO service_items (
              proposal_id, item, personnel, skill_level, period, 
              monthly_rate, contract_amount, supplier, credit_rating, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, {
            replacements: [
              proposalId,
              item.item,
              item.personnel,
              item.skillLevel,
              item.period,
              item.monthlyRate,
              item.contractAmount,
              item.supplier,
              item.creditRating
            ]
          });
        }
      }

      // 비용귀속부서 생성
      if (proposalData.costDepartments) {
        for (const dept of proposalData.costDepartments) {
          await sequelize.query(`
            INSERT INTO cost_departments (
              proposal_id, department, amount, ratio, created_at, updated_at
            ) VALUES (?, ?, ?, ?, NOW(), NOW())
          `, {
            replacements: [
              proposalId,
              dept.department,
              dept.amount,
              dept.ratio
            ]
          });
        }
      }

      console.log(`   ✅ 품의서 ${i + 1} 생성 완료: ${proposalData.purpose} (${proposalData.totalAmount.toLocaleString()}원)`);
    }

    console.log('\n3. 생성된 품의서 요약:');
    const summary = await sequelize.query(`
      SELECT 
        contract_type,
        COUNT(*) as count,
        SUM(total_amount) as total_amount
      FROM proposals 
      WHERE status = 'approved' AND id > 100
      GROUP BY contract_type
      ORDER BY contract_type
    `);

    summary[0].forEach(row => {
      console.log(`   - ${row.contract_type}: ${row.count}건 (총 ${parseFloat(row.total_amount).toLocaleString()}원)`);
    });

    // 전체 합계
    const totalSummary = await sequelize.query(`
      SELECT 
        COUNT(*) as total_count,
        SUM(total_amount) as total_amount
      FROM proposals 
      WHERE status = 'approved' AND id > 100
    `);

    console.log(`\n   총 품의서: ${totalSummary[0][0].total_count}건`);
    console.log(`   총 금액: ${parseFloat(totalSummary[0][0].total_amount).toLocaleString()}원`);

    console.log('\n✅ 테스트 품의서 샘플 생성 완료!');
    console.log('\n이제 예산 집행현황을 확인해보세요:');
    console.log('1. node test-budget-execution-fix.js');

  } catch (error) {
    console.error('❌ 품의서 샘플 생성 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 실행
createTestProposals(); 