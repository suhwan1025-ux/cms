-- =====================================================
-- 계약관리시스템(CMS) - 전체 설치 통합 스크립트
-- 파일명: 00_run_all.sql
-- 실행: postgres 사용자로 실행
-- 목적: 모든 설치 스크립트를 순차적으로 실행
-- =====================================================

-- 경고 메시지
\echo '=========================================='
\echo '계약관리시스템(CMS) 데이터베이스 설치'
\echo '=========================================='
\echo '이 스크립트는 다음 작업을 수행합니다:'
\echo '1. 데이터베이스 및 사용자 생성'
\echo '2. 전체 테이블 생성 (26개)'
\echo '3. 외래키 제약조건 생성'
\echo '4. 인덱스 생성'
\echo '5. 초기 마스터 데이터 삽입'
\echo '6. 검증 쿼리 실행'
\echo ''
\echo '⚠️  주의: 기존 contract_management 데이터베이스가'
\echo '   존재하는 경우 에러가 발생할 수 있습니다.'
\echo ''
\echo '계속하려면 Enter를 누르세요...'
\echo '=========================================='
\echo ''

-- 단계별 실행
\echo '▶ 1단계: 데이터베이스 및 사용자 생성 중...'
\i 01_create_database.sql

\echo ''
\echo '▶ 2단계: 테이블 생성 중... (약 30초 소요)'
\i 02_create_tables.sql

\echo ''
\echo '▶ 3단계: 외래키 제약조건 생성 중... (약 20초 소요)'
\i 03_create_foreign_keys.sql

\echo ''
\echo '▶ 4단계: 인덱스 생성 중... (약 30초 소요)'
\i 04_create_indexes.sql

\echo ''
\echo '▶ 5단계: 초기 마스터 데이터 삽입 중...'
\i 05_insert_master_data.sql

\echo ''
\echo '▶ 6단계: 데이터베이스 검증 중...'
\i 06_verification_queries.sql

\echo ''
\echo '=========================================='
\echo '✅ 설치 완료!'
\echo '=========================================='
\echo ''
\echo '다음 단계:'
\echo '1. 애플리케이션 .env 파일 설정'
\echo '2. 애플리케이션 서버 시작'
\echo '3. 웹 브라우저로 접속 테스트'
\echo ''
\echo '연결 정보:'
\echo '  Host: localhost'
\echo '  Port: 5432'
\echo '  Database: contract_management'
\echo '  Username: cms_admin'
\echo '  Password: (설치 시 설정한 비밀번호)'
\echo ''
\echo '=========================================='

