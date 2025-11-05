# 계약관리시스템(CMS) 데이터베이스 설치 스크립트

폐쇄망 환경에서 PostgreSQL 데이터베이스를 처음부터 구축하기 위한 SQL 스크립트 모음입니다.

## 📁 파일 구조

```
sql/dba_setup/
├── README.md                       # 이 파일
├── 00_run_all.sql                  # 전체 통합 실행 스크립트
├── 01_create_database.sql          # DB 및 사용자 생성
├── 02_create_tables.sql            # 테이블 생성 (26개)
├── 03_create_foreign_keys.sql      # 외래키 제약조건
├── 04_create_indexes.sql           # 인덱스 생성
├── 05_insert_master_data.sql       # 초기 마스터 데이터
└── 06_verification_queries.sql     # 검증 쿼리
```

## 🚀 빠른 시작

### 방법 1: 전체 통합 실행 (권장)

```bash
# postgres 사용자로 실행
psql -U postgres -f 00_run_all.sql
```

### 방법 2: 단계별 실행

```bash
# 1단계: 데이터베이스 및 사용자 생성
psql -U postgres -f 01_create_database.sql

# 2단계: 테이블 생성
psql -U cms_admin -d contract_management -f 02_create_tables.sql

# 3단계: 외래키 제약조건
psql -U cms_admin -d contract_management -f 03_create_foreign_keys.sql

# 4단계: 인덱스 생성
psql -U cms_admin -d contract_management -f 04_create_indexes.sql

# 5단계: 초기 데이터 삽입
psql -U cms_admin -d contract_management -f 05_insert_master_data.sql

# 6단계: 검증
psql -U cms_admin -d contract_management -f 06_verification_queries.sql
```

## 📋 사전 준비사항

### 1. PostgreSQL 설치
- PostgreSQL 12.x 이상 (권장: 14.x)
- 서비스가 실행 중이어야 함

```bash
# 서비스 상태 확인 (Linux)
sudo systemctl status postgresql-14

# 서비스 시작
sudo systemctl start postgresql-14

# Windows
Get-Service postgresql-x64-14
Start-Service postgresql-x64-14
```

### 2. 비밀번호 설정
`01_create_database.sql` 파일을 열어 비밀번호를 변경하세요:

```sql
-- 파일의 3-4번째 줄
CREATE USER cms_admin WITH PASSWORD 'CHANGE_THIS_PASSWORD';
CREATE USER cms_reader WITH PASSWORD 'CHANGE_THIS_READONLY_PASSWORD';
```

## 🔧 스크립트 설명

### 01_create_database.sql
- **목적**: 데이터베이스 및 사용자 계정 생성
- **생성 항목**:
  - 데이터베이스: `contract_management`
  - 관리자 계정: `cms_admin` (전체 권한)
  - 읽기 전용 계정: `cms_reader` (SELECT만)

### 02_create_tables.sql
- **목적**: 전체 테이블 스키마 생성
- **생성 테이블**: 26개
  - 핵심: proposals, purchase_items, service_items
  - 예산: budgets, business_budgets
  - 결재: approval_lines, approval_rules
  - 기준정보: departments, suppliers, contract_methods
  - 이력: proposal_histories, business_budget_history

### 03_create_foreign_keys.sql
- **목적**: 테이블 간 참조 무결성 보장
- **외래키 동작**:
  - CASCADE: 부모 삭제 시 자식도 삭제
  - SET NULL: 부모 삭제 시 자식은 NULL
  - RESTRICT: 자식이 있으면 부모 삭제 불가

### 04_create_indexes.sql
- **목적**: 조회 성능 최적화
- **인덱스 종류**:
  - PRIMARY KEY: 모든 테이블의 id
  - UNIQUE: 중복 방지 필드
  - INDEX: 검색 빈도가 높은 필드
  - 복합 인덱스: 여러 필드 조합

