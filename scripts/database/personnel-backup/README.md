# Personnel Backup 가이드

## 📋 개요

`personnel_backup` 테이블은 내부인력 현황의 자동 백업을 위한 테이블입니다.

### ✨ 자동 백업 (v2.0)

**이제 서버에 통합되어 자동으로 백업됩니다!**

```bash
npm run start:prod
```

서버 시작 시 자동으로:
- ✅ 매일 자정(00:00) 자동 백업
- ✅ 중복 백업 방지
- ✅ personnel_backup 테이블 자동 감지
- ✅ 서버 재시작 시 자동 재스케줄

---

## 🚀 설치 (최초 1회만)

### 테이블 생성

```bash
psql -U postgres -d cms_db -f scripts/database/personnel-backup/01-create-personnel-backup-table.sql
```

또는 Sequelize 마이그레이션:

```bash
cp scripts/database/personnel-backup/03-sequelize-migration.js src/migrations/$(date +%Y%m%d%H%M%S)-create-personnel-backup.js
npx sequelize-cli db:migrate
```

**설정 완료!** 이제 서버 시작만 하면 자동으로 백업됩니다.

---

## 📅 자동 백업 동작

### 서버 시작 시
```
🚀 API 서버가 포트 3002에서 실행 중입니다.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Personnel 자동 백업 스케줄러 시작
⏰ 다음 백업 예정: 2024. 11. 19. 오전 12:00:00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 자정이 되면
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Personnel 자동 백업 시작...
✅ 백업 완료! 45명
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 수동 백업 (선택사항)

긴급하게 즉시 백업이 필요한 경우:

```bash
psql -U postgres -d cms_db -f scripts/database/personnel-backup/02-insert-backup-data.sql
```

---

## 📊 사용 예시

### 1. 특정 날짜 백업 데이터 조회

```sql
-- 2024년 1월 1일 기준 인력 현황
SELECT * 
FROM personnel_backup 
WHERE backup_date = '2024-01-01'
ORDER BY department, name;
```

### 2. 기간별 인원 증감 분석

프론트엔드에서 **조회 일자 선택**:
- 날짜 입력창에서 원하는 날짜 선택 (예: 2024-01-01)
- 해당 날짜의 백업 데이터 자동 조회
- 현재 데이터와 비교 가능

```sql
-- SQL로 직접 비교
WITH jan_data AS (
  SELECT department, COUNT(*) as count
  FROM personnel_backup
  WHERE backup_date = '2024-01-01'
  GROUP BY department
),
current_data AS (
  SELECT department, COUNT(*) as count
  FROM personnel
  WHERE is_active = TRUE
  GROUP BY department
)
SELECT 
  COALESCE(j.department, c.department) as department,
  COALESCE(j.count, 0) as jan_count,
  COALESCE(c.count, 0) as current_count,
  COALESCE(c.count, 0) - COALESCE(j.count, 0) as change
FROM jan_data j
FULL OUTER JOIN current_data c ON j.department = c.department
ORDER BY department;
```

### 3. 백업 이력 조회

```sql
-- 전체 백업 이력
SELECT 
  backup_date,
  COUNT(*) as personnel_count
FROM personnel_backup
GROUP BY backup_date
ORDER BY backup_date DESC;
```

---

## 🔍 테이블 구조

### 주요 컬럼

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | INTEGER | 백업 레코드 고유 ID |
| `backup_date` | DATE | 백업 일자 (인덱스) |
| `original_id` | INTEGER | 원본 personnel 테이블의 id |
| `department` | VARCHAR(100) | 부서 |
| `name` | VARCHAR(100) | 성명 |
| ... | ... | (personnel 테이블과 동일) |

### 인덱스

- `idx_personnel_backup_date`: 백업 일자
- `idx_personnel_backup_original_id`: 원본 ID
- `idx_personnel_backup_department`: 부서
- `idx_personnel_backup_employee_number`: 사번
- `idx_personnel_backup_date_resignation`: 백업일자 + 퇴사일 (복합)

---

## 🗄️ 데이터 관리

### 오래된 백업 삭제

```sql
-- 1년 이전 백업 삭제
DELETE FROM personnel_backup 
WHERE backup_date < CURRENT_DATE - INTERVAL '1 year';
```

### 백업 검증

```sql
-- 오늘 백업 확인
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
| `02-insert-backup-data.sql` | 수동 백업 SQL (긴급용) |
| `03-sequelize-migration.js` | Sequelize 마이그레이션 파일 |
| `05-useful-queries.sql` | 유용한 분석 쿼리 모음 |
| `README.md` | 이 문서 |

---

## 📊 분석 쿼리

더 많은 분석 쿼리는 `05-useful-queries.sql` 파일을 참고하세요:
- 월별 인원 추이
- 부서별 증감 통계
- 특정 인원 이력 추적
- 데이터 품질 체크
- 평균 재직 기간 추이
- 연령대별 분포

---

## ⚠️ 참고사항

### 백업 주기
- **기본**: 매일 자정 (00:00)
- **서버 재시작**: 자동으로 다음 자정까지 재스케줄

### 백업 위치
- 서버 코드: `server.js` (5245번 줄부터)
- 함수: `autoBackupPersonnel()`, `schedulePersonnelBackup()`

### 백업 테이블이 없으면?
- ⚠️ 경고 메시지만 출력하고 서버 정상 작동
- 💡 `01-create-personnel-backup-table.sql` 실행 필요

---

## 🆘 문제 해결

### Q1. 백업이 안 되는 것 같아요
**A**: 서버 로그 확인
```bash
# 서버 로그에서 백업 메시지 확인
# "📦 Personnel 자동 백업 시작..." 또는
# "⚠️ 백업이 이미 존재합니다" 메시지 확인
```

### Q2. 수동으로 즉시 백업하고 싶어요
**A**: SQL 직접 실행
```bash
psql -U postgres -d cms_db -f scripts/database/personnel-backup/02-insert-backup-data.sql
```

### Q3. 백업 시간을 변경하고 싶어요
**A**: `server.js`의 `schedulePersonnelBackup()` 함수 수정
```javascript
// 예: 매일 새벽 3시로 변경
const night = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate() + 1,
  3, 0, 0  // 3시 0분 0초
);
```

---

## 🎯 요약

1. ✅ **테이블 생성** (최초 1회)
   ```bash
   psql -U postgres -d cms_db -f scripts/database/personnel-backup/01-create-personnel-backup-table.sql
   ```

2. ✅ **서버 시작** (이후 자동)
   ```bash
   npm run start:prod
   ```

3. ✅ **완료!** 매일 자정 자동 백업

---

**마지막 업데이트**: 2024-11-18
**버전**: v2.0 (자동 백업 통합)
