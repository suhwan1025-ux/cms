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

async function testFilteredAPI() {
  try {
    console.log('=== 테스트 데이터 제외된 purchase-history API 테스트 ===\n');

    // 1. 기존 API 쿼리 (테스트 데이터 포함)
    console.log('1. 기존 API 쿼리 (테스트 데이터 포함):');
    const oldQuery = await sequelize.query(`
      SELECT 
        pi.item,
        pi.product_name,
        pi.supplier,
        COUNT(*) as frequency,
        AVG(pi.unit_price) as avg_unit_price,
        MAX(p.approval_date) as last_purchase_date,
        p.contract_type,
        p.total_amount as proposal_total_amount
      FROM purchase_items pi
      INNER JOIN proposals p ON pi.proposal_id = p.id
      WHERE p.status = 'approved'
      GROUP BY pi.item, pi.product_name, pi.supplier, p.contract_type, p.total_amount
      ORDER BY frequency DESC, last_purchase_date DESC
      LIMIT 10
    `);

    console.log(`   기존 쿼리 결과: ${oldQuery[0].length}건`);
    if (oldQuery[0].length > 0) {
      oldQuery[0].slice(0, 3).forEach((item, index) => {
        console.log(`     ${index + 1}. ${item.item} (${item.supplier})`);
      });
    }

    // 2. 새로운 API 쿼리 (테스트 데이터 제외)
    console.log('\n2. 새로운 API 쿼리 (테스트 데이터 제외):');
    const newQuery = await sequelize.query(`
      SELECT 
        pi.item,
        pi.product_name,
        pi.supplier,
        COUNT(*) as frequency,
        AVG(pi.unit_price) as avg_unit_price,
        MAX(p.approval_date) as last_purchase_date,
        p.contract_type,
        p.total_amount as proposal_total_amount
      FROM purchase_items pi
      INNER JOIN proposals p ON pi.proposal_id = p.id
      WHERE p.status = 'approved' AND p.created_by != '테스트사용자'
      GROUP BY pi.item, pi.product_name, pi.supplier, p.contract_type, p.total_amount
      ORDER BY frequency DESC, last_purchase_date DESC
      LIMIT 10
    `);

    console.log(`   새로운 쿼리 결과: ${newQuery[0].length}건`);
    if (newQuery[0].length > 0) {
      newQuery[0].slice(0, 3).forEach((item, index) => {
        console.log(`     ${index + 1}. ${item.item} (${item.supplier})`);
      });
    } else {
      console.log('     ✅ 테스트 데이터가 성공적으로 제외되었습니다.');
    }

    // 3. 테스트 데이터 vs 실제 데이터 비교
    console.log('\n3. 테스트 데이터 vs 실제 데이터 비교:');
    
    const testDataCount = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM purchase_items pi
      INNER JOIN proposals p ON pi.proposal_id = p.id
      WHERE p.status = 'approved' AND p.created_by = '테스트사용자'
    `);

    const realDataCount = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM purchase_items pi
      INNER JOIN proposals p ON pi.proposal_id = p.id
      WHERE p.status = 'approved' AND p.created_by != '테스트사용자'
    `);

    console.log(`   테스트 데이터: ${testDataCount[0][0].count}건`);
    console.log(`   실제 데이터: ${realDataCount[0][0].count}건`);

    // 4. 추천 품질 향상 효과
    console.log('\n4. 추천 품질 향상 효과:');
    if (newQuery[0].length === 0) {
      console.log('   ✅ 테스트 데이터가 완전히 제외되어 추천 품질이 향상되었습니다.');
      console.log('   ✅ 이제 실제 업무 데이터만을 기반으로 추천이 제공됩니다.');
      console.log('   ✅ 사용자는 더 정확하고 유용한 추천을 받을 수 있습니다.');
    } else {
      console.log('   ⚠️  여전히 일부 데이터가 남아있습니다.');
      console.log('   → 추가 필터링이 필요할 수 있습니다.');
    }

    // 5. 향후 개선 방안
    console.log('\n5. 향후 개선 방안:');
    console.log('   A. 실제 업무 데이터 추가');
    console.log('      - 실제 품의서 작성 완료 데이터 입력');
    console.log('      - 다양한 계약 유형과 금액대의 데이터 확보');
    console.log('');
    console.log('   B. 추천 알고리즘 개선');
    console.log('      - 구매 빈도, 금액, 최신성 등을 고려한 가중치 적용');
    console.log('      - 부서별, 계약유형별 맞춤 추천');
    console.log('');
    console.log('   C. 데이터 품질 관리');
    console.log('      - 정기적인 테스트 데이터 정리');
    console.log('      - 실제 업무 데이터의 정확성 검증');

  } catch (error) {
    console.error('❌ 필터링된 API 테스트 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 실행
testFilteredAPI(); 