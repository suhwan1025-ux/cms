# 실제 AI 모델 탑재 가이드

## 🎯 현재 상태
- **규칙 기반 시스템**: 키워드 매칭과 템플릿 응답
- **데이터베이스 쿼리**: SQL 기반 검색 및 집계
- **패턴 인식**: 사전 정의된 규칙으로 의도 파악

## 🚀 실제 AI 모델 옵션

### 1. Ollama (추천)
**장점**: 완전 로컬, 다양한 모델 지원, 쉬운 설치
```bash
# Ollama 설치
curl -fsSL https://ollama.ai/install.sh | sh

# 한국어 모델 다운로드
ollama pull llama2-korean
ollama pull codellama
```

**구현 예시**:
```javascript
// server.js에 추가
const ollama = require('ollama');

app.post('/api/ai/chat', async (req, res) => {
  try {
    const response = await ollama.chat({
      model: 'llama2-korean',
      messages: [{
        role: 'user',
        content: `계약관리시스템 컨텍스트: ${JSON.stringify(proposalData)}\n\n질문: ${req.body.message}`
      }]
    });
    
    res.json({ response: response.message.content });
  } catch (error) {
    res.status(500).json({ error: 'AI 응답 생성 실패' });
  }
});
```

### 2. Hugging Face Transformers.js
**장점**: 브라우저에서 직접 실행, 외부 서버 불필요
```bash
npm install @xenova/transformers
```

**구현 예시**:
```javascript
// 클라이언트 측에서 실행
import { pipeline } from '@xenova/transformers';

const classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
const generator = await pipeline('text-generation', 'Xenova/gpt2');

// 의도 분류
const intent = await classifier(userMessage);

// 응답 생성
const response = await generator(prompt, { max_length: 100 });
```

### 3. TensorFlow.js
**장점**: 커스텀 모델 학습 가능, 웹 최적화
```bash
npm install @tensorflow/tfjs-node
```

**구현 예시**:
```javascript
const tf = require('@tensorflow/tfjs-node');

// 사전 훈련된 모델 로드
const model = await tf.loadLayersModel('file://./models/contract-classifier/model.json');

// 텍스트 분류
const prediction = model.predict(encodedText);
```

## 🔧 단계별 업그레이드 방법

### Phase 1: 의도 분류 개선
```javascript
// 현재: 키워드 매칭
if (query.includes('검색')) { ... }

// 업그레이드: ML 기반 분류
const intent = await classifyIntent(query);
switch(intent.label) {
  case 'SEARCH_REQUEST':
    return await handleSearch(query, intent.confidence);
  case 'STATUS_INQUIRY':
    return await handleStatus(query, intent.confidence);
}
```

### Phase 2: 자연어 이해 향상
```javascript
// 엔티티 추출
const entities = await extractEntities(query);
// "100만원 이상 구매 계약 검색" → 
// { amount: 1000000, operator: ">=", type: "purchase", action: "search" }

const searchParams = {
  contractType: entities.type,
  minAmount: entities.amount,
  operator: entities.operator
};
```

### Phase 3: 대화형 AI 구현
```javascript
// 대화 컨텍스트 유지
class ConversationManager {
  constructor() {
    this.context = new Map();
  }
  
  async processMessage(userId, message) {
    const context = this.context.get(userId) || {};
    const response = await this.aiModel.generate({
      message,
      context,
      systemPrompt: "당신은 계약관리시스템 전문가입니다..."
    });
    
    this.context.set(userId, { ...context, lastResponse: response });
    return response;
  }
}
```

## 🎯 추천 업그레이드 경로

### 즉시 적용 가능 (1-2일)
1. **Ollama 설치**: 로컬 LLM 환경 구축
2. **기본 대화 API**: 단순 질의응답 구현
3. **컨텍스트 주입**: 품의서 데이터를 프롬프트에 포함

### 단기 개선 (1주일)
1. **의도 분류 모델**: 사용자 질문 유형 자동 분류
2. **엔티티 추출**: 금액, 날짜, 계약유형 자동 인식
3. **응답 템플릿**: 구조화된 답변 생성

### 중장기 고도화 (1개월)
1. **RAG 시스템**: 벡터 데이터베이스 구축
2. **커스텀 모델**: 계약 도메인 특화 파인튜닝
3. **대화 메모리**: 이전 대화 내용 기억

## 💾 필요한 리소스

### 하드웨어 요구사항
- **CPU**: 최소 4코어 (8코어 권장)
- **RAM**: 최소 8GB (16GB 권장)
- **Storage**: 모델 저장용 10-50GB

### 소프트웨어 의존성
```json
{
  "dependencies": {
    "ollama": "^0.5.0",
    "@xenova/transformers": "^2.6.0",
    "langchain": "^0.0.200",
    "chromadb": "^1.5.0",
    "sentence-transformers": "^2.2.0"
  }
}
```

## 🔒 폐쇄망 고려사항

### 모델 다운로드
```bash
# 인터넷 연결된 환경에서 모델 다운로드
ollama pull llama2-korean
# 모델 파일을 폐쇄망으로 복사

# 폐쇄망에서 로컬 모델 로드
ollama create custom-model -f ./Modelfile
```

### 보안 강화
- 모든 처리가 로컬에서 수행
- 외부 API 호출 없음
- 데이터 암호화 저장
- 접근 권한 관리

## 📊 성능 비교

| 방식 | 응답속도 | 정확도 | 리소스 사용량 | 구현 난이도 |
|------|----------|--------|---------------|-------------|
| 현재 (규칙기반) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐ |
| Ollama | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Transformers.js | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| 커스텀 모델 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

**현재 시스템은 빠르고 안정적인 규칙 기반 AI입니다. 실제 AI 모델이 필요하시다면 위의 가이드를 참고하여 단계적으로 업그레이드하실 수 있습니다.** 