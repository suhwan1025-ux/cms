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

async function checkAvailableBudgets() {
  try {
    console.log('=== 사용 가능한 사업예산 현황 ===\n');

    // 사업예산 목록 조회
    const budgets = await sequelize.query(`
      SELECT 
        id,
        project_name,
        budget_type,
        budget_category,
        budget_amount,
        executed_amount,
        remaining_amount,
        status,
        year
      FROM business_budgets 
      ORDER BY id
    `);

    if (budgets[0].length === 0) {
      console.log('❌ 사용 가능한 사업예산이 없습니다.');
      return;
    }

    console.log('사업예산 목록:');
    budgets[0].forEach(budget => {
      console.log(`  - ID ${budget.id}: ${budget.project_name}`);
      console.log(`    유형: ${budget.budget_type} / ${budget.budget_category}`);
      console.log(`    예산: ${parseFloat(budget.budget_amount).toLocaleString()}원`);
      console.log(`    집행: ${parseFloat(budget.executed_amount || 0).toLocaleString()}원`);
      console.log(`    잔여: ${parseFloat(budget.remaining_amount || 0).toLocaleString()}원`);
      console.log(`    상태: ${budget.status} (${budget.year}년)\n`);
    });

    // 예산별 품의서 현황
    console.log('예산별 품의서 현황:');
    const budgetProposals = await sequelize.query(`
      SELECT 
        bb.id as budget_id,
        bb.project_name,
        COUNT(p.id) as proposal_count,
        COALESCE(SUM(p.total_amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN p.status = 'approved' THEN p.total_amount ELSE 0 END), 0) as approved_amount
      FROM business_budgets bb
      LEFT JOIN proposals p ON bb.id = p.budget_id
      GROUP BY bb.id, bb.project_name
      ORDER BY bb.id
    `);

    budgetProposals[0].forEach(budget => {
      console.log(`  - ${budget.project_name}:`);
      console.log(`    총 품의서: ${budget.proposal_count}건`);
      console.log(`    총 금액: ${parseFloat(budget.total_amount).toLocaleString()}원`);
      console.log(`    승인완료: ${parseFloat(budget.approved_amount).toLocaleString()}원\n`);
    });

  } catch (error) {
    console.error('❌ 예산 현황 확인 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 실행
checkAvailableBudgets(); 