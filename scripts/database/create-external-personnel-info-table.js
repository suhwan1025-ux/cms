const { sequelize } = require('../../src/models');

async function createTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // external_personnel_info 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS external_personnel_info (
        id SERIAL PRIMARY KEY,
        service_item_id INTEGER NOT NULL UNIQUE REFERENCES service_items(id) ON DELETE CASCADE,
        employee_number VARCHAR(255),
        rank VARCHAR(255),
        work_type VARCHAR(255),
        is_onsite BOOLEAN DEFAULT true,
        work_load VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      COMMENT ON TABLE external_personnel_info IS '외주인력 관리 정보';
      COMMENT ON COLUMN external_personnel_info.service_item_id IS '용역항목 ID';
      COMMENT ON COLUMN external_personnel_info.employee_number IS '사번';
      COMMENT ON COLUMN external_personnel_info.rank IS '직위';
      COMMENT ON COLUMN external_personnel_info.work_type IS '업무유형';
      COMMENT ON COLUMN external_personnel_info.is_onsite IS '상주여부';
      COMMENT ON COLUMN external_personnel_info.work_load IS '업무척도확인';
      
      CREATE INDEX IF NOT EXISTS idx_external_personnel_info_service_item_id 
        ON external_personnel_info(service_item_id);
    `);

    console.log('✅ external_personnel_info 테이블 생성 완료');

    // service_items 테이블에서 기존 데이터 마이그레이션
    console.log('🔄 기존 데이터 마이그레이션 시작...');
    
    await sequelize.query(`
      INSERT INTO external_personnel_info (service_item_id, employee_number, rank, work_type, is_onsite, work_load)
      SELECT id, employee_number, rank, work_type, is_onsite, work_load
      FROM service_items
      WHERE employee_number IS NOT NULL 
         OR rank IS NOT NULL 
         OR work_type IS NOT NULL 
         OR is_onsite IS NOT NULL 
         OR work_load IS NOT NULL
      ON CONFLICT (service_item_id) DO UPDATE SET
        employee_number = EXCLUDED.employee_number,
        rank = EXCLUDED.rank,
        work_type = EXCLUDED.work_type,
        is_onsite = EXCLUDED.is_onsite,
        work_load = EXCLUDED.work_load,
        updated_at = CURRENT_TIMESTAMP;
    `);

    console.log('✅ 데이터 마이그레이션 완료');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

createTable();

