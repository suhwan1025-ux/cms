-- proposals 테이블에 original_proposal_id 컬럼 추가
-- 정정 기능을 위한 원본 품의서 ID 저장

-- 컬럼이 이미 있는지 확인
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'proposals' 
        AND column_name = 'original_proposal_id'
    ) THEN
        ALTER TABLE proposals 
        ADD COLUMN original_proposal_id INTEGER NULL;
        
        -- 외래키 제약조건 추가 (선택사항)
        ALTER TABLE proposals 
        ADD CONSTRAINT fk_proposals_original_proposal 
        FOREIGN KEY (original_proposal_id) 
        REFERENCES proposals(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
        
        -- 코멘트 추가
        COMMENT ON COLUMN proposals.original_proposal_id IS '원본 품의서 ID (정정된 경우)';
        
        RAISE NOTICE '✅ proposals 테이블에 original_proposal_id 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE '⚠️ original_proposal_id 컬럼이 이미 존재합니다.';
    END IF;
END $$;

