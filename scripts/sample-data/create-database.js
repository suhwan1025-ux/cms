const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// 기본 PostgreSQL 연결 (postgres 데이터베이스에 연결)
const sequelize = new Sequelize(
  'postgres', // 기본 데이터베이스
  process.env.DB_USERNAME || 'postgres',
  process.env.DB_PASSWORD || 'meritz123!',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function createDatabase() {
  try {
    console.log('🔍 PostgreSQL 서버에 연결 중...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL 서버 연결 성공!');
    
    // 데이터베이스 존재 여부 확인
    console.log('🔍 데이터베이스 존재 여부 확인 중...');
    const [results] = await sequelize.query(
      "SELECT datname FROM pg_database WHERE datname = 'contract_management'"
    );
    
    if (results.length > 0) {
      console.log('✅ contract_management 데이터베이스가 이미 존재합니다.');
    } else {
      console.log('📝 contract_management 데이터베이스를 생성 중...');
      await sequelize.query('CREATE DATABASE contract_management');
      console.log('✅ contract_management 데이터베이스 생성 완료!');
    }
    
    await sequelize.close();
    console.log('✅ 데이터베이스 생성 작업 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n📋 비밀번호 인증 실패. 다음을 확인해주세요:');
      console.log('   1. PostgreSQL 설치 시 설정한 비밀번호가 meritz123!인지 확인');
      console.log('   2. .env 파일의 DB_PASSWORD가 올바른지 확인');
      console.log('   3. PostgreSQL 서비스가 실행 중인지 확인');
    } else if (error.message.includes('connection')) {
      console.log('\n📋 연결 실패. 다음을 확인해주세요:');
      console.log('   1. PostgreSQL이 설치되어 있는지 확인');
      console.log('   2. PostgreSQL 서비스가 실행 중인지 확인');
      console.log('   3. 포트 5432가 사용 가능한지 확인');
    }
  }
}

createDatabase(); 