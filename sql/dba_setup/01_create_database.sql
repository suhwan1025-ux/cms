-- =====================================================
-- 계약관리시스템(CMS) - 데이터베이스 및 사용자 생성
-- 파일명: 01_create_database.sql
-- 실행: postgres 사용자로 실행
-- =====================================================

-- 1. 사용자 생성
CREATE USER cms_admin WITH PASSWORD 'CHANGE_THIS_PASSWORD';
CREATE USER cms_reader WITH PASSWORD 'CHANGE_THIS_READONLY_PASSWORD';

-- 2. 데이터베이스 생성
CREATE DATABASE contract_management
    WITH 
    OWNER = cms_admin
    ENCODING = 'UTF8'
    LC_COLLATE = 'ko_KR.UTF-8'
    LC_CTYPE = 'ko_KR.UTF-8'
    TEMPLATE = template0
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE contract_management IS '계약관리시스템 데이터베이스';

-- 3. 연결
\c contract_management

-- 4. 권한 부여
GRANT ALL PRIVILEGES ON SCHEMA public TO cms_admin;
GRANT USAGE ON SCHEMA public TO cms_reader;

-- 향후 생성될 객체에 대한 기본 권한 설정
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON TABLES TO cms_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT ON TABLES TO cms_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON SEQUENCES TO cms_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT USAGE, SELECT ON SEQUENCES TO cms_reader;

-- 완료 메시지
SELECT 'Database and users created successfully!' AS status;

