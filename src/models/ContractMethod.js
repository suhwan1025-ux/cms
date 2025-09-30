'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ContractMethod extends Model {
    static associate(models) {
      // 계약방식과 품의서의 관계
      ContractMethod.hasMany(models.Proposal, {
        foreignKey: 'contractMethodId',
        as: 'proposals'
      });
    }
  }
  
  ContractMethod.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '계약방식 코드'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '계약방식명'
    },
    regulation: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '사내규정 근거'
    },
    minAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: '최소 금액'
    },
    maxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: '최대 금액'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '활성화 여부'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '설명'
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
    modelName: 'ContractMethod',
    tableName: 'contract_methods',
    timestamps: true,
    underscored: true
  });
  
  return ContractMethod;
}; 