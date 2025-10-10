const { Sequelize } = require('sequelize');

// 데이터베이스 연결
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

// 랜덤 선택 함수
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 랜덤 날짜 생성 (해당 연도 내)
const randomMonth = () => {
  const month = Math.floor(Math.random() * 12) + 1;
  return month.toString().padStart(2, '0');
};

// 랜덤 금액 생성 (천만원 ~ 5억원)
const randomAmount = () => {
  const base = Math.floor(Math.random() * 49) + 1; // 1~50
  return base * 10000000; // 1천만원 ~ 5억원
};

// 사업명 풀
const projectNames = [
  'AI 시스템 구축',
  '빅데이터 분석 플랫폼 도입',
  '클라우드 인프라 구축',
  '보안 시스템 고도화',
  '모바일 앱 개발',
  '웹사이트 리뉴얼',
  'ERP 시스템 업그레이드',
  '전산장비 교체',
  '네트워크 장비 증설',
  '백업 시스템 구축',
  'DB 서버 증설',
  '통합모니터링 시스템 구축',
  '재해복구 시스템 구축',
  '협업 도구 도입',
  '화상회의 시스템 구축',
  '전자결재 시스템 개선',
  '정보보호 솔루션 도입',
  '악성코드 차단 시스템',
  '침입탐지 시스템 구축',
  '보안관제 시스템',
  'VPN 장비 도입',
  '방화벽 교체',
  '통합인증 시스템',
  'SSO 시스템 구축',
  'API 게이트웨이 구축',
  '마이크로서비스 전환',
  'DevOps 환경 구축',
  'CI/CD 파이프라인 구축',
  '컨테이너 오케스트레이션',
  '로그 분석 시스템',
  '성능 모니터링 도구',
  '데이터 웨어하우스 구축',
  'BI 도구 도입',
  '데이터 거버넌스 체계',
  'RPA 솔루션 도입',
  '챗봇 시스템 구축',
  '음성인식 시스템',
  'IoT 플랫폼 구축',
  '블록체인 시스템',
  '양자암호 통신'
];

// 부서 풀
const departments = [
  '정보기술팀',
  '보안관리팀',
  '시스템운영팀',
  '네트워크팀',
  '데이터관리팀',
  '개발팀',
  '기획팀',
  '재무팀',
  '인사팀',
  '영업팀'
];

async function generateBudgetSamples() {
  try {
    console.log('🗑️  기존 사업예산 데이터 삭제 중...');
    
    // 기존 데이터 삭제 (상세 내역도 CASCADE로 자동 삭제됨)
    await sequelize.query('DELETE FROM business_budgets');
    console.log('✅ 기존 데이터 삭제 완료');

    // 사업목적 코드 조회
    const [purposes] = await sequelize.query(
      'SELECT DISTINCT code FROM project_purposes ORDER BY code'
    );
    const purposeCodes = purposes.map(p => p.code);
    console.log('📋 사용 가능한 사업목적 코드:', purposeCodes);

    const budgetCategories = ['이연예산', '계획예산', '추가예산'];
    const statuses = ['대기', '완료(지연)', '완료(적기)', '진행중'];
    
    const years = [2024, 2025];
    const samplesPerYear = 20;
    
    let totalCreated = 0;

    for (const year of years) {
      console.log(`\n📅 ${year}년 사업예산 생성 중...`);
      
      for (let i = 0; i < samplesPerYear; i++) {
        const projectName = randomChoice(projectNames);
        const initiatorDept = randomChoice(departments);
        const executorDept = randomChoice(departments);
        const budgetCategory = randomChoice(budgetCategories);
        const budgetAmount = randomAmount();
        
        // 집행 금액은 예산의 0~80% 사이
        const executionRatio = Math.random() * 0.8;
        const executedAmount = Math.floor(budgetAmount * executionRatio);
        const pendingAmount = Math.floor(budgetAmount * 0.1 * Math.random());
        const confirmedExecutionAmount = executedAmount;
        const unexecutedAmount = budgetAmount - executedAmount - pendingAmount;
        const additionalBudget = Math.random() > 0.7 ? randomAmount() * 0.2 : 0;
        
        const startMonth = randomMonth();
        const endMonth = randomMonth();
        const startDate = `${year}-${startMonth}`;
        const endDate = `${year}-${endMonth}`;
        
        const isEssential = Math.random() > 0.5;
        const projectPurpose = randomChoice(purposeCodes);
        const status = randomChoice(statuses);
        
        const holdCancelReason = status.includes('지연') || status === '대기' 
          ? (Math.random() > 0.7 ? '예산 조정 필요' : null)
          : null;
        
        const notes = Math.random() > 0.6 
          ? ['긴급 사업', '다년도 사업', '계획 변경', '예산 증액 필요'][Math.floor(Math.random() * 4)]
          : null;
        
        const itPlanReported = Math.random() > 0.4;
        
        // 사업예산 등록
        const [result] = await sequelize.query(`
          INSERT INTO business_budgets (
            project_name, 
            initiator_department, 
            executor_department,
            budget_category, 
            budget_amount, 
            executed_amount,
            pending_amount,
            confirmed_execution_amount,
            unexecuted_amount,
            additional_budget,
            start_date, 
            end_date, 
            is_essential, 
            project_purpose, 
            budget_year, 
            status,
            hold_cancel_reason,
            notes,
            it_plan_reported,
            created_by,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          RETURNING id
        `, {
          replacements: [
            projectName,
            initiatorDept,
            executorDept,
            budgetCategory,
            budgetAmount,
            executedAmount,
            pendingAmount,
            confirmedExecutionAmount,
            unexecutedAmount,
            additionalBudget,
            startDate,
            endDate,
            isEssential,
            projectPurpose,
            year,
            status,
            holdCancelReason,
            notes,
            itPlanReported,
            'system'
          ]
        });

        const budgetId = result[0].id;

        // 상세 내역 생성 (2~5개)
        const detailCount = Math.floor(Math.random() * 4) + 2;
        const itemNames = ['하드웨어', '소프트웨어', '라이선스', '용역비', '유지보수비'];
        
        for (let j = 0; j < detailCount; j++) {
          const itemName = randomChoice(itemNames);
          const quantity = Math.floor(Math.random() * 10) + 1;
          const unitPrice = Math.floor(budgetAmount / (detailCount * quantity));
          const totalAmount = unitPrice * quantity;
          
          await sequelize.query(`
            INSERT INTO business_budget_details (
              budget_id, 
              item_name, 
              item_description, 
              unit_price, 
              quantity, 
              total_amount
            ) VALUES (?, ?, ?, ?, ?, ?)
          `, {
            replacements: [
              budgetId,
              itemName,
              `${itemName} 구매`,
              unitPrice,
              quantity,
              totalAmount
            ]
          });
        }

        totalCreated++;
        process.stdout.write(`\r  진행: ${totalCreated}/${years.length * samplesPerYear} 건 생성됨`);
      }
    }

    console.log('\n\n✅ 샘플 데이터 생성 완료!');
    console.log(`📊 총 ${totalCreated}건의 사업예산이 생성되었습니다.`);
    
    // 통계 출력
    for (const year of years) {
      const [stats] = await sequelize.query(`
        SELECT 
          COUNT(*) as count,
          SUM(budget_amount) as total_budget
        FROM business_budgets
        WHERE budget_year = ?
      `, { replacements: [year] });
      
      console.log(`\n${year}년:`);
      console.log(`  - 사업 수: ${stats[0].count}건`);
      console.log(`  - 총 예산: ${parseInt(stats[0].total_budget).toLocaleString()}원`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 실행
generateBudgetSamples();

