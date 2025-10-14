require('dotenv').config();
const axios = require('axios');

const AI_SERVER_URL = 'http://localhost:8000';

// 테스트 질문들 (30개 예시 패턴 기반)
const testQuestions = [
    // 기본 조회
    "승인된 품의서는 몇 건이야?",
    "전체 품의서 목록 보여줘",
    "활성화된 부서 목록",
    
    // 집계 및 통계
    "올해 사업예산 총액은?",
    "상태별 품의서 통계를 보여줘",
    "올해 월별 품의서 건수는?",
    "부서별 예산 총액은?",
    
    // 금액/숫자 조건
    "1억원 이상 품의서는 몇 건?",
    "5천만원 이상 1억원 미만 예산은?",
    "예산이 가장 큰 프로젝트는 뭐야?",
    "예산이 가장 작은 프로젝트 3개 보여줘",
    
    // 날짜 처리 (기존 Rule-Based로 불가능했던 질문!)
    "올해 3월에 승인된 품의서는?",
    "지난달 승인된 품의서 개수는?",
    "최근 30일간 생성된 품의서는?",
    
    // 문자열 검색 (기존 Rule-Based로 불가능했던 질문!)
    "품의서 제목에 '노트북'이 포함된 건은?",
    "IT부서가 집행하는 예산은?",
    "이름에 '서버'가 포함된 구매 품목은?",
    
    // JOIN 쿼리 (기존 Rule-Based로 불가능했던 질문!)
    "최근 구매 품목과 품의서 제목 함께 보여줘",
    "품의서별 구매 품목 개수는?",
    "공급업체별 계약 건수는?",
    
    // 복잡한 조건 (기존 Rule-Based로 불가능했던 질문!)
    "IT부서의 승인된 1억원 이상 품의서는?",
    "올해 승인됐지만 집행되지 않은 예산은?",
    "필수 사업이면서 예산이 5천만원 이상인 프로젝트는?",
    
    // 서브쿼리 (기존 Rule-Based로 불가능했던 질문!)
    "평균 예산보다 큰 프로젝트는?",
    "가장 많은 품의서를 작성한 부서는?",
];

async function testTextToSQL() {
    console.log('🧪 Text-to-SQL AI 어시스턴트 테스트\n');
    console.log('='.repeat(70));
    
    for (let i = 0; i < testQuestions.length; i++) {
        const question = testQuestions[i];
        console.log(`\n[${i + 1}/${testQuestions.length}] 질문: "${question}"`);
        console.log('-'.repeat(70));
        
        try {
            const response = await axios.post(`${AI_SERVER_URL}/chat`, {
                message: question
            });
            
            const { answer, sql, sources } = response.data;
            
            // 생성된 SQL 출력
            if (sql) {
                console.log(`\n📝 생성된 SQL:\n${sql}`);
            }
            
            // 데이터 소스 출력
            if (sources && sources.length > 0) {
                console.log(`\n📊 조회 데이터: ${sources[0].count}건`);
            }
            
            // 답변 출력
            console.log(`\n💬 답변:\n${answer}`);
            
        } catch (error) {
            if (error.response) {
                console.log(`\n❌ 오류: ${error.response.status} - ${error.response.data.detail}`);
            } else if (error.code === 'ECONNREFUSED') {
                console.log('\n❌ AI 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
                break;
            } else {
                console.log(`\n❌ 오류: ${error.message}`);
            }
        }
        
        // 다음 질문 전 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ 테스트 완료!');
}

testTextToSQL();

