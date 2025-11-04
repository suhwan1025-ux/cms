'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ExternalPersonnelInfo extends Model {
    static associate(models) {
      // 외주인력 정보와 용역항목의 관계
      ExternalPersonnelInfo.belongsTo(models.ServiceItem, {
        foreignKey: 'serviceItemId',
        as: 'serviceItem'
      });
    }
  }
  
  ExternalPersonnelInfo.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    serviceItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'service_item_id',
      references: {
        model: 'service_items',
        key: 'id'
      },
      comment: '용역항목 ID'
    },
    employeeNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'employee_number',
      comment: '사번'
    },
    rank: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '직위'
    },
    workType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'work_type',
      comment: '업무유형'
    },
    isOnsite: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'is_onsite',
      defaultValue: true,
      comment: '상주여부'
    },
    workLoad: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'work_load',
      comment: '업무척도확인'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'ExternalPersonnelInfo',
    tableName: 'external_personnel_info',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return ExternalPersonnelInfo;
};

