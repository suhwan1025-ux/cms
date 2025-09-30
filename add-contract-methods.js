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
    
    // 계약방식 테이블 생성
    console.log('🔄 계약방식 테이블 생성...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS contract_methods (
        id SERIAL PRIMARY KEY,
        value VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        regulation TEXT NOT NULL,
        min_amount DECIMAL(15,2),
        max_amount DECIMAL(15,2),
        is_active BOOLEAN DEFAULT true,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ contract_methods 테이블 생성 완료');
    
    // 계약방식 데이터 추가
    console.log('🌱 계약방식 데이터 추가...');
    await sequelize.query(`
      INSERT INTO contract_methods (value, name, regulation, min_amount, max_amount, description) 
      VALUES 
        ('direct', '수의계약', '사내규정 제3조 - 1천만원 이하 계약', 0, 10000000, '1천만원 이하의 계약은 수의계약으로 진행'),
        ('bidding', '입찰계약', '사내규정 제5조 - 1천만원 초과 계약', 10000000, 999999999999, '1천만원 초과 계약은 입찰을 통한 계약'),
        ('lowest', '최저가계약', '사내규정 제7조 - 3개 업체 이상 견적 비교', 0, 999999999999, '3개 이상 업체의 견적을 비교하여 최저가 업체와 계약')
      ON CONFLICT (value) DO NOTHING;
    `);
    console.log('✅ 계약방식 데이터 추가 완료');
    
    // 추가된 데이터 확인
    console.log('📋 계약방식 데이터 확인...');
    const [methods] = await sequelize.query('SELECT * FROM contract_methods ORDER BY id;');
    console.log(`계약방식 수: ${methods.length}개`);
    methods.forEach(method => {
      console.log(`   - ${method.name} (${method.value}): ${method.regulation}`);
    });
    
    console.log('✅ 계약방식 데이터 설정 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

addContractMethods(); 