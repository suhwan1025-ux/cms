# 🚀 코드 이관 가이드 (폐쇄망 환경)

**작성일**: 2025-11-05  
**버전**: 1.0  
**대상 시스템**: 계약관리시스템(CMS)

---

## 📋 목차

1. [이관 전 최종 점검](#이관-전-최종-점검)
2. [패키징 준비](#패키징-준비)
3. [파일 전송 방법](#파일-전송-방법)
4. [폐쇄망 설치 절차](#폐쇄망-설치-절차)
5. [검증 및 테스트](#검증-및-테스트)
6. [문제 해결](#문제-해결)

---

## 이관 전 최종 점검

### ✅ 완료된 사항

#### 1. 외부 의존성 제거
- [x] CDN 의존성 제거 완료 (html2canvas 로컬화)
- [x] CKEditor 패키지 명시적 설치
- [x] 모든 외부 URL이 환경변수로 관리됨
- [x] AI 서버 컴포넌트 제거 완료

#### 2. 불필요한 파일 정리
- [x] 백업 파일 삭제
- [x] 테스트 스크립트 제거
- [x] 디버그 도구 제거
- [x] 빌드 아티팩트 제거
- [x] AI 서버 폴더 제거

#### 3. DB 스크립트 준비
- [x] 테이블 생성 스크립트 (02_create_tables.sql/.txt)
- [x] 외래키 생성 스크립트 (03_create_foreign_keys.sql/.txt)
- [x] 인덱스 생성 스크립트 (04_create_indexes.sql/.txt)
- [x] 마스터 데이터 스크립트 (05_insert_master_data.sql/.txt)
- [x] 실제 운영 데이터 반영 완료

---

## 패키징 준비

### 1단계: 프로젝트 정리

```powershell
# 1. Git 상태 확인
git status

# 2. 불필요한 파일 삭제 (이미 완료됨)
# - node_modules (재설치 필요)
# - build/ (재빌드 필요)
# - .env (보안상 제외)

# 3. 프로젝트 정리 확인
dir
```

### 2단계: node_modules 패키징

#### 방법 1: node_modules 전체 압축 (권장)

```powershell
# 1. 깨끗한 설치
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
npm install --legacy-peer-deps

# 2. node_modules 압축
Compress-Archive -Path node_modules -DestinationPath CMS_node_modules.zip

# 압축 파일 크기: 약 150-200MB
```

#### 방법 2: npm-bundle 사용

```powershell
# 1. npm-bundle 설치
npm install -g npm-bundle

# 2. 번들 생성
npm-bundle

# 생성된 파일: *.tgz (약 100MB)
```

### 3단계: 소스코드 패키징

```powershell
# 1. 프로젝트 폴더 전체 압축 (node_modules 제외)
# 다음 항목 제외:
# - node_modules/
# - build/
# - .env
# - .git/ (선택사항)
# - logs/

# 2. 압축 (PowerShell)
$exclude = @('node_modules', 'build', '.git', 'logs')
Get-ChildItem -Path . -Exclude $exclude | Compress-Archive -DestinationPath CMS_SOURCE.zip

# 압축 파일 크기: 약 10-20MB
```

### 4단계: DB 스크립트 별도 패키징

```powershell
# sql/dba_setup 폴더만 별도 압축
Compress-Archive -Path sql/dba_setup -DestinationPath CMS_DB_SCRIPTS.zip

# 압축 파일 크기: 약 1MB
```

---

## 파일 전송 방법

### 준비물 체크리스트

```
📦 폐쇄망 이관 패키지 구성

✅ 1. CMS_SOURCE.zip (10-20MB)
   - 프로젝트 소스코드

✅ 2. CMS_node_modules.zip (150-200MB)
   - npm 패키지들

✅ 3. CMS_DB_SCRIPTS.zip (1MB)
   - 데이터베이스 설치 스크립트

✅ 4. node-v22.20.0-x64.msi (30MB)
   - Node.js 설치 파일
   - 다운로드: https://nodejs.org/

✅ 5. postgresql-14-windows-x64.exe (250MB)
   - PostgreSQL 설치 파일
   - 다운로드: https://www.postgresql.org/download/

✅ 6. 환경 설정 파일
   - .env.example → .env로 복사 후 수정

📊 총 용량: 약 440MB - 500MB
```

### 전송 방법

#### 방법 1: USB 메모리 (권장)
```
1. 1GB 이상 USB 메모리 준비
2. 위 6개 파일 복사
3. 폐쇄망 서버로 전달
```

#### 방법 2: 네트워크 드라이브
```
1. 임시 네트워크 공유 폴더 설정
2. 파일 복사
3. 보안 정책 준수하여 전송
```

#### 방법 3: CD/DVD
```
1. 700MB DVD 준비
2. 파일 굽기
3. 폐쇄망 서버로 전달
```

---

## 폐쇄망 설치 절차

### 사전 준비

#### 1. Node.js 설치
```powershell
# node-v22.20.0-x64.msi 실행
# - 기본 설정으로 설치
# - PATH 환경변수 자동 추가

# 설치 확인
node --version
# v22.20.0

npm --version  
# 10.9.1 이상
```

#### 2. PostgreSQL 설치
```powershell
# postgresql-14-windows-x64.exe 실행
# - 기본 포트: 5432
# - postgres 계정 비밀번호 설정: 강력한비밀번호!@#
# - pgAdmin 4 함께 설치 권장

# 서비스 상태 확인
Get-Service postgresql*
# Status: Running 확인
```

### 소스코드 배포

#### 1. 압축 파일 해제

```powershell
# 1. 작업 디렉토리로 이동
cd C:\WebApps

# 2. 소스코드 압축 해제
Expand-Archive -Path D:\CMS_SOURCE.zip -DestinationPath C:\WebApps\CMS

# 3. node_modules 압축 해제
cd C:\WebApps\CMS
Expand-Archive -Path D:\CMS_node_modules.zip -DestinationPath .

# 4. 디렉토리 구조 확인
dir
```

#### 2. 환경 설정

```powershell
# .env 파일 생성
cd C:\WebApps\CMS
Copy-Item env.example .env

# .env 파일 편집
notepad .env
```

**`.env` 파일 내용:**
```ini
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_management
DB_USERNAME=cms_admin
DB_PASSWORD=강력한비밀번호123!@#

# 서버 설정
PORT=3002
NODE_ENV=production

# API 설정 (프론트엔드에서 사용)
REACT_APP_API_URL=http://폐쇄망서버IP:3002
```

#### 3. 데이터베이스 구축

```powershell
# 1. DB 스크립트 압축 해제
Expand-Archive -Path D:\CMS_DB_SCRIPTS.zip -DestinationPath C:\DB_Scripts

# 2. PostgreSQL 접속
# pgAdmin 4 또는 psql 사용

# 3. 스크립트 실행 순서
# psql -U postgres 로 접속 후:
\i C:/DB_Scripts/dba_setup/01_create_database.sql
\i C:/DB_Scripts/dba_setup/02_create_tables.sql
\i C:/DB_Scripts/dba_setup/03_create_foreign_keys.sql
\i C:/DB_Scripts/dba_setup/04_create_indexes.sql
\i C:/DB_Scripts/dba_setup/05_insert_master_data.sql
\i C:/DB_Scripts/dba_setup/06_verification_queries.sql
```

#### 4. 애플리케이션 빌드

```powershell
cd C:\WebApps\CMS

# 프로덕션 빌드
npm run build:prod

# 빌드 완료 확인
dir build
```

#### 5. 서비스 시작

**방법 1: PM2 사용 (권장)**
```powershell
# PM2 설치
npm install -g pm2

# 애플리케이션 시작
pm2 start ecosystem.config.js --env production

# 상태 확인
pm2 status

# 로그 확인
pm2 logs
```

**방법 2: 직접 실행**
```powershell
# 백엔드 서버 시작
node server.prod.js

# 새 터미널에서 프론트엔드 서빙
# (빌드된 정적 파일은 server.prod.js가 자동으로 서빙함)
```

### 서비스 등록 (Windows)

```powershell
# NSSM (Non-Sucking Service Manager) 사용
# 1. NSSM 다운로드 및 설치
# 2. 서비스 등록

nssm install ContractManagementSystem "C:\Program Files\nodejs\node.exe"
nssm set ContractManagementSystem AppParameters "C:\WebApps\CMS\server.prod.js"
nssm set ContractManagementSystem AppDirectory "C:\WebApps\CMS"
nssm set ContractManagementSystem Start SERVICE_AUTO_START

# 서비스 시작
nssm start ContractManagementSystem
```

---

## 검증 및 테스트

### 1. 기본 연결 테스트

```powershell
# 백엔드 API 테스트
curl http://localhost:3002/api/health

# 예상 응답:
# { "status": "ok", "database": "connected" }
```

### 2. 웹 브라우저 접속

```
1. 브라우저 열기
2. 주소창에 입력: http://localhost:3001
   또는 http://폐쇄망서버IP:3001
3. 로그인 화면 표시 확인
```

### 3. 기능 테스트 체크리스트

```
✅ 로그인 기능
✅ 품의서 목록 조회
✅ 품의서 작성
✅ 품의서 임시저장
✅ 품의서 미리보기
✅ 이미지 복사 기능 (html2canvas)
✅ 문서 템플릿 불러오기
✅ 결재라인 설정
✅ 사업예산 조회
✅ 계약방식 선택
```

### 4. 데이터베이스 검증

```sql
-- PostgreSQL에 접속하여 확인
\c contract_management

-- 테이블 수 확인 (28개 테이블)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- 마스터 데이터 확인
SELECT COUNT(*) FROM contract_methods;  -- 17건
SELECT COUNT(*) FROM approval_rules;     -- 3건
SELECT COUNT(*) FROM approval_references; -- 4건
SELECT COUNT(*) FROM document_templates; -- 4건
```

---

## 문제 해결

### 문제 1: 데이터베이스 연결 실패

```
증상: "Database connection error"

원인:
1. PostgreSQL 서비스 미실행
2. .env 파일 설정 오류
3. 방화벽 차단

해결:
1. PostgreSQL 서비스 상태 확인
   Get-Service postgresql*
   
2. .env 파일 확인
   - DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD
   
3. PostgreSQL 설정 확인
   - postgresql.conf: listen_addresses = 'localhost'
   - pg_hba.conf: host all all 127.0.0.1/32 md5
```

### 문제 2: npm install 실패

```
증상: "ERESOLVE could not resolve"

해결:
# node_modules를 통째로 가져왔으므로 install 불필요
# 만약 필요하다면:
npm install --legacy-peer-deps
```

### 문제 3: 빌드 실패

```
증상: "Build failed"

해결:
1. Node.js 버전 확인
   node --version
   # v18 이상 필요
   
2. 메모리 부족 시
   # Windows
   set NODE_OPTIONS=--max-old-space-size=4096
   npm run build:prod
```

### 문제 4: 포트 충돌

```
증상: "Port 3002 is already in use"

해결:
1. 사용 중인 프로세스 확인
   netstat -ano | findstr :3002
   
2. 프로세스 종료
   taskkill /PID [프로세스ID] /F
   
3. 또는 .env에서 포트 변경
   PORT=3003
```

### 문제 5: html2canvas 오류

```
증상: 미리보기 이미지 복사 시 오류

해결:
1. public/js/html2canvas.min.js 존재 확인
   
2. 파일이 없다면:
   Copy-Item node_modules\html2canvas\dist\html2canvas.min.js public\js\
   
3. 서버 재시작
```

---

## 성능 최적화 (선택사항)

### 1. 프로덕션 모드 설정

```ini
# .env
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

### 2. Gzip 압축 활성화

server.prod.js에 이미 설정됨 ✅

### 3. PM2 클러스터 모드

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'cms',
    script: './server.prod.js',
    instances: 2,  // CPU 코어 수에 맞게 조정
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3002
    }
  }]
}
```

---

## 보안 체크리스트

```
✅ 1. PostgreSQL 비밀번호 강력하게 설정
✅ 2. .env 파일 권한 설정 (읽기 전용)
✅ 3. 불필요한 포트 방화벽 차단
✅ 4. 정기적인 백업 계획 수립
✅ 5. 로그 모니터링 설정
```

---

## 백업 방안

### 데이터베이스 백업

```powershell
# 수동 백업
pg_dump -U cms_admin -h localhost contract_management > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql

# 자동 백업 (Task Scheduler 등록)
# scripts/backup/auto_backup.ps1 참조
```

### 파일 백업

```powershell
# 프로젝트 폴더 백업
Compress-Archive -Path C:\WebApps\CMS -DestinationPath "C:\Backup\CMS_backup_$(Get-Date -Format 'yyyyMMdd').zip"
```

---

## 모니터링

### 1. PM2 모니터링

```powershell
# 실시간 모니터링
pm2 monit

# 상태 확인
pm2 status

# 로그 확인
pm2 logs --lines 100
```

### 2. PostgreSQL 모니터링

```sql
-- 활성 연결 수
SELECT count(*) FROM pg_stat_activity;

-- 느린 쿼리 확인
SELECT * FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '1 second';
```

---

## 📞 지원 및 문의

### 관련 문서

1. **DBA용 DB 구축 가이드**
   - `docs/DBA_DATABASE_SETUP_GUIDE.md`

2. **스키마 검증 보고서**
   - `docs/SCHEMA_VERIFICATION_COMPLETE.md`

3. **폐쇄망 체크리스트**
   - `docs/CLOSED_NETWORK_CHECKLIST.md`

4. **이관 완료 보고서**
   - `docs/CLOSED_NETWORK_MIGRATION_COMPLETE.md`

### 문제 발생 시

1. 로그 파일 확인
   - `logs/` 폴더
   - PM2 로그: `pm2 logs`

2. 데이터베이스 상태 확인
   - pgAdmin 4 사용
   - SQL 검증 쿼리 실행

---

## ✅ 최종 확인

### 이관 완료 체크리스트

```
✅ Node.js 설치 완료 (v22.20.0)
✅ PostgreSQL 설치 완료 (v14)
✅ 소스코드 배포 완료
✅ node_modules 설치 완료
✅ 환경변수 설정 완료 (.env)
✅ 데이터베이스 구축 완료 (28 테이블)
✅ 마스터 데이터 입력 완료
✅ 빌드 완료
✅ 서비스 시작 완료
✅ 접속 테스트 완료
✅ 기능 테스트 완료
```

### 이관 성공 ✨

**축하합니다! 폐쇄망 환경에서 계약관리시스템이 정상적으로 작동합니다.**

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-11-05  
**버전**: 1.0

