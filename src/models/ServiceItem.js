'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ServiceItem extends Model {
    static associate(models) {
      // 용역항목과 품의서의 관계
      ServiceItem.belongsTo(models.Proposal, {
        foreignKey: 'proposalId',
        as: 'proposal'
      });
      
      // 용역항목과 공급업체의 관계
      ServiceItem.belongsTo(models.Supplier, {
        foreignKey: 'supplierId',
        as: 'supplierInfo'
      });
    }
  }
  
  ServiceItem.init({
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
    item: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '용역항목'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '성명'
    },
    personnel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '인원수'
    },
    skillLevel: {
      type: DataTypes.ENUM('senior', 'middle', 'junior'),
      allowNull: false,
      comment: '기술등급'
    },
    period: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1,
      comment: '기간 (개월) - 소수점 2자리 허용'
    },
    monthlyRate: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '단가 (월)'
    },
    contractAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '계약금액'
    },
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'suppliers',
        key: 'id'
      },
      comment: '공급업체 ID'
    },
    supplier: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '공급업체명'
    },
    creditRating: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '신용등급'
    },
    contractPeriodStart: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '계약 시작일'
    },
    contractPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '계약 종료일'
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '비용지급방식 (monthly, quarterly, lump)'
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
    modelName: 'ServiceItem',
    tableName: 'service_items',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeSave: (instance) => {
        // 계약금액 자동 계산
        instance.contractAmount = instance.period * instance.monthlyRate;
      }
    }
  });
  
  return ServiceItem;
}; 