require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Sequelize } = require('sequelize');
const models = require('../../src/models');
const config = require('../../config/database');

const dbConfig = config.development;
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: false
});

async function forceSyncProposal() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!\n');

    console.log('🔄 Proposal 테이블 강제 동기화 중...');
    await models.Proposal.sync({ force: true });
    console.log('✅ Proposal 테이블 재생성 완료!');

    console.log('🔄 ProposalHistory 테이블 동기화 중...');
    await models.ProposalHistory.sync({ force: true });
    console.log('✅ ProposalHistory 테이블 재생성 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

forceSyncProposal(); 