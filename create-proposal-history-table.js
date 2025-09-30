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

// 모델 로드
const models = require('./src/models');

async function createProposalHistoryTable() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');

    // ProposalHistory 테이블 동기화
    console.log('\n📝 ProposalHistory 테이블 생성 중...');
    await models.ProposalHistory.sync({ force: true });
    console.log('✅ ProposalHistory 테이블 생성 완료!');

    console.log('\n🎉 모든 작업이 완료되었습니다!');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

createProposalHistoryTable(); 