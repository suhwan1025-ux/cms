require('dotenv').config();
const axios = require('axios');

async function testAI() {
  try {
    console.log('테스트: 공급업체 질문\n');
    
    const response = await axios.post('http://localhost:3002/api/ai/chat', {
      question: '등록된 공급업체는 몇 개인가요?',
      conversation_id: null,
      use_history: false
    }, { timeout: 60000 });
    
    console.log('💬 AI 답변:');
    console.log(response.data.answer);
    console.log('\n📊 참조 데이터:');
    console.log(JSON.stringify(response.data.sources, null, 2));
    
  } catch (error) {
    console.error('❌ 오류:', error.response?.data || error.message);
  }
}

testAI();

