// 품의서 작성자 데이터 확인 스크립트
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

async function checkProposalCreators() {
  try {
    await sequelize.authenticate();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DB 연결 성공');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 품의서 133번 특별 조회
    const proposal133Query = `
      SELECT 
        id,
        title,
        created_by,
        status,
        is_draft,
        budget_id,
        created_at
      FROM proposals
      WHERE id = 133
    `;

    const [proposal133] = await sequelize.query(proposal133Query);

    if (proposal133.length > 0) {
      console.log('🔍 품의서 133번 상세 정보:\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      const p = proposal133[0];
      console.log(`   품의서 ID: ${p.id}`);
      console.log(`   제목: ${p.title || '(제목 없음)'}`);
      console.log(`   작성자 (created_by): "${p.created_by || '(없음)'}"`);
      console.log(`   상태: ${p.status} ${p.is_draft ? '(임시저장)' : ''}`);
      console.log(`   사업예산 ID: ${p.budget_id || '(없음)'}`);
      console.log(`   작성일: ${p.created_at ? new Date(p.created_at).toLocaleString('ko-KR') : '(없음)'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('⚠️  품의서 133번을 찾을 수 없습니다.\n');
    }

    // 작성중인 품의서(임시저장) 조회
    const draftQuery = `
      SELECT 
        id,
        title,
        created_by,
        status,
        is_draft,
        budget_id,
        created_at
      FROM proposals
      WHERE is_draft = true
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const [drafts] = await sequelize.query(draftQuery);

    console.log('📝 작성중인 품의서 (임시저장) 목록:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (drafts.length === 0) {
      console.log('⚠️  작성중인 품의서가 없습니다.');
    } else {
      drafts.forEach((row, index) => {
        console.log(`\n${index + 1}. 품의서 ID: ${row.id}`);
        console.log(`   제목: ${row.title || '(제목 없음)'}`);
        console.log(`   작성자 (created_by): "${row.created_by || '(없음)'}"`);
        console.log(`   상태: ${row.status}`);
        console.log(`   사업예산 ID: ${row.budget_id || '(없음)'}`);
        console.log(`   작성일: ${row.created_at ? new Date(row.created_at).toLocaleString('ko-KR') : '(없음)'}`);
      });

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // 작성중인 품의서의 작성자 통계
      const draftCreatorStats = {};
      drafts.forEach(row => {
        const creator = row.created_by || '(없음)';
        draftCreatorStats[creator] = (draftCreatorStats[creator] || 0) + 1;
      });

      console.log('\n📊 작성중인 품의서 작성자별 통계:\n');
      Object.entries(draftCreatorStats).forEach(([creator, count]) => {
        console.log(`   "${creator}": ${count}건`);
      });
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // 품의서 작성자 데이터 조회
    const query = `
      SELECT 
        id,
        title,
        created_by,
        status,
        is_draft,
        budget_id,
        created_at
      FROM proposals
      ORDER BY created_at DESC
      LIMIT 20
    `;

    const [results] = await sequelize.query(query);

    console.log('📋 최근 품의서 20건의 작성자 데이터:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (results.length === 0) {
      console.log('⚠️  품의서 데이터가 없습니다.');
    } else {
      results.forEach((row, index) => {
        console.log(`\n${index + 1}. 품의서 ID: ${row.id}`);
        console.log(`   제목: ${row.title || '(제목 없음)'}`);
        console.log(`   작성자 (created_by): "${row.created_by || '(없음)'}"`);
        console.log(`   상태: ${row.status} ${row.is_draft ? '(임시저장)' : ''}`);
        console.log(`   사업예산 ID: ${row.budget_id || '(없음)'}`);
        console.log(`   작성일: ${row.created_at ? new Date(row.created_at).toLocaleString('ko-KR') : '(없음)'}`);
      });

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // 작성자 통계
      const creatorStats = {};
      results.forEach(row => {
        const creator = row.created_by || '(없음)';
        creatorStats[creator] = (creatorStats[creator] || 0) + 1;
      });

      console.log('\n📊 작성자별 통계:\n');
      Object.entries(creatorStats).forEach(([creator, count]) => {
        console.log(`   "${creator}": ${count}건`);
      });

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n💡 분석:');
      
      const hasNonDefaultCreator = results.some(row => 
        row.created_by && row.created_by !== '작성자'
      );

      if (hasNonDefaultCreator) {
        console.log('\n   ⚠️  "작성자"가 아닌 다른 이름이 발견되었습니다!');
        console.log('   이 데이터들은:');
        console.log('   1. 이전 버전에서 만들어진 품의서');
        console.log('   2. 또는 직접 DB에 입력된 테스트 데이터');
        console.log('   3. 또는 실제 사용자명이 저장된 품의서일 수 있습니다.');
      } else {
        console.log('\n   ✅ 모든 품의서가 "작성자"로 저장되어 있습니다.');
        console.log('   사업예산현황 모달에서 다른 이름이 보인다면');
        console.log('   프론트엔드 코드를 확인해야 합니다.');
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('전체 에러:', error);
  } finally {
    await sequelize.close();
  }
}

checkProposalCreators();

