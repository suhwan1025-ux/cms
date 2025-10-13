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

async function addContractMethods() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 계약방식 데이터 추가 (테이블은 이미 존재)
    console.log('🌱 계약방식 데이터 추가...');
    await sequelize.query(`
      INSERT INTO contract_methods (code, name, value, basis, description, is_active) 
      VALUES 
        ('CM01', '수의계약', 'direct', '사내규정 제3조 - 1천만원 이하 계약', '1천만원 이하의 계약은 수의계약으로 진행', true),
        ('CM02', '입찰계약', 'bidding', '사내규정 제5조 - 1천만원 초과 계약', '1천만원 초과 계약은 입찰을 통한 계약', true),
        ('CM03', '최저가계약', 'lowest', '사내규정 제7조 - 3개 업체 이상 견적 비교', '3개 이상 업체의 견적을 비교하여 최저가 업체와 계약', true)
      ON CONFLICT (code) DO NOTHING;
    `);
    console.log('✅ 계약방식 데이터 추가 완료');
    
    // 추가된 데이터 확인
    console.log('📋 계약방식 데이터 확인...');
    const [methods] = await sequelize.query('SELECT * FROM contract_methods ORDER BY id;');
    console.log(`계약방식 수: ${methods.length}개`);
    methods.forEach(method => {
      console.log(`   - ${method.name} (${method.value}): ${method.basis}`);
    });
    
    console.log('✅ 계약방식 데이터 설정 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

addContractMethods(); 