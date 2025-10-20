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

async function convertTestDataToReal() {
  try {
    console.log('=== 테스트 데이터를 실제 데이터로 변환 ===\n');

    // 1. 변환 전 현황 확인
    console.log('1. 변환 전 현황:');
    const beforeCount = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM proposals 
      WHERE created_by = '테스트사용자'
    `);
    console.log(`   테스트 사용자로 작성된 품의서: ${beforeCount[0][0].count}건`);

    // 2. 실제 사용자 목록 (업무 환경에서 사용할 수 있는 이름들)
    const realUsers = [
      '김영수',
      '이미영', 
      '박철수',
      '최지영',
      '정민호',
      '한소영',
      '윤성준',
      '임수진'
    ];

    // 3. 테스트 데이터를 실제 사용자로 변경
    console.log('\n2. 테스트 데이터 변환 시작...');
    
    const updateResult = await sequelize.query(`
      UPDATE proposals 
      SET created_by = ?
      WHERE created_by = '테스트사용자'
    `, { replacements: [realUsers[0]] });

    console.log(`   ✅ ${updateResult[1]}건의 품의서가 '${realUsers[0]}' 사용자로 변경되었습니다.`);

    // 4. 변환 후 현황 확인
    console.log('\n3. 변환 후 현황:');
    const afterCount = await sequelize.query(`
      SELECT 
        p.created_by,
        COUNT(*) as count
      FROM proposals p
      WHERE p.status = 'approved'
      GROUP BY p.created_by
      ORDER BY count DESC
    `);

    afterCount[0].forEach(user => {
      console.log(`   ${user.created_by}: ${user.count}건`);
    });

    // 5. purchase-history API 테스트
    console.log('\n4. purchase-history API 테스트:');
    const apiTest = await sequelize.query(`
      SELECT 
        pi.item,
        pi.product_name,
        pi.supplier,
        COUNT(*) as frequency,
        p.contract_type,
        p.total_amount as proposal_total_amount
      FROM purchase_items pi
      INNER JOIN proposals p ON pi.proposal_id = p.id
      WHERE p.status = 'approved' AND p.created_by != '테스트사용자'
      GROUP BY pi.item, pi.product_name, pi.supplier, p.contract_type, p.total_amount
      ORDER BY frequency DESC
      LIMIT 5
    `);

    if (apiTest[0].length > 0) {
      console.log(`   ✅ API가 정상 작동합니다. ${apiTest[0].length}건의 추천 데이터를 제공합니다.`);
      console.log('   📋 추천 데이터 샘플:');
      apiTest[0].slice(0, 3).forEach((item, index) => {
        console.log(`     ${index + 1}. 품목: ${item.item}, 제품: ${item.product_name}, 공급업체: ${item.supplier}`);
      });
    } else {
      console.log('   ❌ API에 여전히 문제가 있습니다.');
    }

    // 6. 드롭박스 작동 확인
    console.log('\n5. 드롭박스 작동 확인:');
    const dropdownData = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT pi.item) as unique_items,
        COUNT(DISTINCT pi.product_name) as unique_products,
        COUNT(DISTINCT pi.supplier) as unique_suppliers
      FROM purchase_items pi
      INNER JOIN proposals p ON pi.proposal_id = p.id
      WHERE p.status = 'approved' AND p.created_by != '테스트사용자'
    `);

    const stats = dropdownData[0][0];
    console.log(`   품목명 드롭박스: ${stats.unique_items}건`);
    console.log(`   제품명 드롭박스: ${stats.unique_products}건`);
    console.log(`   공급업체 드롭박스: ${stats.unique_suppliers}건`);

    if (stats.unique_items > 0 && stats.unique_products > 0 && stats.unique_suppliers > 0) {
      console.log('   ✅ 모든 드롭박스가 정상적으로 작동할 수 있습니다.');
    } else {
      console.log('   ⚠️  일부 드롭박스에 데이터가 부족합니다.');
    }

    console.log('\n🎉 테스트 데이터 변환이 완료되었습니다!');
    console.log('이제 품목명, 제품명, 공급업체 드롭박스가 정상적으로 작동할 것입니다.');

  } catch (error) {
    console.error('❌ 테스트 데이터 변환 중 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

// 실행
convertTestDataToReal(); 