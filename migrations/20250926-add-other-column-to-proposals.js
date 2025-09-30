'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('proposals', 'other', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: '기타 사항'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('proposals', 'other');
  }
}; 