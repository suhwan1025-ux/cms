'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Proposal extends Model {
    static associate(models) {
      // 품의서와 구매품목의 관계
      Proposal.hasMany(models.PurchaseItem, {
        foreignKey: 'proposalId',
        as: 'purchaseItems'
      });
      
      // 품의서와 용역항목의 관계
      Proposal.hasMany(models.ServiceItem, {
        foreignKey: 'proposalId',
        as: 'serviceItems'
      });
      
      // 품의서와 비용귀속부서의 관계
      Proposal.hasMany(models.CostDepartment, {
        foreignKey: 'proposalId',
        as: 'costDepartments'
      });
      
      // 품의서와 결재라인의 관계
      Proposal.hasMany(models.ApprovalLine, {
        foreignKey: 'proposalId',
        as: 'approvalLines'
      });
      
      // 품의서와 요청부서의 관계
      Proposal.hasMany(models.RequestDepartment, {
        foreignKey: 'proposalId',
        as: 'requestDepartments'
      });
    }
  }
  
  Proposal.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contractType: {
      type: DataTypes.ENUM('purchase', 'change', 'extension', 'service', 'bidding', 'freeform'),
      allowNull: false,
      comment: '계약 유형'
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '품의서 제목'
    },
    purpose: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '사업 목적'
    },
    basis: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '계약 근거'
    },
    budgetId: {
      type: DataTypes.INTEGER,
      allowNull: true, // 임시저장 시 null 허용
      comment: '사업예산 ID'
    },
    contractMethod: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '계약방식'
    },
    accountSubject: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '계정과목'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '총 계약금액'
    },
    changeReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '변경 사유'
    },
    extensionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '연장 사유'
    },
    contractPeriod: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '계약기간'
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
    paymentMethod: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'lump'),
      allowNull: true,
      comment: '비용지급방식'
    },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'draft',
      comment: '품의서 상태'
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '작성자'
    },
    proposalDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '품의작성일'
    },
    approvalDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '결재완료일'
    },
    isDraft: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '임시저장 여부'
    },
    wysiwygContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '자유양식 문서 내용 (HTML)'
    },
    other: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '기타 사항'
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
    modelName: 'Proposal',
    tableName: 'proposals',
    timestamps: true,
    underscored: true
  });
  
  return Proposal;
}; 