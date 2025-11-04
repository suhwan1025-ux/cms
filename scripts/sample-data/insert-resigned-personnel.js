const { sequelize } = require('../../src/models');

async function insertResignedPersonnel() {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 퇴사자 샘플 데이터
    const resignedPersonnel = [
      {
        division: '정보보호본부',
        department: '정보보호기술담당',
        position: '담당자',
        employee_number: 'SEC011',
        name: '서퇴사',
        rank: '과장',
        duties: '보안정책 수립, 보안교육',
        job_function: 'SP',
        bok_job_function: '정보보호관리',
        job_category: '일반직',
        is_it_personnel: true,
        is_security_personnel: true,
        birth_date: '1984-03-10',
        gender: '남',
        age: 40,
        group_join_date: '2009-01-05',
        join_date: '2009-01-05',
        resignation_date: '2023-12-31',
        total_service_years: 14.98,
        career_base_date: '2009-01-05',
        it_career_years: 14.98,
        current_duty_date: '2018-01-01',
        current_duty_period: 5.98,
        major: '정보보호학',
        is_it_major: true,
        it_certificate_1: '정보보안기사',
        is_active: false
      },
      {
        division: '정보보호본부',
        department: '보안관제센터',
        position: '담당자',
        employee_number: 'SEC012',
        name: '최이직',
        rank: '대리',
        duties: '보안 모니터링',
        job_function: 'OP',
        bok_job_function: '시스템운영',
        job_category: '연봉직',
        is_it_personnel: true,
        is_security_personnel: true,
        birth_date: '1991-07-15',
        gender: '여',
        age: 33,
        group_join_date: '2017-03-01',
        join_date: '2017-03-01',
        resignation_date: '2024-06-30',
        total_service_years: 7.32,
        career_base_date: '2017-03-01',
        it_career_years: 7.32,
        current_duty_date: '2017-03-01',
        current_duty_period: 7.32,
        major: '컴퓨터공학',
        is_it_major: true,
        it_certificate_1: '정보처리기사',
        is_active: false
      },
      {
        division: 'IT본부',
        department: '시스템개발담당',
        position: '담당자',
        employee_number: 'IT101',
        name: '김개발',
        rank: '차장',
        duties: '시스템 개발, 프로젝트 관리',
        job_function: 'AP',
        bok_job_function: '시스템개발',
        job_category: '일반직',
        is_it_personnel: true,
        is_security_personnel: false,
        birth_date: '1980-05-20',
        gender: '남',
        age: 44,
        group_join_date: '2006-02-01',
        join_date: '2006-02-01',
        resignation_date: '2024-01-31',
        total_service_years: 17.99,
        career_base_date: '2006-02-01',
        it_career_years: 17.99,
        current_duty_date: '2015-01-01',
        current_duty_period: 8.99,
        major: '컴퓨터공학',
        is_it_major: true,
        it_certificate_1: '정보처리기사',
        it_certificate_2: 'PMP',
        is_active: false
      },
      {
        division: 'IT본부',
        department: 'DBA담당',
        position: '담당자',
        employee_number: 'IT102',
        name: '박데베',
        rank: '과장',
        duties: 'DB 설계 및 관리, 성능 튜닝',
        job_function: 'DBA',
        bok_job_function: '시스템운영',
        job_category: '일반직',
        is_it_personnel: true,
        is_security_personnel: false,
        birth_date: '1986-11-12',
        gender: '남',
        age: 38,
        group_join_date: '2011-03-15',
        join_date: '2011-03-15',
        resignation_date: '2023-09-30',
        total_service_years: 12.54,
        career_base_date: '2011-03-15',
        it_career_years: 12.54,
        current_duty_date: '2019-01-01',
        current_duty_period: 4.74,
        major: '컴퓨터공학',
        is_it_major: true,
        it_certificate_1: '정보처리기사',
        it_certificate_2: 'OCP',
        is_active: false
      },
      {
        division: 'IT본부',
        department: '시스템운영담당',
        position: '담당자',
        employee_number: 'IT103',
        name: '이운영',
        rank: '대리',
        duties: '시스템 운영, 장애 대응',
        job_function: 'OP',
        bok_job_function: '시스템운영',
        job_category: '연봉제정규직',
        is_it_personnel: true,
        is_security_personnel: false,
        birth_date: '1993-04-08',
        gender: '여',
        age: 31,
        group_join_date: '2018-07-01',
        join_date: '2018-07-01',
        resignation_date: '2024-08-31',
        total_service_years: 6.16,
        career_base_date: '2018-07-01',
        it_career_years: 6.16,
        current_duty_date: '2018-07-01',
        current_duty_period: 6.16,
        major: '정보통신학',
        is_it_major: true,
        it_certificate_1: '정보처리기사',
        is_active: false
      },
      {
        division: '기획본부',
        department: 'IT기획담당',
        position: '담당자',
        employee_number: 'PL201',
        name: '정기획',
        rank: '과장',
        duties: 'IT 전략 수립, 예산 관리',
        job_function: '기타',
        bok_job_function: '시스템기획및설계',
        job_category: '일반직',
        is_it_personnel: true,
        is_security_personnel: false,
        birth_date: '1985-09-25',
        gender: '남',
        age: 39,
        group_join_date: '2010-05-10',
        join_date: '2010-05-10',
        resignation_date: '2024-03-31',
        total_service_years: 13.89,
        career_base_date: '2010-05-10',
        it_career_years: 13.89,
        current_duty_date: '2020-01-01',
        current_duty_period: 4.24,
        major: '경영정보학',
        is_it_major: true,
        it_certificate_1: '정보처리기사',
        is_active: false
      },
      {
        division: 'IT본부',
        department: '통신담당',
        position: '담당자',
        employee_number: 'IT104',
        name: '강네트',
        rank: '차장',
        duties: '네트워크 설계 및 운영',
        job_function: '통신망운영자',
        bok_job_function: '시스템운영',
        job_category: '일반직',
        is_it_personnel: true,
        is_security_personnel: false,
        birth_date: '1979-12-18',
        gender: '남',
        age: 45,
        group_join_date: '2004-08-01',
        join_date: '2004-08-01',
        resignation_date: '2024-07-31',
        total_service_years: 19.99,
        career_base_date: '2004-08-01',
        it_career_years: 19.99,
        current_duty_date: '2010-01-01',
        current_duty_period: 14.58,
        major: '전자공학',
        is_it_major: true,
        it_certificate_1: '정보통신기사',
        it_certificate_2: 'CCNP',
        is_active: false
      },
      {
        division: 'IT본부',
        department: '시스템개발담당',
        position: '담당자',
        employee_number: 'IT105',
        name: '윤코딩',
        rank: '사원',
        duties: '웹 애플리케이션 개발',
        job_function: 'AP',
        bok_job_function: '시스템개발',
        job_category: '촉탁',
        is_it_personnel: true,
        is_security_personnel: false,
        birth_date: '1997-06-30',
        gender: '여',
        age: 27,
        group_join_date: '2022-01-03',
        join_date: '2022-01-03',
        resignation_date: '2024-10-31',
        total_service_years: 2.82,
        career_base_date: '2022-01-03',
        it_career_years: 2.82,
        current_duty_date: '2022-01-03',
        current_duty_period: 2.82,
        major: '컴퓨터공학',
        is_it_major: true,
        it_certificate_1: '정보처리기사',
        is_active: false
      }
    ];

    // 데이터 삽입
    const query = `
      INSERT INTO personnel (
        division, department, position, employee_number, name, rank, duties,
        job_function, bok_job_function, job_category,
        is_it_personnel, is_security_personnel,
        birth_date, gender, age,
        group_join_date, join_date, resignation_date,
        total_service_years, career_base_date, it_career_years,
        current_duty_date, current_duty_period,
        major, is_it_major, it_certificate_1, it_certificate_2,
        is_active, created_at, updated_at
      ) VALUES ${resignedPersonnel.map((_, i) => 
        `($${i * 28 + 1}, $${i * 28 + 2}, $${i * 28 + 3}, $${i * 28 + 4}, $${i * 28 + 5}, 
          $${i * 28 + 6}, $${i * 28 + 7}, $${i * 28 + 8}, $${i * 28 + 9}, $${i * 28 + 10},
          $${i * 28 + 11}, $${i * 28 + 12}, $${i * 28 + 13}, $${i * 28 + 14}, $${i * 28 + 15},
          $${i * 28 + 16}, $${i * 28 + 17}, $${i * 28 + 18}, $${i * 28 + 19}, $${i * 28 + 20},
          $${i * 28 + 21}, $${i * 28 + 22}, $${i * 28 + 23}, $${i * 28 + 24}, $${i * 28 + 25},
          $${i * 28 + 26}, $${i * 28 + 27}, $${i * 28 + 28}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      ).join(', ')}
    `;

    const values = resignedPersonnel.flatMap(p => [
      p.division, p.department, p.position, p.employee_number, p.name,
      p.rank, p.duties, p.job_function, p.bok_job_function, p.job_category,
      p.is_it_personnel, p.is_security_personnel,
      p.birth_date, p.gender, p.age,
      p.group_join_date, p.join_date, p.resignation_date,
      p.total_service_years, p.career_base_date, p.it_career_years,
      p.current_duty_date, p.current_duty_period,
      p.major, p.is_it_major, p.it_certificate_1 || null, p.it_certificate_2 || null,
      p.is_active
    ]);

    await sequelize.query(query, {
      bind: values,
      type: sequelize.QueryTypes.INSERT
    });

    console.log(`✅ ${resignedPersonnel.length}명의 퇴사자 데이터가 추가되었습니다.`);
    console.log('\n추가된 퇴사자 데이터:');
    resignedPersonnel.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} (${p.employee_number}) - ${p.division} ${p.department} - 퇴사일: ${p.resignation_date}`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
    console.log('\n✅ 데이터베이스 연결 종료');
  }
}

insertResignedPersonnel();

