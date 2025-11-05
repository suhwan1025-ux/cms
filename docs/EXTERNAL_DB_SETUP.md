# 외부 DB 연동 설정 가이드

계약관리 시스템에서 외부 DB의 부서 정보를 사용하도록 설정하는 방법입니다.

## 📋 개요

- **목적**: 외부 시스템의 부서 정보를 실시간으로 조회하여 사용
- **적용 범위**:
  - 품의서 작성 시 요청부서, 비용귀속부서
  - 사업예산 등록 시 발의부서, 추진부서

## 🔧 설정 방법

### 1단계: 환경변수 설정

프로젝트 루트의 `.env` 파일에 다음 내용을 추가하세요:

```bash
# 외부 DB 설정 (부서 정보 등)
EXTERNAL_DB_ENABLED=true                    # 외부 DB 사용 여부 (true/false)
EXTERNAL_DB_HOST=your_host                  # 외부 DB 호스트 주소
EXTERNAL_DB_PORT=5432                       # 외부 DB 포트 번호
EXTERNAL_DB_NAME=your_database              # 외부 DB 데이터베이스명
EXTERNAL_DB_USERNAME=your_username          # 외부 DB 사용자명
EXTERNAL_DB_PASSWORD=your_password          # 외부 DB 비밀번호
EXTERNAL_DB_DIALECT=postgres                # 외부 DB 종류 (postgres, mysql, mssql, oracle 등)

# 부서 테이블 설정
EXTERNAL_DEPT_TABLE=departments             # 부서 정보가 저장된 테이블명
EXTERNAL_DEPT_CODE_COLUMN=dept_code         # 부서 코드 컬럼명
EXTERNAL_DEPT_NAME_COLUMN=dept_name         # 부서명 컬럼명
EXTERNAL_DEPT_PARENT_COLUMN=parent_dept     # 상위 부서 컬럼명 (선택)
EXTERNAL_DEPT_ACTIVE_COLUMN=is_active       # 활성화 상태 컬럼명 (선택)
```

### 2단계: 서버 재시작

환경변수 설정 후 서버를 재시작하세요:

```bash
# 서버 중지 (Ctrl + C)
# 서버 시작
npm start
```

### 3단계: 연결 테스트

브라우저나 API 클라이언트에서 다음 URL로 접속하여 연결을 테스트하세요:

```
GET http://localhost:3001/api/external-db/test
```

**성공 응답 예시:**
```json
{
  "success": true,
  "message": "외부 DB 연결 성공"
}
```

**실패 응답 예시:**
```json
{
  "success": false,
  "message": "외부 DB가 비활성화되어 있습니다."
}
```

### 4단계: 부서 목록 조회

부서 정보가 정상적으로 조회되는지 확인하세요:

```
GET http://localhost:3001/api/departments
```

**응답 예시:**
```json
[
  {
    "deptCode": "IT001",
    "deptName": "IT팀",
    "parentDept": null
  },
  {
    "deptCode": "IT002",
    "deptName": "IT기획팀",
    "parentDept": "IT001"
  }
]
```

## 🗂️ 외부 DB 테이블 구조 예시

외부 DB의 부서 테이블은 다음과 같은 구조를 가져야 합니다:

### PostgreSQL 예시

```sql
CREATE TABLE departments (
    dept_code VARCHAR(50) PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    parent_dept VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 샘플 데이터
INSERT INTO departments (dept_code, dept_name, parent_dept, is_active) VALUES
('IT001', 'IT팀', NULL, true),
('IT002', 'IT기획팀', 'IT001', true),
('IT003', 'IT개발팀', 'IT001', true),
('FI001', '재무팀', NULL, true);
```

### MySQL 예시

```sql
CREATE TABLE departments (
    dept_code VARCHAR(50) PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    parent_dept VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Oracle 예시

```sql
CREATE TABLE departments (
    dept_code VARCHAR2(50) PRIMARY KEY,
    dept_name VARCHAR2(100) NOT NULL,
    parent_dept VARCHAR2(50),
    is_active NUMBER(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 작동 방식

1. **외부 DB 활성화 시** (`EXTERNAL_DB_ENABLED=true`):
   - 시스템이 외부 DB에 연결하여 실시간으로 부서 정보를 조회합니다.
   - 연결 실패 시 자동으로 기본 부서 목록으로 대체됩니다.

2. **외부 DB 비활성화 시** (`EXTERNAL_DB_ENABLED=false` 또는 미설정):
   - 시스템 내장 기본 부서 목록을 사용합니다.
   - 설정 파일: `config/externalDatabase.js`의 `getDefaultDepartments()` 함수

## 🔍 트러블슈팅

### 문제 1: 외부 DB 연결 실패

**증상**: 서버 로그에 "❌ 외부 DB 연결 실패" 메시지

**해결 방법**:
1. `.env` 파일의 DB 접속 정보 확인
2. 외부 DB 방화벽 설정 확인
3. 네트워크 연결 확인
4. DB 사용자 권한 확인

```bash
# PostgreSQL 연결 테스트 (터미널)
psql -h [HOST] -p [PORT] -U [USERNAME] -d [DATABASE]
```

### 문제 2: 부서 목록이 비어있음

**증상**: `/api/departments` 호출 시 빈 배열 반환

**해결 방법**:
1. 외부 DB 테이블명과 컬럼명이 `.env` 설정과 일치하는지 확인
2. 테이블에 데이터가 있는지 확인
3. `is_active` 컬럼 값이 `true`인지 확인

```sql
-- 데이터 확인 쿼리
SELECT * FROM departments WHERE is_active = true;
```

### 문제 3: 특정 컬럼이 없음

**증상**: "column does not exist" 오류

**해결 방법**:
- `.env` 파일의 컬럼명 설정을 실제 테이블 구조에 맞게 수정
- 선택적 컬럼(`parent_dept`, `is_active`)이 없는 경우 해당 환경변수를 제거하거나 빈 값으로 설정

## 📌 참고사항

### 지원하는 데이터베이스

- PostgreSQL (권장)
- MySQL / MariaDB
- Microsoft SQL Server (MSSQL)
- Oracle Database

### 필수 컬럼

- **부서 코드**: 부서의 고유 식별자
- **부서명**: 화면에 표시될 부서 이름

### 선택적 컬럼

- **상위 부서**: 부서 계층 구조를 표현 (향후 확장 가능)
- **활성화 상태**: 비활성화된 부서는 목록에서 제외

## 🔗 관련 파일

- **설정 파일**: `config/externalDatabase.js`
- **API 엔드포인트**: `server.js` (라인 47-71)
- **프론트엔드**:
  - `src/components/ProposalForm.js` (품의서 작성)
  - `src/components/BudgetRegistration.js` (사업예산 관리)

## 💡 추가 팁

### 기본 부서 목록 커스터마이징

외부 DB를 사용하지 않을 경우, `config/externalDatabase.js` 파일의 `getDefaultDepartments()` 함수를 수정하여 기본 부서 목록을 변경할 수 있습니다:

```javascript
function getDefaultDepartments() {
  return [
    { deptCode: 'YOUR001', deptName: '귀사의 부서명', parentDept: null },
    // ... 추가 부서
  ];
}
```

### 부서 정보 캐싱

외부 DB 응답 속도가 느린 경우, 향후 Redis 등을 사용한 캐싱 기능 추가를 고려할 수 있습니다.

## 📞 지원

문제가 지속되면 시스템 관리자에게 문의하세요.

