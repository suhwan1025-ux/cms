const { Sequelize } = require('sequelize');
require('dotenv').config();

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

async function seedBusinessBudgetData() {
  try {
    console.log('🌱 사업예산 샘플 데이터 삽입 중...');

    // 사업예산 데이터 삽입
    const budgetResults = await sequelize.query(`
      INSERT INTO business_budgets (
        project_name, initiator_department, executor_department, 
        budget_type, budget_category, budget_amount, executed_amount,
        start_date, end_date, is_essential, project_purpose, budget_year, status, created_by
      ) VALUES 
      ('2024년 IT 시스템 구축', 'IT기획팀', 'IT개발팀', '자본예산', '일반사업', 500000000, 350000000, '2024-01', '2024-12', true, 'C', 2024, '진행중', '김철수'),
      ('2024년 보안 시스템 강화', '보안팀', '보안팀', '자본예산', '보안사업', 300000000, 200000000, '2024-02', '2024-08', true, 'A', 2024, '진행중', '이영희'),
      ('2024년 전산 운영비', 'IT운영팀', 'IT운영팀', '전산운용비', '전산수선비', 100000000, 80000000, '2024-01', '2024-12', false, 'D', 2024, '진행중', '박민수'),
      ('2025년 AI 시스템 도입', '데이터팀', 'IT개발팀', '자본예산', '일반사업', 800000000, 200000000, '2025-01', '2025-12', false, 'C', 2025, '진행중', '최지영'),
      ('2025년 클라우드 마이그레이션', 'IT기획팀', 'IT개발팀', '자본예산', '일반사업', 500000000, 0, '2025-03', '2025-11', true, 'C', 2025, '승인대기', '정수민'),
      ('2025년 전산 운영비', 'IT운영팀', 'IT운영팀', '전산운용비', '전산수선비', 120000000, 0, '2025-01', '2025-12', false, 'D', 2025, '승인대기', '한동훈'),
      ('2026년 디지털 트랜스포메이션', '기획팀', 'IT개발팀', '자본예산', '일반사업', 1000000000, 0, '2026-01', '2026-12', true, 'C', 2026, '승인대기', '송미영'),
      ('2026년 전산 운영비', 'IT운영팀', 'IT운영팀', '전산운용비', '전산수선비', 150000000, 0, '2026-01', '2026-12', false, 'D', 2026, '승인대기', '김태호')
      RETURNING id
    `);

    const budgetIds = budgetResults[0].map(row => row.id);
    console.log('✅ 사업예산 데이터 삽입 완료:', budgetIds.length, '건');

    // 사업예산 상세 데이터 삽입
    const detailData = [
      // 2024년 IT 시스템 구축 상세
      { budgetId: budgetIds[0], itemName: '서버 장비', itemDescription: '고성능 서버 10대', unitPrice: 30000000, quantity: 10, totalAmount: 300000000 },
      { budgetId: budgetIds[0], itemName: '네트워크 장비', itemDescription: '스위치 및 라우터', unitPrice: 20000000, quantity: 10, totalAmount: 200000000 },
      
      // 2024년 보안 시스템 강화 상세
      { budgetId: budgetIds[1], itemName: '방화벽 시스템', itemDescription: '엔터프라이즈 방화벽', unitPrice: 150000000, quantity: 1, totalAmount: 150000000 },
      { budgetId: budgetIds[1], itemName: '보안 소프트웨어', itemDescription: '엔드포인트 보안 솔루션', unitPrice: 150000000, quantity: 1, totalAmount: 150000000 },
      
      // 2024년 전산 운영비 상세
      { budgetId: budgetIds[2], itemName: '시스템 유지보수', itemDescription: '월별 시스템 점검 및 유지보수', unitPrice: 5000000, quantity: 12, totalAmount: 60000000 },
      { budgetId: budgetIds[2], itemName: '백업 시스템', itemDescription: '데이터 백업 및 복구 시스템', unitPrice: 20000000, quantity: 2, totalAmount: 40000000 },
      
      // 2025년 AI 시스템 도입 상세
      { budgetId: budgetIds[3], itemName: 'AI 서버', itemDescription: 'GPU 기반 AI 서버', unitPrice: 400000000, quantity: 2, totalAmount: 800000000 },
      
      // 2025년 클라우드 마이그레이션 상세
      { budgetId: budgetIds[4], itemName: '클라우드 인프라', itemDescription: 'AWS/Azure 클라우드 인프라', unitPrice: 300000000, quantity: 1, totalAmount: 300000000 },
      { budgetId: budgetIds[4], itemName: '마이그레이션 서비스', itemDescription: '데이터 및 시스템 마이그레이션', unitPrice: 200000000, quantity: 1, totalAmount: 200000000 }
    ];

    for (const detail of detailData) {
      await sequelize.query(`
        INSERT INTO business_budget_details (
          budget_id, item_name, item_description, unit_price, quantity, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, {
        replacements: [
          detail.budgetId, detail.itemName, detail.itemDescription,
          detail.unitPrice, detail.quantity, detail.totalAmount
        ]
      });
    }

    console.log('✅ 사업예산 상세 데이터 삽입 완료:', detailData.length, '건');

    // 승인 이력 데이터 삽입
    const approvalData = [
      { budgetId: budgetIds[0], approverName: '김대표', approverTitle: '대표이사', approvalStatus: '승인', approvalComment: 'IT 인프라 구축은 필수 사업으로 승인합니다.' },
      { budgetId: budgetIds[1], approverName: '이본부장', approverTitle: '기술본부장', approvalStatus: '승인', approvalComment: '보안 강화는 시급한 사업입니다.' },
      { budgetId: budgetIds[2], approverName: '박팀장', approverTitle: 'IT팀장', approvalStatus: '승인', approvalComment: '운영비는 정상 범위입니다.' },
      { budgetId: budgetIds[3], approverName: '최이사', approverTitle: '기술이사', approvalStatus: '승인', approvalComment: 'AI 시스템 도입은 미래 지향적입니다.' }
    ];

    for (const approval of approvalData) {
      await sequelize.query(`
        INSERT INTO business_budget_approvals (
          budget_id, approver_name, approver_title, approval_status, approval_comment
        ) VALUES (?, ?, ?, ?, ?)
      `, {
        replacements: [
          approval.budgetId, approval.approverName, approval.approverTitle,
          approval.approvalStatus, approval.approvalComment
        ]
      });
    }

    console.log('✅ 승인 이력 데이터 삽입 완료:', approvalData.length, '건');

    // 데이터 확인
    const budgetCount = await sequelize.query('SELECT COUNT(*) as count FROM business_budgets');
    const detailCount = await sequelize.query('SELECT COUNT(*) as count FROM business_budget_details');
    const approvalCount = await sequelize.query('SELECT COUNT(*) as count FROM business_budget_approvals');

    console.log('📊 삽입된 데이터 현황:');
    console.log(`  - 사업예산: ${budgetCount[0][0].count}건`);
    console.log(`  - 상세내역: ${detailCount[0][0].count}건`);
    console.log(`  - 승인이력: ${approvalCount[0][0].count}건`);

  } catch (error) {
    console.error('❌ 데이터 삽입 실패:', error.message);
  } finally {
    await sequelize.close();
  }
}

seedBusinessBudgetData(); 