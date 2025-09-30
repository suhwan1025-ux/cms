require('dotenv').config();
const { Sequelize } = require('sequelize');
const models = require('./src/models');
const config = require('./config/database');

const dbConfig = config.development;
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: false
});

async function createSampleHistory() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!\n');

    // 기존 품의서 조회
    const proposals = await models.Proposal.findAll({
      limit: 10
    });

    if (proposals.length === 0) {
      console.log('❌ 품의서가 없습니다. 먼저 샘플 품의서를 생성해주세요.');
      return;
    }

    console.log(`📝 ${proposals.length}개의 품의서에 히스토리 데이터 생성 중...`);

    for (const proposal of proposals) {
      // 각 품의서에 대해 2-3개의 히스토리 생성
      const historyCount = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < historyCount; i++) {
        const statuses = ['품의서 작성', '검토중', '승인대기', '결재완료', '예가산정', '입찰실시'];
        const previousStatus = statuses[i] || '품의서 작성';
        const newStatus = statuses[i + 1] || '결재완료';
        
        await models.ProposalHistory.create({
          proposalId: proposal.id,
          previousStatus,
          newStatus,
          changedBy: ['관리자', '김철수', '이영희', '박민수'][Math.floor(Math.random() * 4)],
          changeReason: ['일반적인 상태 변경', '검토 완료', '승인 처리', '결재 완료'][Math.floor(Math.random() * 4)]
        });
      }
    }

    console.log('✅ 샘플 히스토리 데이터 생성 완료!');
    
    // 생성된 히스토리 수 확인
    const totalHistory = await models.ProposalHistory.count();
    console.log(`📊 총 ${totalHistory}개의 히스토리 데이터가 생성되었습니다.`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

createSampleHistory(); 