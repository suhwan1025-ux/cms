# 데이터베이스 백업 시스템 가이드

## 📋 목차
1. [개요](#개요)
2. [백업 시스템 구성](#백업-시스템-구성)
3. [설치 및 설정](#설치-및-설정)
4. [자동 백업 설정](#자동-백업-설정)
5. [수동 실행](#수동-실행)
6. [백업 시스템 검증](#백업-시스템-검증)
7. [백업 데이터 확인](#백업-데이터-확인)
8. [백업 데이터 복구](#백업-데이터-복구)
9. [서버 기동과 백업 관계](#서버-기동과-백업-관계)
10. [문제 해결](#문제-해결)

---

## 개요

이 시스템은 모든 데이터베이스 테이블의 데이터를 매일 자정에 자동으로 백업하고, 10일 이상 지난 백업 데이터를 자동으로 정리합니다.

### 주요 기능
- ✅ 14개 테이블의 전체 데이터 백업
- ✅ 매일 자정 자동 실행
- ✅ 10일간 백업 데이터 보관
- ✅ 자동 로그 기록
- ✅ 오래된 백업 자동 정리

### 백업 대상 테이블
1. `departments` - 부서 정보
2. `tasks` - 업무 관리
3. `budgets` - 예산 정보
4. `suppliers` - 공급업체 정보
5. `document_templates` - 문서 템플릿
6. `proposals` - 품의서
7. `contracts` - 계약 정보
8. `approval_lines` - 결재선
9. `proposal_histories` - 품의서 이력
10. `purchase_items` - 구매 항목
11. `cost_departments` - 비용 귀속 부서
12. `request_departments` - 요청 부서
13. `contract_methods` - 계약 방식
14. `service_items` - 서비스 항목

---

## 백업 시스템 구성

### 1. SQL 스크립트
**파일:** `sql/create_backup_tables.sql`
- 백업 테이블 생성 스크립트
- 각 테이블에 대응하는 `{table_name}_backup` 테이블 생성
- 백업 날짜와 타임스탬프 컬럼 포함

### 2. Node.js 백업 스크립트
**파일:** `scripts/backup/daily-backup.js`
- 모든 테이블의 데이터를 백업 테이블로 복사
- 백업 일시 자동 기록
- 실행 결과 로그 출력

### 3. Node.js 정리 스크립트
**파일:** `scripts/backup/cleanup-old-backups.js`
- 10일 이상된 백업 데이터 자동 삭제
- 백업 데이터 현황 출력
- 통계 정보 제공

### 4. 배치 파일
**파일:** 
- `scripts/backup/run-daily-backup.bat` (배치 파일)
- `scripts/backup/run-daily-backup.ps1` (PowerShell)

백업과 정리를 순차적으로 실행하고 로그 파일 생성

---

## 설치 및 설정

### 1단계: 백업 테이블 생성

PostgreSQL에 백업 테이블을 생성합니다.

```bash
# 방법 1: psql 명령줄 사용
psql -U postgres -d contract_management -f sql/create_backup_tables.sql

# 방법 2: pgAdmin 사용
# pgAdmin에서 SQL 쿼리 도구를 열고 create_backup_tables.sql 파일 내용 실행
```

**확인 방법:**
```sql
-- 백업 테이블 목록 확인
SELECT tablename 
FROM pg_tables 
WHERE tablename LIKE '%_backup'
ORDER BY tablename;
```

14개의 백업 테이블이 생성되어야 합니다.

### 2단계: Node.js 패키지 확인

필요한 패키지가 이미 설치되어 있는지 확인합니다.

```bash
cd D:\CMS_NEW

# 패키지가 없다면 설치
npm install
```

### 3단계: 데이터베이스 연결 확인

`.env` 파일에 데이터베이스 연결 정보가 올바르게 설정되어 있는지 확인합니다.

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_management
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

---

## 자동 백업 설정

### Windows 작업 스케줄러 등록

#### 방법 1: GUI로 등록

1. **작업 스케줄러 열기**
   - `Win + R` → `taskschd.msc` 입력 → 엔터

2. **작업 만들기**
   - 우측 "작업 만들기" 클릭

3. **일반 탭 설정**
   - 이름: `CMS 데이터베이스 일일 백업`
   - 설명: `계약관리 시스템 데이터베이스 자동 백업 (매일 자정)`
   - ✅ 사용자가 로그온할 때만 실행
   - 또는 ✅ 사용자의 로그온 여부에 관계없이 실행 (권장)
   - ✅ 가장 높은 수준의 권한으로 실행

4. **트리거 탭 설정**
   - "새로 만들기" 클릭
   - 작업 시작: `일정에 따라`
   - 설정: `매일`
   - 시작 시간: `오전 12:00:00` (자정)
   - ✅ 사용
   - 확인 클릭

5. **동작 탭 설정**
   
   **PowerShell 사용 (권장):**
   - "새로 만들기" 클릭
   - 동작: `프로그램 시작`
   - 프로그램/스크립트: `powershell.exe`
   - 인수 추가:
     ```
     -ExecutionPolicy Bypass -File "D:\CMS_NEW\scripts\backup\run-daily-backup.ps1"
     ```
   - 시작 위치: `D:\CMS_NEW`
   - 확인 클릭

   **또는 배치 파일 사용:**
   - 프로그램/스크립트: `D:\CMS_NEW\scripts\backup\run-daily-backup.bat`
   - 시작 위치: `D:\CMS_NEW`

6. **조건 탭 설정**
   - ✅ 컴퓨터의 전원이 켜져 있는 경우에만 작업 시작
   - ⬜ 작업을 실행하기 위해 자동으로 해제
   - ✅ AC 전원에 연결된 경우에만 작업 시작 (선택사항)

7. **설정 탭**
   - ✅ 작업이 실패하면 다시 시작 간격: `1분`, 최대 `3회`
   - ✅ 작업을 예약된 시간에 시작할 수 없는 경우 가능한 빨리 실행
   - 확인 클릭

#### 방법 2: PowerShell로 등록

관리자 권한으로 PowerShell을 열고 다음 스크립트를 실행:

```powershell
# 작업 스케줄러 등록 스크립트
$TaskName = "CMS 데이터베이스 일일 백업"
$TaskDescription = "계약관리 시스템 데이터베이스 자동 백업 (매일 자정)"
$ScriptPath = "D:\CMS_NEW\scripts\backup\run-daily-backup.ps1"
$WorkingDir = "D:\CMS_NEW"

# 트리거: 매일 자정
$Trigger = New-ScheduledTaskTrigger -Daily -At "00:00"

# 동작: PowerShell 스크립트 실행
$Action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -File `"$ScriptPath`"" `
    -WorkingDirectory $WorkingDir

# 설정
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# 작업 등록
Register-ScheduledTask `
    -TaskName $TaskName `
    -Description $TaskDescription `
    -Trigger $Trigger `
    -Action $Action `
    -Settings $Settings `
    -RunLevel Highest `
    -Force

Write-Host "작업 스케줄러 등록 완료: $TaskName" -ForegroundColor Green
```

#### 등록 확인

```powershell
# 작업 스케줄러 확인
Get-ScheduledTask -TaskName "CMS 데이터베이스 일일 백업"
```

---

## 수동 실행

### 배치 파일 실행

```cmd
cd D:\CMS_NEW
scripts\backup\run-daily-backup.bat
```

### PowerShell 실행

```powershell
cd D:\CMS_NEW
.\scripts\backup\run-daily-backup.ps1
```

### Node.js 직접 실행

```bash
# 백업만 실행
node scripts/backup/daily-backup.js

# 정리만 실행
node scripts/backup/cleanup-old-backups.js
```

---

## 백업 시스템 검증

설치 후 또는 정기적으로 백업 시스템이 정상 작동하는지 검증하는 것이 중요합니다.

### 자동 검증 스크립트 실행

```cmd
cd D:\CMS_NEW
scripts\backup\verify-and-test.bat
```

또는 Node.js로 직접 실행:

```bash
node scripts/backup/test-backup-system.js
```

### 검증 항목

이 스크립트는 다음을 자동으로 확인합니다:

1. **백업 테이블 존재 여부**
   - 14개 백업 테이블이 모두 생성되었는지 확인

2. **백업 데이터 존재 여부**
   - 각 백업 테이블에 데이터가 있는지 확인
   - 백업 일수 및 날짜 정보 확인

3. **원본과 백업 데이터 비교**
   - 최신 백업이 원본 테이블과 일치하는지 확인

4. **복구 가능성 테스트**
   - 백업 데이터로 복구가 가능한지 검증
   - 샘플 데이터 조회 및 복구 쿼리 예시 제공

5. **작업 스케줄러 상태**
   - Windows 작업 스케줄러 등록 여부 확인

### 검증 결과 예시

```
====================================
1. 백업 테이블 존재 여부 확인
====================================

✅ departments_backup
✅ tasks_backup
✅ budgets_backup
✅ suppliers_backup
✅ document_templates_backup
✅ proposals_backup
✅ contracts_backup
✅ approval_lines_backup
✅ proposal_histories_backup
✅ purchase_items_backup
✅ cost_departments_backup
✅ request_departments_backup
✅ contract_methods_backup
✅ service_items_backup

결과: 14/14개 테이블 존재

====================================
2. 백업 데이터 및 날짜 확인
====================================

✅ departments_backup
   - 총 레코드: 60건
   - 백업 일수: 10일
   - 최신 백업: 2025-01-03
   - 최초 백업: 2024-12-24

✅ budgets_backup
   - 총 레코드: 120건
   - 백업 일수: 10일
   - 최신 백업: 2025-01-03
   - 최초 백업: 2024-12-24

...

====================================
3. 원본 vs 백업 테이블 데이터 비교
====================================

✅ departments
   원본: 6건, 최신 백업: 6건
✅ budgets
   원본: 12건, 최신 백업: 12건
...

결과: 14/14개 테이블 일치

====================================
4. 복구 가능성 테스트
====================================

✅ 테스트 대상: departments 테이블
   백업 데이터: 60건
   최신 백업 날짜: 2025-01-03

백업 데이터 샘플 (최근 백업):
  1. ID: 1, 이름: IT개발팀, 코드: IT001
     백업일: 2025-01-03
  2. ID: 2, 이름: 경영관리팀, 코드: MG001
     백업일: 2025-01-03
  ...

✅ 복구 가능성: 양호
   - 백업 데이터가 정상적으로 저장되어 있습니다.
   - 필요시 SELECT 쿼리로 특정 날짜의 데이터를 조회/복원할 수 있습니다.

====================================
최종 검증 결과
====================================

✅ 1. 백업 테이블 존재: 통과
✅ 2. 백업 데이터 존재: 통과
✅ 3. 복구 가능성: 통과
ℹ️  4. 자동 실행: 작업 스케줄러 확인 필요
```

---

## 백업 데이터 확인

### 로그 파일 확인

백업 로그는 `logs/backup/` 디렉토리에 저장됩니다.

```
logs/backup/backup_20250101_000000.log
```

### SQL로 백업 데이터 확인

```sql
-- 특정 테이블의 백업 현황 확인
SELECT 
    backup_date,
    COUNT(*) as record_count,
    MIN(backup_timestamp) as first_backup,
    MAX(backup_timestamp) as last_backup
FROM departments_backup
GROUP BY backup_date
ORDER BY backup_date DESC;

-- 모든 백업 테이블의 데이터 건수 확인
SELECT 
    'departments_backup' as table_name, 
    COUNT(*) as total_records,
    COUNT(DISTINCT backup_date) as backup_days,
    MIN(backup_date) as oldest_backup,
    MAX(backup_date) as latest_backup
FROM departments_backup
UNION ALL
SELECT 
    'budgets_backup', 
    COUNT(*),
    COUNT(DISTINCT backup_date),
    MIN(backup_date),
    MAX(backup_date)
FROM budgets_backup
UNION ALL
SELECT 
    'proposals_backup', 
    COUNT(*),
    COUNT(DISTINCT backup_date),
    MIN(backup_date),
    MAX(backup_date)
FROM proposals_backup
ORDER BY table_name;

-- 특정 날짜의 백업 데이터 조회
SELECT * 
FROM proposals_backup 
WHERE backup_date = '2025-01-01'
ORDER BY id;
```

### 백업 데이터 복원 예시

특정 날짜의 백업 데이터를 조회하거나 복원하려면:

```sql
-- 특정 날짜의 데이터 조회
SELECT id, name, total_amount, used_amount
FROM budgets_backup
WHERE backup_date = '2025-01-01'
AND id = 123;

-- 특정 레코드 복원 (조심해서 사용!)
-- 먼저 현재 데이터 확인
SELECT * FROM budgets WHERE id = 123;

-- 백업에서 복원
UPDATE budgets 
SET 
    name = b.name,
    total_amount = b.total_amount,
    used_amount = b.used_amount,
    updated_at = CURRENT_TIMESTAMP
FROM (
    SELECT * FROM budgets_backup 
    WHERE id = 123 
    AND backup_date = '2025-01-01'
    ORDER BY backup_timestamp DESC 
    LIMIT 1
) b
WHERE budgets.id = 123;
```

---

## 백업 데이터 복구

백업 데이터를 조회하고 필요시 복원할 수 있는 도구를 제공합니다.

### 대화형 복구 도구 사용

가장 쉬운 방법은 대화형 복구 도구를 사용하는 것입니다:

```bash
cd D:\CMS_NEW
node scripts/backup/restore-from-backup.js
```

**실행 흐름:**

1. **테이블 선택**
   ```
   복원 가능한 테이블:
     1. departments
     2. budgets
     3. proposals
     4. suppliers
     5. contracts
   
   테이블 번호를 선택하세요 (1-5): 1
   ```

2. **백업 날짜 선택**
   ```
   사용 가능한 백업 날짜:
     1. 2025-01-03 (6건)
     2. 2025-01-02 (6건)
     3. 2025-01-01 (5건)
   
   날짜 번호를 선택하세요: 1
   ```

3. **데이터 미리보기**
   ```
   백업 데이터 미리보기 (최대 10건):
   
   총 6건의 데이터:
     1. ID 1: id: 1, name: IT개발팀, code: IT001
     2. ID 2: id: 2, name: 경영관리팀, code: MG001
     ...
   ```

4. **작업 선택**
   ```
   작업을 선택하세요:
     1: 특정 레코드 복원
     2: 전체 조회만
     3: 종료
   ```

5. **복원 실행** (옵션 1 선택 시)
   ```
   복원할 레코드의 ID를 입력하세요: 1
   
   복원 전 데이터:
   {
     "id": 1,
     "name": "IT개발팀(수정됨)",
     "code": "IT001",
     ...
   }
   
   복원할 백업 데이터:
   {
     "id": 1,
     "name": "IT개발팀",
     "code": "IT001",
     ...
   }
   
   정말로 이 데이터로 복원하시겠습니까? (yes/no): yes
   
   ✅ 복원 완료: departments 테이블의 ID 1 레코드가 업데이트되었습니다.
   ```

### 명령줄에서 직접 조회

```bash
# 특정 테이블의 특정 날짜 백업 데이터 조회
node scripts/backup/restore-from-backup.js --table=departments --date=2025-01-03

# 특정 레코드 직접 복원
node scripts/backup/restore-from-backup.js --table=departments --date=2025-01-03 --id=1
```

### SQL로 직접 복구

더 세밀한 제어가 필요하다면 SQL 쿼리를 직접 작성할 수 있습니다:

```sql
-- 1. 백업 데이터 조회
SELECT * 
FROM departments_backup 
WHERE backup_date = '2025-01-03' 
AND id = 1
ORDER BY backup_timestamp DESC;

-- 2. 현재 데이터 확인
SELECT * FROM departments WHERE id = 1;

-- 3. 단일 레코드 복원
UPDATE departments d
SET 
    name = b.name,
    code = b.code,
    parent_id = b.parent_id,
    manager = b.manager,
    description = b.description,
    is_active = b.is_active,
    updated_at = CURRENT_TIMESTAMP
FROM (
    SELECT * FROM departments_backup 
    WHERE id = 1 
    AND backup_date = '2025-01-03'
    ORDER BY backup_timestamp DESC 
    LIMIT 1
) b
WHERE d.id = 1;

-- 4. 여러 레코드 일괄 복원 (주의!)
-- 트랜잭션 사용 권장
BEGIN;

-- 임시 테이블에 백업 데이터 복사
CREATE TEMP TABLE temp_restore AS
SELECT * FROM departments_backup 
WHERE backup_date = '2025-01-03';

-- 복원 실행
UPDATE departments d
SET 
    name = t.name,
    code = t.code,
    parent_id = t.parent_id,
    manager = t.manager,
    description = t.description,
    is_active = t.is_active,
    updated_at = CURRENT_TIMESTAMP
FROM temp_restore t
WHERE d.id = t.id;

-- 확인 후 커밋
COMMIT;
-- 또는 취소
-- ROLLBACK;
```

### 복구 시 주의사항

⚠️ **중요:** 데이터 복원은 신중하게 수행해야 합니다.

1. **복원 전 현재 데이터 백업**
   ```sql
   -- 현재 데이터를 별도 테이블에 백업
   CREATE TABLE departments_temp_backup AS 
   SELECT * FROM departments WHERE id IN (1, 2, 3);
   ```

2. **트랜잭션 사용**
   - 복원 작업은 트랜잭션으로 감싸서 실행
   - 문제 발생 시 ROLLBACK 가능

3. **외래키 제약조건 확인**
   - 다른 테이블과의 관계 확인
   - 필요시 연관 데이터도 함께 복원

4. **테스트 환경에서 먼저 시도**
   - 가능하면 테스트 데이터베이스에서 먼저 테스트

---

## 서버 기동과 백업 관계

### ✅ 서버와 독립적으로 작동

**중요:** 백업 시스템은 Node.js 애플리케이션 서버와 **완전히 독립적**으로 작동합니다.

#### 백업이 작동하는 방식

```
Windows 작업 스케줄러 (자정)
    ↓
PowerShell/배치 파일 실행
    ↓
Node.js 스크립트 실행 (독립 프로세스)
    ↓
PostgreSQL에 직접 연결
    ↓
데이터 백업 실행
```

#### Node.js 서버와의 관계

| 항목 | Node.js 서버 | 백업 시스템 |
|------|-------------|-----------|
| 실행 방식 | 웹 서버 (포트 3000) | 배치 스크립트 |
| 실행 시점 | 수동 시작/PM2로 관리 | 작업 스케줄러 (자정) |
| 데이터베이스 | Sequelize ORM 사용 | 직접 SQL 쿼리 |
| 의존성 | 서로 독립적 | 서로 독립적 |

#### 백업 작동 조건

✅ **필요한 것:**
- Windows가 켜져 있어야 함
- PostgreSQL 서비스가 실행 중이어야 함
- 작업 스케줄러가 등록되어 있어야 함

❌ **필요하지 않은 것:**
- Node.js 서버 실행 여부
- 웹 사이트 접근 가능 여부
- PM2 프로세스 관리자 상태

### 확인 방법

```powershell
# 1. 작업 스케줄러 상태 확인
Get-ScheduledTask -TaskName "CMS 데이터베이스 일일 백업"

# 출력 예시:
# TaskName                           State
# --------                           -----
# CMS 데이터베이스 일일 백업          Ready

# 2. 다음 실행 시간 확인
Get-ScheduledTaskInfo -TaskName "CMS 데이터베이스 일일 백업"

# 3. PostgreSQL 서비스 확인
Get-Service -Name postgresql*

# 출력 예시:
# Status   Name               DisplayName
# ------   ----               -----------
# Running  postgresql-x64-16  postgresql-x64-16 - PostgreSQL Server
```

### 서버 재시작/배포 시 영향

✅ **영향 없음:**
- Node.js 서버 재시작 → 백업은 정상 실행
- PM2 재시작 → 백업은 정상 실행
- 애플리케이션 배포 → 백업은 정상 실행
- 서버 코드 변경 → 백업은 정상 실행

⚠️ **영향 있음:**
- Windows 재부팅 → 작업 스케줄러는 자동 재등록됨
- PostgreSQL 중지 → 백업 실패 (로그에 기록됨)

---

## 문제 해결

### 백업이 실행되지 않을 때

1. **작업 스케줄러 확인**
   ```powershell
   Get-ScheduledTask -TaskName "CMS 데이터베이스 일일 백업" | Get-ScheduledTaskInfo
   ```

2. **수동 실행으로 테스트**
   ```cmd
   cd D:\CMS_NEW
   scripts\backup\run-daily-backup.bat
   ```

3. **로그 확인**
   ```
   logs/backup/backup_최근날짜.log
   ```

### 데이터베이스 연결 오류

1. PostgreSQL 서비스 확인
   ```powershell
   Get-Service -Name postgresql*
   ```

2. 연결 정보 확인
   - `.env` 파일의 DB 설정 확인
   - 방화벽 설정 확인

### 디스크 공간 부족

백업 데이터가 너무 많이 쌓였다면:

```sql
-- 특정 날짜 이전 데이터 수동 삭제
DELETE FROM departments_backup WHERE backup_date < '2025-01-01';
DELETE FROM budgets_backup WHERE backup_date < '2025-01-01';
-- ... 기타 테이블도 동일하게
```

또는 보관 기간 조정:

`scripts/backup/cleanup-old-backups.js` 파일에서:
```javascript
// 보관 기간을 7일로 변경
const RETENTION_DAYS = 7;  // 기본값: 10
```

### 권한 오류

PowerShell 실행 정책 오류가 발생하면:

```powershell
# 관리자 권한으로 PowerShell 실행 후
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 백업 테이블 구조

각 백업 테이블은 다음 컬럼을 포함합니다:

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `backup_id` | SERIAL | 백업 레코드 고유 ID |
| `backup_date` | DATE | 백업 날짜 (YYYY-MM-DD) |
| `backup_timestamp` | TIMESTAMP | 백업 정확한 시간 |
| ... | ... | 원본 테이블의 모든 컬럼 |

**Primary Key:** `(backup_id, backup_date)`

**Index:** `backup_date`에 인덱스 생성으로 날짜별 조회 최적화

---

## 추가 정보

### 백업 용량 예상

- 평균적으로 원본 데이터의 10배 공간 필요 (10일 보관)
- 예: 원본 데이터 1GB → 백업 데이터 약 10GB

### 백업 시간

- 소규모 데이터 (수천 건): 수초 내 완료
- 중규모 데이터 (수만 건): 수십 초
- 대규모 데이터 (수십만 건): 수 분

### 주의사항

⚠️ **백업은 데이터 복제일 뿐, 완전한 재해 복구 솔루션이 아닙니다.**

추가 안전장치:
- 정기적인 PostgreSQL dump 백업
- 외부 저장소에 백업 파일 보관
- 중요 데이터는 별도 백업 전략 수립

---

## 문의 및 지원

백업 시스템 관련 문제가 있으면:
1. 로그 파일 확인 (`logs/backup/`)
2. 데이터베이스 연결 상태 확인
3. PostgreSQL 로그 확인

---

**마지막 업데이트:** 2025-11-03

