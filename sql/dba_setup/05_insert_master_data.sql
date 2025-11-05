-- =====================================================
-- 계약관리시스템(CMS) - 초기 마스터 데이터 삽입
-- 파일명: 05_insert_master_data.sql
-- 실행: cms_admin 사용자로 contract_management DB에 연결하여 실행
-- 주의: 04_create_indexes.sql 실행 후 실행할 것
-- =====================================================

\c contract_management cms_admin

-- =====================================================
-- 1. 부서 마스터 데이터
-- =====================================================
INSERT INTO departments (name, code, parent_id, manager, description, is_active) VALUES
    ('경영기획본부', 'D001', NULL, '홍길동', '경영기획 및 전략 수립', TRUE),
    ('IT본부', 'D002', NULL, '김철수', 'IT 인프라 및 시스템 운영', TRUE),
    ('재무부', 'D003', NULL, '이영희', '재무 및 회계 관리', TRUE),
    ('인사부', 'D004', NULL, '박민수', '인사 및 조직 관리', TRUE),
    ('영업부', 'D005', NULL, '정수현', '영업 및 고객 관리', TRUE),
    ('개발팀', 'D002-1', 2, '최개발', 'IT본부 산하 개발팀', TRUE)
ON CONFLICT (name) DO NOTHING;

SELECT '✓ 부서 데이터 삽입 완료: ' || COUNT(*) || '개' FROM departments;

-- =====================================================
-- 2. 계약방식 마스터 데이터
-- =====================================================
INSERT INTO contract_methods (code, name, value, description, basis, is_active) VALUES
    ('CM001', '일반경쟁입찰', '일반경쟁입찰', '제한 없이 입찰 참가 자격을 부여하는 경쟁입찰', '국가계약법 제7조', TRUE),
    ('CM002', '제한경쟁입찰', '제한경쟁입찰', '일정한 자격을 가진 자에게만 입찰 참가 자격을 부여하는 경쟁입찰', '국가계약법 제7조', TRUE),
    ('CM003', '지명경쟁입찰', '지명경쟁입찰', '특정 업체를 지명하여 입찰하는 방식', '국가계약법 제7조', TRUE),
    ('CM004', '수의계약', '수의계약', '경쟁 없이 직접 계약하는 방식', '국가계약법 시행령 제26조', TRUE),
    ('CM005', '긴급수의계약', '긴급수의계약', '긴급한 상황에서 체결하는 수의계약', '국가계약법 시행령 제26조 제1항 제5호', TRUE),
    ('CM006', '2단계경쟁입찰', '2단계경쟁입찰', '기술제안 평가 후 가격입찰을 하는 방식', '국가계약법 제7조의2', TRUE),
    ('CM007', '협상에 의한 계약', '협상계약', '협상을 통해 계약조건을 조정하는 방식', '국가계약법 제7조의3', TRUE),
    ('CM008', '다수공급자계약', '다수공급자계약', '여러 공급자와 동시에 계약하는 방식', '국가계약법 시행령 제72조', TRUE),
    ('CM009', '장기계속계약', '장기계속계약', '여러 연도에 걸쳐 계속되는 계약', '국가계약법 시행령 제67조', TRUE),
    ('CM010', '단가계약', '단가계약', '단가를 정하고 실제 사용량에 따라 지급하는 계약', '국가계약법 시행령 제73조', TRUE)
ON CONFLICT (code) DO NOTHING;

SELECT '✓ 계약방식 데이터 삽입 완료: ' || COUNT(*) || '개' FROM contract_methods;

-- =====================================================
-- 3. 결재자 마스터 데이터
-- =====================================================
INSERT INTO approval_approvers (code, name, title, department, description, basis, is_active) VALUES
    ('APP001', '김팀장', '팀장', 'IT본부', 'IT본부 개발팀 팀장', '내부결재규정 제4조', TRUE),
    ('APP002', '이본부장', '본부장', 'IT본부', 'IT본부 본부장', '내부결재규정 제3조', TRUE),
    ('APP003', '박이사', '이사', '재무부', '재무담당 이사', '내부결재규정 제3조', TRUE),
    ('APP004', '최대표', '대표이사', '경영진', '대표이사', '내부결재규정 제2조', TRUE)
ON CONFLICT (code) DO NOTHING;

SELECT '✓ 결재자 데이터 삽입 완료: ' || COUNT(*) || '개' FROM approval_approvers;

