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
      references: {
        model: 'proposals',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: '품의서 ID'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '부서명',
      validate: {
        notEmpty: {
          msg: '부서명은 비어있을 수 없습니다.'
        },
        notNull: {
          msg: '부서명은 필수입니다.'
        },
        len: {
          args: [1, 100],
          msg: '부서명은 1자 이상 100자 이하여야 합니다.'
        }
      }
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '부서 코드'
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