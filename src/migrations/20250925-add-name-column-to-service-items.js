'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('service_items', 'name', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: '성명'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('service_items', 'name');
  }
}; 