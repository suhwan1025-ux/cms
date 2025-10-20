# 계약관리시스템 이관 체크리스트

## 📋 이관 전 준비사항

### 현재 PC에서 해야 할 작업

- [ ] 프로젝트 폴더 전체 압축 (node_modules 제외)
- [ ] 데이터베이스 백업 (필요시)
  ```sql
  pg_dump -U postgres -h localhost contract_management > contract_management_backup.sql
  ```
- [ ] 환경 설정 파일 확인 (.env 파일 내용 기록)
- [ ] 업로드된 파일들 백업 (uploads/ 폴더)
- [ ] 로그 파일 백업 (logs/ 폴더, 필요시)

### 새 PC에서 필요한 소프트웨어

- [ ] Node.js 16.x 이상 설치
- [ ] PostgreSQL 12.x 이상 설치
- [ ] Git 설치 (선택사항)
- [ ] 코드 에디터 (VS Code 등)

## 🚀 이관 절차

### 1단계: 프로젝트 파일 복사
- [ ] 압축 파일을 새 PC에 복사
- [ ] 프로젝트 폴더에 압축 해제
- [ ] 폴더 구조 확인

### 2단계: 환경 설정
- [ ] PostgreSQL 서비스 시작
- [ ] 데이터베이스 생성
  ```sql
  CREATE DATABASE contract_management;
  CREATE USER postgres WITH PASSWORD 'your_password';
  GRANT ALL PRIVILEGES ON DATABASE contract_management TO postgres;
  ```
- [ ] `.env.example`을 복사하여 `.env` 파일 생성
- [ ] `.env` 파일에서 데이터베이스 설정 수정

### 3단계: 의존성 설치 및 설정
- [ ] `npm install` 실행
- [ ] 설정 스크립트 실행
  - Windows: `setup.bat` 실행
  - Linux/Mac: `chmod +x setup.sh && ./setup.sh` 실행

### 4단계: 데이터베이스 설정
- [ ] 마이그레이션 실행: `npx sequelize-cli db:migrate`
- [ ] 데이터베이스 백업 복원 (필요시)
  ```sql
  psql -U postgres -h localhost -d contract_management < contract_management_backup.sql
  ```
- [ ] 샘플 데이터 생성 (필요시): `node create-basic-samples.js`

### 5단계: 서버 실행 테스트
- [ ] 백엔드 서버 실행: `node server.js`
- [ ] 브라우저에서 `http://localhost:3001` 접속 확인
- [ ] 새 터미널에서 프론트엔드 실행: `npm start`
- [ ] 브라우저에서 `http://localhost:3002` 접속 확인

### 6단계: 기능 테스트
- [ ] 로그인/로그아웃 테스트
- [ ] 품의서 작성 테스트
- [ ] 대시보드 데이터 표시 확인
- [ ] 파일 업로드 테스트
- [ ] 데이터베이스 연동 확인

## 🔧 문제 해결

### 자주 발생하는 문제들

#### Node.js 관련
- [ ] Node.js 버전이 16.x 이상인지 확인
- [ ] npm 캐시 정리: `npm cache clean --force`

#### 데이터베이스 관련
- [ ] PostgreSQL 서비스가 실행 중인지 확인
- [ ] 방화벽에서 5432 포트 허용 확인
- [ ] 데이터베이스 사용자 권한 확인

#### 포트 관련
- [ ] 3001, 3002 포트가 사용 중이 아닌지 확인
- [ ] 다른 포트 사용 시 환경 변수 수정

#### CKEditor 관련
- [ ] `craco.config.js` 파일 존재 확인
- [ ] CKEditor 의존성 재설치: `npm install --force`

## 📁 중요 파일 목록

### 반드시 포함되어야 하는 파일들
- [ ] `package.json` - 의존성 정보
- [ ] `server.js` - 백엔드 서버
- [ ] `craco.config.js` - CKEditor 설정
- [ ] `config/database.js` - 데이터베이스 설정
- [ ] `src/` 폴더 전체 - 프론트엔드 소스
- [ ] `public/` 폴더 - 정적 파일
- [ ] `migrations/` 폴더 - 데이터베이스 마이그레이션

### 선택적 파일들
- [ ] `uploads/` 폴더 - 업로드된 파일들
- [ ] `logs/` 폴더 - 로그 파일들
- [ ] `backup/` 폴더 - 백업 파일들

## 🌐 네트워크 설정 (다른 PC에서 접근 시)

### 서버 PC 설정
- [ ] 방화벽에서 3001, 3002 포트 허용
- [ ] 네트워크 모드로 실행: `npm run start:network`
- [ ] 서버 IP 주소 확인

### 클라이언트 PC 설정
- [ ] `http://[서버IP]:3002`로 접속
- [ ] 네트워크 연결 상태 확인

## ✅ 이관 완료 확인

- [ ] 모든 기능이 정상 작동하는지 확인
- [ ] 데이터가 올바르게 표시되는지 확인
- [ ] 파일 업로드/다운로드 기능 확인
- [ ] 성능 이슈가 없는지 확인
- [ ] 로그 파일에 오류가 없는지 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 콘솔 오류 메시지
2. 브라우저 개발자 도구 네트워크 탭
3. 서버 로그 파일
4. PostgreSQL 로그

---

**참고**: 이 체크리스트를 단계별로 따라하면 안전하게 프로젝트를 이관할 수 있습니다. 