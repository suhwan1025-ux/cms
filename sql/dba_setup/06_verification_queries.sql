-- =====================================================
-- 계약관리시스템(CMS) - 검증 쿼리
-- 파일명: 06_verification_queries.sql
-- 실행: cms_admin 또는 cms_reader 사용자로 실행
-- 목적: 데이터베이스 구축 완료 후 검증
-- =====================================================

\c contract_management

-- =====================================================
-- 1. 데이터베이스 정보 확인
-- =====================================================
\echo '=========================================='
\echo '1. 데이터베이스 기본 정보'
\echo '=========================================='

SELECT 
    current_database() AS "데이터베이스명",
    current_user AS "현재사용자",
    version() AS "PostgreSQL버전",
    pg_postmaster_start_time() AS "서버시작시간",
    pg_size_pretty(pg_database_size(current_database())) AS "DB크기";

-- =====================================================
-- 2. 모든 테이블 목록 및 레코드 수
-- =====================================================
\echo ''
\echo '=========================================='
\echo '2. 테이블 목록 및 레코드 수'
\echo '=========================================='

SELECT 
    table_name AS "테이블명",
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS "크기",
    (xpath('/row/cnt/text()', xml_count))[1]::text::int AS "레코드수"
FROM (
    SELECT 
        table_name, 
        query_to_xml(format('SELECT COUNT(*) AS cnt FROM %I', table_name), false, true, '') AS xml_count
    FROM information_schema.tables
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != 'SequelizeMeta'
) AS counts
ORDER BY table_name;

-- 총 테이블 수
SELECT '총 테이블 수: ' || COUNT(*)::text || '개' AS "요약"
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- =====================================================
-- 3. 외래키 제약조건 확인
-- =====================================================
\echo ''
\echo '=========================================='
\echo '3. 외래키 제약조건 (처음 10개)'
\echo '=========================================='

SELECT
    tc.table_name AS "테이블", 
    kcu.column_name AS "컬럼",
    ccu.table_name AS "참조테이블",
    ccu.column_name AS "참조컬럼",
    tc.constraint_name AS "제약조건명"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name
LIMIT 10;

-- 총 외래키 수
SELECT '총 외래키 수: ' || COUNT(*)::text || '개' AS "요약"
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public';

-- =====================================================
-- 4. 인덱스 확인
-- =====================================================
\echo ''
\echo '=========================================='
\echo '4. 인덱스 목록 (처음 15개)'
\echo '=========================================='

SELECT
    tablename AS "테이블",
    indexname AS "인덱스명",
    CASE 
        WHEN indexname LIKE '%_pkey' THEN 'PRIMARY KEY'
        WHEN indexname LIKE '%_key' THEN 'UNIQUE'
        ELSE 'INDEX'
    END AS "타입"
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname
LIMIT 15;

-- 총 인덱스 수
SELECT '총 인덱스 수: ' || COUNT(*)::text || '개' AS "요약"
FROM pg_indexes
WHERE schemaname = 'public';

-- =====================================================
-- 5. 주요 마스터 데이터 확인
-- =====================================================
\echo ''
\echo '=========================================='
\echo '5. 주요 마스터 데이터'
\echo '=========================================='

-- 부서
SELECT '부서' AS "구분", name AS "내용", code AS "코드" 
FROM departments 
ORDER BY id 
LIMIT 5;

-- 계약방식
SELECT '계약방식' AS "구분", name AS "내용", code AS "코드" 
FROM contract_methods 
ORDER BY id 
LIMIT 5;

-- 결재자
SELECT '결재자' AS "구분", name || ' (' || title || ')' AS "내용", code AS "코드" 
FROM approval_approvers 
ORDER BY id;

-- =====================================================
-- 6. 각 테이블별 레코드 수 요약
-- =====================================================
\echo ''
\echo '=========================================='
\echo '6. 테이블별 레코드 수 요약'
\echo '=========================================='

