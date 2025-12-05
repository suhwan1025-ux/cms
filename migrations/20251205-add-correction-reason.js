'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    // proposals 테이블에 correction_reason 컬럼 추가
    await queryInterface.addColumn('proposals', 'correction_reason', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '정정 사유'
    });
    
    console.log('✅ proposals 테이블에 correction_reason 컬럼 추가 완료');
  },

  down: async (queryInterface, Sequelize) => {
    // 롤백 시 correction_reason 컬럼 제거
    await queryInterface.removeColumn('proposals', 'correction_reason');
    
    console.log('✅ proposals 테이블에서 correction_reason 컬럼 제거 완료');
  }
};

