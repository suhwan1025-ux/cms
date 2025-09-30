'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Department extends Model {
    static associate(models) {
      // 부서와 비용귀속부서의 관계
      Department.hasMany(models.CostDepartment, {
        foreignKey: 'departmentId',
        as: 'costDepartmentAssignments'
      });
    }
  }
  
  Department.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '부서명'
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: '부서코드'
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      },
      comment: '상위부서 ID'
    },
    manager: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '부서장'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '부서 설명'
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
    modelName: 'Department',
    tableName: 'departments',
    timestamps: true,
    underscored: true
  });
  
  return Department;
}; 