# 데이터베이스 백업 시스템

모든 테이블의 데이터를 매일 자정에 자동으로 백업하고, 10일 이상 지난 백업 데이터를 자동으로 정리하는 시스템입니다.

## 🚀 빠른 시작

### 1. 백업 테이블 생성

```bash
# PostgreSQL에 백업 테이블 생성
psql -U postgres -d contract_management -f ../../sql/create_backup_tables.sql
```

### 2. 자동 백업 설정

**PowerShell을 관리자 권한으로 실행** 후:

```powershell
cd D:\CMS_NEW
.\scripts\setup\register-backup-scheduler.ps1
```

이제 매일 자정에 자동으로 백업이 실행됩니다! ✅

---

## 📋 파일 구조

```
scripts/backup/
├── daily-backup.js              # 데이터 백업 스크립트
├── cleanup-old-backups.js       # 오래된 백업 삭제 스크립트
├── test-backup-system.js        # 백업 시스템 검증 스크립트 ⭐NEW
├── restore-from-backup.js       # 백업 데이터 복구 스크립트 ⭐NEW
├── run-daily-backup.bat         # Windows 배치 파일
├── run-daily-backup.ps1         # PowerShell 스크립트
├── verify-and-test.bat          # 검증 및 테스트 배치 파일 ⭐NEW
└── README.md                    # 이 파일

scripts/setup/
└── register-backup-scheduler.ps1 # 작업 스케줄러 자동 등록

sql/
└── create_backup_tables.sql     # 백업 테이블 생성 SQL

docs/
└── DATABASE_BACKUP_GUIDE.md     # 상세 가이드
```

---

## 🔍 백업 시스템 검증

설치 후 또는 정기적으로 백업 시스템이 정상 작동하는지 검증하세요.

### 자동 검증 (권장)

```cmd
cd D:\CMS_NEW
scripts\backup\verify-and-test.bat
```

이 스크립트는 다음을 확인합니다:
1. ✅ 백업 테이블 존재 여부
2. ✅ 백업 데이터 및 날짜 확인
3. ✅ 원본과 백업 데이터 비교
4. ✅ 복구 가능성 테스트
5. ✅ 작업 스케줄러 등록 상태

### 수동 검증

```bash
# Node.js로 직접 실행
node scripts/backup/test-backup-system.js
```

**검증 결과 예시:**
```
====================================
1. 백업 테이블 존재 여부 확인
====================================

✅ departments_backup
✅ budgets_backup
✅ proposals_backup
...

결과: 14/14개 테이블 존재

====================================
2. 백업 데이터 및 날짜 확인
====================================

✅ departments_backup
   - 총 레코드: 60건
   - 백업 일수: 10일
   - 최신 백업: 2025-01-03
   - 최초 백업: 2024-12-24
...
```

---

## 🔄 백업 데이터 복구

특정 날짜의 백업 데이터를 조회하거나 복원할 수 있습니다.

### 대화형 복구 모드 (권장)

```bash
cd D:\CMS_NEW
node scripts/backup/restore-from-backup.js
```

대화형으로 다음을 선택할 수 있습니다:
1. 복구할 테이블 선택
2. 백업 날짜 선택
3. 데이터 미리보기
4. 특정 레코드 복원

### 명령줄에서 직접 조회

```bash
# 특정 테이블의 특정 날짜 백업 데이터 조회
node scripts/backup/restore-from-backup.js --table=departments --date=2025-01-03

# 특정 레코드 복원
node scripts/backup/restore-from-backup.js --table=departments --date=2025-01-03 --id=5
```

### SQL로 직접 복구

```sql
-- 백업 데이터 조회
SELECT * FROM departments_backup 
WHERE backup_date = '2025-01-03' 
AND id = 5;

-- 특정 레코드 복원
UPDATE departments d
SET 
    name = b.name,
    code = b.code,
    manager = b.manager,
    updated_at = CURRENT_TIMESTAMP
FROM (
    SELECT * FROM departments_backup 
    WHERE id = 5 
    AND backup_date = '2025-01-03'
    ORDER BY backup_timestamp DESC 
    LIMIT 1
) b
WHERE d.id = 5;
```

---

## 🔧 수동 실행

### 전체 백업 프로세스 실행

