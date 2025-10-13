const fetch = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3001';

async function testStatusUpdate() {
  try {
    console.log('=== 품의서 상태 업데이트 테스트 ===');
    console.log('');
    
    const proposalId = 98; // 테스트할 품의서 ID
    
    // 1. 현재 상태 확인
    console.log('1️⃣ 현재 품의서 정보 조회 중...');
    const getResponse = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}`);
    
    if (!getResponse.ok) {
      throw new Error(`품의서 조회 실패: ${getResponse.status}`);
    }
    
    const currentProposal = await getResponse.json();
    console.log('   현재 상태:', currentProposal.status);
    console.log('   제목:', currentProposal.title);
    console.log('');
    
    // 2. 상태 업데이트 요청
    console.log('2️⃣ 상태를 "결재완료"로 변경 중...');
    const updateResponse = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: '결재완료',
        statusDate: new Date().toISOString().split('T')[0],
        changeReason: '테스트 상태 변경',
        changedBy: '테스트'
      })
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`상태 업데이트 실패: ${updateResponse.status} - ${errorText}`);
    }
    
    const updateResult = await updateResponse.json();
    console.log('   ✅ 서버 응답:', updateResult);
    console.log('');
    
    // 3. 업데이트 후 상태 재확인
    console.log('3️⃣ 업데이트 후 품의서 정보 재조회 중...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
    
    const verifyResponse = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}`);
    
    if (!verifyResponse.ok) {
      throw new Error(`품의서 재조회 실패: ${verifyResponse.status}`);
    }
    
    const updatedProposal = await verifyResponse.json();
    console.log('   업데이트 후 상태:', updatedProposal.status);
    console.log('   결재완료일:', updatedProposal.approvalDate || '없음');
    console.log('');
    
    // 4. 결과 확인
    console.log('=== 결과 ===');
    if (updatedProposal.status === 'approved') {
      console.log('✅ 성공! 상태가 "approved"로 변경되었습니다.');
    } else {
      console.log('❌ 실패! 상태가 변경되지 않았습니다.');
      console.log('   예상: approved');
      console.log('   실제:', updatedProposal.status);
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  }
}

testStatusUpdate();

