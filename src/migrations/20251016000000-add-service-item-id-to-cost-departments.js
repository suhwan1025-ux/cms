'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // cost_departments 테이블에 service_item_id 컬럼 추가
    await queryInterface.addColumn('cost_departments', 'service_item_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'service_items',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: '용역품목 ID (용역품목별 비용분배인 경우)'
    });
    
    console.log('✅ cost_departments 테이블에 service_item_id 컬럼이 추가되었습니다.');
  },

  down: async (queryInterface, Sequelize) => {
    // 롤백 시 service_item_id 컬럼 제거
    await queryInterface.removeColumn('cost_departments', 'service_item_id');
    
    console.log('✅ cost_departments 테이블에서 service_item_id 컬럼이 제거되었습니다.');
  }
};

