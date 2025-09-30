const { Sequelize } = require('sequelize');
require('dotenv').config();

// 여러 비밀번호로 테스트
const passwords = [
  'meritz123!',
  'password',
  'postgres',
  'admin',
  '123456',
  ''
];

async function testPasswords() {
  console.log('🔍 PostgreSQL 비밀번호 테스트 시작...\n');
  
  for (const password of passwords) {
    try {
      console.log(`🔑 비밀번호 "${password}" 테스트 중...`);
      
      const sequelize = new Sequelize(
        'postgres',
        'postgres',
        password,
        {
          host: 'localhost',
          port: 5432,
          dialect: 'postgres',
          logging: false,
          pool: {
            max: 1,
            min: 0,
            acquire: 5000,
            idle: 1000
          }
        }
      );
      
      await sequelize.authenticate();
      console.log(`✅ 성공! 올바른 비밀번호: ${password}`);
      await sequelize.close();
      return password;
      
    } catch (error) {
      console.log(`❌ 실패: ${error.message}`);
      continue;
    }
  }
  
  console.log('\n❌ 모든 비밀번호 테스트 실패');
  console.log('📋 PostgreSQL을 다시 설치하거나 비밀번호를 재설정해주세요.');
  return null;
}

testPasswords(); 