### 05_insert_master_data.sql
- **목적**: 시스템 운영에 필요한 기본 데이터 삽입
- **포함 데이터**:
  - 부서: 6개 (샘플)
  - 계약방식: 10개 (법령 기준)
  - 결재자: 4개 (샘플)
  - 결재규칙: 3개 (금액별)
  - 예산: 3개 (샘플)
  - 공급업체: 5개 (샘플)
  - 사업목적: 10개 (2025년)

### 06_verification_queries.sql
- **목적**: 설치 완료 후 검증
- **검증 항목**:
  - 테이블 생성 여부 (26개)
  - 외래키 제약조건
  - 인덱스 생성 여부
  - 마스터 데이터 삽입 확인
  - 데이터 무결성 (고아 레코드)

## ⚠️ 주의사항

### 실행 순서 준수
- 반드시 01 → 02 → 03 → 04 → 05 순서로 실행
- 순서를 지키지 않으면 외래키 오류 발생

### 비밀번호 보안
- 01_create_database.sql의 기본 비밀번호를 반드시 변경
- 강력한 비밀번호 사용 (영문+숫자+특수문자, 12자 이상)

### 기존 데이터베이스
- 동일한 이름의 데이터베이스가 있으면 에러 발생
- 재설치 시 기존 DB를 먼저 삭제:
  ```sql
  DROP DATABASE IF EXISTS contract_management;
  DROP USER IF EXISTS cms_admin;
  DROP USER IF EXISTS cms_reader;
  ```

### 문자셋 설정
- `ko_KR.UTF-8` Collation이 설치되어 있어야 함
- 없으면 `C` 또는 `en_US.UTF-8` 사용 가능

## 🔍 트러블슈팅

### 1. 권한 오류 발생
```
ERROR:  permission denied for schema public
```
**해결책**: postgres 사용자로 실행하거나 SUPERUSER 권한 부여

### 2. Collation 오류
```
ERROR:  collation "ko_KR.UTF-8" does not exist
```
**해결책**: 01_create_database.sql에서 `ko_KR.UTF-8`을 `C`로 변경

### 3. 외래키 오류
```
ERROR:  insert or update on table violates foreign key constraint
```
**해결책**: 02_create_tables.sql → 03_create_foreign_keys.sql 순서로 재실행

### 4. 연결 실패
```
psql: FATAL:  password authentication failed
```
**해결책**: pg_hba.conf에서 인증 방식 확인 (md5 또는 trust)

## 📊 설치 후 확인

### 1. 테이블 수 확인
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- 예상 결과: 26개 (SequelizeMeta 포함 시 27개)
```

### 2. 외래키 확인
```sql
SELECT COUNT(*) FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
-- 예상 결과: 20개 이상
```

### 3. 마스터 데이터 확인
```sql
SELECT 
    (SELECT COUNT(*) FROM departments) AS departments,
    (SELECT COUNT(*) FROM contract_methods) AS contract_methods,
    (SELECT COUNT(*) FROM approval_approvers) AS approval_approvers;
-- 예상 결과: 6, 10, 4
```

## 📞 지원

문제 발생 시 다음 정보를 포함하여 문의:
1. PostgreSQL 버전
2. 운영체제 및 버전
3. 실행한 명령어
4. 에러 메시지 전체
5. 06_verification_queries.sql 실행 결과

## 📚 관련 문서

- [DBA_DATABASE_SETUP_GUIDE.md](../../docs/DBA_DATABASE_SETUP_GUIDE.md) - 상세 설치 가이드
- [DATABASE_SCHEMA.md](../../docs/DATABASE_SCHEMA.md) - 스키마 설명
- [DATABASE_ER_DIAGRAM.md](../../docs/DATABASE_ER_DIAGRAM.md) - ER 다이어그램

---

**버전**: 1.0  
**최종 업데이트**: 2025-11-05  
**작성자**: CMS 개발팀

