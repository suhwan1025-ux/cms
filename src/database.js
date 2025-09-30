const { Sequelize } = require('sequelize');
const config = require('../config/database.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool
  }
);

// 데이터베이스 연결 테스트
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error.message);
    return false;
  }
};

// 데이터베이스 동기화 (개발환경에서만)
const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: true, alter: false });
    console.log('✅ 데이터베이스 동기화 완료!');
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 동기화 실패:', error.message);
    return false;
  }
};

// 초기 데이터 생성
const seedInitialData = async () => {
  try {
    const { Budget, Department, Supplier } = require('./models');
    
    // 부서 데이터 생성
    const departments = await Department.bulkCreate([
      {
        name: 'IT개발팀',
        code: 'IT001',
        manager: '김개발',
        description: 'IT 시스템 개발 및 유지보수'
      },
      {
        name: '경영관리팀',
        code: 'MG001',
        manager: '이경영',
        description: '경영 관리 및 행정 업무'
      },
      {
        name: '마케팅팀',
        code: 'MK001',
        manager: '박마케팅',
        description: '마케팅 및 홍보 업무'
      },
      {
        name: '영업팀',
        code: 'SL001',
        manager: '최영업',
        description: '영업 및 고객 관리'
      },
      {
        name: '인사팀',
        code: 'HR001',
        manager: '정인사',
        description: '인사 및 조직 관리'
      },
      {
        name: '재무팀',
        code: 'FN001',
        manager: '한재무',
        description: '재무 및 회계 업무'
      }
    ]);
    
    // 공급업체 데이터 생성
    const suppliers = await Supplier.bulkCreate([
      {
        name: '테크솔루션즈',
        businessNumber: '123-45-67890',
        representative: '김테크',
        address: '서울시 강남구 테헤란로 123',
        phone: '02-1234-5678',
        email: 'contact@techsolutions.co.kr',
        creditRating: 'A',
        businessType: 'IT 서비스',
        registrationDate: new Date('2024-01-01')
      },
      {
        name: '디지털시스템즈',
        businessNumber: '234-56-78901',
        representative: '이디지털',
        address: '서울시 서초구 서초대로 456',
        phone: '02-2345-6789',
        email: 'info@digitalsystems.co.kr',
        creditRating: 'B',
        businessType: '소프트웨어 개발',
        registrationDate: new Date('2024-02-01')
      },
      {
        name: '네트워크컴퍼니',
        businessNumber: '345-67-89012',
        representative: '박네트워크',
        address: '서울시 마포구 마포대로 789',
        phone: '02-3456-7890',
        email: 'sales@networkcompany.co.kr',
        creditRating: 'A',
        businessType: '네트워크 인프라',
        registrationDate: new Date('2024-03-01')
      }
    ]);
    
    // 예산 데이터 생성
    const budgets = await Budget.bulkCreate([
      {
        name: '2024년 IT 인프라 예산',
        year: 2024,
        totalAmount: 500000000,
        usedAmount: 200000000,
        department: 'IT개발팀',
        description: 'IT 인프라 구축 및 유지보수 예산'
      },
      {
        name: '2024년 운영비 예산',
        year: 2024,
        totalAmount: 200000000,
        usedAmount: 50000000,
        department: '경영관리팀',
        description: '일반 운영비 예산'
      },
      {
        name: '2024년 개발비 예산',
        year: 2024,
        totalAmount: 300000000,
        usedAmount: 100000000,
        department: 'IT개발팀',
        description: '소프트웨어 개발 예산'
      }
    ]);
    
    console.log('✅ 초기 데이터 생성 완료!');
    console.log(`   - 부서: ${departments.length}개`);
    console.log(`   - 공급업체: ${suppliers.length}개`);
    console.log(`   - 예산: ${budgets.length}개`);
    return { departments, suppliers, budgets };
  } catch (error) {
    console.error('❌ 초기 데이터 생성 실패:', error.message);
    return null;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  seedInitialData
}; 