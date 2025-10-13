# 🎉 AI 어시스턴트 구축 완료!

계약 관리 시스템에 AI 어시스턴트 기능이 성공적으로 추가되었습니다.

## 📁 생성된 파일 목록

### Python AI 서버 (`ai_server/`)
```
ai_server/
├── main.py                 # FastAPI 서버 메인
├── rag_engine.py          # RAG 시스템 엔진
├── db_connector.py        # PostgreSQL 연결
├── requirements.txt       # Python 패키지
├── env.example           # 환경 변수 예시
├── start.bat             # 서버 시작 스크립트
└── README.md             # AI 서버 문서
```

### React 프론트엔드
```
src/components/
└── AIAssistant.js         # AI 채팅 UI 컴포넌트
```

### Node.js 백엔드
```
server.js                  # AI 프록시 API 추가됨
```

### 문서
```
OLLAMA_SETUP_GUIDE.md      # Ollama 설치 가이드
AI_ASSISTANT_SETUP_COMPLETE.md  # 이 문서
```

---

## 🚀 빠른 시작 가이드

### 1단계: Ollama 설치 (최초 1회)

```bash
# 1. https://ollama.com/download 에서 Windows 설치 파일 다운로드
# 2. OllamaSetup.exe 실행
# 3. 모델 다운로드
ollama pull qwen2.5:7b
ollama pull nomic-embed-text
```

**소요 시간**: 약 10-20분 (다운로드 속도에 따라)

### 2단계: Python 환경 설정 (최초 1회)

```bash
# 프로젝트 루트에서
cd ai_server

# 가상환경 생성
python -m venv venv

# 가상환경 활성화 (PowerShell)
.\venv\Scripts\Activate.ps1

# 패키지 설치
pip install -r requirements.txt

# 환경 변수 설정
copy env.example .env
# .env 파일을 열어서 DB_PASSWORD 등 수정
```

**소요 시간**: 약 5-10분

### 3단계: 데이터 인덱싱 (최초 1회)

AI 서버 첫 실행 시 자동으로 수행되지만, 시간이 걸립니다.

```bash
# ai_server 폴더에서
python main.py
```

**콘솔 출력 예시:**
```
🔄 데이터 인덱싱 시작...
품의서 850개 인덱싱 중...
  진행률: 50/900
  진행률: 100/900
  ...
사업예산 50개 인덱싱 중...
✅ 인덱싱 완료! 총 900개 문서
```

**소요 시간**: 약 5-15분 (데이터 양에 따라)

### 4단계: 일상적 사용

```bash
# 터미널 1: AI 서버
cd ai_server
python main.py

# 터미널 2: Node.js 서버
node server.js

# 브라우저
http://localhost:3002
# 우측 하단 🤖 버튼 클릭
```

---

## 🎯 주요 기능

### 1. 자연어 질의응답
- "2025년 IT팀 예산 현황은?"
- "최근 1개월 결재완료된 용역계약 목록 보여줘"
- "외주인력 중 종료 예정인 사람은?"

### 2. 컨텍스트 기반 대화
- 이전 대화 내용을 기억
- 연속적인 질문 가능
- conversation_id로 세션 관리

### 3. 데이터 소스 추적
- AI 답변의 근거가 된 데이터 표시
- 품의서 ID, 사업예산명 등 확인 가능

