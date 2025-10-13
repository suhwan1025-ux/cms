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

async function checkProposalsBudget() {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    console.log('');
    
    // budgets 테이블 컬럼 확인
    const [budgetCols] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'budgets' 
      ORDER BY ordinal_position;
    `);
    console.log('📋 budgets 테이블 컬럼:', budgetCols.map(c => c.column_name).join(', '));
    console.log('');
    
    // 98번, 99번 품의서 정보
    const [proposals] = await sequelize.query(`
      SELECT p.id, p.title, p.status, p.budget_id, p.created_at
      FROM proposals p 
      WHERE p.id IN (98, 99)
      ORDER BY p.id;
    `);
    
    console.log('🔍 98번, 99번 품의서 정보:');
    console.log('');
    
    proposals.forEach(p => {
      console.log(`📋 품의서 ID: ${p.id}`);
      console.log(`   제목: ${p.title}`);
      console.log(`   상태: ${p.status}`);
      console.log(`   연결된 예산 ID: ${p.budget_id}`);
      console.log(`   생성일: ${p.created_at}`);
      console.log('');
    });
    
    // 해당 예산의 모든 품의서 확인
    if (proposals.length > 0) {
      const budgetId = proposals[0].budget_id;
      console.log(`📊 예산 ID ${budgetId}의 모든 품의서:`);
      console.log('');
      
      const [allProposals] = await sequelize.query(`
        SELECT id, title, status, created_at
        FROM proposals 
        WHERE budget_id = ${budgetId}
        ORDER BY id;
      `);
      
      allProposals.forEach(p => {
        console.log(`  ${p.id}. ${p.title} [${p.status}]`);
      });
      console.log('');
      console.log(`총 ${allProposals.length}개의 품의서`);
    }
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkProposalsBudget();

