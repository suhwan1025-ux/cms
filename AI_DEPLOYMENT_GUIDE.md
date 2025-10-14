# AI 어시스턴트 배포 가이드

## 📋 배포 전 체크리스트

### ✅ 시스템 요구사항
- [x] Python 3.12 설치
- [x] Node.js 설치
- [x] PostgreSQL 실행 중
- [x] Ollama 설치 및 모델 다운로드

### ✅ 코드 검증
- [x] 48+ 테스트 케이스 통과 (97.9% 성공률)
- [x] 8개 데이터베이스 테이블 연동
- [x] 컬럼명 오류 수정 완료
- [x] Git 커밋 및 푸시 완료

---

## 🚀 배포 단계

### 1. 저장소 클론 (새 서버인 경우)

```bash
git clone https://github.com/suhwan1025-ux/cms.git
cd cms
```

### 2. 의존성 설치

#### Node.js 패키지
```bash
npm install
```

#### Python 패키지
```bash
cd ai_server
pip install -r requirements.txt
cd ..
```

### 3. 환경 변수 설정

#### .env 파일 (루트 디렉토리)
```ini
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_management
DB_USER=postgres
DB_PASSWORD=meritz123!
PORT=3002
```

#### ai_server/.env 파일
```ini
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_management
DB_USER=postgres
DB_PASSWORD=meritz123!

OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=llama3.1:8b

AI_SERVER_PORT=8000
AI_SERVER_HOST=0.0.0.0
```

### 4. Ollama 설정

```bash
# Ollama 다운로드
# https://ollama.com/download

# 모델 다운로드
ollama pull llama3.1:8b

# Ollama 서버 실행 (별도 터미널)
ollama serve
```

### 5. 서버 실행

#### 방법 1: 개발 모드 (3개 터미널)

**터미널 1 - Ollama**
```bash
ollama serve
```

**터미널 2 - AI 서버**
```bash
cd ai_server
python main.py
```

**터미널 3 - 백엔드 서버**
```bash
node server.js
```

#### 방법 2: PM2 사용 (프로덕션 권장)

```bash
# PM2 설치
npm install -g pm2

# 모든 서비스 시작
pm2 start ecosystem.config.js

# 상태 확인
pm2 status

# 로그 확인
pm2 logs

# 서비스 재시작
pm2 restart all

# 부팅 시 자동 시작
pm2 startup
pm2 save
```

### 6. 서비스 확인

#### 백엔드 서버
```bash
curl http://localhost:3002/api/health
```

#### AI 서버
```bash
curl http://localhost:8000/health
```

#### 통계 확인
```bash
curl http://localhost:3002/api/ai/stats
```

**기대 결과:**
```json
{
  "total_proposals": 104,
  "approved_proposals": 74,
  "draft_proposals": 2,
  "total_budgets": 30,
  "total_departments": 6
}
```

---

## 📊 AI 어시스턴트 기능

### 지원하는 질문 유형

#### 1. 통계 질문
- "전체 품의서는 몇 건인가요?"
- "승인된 품의서는?"
- "올해 사업예산 총액은?"

#### 2. 월별 데이터
- "올해 월별 계약건수는?"
- "10월에 승인된 품의서는?"

#### 3. 상태별 집계
- "품의서 상태별 건수를 알려주세요"
- "대기중인 품의서는 몇 건?"

#### 4. 예산 관련
- "1억원 이상의 예산은 몇 건?"
- "예산 집행률은?"
- "가장 큰 예산과 작은 예산은?"

#### 5. 계약 방식
- "가장 많이 사용된 계약방식은?"
- "수의계약과 경쟁입찰 중 어느 것이 더 많나요?"

#### 6. 구매/용역
- "노트북을 구매한 내역이 있나요?"
- "유지보수 용역은 몇 건?"

#### 7. 공급업체
- "등록된 공급업체는 몇 개?"
- "협력사 목록을 알려주세요"

#### 8. 일반 대화
- "안녕하세요"
- "시스템에 대해 설명해주세요"

---

## 🔍 문제 해결

### AI 서버가 응답하지 않음

**원인 1: Ollama 미실행**
```bash
# Ollama 상태 확인
curl http://localhost:11434/api/tags

# Ollama 실행
ollama serve
```

**원인 2: Python 패키지 누락**
```bash
cd ai_server
pip install -r requirements.txt
```

**원인 3: 데이터베이스 연결 실패**
```bash
# PostgreSQL 상태 확인
pg_isready -h localhost -p 5432

# .env 파일 확인
cat ai_server/.env
```

### 통계가 0으로 나옴

**원인: 백엔드 서버가 AI 서버에 연결되지 않음**
```bash
# AI 서버 상태 확인
curl http://localhost:8000/stats

# 백엔드 .env 확인
cat .env | grep AI_SERVER_URL
```

### 특정 질문에 답변이 이상함

**원인: 데이터베이스 컬럼명 불일치**
```bash
# 로그 확인
pm2 logs ai-server

# 오류가 있으면 main.py의 쿼리 수정 필요
```

---

## 📈 성능 모니터링

### 응답 시간 확인
```bash
# AI 채팅 응답 시간 측정
time curl -X POST http://localhost:3002/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"전체 품의서는 몇 건인가요?"}'
```

### 리소스 사용량
```bash
# PM2로 확인
pm2 monit

# 또는 시스템 모니터링
htop
```

---

## 🔄 업데이트 방법

### 코드 업데이트
```bash
# 최신 코드 가져오기
git pull origin main

# 의존성 업데이트
npm install
cd ai_server && pip install -r requirements.txt

# 서비스 재시작
pm2 restart all
```

### 모델 업데이트
```bash
# 새 모델 다운로드
ollama pull llama3.1:8b

# .env 파일의 LLM_MODEL 변수 확인
# 서비스 재시작
pm2 restart ai-server
```

---

## 📞 지원

문제가 발생하면:
1. 로그 확인: `pm2 logs`
2. AI_서버_실행_가이드.txt 참조
3. GitHub Issues 생성

---

## ✅ 배포 완료 체크리스트

- [ ] 모든 서비스가 정상 실행 중
- [ ] `/health` 엔드포인트 200 OK
- [ ] `/api/ai/stats` 정확한 데이터 반환
- [ ] 브라우저에서 AI 어시스턴트 접속 가능
- [ ] 테스트 질문에 정상 답변
- [ ] PM2로 자동 시작 설정 완료

---

**배포 일시:** 2025-10-14  
**버전:** v2.0.0 - AI 어시스턴트 대폭 개선  
**테스트 결과:** 48/48 질문 성공 (97.9%)

