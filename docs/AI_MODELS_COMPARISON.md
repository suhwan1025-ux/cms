# AI 모델 비교 가이드

## 🤖 탑재된 3가지 AI 시스템

### 1. 규칙 기반 AI 어시스턴트 (기본)
**경로**: `/ai-assistant`
**파일**: `src/components/AIAssistant.js`

#### 특징
- ✅ **매우 빠른 응답속도** (즉시 응답)
- ✅ **안정적 동작** (오류 없음)
- ✅ **가벼운 리소스 사용**
- ❌ 제한적 자연어 이해
- ❌ 단순 패턴 매칭

#### 구현 방식
```javascript
// 키워드 기반 분류
if (query.includes('검색') || query.includes('찾아')) {
  return await searchProposals(query);
}
```

#### 적합한 사용처
- 빠른 응답이 필요한 경우
- 안정성이 최우선인 환경
- 리소스가 제한적인 환경

---

### 2. Transformers.js AI (고급)
**경로**: `/real-ai-assistant`
**파일**: `src/components/RealAIAssistant.js`

#### 특징
- ✅ **실제 AI 모델** (DistilBERT, DistilGPT-2, MiniLM)
- ✅ **의미 기반 검색** (임베딩 유사도)
- ✅ **자연어 생성** (GPT-2 기반)
- ❌ 초기 로딩 시간 (모델 다운로드)
- ❌ 높은 메모리 사용량

#### 탑재 모델
```javascript
// 1. 의도 분류 모델
classifierRef.current = await pipeline(
  'text-classification',
  'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
);

// 2. 텍스트 생성 모델
generatorRef.current = await pipeline(
  'text-generation',
  'Xenova/distilgpt2'
);

// 3. 임베딩 모델
embeddingRef.current = await pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2'
);
```

#### 고급 기능
- 🧠 **코사인 유사도 계산**
- 🔍 **의미 검색** (키워드가 달라도 의미가 같으면 검색)
- 📝 **자연어 응답 생성**
- 🎯 **관련도 점수 계산**

#### 적합한 사용처
- 고급 자연어 처리가 필요한 경우
- 의미 기반 검색이 중요한 환경
- 충분한 하드웨어 리소스가 있는 경우

---

### 3. 로컬 AI (순수 JavaScript)
**경로**: `/local-ai`
**파일**: `src/components/LocalAI.js`

#### 특징
- ✅ **외부 라이브러리 불필요** (순수 JS)
- ✅ **폐쇄망 완벽 지원**
- ✅ **학습 기능** (대화 패턴 학습)
- ✅ **컨텍스트 기억** (이전 대화 기억)
- ✅ **예측 분석** (트렌드 예측)

#### 고급 AI 알고리즘
```javascript
// 의도 분류 알고리즘
const classifyIntent = (message) => {
  const scores = {};
  Object.entries(aiKnowledge.intents).forEach(([intent, keywords]) => {
    let score = 0;
    keywords.forEach(keyword => {
      if (message.includes(keyword)) {
        score += keyword.length; // 긴 키워드일수록 높은 점수
      }
    });
    scores[intent] = score;
  });
  
  // 학습된 패턴 적용
  aiKnowledge.learnedPatterns.forEach((learnedIntent, pattern) => {
    if (message.includes(pattern)) {
      scores[learnedIntent] = (scores[learnedIntent] || 0) + 5;
    }
  });
  
  return getBestIntent(scores);
};
```

#### 지능형 기능
- 🧠 **패턴 학습** (사용할수록 똑똑해짐)
- 📊 **예측 모델링** (승인률, 성장률 예측)
- 🎯 **리스크 평가** (계약별 리스크 점수 계산)
- 📈 **벤치마크 비교** (업계 평균과 비교)
- 💡 **맞춤형 추천** (상황별 최적화 제안)

#### 적합한 사용처
- 폐쇄망에서 고급 AI가 필요한 경우
- 학습 기능이 중요한 환경
- 외부 의존성을 최소화해야 하는 경우

