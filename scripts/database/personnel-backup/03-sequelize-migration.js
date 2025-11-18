// ============================================================
// Sequelize Migration: personnel_backup 테이블 생성
// ============================================================
// 파일명: src/migrations/YYYYMMDDHHMMSS-create-personnel-backup.js
// 사용법: npx sequelize-cli db:migrate
// ============================================================

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('personnel_backup', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      
      // 백업 정보
      backup_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: '백업 일자'
      },
      original_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '원본 personnel 테이블의 id'
      },
      
      // 기본 정보
      division: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '본부'
      },
      department: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '부서'
      },
      position: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '직책'
      },
      employee_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '사번'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '성명'
      },
      rank: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '직위'
      },
      duties: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '담당업무'
      },
      job_function: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '직능'
      },
      bok_job_function: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '한국은행직능'
      },
      job_category: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '직종구분'
      },
      is_it_personnel: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        comment: '정보기술인력 여부'
      },
      is_security_personnel: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        comment: '정보보호인력 여부'
      },
      
      // 개인 정보
      birth_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '생년월일'
      },
      gender: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: '성별'
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '나이'
      },
      
      // 입사 및 경력 정보
      group_join_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '그룹입사일'
      },
      join_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '입사일'
      },
      resignation_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '퇴사일'
      },
      total_service_years: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: '총재직기간(년)'
      },
      career_base_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '정산경력기준일'
      },
      it_career_years: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: '전산경력(년)'
      },
      current_duty_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '현업무발령일'
      },
      current_duty_period: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: '현업무기간(년)'
      },
      previous_department: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '직전소속'
      },
      
      // 학력 및 자격증
      major: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '전공'
      },
      is_it_major: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        comment: '전산전공여부'
      },
      it_certificate_1: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '전산자격증1'
      },
      it_certificate_2: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '전산자격증2'
      },
      it_certificate_3: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '전산자격증3'
      },
      it_certificate_4: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '전산자격증4'
      },
      
      // 기타
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '활성화 여부'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '비고'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 인덱스 생성
    await queryInterface.addIndex('personnel_backup', ['backup_date'], {
      name: 'idx_personnel_backup_date'
    });
    
    await queryInterface.addIndex('personnel_backup', ['original_id'], {
      name: 'idx_personnel_backup_original_id'
    });
    
    await queryInterface.addIndex('personnel_backup', ['department'], {
      name: 'idx_personnel_backup_department'
    });
    
    await queryInterface.addIndex('personnel_backup', ['employee_number'], {
      name: 'idx_personnel_backup_employee_number'
    });
    
    // 복합 인덱스
    await queryInterface.addIndex('personnel_backup', ['backup_date', 'resignation_date'], {
      name: 'idx_personnel_backup_date_resignation'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('personnel_backup');
  }
};

