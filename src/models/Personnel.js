'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Personnel extends Model {
    static associate(models) {
      // 필요시 관계 정의
    }
  }
  
  Personnel.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 기본 정보
    division: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '본부'
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '부서'
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '직책'
    },
    employee_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      comment: '사번'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '성명'
    },
    rank: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '직위'
    },
    duties: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '담당업무'
    },
    job_function: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '직능'
    },
    bok_job_function: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '한국은행직능'
    },
    job_category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '직종구분'
    },
    is_it_personnel: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: '정보기술인력 여부'
    },
    is_security_personnel: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: '정보보호인력 여부'
    },
    
    // 개인 정보
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '생년월일'
    },
    gender: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: '성별'
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '나이'
    },
    
    // 입사 및 경력 정보
    group_join_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '그룹입사일'
    },
    join_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '입사일'
    },
    resignation_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '퇴사일'
    },
    total_service_years: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '총재직기간(년)'
    },
    career_base_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '정산경력기준일'
    },
    it_career_years: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '전산경력(년)'
    },
    current_duty_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '현업무발령일'
    },
    current_duty_period: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '현업무기간(년)'
    },
    previous_department: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '직전소속'
    },
    
    // 학력 및 자격증
    major: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '전공'
    },
    is_it_major: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: '전산전공여부'
    },
    it_certificate_1: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '전산자격증1'
    },
    it_certificate_2: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '전산자격증2'
    },
    it_certificate_3: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '전산자격증3'
    },
    it_certificate_4: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '전산자격증4'
    },
    
    // 기타
    is_active: {
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
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'Personnel',
    tableName: 'personnel',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return Personnel;
};

