require('dotenv').config();
const axios = require('axios');

const AI_SERVER_URL = 'http://localhost:8000';

// 3개 테스트 질문
const testQuestions = [
    "승인된 품의서는 몇 건이야?",
    "올해 사업예산 총액은?",
    "1억원 이상 품의서는 몇 건?"
];

async function testRAG() {
    console.log('🧪 RAG 테스트 시작...\n');
    console.log('='.repeat(70));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < testQuestions.length; i++) {
        const question = testQuestions[i];
        console.log(`\n[${i + 1}/${testQuestions.length}] 질문: ${question}`);
        console.log('-'.repeat(70));
        
        const startTime = Date.now();
        
        try {
            const response = await axios.post(`${AI_SERVER_URL}/chat`, {
                message: question
            }, {
                timeout: 120000 // 120초 타임아웃
            });
            
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            
            console.log(`⏱️  응답 시간: ${elapsed}초`);
            console.log(`🤖 답변: ${response.data.answer.substring(0, 200)}...`);
            
            if (response.data.sql) {
                console.log(`📝 생성 SQL: ${response.data.sql.substring(0, 100)}...`);
            }
            
            if (response.data.selected_examples !== undefined) {
                console.log(`🎯 RAG 선택: 30개 중 ${response.data.selected_examples}개 예시 사용`);
            }
            
            if (response.data.sources && response.data.sources.length > 0) {
                console.log(`📚 참조 데이터: ${response.data.sources.length}개`);
            }
            
            console.log(`✅ 성공`);
            successCount++;
            
        } catch (error) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`⏱️  경과 시간: ${elapsed}초`);
            
            if (error.code === 'ECONNABORTED') {
                console.log(`❌ 오류: 타임아웃 (120초 초과)`);
            } else if (error.response) {
                console.log(`❌ 오류: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else {
                console.log(`❌ 오류: ${error.message}`);
            }
            errorCount++;
        }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 테스트 결과 요약:');
    console.log(`   ✅ 성공: ${successCount}/${testQuestions.length}`);
    console.log(`   ❌ 실패: ${errorCount}/${testQuestions.length}`);
    console.log(`   📈 성공률: ${((successCount / testQuestions.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(70));
}

testRAG().catch(console.error);















