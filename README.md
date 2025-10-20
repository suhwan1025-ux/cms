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
node scripts/sample-data/seed-data.js
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
CMS_NEW/
├── src/                    # React 프론트엔드 소스
│   ├── components/         # React 컴포넌트
│   ├── models/            # Sequelize 모델
│   └── database.js        # DB 연결 설정
├── scripts/               # 유틸리티 스크립트 (체계적으로 정리됨)
│   ├── migration/         # 스키마 마이그레이션
│   ├── database/          # DB 관리 스크립트
│   ├── sample-data/       # 샘플 데이터 생성
│   ├── test/              # 테스트 스크립트
│   ├── debug/             # 디버깅 스크립트
│   ├── setup/             # 환경 설정
│   ├── backup/            # 백업 스크립트
│   └── deployment/        # 배포 스크립트
├── docs/                  # 프로젝트 문서 (가이드, 매뉴얼)
├── sql/                   # SQL 스크립트 파일
├── config/                # 설정 파일
├── migrations/            # Sequelize 마이그레이션
├── public/                # 정적 파일
├── build/                 # 빌드 결과물
├── ai_server/             # AI 서버 (Python)
├── db_data_backup/        # DB 백업 데이터
├── server.js              # 백엔드 API 서버 (개발용)
├── server.prod.js         # 백엔드 서버 (프로덕션용)
├── package.json           # 의존성 및 스크립트
├── craco.config.js        # CRA 설정 오버라이드
├── ecosystem.config.js    # PM2 프로세스 관리
├── docker-compose.yml     # Docker Compose 설정
└── Dockerfile             # Docker 이미지 빌드

📚 상세한 구조 설명은 docs/PROJECT_STRUCTURE.md 참조
```

## 📚 추가 문서

### 데이터베이스 스키마
- [데이터베이스 스키마 개요](docs/DATABASE_SCHEMA.md) - 테이블 구조 및 관계 설명
- [데이터베이스 스키마 상세](docs/DATABASE_SCHEMA_DETAIL.md) - 실제 DB에서 추출한 상세 정보

### 프로젝트 관리
- [🔧 유지보수 가이드](docs/MAINTENANCE_GUIDE.md) - **종합 유지보수 매뉴얼** ⭐
- [프로젝트 구조](docs/PROJECT_STRUCTURE.md) - 폴더 구조 및 스크립트 가이드
- [배포 가이드](docs/DEPLOYMENT_GUIDE.md)
- [마이그레이션 가이드](docs/MIGRATION_GUIDE.md)

### 설치 및 설정
- [간단 설치 가이드](docs/간단_설치_가이드.txt)
- [PostgreSQL 자동 시작 설정](docs/POSTGRESQL_AUTO_START_GUIDE.md)
- [워크스테이션 설정](docs/WORKSTATION_SETUP_GUIDE.md)

### AI 기능
- [AI Assistant 설정](docs/AI_ASSISTANT_SETUP_COMPLETE.md)
- [AI 서버 실행 가이드](docs/AI_서버_실행_가이드.txt)
- [TEXT-TO-SQL 구현](docs/TEXT_TO_SQL_구현_가이드.md)
- [RAG 구현 완료](docs/RAG_구현_완료.md)

---

## 라이선스

이 프로젝트는 내부 사용을 위한 것입니다.
