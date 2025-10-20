# 사업예산 확정집행액 실시간 계산 가이드

## 📋 개요
사업예산의 `confirmed_execution_amount`(확정집행액)는 **JOIN 방식으로 실시간 계산**됩니다.

## 🔄 실시간 계산 로직 (JOIN 방식)

### 핵심 원리
- ✅ **별도 동기화 불필요** - 조회 시마다 최신 데이터 자동 계산
- ✅ **데이터 정합성 보장** - Single Source of Truth
- ✅ **유지보수 간편** - 동기화 버그 위험 없음

### 실시간 계산 쿼리
```sql
SELECT 
  bb.*,
  COALESCE(
    SUM(CASE WHEN p.status = 'approved' THEN p.total_amount ELSE 0 END), 
    0
  ) as confirmed_execution_amount
FROM business_budgets bb
LEFT JOIN proposals p ON p.budget_id = bb.id
GROUP BY bb.id
```

### 적용 위치

#### 1. 사업예산 통계 조회 (GET /api/budget-statistics)
- 모든 사업예산 데이터를 조회할 때 확정집행액을 실시간 계산
- 위치: server.js 라인 78-176

#### 2. 사업예산 목록 조회 (GET /api/business-budgets)
- 필터링된 사업예산 목록 조회 시에도 확정집행액 실시간 계산
- 위치: server.js 라인 216-260

## 📊 계산 로직

### confirmed_execution_amount 산출
```sql
-- 품의서 테이블과 JOIN하여 실시간 계산
confirmed_execution_amount = COALESCE(
  SUM(CASE WHEN proposals.status = 'approved' 
           THEN proposals.total_amount 
           ELSE 0 
      END),
  0
)
WHERE proposals.budget_id = business_budgets.id
GROUP BY business_budgets.id
```

### 특징
- ✅ **항상 최신 데이터** - 조회 시마다 계산
- ✅ **동기화 불필요** - 품의서 변경이 즉시 반영됨
- ✅ **정합성 보장** - 단일 데이터 소스

## 🎯 품의서 상태 매핑

| 화면 표시 | DB 값 | 확정집행액 반영 |
|---------|-------|---------------|
| 품의서 작성 | draft | ❌ |
| 검토중 | submitted | ❌ |
| 승인대기 | submitted | ❌ |
| 예가산정 | submitted | ❌ |
| 입찰실시 | submitted | ❌ |
| 보고 품의 | submitted | ❌ |
| **결재완료** | **approved** | **✅** |
| **승인됨** | **approved** | **✅** |
| **계약체결** | **approved** | **✅** |
| **계약완료** | **approved** | **✅** |
| 반려 | rejected | ❌ |

## 🔍 확인 방법

### 1. API를 통한 확인 (권장)
```bash
# 사업예산 통계 조회 - 확정집행액이 실시간으로 계산됨
curl http://localhost:3002/api/budget-statistics
```

### 2. 데이터베이스에서 직접 확인
```sql
-- 사업예산별 품의 완료 금액 확인 (API와 동일한 로직)
SELECT 
  bb.id,
  bb.project_name,
  COALESCE(SUM(CASE WHEN p.status = 'approved' THEN p.total_amount ELSE 0 END), 0) as confirmed_execution_amount,
  COUNT(CASE WHEN p.status = 'approved' THEN p.id ELSE NULL END) as approved_proposal_count
FROM business_budgets bb
LEFT JOIN proposals p ON p.budget_id = bb.id
GROUP BY bb.id, bb.project_name
ORDER BY bb.id;
```

### 3. 프론트엔드에서 확인
- **사업예산 대시보드**: http://localhost:3001/budget-dashboard
- **사업예산 등록**: http://localhost:3001/budget-registration

## 🚀 성능 최적화

### 인덱스
JOIN 성능 향상을 위해 다음 인덱스가 자동 생성됩니다:
```sql
CREATE INDEX idx_proposals_budget_status ON proposals(budget_id, status);
```

### 성능 특징
- ✅ **빠른 조회** - 인덱스를 활용한 효율적인 JOIN
- ✅ **확장성** - 품의서 수천 건까지도 빠른 조회
- ✅ **캐싱 불필요** - PostgreSQL의 쿼리 캐시 자동 활용

## ⚠️ 주의사항

1. **실시간 계산**
   - 조회할 때마다 계산되므로 항상 최신 데이터
   - 별도 동기화나 업데이트 로직 불필요

2. **데이터 정합성**
   - 품의서 테이블이 Single Source of Truth
   - 수동 DB 변경 시에도 자동 반영
   - 불일치 위험 제로

3. **confirmed_execution_amount 컬럼**
   - DB에는 컬럼이 존재하지만 사용하지 않음
   - 향후 제거 가능 (하위 호환성을 위해 유지)
   - 모든 값은 JOIN으로 실시간 계산

## 📝 변경 이력
- 2025-10-10 (v2): **JOIN 방식으로 전환** - 실시간 계산으로 변경, 동기화 로직 제거
- 2025-10-10 (v1): ~~UPDATE 방식 구현~~ (폐기)
- 목표: 사업예산의 확정집행액이 항상 품의완료된 금액과 정확히 일치하도록 보장

## 🎯 왜 JOIN 방식인가?

### UPDATE 방식의 문제점 (폐기)
- ❌ 동기화 로직이 복잡함
- ❌ 동기화 누락 위험
- ❌ 데이터 불일치 가능성
- ❌ 디버깅 어려움

### JOIN 방식의 장점 (현재)
- ✅ **항상 정확** - 단일 데이터 소스
- ✅ **로직 단순** - 동기화 불필요
- ✅ **유지보수 쉬움** - 버그 위험 최소화
- ✅ **실시간 반영** - 즉시 최신 데이터
- ✅ **성능 우수** - 인덱스로 최적화

