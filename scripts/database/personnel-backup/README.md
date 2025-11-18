# Personnel Backup 테이블 가이드

## 📋 개요

`personnel_backup` 테이블은 내부인력 현황의 주기적 백업을 위한 테이블입니다.

### 목적
- 대시보드에서 기간별 인원 증감 분석
- 과거 특정 시점의 인력 현황 조회
- 데이터 변경/삭제로 인한 이력 소실 방지

### 왜 필요한가?
내부인력 데이터는 **변경되거나 삭제**될 수 있어, 과거 시점 복원이 불가능합니다.
- 부서 이동, 승진 → 데이터 변경
- 퇴사 → 데이터 삭제 가능
- 백업 없이는 과거 시점의 정확한 인원수를 알 수 없음

---

## 🚀 설치 및 실행

### 1. 테이블 생성 (PostgreSQL)

```bash
psql -U postgres -d cms_db -f scripts/database/personnel-backup/01-create-personnel-backup-table.sql
```

또는 Sequelize 마이그레이션 사용:

```bash
# 마이그레이션 파일 복사
cp scripts/database/personnel-backup/03-sequelize-migration.js src/migrations/$(date +%Y%m%d%H%M%S)-create-personnel-backup.js

# 마이그레이션 실행
npx sequelize-cli db:migrate
```

---

### 2. 수동 백업 실행

#### SQL 직접 실행
```bash
psql -U postgres -d cms_db -f scripts/database/personnel-backup/02-insert-backup-data.sql
```

#### Node.js 스크립트 사용 (권장)
```bash
node scripts/database/personnel-backup/04-auto-backup.js
```

출력 예시:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Personnel 백업 시작...
⏰ 백업 시간: 2024.11.18 오후 3:45:00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DB 연결 성공
📅 백업 일자: 2024-11-18
📊 백업 대상: 45명
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 백업 완료!
   📊 백업된 인원: 45명
   ⏱️  소요 시간: 0.25초
   📅 백업 일자: 2024-11-18
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 3. 자동 백업 설정 (Cron)

#### Linux/Mac
```bash
# crontab 편집
crontab -e

# 매월 1일 자정에 자동 백업
0 0 1 * * cd /path/to/CMS_NEW && node scripts/database/personnel-backup/04-auto-backup.js >> /var/log/personnel-backup.log 2>&1
```

#### Windows (Task Scheduler)
1. **작업 스케줄러** 열기
2. **기본 작업 만들기** 클릭
3. 이름: `Personnel 자동 백업`
4. 트리거: 매월 1일, 매일 자정
5. 작업: `node`
6. 인수: `D:\CMS_NEW\scripts\database\personnel-backup\04-auto-backup.js`
7. 시작 위치: `D:\CMS_NEW`

---

## 📊 사용 예시

### 1. 특정 날짜의 백업 데이터 조회

```sql
-- 2024년 1월 1일 기준 인력 현황
SELECT * 
FROM personnel_backup 
WHERE backup_date = '2024-01-01'
ORDER BY department, name;
```

### 2. 기간별 인원 증감 분석

```sql
-- 2024년 1월 vs 2024년 11월 부서별 인원 비교
WITH jan_data AS (
  SELECT department, COUNT(*) as count
  FROM personnel_backup
  WHERE backup_date = '2024-01-01'
    AND (resignation_date IS NULL OR resignation_date > '2024-01-01')
  GROUP BY department
),
nov_data AS (
  SELECT department, COUNT(*) as count
  FROM personnel
  WHERE is_active = TRUE
  GROUP BY department
)
SELECT 
  COALESCE(j.department, n.department) as department,
  COALESCE(j.count, 0) as jan_count,
  COALESCE(n.count, 0) as nov_count,
  COALESCE(n.count, 0) - COALESCE(j.count, 0) as change
FROM jan_data j
FULL OUTER JOIN nov_data n ON j.department = n.department
ORDER BY department;
```

### 3. 백업 이력 조회

```sql
-- 전체 백업 이력
SELECT 
  backup_date,
  COUNT(*) as personnel_count,
  COUNT(DISTINCT department) as dept_count
FROM personnel_backup
GROUP BY backup_date
ORDER BY backup_date DESC;
```

---

## 🔍 테이블 구조

### 주요 컬럼

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | INTEGER | 백업 레코드 고유 ID (자동증가) |
| `backup_date` | DATE | 백업 일자 (인덱스) |
| `original_id` | INTEGER | 원본 personnel 테이블의 id |
| `department` | VARCHAR(100) | 부서 |
| `name` | VARCHAR(100) | 성명 |
| `employee_number` | VARCHAR(50) | 사번 |
| `join_date` | DATE | 입사일 |
| `resignation_date` | DATE | 퇴사일 |
| ... | ... | (personnel 테이블과 동일) |

### 인덱스

- `idx_personnel_backup_date`: 백업 일자
- `idx_personnel_backup_original_id`: 원본 ID
- `idx_personnel_backup_department`: 부서
- `idx_personnel_backup_employee_number`: 사번
- `idx_personnel_backup_date_resignation`: 백업일자 + 퇴사일 (복합)

---

## ⚠️ 주의사항

### 1. 디스크 공간 관리
백업 데이터는 누적되므로 주기적으로 오래된 백업 삭제 필요:

```sql
-- 1년 이전 백업 삭제
DELETE FROM personnel_backup 
WHERE backup_date < CURRENT_DATE - INTERVAL '1 year';
```

### 2. 백업 주기
- **권장**: 매월 1일
- **최소**: 분기별 (3개월마다)
- 대시보드에서 월별/분기별 증감 분석이 필요하면 월 1회 필수

### 3. 백업 검증
백업 후 반드시 데이터 확인:

```sql
-- 오늘 백업된 데이터 확인
SELECT 
  backup_date,
  COUNT(*) as count,
  COUNT(DISTINCT department) as dept_count
FROM personnel_backup
WHERE backup_date = CURRENT_DATE
GROUP BY backup_date;
```

---

## 📂 파일 목록

| 파일명 | 설명 |
|--------|------|
| `01-create-personnel-backup-table.sql` | 테이블 생성 SQL (PostgreSQL) |
| `02-insert-backup-data.sql` | 백업 데이터 삽입 SQL |
| `03-sequelize-migration.js` | Sequelize 마이그레이션 파일 |
| `04-auto-backup.js` | Node.js 자동 백업 스크립트 |
| `README.md` | 이 문서 |

---

## 🆘 문제 해결

### Q1. "relation personnel_backup does not exist" 오류
**A**: 테이블이 생성되지 않았습니다. `01-create-personnel-backup-table.sql` 실행

### Q2. 백업 데이터가 중복됨
**A**: 동일한 날짜에 여러 번 백업하면 중복됩니다. 자동 스크립트는 기존 백업 삭제 후 재백업

### Q3. API에서 500 에러 발생
**A**: `server.js`가 이미 수정되어 테이블 없으면 빈 배열 반환. 서버 재시작 필요

---

## 📞 문의

문제 발생 시 로그 확인:
```bash
# 백업 스크립트 실행 시 로그
node scripts/database/personnel-backup/04-auto-backup.js

# 서버 로그 확인
tail -f logs/server.log
```

---

**마지막 업데이트**: 2024-11-18

