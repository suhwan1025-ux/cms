"""
데이터베이스 스키마 정보
Text-to-SQL을 위한 스키마 메타데이터
"""

DB_SCHEMA = """
# 계약 관리 시스템(CMS) 데이터베이스 스키마

## 1. proposals (품의서) - 25개 컬럼
- id: 품의서 ID (PRIMARY KEY)
- contract_type: 계약 유형 (물품구매, 용역, 기타)
- title: 제목
- purpose: 목적
- basis: 근거
- budget_id: 예산 ID (FOREIGN KEY)
- contract_method: 계약 방식 (수의계약, 경쟁입찰 등)
- contract_method_id: 계약 방식 ID
- account_subject: 계정 과목
- total_amount: 총액 (숫자)
- contract_period: 계약 기간
- contract_start_date: 계약 시작일 (DATE)
- contract_end_date: 계약 종료일 (DATE)
- payment_method: 지급 방법
- status: 상태 (draft, pending, approved, rejected)
- created_by: 작성자
- proposal_date: 품의 날짜 (DATE)
- approval_date: 승인 날짜 (DATE)
- created_at: 생성일시 (TIMESTAMP)
- updated_at: 수정일시 (TIMESTAMP)

## 2. business_budgets (사업예산) - 24개 컬럼
- id: 예산 ID (PRIMARY KEY)
- project_name: 프로젝트명
- initiator_department: 기안 부서
- executor_department: 집행 부서
- budget_type: 예산 유형
- budget_category: 예산 카테고리
- budget_amount: 예산 금액 (숫자)
- executed_amount: 집행 금액 (숫자)
- start_date: 시작일
- end_date: 종료일
- is_essential: 필수 여부 (BOOLEAN)
- project_purpose: 프로젝트 목적
- budget_year: 예산 연도 (INTEGER)
- status: 상태
- confirmed_execution_amount: 확정 집행 금액 (숫자)
- unexecuted_amount: 미집행 금액 (숫자)
- created_at: 생성일시 (TIMESTAMP)
- updated_at: 수정일시 (TIMESTAMP)

## 3. departments (부서) - 9개 컬럼
- id: 부서 ID (PRIMARY KEY)
- name: 부서명
- code: 부서 코드
- parent_id: 상위 부서 ID
- manager: 담당자
- description: 설명
- is_active: 활성 여부 (BOOLEAN)
- created_at: 생성일시
- updated_at: 수정일시

## 4. purchase_items (구매품목) - 16개 컬럼
- id: 구매품목 ID (PRIMARY KEY)
- proposal_id: 품의서 ID (FOREIGN KEY)
- supplier_id: 공급업체 ID
- item: 품목
- product_name: 제품명
- quantity: 수량 (INTEGER)
- unit_price: 단가 (숫자)
- amount: 금액 (숫자)
- supplier: 공급업체명
- request_department: 요청 부서
- contract_start_date: 계약 시작일
- contract_end_date: 계약 종료일
- created_at: 생성일시
- updated_at: 수정일시

## 5. service_items (용역) - 14개 컬럼
- id: 용역 ID (PRIMARY KEY)
- proposal_id: 품의서 ID (FOREIGN KEY)
- supplier_id: 공급업체 ID
- item: 항목
- name: 이름
- personnel: 인원 (INTEGER)
- skill_level: 기술 수준
- period: 기간 (개월, INTEGER)
- monthly_rate: 월 단가 (숫자)
- contract_amount: 계약 금액 (숫자)
- supplier: 공급업체명
- credit_rating: 신용등급
- created_at: 생성일시
- updated_at: 수정일시

## 6. suppliers (공급업체) - 14개 컬럼
- id: 공급업체 ID (PRIMARY KEY)
- name: 업체명
- business_number: 사업자번호
- representative: 대표자
- address: 주소
- phone: 전화번호
- email: 이메일
- credit_rating: 신용등급
- business_type: 업종
- registration_date: 등록일
- is_active: 활성 여부 (BOOLEAN)
- created_at: 생성일시
- updated_at: 수정일시

## 7. contract_methods (계약방식) - 9개 컬럼
- id: 계약방식 ID (PRIMARY KEY)
- code: 코드
- name: 명칭
- value: 값
- description: 설명
- basis: 근거
- is_active: 활성 여부 (BOOLEAN)
- created_at: 생성일시
- updated_at: 수정일시

## 8. contracts (계약) - 14개 컬럼
- id: 계약 ID (PRIMARY KEY)
- proposal_id: 품의서 ID (FOREIGN KEY)
- contract_number: 계약 번호
- contract_type: 계약 유형
- supplier_id: 공급업체 ID
- contract_amount: 계약 금액 (숫자)
- start_date: 시작일 (DATE)
- end_date: 종료일 (DATE)
- payment_method: 지급 방법
- status: 상태
- created_at: 생성일시
- updated_at: 수정일시

## 9. approval_lines (결재선) - 14개 컬럼
- id: 결재선 ID (PRIMARY KEY)
- proposal_id: 품의서 ID (FOREIGN KEY)
- step: 결재 단계 (INTEGER)
- name: 결재자명
- title: 직책
- description: 설명
- is_conditional: 조건부 여부 (BOOLEAN)
- is_final: 최종 결재 여부 (BOOLEAN)
- status: 상태 (pending, approved, rejected)
- approved_at: 승인일시
- approved_by: 승인자
- comment: 코멘트
- created_at: 생성일시
- updated_at: 수정일시

## 10. cost_departments (비용 부서 배분) - 10개 컬럼
- id: ID (PRIMARY KEY)
- proposal_id: 품의서 ID (FOREIGN KEY)
- department_id: 부서 ID
- department: 부서명
- amount: 금액 (숫자)
- ratio: 비율 (숫자, 0-100)
- purchase_item_id: 구매품목 ID
- allocation_type: 배분 유형
- created_at: 생성일시
- updated_at: 수정일시

## 11. project_purposes (프로젝트 목적) - 7개 컬럼
- id: ID (PRIMARY KEY)
- code: 코드
- description: 설명
- year: 연도 (INTEGER)
- is_fixed: 고정 여부 (BOOLEAN)
- created_at: 생성일시
- updated_at: 수정일시

## 테이블 관계:
- proposals.budget_id → budgets.id
- proposals.contract_method_id → contract_methods.id
- purchase_items.proposal_id → proposals.id
- purchase_items.supplier_id → suppliers.id
- service_items.proposal_id → proposals.id
- service_items.supplier_id → suppliers.id
- contracts.proposal_id → proposals.id
- contracts.supplier_id → suppliers.id
- approval_lines.proposal_id → proposals.id
- cost_departments.proposal_id → proposals.id
- cost_departments.department_id → departments.id

## 주요 규칙:
1. 날짜 필터는 DATE 타입 컬럼 사용
2. 금액은 numeric 타입 (unit_price, amount, budget_amount 등)
3. 연도는 INTEGER 타입 (budget_year, year)
4. 상태는 문자열 (draft, pending, approved, rejected)
5. BOOLEAN 타입: is_active, is_essential, is_conditional 등
6. 현재 연도: EXTRACT(YEAR FROM CURRENT_DATE)
7. 현재 월: EXTRACT(MONTH FROM CURRENT_DATE)
"""

