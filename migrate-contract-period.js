const { Sequelize } = require('sequelize');
const path = require('path');

// 데이터베이스 연결
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: console.log
});

async function migrateContractPeriod() {
  try {
    console.log('🔄 계약기간 필드 마이그레이션 시작...');

    // 트랜잭션 시작
    const transaction = await sequelize.transaction();

    try {
      // 1. 새로운 컬럼 추가
      console.log('📝 새로운 컬럼 추가 중...');
      
      await sequelize.query(`
        ALTER TABLE purchase_items 
        ADD COLUMN contract_period_type VARCHAR(50) DEFAULT 'permanent'
      `, { transaction });

      await sequelize.query(`
        ALTER TABLE purchase_items 
        ADD COLUMN custom_contract_period TEXT
      `, { transaction });

      // 2. 기존 데이터를 새로운 구조로 변환
      console.log('🔄 기존 데이터 변환 중...');
      
      // 모든 기존 구매품목을 영구 계약으로 설정
      await sequelize.query(`
        UPDATE purchase_items 
        SET contract_period_type = 'permanent', 
            custom_contract_period = NULL
        WHERE contract_period_type IS NULL
      `, { transaction });

      // 3. 기존 requestDepartment 컬럼 제거 (선택사항 - 백업을 위해 주석 처리)
      // await sequelize.query(`
      //   ALTER TABLE purchase_items DROP COLUMN request_department
      // `, { transaction });

      await transaction.commit();
      console.log('✅ 계약기간 필드 마이그레이션 완료!');

      // 마이그레이션 결과 확인
      const result = await sequelize.query(`
        SELECT id, item, contract_period_type, custom_contract_period 
        FROM purchase_items 
        LIMIT 10
      `);
      
      console.log('📊 마이그레이션 결과 샘플:');
      console.table(result[0]);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateContractPeriod()
    .then(() => {
      console.log('🎉 마이그레이션이 성공적으로 완료되었습니다!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 마이그레이션 중 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = migrateContractPeriod; 