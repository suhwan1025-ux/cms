'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('proposals', 'original_proposal_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: '원본 품의서 ID (정정된 경우)',
      references: {
        model: 'proposals',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    
    console.log('✅ proposals 테이블에 original_proposal_id 컬럼 추가 완료');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('proposals', 'original_proposal_id');
    console.log('✅ proposals 테이블에서 original_proposal_id 컬럼 제거 완료');
  }
};

