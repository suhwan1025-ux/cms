const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'contract_management',
  process.env.DB_USERNAME || 'postgres',
  process.env.DB_PASSWORD || 'meritz123!',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function checkPurchaseItems() {
  try {
    console.log('🔍 구매품목 데이터 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 구매품목 데이터 확인
    console.log('\n📋 구매품목 데이터 확인...');
    const [purchaseItems] = await sequelize.query('SELECT * FROM purchase_items ORDER BY id;');
    console.log(`구매품목 수: ${purchaseItems.length}개`);
    
    if (purchaseItems.length > 0) {
      console.log('\n📦 구매품목 상세:');
      purchaseItems.forEach((item, index) => {
        console.log(`\n${index + 1}. 구매품목 #${item.id}:`);
        console.log(`   - 품목명: ${item.item}`);
        console.log(`   - 제품명: ${item.product_name}`);
        console.log(`   - 수량: ${item.quantity}`);
        console.log(`   - 단가: ${item.unit_price?.toLocaleString()}원`);
        console.log(`   - 금액: ${item.amount?.toLocaleString()}원`);
        console.log(`   - 공급업체: ${item.supplier}`);
        console.log(`   - 요청부서: ${item.request_department}`);
        console.log(`   - 생성일: ${item.created_at}`);
      });
    } else {
      console.log('❌ 구매품목 데이터가 없습니다.');
    }
    
    // 구매품목 통계
    console.log('\n📊 구매품목 통계:');
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(DISTINCT item) as unique_items,
        COUNT(DISTINCT product_name) as unique_products,
        COUNT(DISTINCT supplier) as unique_suppliers,
        SUM(amount) as total_amount,
        AVG(unit_price) as avg_unit_price
      FROM purchase_items
    `);
    
    if (stats[0]) {
      const stat = stats[0];
      console.log(`   - 총 구매품목 수: ${stat.total_items}개`);
      console.log(`   - 고유 품목 수: ${stat.unique_items}개`);
      console.log(`   - 고유 제품 수: ${stat.unique_products}개`);
      console.log(`   - 고유 공급업체 수: ${stat.unique_suppliers}개`);
      console.log(`   - 총 구매금액: ${stat.total_amount?.toLocaleString()}원`);
      console.log(`   - 평균 단가: ${stat.avg_unit_price?.toLocaleString()}원`);
    }
    
    // 품목별 구매 빈도
    console.log('\n🏆 품목별 구매 빈도 (상위 10개):');
    const [frequentItems] = await sequelize.query(`
      SELECT 
        item,
        COUNT(*) as frequency,
        AVG(unit_price) as avg_unit_price,
        SUM(amount) as total_amount
      FROM purchase_items 
      GROUP BY item 
      ORDER BY frequency DESC 
      LIMIT 10
    `);
    
    frequentItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.item} (${item.frequency}회 구매, 평균단가: ${item.avg_unit_price?.toLocaleString()}원)`);
    });
    
    // 공급업체별 구매 빈도
    console.log('\n🏢 공급업체별 구매 빈도:');
    const [frequentSuppliers] = await sequelize.query(`
      SELECT 
        supplier,
        COUNT(*) as frequency,
        SUM(amount) as total_amount
      FROM purchase_items 
      WHERE supplier IS NOT NULL AND supplier != ''
      GROUP BY supplier 
      ORDER BY frequency DESC
    `);
    
    frequentSuppliers.forEach((supplier, index) => {
      console.log(`   ${index + 1}. ${supplier.supplier} (${supplier.frequency}회 거래, 총액: ${supplier.total_amount?.toLocaleString()}원)`);
    });
    
    console.log('\n✅ 구매품목 데이터 확인 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkPurchaseItems(); 