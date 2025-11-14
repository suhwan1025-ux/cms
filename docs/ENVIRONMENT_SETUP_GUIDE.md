# 환경 설정 가이드

## 📋 환경변수 파일 구조

### 파일 목록

| 파일 | 용도 | Git 관리 |
|------|------|----------|
| **env.development** | 개발 환경 템플릿 | ✅ Yes |
| **env.production** | 운영 환경 템플릿 | ✅ Yes |
| **env.example** | 전체 템플릿 (참고용) | ✅ Yes |
| **.env** | 실제 사용 파일 | ❌ No (gitignore) |
| **.env.local** | ~~사용 안 함~~ | ❌ No |

---

## 🔧 설정 방법

### 개발 환경 (Development)

```bash
# env.development를 .env로 복사
cp env.development .env

# 필요 시 개인 설정 수정
# - DB 비밀번호
# - API URL 등
```

**개발 환경 특징:**
- **서버**: 172.22.32.200
- **프론트엔드 포트**: 3001 (개발 서버)
- **백엔드 포트**: 3002 (API 서버)
- **내부 DB**: 172.22.32.200:5432
- **외부 DB**: 비활성화 (하드코딩된 기본 부서 목록 사용)
- **소스맵**: 활성화
- **접속**: http://172.22.32.200:3001

---

### 운영 환경 (Production)

```bash
# env.production을 .env로 복사
cp env.production .env

# 실제 값으로 수정 필요
nano .env
```

**필수 수정 항목:**
```bash
# 1. 내부 DB 정보
DB_HOST=실제_DB_서버_IP
DB_PASSWORD=실제_비밀번호

# 2. 외부 DB 정보 (조직도 연동)
EXTERNAL_DB_ENABLED=true
EXTERNAL_DB_HOST=실제_외부_DB_IP
EXTERNAL_DB_NAME=실제_DB_이름
EXTERNAL_DB_USERNAME=실제_사용자
EXTERNAL_DB_PASSWORD=실제_비밀번호

# 3. 테이블/컬럼명 (실제 구조에 맞게)
EXTERNAL_DEPT_TABLE=실제_테이블명
EXTERNAL_DEPT_CODE_COLUMN=실제_컬럼명
EXTERNAL_DEPT_NAME_COLUMN=실제_컬럼명
```

**운영 환경 특징:**
- **서버**: 172.17.162.163
- **통합 포트**: 9331 (프론트엔드 + 백엔드)
- **내부 DB**: 172.17.162.163:5432
- **외부 DB**: 활성화 (실제 조직도 DB 연동)
- **소스맵**: 비활성화 (보안)
- **접속**: http://172.17.162.163:9331

---

## 🗄️ 데이터베이스 구조

### 1. 내부 DB (계약관리시스템)
- **용도**: 품의서, 계약, 예산 등 저장
- **환경변수**: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`
- **필수**: ✅

### 2. 외부 DB (조직도 연동)
- **용도**: 부서 정보 조회
- **환경변수**: `EXTERNAL_DB_*`
- **필수**: 운영 환경에서만
- **개발 환경**: 비활성화 시 하드코딩된 기본 부서 목록 사용

---

## 🔍 외부 DB 연동 (Oracle)

### Oracle DB 설정

외부 조직도 DB가 Oracle인 경우:

```bash
# Oracle 연결 설정
EXTERNAL_DB_ENABLED=true
EXTERNAL_DB_HOST=oracle_server_ip
EXTERNAL_DB_PORT=1521                    # Oracle 기본 포트
EXTERNAL_DB_NAME=ORCL                    # SID 또는 Service Name
EXTERNAL_DB_USERNAME=hr_user
EXTERNAL_DB_PASSWORD=password
EXTERNAL_DB_DIALECT=oracle               # 중요!
```

### 테이블 구조 예시

외부 조직도 DB가 다음과 같은 구조라면:

```sql
CREATE TABLE org_departments (
    department_code VARCHAR2(20),
    department_name VARCHAR2(100),
    parent_department VARCHAR2(20),
    active_status NUMBER(1)               -- Oracle: BOOLEAN 대신 NUMBER
);
```

`.env` 파일 설정:
```bash
EXTERNAL_DEPT_TABLE=org_departments
EXTERNAL_DEPT_CODE_COLUMN=department_code
EXTERNAL_DEPT_NAME_COLUMN=department_name
EXTERNAL_DEPT_PARENT_COLUMN=parent_department
EXTERNAL_DEPT_ACTIVE_COLUMN=active_status
```

---

## ⚙️ 환경변수 우선순위

```
.env 파일 → 환경변수 → 기본값
```

**예시:**
```javascript
const PORT = process.env.PORT || 3002;
//            ↑ .env 파일     ↑ 기본값
```

---

## 🚀 배포 시 체크리스트

### 폐쇄망 배포 전

- [ ] `env.production`을 `.env`로 복사
- [ ] 내부 DB 정보 수정 (HOST, PASSWORD)
- [ ] 외부 DB 정보 수정 (모든 EXTERNAL_DB_* 항목)
- [ ] 테이블/컬럼명 확인 (실제 스키마와 일치 여부)
- [ ] `EXTERNAL_DB_ENABLED=true` 설정
- [ ] 포트 설정 확인 (방화벽과 일치)
- [ ] `NODE_ENV=production` 확인

### 배포 후 확인

```bash
# 서버 시작
node server.js

# 로그 확인
# ✅ 외부 DB 연결 설정 완료
# ✅ 외부 DB에서 N개의 부서 정보를 가져왔습니다.
```

---

## ❌ .env.local 파일

**삭제 권장**
- 현재 사용하지 않음
- `env.development` 또는 `env.production` 사용

---

## 📞 문의

환경 설정 관련 문제 발생 시:
1. `docs/EXTERNAL_DB_SETUP.md` 참조
2. IT 부서 문의

