const { sequelize } = require('../../src/models');
const migration = require('../../migrations/20241104-add-external-personnel-fields-to-service-items');

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');
    
    console.log('🔄 마이그레이션 시작...');
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    console.log('✅ 마이그레이션 완료!');
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();

