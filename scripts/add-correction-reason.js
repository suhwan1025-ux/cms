const { Sequelize } = require('sequelize');
require('dotenv').config();

// 데이터베이스 설정
const sequelize = new Sequelize(
  process.env.DB_NAME || 'cms_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '1234',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function addCorrectionReasonColumn() {
  try {
    console.log('🔌 데이터베이스 연결 중...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 컬럼이 이미 있는지 확인
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'proposals' 
      AND column_name = 'correction_reason'
    `);

    if (results.length > 0) {
      console.log('⚠️  correction_reason 컬럼이 이미 존재합니다.');
      await sequelize.close();
      return;
    }

    console.log('📝 correction_reason 컬럼 추가 중...');

    // 컬럼 추가
    await sequelize.query(`
      ALTER TABLE proposals 
      ADD COLUMN correction_reason TEXT NULL
    `);
    console.log('✅ 컬럼 추가 완료');

    // 코멘트 추가
    await sequelize.query(`
      COMMENT ON COLUMN proposals.correction_reason IS '정정 사유'
    `);
    console.log('✅ 컬럼 코멘트 추가 완료');

    // 확인
    const [verification] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'proposals' 
      AND column_name = 'correction_reason'
    `);

    console.log('\n📋 추가된 컬럼 정보:');
    console.log(verification[0]);

    console.log('\n✅ 모든 작업이 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 데이터베이스 연결 종료');
  }
}

// 스크립트 실행
addCorrectionReasonColumn();

