# 📁 프로젝트 구조

이 문서는 CMS 프로젝트의 폴더 구조와 각 파일의 역할을 설명합니다.

## 📂 루트 디렉토리 구조

```
CMS_NEW/
├── src/                        # 소스 코드 (React 프론트엔드)
│   ├── components/             # React 컴포넌트
│   ├── models/                 # Sequelize 모델
│   └── database.js             # 데이터베이스 연결 설정
│
├── scripts/                    # 유틸리티 스크립트 (정리됨)
│   ├── migration/              # 스키마 마이그레이션 스크립트
│   ├── database/               # DB 관리 스크립트
│   ├── sample-data/            # 샘플 데이터 생성 스크립트
│   ├── test/                   # 테스트 스크립트
│   ├── debug/                  # 디버그 스크립트
│   ├── setup/                  # 환경 설정 스크립트
│   ├── backup/                 # 백업 스크립트
│   └── deployment/             # 배포 스크립트
│
├── docs/                       # 프로젝트 문서
│   ├── AI_ASSISTANT_README.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── MIGRATION_GUIDE.md
│   └── ...기타 가이드 문서
│
├── sql/                        # SQL 스크립트 파일
│   ├── create_*.sql            # 테이블 생성 스크립트
│   ├── update_*.sql            # 업데이트 스크립트
│   └── migrate_*.sql           # 마이그레이션 스크립트
│
├── config/                     # 설정 파일
├── migrations/                 # Sequelize 마이그레이션
├── public/                     # 정적 파일
├── build/                      # 빌드 결과물
├── ai_server/                  # AI 서버 (Python)
├── db_data_backup/             # 데이터베이스 백업
│
├── server.js                   # Express 백엔드 서버 (개발용)
├── server.prod.js              # Express 백엔드 서버 (프로덕션용)
├── package.json                # NPM 패키지 설정
├── craco.config.js             # Create React App 설정 오버라이드
├── ecosystem.config.js         # PM2 프로세스 관리 설정
├── docker-compose.yml          # Docker Compose 설정
├── Dockerfile                  # Docker 이미지 빌드 설정
└── README.md                   # 프로젝트 개요
```

---

## 📋 scripts/ 폴더 상세 설명

### 1️⃣ scripts/migration/
스키마 변경 및 데이터 마이그레이션 스크립트

**사용 예시:**
```bash
# 루트 디렉토리에서 실행
node scripts/migration/add-contract-methods.js
node scripts/migration/fix-proposals-table.js
```

**주요 파일:**
- `add-*.js` - 새로운 컬럼/테이블 추가
- `fix-*.js` - 스키마 수정
- `update-*.js` - 기존 데이터 업데이트

---

### 2️⃣ scripts/database/
데이터베이스 동기화, 비교, 관리 스크립트

**사용 예시:**
```bash
node scripts/database/sync-db.js          # DB 동기화
node scripts/database/compare-db-vs-models.js  # 스키마 비교
node scripts/database/export-current-data.js   # 데이터 내보내기
```

**주요 파일:**
- `sync-*.js` - DB 동기화
- `compare-*.js` - 스키마 비교
- `list-*.js` - 테이블 목록 조회
- `export-*.js` / `import-*.js` - 데이터 내보내기/가져오기
- `cleanup-*.js` - 데이터 정리

---

### 3️⃣ scripts/sample-data/
샘플 데이터 생성 스크립트

**사용 예시:**
```bash
node scripts/sample-data/seed-data.js
node scripts/sample-data/create-sample-proposals.js
node scripts/sample-data/generate-sample-data.js
```

**주요 파일:**
- `seed-*.js` - 기본 샘플 데이터 생성
- `create-*.js` - 특정 유형의 샘플 생성
- `generate-*.js` - 대량 샘플 데이터 생성

---

### 4️⃣ scripts/test/
테스트 및 검증 스크립트

**사용 예시:**
```bash
node scripts/test/test-ai-response.js
node scripts/test/test-rag-simple.js
python scripts/test/text-to-sql-example.py
```

**주요 파일:**
- `test-*.js` - 기능 테스트
- `direct-test.js` - 직접 테스트
- `*.py` - Python 테스트 스크립트

---

### 5️⃣ scripts/debug/
디버깅 및 문제 해결 스크립트

**사용 예시:**
```bash
node scripts/debug/debug-models.js
node scripts/debug/diagnose-current-state.js
node scripts/debug/verify-all-issues.js
```

