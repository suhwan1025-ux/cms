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

async function create2025BudgetSamples() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!\n');

    // 사업목적 코드 조회
    const [purposes] = await sequelize.query(
      'SELECT code FROM project_purposes WHERE year = 2025 ORDER BY code'
    );
    const purposeCodes = purposes.map(p => p.code);
    console.log('📋 사용 가능한 사업목적 코드:', purposeCodes.join(', '));

    // 부서 목록 조회
    const [departments] = await sequelize.query(
      'SELECT name FROM departments WHERE is_active = true'
    );
    const deptNames = departments.map(d => d.name);
    console.log('📋 사용 가능한 부서:', deptNames.join(', '));
    console.log('');

    // 샘플 데이터 정의
    const samples = [
      {
        projectName: 'AI 챗봇 시스템 구축',
        initiatorDepartment: 'IT개발팀',
        executorDepartment: 'IT개발팀',
        budgetType: '자본예산',
        budgetCategory: '계획예산',
        budgetAmount: 150000000,
        executedAmount: 50000000,
        pendingAmount: 30000000,
        confirmedExecutionAmount: 80000000,
        unexecutedAmount: 70000000,
        additionalBudget: 0,
        startDate: '2025-01',
        endDate: '2025-12',
        isEssential: true,
        projectPurpose: purposeCodes.includes('C') ? 'C' : purposeCodes[0],
        budgetYear: 2025,
        status: '진행중',
        holdCancelReason: null,
        notes: '디지털 전환 핵심 과제',
        itPlanReported: true,
        createdBy: '김개발'
      },
      {
        projectName: '클라우드 인프라 마이그레이션',
        initiatorDepartment: 'IT개발팀',
        executorDepartment: 'IT개발팀',
        budgetType: '자본예산',
        budgetCategory: '계획예산',
        budgetAmount: 300000000,
        executedAmount: 100000000,
        pendingAmount: 50000000,
        confirmedExecutionAmount: 150000000,
        unexecutedAmount: 150000000,
        additionalBudget: 50000000,
        startDate: '2025-03',
        endDate: '2025-11',
        isEssential: true,
        projectPurpose: purposeCodes.includes('C') ? 'C' : purposeCodes[0],
        budgetYear: 2025,
        status: '진행중',
        holdCancelReason: null,
        notes: '온프레미스에서 클라우드로 전환, 보안 강화 필요',
        itPlanReported: true,
        createdBy: '박인프라'
      },
      {
        projectName: 'ERP 시스템 정기 라이선스',
        initiatorDepartment: '경영관리팀',
        executorDepartment: '경영관리팀',
        budgetType: '자본예산',
        budgetCategory: '이연예산',
        budgetAmount: 80000000,
        executedAmount: 80000000,
        pendingAmount: 0,
        confirmedExecutionAmount: 80000000,
        unexecutedAmount: 0,
        additionalBudget: 0,
        startDate: '2025-01',
        endDate: '2025-12',
        isEssential: true,
        projectPurpose: purposeCodes.includes('S') ? 'S' : purposeCodes[0],
        budgetYear: 2025,
        status: '완료(적기)',
        holdCancelReason: null,
        notes: '연간 라이선스 구독료, 사용자 200명',
        itPlanReported: false,
        createdBy: '이경영'
      },
      {
        projectName: '보안 솔루션 도입',
        initiatorDepartment: 'IT개발팀',
        executorDepartment: 'IT개발팀',
        budgetType: '자본예산',
        budgetCategory: '추가예산',
        budgetAmount: 120000000,
        executedAmount: 0,
        pendingAmount: 0,
        confirmedExecutionAmount: 0,
        unexecutedAmount: 120000000,
        additionalBudget: 0,
        startDate: '2025-06',
        endDate: '2025-12',
        isEssential: true,
        projectPurpose: purposeCodes.includes('Z') ? 'Z' : purposeCodes[0],
        budgetYear: 2025,
        status: '대기',
        holdCancelReason: null,
        notes: 'EDR, DLP, 웹방화벽 등 통합 보안 솔루션',
        itPlanReported: true,
        createdBy: '최보안'
      },
      {
        projectName: '마케팅 자동화 플랫폼',
        initiatorDepartment: '마케팅팀',
        executorDepartment: '마케팅팀',
        budgetType: '자본예산',
        budgetCategory: '계획예산',
        budgetAmount: 60000000,
        executedAmount: 20000000,
        pendingAmount: 15000000,
        confirmedExecutionAmount: 35000000,
        unexecutedAmount: 25000000,
        additionalBudget: 0,
        startDate: '2025-02',
        endDate: '2025-12',
        isEssential: false,
        projectPurpose: purposeCodes.includes('D') ? 'D' : purposeCodes[0],
        budgetYear: 2025,
        status: '진행중',
        holdCancelReason: null,
        notes: '고객 데이터 분석 및 캠페인 자동화',
        itPlanReported: false,
        createdBy: '박마케팅'
      },
      {
        projectName: 'CRM 시스템 고도화',
        initiatorDepartment: '영업팀',
        executorDepartment: 'IT개발팀',
        budgetType: '자본예산',
        budgetCategory: '계획예산',
        budgetAmount: 200000000,
        executedAmount: 60000000,
        pendingAmount: 40000000,
        confirmedExecutionAmount: 100000000,
        unexecutedAmount: 100000000,
        additionalBudget: 0,
        startDate: '2025-01',
        endDate: '2025-09',
        isEssential: true,
        projectPurpose: purposeCodes.includes('C') ? 'C' : purposeCodes[0],
        budgetYear: 2025,
        status: '진행중',
        holdCancelReason: null,
        notes: 'AI 기반 영업 예측 기능 추가, 모바일 앱 개발',
        itPlanReported: true,
        createdBy: '최영업'
      },
      {
        projectName: 'HR 관리 시스템 유지보수',
        initiatorDepartment: '인사팀',
        executorDepartment: '인사팀',
        budgetType: '자본예산',
        budgetCategory: '이연예산',
        budgetAmount: 40000000,
        executedAmount: 15000000,
        pendingAmount: 10000000,
        confirmedExecutionAmount: 25000000,
        unexecutedAmount: 15000000,
        additionalBudget: 0,
        startDate: '2025-01',
        endDate: '2025-12',
        isEssential: true,
        projectPurpose: purposeCodes.includes('S') ? 'S' : purposeCodes[0],
        budgetYear: 2025,
        status: '진행중',
        holdCancelReason: null,
        notes: '급여, 근태, 평가 시스템 통합 운영',
        itPlanReported: false,
        createdBy: '정인사'
      },
      {
        projectName: '재무회계 시스템 업그레이드',
        initiatorDepartment: '재무팀',
        executorDepartment: 'IT개발팀',
        budgetType: '자본예산',
        budgetCategory: '계획예산',
        budgetAmount: 180000000,
        executedAmount: 0,
        pendingAmount: 0,
        confirmedExecutionAmount: 0,
        unexecutedAmount: 180000000,
        additionalBudget: 0,
        startDate: '2025-07',
        endDate: '2025-12',
        isEssential: false,
        projectPurpose: purposeCodes.includes('E') ? 'E' : purposeCodes[0],
        budgetYear: 2025,
        status: '대기',
        holdCancelReason: null,
        notes: 'K-IFRS 17 대응 및 전자세금계산서 시스템 연동',
        itPlanReported: true,
        createdBy: '한재무'
      },
      {
        projectName: '데이터베이스 성능 최적화',
        initiatorDepartment: 'IT개발팀',
        executorDepartment: 'IT개발팀',
        budgetType: '자본예산',
        budgetCategory: '추가예산',
        budgetAmount: 50000000,
        executedAmount: 0,
        pendingAmount: 0,
        confirmedExecutionAmount: 0,
        unexecutedAmount: 50000000,
        additionalBudget: 0,
        startDate: '2025-04',
        endDate: '2025-08',
        isEssential: false,
        projectPurpose: purposeCodes.includes('A') ? 'A' : purposeCodes[0],
        budgetYear: 2025,
        status: '대기',
        holdCancelReason: '예산 부족으로 하반기 재검토',
        notes: 'DB 샤딩 및 인덱스 최적화, 성능 모니터링 강화',
        itPlanReported: false,
        createdBy: '김개발'
      },
      {
        projectName: '업무용 노트북 교체',
        initiatorDepartment: '경영관리팀',
        executorDepartment: '경영관리팀',
        budgetType: '자본예산',
        budgetCategory: '이연예산',
        budgetAmount: 100000000,
        executedAmount: 100000000,
        pendingAmount: 0,
        confirmedExecutionAmount: 100000000,
        unexecutedAmount: 0,
        additionalBudget: 0,
        startDate: '2025-01',
        endDate: '2025-03',
        isEssential: true,
        projectPurpose: purposeCodes.includes('S') ? 'S' : purposeCodes[0],
        budgetYear: 2025,
        status: '완료(적기)',
        holdCancelReason: null,
        notes: '5년 이상 노후 장비 50대 교체 완료',
        itPlanReported: false,
        createdBy: '이경영'
      }
    ];

    console.log('🌱 2025년 사업예산 샘플 데이터 생성 시작...\n');

    for (const sample of samples) {
      const [result] = await sequelize.query(`
        INSERT INTO business_budgets (
          project_name, initiator_department, executor_department,
          budget_type, budget_category, budget_amount,
          executed_amount, pending_amount, confirmed_execution_amount,
          unexecuted_amount, additional_budget,
          start_date, end_date, is_essential, project_purpose,
          budget_year, status, hold_cancel_reason, notes, it_plan_reported,
          created_by, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING id
      `, {
        replacements: [
          sample.projectName,
          sample.initiatorDepartment,
          sample.executorDepartment,
          sample.budgetType,
          sample.budgetCategory,
          sample.budgetAmount,
          sample.executedAmount,
          sample.pendingAmount,
          sample.confirmedExecutionAmount,
          sample.unexecutedAmount,
          sample.additionalBudget,
          sample.startDate,
          sample.endDate,
          sample.isEssential,
          sample.projectPurpose,
          sample.budgetYear,
          sample.status,
          sample.holdCancelReason,
          sample.notes,
          sample.itPlanReported,
          sample.createdBy
        ]
      });

      const budgetId = result[0].id;
      console.log(`✅ [ID: ${budgetId}] ${sample.projectName} (${sample.budgetCategory}, ${(sample.budgetAmount / 100000000).toFixed(1)}억원)`);
    }

    console.log('\n📊 생성된 샘플 통계:');
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_count,
        SUM(budget_amount) as total_budget,
        SUM(executed_amount) as total_executed,
        SUM(confirmed_execution_amount) as total_confirmed,
        SUM(unexecuted_amount) as total_unexecuted
      FROM business_budgets
      WHERE budget_year = 2025
    `);

    const stat = stats[0];
    console.log(`   - 총 사업 수: ${stat.total_count}건`);
    console.log(`   - 총 예산: ${(stat.total_budget / 100000000).toFixed(1)}억원`);
    console.log(`   - 기 집행: ${(stat.total_executed / 100000000).toFixed(1)}억원`);
    console.log(`   - 확정집행액: ${(stat.total_confirmed / 100000000).toFixed(1)}억원`);
    console.log(`   - 미집행액: ${(stat.total_unexecuted / 100000000).toFixed(1)}억원`);

    console.log('\n✅ 2025년 사업예산 샘플 데이터 생성 완료!');
    console.log('🌐 브라우저에서 http://localhost:3001/budget-dashboard 에서 확인하세요!');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

create2025BudgetSamples();

