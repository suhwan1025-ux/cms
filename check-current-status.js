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

async function checkCurrentStatus() {
  try {
    console.log('=== 현재 데이터베이스 상태 확인 ===\n');

    // 1. 품의서 상태 확인
    console.log('1. 품의서 상태별 개수:');
    const proposalStatus = await sequelize.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_amount
      FROM proposals 
      GROUP BY status
      ORDER BY status
    `);
    
    proposalStatus[0].forEach(row => {
      console.log(`  - ${row.status}: ${row.count}건 (총 ${row.total_amount || 0}원)`);
    });

    // 2. 결재완료된 품의서 상세 확인
    console.log('\n2. 결재완료된 품의서 목록:');
    const approvedProposals = await sequelize.query(`
      SELECT 
        id,
        contract_type,
        total_amount,
        created_at,
        status
      FROM proposals 
      WHERE status = 'approved'
      ORDER BY created_at DESC
    `);
    
    if (approvedProposals[0].length === 0) {
      console.log('  - 결재완료된 품의서가 없습니다.');
    } else {
      approvedProposals[0].forEach(proposal => {
        console.log(`  - ID: ${proposal.id}, 유형: ${proposal.contract_type}, 금액: ${proposal.total_amount}원`);
      });
    }

    // 3. 사업예산 데이터 확인
    console.log('\n3. 사업예산 데이터:');
    const businessBudgets = await sequelize.query(`
      SELECT 
        id,
        project_name,
        budget_amount,
        executed_amount,
        budget_year,
        status
      FROM business_budgets 
      ORDER BY budget_year DESC, id DESC
    `);
    
    if (businessBudgets[0].length === 0) {
      console.log('  - 사업예산 데이터가 없습니다.');
    } else {
      businessBudgets[0].forEach(budget => {
        console.log(`  - ID: ${budget.id}, 사업명: ${budget.project_name}, 예산: ${budget.budget_amount}원, 집행: ${budget.executed_amount}원`);
      });
    }

    // 4. 통계 API 응답 확인
    console.log('\n4. 통계 API 응답 확인:');
    const axios = require('axios');
    
    try {
      const budgetStatsResponse = await axios.get('http://localhost:3001/api/budget-statistics');
      const budgetStats = budgetStatsResponse.data;
      
      console.log(`  - 총 사업예산 건수: ${budgetStats.totalBudgets}`);
      console.log(`  - 총 사업예산 금액: ${budgetStats.totalBudgetAmount}원`);
      console.log(`  - 집행된 예산 금액: ${budgetStats.executedBudgetAmount}원`);
      console.log(`  - 결재완료 품의서 개수: ${budgetStats.approvedProposalsCount}`);
      console.log(`  - 결재완료 품의서 총 금액: ${budgetStats.totalExecutedFromProposals}원`);
      
      if (budgetStats.approvedProposalsCount === 0 && budgetStats.executedBudgetAmount > 0) {
        console.log('  ⚠️  경고: 결재완료된 품의서가 없는데 집행금액이 있습니다!');
        console.log('  → 사업예산 테이블의 executed_amount 필드 값을 사용하고 있는 것 같습니다.');
      }
      
    } catch (error) {
      console.log('  - 통계 API 호출 실패:', error.message);
    }

    console.log('\n=== 확인 완료 ===');

  } catch (error) {
    console.error('확인 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

checkCurrentStatus(); 