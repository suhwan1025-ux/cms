const { Sequelize } = require('sequelize');
const config = require('./config/database');

// 데이터베이스 연결 설정 (development 환경 사용)
const dbConfig = config.development;
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: console.log
});

async function migrateRequestDepartments() {
  try {
    console.log('🔄 요청부서 데이터 마이그레이션 시작...');
    
    // 1. 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');
    
    // 2. 기존 데이터 조회
    const [results] = await sequelize.query(`
      SELECT id, request_department 
      FROM purchase_items 
      WHERE request_department IS NOT NULL 
        AND request_department != ''
        AND request_department NOT LIKE '[%'
    `);
    
    console.log(`📊 변환할 데이터: ${results.length}개`);
    
    if (results.length === 0) {
      console.log('✅ 변환할 데이터가 없습니다.');
      return;
    }
    
    // 3. 트랜잭션으로 데이터 변환
    const transaction = await sequelize.transaction();
    
    try {
      for (const row of results) {
        const { id, request_department } = row;
        
        // 단일 문자열을 JSON 배열로 변환
        const jsonArray = JSON.stringify([request_department]);
        
        await sequelize.query(`
          UPDATE purchase_items 
          SET request_department = :jsonArray 
          WHERE id = :id
        `, {
          replacements: { jsonArray, id },
          transaction
        });
        
        console.log(`✅ ID ${id}: "${request_department}" → ${jsonArray}`);
      }
      
      await transaction.commit();
      console.log('🎉 마이그레이션 완료!');
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateRequestDepartments();
}

module.exports = migrateRequestDepartments; 