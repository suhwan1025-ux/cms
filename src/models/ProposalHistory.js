'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProposalHistory extends Model {
    static associate(models) {
      // 품의서 히스토리와 품의서의 관계
      ProposalHistory.belongsTo(models.Proposal, {
        foreignKey: 'proposalId',
        as: 'proposal'
      });
    }
  }
  
  ProposalHistory.init({
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
    previousStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '이전 상태'
    },
    newStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '새로운 상태'
    },
    changedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '시스템관리자',
      comment: '변경자'
    },
    changeReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '변경 사유'
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
    modelName: 'ProposalHistory',
    tableName: 'proposal_histories',
    timestamps: true,
    underscored: true
  });
  
  return ProposalHistory;
}; 