const { Sequelize } = require('sequelize');
const config = require('./config/database.js');

// 개발 환경 설정 사용
const dbConfig = config.development;

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: console.log
});

async function addTitleColumn() {
  try {
    console.log('🔄 데이터베이스 연결 중...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    console.log('🔄 데이터베이스 테이블 확인 중...');
    
    // 먼저 존재하는 테이블들을 확인
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name ILIKE '%proposal%'
    `);
    
    console.log('📋 Proposal 관련 테이블들:', tables);
    
    // 가능한 테이블 이름들
    const possibleTableNames = ['Proposals', 'proposals', 'Proposal', 'proposal'];
    let actualTableName = null;
    
    for (const tableName of possibleTableNames) {
      const [checkTable] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = '${tableName}'
      `);
      
      if (checkTable.length > 0) {
        actualTableName = tableName;
        console.log('✅ 실제 테이블 이름:', actualTableName);
        break;
      }
    }
    
    if (!actualTableName) {
      throw new Error('Proposals 테이블을 찾을 수 없습니다.');
    }
    
    console.log('🔄 title 컬럼 확인 중...');
    
    // title 컬럼이 이미 존재하는지 확인
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = '${actualTableName}' 
      AND COLUMN_NAME = 'title'
    `);

    if (results.length > 0) {
      console.log('⚠️  title 컬럼이 이미 존재합니다.');
    } else {
      // title 컬럼 추가 (PostgreSQL 구문)
      await sequelize.query(`
        ALTER TABLE "${actualTableName}" 
        ADD COLUMN title VARCHAR(500)
      `);
      
      // PostgreSQL에서는 별도로 코멘트 추가
      await sequelize.query(`
        COMMENT ON COLUMN "${actualTableName}".title IS '품의서 제목'
      `);
      console.log('✅ title 컬럼이 성공적으로 추가되었습니다.');
    }

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 데이터베이스 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  addTitleColumn();
}

module.exports = addTitleColumn; 