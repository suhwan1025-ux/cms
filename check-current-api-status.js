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

async function checkCurrentAPIStatus() {
  try {
    console.log('=== 현재 purchase-history API 상태 확인 ===\n');

    // 1. 전체 품의서 현황
    console.log('1. 전체 품의서 현황:');
    const allProposals = await sequelize.query(`
      SELECT 
        p.id,
        p.status,
        p.created_by,
        p.contract_type,
        p.purpose,
        COUNT(pi.id) as purchase_items_count
      FROM proposals p
      LEFT JOIN purchase_items pi ON p.id = pi.proposal_id
      GROUP BY p.id, p.status, p.created_by, p.contract_type, p.purpose
      ORDER BY p.id
    `);

    console.log(`   총 품의서: ${allProposals[0].length}건`);
    
    const statusCounts = {};
    allProposals[0].forEach(proposal => {
      statusCounts[proposal.status] = (statusCounts[proposal.status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`     ${status}: ${count}건`);
    });

    // 2. 승인된 품의서 현황
    console.log('\n2. 승인된 품의서 현황:');
    const approvedProposals = await sequelize.query(`
      SELECT 
        p.id,
        p.created_by,
        p.contract_type,
        p.purpose,
        COUNT(pi.id) as purchase_items_count
      FROM proposals p
      LEFT JOIN purchase_items pi ON p.id = pi.proposal_id
      WHERE p.status = 'approved'
      GROUP BY p.id, p.created_by, p.contract_type, p.purpose
      ORDER BY p.id
    `);

    console.log(`   승인된 품의서: ${approvedProposals[0].length}건`);
    
    const createdByCounts = {};
    approvedProposals[0].forEach(proposal => {
      createdByCounts[proposal.created_by] = (createdByCounts[proposal.created_by] || 0) + 1;
    });
    
    Object.entries(createdByCounts).forEach(([createdBy, count]) => {
      console.log(`     ${createdBy}: ${count}건`);
    });

    // 3. 구매품목 데이터 현황
    console.log('\n3. 구매품목 데이터 현황:');
    const purchaseItems = await sequelize.query(`
      SELECT 
        COUNT(*) as total_count,
        COUNT(DISTINCT pi.item) as unique_items,
        COUNT(DISTINCT pi.product_name) as unique_products,
        COUNT(DISTINCT pi.supplier) as unique_suppliers
      FROM purchase_items pi
      INNER JOIN proposals p ON pi.proposal_id = p.id
      WHERE p.status = 'approved'
    `);

    const stats = purchaseItems[0][0];
    console.log(`   총 구매품목: ${stats.total_count}건`);
    console.log(`   고유 품목명: ${stats.unique_items}건`);
    console.log(`   고유 제품명: ${stats.unique_products}건`);
    console.log(`   고유 공급업체: ${stats.unique_suppliers}건`);

    // 4. 테스트 데이터 제외 후 데이터 현황
    console.log('\n4. 테스트 데이터 제외 후 데이터 현황:');
    const realData = await sequelize.query(`
      SELECT 
        COUNT(*) as total_count,
        COUNT(DISTINCT pi.item) as unique_items,
        COUNT(DISTINCT pi.product_name) as unique_products,
        COUNT(DISTINCT pi.supplier) as unique_suppliers
      FROM purchase_items pi
      INNER JOIN proposals p ON pi.proposal_id = p.id
      WHERE p.status = 'approved' AND p.created_by != '테스트사용자'
    `);

    const realStats = realData[0][0];
    console.log(`   총 구매품목: ${realStats.total_count}건`);
    console.log(`   고유 품목명: ${realStats.unique_items}건`);
    console.log(`   고유 제품명: ${realStats.unique_products}건`);
    console.log(`   고유 공급업체: ${realStats.unique_suppliers}건`);

    // 5. 문제 진단 및 해결 방안
    console.log('\n5. 문제 진단 및 해결 방안:');
    
    if (realStats.total_count === 0) {
      console.log('   ❌ 문제: 테스트 데이터 제외 후 실제 데이터가 없습니다.');
      console.log('   🔧 해결 방안:');
      console.log('      A. 테스트 데이터를 실제 데이터로 변경');
      console.log('      B. API 필터링 조건 완화');
      console.log('      C. 실제 업무 데이터 추가');
    } else if (realStats.total_count < 5) {
      console.log('   ⚠️  경고: 실제 데이터가 매우 적습니다.');
      console.log('   🔧 해결 방안: 실제 업무 데이터를 추가하거나 테스트 데이터를 활용');
    } else {
      console.log('   ✅ 정상: 충분한 실제 데이터가 있습니다.');
    }

    // 6. 즉시 해결을 위한 테스트 데이터 활성화 방안
    console.log('\n6. 즉시 해결을 위한 방안:');
    console.log('   A. 테스트 데이터를 실제 사용자로 변경');
    console.log('   B. API에서 created_by 필터링 조건 완화');
    console.log('   C. 일부 테스트 데이터를 실제 데이터로 마이그레이션');

  } catch (error) {
    console.error('❌ API 상태 확인 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 실행
checkCurrentAPIStatus(); 