'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Supplier extends Model {
    static associate(models) {
      // 공급업체와 계약의 관계
      Supplier.hasMany(models.Contract, {
        foreignKey: 'supplierId',
        as: 'contracts'
      });
      
      // 공급업체와 구매품목의 관계
      Supplier.hasMany(models.PurchaseItem, {
        foreignKey: 'supplierId',
        as: 'purchaseItemList'
      });
      
      // 공급업체와 용역항목의 관계
      Supplier.hasMany(models.ServiceItem, {
        foreignKey: 'supplierId',
        as: 'serviceItemList'
      });
    }
  }
  
  Supplier.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '업체명'
    },
    businessNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: '사업자등록번호'
    },
    representative: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '대표자명'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '주소'
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '전화번호'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '이메일'
    },
    creditRating: {
      type: DataTypes.ENUM('A', 'B', 'C', 'D'),
      allowNull: true,
      comment: '신용등급'
    },
    businessType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '업종'
    },
    registrationDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '등록일'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '활성화 여부'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '비고'
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
    modelName: 'Supplier',
    tableName: 'suppliers',
    timestamps: true,
    underscored: true
  });
  
  return Supplier;
}; 