const { Sequelize } = require('sequelize');

// 데이터베이스 연결
const sequelize = new Sequelize(
  'contract_management',
  'postgres',
  'meritz123!',
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function checkTestDataCleanup() {
  try {
    console.log('=== 테스트 데이터 현황 및 정리 방안 ===\n');

    // 1. 품의서 작성완료된 데이터 현황
    console.log('1. 품의서 작성완료된 데이터 현황:');
    const approvedProposals = await sequelize.query(`
      SELECT 
        p.id,
        p.contract_type,
        p.purpose,
        p.total_amount,
        p.created_by,
        p.created_at,
        COUNT(pi.id) as purchase_items_count
      FROM proposals p
      LEFT JOIN purchase_items pi ON p.id = pi.proposal_id
      WHERE p.status = 'approved'
      GROUP BY p.id, p.contract_type, p.purpose, p.total_amount, p.created_by, p.created_at
      ORDER BY p.id
    `);

    if (approvedProposals[0].length === 0) {
      console.log('   ❌ 품의서 작성완료된 데이터가 없습니다.');
      return;
    }

    console.log(`   총 ${approvedProposals[0].length}건의 품의서가 있습니다.\n`);

    // 2. 테스트 데이터 식별
    console.log('2. 테스트 데이터 식별:');
    const testData = approvedProposals[0].filter(proposal => 
      proposal.created_by === '테스트사용자' || 
      proposal.purpose.includes('2025년') ||
      proposal.purpose.includes('테스트')
    );

    const realData = approvedProposals[0].filter(proposal => 
      proposal.created_by !== '테스트사용자' && 
      !proposal.purpose.includes('2025년') &&
      !proposal.purpose.includes('테스트')
    );

    console.log(`   테스트 데이터: ${testData.length}건`);
    console.log(`   실제 데이터: ${realData.length}건\n`);

    // 3. 테스트 데이터 상세
    if (testData.length > 0) {
      console.log('3. 테스트 데이터 상세:');
      testData.forEach((proposal, index) => {
        console.log(`   ${index + 1}. ID ${proposal.id}: ${proposal.purpose}`);
        console.log(`      계약유형: ${proposal.contract_type}`);
        console.log(`      금액: ${parseFloat(proposal.total_amount).toLocaleString()}원`);
        console.log(`      작성자: ${proposal.created_by}`);
        console.log(`      작성일: ${proposal.created_at}`);
        console.log(`      구매품목: ${proposal.purchase_items_count}건\n`);
      });
    }

    // 4. 실제 데이터 상세 (샘플)
    if (realData.length > 0) {
      console.log('4. 실제 데이터 상세 (최근 5건):');
      realData.slice(0, 5).forEach((proposal, index) => {
        console.log(`   ${index + 1}. ID ${proposal.id}: ${proposal.purpose}`);
        console.log(`      계약유형: ${proposal.contract_type}`);
        console.log(`      금액: ${parseFloat(proposal.total_amount).toLocaleString()}원`);
        console.log(`      작성자: ${proposal.created_by}`);
        console.log(`      작성일: ${proposal.created_at}`);
        console.log(`      구매품목: ${proposal.purchase_items_count}건\n`);
      });
    }

    // 5. 정리 방안 제시
    console.log('5. 정리 방안:');
    console.log('   A. 테스트 데이터 완전 삭제');
    console.log('      - 장점: 깔끔한 데이터베이스');
    console.log('      - 단점: 테스트 환경 재구성 필요');
    console.log('');
    console.log('   B. 테스트 데이터 비활성화');
    console.log('      - 장점: 데이터 보존, 필요시 재활용 가능');
    console.log('      - 단점: 데이터베이스 용량 증가');
    console.log('');
    console.log('   C. API 필터링 강화');
    console.log('      - 장점: 기존 데이터 유지하면서 추천 품질 향상');
    console.log('      - 단점: 복잡한 쿼리, 성능 영향');

    // 6. 추천 정리 방안
    console.log('\n6. 추천 정리 방안:');
    if (testData.length > 10) {
      console.log('   → 테스트 데이터가 많으므로 완전 삭제를 권장합니다.');
      console.log('   → 실제 업무 환경에서는 테스트 데이터가 추천 품질을 저하시킵니다.');
    } else if (testData.length > 5) {
      console.log('   → 테스트 데이터를 비활성화하고 API 필터링을 강화합니다.');
      console.log('   → created_by 필드로 테스트 데이터를 구분하여 제외합니다.');
    } else {
      console.log('   → 테스트 데이터가 적으므로 API 필터링만 강화합니다.');
      console.log('   → created_by 필드로 테스트 데이터를 구분하여 제외합니다.');
    }

  } catch (error) {
    console.error('❌ 테스트 데이터 확인 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 실행
checkTestDataCleanup(); 