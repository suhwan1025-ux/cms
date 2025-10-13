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

async function checkStatus() {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    console.log('');
    
    // 98번, 99번 품의서의 현재 상태 확인
    const [proposals] = await sequelize.query(`
      SELECT id, title, status, is_draft, approval_date, updated_at
      FROM proposals 
      WHERE id IN (98, 99)
      ORDER BY id;
    `);
    
    console.log('🔍 품의서 상태 확인:');
    console.log('');
    
    proposals.forEach(p => {
      console.log(`📋 품의서 ID: ${p.id}`);
      console.log(`   제목: ${p.title}`);
      console.log(`   상태 (DB): ${p.status}`);
      console.log(`   임시저장 여부: ${p.is_draft}`);
      console.log(`   결재완료일: ${p.approval_date || '없음'}`);
      console.log(`   최종 수정: ${p.updated_at}`);
      console.log('');
    });
    
    // 상태별 개수 확인
    const [statusCount] = await sequelize.query(`
      SELECT status, COUNT(*) as count
      FROM proposals
      WHERE is_draft = false
      GROUP BY status
      ORDER BY status;
    `);
    
    console.log('📊 전체 품의서 상태별 개수 (임시저장 제외):');
    console.log('');
    statusCount.forEach(s => {
      const statusName = 
        s.status === 'approved' ? '결재완료 (approved)' :
        s.status === 'submitted' ? '결재대기 (submitted)' :
        s.status === 'rejected' ? '반려 (rejected)' :
        s.status === 'cancelled' ? '취소 (cancelled)' :
        s.status;
      console.log(`  ${statusName}: ${s.count}개`);
    });
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkStatus();

