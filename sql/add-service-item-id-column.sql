-- cost_departments 테이블에 service_item_id 컬럼 추가
ALTER TABLE cost_departments 
ADD COLUMN IF NOT EXISTS service_item_id INTEGER;

-- 외래키 제약조건 추가
ALTER TABLE cost_departments
ADD CONSTRAINT fk_cost_departments_service_item
FOREIGN KEY (service_item_id) 
REFERENCES service_items(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN cost_departments.service_item_id IS '용역품목 ID (용역품목별 비용분배인 경우)';

SELECT '✅ cost_departments 테이블에 service_item_id 컬럼이 추가되었습니다.' AS result;