```cmd
cd D:\CMS_NEW
scripts\backup\run-daily-backup.bat
```

또는 PowerShell:

```powershell
cd D:\CMS_NEW
.\scripts\backup\run-daily-backup.ps1
```

### 개별 스크립트 실행

```bash
# 백업만 실행
node scripts/backup/daily-backup.js

# 정리만 실행
node scripts/backup/cleanup-old-backups.js
```

---

## 📊 백업 현황 확인

### 로그 파일

```
logs/backup/backup_20250103_000000.log
```

### SQL 쿼리

```sql
-- 백업 테이블 목록
SELECT tablename 
FROM pg_tables 
WHERE tablename LIKE '%_backup'
ORDER BY tablename;

-- 특정 테이블 백업 현황
SELECT 
    backup_date,
    COUNT(*) as record_count
FROM proposals_backup
GROUP BY backup_date
ORDER BY backup_date DESC;
```

---

## ⚙️ 설정 변경

### 보관 기간 변경 (기본: 10일)

`scripts/backup/cleanup-old-backups.js` 파일 수정:

```javascript
// 보관 기간 (일)
const RETENTION_DAYS = 10;  // 원하는 값으로 변경
```

### 백업 시간 변경 (기본: 자정)

작업 스케줄러에서 변경:
1. `Win + R` → `taskschd.msc`
2. "CMS 데이터베이스 일일 백업" 찾기
3. 마우스 우클릭 → "속성"
4. "트리거" 탭에서 시간 변경

---

## 🎯 백업 대상 테이블 (총 14개)

- ✅ departments (부서)
- ✅ tasks (업무)
- ✅ budgets (예산)
- ✅ suppliers (공급업체)
- ✅ document_templates (문서 템플릿)
- ✅ proposals (품의서)
- ✅ contracts (계약)
- ✅ approval_lines (결재선)
- ✅ proposal_histories (품의서 이력)
- ✅ purchase_items (구매 항목)
- ✅ cost_departments (비용 귀속 부서)
- ✅ request_departments (요청 부서)
- ✅ contract_methods (계약 방식)
- ✅ service_items (서비스 항목)

---

## 📖 상세 문서

전체 가이드는 [`docs/DATABASE_BACKUP_GUIDE.md`](../../docs/DATABASE_BACKUP_GUIDE.md) 참고

---

## ⚙️ 서버 기동과 백업 관계

### ✅ 서버와 독립적으로 작동

**중요:** 백업 시스템은 Node.js 서버와 **완전히 독립적**으로 작동합니다.

- ✅ Node.js 서버가 실행 중이지 않아도 백업 실행
- ✅ Windows 작업 스케줄러가 자정에 자동 실행
- ✅ 데이터베이스(PostgreSQL)만 실행 중이면 백업 가능
- ✅ 서버 재시작이나 배포와 무관하게 백업 유지

**작동 조건:**
- Windows가 켜져 있어야 함
- PostgreSQL 서비스가 실행 중이어야 함

**확인 방법:**
```powershell
# 작업 스케줄러 상태 확인
Get-ScheduledTask -TaskName "CMS 데이터베이스 일일 백업"

# PostgreSQL 서비스 확인
Get-Service -Name postgresql*
```

---

## ❓ 문제 해결

### 백업이 실행되지 않음

```powershell
# 작업 상태 확인
Get-ScheduledTask -TaskName "CMS 데이터베이스 일일 백업"

# 수동 실행 테스트
cd D:\CMS_NEW
.\scripts\backup\run-daily-backup.ps1
```

### 데이터베이스 연결 오류

- `.env` 파일의 DB 연결 정보 확인
- PostgreSQL 서비스 실행 확인
  ```powershell
  Get-Service -Name postgresql*
  ```

### 디스크 공간 부족

보관 기간을 줄이거나 수동으로 오래된 백업 삭제:

```sql
DELETE FROM departments_backup WHERE backup_date < '2025-01-01';
```

---

## 📞 지원

문제가 있으면:
1. 로그 파일 확인 (`logs/backup/`)
2. 상세 가이드 참고 (`docs/DATABASE_BACKUP_GUIDE.md`)
3. PostgreSQL 로그 확인

---

**마지막 업데이트:** 2025-11-03

