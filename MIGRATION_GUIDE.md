# 📦 계약관리시스템 완전 마이그레이션 가이드

새로운 환경(PC, 서버)으로 시스템을 완전히 이관하는 방법입니다.

## 📋 목차
1. [현재 환경에서 할 작업](#1-현재-환경에서-할-작업)
2. [새 환경 준비](#2-새-환경-준비)
3. [새 환경에서 설치](#3-새-환경에서-설치)
4. [데이터 임포트](#4-데이터-임포트)
5. [테스트 및 확인](#5-테스트-및-확인)

---

## 1. 현재 환경에서 할 작업

### 1.1 데이터 내보내기
```bash
# 현재 데이터베이스의 모든 데이터를 JSON으로 내보내기
node export-current-data.js
```

실행하면 `data-export-YYYY-MM-DDTHH-MM-SS.json` 파일이 생성됩니다.

### 1.2 필요한 파일들 복사
다음 파일/폴더들을 USB나 클라우드로 복사:
- ✅ **프로젝트 전체 폴더** (node_modules 제외)
- ✅ **생성된 JSON 파일** (data-export-*.json)
- ✅ **uploads/ 폴더** (업로드된 파일들)
- ✅ **.env 파일** (환경 설정)

---

## 2. 새 환경 준비

### 2.1 필수 소프트웨어 설치

#### Node.js 설치
- [Node.js 공식 사이트](https://nodejs.org/)에서 LTS 버전 다운로드
- 버전 확인: `node --version` (16.x 이상)

#### PostgreSQL 설치
- [PostgreSQL 공식 사이트](https://www.postgresql.org/download/)에서 다운로드
- 설치 시 비밀번호 설정 (예: meritz123!)
- 버전 확인: `psql --version` (12.x 이상)

### 2.2 프로젝트 파일 복사
- 복사한 프로젝트 폴더를 새 PC에 붙여넣기
- 터미널/명령 프롬프트를 프로젝트 폴더에서 열기

---

## 3. 새 환경에서 설치

### 3.1 환경 설정 파일 생성
```bash
# .env 파일을 이전 환경에서 복사했거나, 새로 생성
# .env 파일 내용 예시:
DB_NAME=contract_management
DB_USERNAME=postgres
DB_PASSWORD=meritz123!
DB_HOST=localhost
DB_PORT=5432
PORT=3001
```

### 3.2 의존성 패키지 설치
```bash
npm install
```

### 3.3 데이터베이스 생성
```bash
# 1단계: 데이터베이스 생성
node create-database.js
```

### 3.4 테이블 구조 생성
```bash
# 2단계: 모든 테이블 생성
node create-all-tables.js
```

---

## 4. 데이터 임포트

### 4.1 데이터 파일 복사
이전 환경에서 생성한 `data-export-*.json` 파일을 프로젝트 폴더에 복사

### 4.2 데이터 임포트 실행
```bash
# JSON 파일명을 정확히 지정
node import-current-data.js data-export-2025-09-30T12-00-00.json
```

### 4.3 임포트 결과 확인
- 각 테이블별로 임포트된 레코드 수 확인
- 오류가 있다면 로그 메시지 확인

---

## 5. 테스트 및 확인

### 5.1 서버 실행
```bash
# 백엔드 서버 실행
node server.js
```

다른 터미널에서:
```bash
# 프론트엔드 실행
npm start
```

### 5.2 기능 테스트
- ✅ 브라우저에서 `http://localhost:3002` 접속
- ✅ 대시보드 데이터 확인
- ✅ 품의서 목록 조회
- ✅ 품의서 작성 테스트
- ✅ 파일 업로드 테스트

### 5.3 데이터 확인
```bash
# 데이터베이스 연결 테스트
node test-db.js

# 특정 테이블 데이터 확인
node check-data.js
```

---

## 🔧 문제 해결

### 데이터베이스 연결 실패
```bash
# PostgreSQL 서비스 상태 확인 (Windows)
services.msc

# PostgreSQL 서비스 시작
# "postgresql-x64-XX" 서비스를 찾아서 시작
```

### 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인 (Windows)
netstat -ano | findstr :3001
netstat -ano | findstr :3002

# 프로세스 종료
taskkill /PID [프로세스ID] /F
```

### 패키지 설치 오류
```bash
# npm 캐시 정리
npm cache clean --force

# node_modules 삭제 후 재설치
rmdir /s /q node_modules
npm install
```

---

## 📊 전체 마이그레이션 순서 요약

### 현재 PC
1. `node export-current-data.js` - 데이터 내보내기
2. 프로젝트 폴더 + JSON 파일 복사

### 새 PC
1. Node.js, PostgreSQL 설치
2. 프로젝트 폴더 붙여넣기
3. `npm install` - 패키지 설치
4. `.env` 파일 설정
5. `node create-database.js` - DB 생성
6. `node create-all-tables.js` - 테이블 생성
7. `node import-current-data.js data-export-*.json` - 데이터 임포트
8. `node server.js` & `npm start` - 서버 실행
9. 브라우저에서 테스트

---

## ⚡ 빠른 마이그레이션 스크립트

전체 과정을 자동화하는 배치 파일도 만들 수 있습니다:

```bash
# Windows: quick-migrate.bat
@echo off
echo ===== 계약관리시스템 마이그레이션 시작 =====
echo.

echo [1/5] 데이터베이스 생성 중...
node create-database.js
if %errorlevel% neq 0 goto error

echo [2/5] 테이블 생성 중...
node create-all-tables.js
if %errorlevel% neq 0 goto error

echo [3/5] 데이터 임포트 중...
set /p IMPORT_FILE="JSON 파일명을 입력하세요: "
node import-current-data.js %IMPORT_FILE%
if %errorlevel% neq 0 goto error

echo [4/5] 서버 테스트 중...
node test-db.js
if %errorlevel% neq 0 goto error

echo [5/5] 완료!
echo.
echo ===== 마이그레이션 성공! =====
echo 서버를 시작하려면: node server.js
goto end

:error
echo.
echo ===== 오류 발생! =====
echo 위의 오류 메시지를 확인하세요.

:end
pause
```

---

## 💡 추가 팁

### 정기 백업 설정
새 환경에서도 정기 백업을 설정하세요:
```bash
# 자동 백업 스크립트 실행 (Windows)
.\auto_backup.ps1
```

### 성능 최적화
- uploads/ 폴더가 크다면 별도로 관리
- 오래된 로그 파일 정리
- PostgreSQL 성능 튜닝

### 보안 설정
- .env 파일의 비밀번호 변경
- PostgreSQL 접근 권한 설정
- 방화벽 설정 확인

---

## 📞 지원

문제가 발생하면:
1. 오류 메시지 전체를 복사
2. `logs/` 폴더의 최신 로그 파일 확인
3. PostgreSQL 로그 확인

**참고 문서**:
- `MIGRATION_CHECKLIST.md` - 상세 체크리스트
- `DEPLOYMENT_GUIDE.md` - 배포 가이드
- `README.md` - 일반 사용 가이드 