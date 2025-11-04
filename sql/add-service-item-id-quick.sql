-- cost_departments 테이블에 service_item_id 칼럼 추가
ALTER TABLE cost_departments 
ADD COLUMN IF NOT EXISTS service_item_id INTEGER;

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_cost_departments_service_item_id 
ON cost_departments(service_item_id);

-- 컬럼 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cost_departments' 
AND column_name = 'service_item_id';



