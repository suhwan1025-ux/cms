'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ApprovalLine extends Model {
    static associate(models) {
      // 결재라인과 품의서의 관계
      ApprovalLine.belongsTo(models.Proposal, {
        foreignKey: 'proposalId',
        as: 'proposal'
      });
    }
  }
  
  ApprovalLine.init({
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
    step: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '결재 단계'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '결재자 부서/직책명'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '결재자 직급'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '결재 내용 설명'
    },
    isConditional: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '조건부 결재 여부'
    },
    isFinal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '최종 결재자 여부'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '결재 상태'
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '결재 일시'
    },
    approvedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '결재자'
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '결재 의견'
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
    modelName: 'ApprovalLine',
    tableName: 'approval_lines',
    timestamps: true,
    underscored: true
  });
  
  return ApprovalLine;
}; 