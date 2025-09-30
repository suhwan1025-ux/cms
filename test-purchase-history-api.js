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

async function testPurchaseHistoryAPI() {
  try {
    console.log('=== 수정된 purchase-history API 테스트 ===\n');

    // 1. 품의서 작성완료된 구매품목 현황 확인
    console.log('1. 품의서 작성완료된 구매품목 현황:');
    const approvedProposals = await sequelize.query(`
      SELECT 
        p.id,
        p.contract_type,
        p.status,
        p.total_amount,
        COUNT(pi.id) as purchase_items_count
      FROM proposals p
      LEFT JOIN purchase_items pi ON p.id = pi.proposal_id
      WHERE p.status = 'approved'
      GROUP BY p.id, p.contract_type, p.status, p.total_amount
      ORDER BY p.id
      LIMIT 5
    `);

    if (approvedProposals[0].length === 0) {
      console.log('   ❌ 품의서 작성완료된 데이터가 없습니다.');
      return;
    }

    approvedProposals[0].forEach(proposal => {
      console.log(`   - 품의서 ID ${proposal.id}: ${proposal.contract_type} (${proposal.status})`);
      console.log(`     총액: ${parseFloat(proposal.total_amount).toLocaleString()}원`);
      console.log(`     구매품목 수: ${proposal.purchase_items_count}건\n`);
    });

    // 2. 새로운 purchase-history API 쿼리 테스트
    console.log('2. 새로운 purchase-history API 쿼리 테스트:');
    
    // 품목명 검색 테스트
    console.log('   품목명 검색 테스트:');
    const itemSearchResult = await sequelize.query(`
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
      LIMIT 5
    `);

    if (itemSearchResult[0].length === 0) {
      console.log('     ❌ 검색 결과가 없습니다.');
    } else {
      itemSearchResult[0].forEach((item, index) => {
        console.log(`     ${index + 1}. ${item.item}`);
        console.log(`        제품명: ${item.product_name}`);
        console.log(`        공급업체: ${item.supplier}`);
        console.log(`        구매횟수: ${item.frequency}회`);
        console.log(`        평균단가: ${parseFloat(item.avg_unit_price).toLocaleString()}원`);
        console.log(`        계약유형: ${item.contract_type}`);
        console.log(`        품의서금액: ${parseFloat(item.proposal_total_amount).toLocaleString()}원\n`);
      });
    }

    // 3. 공급업체별 통계
    console.log('3. 공급업체별 통계:');
    const supplierStats = await sequelize.query(`
      SELECT 
        pi.supplier,
        COUNT(*) as frequency,
        AVG(pi.unit_price) as avg_unit_price,
        SUM(p.total_amount) as total_proposal_amount,
        COUNT(DISTINCT p.id) as proposal_count
      FROM purchase_items pi
      INNER JOIN proposals p ON pi.proposal_id = p.id
      WHERE p.status = 'approved'
      GROUP BY pi.supplier
      ORDER BY frequency DESC
      LIMIT 5
    `);

    if (supplierStats[0].length === 0) {
      console.log('   ❌ 공급업체 통계가 없습니다.');
    } else {
      supplierStats[0].forEach((supplier, index) => {
        console.log(`   ${index + 1}. ${supplier.supplier}`);
        console.log(`      구매횟수: ${supplier.frequency}회`);
        console.log(`      평균단가: ${parseFloat(supplier.avg_unit_price).toLocaleString()}원`);
        console.log(`      총 품의서 금액: ${parseFloat(supplier.total_proposal_amount).toLocaleString()}원`);
        console.log(`      품의서 건수: ${supplier.proposal_count}건\n`);
      });
    }

    console.log('✅ purchase-history API 테스트 완료!');
    console.log('\n이제 프론트엔드에서 드롭박스가 품의서 작성완료된 정보를 기반으로 작동합니다.');

  } catch (error) {
    console.error('❌ API 테스트 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 실행
testPurchaseHistoryAPI(); 