# Few-Shot 예시 (질문-SQL 쌍) - 30개
FEW_SHOT_EXAMPLES = """
# SQL 생성 예시:

## 기본 조회 (5개)
질문: 승인된 품의서는 몇 건이야?
SQL: SELECT COUNT(*) as count FROM proposals WHERE status = 'approved';

질문: 전체 품의서 목록 보여줘
SQL: SELECT id, title, status, total_amount, created_at FROM proposals ORDER BY created_at DESC LIMIT 10;

질문: 활성화된 부서 목록
SQL: SELECT name, code, manager FROM departments WHERE is_active = true ORDER BY code;

질문: 활성화된 공급업체 목록
SQL: SELECT name, representative, phone, credit_rating FROM suppliers WHERE is_active = true ORDER BY name;

질문: 최근 계약 5건
SQL: SELECT contract_number, contract_type, contract_amount, start_date FROM contracts ORDER BY created_at DESC LIMIT 5;

## 집계 및 통계 (5개)
질문: 올해 사업예산 총액은?
SQL: SELECT SUM(budget_amount) as total FROM business_budgets WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE);

질문: 상태별 품의서 통계
SQL: SELECT status, COUNT(*) as count FROM proposals GROUP BY status ORDER BY count DESC;

질문: 올해 월별 품의서 건수
SQL: SELECT EXTRACT(MONTH FROM created_at) as month, COUNT(*) as count FROM proposals WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) GROUP BY EXTRACT(MONTH FROM created_at) ORDER BY month;

질문: 올해 평균 예산 금액
SQL: SELECT AVG(budget_amount) as avg_budget FROM business_budgets WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE);

질문: 부서별 예산 총액
SQL: SELECT executor_department, SUM(budget_amount) as total FROM business_budgets WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE) GROUP BY executor_department ORDER BY total DESC;

## 금액/숫자 조건 (4개)
질문: 1억원 이상 품의서 개수는?
SQL: SELECT COUNT(*) as count FROM proposals WHERE total_amount >= 100000000;

질문: 5천만원 이상 1억원 미만 예산은?
SQL: SELECT project_name, budget_amount FROM business_budgets WHERE budget_amount >= 50000000 AND budget_amount < 100000000 ORDER BY budget_amount DESC;

질문: 예산이 가장 큰 프로젝트는?
SQL: SELECT project_name, budget_amount, executor_department FROM business_budgets WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE) ORDER BY budget_amount DESC LIMIT 1;

질문: 예산이 가장 작은 프로젝트 3개
SQL: SELECT project_name, budget_amount FROM business_budgets WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE) ORDER BY budget_amount ASC LIMIT 3;

## 날짜 처리 (4개)
질문: 올해 3월에 승인된 품의서는?
SQL: SELECT id, title, approval_date FROM proposals WHERE status = 'approved' AND EXTRACT(YEAR FROM approval_date) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM approval_date) = 3;

질문: 지난달 승인된 품의서 개수
SQL: SELECT COUNT(*) as count FROM proposals WHERE status = 'approved' AND EXTRACT(YEAR FROM approval_date) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month') AND EXTRACT(MONTH FROM approval_date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month');

질문: 최근 30일간 생성된 품의서
SQL: SELECT id, title, created_at FROM proposals WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' ORDER BY created_at DESC;

질문: 2024년 예산 목록
SQL: SELECT project_name, budget_amount, status FROM business_budgets WHERE budget_year = 2024 ORDER BY created_at DESC LIMIT 10;

## 문자열 검색 (4개)
질문: 제목에 '노트북'이 포함된 품의서는?
SQL: SELECT id, title, total_amount, status FROM proposals WHERE title LIKE '%노트북%' ORDER BY created_at DESC;

질문: IT부서가 집행 부서인 예산 목록
SQL: SELECT project_name, budget_amount, status FROM business_budgets WHERE executor_department LIKE '%IT%' ORDER BY created_at DESC LIMIT 10;

질문: 수의계약 방식 품의서 개수
SQL: SELECT COUNT(*) as count FROM proposals WHERE contract_method LIKE '%수의계약%';

질문: 이름에 '서버'가 포함된 구매 품목
SQL: SELECT product_name, quantity, unit_price, amount FROM purchase_items WHERE product_name LIKE '%서버%' ORDER BY created_at DESC;

## JOIN 쿼리 (3개)
질문: 최근 구매 품목과 품의서 제목
SQL: SELECT pi.product_name, pi.quantity, pi.amount, p.title FROM purchase_items pi LEFT JOIN proposals p ON pi.proposal_id = p.id ORDER BY pi.created_at DESC LIMIT 10;

질문: 품의서별 구매 품목 개수
SQL: SELECT p.id, p.title, COUNT(pi.id) as item_count FROM proposals p LEFT JOIN purchase_items pi ON p.id = pi.proposal_id GROUP BY p.id, p.title HAVING COUNT(pi.id) > 0 ORDER BY item_count DESC LIMIT 10;

질문: 공급업체별 계약 건수
SQL: SELECT s.name, COUNT(c.id) as contract_count, SUM(c.contract_amount) as total_amount FROM suppliers s LEFT JOIN contracts c ON s.id = c.supplier_id GROUP BY s.id, s.name ORDER BY contract_count DESC;

## 복잡한 조건 (3개)
질문: IT부서의 승인된 1억원 이상 품의서
SQL: SELECT p.id, p.title, p.total_amount, cd.department FROM proposals p LEFT JOIN cost_departments cd ON p.id = cd.proposal_id WHERE p.status = 'approved' AND p.total_amount >= 100000000 AND cd.department LIKE '%IT%' ORDER BY p.total_amount DESC;

질문: 올해 승인됐지만 집행되지 않은 예산
SQL: SELECT project_name, budget_amount, executed_amount FROM business_budgets WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE) AND status = '승인' AND (executed_amount IS NULL OR executed_amount = 0) ORDER BY budget_amount DESC;

질문: 필수 사업이면서 예산이 5천만원 이상인 프로젝트
SQL: SELECT project_name, budget_amount, project_purpose FROM business_budgets WHERE is_essential = true AND budget_amount >= 50000000 AND budget_year = EXTRACT(YEAR FROM CURRENT_DATE) ORDER BY budget_amount DESC;

## 서브쿼리 (2개)
질문: 평균 예산보다 큰 프로젝트는?
SQL: SELECT project_name, budget_amount FROM business_budgets WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE) AND budget_amount > (SELECT AVG(budget_amount) FROM business_budgets WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE)) ORDER BY budget_amount DESC;

질문: 가장 많은 품의서를 작성한 부서
SQL: SELECT executor_department, COUNT(*) as count FROM business_budgets WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE) GROUP BY executor_department HAVING COUNT(*) = (SELECT MAX(cnt) FROM (SELECT COUNT(*) as cnt FROM business_budgets WHERE budget_year = EXTRACT(YEAR FROM CURRENT_DATE) GROUP BY executor_department) sub);
"""

