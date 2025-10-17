'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ENUM 제약을 제거하고 VARCHAR로 변경
    await queryInterface.sequelize.query(`
      ALTER TABLE service_items 
      ALTER COLUMN credit_rating TYPE VARCHAR(255);
    `);
    
    // allowNull을 true로 변경
    await queryInterface.changeColumn('service_items', 'credit_rating', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: '신용등급'
    });
    
    console.log('✅ service_items.credit_rating이 VARCHAR로 변경되었습니다.');
  },

  down: async (queryInterface, Sequelize) => {
    // 롤백 시 다시 ENUM으로 변경
    await queryInterface.sequelize.query(`
      ALTER TABLE service_items 
      ALTER COLUMN credit_rating TYPE VARCHAR(255);
    `);
    
    await queryInterface.changeColumn('service_items', 'credit_rating', {
      type: Sequelize.ENUM('A', 'B', 'C'),
      allowNull: false,
      comment: '신용등급'
    });
    
    console.log('✅ service_items.credit_rating이 ENUM으로 복원되었습니다.');
  }
};

