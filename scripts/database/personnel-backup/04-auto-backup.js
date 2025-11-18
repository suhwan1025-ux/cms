#!/usr/bin/env node
// ============================================================
// Personnel 자동 백업 스크립트
// ============================================================
// 목적: personnel 테이블 데이터를 personnel_backup에 자동 백업
// 사용법: node scripts/database/personnel-backup/04-auto-backup.js
// Cron: 0 0 1 * * (매월 1일 자정)
// ============================================================

const { Sequelize } = require('sequelize');
require('dotenv').config();

// DB 연결 설정
const sequelize = new Sequelize(
  process.env.DB_NAME || 'cms_db',
  process.env.DB_USERNAME || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function backupPersonnel() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Personnel 백업 시작...');
    console.log(`⏰ 백업 시간: ${new Date().toLocaleString('ko-KR')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // DB 연결 확인
    await sequelize.authenticate();
    console.log('✅ DB 연결 성공');

    // personnel_backup 테이블 존재 확인
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'personnel_backup'
    `);

    if (tables.length === 0) {
      console.error('❌ personnel_backup 테이블이 존재하지 않습니다!');
      console.log('💡 먼저 01-create-personnel-backup-table.sql을 실행하세요.');
      process.exit(1);
    }

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 백업 일자: ${today}`);

    // 오늘 백업이 이미 있는지 확인
    const [existing] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM personnel_backup 
      WHERE backup_date = :today
    `, {
      replacements: { today },
      type: Sequelize.QueryTypes.SELECT
    });

    if (existing.count > 0) {
      console.log(`⚠️  ${today} 백업이 이미 존재합니다 (${existing.count}개)`);
      console.log('💡 기존 백업을 삭제하고 새로 백업하시겠습니까? (Y/N)');
      
      // 사용자 입력 대기 (선택사항)
      // 자동화를 위해 기존 백업 삭제 후 재백업
      console.log('🔄 기존 백업 삭제 후 재백업합니다...');
      await sequelize.query(`
        DELETE FROM personnel_backup WHERE backup_date = :today
      `, {
        replacements: { today }
      });
    }

    // 현재 personnel 데이터 조회
    const [personnel] = await sequelize.query(`
      SELECT COUNT(*) as count FROM personnel WHERE is_active = TRUE
    `, {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log(`📊 백업 대상: ${personnel.count}명`);

    // 백업 실행
    const startTime = Date.now();
    
    await sequelize.query(`
      INSERT INTO personnel_backup (
        backup_date,
        original_id,
        division, department, position, employee_number, name, rank,
        duties, job_function, bok_job_function, job_category,
        is_it_personnel, is_security_personnel,
        birth_date, gender, age,
        group_join_date, join_date, resignation_date,
        total_service_years, career_base_date, it_career_years,
        current_duty_date, current_duty_period, previous_department,
        major, is_it_major,
        it_certificate_1, it_certificate_2, it_certificate_3, it_certificate_4,
        is_active, notes,
        created_at, updated_at
      )
      SELECT
        :today AS backup_date,
        id AS original_id,
        division, department, position, employee_number, name, rank,
        duties, job_function, bok_job_function, job_category,
        is_it_personnel, is_security_personnel,
        birth_date, gender, age,
        group_join_date, join_date, resignation_date,
        total_service_years, career_base_date, it_career_years,
        current_duty_date, current_duty_period, previous_department,
        major, is_it_major,
        it_certificate_1, it_certificate_2, it_certificate_3, it_certificate_4,
        is_active, notes,
        created_at, updated_at
      FROM personnel
      WHERE is_active = TRUE
    `, {
      replacements: { today }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // 백업 결과 확인
    const [result] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM personnel_backup 
      WHERE backup_date = :today
    `, {
      replacements: { today },
      type: Sequelize.QueryTypes.SELECT
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 백업 완료!');
    console.log(`   📊 백업된 인원: ${result.count}명`);
    console.log(`   ⏱️  소요 시간: ${duration}초`);
    console.log(`   📅 백업 일자: ${today}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 전체 백업 이력 조회
    const [history] = await sequelize.query(`
      SELECT 
        backup_date,
        COUNT(*) as count
      FROM personnel_backup
      GROUP BY backup_date
      ORDER BY backup_date DESC
      LIMIT 10
    `, {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log('');
    console.log('📋 최근 백업 이력 (최대 10개):');
    console.log('─'.repeat(50));
    history.forEach((h, index) => {
      const date = new Date(h.backup_date).toLocaleDateString('ko-KR');
      console.log(`   ${index + 1}. ${date} - ${h.count}명`);
    });
    console.log('');

    process.exit(0);

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ 백업 실패!');
    console.error(`   에러: ${error.message}`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 스크립트 실행
backupPersonnel();