-- =====================================================
-- 4. 결재조건 데이터
-- =====================================================
-- 팀장 결재 조건
INSERT INTO approval_conditions (approver_id, condition_type, condition_value, condition_label) VALUES
    (1, 'amount', '10000000', '1천만원 미만'),
    (2, 'amount', '50000000', '5천만원 미만'),
    (3, 'amount', '50000000', '5천만원 이상'),
    (4, 'amount', '100000000', '1억원 이상')
ON CONFLICT DO NOTHING;

SELECT '✓ 결재조건 데이터 삽입 완료: ' || COUNT(*) || '개' FROM approval_conditions;

-- =====================================================
-- 5. 결재규칙 데이터
-- =====================================================
INSERT INTO approval_rules (rule_type, rule_name, rule_content, basis, is_active) VALUES
    ('amount', '1천만원 미만', '팀장 결재', '내부결재규정 제5조 제1항', TRUE),
    ('amount', '1천만원 이상 5천만원 미만', '팀장 → 본부장 → 재무이사 결재', '내부결재규정 제5조 제2항', TRUE),
    ('amount', '5천만원 이상', '팀장 → 본부장 → 재무이사 → 대표이사 결재', '내부결재규정 제5조 제3항', TRUE)
ON CONFLICT DO NOTHING;

SELECT '✓ 결재규칙 데이터 삽입 완료: ' || COUNT(*) || '개' FROM approval_rules;

-- =====================================================
-- 6. 결재참조표 데이터
-- =====================================================
INSERT INTO approval_references (amount_range, min_amount, max_amount, included_approvers, final_approver, description, is_active) VALUES
    ('1천만원 미만', 0, 9999999.99, '팀장', '팀장', '소액 계약', TRUE),
    ('1천만원 이상 ~ 5천만원 미만', 10000000, 49999999.99, '팀장, 본부장, 재무이사', '재무이사', '중액 계약', TRUE),
    ('5천만원 이상 ~ 1억원 미만', 50000000, 99999999.99, '팀장, 본부장, 재무이사, 대표이사', '대표이사', '고액 계약', TRUE),
    ('1억원 이상', 100000000, NULL, '팀장, 본부장, 재무이사, 대표이사', '대표이사', '초고액 계약', TRUE)
ON CONFLICT DO NOTHING;

SELECT '✓ 결재참조표 데이터 삽입 완료: ' || COUNT(*) || '개' FROM approval_references;

-- =====================================================
-- 7. 예산 샘플 데이터 (선택사항)
-- =====================================================
INSERT INTO budgets (name, year, type, total_amount, used_amount, remaining_amount, department, description, is_active) VALUES
    ('2025년 IT 운영예산', 2025, 'general', 100000000, 0, 100000000, 'IT본부', 'IT 시스템 운영 및 유지보수 예산', TRUE),
    ('2025년 사무용품 예산', 2025, 'general', 50000000, 0, 50000000, '총무부', '사무용품 및 소모품 구매 예산', TRUE),
    ('2025년 인건비 예산', 2025, 'general', 500000000, 0, 500000000, '인사부', '직원 급여 및 복리후생 예산', TRUE)
ON CONFLICT DO NOTHING;

SELECT '✓ 예산 샘플 데이터 삽입 완료: ' || COUNT(*) || '개' FROM budgets;

-- =====================================================
-- 8. 사업예산 샘플 데이터 (선택사항)
-- =====================================================
INSERT INTO business_budgets (
    project_name, initiator_department, executor_department, 
    budget_type, budget_category, budget_amount, budget_year, 
    start_date, end_date, project_purpose, status
) VALUES
    ('차세대 시스템 구축 사업', 'IT본부', 'IT본부', 'IT사업', 'IT투자', 500000000, 2025, '2025-01', '2025-12', 'I001', '승인완료'),
    ('업무 자동화 시스템 도입', 'IT본부', 'IT본부', 'IT사업', 'IT운영', 200000000, 2025, '2025-03', '2025-12', 'I002', '승인완료'),
    ('보안 인프라 강화', 'IT본부', 'IT본부', 'IT사업', '정보보안', 150000000, 2025, '2025-02', '2025-12', 'I003', '승인대기')
ON CONFLICT DO NOTHING;

SELECT '✓ 사업예산 샘플 데이터 삽입 완료: ' || COUNT(*) || '개' FROM business_budgets;

