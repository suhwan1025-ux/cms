'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CostDepartment extends Model {
    static associate(models) {
      // 비용귀속부서와 품의서의 관계
      CostDepartment.belongsTo(models.Proposal, {
        foreignKey: 'proposalId',
        as: 'proposal'
      });
      
      // 비용귀속부서와 부서의 관계
      CostDepartment.belongsTo(models.Department, {
        foreignKey: 'departmentId',
        as: 'departmentInfo'
      });
    }
  }
  
  CostDepartment.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    proposalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'proposals',
        key: 'id'
      },
      comment: '품의서 ID'
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      },
      comment: '부서 ID'
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '부서명'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '배분금액'
    },
    ratio: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '배분비율 (%)'
    },
    purchaseItemId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'purchase_items',
        key: 'id'
      },
      comment: '구매품목 ID (구매품목별 비용분배인 경우)'
    },
    allocationType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '분배 유형 (percentage, amount)'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'CostDepartment',
    tableName: 'cost_departments',
    timestamps: true,
    underscored: true
  });
  
  return CostDepartment;
}; 