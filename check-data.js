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

async function checkData() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 부서 데이터 확인
    console.log('\n📋 부서 데이터 확인...');
    const [departments] = await sequelize.query('SELECT * FROM departments ORDER BY id;');
    console.log(`부서 수: ${departments.length}개`);
    departments.forEach(dept => {
      console.log(`   - ${dept.name} (${dept.code}) - ${dept.manager}`);
    });
    
    // 공급업체 데이터 확인
    console.log('\n📋 공급업체 데이터 확인...');
    const [suppliers] = await sequelize.query('SELECT * FROM suppliers ORDER BY id;');
    console.log(`공급업체 수: ${suppliers.length}개`);
    suppliers.forEach(supplier => {
      console.log(`   - ${supplier.name} (${supplier.credit_rating}등급) - ${supplier.business_type}`);
    });
    
    // 예산 데이터 확인
    console.log('\n📋 예산 데이터 확인...');
    const [budgets] = await sequelize.query('SELECT * FROM budgets ORDER BY id;');
    console.log(`예산 수: ${budgets.length}개`);
    budgets.forEach(budget => {
      console.log(`   - ${budget.name}: ${budget.total_amount.toLocaleString()}원 (잔여: ${budget.remaining_amount.toLocaleString()}원)`);
    });
    
    // 품의서 데이터 확인
    console.log('\n📋 품의서 데이터 확인...');
    const [proposals] = await sequelize.query('SELECT * FROM proposals ORDER BY id;');
    console.log(`품의서 수: ${proposals.length}개`);
    
    // 구매품목 데이터 확인
    console.log('\n📋 구매품목 데이터 확인...');
    const [purchaseItems] = await sequelize.query('SELECT * FROM purchase_items ORDER BY id;');
    console.log(`구매품목 수: ${purchaseItems.length}개`);
    
    // 용역항목 데이터 확인
    console.log('\n📋 용역항목 데이터 확인...');
    const [serviceItems] = await sequelize.query('SELECT * FROM service_items ORDER BY id;');
    console.log(`용역항목 수: ${serviceItems.length}개`);
    
    // 비용귀속부서 데이터 확인
    console.log('\n📋 비용귀속부서 데이터 확인...');
    const [costDepartments] = await sequelize.query('SELECT * FROM cost_departments ORDER BY id;');
    console.log(`비용귀속부서 수: ${costDepartments.length}개`);
    
    // 결재라인 데이터 확인
    console.log('\n📋 결재라인 데이터 확인...');
    const [approvalLines] = await sequelize.query('SELECT * FROM approval_lines ORDER BY id;');
    console.log(`결재라인 수: ${approvalLines.length}개`);
    
    // 계약 데이터 확인
    console.log('\n📋 계약 데이터 확인...');
    const [contracts] = await sequelize.query('SELECT * FROM contracts ORDER BY id;');
    console.log(`계약 수: ${contracts.length}개`);
    
    console.log('\n✅ 데이터 확인 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkData(); 