// proposals 테이블의 status 컬럼 타입 확인
const models = require('../src/models');

async function checkStatusColumn() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 proposals 테이블의 status 컬럼 확인');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await models.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');

    // status 컬럼 타입 확인
    const [columns] = await models.sequelize.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'proposals' AND column_name = 'status'
    `);
    
    console.log('📋 status 컬럼 정보:');
    console.table(columns);

    // 실제 데이터 샘플 확인
    const [samples] = await models.sequelize.query(`
      SELECT id, status, is_draft, created_at
      FROM proposals 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('\n📄 최근 품의서 샘플 (status 값):');
    console.table(samples);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

checkStatusColumn();

