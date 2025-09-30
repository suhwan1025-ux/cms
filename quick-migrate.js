const { Sequelize } = require('sequelize');
require('dotenv').config();

// 현재 데이터베이스 설정
const sequelize = new Sequelize(
  process.env.DB_NAME || 'contract_management',
  process.env.DB_USERNAME || 'postgres',
  process.env.DB_PASSWORD || 'meritz123!',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function quickMigrate() {
  try {
    console.log('🔄 빠른 데이터베이스 설정 시작...');
    
    // 1. 연결 테스트
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 2. 모델 로드 및 동기화
    console.log('📋 모델 동기화 중...');
    const models = require('./src/models');
    
    // 테이블 생성 (기존 데이터 유지)
    await sequelize.sync({ alter: true });
    console.log('✅ 테이블 동기화 완료!');
    
    // 3. 기본 데이터 확인 및 생성
    console.log('🌱 기본 데이터 확인 중...');
    
    const { Budget, Department, Supplier, ContractMethod } = models;
    
    // 부서 데이터
    const deptCount = await Department.count();
    if (deptCount === 0) {
      await Department.bulkCreate([
        { name: 'IT팀', description: 'IT 인프라 및 시스템 관리' },
        { name: '총무팀', description: '총무 및 관리 업무' },
        { name: '기획팀', description: '기획 및 전략 수립' },
        { name: '영업팀', description: '영업 및 마케팅' },
        { name: '재무팀', description: '재무 및 회계 관리' },
        { name: '법무팀', description: '법무 및 컴플라이언스' }
      ]);
      console.log('✅ 부서 데이터 생성 완료');
    } else {
      console.log(`📊 기존 부서 데이터: ${deptCount}개`);
    }
    
    // 예산 데이터
    const budgetCount = await Budget.count();
    if (budgetCount === 0) {
      await Budget.bulkCreate([
        {
          projectName: '2024년 IT 인프라 구축',
          budgetCode: 'IT-2024-001',
          totalBudget: 500000000,
          usedBudget: 0,
          remainingBudget: 500000000,
          department: 'IT팀',
          fiscalYear: 2024,
          status: 'active'
        },
        {
          projectName: '2024년 사무용품 구매',
          budgetCode: 'GA-2024-001',
          totalBudget: 50000000,
          usedBudget: 0,
          remainingBudget: 50000000,
          department: '총무팀',
          fiscalYear: 2024,
          status: 'active'
        }
      ]);
      console.log('✅ 예산 데이터 생성 완료');
    } else {
      console.log(`📊 기존 예산 데이터: ${budgetCount}개`);
    }
    
    // 공급업체 데이터
    const supplierCount = await Supplier.count();
    if (supplierCount === 0) {
      await Supplier.bulkCreate([
        {
          name: '삼성SDS',
          businessNumber: '123-45-67890',
          representative: '김대표',
          address: '서울시 강남구',
          contactPerson: '이담당',
          phone: '02-1234-5678',
          email: 'contact@samsungsds.com',
          creditRating: 'AAA'
        },
        {
          name: 'LG CNS',
          businessNumber: '098-76-54321',
          representative: '박대표',
          address: '서울시 서초구',
          contactPerson: '최담당',
          phone: '02-9876-5432',
          email: 'contact@lgcns.com',
          creditRating: 'AA+'
        }
      ]);
      console.log('✅ 공급업체 데이터 생성 완료');
    } else {
      console.log(`📊 기존 공급업체 데이터: ${supplierCount}개`);
    }
    
    // 계약방법 데이터
    const methodCount = await ContractMethod.count();
    if (methodCount === 0) {
      await ContractMethod.bulkCreate([
        { name: '일반경쟁입찰', description: '공개 경쟁 입찰 방식' },
        { name: '제한경쟁입찰', description: '자격을 제한한 경쟁 입찰' },
        { name: '지명경쟁입찰', description: '지명된 업체간 경쟁 입찰' },
        { name: '수의계약', description: '수의에 의한 계약' },
        { name: '긴급계약', description: '긴급시 체결하는 계약' }
      ]);
      console.log('✅ 계약방법 데이터 생성 완료');
    } else {
      console.log(`📊 기존 계약방법 데이터: ${methodCount}개`);
    }
    
    console.log('✅ 빠른 데이터베이스 설정 완료!');
    
    // 4. 데이터 현황 출력
    console.log('\n📊 현재 데이터 현황:');
    const tables = ['departments', 'budgets', 'suppliers', 'contract_methods', 'proposals'];
    
    for (const table of tables) {
      try {
        const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ${table}: ${result[0].count}개`);
      } catch (error) {
        console.log(`   ${table}: 테이블 없음`);
      }
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// 실행
if (require.main === module) {
  quickMigrate();
}

module.exports = { quickMigrate }; 