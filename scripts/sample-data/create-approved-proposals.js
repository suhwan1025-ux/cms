const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'contract_management',
  process.env.DB_USERNAME || 'postgres',
  process.env.DB_PASSWORD || 'meritz123!',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function createApprovedProposals() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!\n');

    // 사업예산 목록 조회
    const [budgets] = await sequelize.query(`
      SELECT id, project_name, budget_amount, budget_year, confirmed_execution_amount
      FROM business_budgets
      WHERE budget_year = 2025
      ORDER BY id
      LIMIT 5
    `);

    console.log('📋 사용 가능한 사업예산:');
    budgets.forEach(b => {
      console.log(`  - ID: ${b.id}, ${b.project_name} (${(b.budget_amount/100000000).toFixed(1)}억원, 확정집행액: ${(b.confirmed_execution_amount/100000000).toFixed(1)}억원)`);
    });
    console.log('');

    // 부서 목록 조회
    const [departments] = await sequelize.query(`
      SELECT name FROM departments WHERE is_active = true ORDER BY name
    `);
    const deptNames = departments.map(d => d.name);

    // 결재완료된 품의서 샘플 데이터
    const proposals = [
      {
        budgetId: budgets[0].id, // AI 챗봇 시스템 구축
        contractType: 'purchase',
        title: 'AI 챗봇 솔루션 구매 계약',
        purpose: 'AI 챗봇 시스템 구축을 위한 솔루션 구매',
        basis: '2025년 디지털 전환 계획',
        accountSubject: '소프트웨어',
        totalAmount: 45000000,
        contractMethod: '일반경쟁입찰',
        paymentMethod: '선급금',
        contractPeriod: '2025-03-01 ~ 2025-12-31',
        contractStartDate: '2025-03-01',
        contractEndDate: '2025-12-31',
        status: 'approved',
        createdBy: '김개발',
        proposalDate: '2025-02-15',
        approvalDate: '2025-02-20',
        isDraft: false,
        purchaseItems: [
          {
            item: '소프트웨어',
            productName: 'AI 챗봇 플랫폼 라이선스',
            quantity: 1,
            unitPrice: 35000000,
            amount: 35000000,
            supplier: '(주)AI솔루션즈'
          },
          {
            item: '소프트웨어',
            productName: '자연어처리 엔진',
            quantity: 1,
            unitPrice: 10000000,
            amount: 10000000,
            supplier: '(주)AI솔루션즈'
          }
        ],
        costDepartments: [
          { department: 'IT개발팀', amount: 45000000, ratio: 100 }
        ],
        requestDepartments: ['IT개발팀']
      },
      {
        budgetId: budgets[0].id, // AI 챗봇 시스템 구축
        contractType: 'service',
        title: 'AI 챗봇 시스템 구축 용역',
        purpose: 'AI 챗봇 시스템 개발 및 구축',
        basis: '2025년 디지털 전환 계획',
        accountSubject: '용역비',
        totalAmount: 35000000,
        contractMethod: '수의계약',
        paymentMethod: '기성',
        contractPeriod: '2025-04-01 ~ 2025-11-30',
        contractStartDate: '2025-04-01',
        contractEndDate: '2025-11-30',
        status: 'approved',
        createdBy: '김개발',
        proposalDate: '2025-03-10',
        approvalDate: '2025-03-15',
        isDraft: false,
        serviceItems: [
          {
            item: '용역',
            name: '김개발',
            personnel: 1,
            skillLevel: '특급',
            period: 8,
            monthlyRate: 4375000,
            contractAmount: 35000000,
            supplier: '(주)테크솔루션'
          }
        ],
        costDepartments: [
          { department: 'IT개발팀', amount: 35000000, ratio: 100 }
        ],
        requestDepartments: ['IT개발팀']
      },
      {
        budgetId: budgets[1].id, // 클라우드 인프라 마이그레이션
        contractType: 'purchase',
        title: '클라우드 인프라 구축 계약',
        purpose: '온프레미스에서 클라우드로 전환',
        basis: 'IT 인프라 현대화 계획',
        accountSubject: '정보통신비',
        totalAmount: 80000000,
        contractMethod: '제한경쟁입찰',
        paymentMethod: '일시불',
        contractPeriod: '2025-03-01 ~ 2025-12-31',
        contractStartDate: '2025-03-01',
        contractEndDate: '2025-12-31',
        status: 'approved',
        createdBy: '박인프라',
        proposalDate: '2025-02-20',
        approvalDate: '2025-02-25',
        isDraft: false,
        purchaseItems: [
          {
            item: '서버/스토리지',
            productName: 'AWS 클라우드 서비스',
            quantity: 12,
            unitPrice: 5000000,
            amount: 60000000,
            supplier: '아마존웹서비스코리아'
          },
          {
            item: '네트워크장비',
            productName: '네트워크 보안 장비',
            quantity: 2,
            unitPrice: 10000000,
            amount: 20000000,
            supplier: '(주)네트워크시큐리티'
          }
        ],
        costDepartments: [
          { department: 'IT개발팀', amount: 80000000, ratio: 100 }
        ],
        requestDepartments: ['IT개발팀']
      },
      {
        budgetId: budgets[2].id, // ERP 시스템 정기 라이선스
        contractType: 'purchase',
        title: 'ERP 시스템 연간 라이선스 갱신',
        purpose: 'ERP 시스템 정기 유지보수',
        basis: '정보시스템 운영 계획',
        accountSubject: '소프트웨어',
        totalAmount: 80000000,
        contractMethod: '수의계약',
        paymentMethod: '일시불',
        contractPeriod: '2025-01-01 ~ 2025-12-31',
        contractStartDate: '2025-01-01',
        contractEndDate: '2025-12-31',
        status: 'approved',
        createdBy: '이경영',
        proposalDate: '2024-12-15',
        approvalDate: '2024-12-20',
        isDraft: false,
        purchaseItems: [
          {
            item: '소프트웨어',
            productName: 'ERP 라이선스 (200 User)',
            quantity: 1,
            unitPrice: 80000000,
            amount: 80000000,
            supplier: 'SAP코리아'
          }
        ],
        costDepartments: [
          { department: '경영관리팀', amount: 40000000, ratio: 50 },
          { department: '재무팀', amount: 24000000, ratio: 30 },
          { department: '인사팀', amount: 16000000, ratio: 20 }
        ],
        requestDepartments: ['경영관리팀', '재무팀', '인사팀']
      },
      {
        budgetId: budgets[3].id, // CRM 시스템 고도화
        contractType: 'service',
        title: 'CRM 시스템 고도화 개발 용역',
        purpose: 'AI 기반 영업 예측 기능 추가',
        basis: 'CRM 시스템 개선 계획',
        accountSubject: '용역비',
        totalAmount: 60000000,
        contractMethod: '일반경쟁입찰',
        paymentMethod: '기성',
        contractPeriod: '2025-02-01 ~ 2025-08-31',
        contractStartDate: '2025-02-01',
        contractEndDate: '2025-08-31',
        status: 'approved',
        createdBy: '최영업',
        proposalDate: '2025-01-20',
        approvalDate: '2025-01-25',
        isDraft: false,
        serviceItems: [
          {
            item: '용역',
            name: '박AI',
            personnel: 1,
            skillLevel: '고급',
            period: 7,
            monthlyRate: 5000000,
            contractAmount: 35000000,
            supplier: '(주)AI개발'
          },
          {
            item: '용역',
            name: '이백엔드',
            personnel: 1,
            skillLevel: '중급',
            period: 7,
            monthlyRate: 3571428,
            contractAmount: 25000000,
            supplier: '(주)AI개발'
          }
        ],
        costDepartments: [
          { department: '영업팀', amount: 36000000, ratio: 60 },
          { department: 'IT개발팀', amount: 24000000, ratio: 40 }
        ],
        requestDepartments: ['영업팀', 'IT개발팀']
      },
      {
        budgetId: budgets[4].id, // 마케팅 자동화 플랫폼
        contractType: 'purchase',
        title: '마케팅 자동화 플랫폼 도입',
        purpose: '고객 데이터 분석 및 캠페인 자동화',
        basis: '디지털 마케팅 강화 계획',
        accountSubject: '소프트웨어',
        totalAmount: 25000000,
        contractMethod: '수의계약',
        paymentMethod: '선급금',
        contractPeriod: '2025-03-01 ~ 2025-12-31',
        contractStartDate: '2025-03-01',
        contractEndDate: '2025-12-31',
        status: 'approved',
        createdBy: '박마케팅',
        proposalDate: '2025-02-10',
        approvalDate: '2025-02-15',
        isDraft: false,
        purchaseItems: [
          {
            item: '소프트웨어',
            productName: '마케팅 자동화 플랫폼 라이선스',
            quantity: 1,
            unitPrice: 25000000,
            amount: 25000000,
            supplier: '(주)마케팅테크'
          }
        ],
        costDepartments: [
          { department: '마케팅팀', amount: 25000000, ratio: 100 }
        ],
        requestDepartments: ['마케팅팀']
      }
    ];

    console.log('🌱 결재완료된 품의서 생성 시작...\n');

    let totalAmount = 0;
    let createdCount = 0;

    for (const proposalData of proposals) {
      const budget = budgets.find(b => b.id === proposalData.budgetId);
      
      // 품의서 생성
      const [proposal] = await sequelize.query(`
        INSERT INTO proposals (
          contract_type, title, purpose, basis, budget_id, 
          account_subject, total_amount, contract_method, payment_method,
          contract_period, contract_start_date, contract_end_date,
          status, created_by, proposal_date, approval_date, is_draft,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
        ) RETURNING id
      `, {
        bind: [
          proposalData.contractType,
          proposalData.title,
          proposalData.purpose,
          proposalData.basis,
          proposalData.budgetId,
          proposalData.accountSubject,
          proposalData.totalAmount,
          proposalData.contractMethod,
          proposalData.paymentMethod,
          proposalData.contractPeriod,
          proposalData.contractStartDate,
          proposalData.contractEndDate,
          proposalData.status,
          proposalData.createdBy,
          proposalData.proposalDate,
          proposalData.approvalDate,
          proposalData.isDraft
        ]
      });

      const proposalId = proposal[0].id;

      // 구매품목 생성
      if (proposalData.purchaseItems) {
        for (const item of proposalData.purchaseItems) {
          await sequelize.query(`
            INSERT INTO purchase_items (
              proposal_id, item, product_name, quantity, unit_price, amount, supplier,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          `, {
            bind: [proposalId, item.item, item.productName, item.quantity, item.unitPrice, item.amount, item.supplier]
          });
        }
      }

      // 용역항목 생성
      if (proposalData.serviceItems) {
        for (const item of proposalData.serviceItems) {
          await sequelize.query(`
            INSERT INTO service_items (
              proposal_id, item, name, personnel, skill_level, period, 
              monthly_rate, contract_amount, supplier,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          `, {
            bind: [proposalId, item.item, item.name, item.personnel, item.skillLevel, item.period, item.monthlyRate, item.contractAmount, item.supplier]
          });
        }
      }

      // 비용귀속부서 생성
      if (proposalData.costDepartments) {
        for (const dept of proposalData.costDepartments) {
          await sequelize.query(`
            INSERT INTO cost_departments (
              proposal_id, department, amount, ratio,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, NOW(), NOW())
          `, {
            bind: [proposalId, dept.department, dept.amount, dept.ratio]
          });
        }
      }

      // 요청부서 생성
      if (proposalData.requestDepartments) {
        for (const dept of proposalData.requestDepartments) {
          await sequelize.query(`
            INSERT INTO request_departments (
              proposal_id, department,
              created_at, updated_at
            ) VALUES ($1, $2, NOW(), NOW())
          `, {
            bind: [proposalId, dept]
          });
        }
      }

      totalAmount += proposalData.totalAmount;
      createdCount++;

      console.log(`✅ [ID: ${proposalId}] ${proposalData.title}`);
      console.log(`   사업예산: ${budget.project_name}`);
      console.log(`   금액: ${(proposalData.totalAmount / 1000000).toFixed(1)}백만원`);
      console.log(`   상태: 결재완료 (approved)`);
      console.log('');
    }

    console.log('📊 생성 완료 통계:');
    console.log(`   - 품의서 수: ${createdCount}건`);
    console.log(`   - 총 금액: ${(totalAmount / 100000000).toFixed(1)}억원\n`);

    // 확정집행액 동기화 (자동으로 수행됨)
    console.log('🔄 확정집행액 자동 동기화 중...');
    
    // 업데이트된 사업예산 확인
    const [updatedBudgets] = await sequelize.query(`
      SELECT 
        bb.id,
        bb.project_name,
        bb.budget_amount,
        bb.confirmed_execution_amount,
        COUNT(p.id) as proposal_count,
        COALESCE(SUM(p.total_amount), 0) as actual_approved_amount
      FROM business_budgets bb
      LEFT JOIN proposals p ON p.budget_id = bb.id AND p.status = 'approved'
      WHERE bb.budget_year = 2025
      GROUP BY bb.id, bb.project_name, bb.budget_amount, bb.confirmed_execution_amount
      HAVING COUNT(p.id) > 0
      ORDER BY bb.id
    `);

    console.log('\n✅ 확정집행액 동기화 확인:\n');
    updatedBudgets.forEach(b => {
      const match = b.confirmed_execution_amount == b.actual_approved_amount ? '✅' : '⚠️';
      console.log(`${match} ${b.project_name}`);
      console.log(`   예산: ${(b.budget_amount / 100000000).toFixed(1)}억원`);
      console.log(`   품의 건수: ${b.proposal_count}건`);
      console.log(`   품의 완료 금액: ${(b.actual_approved_amount / 100000000).toFixed(2)}억원`);
      console.log(`   확정집행액(DB): ${(b.confirmed_execution_amount / 100000000).toFixed(2)}억원`);
      console.log('');
    });

    console.log('✅ 결재완료 품의서 샘플 생성 완료!');
    console.log('🌐 브라우저에서 확인:');
    console.log('   - 사업예산 대시보드: http://localhost:3001/budget-dashboard');
    console.log('   - 품의 목록: http://localhost:3001/proposals');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

createApprovedProposals();