-- =====================================================
-- 9. 공급업체 샘플 데이터 (선택사항)
-- =====================================================
INSERT INTO suppliers (name, business_number, representative, phone, email, credit_rating, is_active) VALUES
    ('(주)테크솔루션', '123-45-67890', '김대표', '02-1234-5678', 'info@techsol.com', 'AA', TRUE),
    ('소프트웨어코리아', '234-56-78901', '이대표', '02-2345-6789', 'contact@swkorea.com', 'A', TRUE),
    ('글로벌IT(주)', '345-67-89012', '박대표', '02-3456-7890', 'sales@globalit.com', 'AA', TRUE),
    ('한국시스템', '456-78-90123', '최대표', '02-4567-8901', 'info@krsystem.com', 'A', TRUE),
    ('디지털솔루션', '567-89-01234', '정대표', '02-5678-9012', 'support@digitalsol.com', 'BBB', TRUE)
ON CONFLICT (business_number) DO NOTHING;

SELECT '✓ 공급업체 샘플 데이터 삽입 완료: ' || COUNT(*) || '개' FROM suppliers;

-- =====================================================
-- 10. 사업목적 데이터 (2025년)
-- =====================================================
INSERT INTO project_purposes (code, description, year, is_fixed) VALUES
    ('I001', '디지털 전환 및 시스템 고도화', 2025, TRUE),
    ('I002', '업무 효율화 및 자동화', 2025, TRUE),
    ('I003', '정보보안 강화', 2025, TRUE),
    ('I004', '클라우드 인프라 구축', 2025, TRUE),
    ('I005', 'AI/빅데이터 플랫폼 구축', 2025, TRUE),
    ('I006', '레거시 시스템 개선', 2025, TRUE),
    ('I007', '통합 데이터 관리 체계 구축', 2025, TRUE),
    ('I008', '고객 서비스 시스템 개선', 2025, TRUE),
    ('I009', '모바일 플랫폼 구축', 2025, TRUE),
    ('I010', 'IT 인프라 안정화', 2025, TRUE)
ON CONFLICT (code, year) DO NOTHING;

SELECT '✓ 사업목적 데이터 삽입 완료: ' || COUNT(*) || '개' FROM project_purposes WHERE year = 2025;

-- =====================================================
-- 11. 문서 템플릿 샘플 데이터 (선택사항)
-- =====================================================
INSERT INTO document_templates (name, description, content, category, is_active, display_order, created_by) VALUES
    ('기본 품의서 템플릿', '일반적인 품의서 양식', '<h1>품의서</h1><p>품의내용을 작성하세요...</p>', 'proposal', TRUE, 1, 'admin'),
    ('용역 계약서 템플릿', '용역 계약서 표준 양식', '<h1>용역 계약서</h1><p>계약 내용...</p>', 'contract', TRUE, 1, 'admin'),
    ('구매 계약서 템플릿', '구매 계약서 표준 양식', '<h1>구매 계약서</h1><p>구매 조건...</p>', 'contract', TRUE, 2, 'admin')
ON CONFLICT DO NOTHING;

SELECT '✓ 문서 템플릿 샘플 데이터 삽입 완료: ' || COUNT(*) || '개' FROM document_templates;

-- =====================================================
-- 완료 요약
-- =====================================================
SELECT 
    '==========================================' AS separator
UNION ALL
SELECT '  초기 마스터 데이터 삽입 완료'
UNION ALL
SELECT '==========================================' 
UNION ALL
SELECT '부서: ' || (SELECT COUNT(*)::text FROM departments) || '개'
UNION ALL
SELECT '계약방식: ' || (SELECT COUNT(*)::text FROM contract_methods) || '개'
UNION ALL
SELECT '결재자: ' || (SELECT COUNT(*)::text FROM approval_approvers) || '개'
UNION ALL
SELECT '결재규칙: ' || (SELECT COUNT(*)::text FROM approval_rules) || '개'
UNION ALL
SELECT '예산: ' || (SELECT COUNT(*)::text FROM budgets) || '개'
UNION ALL
SELECT '사업예산: ' || (SELECT COUNT(*)::text FROM business_budgets) || '개'
UNION ALL
SELECT '공급업체: ' || (SELECT COUNT(*)::text FROM suppliers) || '개'
UNION ALL
SELECT '사업목적: ' || (SELECT COUNT(*)::text FROM project_purposes WHERE year = 2025) || '개'
UNION ALL
SELECT '==========================================';

