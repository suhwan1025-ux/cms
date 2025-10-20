# 🔧 계약관리시스템 유지보수 가이드

이 문서는 계약관리시스템(CMS)의 유지보수를 위한 종합 가이드입니다.

**대상 독자**: 시스템 관리자, 개발자, 유지보수 담당자  
**최종 업데이트**: 2025-10-20  
**버전**: 1.0

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [프로젝트 구조](#프로젝트-구조)
3. [일상적인 유지보수](#일상적인-유지보수)
4. [데이터베이스 관리](#데이터베이스-관리)
5. [스크립트 활용 가이드](#스크립트-활용-가이드)
6. [문제 해결](#문제-해결)
7. [배포 및 업데이트](#배포-및-업데이트)
8. [백업 및 복구](#백업-및-복구)
9. [성능 최적화](#성능-최적화)
10. [보안 관리](#보안-관리)

---

## 시스템 개요

### 기술 스택
- **프론트엔드**: React 18.2
- **백엔드**: Node.js + Express 5.1
- **데이터베이스**: PostgreSQL 12+
- **ORM**: Sequelize 6.37
- **프로세스 관리**: PM2
- **에디터**: CKEditor 5

### 주요 기능
- 품의서 작성 및 관리 (구매, 변경, 연장, 용역, 입찰)
- 전자 결재 프로세스
- 예산 관리 (일반예산, 사업예산)
- 계약서 생성 및 관리
- AI 기반 자동화 (TEXT-TO-SQL, RAG)

### 시스템 요구사항
- **Node.js**: 16.x 이상
- **PostgreSQL**: 12.x 이상
- **메모리**: 최소 4GB (권장 8GB)
- **디스크**: 최소 20GB 여유 공간

---

## 프로젝트 구조

### 📂 디렉토리 구조 (2025-10-20 정리 완료)

```
CMS_NEW/
├── src/                        # 소스 코드
│   ├── components/             # React 컴포넌트 (ProposalForm, Dashboard 등)
│   ├── models/                 # Sequelize 모델 (16개 모델)
│   └── database.js             # DB 연결 설정
│
├── scripts/                    # 유틸리티 스크립트 (94개, 8개 카테고리)
│   ├── migration/              # 스키마 마이그레이션 (17개)
│   ├── database/               # DB 관리 (19개)
│   ├── sample-data/            # 샘플 데이터 생성 (21개)
│   ├── test/                   # 테스트 스크립트 (7개)
│   ├── debug/                  # 디버깅 스크립트 (11개)
│   ├── setup/                  # 환경 설정 (13개)
│   ├── backup/                 # 백업 스크립트 (3개)
│   └── deployment/             # 배포 스크립트 (4개)
│
├── docs/                       # 프로젝트 문서 (29개)
│   ├── MAINTENANCE_GUIDE.md    # 📌 본 문서
│   ├── PROJECT_STRUCTURE.md    # 프로젝트 구조 상세
│   ├── DATABASE_SCHEMA.md      # DB 스키마 개요
│   ├── DATABASE_SCHEMA_DETAIL.md  # DB 스키마 상세
│   ├── DATABASE_ER_DIAGRAM.md  # ER 다이어그램
│   ├── DEPLOYMENT_GUIDE.md     # 배포 가이드
│   └── ...기타 가이드
│
├── sql/                        # SQL 스크립트 (7개)
├── config/                     # 설정 파일
├── migrations/                 # Sequelize 마이그레이션
├── public/                     # 정적 파일
├── build/                      # 빌드 결과물
├── ai_server/                  # AI 서버 (Python)
├── db_data_backup/             # DB 백업 데이터
│
├── server.js                   # 백엔드 서버 (개발)
├── server.prod.js              # 백엔드 서버 (프로덕션)
├── package.json                # NPM 설정
├── craco.config.js             # CRA 설정
├── ecosystem.config.js         # PM2 설정
└── README.md                   # 프로젝트 개요
```

### 🔑 중요 파일 설명

| 파일 | 역할 | 수정 시 주의사항 |
|------|------|----------------|
| `server.js` | 개발용 백엔드 서버 | 포트 충돌 주의 (기본 3002) |
| `server.prod.js` | 프로덕션 서버 | PM2로 실행, 로그 확인 필수 |
| `package.json` | 의존성 관리 | 업데이트 전 백업 필수 |
| `.env` | 환경 변수 | **절대 Git에 커밋 금지** |
| `ecosystem.config.js` | PM2 프로세스 설정 | 메모리 제한 확인 |
| `craco.config.js` | CKEditor 설정 | Webpack 오버라이드 |

---

## 일상적인 유지보수

### 📅 일일 점검 사항

#### 1. 시스템 상태 확인
```bash
# PM2 프로세스 상태 확인
pm2 status

# 메모리 사용량 확인
pm2 monit

# 로그 확인
pm2 logs contract-management-system --lines 50
```

**정상 상태**:
- 프로세스 상태: `online`
- CPU 사용률: < 50%
- 메모리 사용: < 800MB

#### 2. 데이터베이스 상태 확인
```bash
# PostgreSQL 서비스 상태
sc query postgresql-x64-12

# DB 연결 테스트
node scripts/database/list-tables.js
```

#### 3. 디스크 공간 확인
```powershell
# 디스크 여유 공간 확인
Get-PSDrive C | Select-Object Used,Free

# 로그 파일 크기 확인
Get-ChildItem logs/*.log | Measure-Object -Property Length -Sum
```

**권장 조치**:
- 디스크 여유 공간 < 5GB: 로그 정리 필요
- 로그 파일 총합 > 500MB: 오래된 로그 삭제

---

### 📅 주간 점검 사항

#### 1. 데이터베이스 백업 확인
```powershell
# 백업 파일 확인
Get-ChildItem db_data_backup/*.sql | Sort-Object LastWriteTime -Descending | Select-Object -First 5

# 최신 백업이 7일 이상 오래되었는지 확인
$latestBackup = Get-ChildItem db_data_backup/*.sql | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ((Get-Date) - $latestBackup.LastWriteTime -gt [TimeSpan]::FromDays(7)) {
    Write-Host "⚠️ 백업이 오래되었습니다. 즉시 백업을 실행하세요!"
}
```

#### 2. 수동 백업 실행
```powershell
# 자동 백업 스크립트 실행
.\scripts\backup\auto_backup.ps1

# 오래된 백업 정리 (30일 이상)
.\scripts\backup\cleanup-old-backups.ps1
```

#### 3. 시스템 업데이트 확인
```bash
# NPM 패키지 보안 취약점 확인
npm audit

# 업데이트 가능한 패키지 확인
npm outdated
```

---

### 📅 월간 점검 사항

#### 1. 데이터베이스 최적화
```bash
# DB 통계 업데이트
node scripts/database/sync-db.js

# 테이블 용량 확인
node scripts/database/list-all-tables.js
```

#### 2. 성능 모니터링
```bash
# 시스템 상태 모니터링 도구 실행
.\scripts\deployment\monitor-system.bat
```

#### 3. 의존성 업데이트 (신중하게)
```bash
# 마이너 버전 업데이트만 (안전)
npm update

# 백업 후 테스트 환경에서 먼저 확인
npm run test
```

---

## 데이터베이스 관리

### 📊 데이터베이스 구조

**총 26개 테이블**:
- 핵심 테이블: `proposals` (품의서), `purchase_items`, `service_items`
- 예산 테이블: `budgets`, `business_budgets`, `business_budget_history`
- 결재 테이블: `approval_lines`, `approval_rules`, `approval_conditions`
- 기준 정보: `departments`, `suppliers`, `contract_methods`

자세한 내용: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

### 🔧 일반적인 DB 작업

#### 1. 스키마 변경
```bash
# 1단계: 모델 파일 수정 (src/models/)
# 2단계: 마이그레이션 파일 작성 (scripts/migration/)

# 3단계: DB 동기화
node scripts/database/sync-db.js

# 4단계: 변경사항 검증
node scripts/database/compare-db-vs-models.js
```

#### 2. 데이터 내보내기/가져오기
```bash
# 전체 데이터 내보내기 (JSON)
node scripts/database/export-current-data.js

# 데이터 가져오기
node scripts/database/import-current-data.js
```

#### 3. 스키마 문서 업데이트
```bash
# DB 구조를 자동으로 분석하여 문서 생성
node scripts/database/generate-schema-doc.js

# 결과: docs/DATABASE_SCHEMA_DETAIL.md 업데이트
```

#### 4. 샘플 데이터 생성
```bash
# 기본 샘플 데이터
node scripts/sample-data/seed-data.js

# 2025년 사업예산 샘플
node scripts/sample-data/create-2025-business-budget-samples.js

# 품의서 샘플
node scripts/sample-data/create-sample-proposals.js
```

---

## 스크립트 활용 가이드

### 📁 scripts/migration/ (스키마 마이그레이션)

**용도**: 데이터베이스 스키마 변경

**주요 스크립트**:
```bash
# 새 컬럼 추가
node scripts/migration/add-contract-methods.js

# 스키마 수정
node scripts/migration/fix-proposals-table.js

# 기존 데이터 업데이트
node scripts/migration/update-cost-department-schema.js
```

**작성 가이드**:
1. `src/models/` 에서 모델 먼저 수정
2. `scripts/migration/` 에 마이그레이션 스크립트 작성
3. 테스트 환경에서 실행 후 검증
4. 프로덕션 배포 전 백업 필수

---

### 📁 scripts/database/ (DB 관리)

**용도**: DB 조회, 동기화, 데이터 관리

**자주 사용하는 스크립트**:
```bash
# DB 동기화
node scripts/database/sync-db.js

# 테이블 목록 조회
node scripts/database/list-all-tables.js

# 스키마 비교
node scripts/database/compare-db-vs-models.js

# 데이터 내보내기
node scripts/database/export-current-data.js

# 데이터 가져오기
node scripts/database/import-current-data.js

# 스키마 문서 생성
node scripts/database/generate-schema-doc.js
```

---

### 📁 scripts/sample-data/ (샘플 데이터)

**용도**: 개발/테스트용 샘플 데이터 생성

```bash
# 기본 샘플 데이터 (부서, 공급업체, 예산)
node scripts/sample-data/seed-data.js

# 품의서 샘플
node scripts/sample-data/create-sample-proposals.js

# 사업예산 샘플
node scripts/sample-data/create-2025-business-budget-samples.js
```

**⚠️ 주의**: 프로덕션 환경에서는 실행 금지!

---

### 📁 scripts/test/ (테스트)

**용도**: 기능 테스트 및 검증

```bash
# AI 응답 테스트
node scripts/test/test-ai-response.js

# RAG 기능 테스트
node scripts/test/test-rag-simple.js

# 전체 타입 테스트
node scripts/test/test-all-types.js
```

---

### 📁 scripts/debug/ (디버깅)

**용도**: 문제 진단 및 디버깅

```bash
# 현재 상태 진단
node scripts/debug/diagnose-current-state.js

# 모델 디버깅
node scripts/debug/debug-models.js

# 모든 이슈 검증
node scripts/debug/verify-all-issues.js
```

---

### 📁 scripts/setup/ (환경 설정)

**용도**: 시스템 설치 및 환경 설정

```powershell
# PostgreSQL 자동 시작 설정
.\scripts\setup\setup-postgres-autostart.ps1

# AI 서버 사전 요구사항 설치
.\scripts\setup\install-ai-prerequisites.ps1

# 워크스테이션 초기 설정
.\scripts\setup\workstation-setup.bat
```

---

### 📁 scripts/backup/ (백업)

**용도**: 데이터베이스 백업

```powershell
# 자동 백업 (권장: Task Scheduler로 주기적 실행)
.\scripts\backup\auto_backup.ps1

# 오래된 백업 정리 (30일 이상)
.\scripts\backup\cleanup-old-backups.ps1
```

---

### 📁 scripts/deployment/ (배포)

**용도**: 시스템 배포 및 모니터링

```powershell
# 프로덕션 배포
.\scripts\deployment\deploy.ps1

# 시스템 모니터링
.\scripts\deployment\monitor-system.bat

# 새 환경으로 마이그레이션
.\scripts\deployment\migrate-to-new-env.bat
```

---

## 문제 해결

### 🚨 자주 발생하는 문제

#### 1. 서버가 시작되지 않음

**증상**:
```
Error: listen EADDRINUSE: address already in use :::3002
```

**원인**: 포트가 이미 사용 중

**해결**:
```powershell
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :3002

# 프로세스 종료 (PID 확인 후)
taskkill /PID [프로세스ID] /F

# 또는 다른 포트 사용
# .env 파일에서 PORT 변경
```

---

#### 2. 데이터베이스 연결 실패

**증상**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**원인**: PostgreSQL 서비스가 실행되지 않음

**해결**:
```powershell
# PostgreSQL 서비스 시작
net start postgresql-x64-12

# 서비스 상태 확인
sc query postgresql-x64-12

# 연결 테스트
psql -U postgres -d contract_management
```

---

#### 3. 모델과 DB 스키마 불일치

**증상**:
```
SequelizeDatabaseError: column "new_column" does not exist
```

**원인**: 모델 파일은 수정했지만 DB 스키마는 업데이트 안 됨

**해결**:
```bash
# 스키마 비교
node scripts/database/compare-db-vs-models.js

# DB 동기화
node scripts/database/sync-db.js

# 또는 마이그레이션 실행
npx sequelize-cli db:migrate
```

---

#### 4. CKEditor 빌드 오류

**증상**:
```
Error: Can't resolve '@ckeditor/ckeditor5-...'
```

**원인**: CKEditor 의존성 문제

**해결**:
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# craco.config.js 확인
# CKEditor 관련 설정이 올바른지 확인
```

---

#### 5. 메모리 부족

**증상**:
```
FATAL ERROR: Reached heap limit Allocation failed
```

**원인**: Node.js 메모리 한계

**해결**:
```bash
# ecosystem.config.js 수정
max_memory_restart: '2G'  # 1G → 2G로 증가

# PM2 재시작
pm2 restart contract-management-system
```

---

### 🔍 디버깅 도구

#### 로그 확인
```bash
# PM2 로그
pm2 logs contract-management-system

# 특정 라인 수만 확인
pm2 logs --lines 100

# 에러 로그만 필터링
pm2 logs --err
```

#### 데이터베이스 쿼리 디버깅
```javascript
// server.js에서 logging 활성화
const sequelize = new Sequelize(..., {
  logging: console.log  // false → console.log
});
```

---

## 배포 및 업데이트

### 🚀 배포 프로세스

#### 1. 개발 환경에서 테스트
```bash
# 변경사항 커밋 전 로컬 테스트
npm start
node server.js

# 빌드 테스트
npm run build
```

#### 2. Git 커밋 및 푸시
```bash
git add .
git commit -m "설명적인 커밋 메시지"
git push origin main
```

#### 3. 프로덕션 서버에서 업데이트
```bash
# 1. 백업 (필수!)
.\scripts\backup\auto_backup.ps1

# 2. Git Pull
git pull origin main

# 3. 의존성 업데이트 (package.json 변경 시)
npm install

# 4. DB 마이그레이션 (필요 시)
node scripts/database/sync-db.js

# 5. 빌드
npm run build:prod

# 6. PM2 재시작
pm2 restart contract-management-system

# 7. 상태 확인
pm2 status
pm2 logs --lines 50
```

---

### 📦 전체 배포 (새 서버)

```powershell
# 배포 스크립트 사용
.\scripts\deployment\deploy.ps1
```

또는 수동 배포:

```bash
# 1. Node.js, PostgreSQL 설치
# 2. 저장소 클론
git clone https://github.com/suhwan1025-ux/cms.git
cd cms

# 3. 의존성 설치
npm install

# 4. 환경 변수 설정
copy .env.example .env
# .env 파일 수정

# 5. DB 생성 및 마이그레이션
createdb contract_management
npx sequelize-cli db:migrate

# 6. 샘플 데이터 (선택)
node scripts/sample-data/seed-data.js

# 7. 빌드
npm run build:prod

# 8. PM2로 실행
pm2 start ecosystem.config.js --env production
pm2 save
```

---

## 백업 및 복구

### 💾 백업 전략

#### 1. 자동 백업 설정

**Task Scheduler 등록** (Windows):
```powershell
# 1. Task Scheduler 열기
# 2. 작업 만들기
# 3. 트리거: 매일 새벽 2시
# 4. 동작: .\scripts\backup\auto_backup.ps1 실행
```

**또는 Cron 사용** (Linux):
```bash
# crontab -e
0 2 * * * cd /path/to/cms && ./scripts/backup/auto_backup.ps1
```

#### 2. 백업 보관 정책
- **일일 백업**: 7일간 보관
- **주간 백업**: 4주간 보관
- **월간 백업**: 12개월 보관

#### 3. 백업 파일 위치
```
db_data_backup/
├── backup_2025-10-20_02-00-00.sql
├── backup_2025-10-19_02-00-00.sql
└── ...
```

---

### 🔄 복구 프로세스

#### 전체 복구
```bash
# 1. 백업 파일 확인
dir db_data_backup\*.sql

# 2. PostgreSQL에 복구
psql -U postgres -d contract_management -f db_data_backup\backup_2025-10-20_02-00-00.sql

# 3. 서버 재시작
pm2 restart contract-management-system
```

#### 부분 복구 (특정 테이블만)
```bash
# JSON 형식으로 내보내기 (복구 전 백업)
node scripts/database/export-current-data.js

# 특정 데이터만 수정 후 가져오기
node scripts/database/import-current-data.js
```

---

## 성능 최적화

### ⚡ 성능 체크리스트

#### 1. 데이터베이스 최적화
```sql
-- 인덱스 확인
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 테이블 용량 확인
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- VACUUM 실행 (PostgreSQL 유지보수)
VACUUM ANALYZE;
```

#### 2. Node.js 서버 최적화
```javascript
// ecosystem.config.js 설정 최적화
{
  instances: 1,  // CPU 코어 수에 맞게 조정
  exec_mode: 'cluster',  // 클러스터 모드
  max_memory_restart: '1G',
  node_args: '--max-old-space-size=1024'
}
```

#### 3. 프론트엔드 최적화
```bash
# 프로덕션 빌드 시 소스맵 제거
npm run build:prod

# 결과 확인
ls -lh build/static/js/
```

---

### 📊 모니터링

```bash
# PM2 모니터링
pm2 monit

# 실시간 로그
pm2 logs --lines 100 --raw

# 시스템 리소스
.\scripts\deployment\monitor-system.bat
```

---

## 보안 관리

### 🔒 보안 체크리스트

#### 1. 환경 변수 보호
```bash
# .env 파일 권한 확인
# .gitignore에 .env 포함 확인

# 민감 정보 절대 커밋 금지:
# - DB_PASSWORD
# - API_KEY
# - SECRET_TOKEN
```

#### 2. 의존성 보안 점검
```bash
# 보안 취약점 스캔
npm audit

# 자동 수정 (신중하게)
npm audit fix

# 수동 확인 필요한 항목
npm audit fix --force
```

#### 3. PostgreSQL 보안
```sql
-- 비밀번호 변경 (정기적으로)
ALTER USER postgres PASSWORD '새비밀번호';

-- 불필요한 권한 제거
REVOKE ALL ON DATABASE contract_management FROM PUBLIC;
```

#### 4. 네트워크 보안
```bash
# 방화벽 설정 확인
# - 포트 3001, 3002: 내부 네트워크만 허용
# - 포트 5432: localhost만 허용
# - 포트 8000: AI 서버, localhost만 허용
```

---

## 📝 체크리스트

### 일일 체크리스트
- [ ] PM2 프로세스 상태 확인
- [ ] 로그에서 에러 확인
- [ ] 디스크 공간 확인 (> 5GB)
- [ ] PostgreSQL 서비스 상태

### 주간 체크리스트
- [ ] 데이터베이스 백업 확인
- [ ] 백업 파일 무결성 테스트
- [ ] 오래된 로그 정리
- [ ] `npm audit` 실행

### 월간 체크리스트
- [ ] DB 최적화 (`VACUUM ANALYZE`)
- [ ] 성능 모니터링 리포트 생성
- [ ] 의존성 업데이트 검토
- [ ] 백업 복구 테스트
- [ ] 문서 업데이트 확인

---

## 📞 지원 및 연락처

### 문서 참조
- [프로젝트 구조](./PROJECT_STRUCTURE.md)
- [데이터베이스 스키마](./DATABASE_SCHEMA.md)
- [배포 가이드](./DEPLOYMENT_GUIDE.md)
- [마이그레이션 가이드](./MIGRATION_GUIDE.md)

### 문제 발생 시
1. 로그 확인: `pm2 logs`
2. 디버그 스크립트 실행: `scripts/debug/`
3. 문서 검색: `docs/` 폴더
4. GitHub Issues 확인

---

## 📚 부록

### A. 유용한 명령어 모음

```bash
# ===== PM2 =====
pm2 list                    # 프로세스 목록
pm2 restart all             # 전체 재시작
pm2 delete all              # 전체 삭제
pm2 save                    # 현재 상태 저장

# ===== PostgreSQL =====
psql -U postgres            # PostgreSQL 접속
\l                          # 데이터베이스 목록
\dt                         # 테이블 목록
\d table_name               # 테이블 구조

# ===== NPM =====
npm list --depth=0          # 설치된 패키지 목록
npm outdated                # 업데이트 가능한 패키지
npm ci                      # package-lock.json 기반 설치

# ===== Git =====
git status                  # 상태 확인
git log --oneline -10       # 최근 10개 커밋
git diff                    # 변경사항 확인
```

### B. 성능 벤치마크 기준

| 지표 | 정상 | 주의 | 위험 |
|------|------|------|------|
| CPU 사용률 | < 30% | 30-60% | > 60% |
| 메모리 사용 | < 600MB | 600-800MB | > 800MB |
| 응답 시간 | < 200ms | 200-500ms | > 500ms |
| DB 연결 수 | < 20 | 20-50 | > 50 |

### C. 에러 코드 참조

| 코드 | 의미 | 해결 방법 |
|------|------|----------|
| EADDRINUSE | 포트 사용 중 | 프로세스 종료 또는 포트 변경 |
| ECONNREFUSED | DB 연결 실패 | PostgreSQL 서비스 확인 |
| SequelizeError | ORM 오류 | 모델과 스키마 일치 확인 |
| ENOSPC | 디스크 부족 | 로그 정리, 백업 이동 |

---

**문서 버전**: 1.0  
**최종 수정**: 2025-10-20  
**작성자**: AI Assistant

**변경 이력**:
- 2025-10-20: 초기 작성 (프로젝트 구조 정리 반영)

