# 계약관리시스템

React와 Node.js 기반의 계약관리시스템입니다.

## 시스템 요구사항

- Node.js 16.x 이상
- PostgreSQL 12.x 이상
- npm 또는 yarn

## 설치 및 설정

### 1. 프로젝트 클론 및 의존성 설치

```bash
# 프로젝트 디렉토리로 이동
cd contract-management-system

# 의존성 설치
npm install
```

### 2. 데이터베이스 설정

PostgreSQL이 설치되어 있어야 합니다.

```sql
-- PostgreSQL에서 데이터베이스 생성
CREATE DATABASE contract_management;
CREATE USER postgres WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE contract_management TO postgres;
```

### 3. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 설정을 수정하세요.

```bash
cp .env.example .env
```

`.env` 파일에서 다음 항목들을 수정하세요:
- `DB_PASSWORD`: PostgreSQL 비밀번호
- `DB_NAME`: 데이터베이스 이름
- 기타 필요한 설정들

### 4. 데이터베이스 마이그레이션

```bash
# Sequelize CLI를 통한 마이그레이션 실행
npx sequelize-cli db:migrate
```

### 5. 샘플 데이터 생성 (선택사항)

```bash
# 기본 샘플 데이터 생성
node create-basic-samples.js
```

## 실행 방법

### 개발 환경

```bash
# 백엔드 서버 실행 (포트 3001)
node server.js

# 새 터미널에서 프론트엔드 실행 (포트 3002)
npm start
```

### 프로덕션 환경

```bash
# 프로덕션 빌드
npm run build:prod

# 프로덕션 서버 실행
npm run start:prod
```

## 주요 기능

- 품의서 작성 및 관리
- 계약 유형별 분류 (구매, 변경, 연장, 용역, 입찰)
- 결재 프로세스 관리
- 대시보드 및 통계
- 부서별 비용 관리
- 사업예산 연동

## 포트 설정

- 백엔드 API 서버: 3001
- 프론트엔드 개발 서버: 3002
- 프로덕션 서버: 환경변수 PORT 또는 3001

## 네트워크 접근

다른 PC에서 접근하려면:

```bash
# 네트워크 접근 허용으로 실행
npm run start:network
```

그 후 `http://[서버IP]:3002`로 접근 가능합니다.

## 문제 해결

### 데이터베이스 연결 오류
- PostgreSQL 서비스가 실행 중인지 확인
- `.env` 파일의 데이터베이스 설정 확인
- 방화벽 설정 확인

### 포트 충돌
- 다른 애플리케이션이 3001, 3002 포트를 사용하고 있는지 확인
- 필요시 `.env` 파일에서 PORT 변경

### CKEditor 관련 오류
- `craco.config.js` 파일이 있는지 확인
- CKEditor 관련 의존성이 올바르게 설치되었는지 확인

## 디렉토리 구조

```
contract-management-system/
├── src/                    # React 프론트엔드 소스
│   ├── components/         # React 컴포넌트
│   ├── models/            # Sequelize 모델
│   └── ...
├── public/                # 정적 파일
├── config/                # 설정 파일
├── migrations/            # 데이터베이스 마이그레이션
├── uploads/               # 업로드된 파일
├── server.js              # 백엔드 서버
├── package.json           # 의존성 및 스크립트
└── craco.config.js        # CKEditor 설정
```

## 라이선스

이 프로젝트는 내부 사용을 위한 것입니다.
