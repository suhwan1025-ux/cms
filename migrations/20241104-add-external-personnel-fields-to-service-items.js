const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // employee_number 컬럼 추가
      await queryInterface.addColumn(
        'service_items',
        'employee_number',
        {
          type: DataTypes.STRING,
          allowNull: true,
          comment: '사번'
        },
        { transaction }
      );

      // rank 컬럼 추가
      await queryInterface.addColumn(
        'service_items',
        'rank',
        {
          type: DataTypes.STRING,
          allowNull: true,
          comment: '직위'
        },
        { transaction }
      );

      // work_type 컬럼 추가
      await queryInterface.addColumn(
        'service_items',
        'work_type',
        {
          type: DataTypes.STRING,
          allowNull: true,
          comment: '업무유형'
        },
        { transaction }
      );

      // is_onsite 컬럼 추가
      await queryInterface.addColumn(
        'service_items',
        'is_onsite',
        {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: true,
          comment: '상주여부'
        },
        { transaction }
      );

      // work_load 컬럼 추가
      await queryInterface.addColumn(
        'service_items',
        'work_load',
        {
          type: DataTypes.STRING,
          allowNull: true,
          comment: '업무척도확인'
        },
        { transaction }
      );

      await transaction.commit();
      console.log('✅ 외주인력 관리 관련 컬럼이 service_items 테이블에 추가되었습니다.');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ 마이그레이션 실패:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.removeColumn('service_items', 'employee_number', { transaction });
      await queryInterface.removeColumn('service_items', 'rank', { transaction });
      await queryInterface.removeColumn('service_items', 'work_type', { transaction });
      await queryInterface.removeColumn('service_items', 'is_onsite', { transaction });
      await queryInterface.removeColumn('service_items', 'work_load', { transaction });

      await transaction.commit();
      console.log('✅ 외주인력 관리 관련 컬럼이 service_items 테이블에서 제거되었습니다.');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ 롤백 실패:', error);
      throw error;
    }
  }
};

