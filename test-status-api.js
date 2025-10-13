const https = require('https');
const http = require('http');
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

async function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testStatusUpdate() {
  try {
    console.log('=== 품의서 상태 업데이트 종합 테스트 ===');
    console.log('');
    
    const proposalId = 98;
    
    // 1. DB에서 현재 상태 직접 확인
    console.log('1️⃣ DB에서 현재 상태 확인...');
    await sequelize.authenticate();
    
    const [before] = await sequelize.query(`
      SELECT id, title, status, is_draft, approval_date 
      FROM proposals WHERE id = ${proposalId}
    `);
    
    if (before.length === 0) {
      console.log('❌ 품의서를 찾을 수 없습니다.');
      return;
    }
    
    console.log('   ID:', before[0].id);
    console.log('   제목:', before[0].title);
    console.log('   현재 상태 (DB):', before[0].status);
    console.log('   임시저장:', before[0].is_draft);
    console.log('');
    
    // 2. API로 상태 업데이트
    console.log('2️⃣ API를 통해 상태를 "결재완료"로 변경 시도...');
    
    const updateOptions = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/proposals/${proposalId}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const updateData = {
      status: '결재완료',
      statusDate: new Date().toISOString().split('T')[0],
      changeReason: '테스트 상태 변경',
      changedBy: '테스트'
    };
    
    console.log('   요청 데이터:', updateData);
    
    const updateResult = await makeRequest(updateOptions, updateData);
    console.log('   API 응답 상태:', updateResult.status);
    console.log('   API 응답 데이터:', updateResult.data);
    console.log('');
    
    // 3. DB에서 변경 후 상태 확인
    console.log('3️⃣ DB에서 변경 후 상태 확인...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const [after] = await sequelize.query(`
      SELECT id, title, status, is_draft, approval_date, updated_at 
      FROM proposals WHERE id = ${proposalId}
    `);
    
    console.log('   변경 후 상태 (DB):', after[0].status);
    console.log('   임시저장:', after[0].is_draft);
    console.log('   결재완료일:', after[0].approval_date || '없음');
    console.log('   최종 수정:', after[0].updated_at);
    console.log('');
    
    // 4. 결과 분석
    console.log('=== 결과 분석 ===');
    console.log('');
    console.log('변경 전:', before[0].status);
    console.log('변경 후:', after[0].status);
    console.log('');
    
    if (after[0].status === 'approved') {
      console.log('✅ 성공! 상태가 "approved"로 변경되었습니다!');
    } else if (after[0].status === before[0].status) {
      console.log('❌ 실패! 상태가 변경되지 않았습니다.');
      console.log('');
      console.log('가능한 원인:');
      console.log('1. 서버가 재시작되지 않았을 수 있습니다.');
      console.log('2. API 엔드포인트가 제대로 작동하지 않습니다.');
      console.log('3. 데이터베이스 업데이트가 실패했습니다.');
    } else {
      console.log('⚠️  예상치 못한 상태:', after[0].status);
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

testStatusUpdate();

