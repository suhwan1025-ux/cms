'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RequestDepartment extends Model {
    static associate(models) {
      // 요청부서와 품의서의 관계
      RequestDepartment.belongsTo(models.Proposal, {
        foreignKey: 'proposalId',
        as: 'proposal'
      });
    }
  }
  
  RequestDepartment.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    proposalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'proposal_id',
      references: {
        model: 'proposals',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: '품의서 ID'
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'department_id',
      references: {
        model: 'departments',
        key: 'id'
      },
      comment: '부서 ID'
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'department',
      comment: '부서명'
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
    modelName: 'RequestDepartment',
    tableName: 'request_departments',
    timestamps: true,
    underscored: true
  });
  
  return RequestDepartment;
}; 