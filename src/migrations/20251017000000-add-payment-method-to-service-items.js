'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('service_items', 'payment_method', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: '비용지급방식 (monthly, quarterly, lump)'
    });
    
    console.log('✅ service_items 테이블에 payment_method 컬럼이 추가되었습니다.');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('service_items', 'payment_method');
    
    console.log('✅ service_items 테이블에서 payment_method 컬럼이 제거되었습니다.');
  }
};

