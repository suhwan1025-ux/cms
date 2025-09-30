'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ServiceItems', 'name', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: '성명'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ServiceItems', 'name');
  }
}; 