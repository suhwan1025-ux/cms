-- =====================================================
-- 계약관리시스템(CMS) - 외래키 제약조건 생성 스크립트
-- 파일명: 03_create_foreign_keys.sql
-- 실행: cms_admin 사용자로 contract_management DB에 연결하여 실행
-- 주의: 02_create_tables.sql 실행 후 실행할 것
-- =====================================================

\c contract_management cms_admin

-- =====================================================
-- 1. departments 테이블
-- =====================================================
-- 자기 참조 (상위 부서)
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_parent
    FOREIGN KEY (parent_id) 
    REFERENCES departments(id) 
    ON DELETE SET NULL;

-- =====================================================
-- 2. business_budget_details 테이블
-- =====================================================
ALTER TABLE business_budget_details
    ADD CONSTRAINT fk_business_budget_details_budget
    FOREIGN KEY (budget_id) 
    REFERENCES business_budgets(id) 
    ON DELETE CASCADE;

-- =====================================================
-- 3. business_budget_history 테이블
-- =====================================================
ALTER TABLE business_budget_history
    ADD CONSTRAINT fk_business_budget_history_budget
    FOREIGN KEY (budget_id) 
    REFERENCES business_budgets(id) 
    ON DELETE CASCADE;

-- =====================================================
-- 4. business_budget_approvals 테이블
-- =====================================================
ALTER TABLE business_budget_approvals
    ADD CONSTRAINT fk_business_budget_approvals_budget
    FOREIGN KEY (budget_id) 
    REFERENCES business_budgets(id) 
    ON DELETE CASCADE;

-- =====================================================
-- 5. proposals 테이블
-- =====================================================
-- 사업예산 참조
ALTER TABLE proposals
    ADD CONSTRAINT fk_proposals_budget
    FOREIGN KEY (budget_id) 
    REFERENCES business_budgets(id) 
    ON DELETE SET NULL;

-- 계약방식 참조
ALTER TABLE proposals
    ADD CONSTRAINT fk_proposals_contract_method
    FOREIGN KEY (contract_method_id) 
    REFERENCES contract_methods(id) 
    ON DELETE SET NULL;

-- =====================================================
-- 6. purchase_items 테이블
-- =====================================================
-- 품의서 참조
ALTER TABLE purchase_items
    ADD CONSTRAINT fk_purchase_items_proposal
    FOREIGN KEY (proposal_id) 
    REFERENCES proposals(id) 
    ON DELETE CASCADE;

-- 공급업체 참조
ALTER TABLE purchase_items
    ADD CONSTRAINT fk_purchase_items_supplier
    FOREIGN KEY (supplier_id) 
    REFERENCES suppliers(id) 
    ON DELETE SET NULL;

-- =====================================================
-- 7. service_items 테이블
-- =====================================================
-- 품의서 참조
ALTER TABLE service_items
    ADD CONSTRAINT fk_service_items_proposal
    FOREIGN KEY (proposal_id) 
    REFERENCES proposals(id) 
    ON DELETE CASCADE;

-- 공급업체 참조
ALTER TABLE service_items
    ADD CONSTRAINT fk_service_items_supplier
    FOREIGN KEY (supplier_id) 
    REFERENCES suppliers(id) 
    ON DELETE SET NULL;

-- =====================================================
-- 8. cost_departments 테이블
-- =====================================================
-- 품의서 참조
ALTER TABLE cost_departments
    ADD CONSTRAINT fk_cost_departments_proposal
    FOREIGN KEY (proposal_id) 
    REFERENCES proposals(id) 
    ON DELETE CASCADE;

-- 부서 참조
ALTER TABLE cost_departments
    ADD CONSTRAINT fk_cost_departments_department
    FOREIGN KEY (department_id) 
    REFERENCES departments(id) 
    ON DELETE SET NULL;