**주요 파일:**
- `debug-*.js` - 특정 기능 디버깅
- `diagnose-*.js` - 시스템 진단
- `verify-*.js` - 검증 스크립트

---

### 6️⃣ scripts/setup/
환경 설정 및 초기 설치 스크립트

**사용 예시:**
```powershell
# PowerShell에서 실행
.\scripts\setup\setup-postgres-autostart.ps1
.\scripts\setup\install-ai-prerequisites.ps1
.\scripts\setup\workstation-setup.bat
```

**주요 파일:**
- `setup-*.ps1` / `setup-*.bat` - 환경 설정
- `install-*.ps1` - 필수 프로그램 설치
- `register-*.ps1` - 서비스 등록

---

### 7️⃣ scripts/backup/
백업 및 복원 스크립트

**사용 예시:**
```powershell
.\scripts\backup\auto_backup.ps1
.\scripts\backup\cleanup-old-backups.ps1
```

**주요 파일:**
- `auto_backup.ps1` - 자동 백업
- `cleanup-old-backups.ps1` - 오래된 백업 정리
- `backup-database.bat` - DB 백업

---

### 8️⃣ scripts/deployment/
배포 및 모니터링 스크립트

**사용 예시:**
```powershell
.\scripts\deployment\deploy.ps1
.\scripts\deployment\monitor-system.bat
```

**주요 파일:**
- `deploy.ps1` - 프로덕션 배포
- `create-migration-package.bat` - 마이그레이션 패키지 생성
- `migrate-to-new-env.bat` - 새 환경으로 마이그레이션
- `monitor-system.bat` - 시스템 모니터링

---

## 📝 중요 참고사항

### 스크립트 실행 시 주의사항

1. **실행 위치**: 모든 스크립트는 **프로젝트 루트 디렉토리**에서 실행해야 합니다.
   ```bash
   # 올바른 방법
   D:\CMS_NEW> node scripts/database/sync-db.js
   
   # 잘못된 방법
   D:\CMS_NEW\scripts\database> node sync-db.js
   ```

2. **경로 참조**: 스크립트 내부에서는 상대 경로로 설정되어 있습니다.
   - `require('../../src/models')` - 루트에서 2단계 상위로 이동
   - `.env` 파일도 루트의 것을 참조하도록 자동 설정됨

3. **환경 변수**: 모든 스크립트는 루트의 `.env` 파일을 자동으로 로드합니다.

---

## 🔧 개발 워크플로우

### 1. 로컬 개발 환경 시작
```bash
npm start                    # 프론트엔드 개발 서버 (포트 3001)
node server.js               # 백엔드 API 서버 (포트 3002)
```

### 2. 스키마 변경 시
```bash
# 1. 모델 수정 (src/models/)
# 2. 마이그레이션 스크립트 작성 (scripts/migration/)
# 3. DB 동기화
node scripts/database/sync-db.js
```

### 3. 샘플 데이터 필요 시
```bash
node scripts/sample-data/seed-data.js
```

### 4. 프로덕션 빌드
```bash
npm run build:prod           # 프론트엔드 빌드
node server.prod.js          # 프로덕션 서버 실행
```

---

## 📚 추가 문서

자세한 내용은 `docs/` 폴더의 각 가이드 문서를 참조하세요:

- **설치 가이드**: `docs/간단_설치_가이드.txt`
- **배포 가이드**: `docs/DEPLOYMENT_GUIDE.md`
- **AI 서버 설정**: `docs/AI_ASSISTANT_SETUP_COMPLETE.md`
- **PostgreSQL 설정**: `docs/POSTGRESQL_AUTO_START_GUIDE.md`
- **마이그레이션**: `docs/MIGRATION_GUIDE.md`

---

## 🎯 정리 작업 완료 내역

**2025-10-20 정리 작업:**
- ✅ 80+ 개의 스크립트 파일을 `scripts/` 하위로 분류 이동
- ✅ 20+ 개의 문서를 `docs/` 폴더로 정리
- ✅ SQL 파일들을 `sql/` 폴더로 정리
- ✅ 모든 스크립트의 require 경로 자동 수정
- ✅ 불필요한 백업 파일 삭제
- ✅ 루트 디렉토리 정리 (17개 핵심 파일만 유지)

**결과:**
- 프로젝트 구조가 체계적으로 정리됨
- 유지보수성 향상
- 신규 개발자의 이해도 향상

