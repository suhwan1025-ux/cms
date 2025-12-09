/**
 * 운영 환경의 정정 기능 상태를 체크하는 스크립트
 * 
 * 사용법:
 * NODE_ENV=production node scripts/check-production-correction.js
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, icon, message) {
  console.log(`${colors[color]}${icon} ${message}${colors.reset}`);
}

async function checkProduction() {
  console.log('\n' + '='.repeat(60));
  log('cyan', '🔍', '운영 환경 정정 기능 상태 점검');
  console.log('='.repeat(60) + '\n');

  // 환경 변수 확인
  log('blue', '📋', '1단계: 환경 설정 확인');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || '(없음)'}`);
  console.log(`   DB_NAME: ${process.env.DB_NAME || process.env.DB_USERNAME || 'contract_management'}`);
  console.log(`   DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   DB_PORT: ${process.env.DB_PORT || 5432}`);
  
  if (process.env.NODE_ENV !== 'production') {
    log('yellow', '⚠️', '경고: NODE_ENV가 production이 아닙니다!');
    console.log('   운영 환경을 체크하려면: NODE_ENV=production node scripts/check-production-correction.js\n');
  }

  // 데이터베이스 연결
  const sequelize = new Sequelize(
    process.env.DB_NAME || process.env.DB_USERNAME || 'contract_management',
    process.env.DB_USERNAME || 'postgres',
    process.env.DB_PASSWORD || 'meritz123!',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false
    }
  );

  try {
    await sequelize.authenticate();
    log('green', '✅', '데이터베이스 연결 성공\n');

    // 컬럼 존재 여부 확인
    log('blue', '📋', '2단계: DB 컬럼 존재 여부 확인');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'proposals'
      AND column_name IN ('original_proposal_id', 'correction_reason')
      ORDER BY column_name;
    `);

    if (columns.length === 0) {
      log('red', '❌', 'original_proposal_id와 correction_reason 컬럼이 없습니다!');
      log('yellow', '💡', '해결 방법: 마이그레이션을 실행하세요');
      console.log(`
   실행 명령:
   1) Sequelize CLI 사용:
      NODE_ENV=production npx sequelize-cli db:migrate
   
   2) 수동 SQL 실행:
      ALTER TABLE proposals ADD COLUMN original_proposal_id INTEGER;
      ALTER TABLE proposals ADD COLUMN correction_reason TEXT;
   
   3) Node 스크립트 실행:
      node migrations/20251205-add-original-proposal-id.js
      node migrations/20251205-add-correction-reason.js
      `);
    } else {
      const columnNames = columns.map(c => c.column_name);
      
      if (columnNames.includes('original_proposal_id')) {
        log('green', '✅', 'original_proposal_id 컬럼 존재');
      } else {
        log('red', '❌', 'original_proposal_id 컬럼 없음');
      }
      
      if (columnNames.includes('correction_reason')) {
        log('green', '✅', 'correction_reason 컬럼 존재');
      } else {
        log('red', '❌', 'correction_reason 컬럼 없음');
      }
      
      if (columns.length === 2) {
        log('green', '✅', '모든 필수 컬럼이 존재합니다!\n');
      }
    }

    // 최근 정정 품의서 확인
    log('blue', '📋', '3단계: 최근 정정 품의서 데이터 확인');
    const [recentCorrections] = await sequelize.query(`
      SELECT 
        id, 
        title, 
        original_proposal_id, 
        CASE 
          WHEN correction_reason IS NULL THEN '(NULL)'
          WHEN correction_reason = '' THEN '(빈 문자열)'
          ELSE LEFT(correction_reason, 50) || CASE WHEN LENGTH(correction_reason) > 50 THEN '...' ELSE '' END
        END as correction_reason_preview,
        status,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
      FROM proposals
      WHERE original_proposal_id IS NOT NULL OR correction_reason IS NOT NULL
      ORDER BY id DESC
      LIMIT 10;
    `);

    if (recentCorrections.length === 0) {
      log('yellow', '⚠️', '정정 품의서 데이터가 없습니다.');
      console.log('   정정 기능이 아직 사용되지 않았거나, 데이터 저장에 문제가 있을 수 있습니다.\n');
    } else {
      log('green', '✅', `최근 정정 품의서 ${recentCorrections.length}개 발견\n`);
      console.log('   ' + '-'.repeat(150));
      console.log('   ID  | 원본ID | 제목                                    | 정정사유                          | 상태     | 생성일시');
      console.log('   ' + '-'.repeat(150));
      recentCorrections.forEach(p => {
        const id = String(p.id).padEnd(4);
        const origId = p.original_proposal_id ? String(p.original_proposal_id).padEnd(6) : '(없음)'.padEnd(6);
        const title = (p.title || '').substring(0, 35).padEnd(35);
        const reason = (p.correction_reason_preview || '(없음)').substring(0, 30).padEnd(30);
        const status = p.status.padEnd(8);
        console.log(`   ${id} | ${origId} | ${title} | ${reason} | ${status} | ${p.created_at}`);
      });
      console.log('   ' + '-'.repeat(150) + '\n');
    }

    // NULL 또는 빈 값 체크
    log('blue', '📋', '4단계: 저장 누락 데이터 확인');
    const [missingData] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM proposals
      WHERE 
        -- 정정 품의서인데 필수 정보가 없는 경우
        (title LIKE '%정정품의%' OR title LIKE '%[정정]%')
        AND (original_proposal_id IS NULL OR correction_reason IS NULL OR correction_reason = '')
    `);

    const missingCount = parseInt(missingData[0].count);
    if (missingCount > 0) {
      log('red', '❌', `정정 정보가 누락된 품의서 ${missingCount}개 발견`);
      
      const [problematicProposals] = await sequelize.query(`
        SELECT 
          id, 
          title,
          original_proposal_id,
          CASE 
            WHEN correction_reason IS NULL THEN 'NULL'
            WHEN correction_reason = '' THEN '빈 문자열'
            ELSE '있음'
          END as correction_reason_status,
          TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
        FROM proposals
        WHERE 
          (title LIKE '%정정품의%' OR title LIKE '%[정정]%')
          AND (original_proposal_id IS NULL OR correction_reason IS NULL OR correction_reason = '')
        ORDER BY id DESC
        LIMIT 10;
      `);
      
      console.log('\n   문제가 있는 품의서:');
      console.log('   ' + '-'.repeat(120));
      console.log('   ID  | 제목                                    | 원본ID | 정정사유     | 생성일시');
      console.log('   ' + '-'.repeat(120));
      problematicProposals.forEach(p => {
        const id = String(p.id).padEnd(4);
        const title = (p.title || '').substring(0, 35).padEnd(35);
        const origId = p.original_proposal_id ? String(p.original_proposal_id).padEnd(6) : 'NULL'.padEnd(6);
        const reason = p.correction_reason_status.padEnd(12);
        console.log(`   ${id} | ${title} | ${origId} | ${reason} | ${p.created_at}`);
      });
      console.log('   ' + '-'.repeat(120) + '\n');
      
      log('yellow', '💡', '이 품의서들은 정정 기능 버그로 생성된 것일 수 있습니다.');
    } else {
      log('green', '✅', '모든 정정 품의서에 필수 정보가 정상적으로 저장되어 있습니다!\n');
    }

    // 요약
    console.log('\n' + '='.repeat(60));
    log('cyan', '📊', '점검 결과 요약');
    console.log('='.repeat(60));
    
    if (columns.length === 2 && missingCount === 0) {
      log('green', '✅', '운영 환경이 정상입니다!');
      console.log('   - DB 컬럼이 모두 존재합니다');
      console.log('   - 정정 데이터가 정상적으로 저장되고 있습니다');
      console.log('\n   만약 최근에 저장이 안 된다면:');
      console.log('   1) 서버 코드가 최신인지 확인 (server.js, ProposalForm.js)');
      console.log('   2) 서버를 재시작했는지 확인 (pm2 restart server)');
      console.log('   3) 프론트엔드를 다시 빌드했는지 확인 (npm run build)');
    } else {
      log('yellow', '⚠️', '운영 환경에 문제가 있습니다.');
      console.log('   위의 해결 방법을 참고하여 조치하세요.');
    }
    console.log('='.repeat(60) + '\n');

    await sequelize.close();
  } catch (error) {
    log('red', '❌', '오류 발생: ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

checkProduction();

