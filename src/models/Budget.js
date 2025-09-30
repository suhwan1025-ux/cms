'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Budget extends Model {
    static associate(models) {
      // 예산과 품의서의 관계
      Budget.hasMany(models.Proposal, {
        foreignKey: 'budgetId',
        as: 'proposals'
      });
    }
  }
  
  Budget.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '예산명'
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '예산년도'
    },
    type: {
      type: DataTypes.ENUM('general', 'business'),
      allowNull: false,
      defaultValue: 'general',
      comment: '예산 유형 (general: 일반예산, business: 사업예산)'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '총 예산금액'
    },
    usedAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '사용된 금액'
    },
    remainingAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '잔여 금액'
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '관리부서'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '예산 설명'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '활성화 여부'
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
    modelName: 'Budget',
    tableName: 'budgets',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeSave: (instance) => {
        // 잔여금액 자동 계산
        instance.remainingAmount = instance.totalAmount - instance.usedAmount;
      }
    }
  });
  
  return Budget;
}; 