### 4. 실시간 데이터 반영
- 새 품의서 작성 후 `/api/ai/reindex` 호출
- 또는 cron job으로 자동 재인덱싱

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    사용자 브라우저                          │
│                http://172.22.32.200:3002                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              React Frontend (포트 3002)                   │
│              • AIAssistant.js 컴포넌트                    │
│              • 채팅 UI                                    │
└──────────────────────┬──────────────────────────────────┘
                       │ /api/ai/*
                       ▼
┌─────────────────────────────────────────────────────────┐
│           Node.js 서버 (포트 3002)                        │
│           • AI 프록시 엔드포인트                           │
│           • /api/ai/chat                                 │
│           • /api/ai/health                               │
│           • /api/ai/reindex                              │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP
                       ▼
┌─────────────────────────────────────────────────────────┐
│         Python AI 서버 (포트 8000)                        │
│         • FastAPI                                        │
│         • RAG Engine                                     │
│         • ChromaDB (벡터 검색)                            │
└──────┬─────────────────────────────┬────────────────────┘
       │                             │
       ▼                             ▼
┌──────────────┐            ┌──────────────────────┐
│ PostgreSQL DB│            │  Ollama (포트 11434)  │
│ (포트 5432)   │            │  • qwen2.5:7b        │
│              │            │  • nomic-embed-text  │
└──────────────┘            └──────────────────────┘
```

---

## 📊 API 엔드포인트

### Node.js 프록시 API

#### 1. AI 헬스 체크
```http
GET /api/ai/health

Response:
{
  "status": "healthy",
  "ollama_status": "healthy",
  "db_status": "healthy",
  "vector_db_status": "healthy"
}
```

#### 2. AI 채팅
```http
POST /api/ai/chat
Content-Type: application/json

{
  "question": "2025년 IT팀 예산은?",
  "conversation_id": null,
  "use_history": true
}

Response:
{
  "answer": "2025년 IT팀 예산은 500,000,000원입니다...",
  "sources": [...],
  "conversation_id": "abc123"
}
```

#### 3. 데이터 재인덱싱
```http
POST /api/ai/reindex

Response:
{
  "status": "success",
  "message": "데이터베이스 재인덱싱이 완료되었습니다"
}
```

#### 4. AI 통계
```http
GET /api/ai/stats

Response:
{
  "vector_db_count": 900,
  "db_proposals_count": 850,
  "db_budgets_count": 50
}
```

---

## 🔧 설정 파일

### ai_server/.env
```ini
# 데이터베이스
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_management
DB_USER=postgres
DB_PASSWORD=meritz123!

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=qwen2.5:7b
EMBEDDING_MODEL=nomic-embed-text

# 서버
AI_SERVER_PORT=8000
AI_SERVER_HOST=0.0.0.0
```

### server.js (Node.js)
```javascript
// AI 서버 URL 설정
const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';
```

---

## 🐛 문제 해결

### 문제 1: "AI 서버가 응답하지 않습니다"

**확인 사항:**
1. AI 서버가 실행 중인지 확인
   ```bash
   # 다른 터미널에서
   curl http://localhost:8000/health
   ```

2. Ollama가 실행 중인지 확인
   ```bash
   ollama list
   ```

3. 포트 8000이 사용 가능한지 확인
   ```bash
   netstat -ano | findstr 8000
   ```

### 문제 2: "Out of memory" 에러

**해결 방법:**
- 더 작은 모델 사용: `phi3:3.8b`
- 또는 Ollama 메모리 제한 설정

### 문제 3: 응답이 너무 느림 (30초 이상)

**해결 방법:**
1. 더 작은 모델 사용
2. `rag_engine.py`에서 `top_k=5` → `top_k=3` 수정
3. GPU 활용 (NVIDIA GPU 있는 경우)

### 문제 4: 벡터 DB 초기화 실패

**해결 방법:**
```bash
# chroma_db 폴더 삭제 후 재시작
cd ai_server
rmdir /s /q chroma_db
python main.py
```

---

## 📈 성능 벤치마크

### 현재 스펙 (i9-14900K, 32GB RAM)

| 작업 | 예상 시간 |
|------|----------|
| 첫 인덱싱 (900개 문서) | 5-15분 |
| 질문 처리 | 5-10초 |
| 재인덱싱 (100개 추가) | 2-5분 |
| 동시 사용자 | 3-5명 |

### 모델별 성능

| 모델 | 응답 속도 | 한국어 품질 | 메모리 사용 |
|------|----------|------------|------------|
| qwen2.5:7b | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 8GB |
| llama3.1:8b | ⭐⭐⭐ | ⭐⭐⭐⭐ | 8GB |
| phi3:3.8b | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 4GB |

---

## 🔄 유지보수

### 정기 작업

**1. 일일 재인덱싱 (자동화 권장)**
```bash
# Windows 작업 스케줄러에 등록
curl -X POST http://localhost:3002/api/ai/reindex
```

**2. 로그 모니터링**
- AI 서버 콘솔 출력 확인
- 오류 발생 시 로그 파일 생성

**3. 모델 업데이트**
```bash
# 새 버전 확인
ollama list
ollama pull qwen2.5:7b  # 업데이트 확인
```

### 데이터 백업

**벡터 DB 백업:**
```bash
# ai_server/chroma_db 폴더 백업
xcopy /E /I chroma_db chroma_db_backup_20251013
```

---

## 🎓 사용 예시

### 예시 질문 모음

**1. 예산 관련**
- "2025년 IT팀 예산 현황은?"
- "예산이 가장 많이 남은 사업은?"
- "집행률이 80% 이상인 사업 목록"

**2. 품의서 관련**
- "최근 1주일 결재완료된 품의서는?"
- "용역계약 중 금액이 1억 이상인 것은?"
- "입찰 진행 중인 사업 리스트"

**3. 외주인력 관련**
- "현재 재직 중인 외주인력은 몇 명?"
- "이번 달 종료 예정인 인력은?"
- "기술등급 특급인 인력 현황"

**4. 통계 관련**
- "올해 월별 계약 건수는?"
- "계약 유형별 금액 통계"
- "부서별 예산 집행 현황"

---

## 🚨 중요 안내

### 보안
- ✅ 모든 데이터는 로컬에서 처리
- ✅ 외부 API 호출 없음
- ⚠️ 프로덕션 환경에서는 AI API 인증 추가 권장

### 데이터 프라이버시
- AI가 학습하는 것이 아니라 검색만 수행
- 대화 이력은 메모리에만 저장 (서버 재시작 시 삭제)
- 민감 정보는 자동 마스킹 권장

### 라이선스
- Ollama: MIT License
- Qwen: Apache 2.0 License
- LangChain: MIT License
- ChromaDB: Apache 2.0 License

---

## 📞 지원

추가 지원이 필요하면:
1. `OLLAMA_SETUP_GUIDE.md` 문제 해결 섹션 참조
2. `ai_server/README.md` 상세 문서 확인
3. AI 서버 로그 확인
4. GitHub Issues (외부 접근 가능 시)

---

## ✅ 체크리스트

구축 완료 확인:
- [ ] Ollama 설치 완료
- [ ] qwen2.5:7b 또는 llama3.1:8b 다운로드 완료
- [ ] nomic-embed-text 다운로드 완료
- [ ] Python 패키지 설치 완료
- [ ] .env 파일 설정 완료
- [ ] PostgreSQL 연결 확인
- [ ] 첫 데이터 인덱싱 완료
- [ ] AI 서버 정상 실행 확인
- [ ] Node.js 서버 AI API 작동 확인
- [ ] React UI에서 채팅 테스트 완료

---

**🎉 축하합니다! AI 어시스턴트 구축이 완료되었습니다!**

이제 계약 관리 시스템에서 자연어로 질문하고 답변을 받을 수 있습니다.

