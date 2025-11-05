# 🔒 폐쇄망 이관 체크리스트 및 점검 보고서

**작성일**: 2025-11-05  
**대상 시스템**: 계약관리시스템(CMS)  
**목적**: 폐쇄망 환경 이관을 위한 사전 점검 및 조치 사항

---

## 📋 목차

1. [점검 요약](#점검-요약)
2. [발견된 문제점](#발견된-문제점)
3. [조치 필요 사항](#조치-필요-사항)
4. [폐쇄망 이관 준비물](#폐쇄망-이관-준비물)
5. [이관 후 설정 작업](#이관-후-설정-작업)
6. [검증 절차](#검증-절차)

---

## 점검 요약

### ✅ 양호한 사항
- 대부분의 URL이 환경변수로 관리됨
- npm 패키지는 로컬 설치 가능
- 데이터베이스는 폐쇄망 내 설치 가능
- 외부 API 의존성 없음

### ⚠️ 주의 필요 사항
- **CDN 의존성**: html2canvas CDN 사용 (2곳)
- **IP 하드코딩**: 일부 파일에 172.22.32.200 하드코딩
- **AI 모델 다운로드**: HuggingFace 및 Ollama 모델 사전 다운로드 필요
- **npm 패키지**: 인터넷 연결 필요 (사전 다운로드 권장)

---

## 발견된 문제점

### 1. 🔴 **CDN 의존성 (높은 우선순위)**

#### 문제 파일
1. **`src/components/ContractList.js` (79번째 줄)**
   ```javascript
   html += '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>';
   ```

2. **`src/utils/previewGenerator.js` (707번째 줄)**
   ```javascript
   <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
   ```

#### 영향
- **기능**: 품의서 미리보기를 이미지로 변환하는 기능
- **중요도**: 중간 (선택적 기능이지만 사용자 편의성에 영향)

#### 해결 방법
**방법 1: npm 패키지로 변경 (권장)**
```bash
npm install html2canvas
```

**방법 2: 로컬 파일로 포함**
```bash
# CDN에서 파일 다운로드
curl -o public/js/html2canvas.min.js https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js

# HTML에서 참조 변경
<script src="/js/html2canvas.min.js"></script>
```

---

### 2. 🟡 **IP 주소 하드코딩 (중간 우선순위)**

#### 발견된 파일들
1. **`ai_server/env.example`** (환경변수 파일)
   ```
   DB_HOST=172.22.32.200
   OLLAMA_BASE_URL=http://172.22.32.200:11434
   ```

2. **`ai_server/env.config`**
   ```
   DB_HOST=172.22.32.200
   OLLAMA_BASE_URL=http://172.22.32.200:11434
   ```

3. **`src/config/api.js`** (주석)
   ```javascript
   // 배포 PC IP: 172.22.32.200
   ```

#### 영향
- **중요도**: 중간 (환경변수 파일이므로 설정으로 해결 가능)
- **폐쇄망 이관 시**: 새로운 IP 주소로 변경 필요

#### 해결 방법
폐쇄망에서 `.env` 파일 생성 시 새로운 IP로 변경:
```bash
# 폐쇄망 서버 IP
DB_HOST=192.168.x.x  # 폐쇄망 DB 서버 IP
OLLAMA_BASE_URL=http://192.168.x.x:11434  # 폐쇄망 AI 서버 IP
```

---

### 3. 🟡 **AI 모델 다운로드 (중간 우선순위)**

#### 필요한 모델
1. **Ollama 모델**: `llama3.1:8b`
   - 크기: 약 4.7GB
   - 다운로드: `ollama pull llama3.1:8b`

2. **임베딩 모델**: `nomic-embed-text`
   - 크기: 약 274MB
   - 다운로드: `ollama pull nomic-embed-text`

3. **HuggingFace 모델**: `sentence-transformers/all-MiniLM-L6-v2`
   - 크기: 약 90MB
   - 스크립트: `ai_server/download_model.py`

#### 문제점
- **인터넷 연결 필요**: HuggingFace에서 모델 다운로드
- **URL**: `https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main`

#### 해결 방법
**사전 다운로드 및 수동 복사**
```bash
# 1. 인터넷 가능한 PC에서 다운로드
python ai_server/download_model.py

# 2. 캐시 디렉토리 전체를 폐쇄망으로 복사
# Windows: C:\Users\사용자명\.cache\huggingface
# Linux: ~/.cache/huggingface
```

---

### 4. 🟢 **npm 패키지 (낮은 우선순위)**

#### 패키지 수
- **총 54개** 패키지 (package.json 참조)

#### 해결 방법
**방법 1: node_modules 전체 복사 (권장)**
```bash
# 개발 PC에서
npm install
# node_modules 폴더를 압축하여 폐쇄망으로 이동
```

**방법 2: 오프라인 패키지 생성**
```bash
# npm-bundle 사용
npm install -g npm-bundle
npm-bundle

# 생성된 .tgz 파일을 폐쇄망으로 복사
```

---

## 조치 필요 사항

### 🔴 필수 조치 (반드시 수행)

#### 1. CDN 의존성 제거
- [ ] `ContractList.js`에서 CDN URL 제거
- [ ] `previewGenerator.js`에서 CDN URL 제거
- [ ] `html2canvas` npm 패키지 설치 또는 로컬 파일 추가

**상세 코드 수정 방법**: [CDN 제거 가이드](#cdn-제거-상세-가이드) 참조

#### 2. 환경변수 파일 준비
- [ ] `.env` 파일 생성 (폐쇄망 서버 정보 입력)
- [ ] `ai_server/.env` 파일 생성 (폐쇄망 AI 서버 정보 입력)

**템플릿**:
```bash
# .env (메인 서버)
DB_HOST=폐쇄망_DB_IP
DB_PORT=5432
DB_NAME=contract_management
DB_USERNAME=cms_admin
DB_PASSWORD=강력한비밀번호
PORT=3002
AI_SERVER_URL=http://폐쇄망_AI서버_IP:8000

# ai_server/.env (AI 서버)
DB_HOST=폐쇄망_DB_IP
DB_PORT=5432
DB_NAME=contract_management
DB_USER=cms_admin
DB_PASSWORD=강력한비밀번호
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=llama3.1:8b
EMBEDDING_MODEL=nomic-embed-text
AI_SERVER_PORT=8000
AI_SERVER_HOST=0.0.0.0
```

---

### 🟡 권장 조치 (수행 권장)

#### 1. AI 모델 사전 다운로드
- [ ] Ollama 모델 다운로드: `llama3.1:8b`
- [ ] 임베딩 모델 다운로드: `nomic-embed-text`
- [ ] HuggingFace 모델 다운로드: `all-MiniLM-L6-v2`

#### 2. node_modules 준비
- [ ] 개발 환경에서 `npm install` 실행
- [ ] `node_modules` 폴더 압축
- [ ] 폐쇄망으로 이동

---

### 🟢 선택 조치 (필요시 수행)

#### 1. 외부 DB 연동 (선택사항)
- 인사 시스템 등 외부 DB와 연동이 필요한 경우
- `config/externalDatabase.js` 설정

#### 2. 빌드 파일 준비
- [ ] `npm run build` 실행
- [ ] `build` 폴더를 폐쇄망으로 이동

---

## 폐쇄망 이관 준비물

### 📦 1단계: 파일 준비 (인터넷 연결 가능한 PC)

#### 소스코드
```bash
✅ CMS_NEW 프로젝트 전체 폴더
   - 크기: 약 500MB (node_modules 포함 시 1GB)
   - Git으로 관리 중이라면 .git 폴더 제외 가능
```

#### Node.js 설치 파일
```bash
✅ node-v18.17.0-x64.msi (또는 최신 LTS)
   - 다운로드: https://nodejs.org/
   - 크기: 약 30MB
```

#### PostgreSQL 설치 파일
```bash
✅ postgresql-14.x-windows-x64.exe
   - 다운로드: https://www.postgresql.org/download/
   - 크기: 약 250MB
```

#### Python 설치 파일 (AI 서버용)
```bash
✅ python-3.12.x-amd64.exe
   - 다운로드: https://www.python.org/downloads/
   - 크기: 약 25MB
```

#### Ollama 설치 파일
```bash
✅ OllamaSetup.exe (Windows) 또는 ollama-linux-amd64 (Linux)
   - 다운로드: https://ollama.ai/download
   - 크기: 약 500MB
```

#### AI 모델 파일
```bash
✅ Ollama 모델
   - llama3.1:8b (4.7GB)
   - nomic-embed-text (274MB)
   - 위치: C:\Users\사용자명\.ollama\models (Windows)

✅ HuggingFace 모델
   - all-MiniLM-L6-v2 (90MB)
   - 위치: C:\Users\사용자명\.cache\huggingface (Windows)
```

#### npm 패키지
```bash
✅ node_modules 폴더 (압축)
   - 크기: 약 500MB (압축 시 150MB)
   - 또는 npm-bundle로 생성한 .tgz 파일
```

---

### 📦 2단계: 데이터베이스 스크립트

```bash
✅ sql/dba_setup/ 폴더 전체
   - 01_create_database.sql
   - 02_create_tables.sql
   - 03_create_foreign_keys.sql
   - 04_create_indexes.sql
   - 05_insert_master_data.sql
   - 06_verification_queries.sql
```

---

### 📦 3단계: 문서

```bash
✅ 필수 문서
   - docs/DBA_DATABASE_SETUP_GUIDE.md
   - docs/CLOSED_NETWORK_CHECKLIST.md (이 문서)
   - docs/DEPLOYMENT_GUIDE.md
   - README.md

✅ 참고 문서
   - docs/AI_ASSISTANT_README.md
   - docs/OLLAMA_SETUP_GUIDE.md
```

---

## 이관 후 설정 작업

### 1️⃣ 기본 소프트웨어 설치

#### 순서
1. Node.js 설치
2. PostgreSQL 설치
3. Python 설치 (AI 서버용)
4. Ollama 설치 (AI 서버용)

### 2️⃣ 데이터베이스 구축

```bash
# 1. PostgreSQL 서비스 시작
# 2. DBA 스크립트 실행
cd sql/dba_setup
psql -U postgres -f 00_run_all.sql

# 또는 단계별 실행
psql -U postgres -f 01_create_database.sql
psql -U cms_admin -d contract_management -f 02_create_tables.sql
# ... (나머지 스크립트)
```

### 3️⃣ 애플리케이션 설정

```bash
# 1. 프로젝트 폴더로 이동
cd D:\CMS_NEW

# 2. node_modules 압축 해제 (미리 복사한 경우)
# 또는
npm install --offline  # 오프라인 패키지 사용 시

# 3. .env 파일 생성
# env.example을 복사하여 .env로 생성하고 폐쇄망 정보 입력

# 4. 빌드 (선택사항)
npm run build
```

### 4️⃣ AI 서버 설정

```bash
# 1. AI 서버 폴더로 이동
cd ai_server

# 2. Python 패키지 설치
pip install -r requirements.txt

# 3. .env 파일 생성
# env.example을 복사하여 .env로 생성

# 4. AI 모델 복사
# - Ollama 모델: .ollama/models 폴더 복사
# - HuggingFace 모델: .cache/huggingface 폴더 복사

# 5. Ollama 서비스 시작
ollama serve

# 6. AI 서버 시작
python main_texttosql_rag.py
```

### 5️⃣ 메인 서버 시작

```bash
# 개발 모드
npm start

# 또는 프로덕션 모드
npm run build
node server.js
```

---

## CDN 제거 상세 가이드

### 방법 1: npm 패키지 사용 (권장)

#### 1단계: 패키지 설치
```bash
npm install html2canvas
```

#### 2단계: 코드 수정

**`src/components/ContractList.js` 수정**
```javascript
// 상단에 import 추가
import html2canvas from 'html2canvas';

// 79번째 줄 삭제 (CDN script 태그)
// 삭제: html += '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>';

// copyToClipboard 함수에서 window.html2canvas 대신 직접 사용
// 변경 전: const canvas = await window.html2canvas(container, { ... });
// 변경 후: const canvas = await html2canvas(container, { ... });
```

**`src/utils/previewGenerator.js` 수정**
```javascript
// 707번째 줄 삭제
// 삭제: <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

// 생성된 HTML에 html2canvas를 번들링할 수 없으므로
// 로컬 파일 방식 사용 (방법 2 참조)
```

### 방법 2: 로컬 파일 사용

#### 1단계: 파일 다운로드
```bash
# public/js 폴더 생성
mkdir -p public/js

# CDN에서 파일 다운로드 (인터넷 연결 가능한 PC)
curl -o public/js/html2canvas.min.js https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
```

#### 2단계: 코드 수정

**`src/components/ContractList.js`**
```javascript
// 79번째 줄 변경
// 변경 전:
html += '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>';

// 변경 후:
html += '<script src="/js/html2canvas.min.js"></script>';
```

**`src/utils/previewGenerator.js`**
```javascript
// 707번째 줄 변경
// 변경 전:
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

// 변경 후:
<script src="/js/html2canvas.min.js"></script>
```

---

## 검증 절차

### ✅ 1단계: 데이터베이스 검증

```sql
-- PostgreSQL 연결
psql -U cms_admin -d contract_management

-- 테이블 수 확인 (26개)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- 외래키 확인
SELECT COUNT(*) FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY';

-- 마스터 데이터 확인
SELECT COUNT(*) FROM departments;
SELECT COUNT(*) FROM contract_methods;
```

### ✅ 2단계: 애플리케이션 검증

```bash
# 서버 시작 확인
curl http://localhost:3002/api/health

# 부서 목록 조회
curl http://localhost:3002/api/departments

# 품의서 목록 조회
curl http://localhost:3002/api/proposals
```

### ✅ 3단계: AI 서버 검증

```bash
# AI 서버 상태 확인
curl http://localhost:8000/health

# Ollama 연결 확인
curl http://localhost:11434/api/tags
```

### ✅ 4단계: 웹 브라우저 검증

```
1. 브라우저에서 http://폐쇄망서버IP:3001 접속
2. 품의서 목록 확인
3. 품의서 작성 기능 테스트
4. 미리보기 기능 테스트 (CDN 제거 확인)
5. AI 어시스턴트 기능 테스트 (선택)
```

---

## 문제 해결 가이드

### 문제 1: CDN 연결 실패
```
증상: 미리보기 이미지 복사 버튼이 동작하지 않음
원인: html2canvas CDN에 접근할 수 없음
해결: CDN 제거 가이드 참조
```

### 문제 2: AI 모델 로드 실패
```
증상: AI 어시스턴트가 응답하지 않음
원인: Ollama 모델이 없거나 서비스가 중지됨
해결:
  1. ollama list 명령으로 모델 확인
  2. ollama serve 명령으로 서비스 시작
  3. 모델이 없으면 .ollama/models 폴더 복사
```

### 문제 3: node_modules 오류
```
증상: npm start 시 모듈을 찾을 수 없다는 오류
원인: node_modules가 없거나 버전 불일치
해결:
  1. node_modules 폴더 삭제
  2. package-lock.json 삭제
  3. npm install --offline (오프라인 패키지 사용)
  4. 또는 인터넷 연결 가능한 PC에서 다시 복사
```

---

## 최종 체크리스트

### 📋 이관 전 체크리스트

- [ ] CDN 의존성 제거 완료
- [ ] 환경변수 파일 템플릿 준비
- [ ] Node.js 설치 파일 준비
- [ ] PostgreSQL 설치 파일 준비
- [ ] Python 설치 파일 준비
- [ ] Ollama 설치 파일 및 모델 준비
- [ ] HuggingFace 모델 준비
- [ ] node_modules 압축 준비
- [ ] DB 스크립트 준비
- [ ] 문서 준비

### 📋 이관 후 체크리스트

- [ ] PostgreSQL 설치 및 DB 구축
- [ ] Node.js 설치
- [ ] Python 설치
- [ ] Ollama 설치 및 모델 로드
- [ ] 환경변수 파일 설정
- [ ] node_modules 설치/복사
- [ ] 데이터베이스 검증
- [ ] 애플리케이션 시작 및 검증
- [ ] AI 서버 시작 및 검증 (선택)
- [ ] 웹 브라우저 접속 테스트

---

## 연락처

문제 발생 시:
1. 이 문서의 [문제 해결 가이드](#문제-해결-가이드) 참조
2. 로그 파일 확인 (`logs/` 폴더)
3. 관리자에게 문의

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-11-05  
**작성자**: CMS 개발팀  
**다음 검토 예정일**: 이관 완료 후

