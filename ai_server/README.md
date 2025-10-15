# 🤖 CMS AI Assistant Server

계약 관리 시스템(CMS)을 위한 AI 어시스턴트 서버입니다.
Ollama 기반 로컬 LLM과 RAG 시스템을 사용하여 자연어 질의응답을 제공합니다.

## 📋 시스템 요구사항

- **Python**: 3.9 이상
- **Ollama**: 최신 버전
- **PostgreSQL**: 데이터베이스 연결
- **메모리**: 최소 8GB (권장 16GB 이상)
- **디스크**: 10GB 이상 (모델 저장 공간)

## 🚀 설치 방법

### 1. Ollama 설치

1. [Ollama 공식 사이트](https://ollama.com/download)에서 Windows용 설치 파일 다운로드
2. 설치 후 터미널에서 확인:
```bash
ollama --version
```

### 2. Ollama 모델 다운로드

```bash
# 기본 LLM 모델 (한국어 지원 우수)
ollama pull llama3.1:8b

# 또는 Qwen 모델 (한국어 더 우수, 메모리 충분 시)
ollama pull qwen2.5:7b

# 임베딩 모델
ollama pull nomic-embed-text
```

**모델 선택 가이드:**
- `llama3.1:8b` (약 4.7GB): 균형잡힌 성능, 한국어 양호
- `qwen2.5:7b` (약 4.4GB): 한국어 우수, 빠른 응답
- `llama3.1:70b` (약 40GB): 최고 성능, RAM 32GB 이상 필요

### 3. Python 환경 설정

```bash
# 가상환경 생성 (권장)
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate

# 패키지 설치
pip install -r requirements.txt
```

### 4. 환경 변수 설정

```bash
# env.example을 복사하여 .env 생성
copy env.example .env

# .env 파일을 열어서 데이터베이스 정보 입력
# - DB_PASSWORD: PostgreSQL 비밀번호
# - DB_HOST, DB_PORT, DB_NAME: 필요시 수정
```

## ▶️ 서버 실행

### 방법 1: 배치 파일 사용 (권장)
```bash
start.bat
```

### 방법 2: 직접 실행
```bash
# 가상환경 활성화 후
python main.py
```

서버가 시작되면 다음 주소에서 접근 가능:
- API: http://172.22.32.200:8000
- API 문서: http://172.22.32.200:8000/docs

## 📡 API 엔드포인트

### 1. 헬스 체크
```bash
GET /health
```

**응답 예시:**
```json
{
  "status": "healthy",
  "ollama_status": "healthy",
  "db_status": "healthy",
  "vector_db_status": "healthy"
}
```

### 2. AI 채팅
```bash
POST /chat
Content-Type: application/json

{
  "question": "2025년 IT팀 예산 현황은?",
  "conversation_id": null,
  "use_history": true
}
```

**응답 예시:**
```json
{
  "answer": "2025년 IT팀의 사업예산은 다음과 같습니다:\n- 예산금액: 500,000,000원\n- 집행금액: 150,000,000원\n- 잔액: 350,000,000원",
  "sources": [...],
  "conversation_id": "abc123def456"
}
```

### 3. 데이터 재인덱싱
```bash
POST /reindex
```

**언제 사용하나요?**
- 새로운 품의서나 예산이 추가되었을 때
- 데이터가 대량 업데이트되었을 때
- 주기적 업데이트 (예: 매일 자정)

### 4. 통계 조회
```bash
GET /stats
```

**응답 예시:**
```json
{
  "vector_db_count": 1250,
  "db_proposals_count": 800,
  "db_budgets_count": 450
}
```

## 🔧 문제 해결

### Ollama 연결 실패
```
Error: Cannot connect to Ollama server
```

**해결 방법:**
1. Ollama가 실행 중인지 확인: `ollama list`
2. Ollama 서버 재시작: Windows 작업 관리자에서 Ollama 프로세스 종료 후 재실행
3. 포트 확인: `netstat -ano | findstr 11434`

### 메모리 부족
```
Error: Out of memory
```

**해결 방법:**
1. 더 작은 모델 사용: `llama3.1:8b` → `phi3:3.8b`
2. Ollama 메모리 제한 설정:
   ```bash
   # 환경 변수 설정
   OLLAMA_MAX_LOADED_MODELS=1
   OLLAMA_NUM_PARALLEL=1
   ```

### 느린 응답 속도
```
답변 생성에 30초 이상 소요
```

**해결 방법:**
1. GPU 사용 (CUDA 설치 필요)
2. 더 작은 모델 사용
3. 컨텍스트 길이 줄이기 (rag_engine.py에서 `top_k` 값 감소)

### 데이터베이스 연결 실패
```
Error: Cannot connect to PostgreSQL
```

**해결 방법:**
1. PostgreSQL 서비스 실행 확인
2. .env 파일의 DB 정보 확인
3. 방화벽 설정 확인

## 📊 성능 최적화

### CPU 전용 환경 (현재 스펙)
- **예상 응답 시간**: 5-15초
- **동시 사용자**: 3-5명
- **메모리 사용**: 8-12GB

### 최적화 팁
1. **모델 선택**:
   - 빠른 응답: `phi3:3.8b` (3GB)
   - 균형: `llama3.1:8b` (4.7GB)
   - 품질 우선: `qwen2.5:7b` (4.4GB)

2. **인덱싱 주기**:
   - 실시간: 품의서 생성 시 자동 인덱싱
   - 배치: 매일 자정 전체 재인덱싱

3. **캐싱**:
   - 자주 묻는 질문 답변 캐시
   - 벡터 검색 결과 캐시

## 🔐 보안 고려사항

폐쇄망 환경에서 사용하므로 다음 사항 확인:
- ✅ Ollama는 로컬에서만 실행 (외부 API 호출 없음)
- ✅ 모든 데이터는 로컬 디스크에 저장
- ✅ 인터넷 연결 불필요 (모델 다운로드 후)
- ⚠️ API 인증 추가 권장 (프로덕션 환경)

## 📚 추가 리소스

- [Ollama 문서](https://github.com/ollama/ollama)
- [LangChain 문서](https://python.langchain.com/)
- [ChromaDB 문서](https://docs.trychroma.com/)
- [FastAPI 문서](https://fastapi.tiangolo.com/)

## 🆘 지원

문제가 발생하면 다음 정보와 함께 문의:
1. 오류 메시지
2. 로그 파일 (콘솔 출력)
3. 시스템 환경 (Python 버전, Ollama 버전)
4. 사용 중인 모델명

