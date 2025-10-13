# 🤖 Ollama 설치 및 설정 가이드

AI 어시스턴트 기능을 사용하기 위한 Ollama 설치 및 설정 가이드입니다.

## 📋 목차
1. [Ollama란?](#ollama란)
2. [시스템 요구사항](#시스템-요구사항)
3. [설치 방법](#설치-방법)
4. [모델 다운로드](#모델-다운로드)
5. [서버 실행 및 확인](#서버-실행-및-확인)
6. [문제 해결](#문제-해결)

---

## 🎯 Ollama란?

Ollama는 로컬 환경에서 대규모 언어 모델(LLM)을 쉽게 실행할 수 있게 해주는 오픈소스 도구입니다.

**주요 특징:**
- ✅ **완전 로컬 실행**: 인터넷 연결 불필요 (폐쇄망 환경 완벽 지원)
- ✅ **간편한 설치**: Docker 없이 간단 설치
- ✅ **다양한 모델 지원**: Llama, Mistral, Qwen 등
- ✅ **API 제공**: REST API로 쉽게 통합
- ✅ **Windows/Mac/Linux 지원**

---

## 💻 시스템 요구사항

### 최소 요구사항
- **CPU**: Intel i5 이상 (또는 동급)
- **RAM**: 8GB 이상
- **디스크**: 10GB 이상 여유 공간
- **OS**: Windows 10/11 (64-bit)

### 권장 사양
- **CPU**: Intel i7/i9 또는 AMD Ryzen 7/9
- **RAM**: 16GB 이상
- **GPU**: NVIDIA GPU (CUDA 지원) - 선택사항, 있으면 더 빠름
- **디스크**: SSD 권장

### 현재 PC 스펙 (충분함 ✅)
- **CPU**: i9-14900K (24코어/32스레드)
- **RAM**: 32GB
- **예상 성능**: 8B 모델 기준 5-10초 응답 시간

---

## 📥 설치 방법

### 1. Ollama 다운로드

1. 브라우저에서 [Ollama 공식 사이트](https://ollama.com/download) 접속
2. **Windows** 버튼 클릭하여 설치 파일 다운로드
   - 파일명: `OllamaSetup.exe` (약 500MB)

### 2. 설치 실행

1. 다운로드한 `OllamaSetup.exe` 파일 실행
2. 설치 마법사 따라 진행
   - 기본 설치 경로: `C:\Program Files\Ollama`
   - 설치 시간: 약 1-2분

### 3. 설치 확인

설치 완료 후 명령 프롬프트(CMD) 또는 PowerShell에서 확인:

```bash
ollama --version
```

**출력 예시:**
```
ollama version is 0.1.20
```

---

## 📦 모델 다운로드

### 권장 모델 선택

계약 관리 시스템에서 사용할 모델을 선택합니다.

| 모델 | 크기 | 메모리 사용 | 한국어 성능 | 속도 | 추천 |
|------|------|------------|------------|------|------|
| **llama3.1:8b** | 4.7GB | ~8GB | ⭐⭐⭐⭐ | 보통 | ✅ 추천 |
| **qwen2.5:7b** | 4.4GB | ~8GB | ⭐⭐⭐⭐⭐ | 빠름 | ✅ 강력 추천 |
| **phi3:3.8b** | 2.3GB | ~4GB | ⭐⭐⭐ | 매우 빠름 | 메모리 부족 시 |
| llama3.1:70b | 40GB | ~64GB | ⭐⭐⭐⭐⭐ | 느림 | 메모리 부족 |

### 모델 다운로드 명령어

**1) Qwen 2.5 (가장 추천 - 한국어 우수)**
```bash
ollama pull qwen2.5:7b
```

**2) Llama 3.1 (균형잡힌 성능)**
```bash
ollama pull llama3.1:8b
```

**3) Phi-3 (빠른 응답, 메모리 절약)**
```bash
ollama pull phi3:3.8b
```

**4) 임베딩 모델 (필수)**
```bash
ollama pull nomic-embed-text
```

### 다운로드 시간
- 각 모델당 약 5-15분 소요 (네트워크 속도에 따라 다름)
- 다운로드는 한 번만 하면 됨

### 다운로드 위치
- Windows: `C:\Users\<사용자명>\.ollama\models`

---

## ▶️ 서버 실행 및 확인

### 1. Ollama 서버 자동 실행

Ollama는 설치 후 자동으로 백그라운드에서 실행됩니다.

**수동 실행이 필요한 경우:**
```bash
ollama serve
```

### 2. 서버 상태 확인

**방법 1: 명령어로 확인**
```bash
ollama list
```

**출력 예시:**
```
NAME                    ID              SIZE    MODIFIED
qwen2.5:7b             abc123def456    4.4 GB  2 hours ago
llama3.1:8b            xyz789abc123    4.7 GB  3 hours ago
nomic-embed-text       fed456cba987    274 MB  1 hour ago
```

**방법 2: 브라우저로 확인**
- URL: http://localhost:11434
- 정상 응답: "Ollama is running"

### 3. 간단한 테스트

```bash
ollama run qwen2.5:7b "안녕하세요. 계약 관리 시스템 AI입니다."
```

정상 응답이 오면 설치 완료! ✅

---

## 🔧 Python AI 서버 설정

### 1. Python 환경 설정

```bash
# AI 서버 폴더로 이동
cd ai_server

# 가상환경 생성 (권장)
python -m venv venv

# 가상환경 활성화
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Windows CMD:
venv\Scripts\activate.bat

# 패키지 설치
pip install -r requirements.txt
```

### 2. 환경 변수 설정

```bash
# env.example을 복사하여 .env 생성
copy env.example .env
```

`.env` 파일 편집:
```ini
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_management
DB_USER=postgres
DB_PASSWORD=meritz123!

# Ollama 설정
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=qwen2.5:7b          # 또는 llama3.1:8b
EMBEDDING_MODEL=nomic-embed-text

# 서버 설정
AI_SERVER_PORT=8000
AI_SERVER_HOST=0.0.0.0
```

### 3. AI 서버 실행

```bash
# ai_server 폴더에서
python main.py
```

**정상 시작 로그:**
```
🚀 AI 어시스턴트 서버 시작 중...
✅ 데이터베이스 연결 완료
✅ RAG 엔진 초기화 완료
✅ 벡터 데이터베이스 준비 완료
🎉 AI 어시스턴트 서버 준비 완료!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## 🚀 전체 시스템 실행 순서

### 1단계: Ollama 실행 (자동)
- Ollama는 Windows 시작 시 자동 실행
- 수동 확인: `ollama list`

### 2단계: PostgreSQL 실행
```bash
# 서비스 확인
services.msc
# PostgreSQL 서비스가 실행 중인지 확인
```

### 3단계: AI 서버 실행
```bash
cd ai_server
python main.py
```

### 4단계: Node.js 백엔드 실행
```bash
# 프로젝트 루트에서
node server.js
```

### 5단계: React 프론트엔드
```bash
# 개발 모드
npm start

# 또는 빌드 후 배포 (권장)
npm run build
# server.js가 빌드 파일을 서빙함
```

### 6단계: 브라우저 접속
- URL: http://localhost:3002 (또는 http://172.22.32.200:3002)
- 우측 하단의 🤖 버튼 클릭하여 AI 어시스턴트 사용

---

## ❓ 문제 해결

### 문제 1: "ollama: command not found"

**원인**: PATH 환경 변수 설정 안 됨

**해결방법**:
1. Windows 검색에서 "환경 변수" 검색
2. "시스템 환경 변수 편집" 클릭
3. "환경 변수" 버튼 클릭
4. Path 변수에 추가: `C:\Program Files\Ollama`
5. 터미널 재시작

### 문제 2: 모델 다운로드 느림/실패

**원인**: 네트워크 불안정 또는 프록시 문제

**해결방법**:
```bash
# 다운로드 재시도
ollama pull qwen2.5:7b

# 프록시 설정 (필요시)
set HTTP_PROXY=http://proxy-server:port
set HTTPS_PROXY=http://proxy-server:port
ollama pull qwen2.5:7b
```

### 문제 3: "Out of memory" 에러

**원인**: RAM 부족

**해결방법**:
```bash
# 더 작은 모델 사용
ollama pull phi3:3.8b

# .env 파일 수정
LLM_MODEL=phi3:3.8b
```

### 문제 4: AI 서버 연결 실패

**증상**: React에서 "AI 서버가 응답하지 않습니다"

**확인사항**:
1. AI 서버 실행 확인
   ```bash
   # 다른 터미널에서
   curl http://localhost:8000/health
   ```

2. Ollama 실행 확인
   ```bash
   ollama list
   ```

3. 포트 충돌 확인
   ```bash
   netstat -ano | findstr 8000
   ```

### 문제 5: 응답이 너무 느림

**원인**: CPU 전용 모드로 실행 중

**해결방법**:
1. **더 작은 모델 사용**
   ```bash
   ollama pull phi3:3.8b
   ```

2. **GPU 활용** (NVIDIA GPU가 있는 경우)
   - CUDA Toolkit 설치
   - Ollama가 자동으로 GPU 감지 및 사용

3. **컨텍스트 길이 줄이기**
   - `rag_engine.py`에서 `top_k=5` → `top_k=3` 수정

### 문제 6: "Failed to load dynamic library 'cudart64_*.dll'"

**원인**: GPU 사용을 시도했으나 CUDA 미설치

**해결방법**:
- CPU 모드로 계속 사용 (현재 스펙으로 충분)
- 또는 CUDA Toolkit 설치

---

## 📊 성능 최적화 팁

### 1. 모델 선택 전략
- **한국어 우선**: qwen2.5:7b
- **속도 우선**: phi3:3.8b
- **품질 우선**: llama3.1:8b

### 2. 메모리 관리
```bash
# Ollama 환경 변수 설정 (PowerShell)
$env:OLLAMA_MAX_LOADED_MODELS=1
$env:OLLAMA_NUM_PARALLEL=1
```

### 3. 캐싱 활용
- AI 서버는 대화 이력을 메모리에 캐싱
- 동일한 conversation_id 사용 시 더 빠름

---

## 🔐 폐쇄망 환경 체크리스트

- ✅ Ollama 설치 파일 다운로드 완료
- ✅ 필요한 모델 다운로드 완료
- ✅ Python 패키지 설치 완료
- ✅ 외부 API 호출 없음 확인
- ✅ 로컬 네트워크만 사용

**폐쇄망 이전 작업:**
1. 인터넷 연결된 PC에서 모든 모델 다운로드
2. `C:\Users\<사용자명>\.ollama` 폴더 전체 복사
3. 폐쇄망 PC의 동일한 경로에 붙여넣기
4. Ollama 설치 후 `ollama list`로 확인

---

## 📚 추가 리소스

- [Ollama 공식 문서](https://github.com/ollama/ollama)
- [모델 라이브러리](https://ollama.com/library)
- [Ollama API 문서](https://github.com/ollama/ollama/blob/main/docs/api.md)

---

## 🆘 추가 지원

문제가 계속되면 다음 정보를 확인:
1. `ollama --version`: Ollama 버전
2. `ollama list`: 설치된 모델 목록
3. AI 서버 로그: 콘솔 출력 캡처
4. 시스템 정보: `systeminfo` (CMD에서)

---

**🎉 설치 완료 후 AI 어시스턴트를 사용해보세요!**

브라우저에서 계약 관리 시스템 접속 → 우측 하단 🤖 버튼 클릭