SELECT 'departments' AS "테이블", COUNT(*) AS "레코드수" FROM departments
UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL SELECT 'budgets', COUNT(*) FROM budgets
UNION ALL SELECT 'contract_methods', COUNT(*) FROM contract_methods
UNION ALL SELECT 'business_budgets', COUNT(*) FROM business_budgets
UNION ALL SELECT 'business_budget_details', COUNT(*) FROM business_budget_details
UNION ALL SELECT 'business_budget_history', COUNT(*) FROM business_budget_history
UNION ALL SELECT 'proposals', COUNT(*) FROM proposals
UNION ALL SELECT 'purchase_items', COUNT(*) FROM purchase_items
UNION ALL SELECT 'service_items', COUNT(*) FROM service_items
UNION ALL SELECT 'cost_departments', COUNT(*) FROM cost_departments
UNION ALL SELECT 'request_departments', COUNT(*) FROM request_departments
UNION ALL SELECT 'approval_lines', COUNT(*) FROM approval_lines
UNION ALL SELECT 'approval_rules', COUNT(*) FROM approval_rules
UNION ALL SELECT 'approval_approvers', COUNT(*) FROM approval_approvers
UNION ALL SELECT 'approval_conditions', COUNT(*) FROM approval_conditions
UNION ALL SELECT 'approval_references', COUNT(*) FROM approval_references
UNION ALL SELECT 'contracts', COUNT(*) FROM contracts
UNION ALL SELECT 'proposal_histories', COUNT(*) FROM proposal_histories
UNION ALL SELECT 'project_purposes', COUNT(*) FROM project_purposes
UNION ALL SELECT 'document_templates', COUNT(*) FROM document_templates
UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
ORDER BY "테이블";

-- =====================================================
-- 7. 데이터 무결성 검증
-- =====================================================
\echo ''
\echo '=========================================='
\echo '7. 데이터 무결성 검증'
\echo '=========================================='

-- 고아 레코드 확인 (proposals에서 잘못된 budget_id 참조)
SELECT 
    '고아 레코드 - proposals.budget_id' AS "검증항목",
    COUNT(*) AS "문제건수"
FROM proposals 
WHERE budget_id IS NOT NULL 
  AND budget_id NOT IN (SELECT id FROM business_budgets);

-- 고아 레코드 확인 (purchase_items에서 잘못된 proposal_id 참조)
SELECT 
    '고아 레코드 - purchase_items.proposal_id' AS "검증항목",
    COUNT(*) AS "문제건수"
FROM purchase_items 
WHERE proposal_id NOT IN (SELECT id FROM proposals);

-- 고아 레코드 확인 (service_items에서 잘못된 proposal_id 참조)
SELECT 
    '고아 레코드 - service_items.proposal_id' AS "검증항목",
    COUNT(*) AS "문제건수"
FROM service_items 
WHERE proposal_id NOT IN (SELECT id FROM proposals);

-- =====================================================
-- 8. 시퀀스 상태 확인
-- =====================================================
\echo ''
\echo '=========================================='
\echo '8. 시퀀스 상태 (처음 10개)'
\echo '=========================================='

SELECT 
    sequence_name AS "시퀀스명",
    last_value AS "마지막값"
FROM pg_sequences
WHERE schemaname = 'public'
ORDER BY sequence_name
LIMIT 10;

-- =====================================================
-- 9. 사용자 권한 확인
-- =====================================================
\echo ''
\echo '=========================================='
\echo '9. 사용자 및 권한'
\echo '=========================================='

SELECT 
    usename AS "사용자명",
    usesuper AS "슈퍼유저여부",
    usecreatedb AS "DB생성권한",
    useconnlimit AS "연결제한"
FROM pg_user
WHERE usename IN ('cms_admin', 'cms_reader', 'postgres')
ORDER BY usename;

-- =====================================================
-- 10. 연결 상태 확인
-- =====================================================
\echo ''
\echo '=========================================='
\echo '10. 현재 데이터베이스 연결 상태'
\echo '=========================================='

SELECT 
    datname AS "데이터베이스",
    usename AS "사용자",
    application_name AS "애플리케이션",
    client_addr AS "클라이언트IP",
    state AS "상태",
    query_start AS "쿼리시작시간"
FROM pg_stat_activity
WHERE datname = 'contract_management'
ORDER BY query_start DESC;

-- =====================================================
-- 완료
-- =====================================================
\echo ''
\echo '=========================================='
\echo '검증 완료!'
\echo '=========================================='
\echo '문제가 발견되면 해당 항목을 확인하세요.'
\echo '고아 레코드 문제건수가 0보다 크면 데이터 정합성에 문제가 있습니다.'
\echo ''

