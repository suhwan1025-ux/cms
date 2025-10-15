'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      // 관계 정의가 필요하면 여기에 추가
    }
  }
  
  Task.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    taskName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '업무명'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '업무 설명'
    },
    sharedFolderPath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '공유폴더 위치'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '시작일'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '종료일'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      comment: '상태 (active: 진행중, completed: 완료, pending: 대기)'
    },
    assignedDepartment: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '담당부서'
    },
    assignedPerson: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '담당자'
    },
    priority: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'medium',
      comment: '우선순위 (high: 높음, medium: 보통, low: 낮음)'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
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
    modelName: 'Task',
    tableName: 'tasks',
    timestamps: true,
    underscored: true
  });
  
  return Task;
};

