-- =====================================================
-- 계약관리시스템(CMS) - 인덱스 생성 스크립트
-- 파일명: 04_create_indexes.sql
-- 실행: cms_admin 사용자로 contract_management DB에 연결하여 실행
-- 주의: 03_create_foreign_keys.sql 실행 후 실행할 것
-- =====================================================

\c contract_management cms_admin

-- =====================================================
-- 1. departments 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_departments_parent 
    ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_active 
    ON departments(is_active);
CREATE INDEX IF NOT EXISTS idx_departments_code 
    ON departments(code) WHERE code IS NOT NULL;

-- =====================================================
-- 2. suppliers 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_suppliers_active 
    ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_name 
    ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_business_number 
    ON suppliers(business_number) WHERE business_number IS NOT NULL;

-- =====================================================
-- 3. budgets 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_budgets_year 
    ON budgets(year);
CREATE INDEX IF NOT EXISTS idx_budgets_type 
    ON budgets(type);
CREATE INDEX IF NOT EXISTS idx_budgets_active 
    ON budgets(is_active);
CREATE INDEX IF NOT EXISTS idx_budgets_year_type 
    ON budgets(year, type);

-- =====================================================
-- 4. contract_methods 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_contract_methods_active 
    ON contract_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_contract_methods_code 
    ON contract_methods(code);

-- =====================================================
-- 5. business_budgets 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_business_budgets_year 
    ON business_budgets(budget_year);
CREATE INDEX IF NOT EXISTS idx_business_budgets_status 
    ON business_budgets(status);
CREATE INDEX IF NOT EXISTS idx_business_budgets_year_status 
    ON business_budgets(budget_year, status);
CREATE INDEX IF NOT EXISTS idx_business_budgets_department 
    ON business_budgets(executor_department);

-- =====================================================
-- 6. business_budget_details 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_business_budget_details_budget 
    ON business_budget_details(budget_id);

-- =====================================================
-- 7. business_budget_history 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_business_budget_history_budget 
    ON business_budget_history(budget_id);
CREATE INDEX IF NOT EXISTS idx_business_budget_history_date 
    ON business_budget_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_business_budget_history_type 
    ON business_budget_history(change_type);

-- =====================================================
-- 8. business_budget_approvals 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_business_budget_approvals_budget 
    ON business_budget_approvals(budget_id);

-- =====================================================
-- 9. proposals 테이블 인덱스 (핵심)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_proposals_budget_status 
    ON proposals(budget_id, status);
CREATE INDEX IF NOT EXISTS idx_proposals_status 
    ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_type 
    ON proposals(contract_type);
CREATE INDEX IF NOT EXISTS idx_proposals_date 
    ON proposals(proposal_date) WHERE proposal_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_approval_date 
    ON proposals(approval_date) WHERE approval_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_created_by 
    ON proposals(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_budget_type_status 
    ON proposals(budget_id, contract_type, status);

-- 전문 검색용 인덱스 (선택사항)
-- CREATE INDEX IF NOT EXISTS idx_proposals_title_gin 
--     ON proposals USING gin(to_tsvector('korean', title));

-- =====================================================
-- 10. purchase_items 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_purchase_items_proposal 
    ON purchase_items(proposal_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_supplier 
    ON purchase_items(supplier_id) WHERE supplier_id IS NOT NULL;

-- =====================================================
-- 11. service_items 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_service_items_proposal 
    ON service_items(proposal_id);
CREATE INDEX IF NOT EXISTS idx_service_items_supplier 
    ON service_items(supplier_id) WHERE supplier_id IS NOT NULL;

-- =====================================================
-- 12. cost_departments 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_cost_departments_proposal 
    ON cost_departments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_cost_departments_department 
    ON cost_departments(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cost_departments_purchase_item 
    ON cost_departments(purchase_item_id) WHERE purchase_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cost_departments_service_item 
    ON cost_departments(service_item_id) WHERE service_item_id IS NOT NULL;

-- =====================================================
-- 13. request_departments 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_request_departments_proposal 
    ON request_departments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_request_departments_department 
    ON request_departments(department_id) WHERE department_id IS NOT NULL;

-- =====================================================
-- 14. approval_lines 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_approval_lines_proposal 
    ON approval_lines(proposal_id);
CREATE INDEX IF NOT EXISTS idx_approval_lines_step 
    ON approval_lines(proposal_id, step);
CREATE INDEX IF NOT EXISTS idx_approval_lines_status 
    ON approval_lines(status);

-- =====================================================
-- 15. approval_rules 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_approval_rules_type 
    ON approval_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_approval_rules_active 
    ON approval_rules(is_active);

-- =====================================================
-- 16. approval_approvers 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_approval_approvers_active 
    ON approval_approvers(is_active);
CREATE INDEX IF NOT EXISTS idx_approval_approvers_code 
    ON approval_approvers(code);

-- =====================================================
-- 17. approval_conditions 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_approval_conditions_approver 
    ON approval_conditions(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_conditions_type 
    ON approval_conditions(condition_type);

-- =====================================================
-- 18. approval_references 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_approval_references_active 
    ON approval_references(is_active);
CREATE INDEX IF NOT EXISTS idx_approval_references_amount 
    ON approval_references(min_amount, max_amount);

-- =====================================================
-- 19. contracts 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_contracts_proposal 
    ON contracts(proposal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status 
    ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_number 
    ON contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_dates 
    ON contracts(start_date, end_date);

-- =====================================================
-- 20. proposal_histories 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_proposal_histories_proposal 
    ON proposal_histories(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_histories_date 
    ON proposal_histories(changed_at);
CREATE INDEX IF NOT EXISTS idx_proposal_histories_type 
    ON proposal_histories(change_type);

-- =====================================================
-- 21. purchase_item_cost_allocations 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_purchase_cost_allocations_item 
    ON purchase_item_cost_allocations(purchase_item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_cost_allocations_dept 
    ON purchase_item_cost_allocations(department_id) WHERE department_id IS NOT NULL;

-- =====================================================
-- 22. project_purposes 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_project_purposes_code 
    ON project_purposes(code);
CREATE INDEX IF NOT EXISTS idx_project_purposes_year 
    ON project_purposes(year);
CREATE INDEX IF NOT EXISTS idx_project_purposes_code_year 
    ON project_purposes(code, year);

-- =====================================================
-- 23. document_templates 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_document_templates_active 
    ON document_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_document_templates_category 
    ON document_templates(category);

-- =====================================================
-- 24. tasks 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_tasks_status 
    ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_active 
    ON tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_tasks_dates 
    ON tasks(start_date, end_date);

-- =====================================================
-- 25. purchase_history 테이블 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_purchase_history_proposal 
    ON purchase_history(proposal_id) WHERE proposal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_history_date 
    ON purchase_history(purchase_date) WHERE purchase_date IS NOT NULL;

-- 완료 메시지
SELECT 'All indexes created successfully!' AS status;

-- 인덱스 확인 쿼리
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

