'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // period 컬럼을 INTEGER에서 DECIMAL(10, 2)로 변경
    await queryInterface.changeColumn('service_items', 'period', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1,
      comment: '기간(개월) - 소수점 2자리 허용'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 롤백: DECIMAL을 INTEGER로 다시 변경
    await queryInterface.changeColumn('service_items', 'period', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '기간(개월)'
    });
  }
};

