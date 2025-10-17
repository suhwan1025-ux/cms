'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // service_items 테이블에 계약기간 컬럼 복구
    await queryInterface.addColumn('service_items', 'contract_period_start', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '계약 시작일'
    });
    
    await queryInterface.addColumn('service_items', 'contract_period_end', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '계약 종료일'
    });
    
    console.log('✅ service_items 테이블에 계약기간 컬럼이 복구되었습니다.');
  },

  down: async (queryInterface, Sequelize) => {
    // 롤백 시 계약기간 컬럼 제거
    await queryInterface.removeColumn('service_items', 'contract_period_start');
    await queryInterface.removeColumn('service_items', 'contract_period_end');
    
    console.log('✅ service_items 테이블에서 계약기간 컬럼이 제거되었습니다.');
  }
};