-- 구매품목 참조
ALTER TABLE cost_departments
    ADD CONSTRAINT fk_cost_departments_purchase_item
    FOREIGN KEY (purchase_item_id) 
    REFERENCES purchase_items(id) 
    ON DELETE CASCADE;

-- 용역항목 참조
ALTER TABLE cost_departments
    ADD CONSTRAINT fk_cost_departments_service_item
    FOREIGN KEY (service_item_id) 
    REFERENCES service_items(id) 
    ON DELETE CASCADE;

-- =====================================================
-- 9. request_departments 테이블
-- =====================================================
-- 품의서 참조
ALTER TABLE request_departments
    ADD CONSTRAINT fk_request_departments_proposal
    FOREIGN KEY (proposal_id) 
    REFERENCES proposals(id) 
    ON DELETE CASCADE;

-- 부서 참조
ALTER TABLE request_departments
    ADD CONSTRAINT fk_request_departments_department
    FOREIGN KEY (department_id) 
    REFERENCES departments(id) 
    ON DELETE SET NULL;

-- =====================================================
-- 10. approval_lines 테이블
-- =====================================================
-- 품의서 참조
ALTER TABLE approval_lines
    ADD CONSTRAINT fk_approval_lines_proposal
    FOREIGN KEY (proposal_id) 
    REFERENCES proposals(id) 
    ON DELETE CASCADE;

-- =====================================================
-- 11. approval_conditions 테이블
-- =====================================================
-- 결재자 참조
ALTER TABLE approval_conditions
    ADD CONSTRAINT fk_approval_conditions_approver
    FOREIGN KEY (approver_id) 
    REFERENCES approval_approvers(id) 
    ON DELETE CASCADE;

-- =====================================================
-- 12. contracts 테이블
-- =====================================================
-- 품의서 참조 (삭제 제한)
ALTER TABLE contracts
    ADD CONSTRAINT fk_contracts_proposal
    FOREIGN KEY (proposal_id) 
    REFERENCES proposals(id) 
    ON DELETE RESTRICT;

-- 공급업체 참조
ALTER TABLE contracts
    ADD CONSTRAINT fk_contracts_supplier
    FOREIGN KEY (supplier_id) 
    REFERENCES suppliers(id) 
    ON DELETE SET NULL;

-- =====================================================
-- 13. proposal_histories 테이블
-- =====================================================
-- 품의서 참조
ALTER TABLE proposal_histories
    ADD CONSTRAINT fk_proposal_histories_proposal
    FOREIGN KEY (proposal_id) 
    REFERENCES proposals(id) 
    ON DELETE CASCADE;

-- =====================================================
-- 14. purchase_item_cost_allocations 테이블
-- =====================================================
-- 구매품목 참조
ALTER TABLE purchase_item_cost_allocations
    ADD CONSTRAINT fk_purchase_cost_allocations_item
    FOREIGN KEY (purchase_item_id) 
    REFERENCES purchase_items(id) 
    ON DELETE CASCADE;

-- 부서 참조
ALTER TABLE purchase_item_cost_allocations
    ADD CONSTRAINT fk_purchase_cost_allocations_department
    FOREIGN KEY (department_id) 
    REFERENCES departments(id) 
    ON DELETE SET NULL;

-- =====================================================
-- 15. purchase_history 테이블
-- =====================================================
-- 품의서 참조
ALTER TABLE purchase_history
    ADD CONSTRAINT fk_purchase_history_proposal
    FOREIGN KEY (proposal_id) 
    REFERENCES proposals(id) 
    ON DELETE SET NULL;

-- 공급업체 참조
ALTER TABLE purchase_history
    ADD CONSTRAINT fk_purchase_history_supplier
    FOREIGN KEY (supplier_id) 
    REFERENCES suppliers(id) 
    ON DELETE SET NULL;

-- 완료 메시지
SELECT 'All foreign keys created successfully!' AS status;

-- 외래키 확인 쿼리
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