---

## 📊 성능 비교표

| 항목 | 규칙 기반 | Transformers.js | 로컬 AI |
|------|-----------|-----------------|---------|
| **응답 속도** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **정확도** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **자연어 이해** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **학습 능력** | ❌ | ❌ | ⭐⭐⭐⭐⭐ |
| **메모리 사용량** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **초기 로딩** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ |
| **폐쇄망 지원** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **확장성** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🎯 사용 시나리오별 추천

### 시나리오 1: 빠른 프로토타입
**추천**: 규칙 기반 AI
- 즉시 사용 가능
- 안정적 동작 보장
- 개발 시간 최소화

### 시나리오 2: 고급 자연어 처리
**추천**: Transformers.js AI
- 실제 AI 모델 활용
- 의미 기반 검색
- 자연어 생성 기능

### 시나리오 3: 폐쇄망 + 학습 기능
**추천**: 로컬 AI
- 완전 독립적 동작
- 사용자 패턴 학습
- 예측 분석 기능

### 시나리오 4: 하이브리드 접근
**추천**: 3가지 모두 제공
- 사용자가 상황에 맞게 선택
- A/B 테스트 가능
- 점진적 업그레이드

---

## 🔧 기술적 구현 차이

### 1. 데이터 처리 방식

#### 규칙 기반
```javascript
// 단순 키워드 매칭
const results = proposalData.filter(proposal => {
  const searchText = proposal.purpose.toLowerCase();
  return searchTerms.some(term => searchText.includes(term));
});
```

#### Transformers.js
```javascript
// 임베딩 기반 유사도 계산
const queryEmbedding = await embeddingRef.current(message);
const similarity = calculateCosineSimilarity(queryEmbedding.data, proposalEmbedding.data);
```

#### 로컬 AI
```javascript
// 가중치 기반 점수 계산 + 학습 패턴 적용
let score = 0;
keywords.forEach(keyword => {
  if (message.includes(keyword)) {
    score += keyword.length * getKeywordWeight(keyword);
  }
});
// 학습된 패턴 보정
score += getLearnedPatternBonus(message);
```

### 2. 응답 생성 방식

#### 규칙 기반
- 사전 정의된 템플릿
- 조건부 분기 로직
- 정적 응답 구조

#### Transformers.js
- GPT-2 모델 기반 생성
- 컨텍스트 주입
- 동적 자연어 생성

#### 로컬 AI
- 상황별 템플릿 + 동적 데이터
- 컨텍스트 기반 응답
- 학습된 패턴 활용

---

## 🚀 향후 발전 방향

### 단기 (1-3개월)
- [ ] 로컬 AI 학습 알고리즘 고도화
- [ ] Transformers.js 모델 최적화
- [ ] 하이브리드 AI 시스템 구축

### 중기 (3-6개월)
- [ ] 한국어 특화 모델 도입
- [ ] 벡터 데이터베이스 연동
- [ ] 실시간 학습 시스템

### 장기 (6개월+)
- [ ] 커스텀 도메인 모델 훈련
- [ ] 멀티모달 AI (텍스트+이미지)
- [ ] 예측 분석 고도화

---

## 📋 선택 가이드

### 즉시 사용하고 싶다면
→ **규칙 기반 AI** (`/ai-assistant`)

### 실제 AI 모델을 체험하고 싶다면
→ **Transformers.js AI** (`/real-ai-assistant`)

### 폐쇄망에서 고급 AI를 원한다면
→ **로컬 AI** (`/local-ai`)

### 모든 기능을 비교하고 싶다면
→ **3가지 모두 사용해보세요!**

---

**💡 팁**: 각 AI 시스템은 독립적으로 동작하므로, 상황에 맞게 선택하여 사용하실 수 있습니다. 폐쇄망 환경에서는 로컬 AI가 가장 적합하며, 고급 자연어 처리가 필요한 경우 Transformers.js AI를 추천합니다. 