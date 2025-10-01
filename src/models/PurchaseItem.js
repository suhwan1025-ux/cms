'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchaseItem extends Model {
    static associate(models) {
      // 구매품목과 품의서의 관계
      PurchaseItem.belongsTo(models.Proposal, {
        foreignKey: 'proposalId',
        as: 'proposal'
      });
      
      // 구매품목과 공급업체의 관계
      PurchaseItem.belongsTo(models.Supplier, {
        foreignKey: 'supplierId',
        as: 'supplierInfo'
      });
      
      // 구매품목의 비용분배 정보는 costDepartments에 통합되어 저장됨
    }
  }
  
  PurchaseItem.init({
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
      field: 'item',
      comment: '구매품목'
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'product_name',
      comment: '제품명'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '수량'
    },
    unitPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '단가'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '금액'
    },
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'supplier_id',
      references: {
        model: 'suppliers',
        key: 'id'
      },
      comment: '공급업체 ID'
    },
    supplier: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'supplier',
      comment: '공급업체명'
    },
    requestDepartment: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'request_department',
      comment: '요청부서'
    },
    contractPeriodType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'permanent',
      comment: '계약기간 타입 (permanent: 영구, 1year: 1년, custom: 직접입력)'
    },
    contractStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '계약 시작일'
    },
    contractEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '계약 종료일'
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
    modelName: 'PurchaseItem',
    tableName: 'purchase_items',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeSave: (instance) => {
        // 금액 자동 계산
        instance.amount = instance.quantity * instance.unitPrice;
      }
    }
  });
  
  return PurchaseItem;
}; 