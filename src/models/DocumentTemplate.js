'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DocumentTemplate extends Model {
    static associate(models) {
      // 관계 정의가 필요하면 여기에 추가
    }
  }
  
  DocumentTemplate.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '템플릿 이름'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '템플릿 설명'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '템플릿 HTML 내용'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'general',
      comment: '템플릿 카테고리 (general, bidding, contract 등)'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '활성화 여부'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '표시 순서'
    },
    createdBy: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '작성자'
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
    modelName: 'DocumentTemplate',
    tableName: 'document_templates',
    timestamps: true,
    underscored: true
  });
  
  return DocumentTemplate;
};

