'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('proposals', 'budget_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: '사업예산 ID'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('proposals', 'budget_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '사업예산 ID'
    });
  }
}; 