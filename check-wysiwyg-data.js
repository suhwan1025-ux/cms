const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'contract_management',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

async function checkWysiwygData() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 데이터베이스 연결 확인 중...');
    
    // 1. 최근 생성된 품의서들 확인 (wysiwygContent가 있는 것들)
    console.log('\n📋 최근 품의서 중 wysiwygContent가 있는 항목들...');
    const recentProposalsQuery = `
      SELECT 
        id, 
        contract_type, 
        purpose, 
        created_at,
        is_draft,
        CASE 
          WHEN wysiwyg_content IS NULL THEN 'NULL'
          WHEN wysiwyg_content = '' THEN 'EMPTY'
          ELSE CONCAT('LENGTH: ', LENGTH(wysiwyg_content), ' chars')
        END as wysiwyg_status,
        CASE 
          WHEN LENGTH(wysiwyg_content) > 100 THEN CONCAT(LEFT(wysiwyg_content, 100), '...')
          ELSE wysiwyg_content
        END as wysiwyg_preview
      FROM proposals 
      ORDER BY created_at DESC 
      LIMIT 10;
    `;
    
    const recentResult = await client.query(recentProposalsQuery);
    
    if (recentResult.rows.length === 0) {
      console.log('❌ 품의서가 없습니다.');
    } else {
      console.log(`✅ 최근 품의서 ${recentResult.rows.length}개 발견:`);
      recentResult.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. ID: ${row.id}`);
        console.log(`   계약유형: ${row.contract_type}`);
        console.log(`   제목: ${row.purpose}`);
        console.log(`   생성일: ${row.created_at}`);
        console.log(`   임시저장: ${row.is_draft}`);
        console.log(`   WYSIWYG 상태: ${row.wysiwyg_status}`);
        if (row.wysiwyg_preview && row.wysiwyg_preview !== 'NULL' && row.wysiwyg_preview !== 'EMPTY') {
          console.log(`   내용 미리보기: ${row.wysiwyg_preview}`);
        }
      });
    }
    
    // 2. 자유양식(freeform) 품의서만 확인
    console.log('\n📋 자유양식 품의서들...');
    const freeformQuery = `
      SELECT 
        id, 
        purpose, 
        created_at,
        is_draft,
        CASE 
          WHEN wysiwyg_content IS NULL THEN 'NULL'
          WHEN wysiwyg_content = '' THEN 'EMPTY'
          ELSE CONCAT('LENGTH: ', LENGTH(wysiwyg_content), ' chars')
        END as wysiwyg_status
      FROM proposals 
      WHERE contract_type = 'freeform'
      ORDER BY created_at DESC 
      LIMIT 5;
    `;
    
    const freeformResult = await client.query(freeformQuery);
    
    if (freeformResult.rows.length === 0) {
      console.log('❌ 자유양식 품의서가 없습니다.');
    } else {
      console.log(`✅ 자유양식 품의서 ${freeformResult.rows.length}개 발견:`);
      freeformResult.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. ID: ${row.id}`);
        console.log(`   제목: ${row.purpose}`);
        console.log(`   생성일: ${row.created_at}`);
        console.log(`   임시저장: ${row.is_draft}`);
        console.log(`   WYSIWYG 상태: ${row.wysiwyg_status}`);
      });
    }
    
    // 3. 통계
    console.log('\n📊 통계...');
    const statsQuery = `
      SELECT 
        COUNT(*) as total_proposals,
        COUNT(CASE WHEN wysiwyg_content IS NOT NULL AND wysiwyg_content != '' THEN 1 END) as with_wysiwyg,
        COUNT(CASE WHEN contract_type = 'freeform' THEN 1 END) as freeform_proposals,
        COUNT(CASE WHEN contract_type = 'freeform' AND wysiwyg_content IS NOT NULL AND wysiwyg_content != '' THEN 1 END) as freeform_with_wysiwyg
      FROM proposals;
    `;
    
    const statsResult = await client.query(statsQuery);
    const stats = statsResult.rows[0];
    
    console.log(`전체 품의서: ${stats.total_proposals}개`);
    console.log(`WYSIWYG 내용이 있는 품의서: ${stats.with_wysiwyg}개`);
    console.log(`자유양식 품의서: ${stats.freeform_proposals}개`);
    console.log(`WYSIWYG 내용이 있는 자유양식 품의서: ${stats.freeform_with_wysiwyg}개`);
    
    console.log('\n✅ 데이터 확인 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세 오류:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// 스크립트 실행
if (require.main === module) {
  checkWysiwygData()
    .then(() => {
      console.log('\n🎉 스크립트 실행 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 중 오류:', error);
      process.exit(1);
    });
} 