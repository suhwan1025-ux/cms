# 🤔 개발 환경에서는 작동하는데 운영에서만 안 되는 이유

## 현재 상황

- ✅ **개발 환경**: `field: 'original_proposal_id'` 있어도 정상 작동
- ❌ **운영 환경**: `column Proposal.originalProposalId does not exist` 에러

## 🔍 가능한 원인

### 1️⃣ **Sequelize 버전 차이** (가능성 높음)

#### 개발 환경
```json
{
  "sequelize": "^6.x.x"  // 예: 6.35.0
}
```

#### 운영 환경
```json
{
  "sequelize": "^6.y.y"  // 예: 6.28.0 (더 낮은 버전)
}
```

**Sequelize 6.x의 버전별로 `underscored: true` + `field` 속성 처리가 다를 수 있습니다.**

---

### 2️⃣ **Node.js 버전 차이**

- 개발: Node.js 18.x
- 운영: Node.js 16.x 또는 14.x

**Node.js 버전에 따라 Sequelize 내부 동작이 미묘하게 다를 수 있습니다.**

---

### 3️⃣ **npm install 시점 차이**

#### 개발 환경
```bash
# 최근에 npm install 실행
npm install  # 최신 패치 버전 설치됨
```

#### 운영 환경
```bash
# 오래 전에 npm install 실행 후 그대로 사용 중
# package-lock.json의 버전 사용
```

**같은 `^6.35.0`이어도 실제 설치된 패치 버전이 다를 수 있습니다:**
- 개발: `6.35.2` (최신)
- 운영: `6.35.0` (구버전)

---

### 4️⃣ **캐시 또는 모듈 로딩 차이**

개발 환경에서는:
- 자주 재시작하면서 캐시가 깨끗함
- 또는 우연히 다른 코드 경로를 통해 우회

운영 환경에서는:
- 오랫동안 실행 중
- require() 캐시가 쌓임
- 다른 코드 경로 실행

---

## 🧪 확인 방법

### **개발 환경과 운영 환경 비교**

```bash
# 개발 환경 (Windows)
node --version
npm list sequelize

# 운영 환경 (Linux)
node --version
npm list sequelize
```

### **Sequelize 버전 상세 확인**

```javascript
// 임시 스크립트
const { Sequelize } = require('sequelize');
console.log('Sequelize 버전:', Sequelize.version);
```

```bash
# 개발
node -e "console.log(require('sequelize').version)"

# 운영
node -e "console.log(require('sequelize').version)"
```

---

## 💡 왜 개발에서는 작동할까?

### **가능성 1: Sequelize 최신 버전**

Sequelize 6.35.x 이상에서는 `field` + `underscored`의 우선순위 처리가 개선되어:
- `field`가 있으면 그것을 우선 사용
- `underscored`는 보조적으로 사용
- **충돌하지 않음**

### **가능성 2: 우연히 작동하는 코드 경로**

개발 환경에서는:
- 특정 조건에서만 작동
- 예: `raw: true` 쿼리 사용
- 예: 직접 SQL 사용

운영 환경에서는:
- 다른 코드 경로 실행
- 예: include 옵션 사용
- 예: Sequelize ORM 메서드 사용

### **가능성 3: 개발 DB vs 운영 DB 차이**

개발 DB:
- 테이블이 최근에 생성됨
- 컬럼 순서나 제약조건이 다름

운영 DB:
- 오래된 테이블
- 다른 인덱스나 제약조건

---

## 🎯 그렇다면 어떻게 해야 할까?

### **옵션 1: 그대로 두기** (개발은 작동 중)

**장점**:
- 개발 환경 건드리지 않음
- 이미 작동 중인 것 유지

**단점**:
- 운영 환경에서 계속 문제
- 불일치 지속

### **옵션 2: 양쪽 다 수정** (권장) ⭐

**`field` 속성 제거 → 일관성 확보**

```javascript
// 양쪽 모두
originalProposalId: {
  type: DataTypes.INTEGER,
  allowNull: true,
  // field: 'original_proposal_id',  // 제거
  comment: '원본 품의서 ID (정정된 경우)'
}
```

**장점**:
- 개발과 운영이 동일한 코드
- `underscored: true` 하나로 통일
- 향후 문제 예방

**단점**:
- 개발 환경도 테스트 필요

### **옵션 3: 운영만 수정** (임시 방편)

운영 환경의 `src/models/Proposal.js`만 수정

**장점**:
- 빠른 해결

**단점**:
- 개발과 운영 코드 불일치
- 배포 시 덮어써질 위험

---

## 🔧 안전한 해결 방법

### **1단계: 개발 환경에서 테스트**

방금 수정한 코드로 개발 환경에서 테스트:

```bash
# Windows 개발 환경
# 서버 재시작
# Ctrl+C로 서버 종료 후
npm start

# 테스트
# 1. 정정 품의서 생성
# 2. 정정 품의서 조회
# 3. DB 확인
```

### **2단계: 문제 없으면 커밋**

```bash
git add src/models/Proposal.js
git commit -m "fix: Remove field attribute for Sequelize underscored compatibility"
git push origin main
```

### **3단계: 운영 배포**

```bash
# 운영 서버
cd /path/to/CMS_NEW
git pull origin main
pm2 restart server
```

---

## 🤓 기술적 설명

### **Sequelize의 field 처리 로직**

```javascript
// Sequelize 내부 (개념적)
function getColumnName(attribute) {
  if (attribute.field) {
    // field가 명시되어 있으면 그것 사용
    return attribute.field;
  } else if (this.options.underscored) {
    // underscored가 true면 camelCase를 snake_case로 변환
    return toSnakeCase(attribute.fieldName);
  } else {
    // 그대로 사용
    return attribute.fieldName;
  }
}
```

**문제**:
- Sequelize 버전에 따라 이 로직이 미묘하게 다름
- 특정 버전에서는 `field`가 있어도 `underscored`를 적용하려고 시도
- 충돌 발생!

### **해결책**:
```javascript
// field 제거 → underscored만 사용
// 명확하고 일관된 동작
```

---

## 📊 결론

### **왜 개발에서는 작동?**
- Sequelize 버전이 더 최신이거나
- 우연히 작동하는 코드 경로이거나
- Node.js 버전 차이

### **권장 조치**
1. ✅ **`field` 속성 제거** (이미 수정함)
2. ✅ **개발 환경에서 테스트**
3. ✅ **문제 없으면 운영 배포**

**이유**: 
- 개발과 운영의 일관성
- 향후 Sequelize 업그레이드 시 안전
- 명확한 코드 (한 가지 방법만 사용)

---

## ⚠️ 롤백이 필요하다면

만약 개발 환경에서 문제가 생긴다면:

```bash
git checkout HEAD~1 src/models/Proposal.js
```

또는 수동으로:
```javascript
// field 다시 추가
field: 'original_proposal_id',
```

하지만 **99% 확률로 문제 없을 것**입니다!
`underscored: true`가 정확히 같은 역할을 하기 때문입니다.

