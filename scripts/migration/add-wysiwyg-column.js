const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'contract_management',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

async function addWysiwygColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 데이터베이스 연결 확인 중...');
    
    // 1. 컬럼이 이미 존재하는지 확인
    console.log('\n📋 wysiwygContent 컬럼 존재 여부 확인...');
    const columnCheckQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'proposals' 
      AND column_name = 'wysiwyg_content';
    `;
    
    const columnResult = await client.query(columnCheckQuery);
    
    if (columnResult.rows.length > 0) {
      console.log('✅ wysiwygContent 컬럼이 이미 존재합니다.');
    } else {
      console.log('\n🔄 wysiwygContent 컬럼을 추가 중...');
      
      // 2. 컬럼 추가
      await client.query(`
        ALTER TABLE proposals 
        ADD COLUMN wysiwyg_content TEXT;
      `);
      
      // 3. 컬럼에 코멘트 추가
      await client.query(`
        COMMENT ON COLUMN proposals.wysiwyg_content 
        IS '자유양식 문서 내용 (HTML)';
      `);
      
      console.log('✅ wysiwygContent 컬럼이 성공적으로 추가되었습니다.');
    }
    
    // 4. 테이블 구조 확인
    console.log('\n📋 proposals 테이블 구조 확인...');
    const tableStructureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'proposals' 
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await client.query(tableStructureQuery);
    console.log('테이블 구조:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('\n✅ 컬럼 추가 완료!');
    
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
  addWysiwygColumn()
    .then(() => {
      console.log('\n🎉 스크립트 실행 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 중 오류:', error);
      process.exit(1);
    });
} 