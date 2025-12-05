-- proposals 테이블에 correction_reason 컬럼 추가
-- 정정 품의서의 정정 사유를 저장하기 위한 컬럼

-- 컬럼 추가
ALTER TABLE proposals 
ADD COLUMN correction_reason TEXT 
COMMENT '정정 사유';

-- 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'proposals' 
AND column_name = 'correction_reason';

-- 완료 메시지
SELECT '✅ correction_reason 컬럼 추가 완료' as result;

