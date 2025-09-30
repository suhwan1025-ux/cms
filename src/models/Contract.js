'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Contract extends Model {
    static associate(models) {
      // 계약과 품의서의 관계
      Contract.belongsTo(models.Proposal, {
        foreignKey: 'proposalId',
        as: 'proposal'
      });
      
      // 계약과 공급업체의 관계
      Contract.belongsTo(models.Supplier, {
        foreignKey: 'supplierId',
        as: 'supplier'
      });
    }
  }
  
  Contract.init({
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
    contractNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '계약번호'
    },
    contractType: {
      type: DataTypes.ENUM('purchase', 'change', 'extension', 'service', 'bidding'),
      allowNull: false,
      comment: '계약 유형'
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
    contractAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '계약금액'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '계약 시작일'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '계약 종료일'
    },
    paymentMethod: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'lump'),
      allowNull: true,
      comment: '지급방식'
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'completed', 'terminated'),
      allowNull: false,
      defaultValue: 'draft',
      comment: '계약 상태'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '계약 설명'
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '첨부파일 정보'
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
    modelName: 'Contract',
    tableName: 'contracts',
    timestamps: true,
    underscored: true
  });
  
  return Contract;
}; 