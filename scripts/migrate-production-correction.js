/**
 * 운영 환경에 정정 기능 컬럼을 추가하는 마이그레이션 스크립트
 * 
 * 사용법:
 * NODE_ENV=production node scripts/migrate-production-correction.js
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(color, icon, message) {
  console.log(`${colors[color]}${icon} ${message}${colors.reset}`);
}

async function migrate() {
  console.log('\n' + '='.repeat(60));
  log('cyan', '🚀', '운영 환경 정정 기능 마이그레이션 시작');
  console.log('='.repeat(60) + '\n');

  if (process.env.NODE_ENV !== 'production') {
    log('yellow', '⚠️', '경고: NODE_ENV가 production이 아닙니다!');
    console.log('   운영 환경에 적용하려면: NODE_ENV=production node scripts/migrate-production-correction.js\n');
  }

  const sequelize = new Sequelize(
    process.env.DB_NAME || process.env.DB_USERNAME || 'contract_management',
    process.env.DB_USERNAME || 'postgres',
    process.env.DB_PASSWORD || 'meritz123!',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: console.log
    }
  );

  try {
    await sequelize.authenticate();
    log('green', '✅', '데이터베이스 연결 성공\n');

    // 1. 기존 컬럼 확인
    log('cyan', '📋', '1단계: 기존 컬럼 확인');
    const [existingColumns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'proposals'
      AND column_name IN ('original_proposal_id', 'correction_reason');
    `);

    const hasOriginalId = existingColumns.some(c => c.column_name === 'original_proposal_id');
    const hasReason = existingColumns.some(c => c.column_name === 'correction_reason');

    if (hasOriginalId) {
      log('yellow', '⚠️', 'original_proposal_id 컬럼이 이미 존재합니다 (스킵)');
    }
    if (hasReason) {
      log('yellow', '⚠️', 'correction_reason 컬럼이 이미 존재합니다 (스킵)');
    }

    if (hasOriginalId && hasReason) {
      log('green', '✅', '모든 컬럼이 이미 존재합니다. 마이그레이션이 필요하지 않습니다.\n');
      await sequelize.close();
      return;
    }

    // 2. 트랜잭션 시작
    log('cyan', '🔄', '\n2단계: 컬럼 추가 (트랜잭션 시작)');
    const transaction = await sequelize.transaction();

    try {
      // 3. original_proposal_id 추가
      if (!hasOriginalId) {
        log('cyan', '📝', '  original_proposal_id 컬럼 추가 중...');
        await sequelize.query(`
          ALTER TABLE proposals 
          ADD COLUMN original_proposal_id INTEGER;
        `, { transaction });
        
        await sequelize.query(`
          COMMENT ON COLUMN proposals.original_proposal_id 
          IS '원본 품의서 ID (정정된 경우)';
        `, { transaction });
        
        // 외래 키 제약조건 추가 (선택사항 - 에러 발생 시 주석 처리)
        try {
          await sequelize.query(`
            ALTER TABLE proposals 
            ADD CONSTRAINT fk_proposals_original 
            FOREIGN KEY (original_proposal_id) 
            REFERENCES proposals(id) 
            ON UPDATE CASCADE 
            ON DELETE SET NULL;
          `, { transaction });
          log('green', '  ✅', 'original_proposal_id 컬럼 및 외래 키 추가 완료');
        } catch (fkError) {
          log('yellow', '  ⚠️', '외래 키 제약조건 추가 실패 (컬럼은 추가됨)');
          log('yellow', '     ', fkError.message);
        }
      }

      // 4. correction_reason 추가
      if (!hasReason) {
        log('cyan', '📝', '  correction_reason 컬럼 추가 중...');
        await sequelize.query(`
          ALTER TABLE proposals 
          ADD COLUMN correction_reason TEXT;
        `, { transaction });
        
        await sequelize.query(`
          COMMENT ON COLUMN proposals.correction_reason 
          IS '정정 사유';
        `, { transaction });
        
        log('green', '  ✅', 'correction_reason 컬럼 추가 완료');
      }

      // 5. 커밋
      await transaction.commit();
      log('green', '✅', '트랜잭션 커밋 완료\n');

      // 6. 결과 확인
      log('cyan', '📋', '3단계: 최종 확인');
      const [finalColumns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'proposals'
        AND column_name IN ('original_proposal_id', 'correction_reason')
        ORDER BY column_name;
      `);

      console.log('\n   추가된 컬럼:');
      finalColumns.forEach(col => {
        log('green', '  ✅', `${col.column_name} (${col.data_type}, NULL: ${col.is_nullable})`);
      });

      console.log('\n' + '='.repeat(60));
      log('green', '🎉', '마이그레이션 성공!');
      console.log('='.repeat(60));
      console.log('\n다음 단계:');
      console.log('1. 서버 재시작: pm2 restart server');
      console.log('2. 프론트엔드 재빌드 (필요시): npm run build');
      console.log('3. 기능 테스트: 정정 품의서 생성 후 DB 확인');
      console.log('\n');

    } catch (error) {
      await transaction.rollback();
      log('red', '❌', '트랜잭션 롤백됨');
      throw error;
    }

    await sequelize.close();
  } catch (error) {
    log('red', '❌', '마이그레이션 실패: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

// 실행 전 확인
console.log('\n⚠️  이 스크립트는 운영 데이터베이스를 변경합니다!');
console.log('환경: ' + (process.env.NODE_ENV || 'development'));
console.log('DB: ' + (process.env.DB_NAME || process.env.DB_USERNAME || 'contract_management'));
console.log('Host: ' + (process.env.DB_HOST || 'localhost'));
console.log('\n5초 후 시작합니다... (Ctrl+C로 취소)');

setTimeout(migrate, 5000);

