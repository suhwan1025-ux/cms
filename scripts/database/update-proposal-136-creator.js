// 품의서 136번의 작성자를 "사용자1"로 수정하는 스크립트
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

async function updateProposal136() {
  try {
    await sequelize.authenticate();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DB 연결 성공');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 수정 전 상태 확인
    console.log('📋 수정 전 상태 확인:\n');
    const [beforeData] = await sequelize.query(`
      SELECT id, title, created_by, status, created_at
      FROM proposals
      WHERE id = 136
    `);

    if (beforeData.length === 0) {
      console.log('⚠️  품의서 136번을 찾을 수 없습니다.');
      return;
    }

    const before = beforeData[0];
    console.log(`   품의서 ID: ${before.id}`);
    console.log(`   제목: ${before.title}`);
    console.log(`   현재 작성자: "${before.created_by}"`);
    console.log(`   상태: ${before.status}`);
    console.log(`   작성일: ${new Date(before.created_at).toLocaleString('ko-KR')}\n`);

    // 작성자 수정
    console.log('🔄 작성자를 "사용자1"로 수정 중...\n');
    
    const [updateResult] = await sequelize.query(`
      UPDATE proposals
      SET created_by = '사용자1'
      WHERE id = 136
    `);

    // 수정 후 상태 확인
    console.log('✅ 수정 완료! 수정 후 상태:\n');
    const [afterData] = await sequelize.query(`
      SELECT id, title, created_by, status, created_at
      FROM proposals
      WHERE id = 136
    `);

    const after = afterData[0];
    console.log(`   품의서 ID: ${after.id}`);
    console.log(`   제목: ${after.title}`);
    console.log(`   수정된 작성자: "${after.created_by}"`);
    console.log(`   상태: ${after.status}`);
    console.log(`   작성일: ${new Date(after.created_at).toLocaleString('ko-KR')}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ 품의서 136번의 작성자가 성공적으로 수정되었습니다!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('전체 에러:', error);
  } finally {
    await sequelize.close();
  }
}

updateProposal136();

