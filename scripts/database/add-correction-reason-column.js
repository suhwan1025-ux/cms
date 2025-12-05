/**
 * proposals 테이블에 correction_reason 컬럼 추가
 * 정정 품의서의 정정 사유를 저장하기 위한 컬럼
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Sequelize, DataTypes } = require('sequelize');

// 데이터베이스 연결 설정
const sequelize = new Sequelize(
  process.env.DB_NAME || 'cms_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function addCorrectionReasonColumn() {
  try {
    console.log('🔄 데이터베이스 연결 중...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    const queryInterface = sequelize.getQueryInterface();

    // 1. 컬럼이 이미 있는지 확인
    const tableDescription = await queryInterface.describeTable('proposals');
    
    if (tableDescription.correction_reason) {
      console.log('ℹ️  correction_reason 컬럼이 이미 존재합니다.');
      console.log('현재 컬럼 정보:', tableDescription.correction_reason);
    } else {
      console.log('🔄 correction_reason 컬럼 추가 중...');
      
      // 2. 컬럼 추가
      await queryInterface.addColumn('proposals', 'correction_reason', {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '정정 사유'
      });
      
      console.log('✅ correction_reason 컬럼 추가 완료');
    }

    // 3. 추가된 컬럼 확인
    const updatedTableDescription = await queryInterface.describeTable('proposals');
    console.log('\n📋 proposals 테이블의 correction_reason 컬럼 정보:');
    console.log(updatedTableDescription.correction_reason);

    console.log('\n✅ 모든 작업 완료');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 데이터베이스 연결 종료');
  }
}

// 스크립트 실행
addCorrectionReasonColumn()
  .then(() => {
    console.log('🎉 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 스크립트 실행 실패:', error);
    process.exit(1);
  });

