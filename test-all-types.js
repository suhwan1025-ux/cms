require('dotenv').config();
const axios = require('axios');

async function testQuestion(question) {
  try {
    const response = await axios.post('http://localhost:3002/api/ai/chat', {
      question,
      conversation_id: null,
      use_history: false
    }, { timeout: 60000 });
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`❓ 질문: ${question}`);
    console.log('='.repeat(80));
    
    // 참조 데이터 확인
    if (response.data.sources && response.data.sources.length > 0) {
      response.data.sources.forEach(source => {
        console.log(`\n📊 타입: ${source.type}`);
        if (source.data) {
          if (Array.isArray(source.data)) {
            console.log(`데이터 수: ${source.data.length}개`);
            if (source.data.length > 0) {
              console.log('첫 번째 항목:', JSON.stringify(source.data[0], null, 2));
            }
          } else {
            console.log('데이터:', JSON.stringify(source.data, null, 2));
          }
        }
      });
    } else {
      console.log('\n⚠️ 참조 데이터 없음');
    }
    
    return true;
  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
    return false;
  }
}

async function runTests() {
  const questions = [
    '노트북을 구매한 내역이 있나요?',
    '유지보수 용역은 몇 건인가요?',
    '등록된 공급업체는?',
    '수의계약의 규정은?',
    '프로젝트 목적은?',
  ];
  
  for (const q of questions) {
    await testQuestion(q);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

runTests();

