const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'contract_management',
  process.env.DB_USERNAME || 'postgres',
  process.env.DB_PASSWORD || 'meritz123!',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

// 랜덤 선택 함수
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// 랜덤 날짜 생성 (2025년 내)
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 날짜를 YYYY-MM-DD 형식으로 변환
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function createMoreProposals() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!\n');

    // 1. 사업예산 목록 조회
    const [budgets] = await sequelize.query(`
      SELECT id, project_name, budget_amount, budget_category, budget_year
      FROM business_budgets
      WHERE budget_year = 2025
      ORDER BY id
    `);

    console.log('📋 사용 가능한 사업예산:', budgets.length, '개\n');
    budgets.forEach(b => {
      console.log(`  - ID: ${b.id}, ${b.project_name} (${(b.budget_amount/100000000).toFixed(1)}억원, ${b.budget_category})`);
    });
    console.log('');

    // 2. 계약방식 (기존 품의서에서 사용하는 값들)
    const contractMethodList = ['일반경쟁입찰', '제한경쟁입찰', '수의계약', '지명경쟁입찰'];
    console.log('📝 계약방식:', contractMethodList.join(', '), '\n');

    // 3. 부서 목록 조회
    const [departments] = await sequelize.query(`
      SELECT name FROM departments WHERE is_active = true ORDER BY name
    `);
    const deptNames = departments.map(d => d.name);
    console.log('🏢 부서:', deptNames.length, '개\n');

    // 4. 품의서 템플릿 데이터 (다양한 유형)
    const proposalTemplates = [
      // 소프트웨어 구매 템플릿
      {
        type: 'purchase',
        titles: [
          '{사업명} 소프트웨어 라이선스 구매',
          '{사업명} 시스템 구축 솔루션 구매',
          '{사업명} 플랫폼 도입 계약',
          '{사업명} 업무용 소프트웨어 구매'
        ],
        purposes: [
          '업무 효율성 향상을 위한 소프트웨어 도입',
          '디지털 전환을 위한 시스템 구축',
          '업무 프로세스 자동화',
          '데이터 관리 및 분석 시스템 구축'
        ],
        basis: ['정보화사업 추진 계획', 'IT 인프라 개선 계획', '디지털 전환 로드맵', '업무 효율화 계획'],
        accountSubject: '소프트웨어',
        amounts: [15000000, 25000000, 35000000, 45000000, 55000000],
        items: [
          { item: '소프트웨어', productName: '업무용 소프트웨어 라이선스' },
          { item: '소프트웨어', productName: '시스템 플랫폼 라이선스' },
          { item: '소프트웨어', productName: 'SaaS 서비스 연간 구독' }
        ],
        suppliers: ['(주)소프트테크', '(주)IT솔루션즈', '(주)디지털웨이브', 'MS코리아', 'SAP코리아']
      },
      // 하드웨어 구매 템플릿
      {
        type: 'purchase',
        titles: [
          '{사업명} 서버 장비 구매',
          '{사업명} 네트워크 장비 구매',
          '{사업명} 스토리지 구축',
          '{사업명} 하드웨어 인프라 구축'
        ],
        purposes: [
          'IT 인프라 확충을 위한 서버 구매',
          '네트워크 성능 개선',
          '데이터 저장 용량 확대',
          '시스템 안정성 향상'
        ],
        basis: ['IT 인프라 확충 계획', '시스템 성능 개선 계획', '정보보안 강화 계획'],
        accountSubject: '서버/스토리지',
        amounts: [30000000, 50000000, 70000000, 90000000],
        items: [
          { item: '서버/스토리지', productName: '엔터프라이즈 서버' },
          { item: '네트워크장비', productName: '스위치 및 라우터' },
          { item: '서버/스토리지', productName: 'SAN 스토리지' }
        ],
        suppliers: ['Dell Technologies', 'HP Enterprise', '(주)네트워크시큐리티', '삼성SDS', 'LG CNS']
      },
      // 용역 계약 템플릿
      {
        type: 'service',
        titles: [
          '{사업명} 시스템 개발 용역',
          '{사업명} 컨설팅 용역',
          '{사업명} 시스템 고도화 용역',
          '{사업명} 유지보수 용역'
        ],
        purposes: [
          '시스템 개발 및 구축',
          '업무 프로세스 개선 컨설팅',
          '기존 시스템 고도화 및 기능 개선',
          '시스템 안정적 운영을 위한 유지보수'
        ],
        basis: ['시스템 개발 계획', '컨설팅 용역 계획', 'IT 서비스 개선 계획'],
        accountSubject: '용역비',
        amounts: [20000000, 30000000, 40000000, 50000000, 60000000],
        skillLevels: ['특급', '고급', '중급'],
        periods: [3, 4, 5, 6, 7, 8, 9, 10],
        suppliers: ['(주)테크솔루션', '(주)IT컨설팅', '(주)시스템개발', '(주)디지털파트너', '(주)소프트웨어랩']
      }
    ];

    const paymentMethods = ['선급금', '기성', '일시불', '분할'];
    const creatorNames = ['김개발', '이시스템', '박인프라', '최프로젝트', '정디지털', '강IT', '윤개발'];
    
    console.log('🌱 품의서 생성 시작...\n');

    let totalCreated = 0;
    let totalAmount = 0;

    // 각 사업예산별로 2~4개의 품의서 생성
    for (const budget of budgets) {
      const proposalCount = Math.floor(Math.random() * 3) + 2; // 2~4개
      console.log(`\n📦 [${budget.project_name}] 품의서 ${proposalCount}개 생성 중...`);
      
      for (let i = 0; i < proposalCount; i++) {
        // 랜덤 템플릿 선택
        const template = randomChoice(proposalTemplates);
        
        // 기본 정보
        const title = randomChoice(template.titles).replace('{사업명}', budget.project_name);
        const purpose = randomChoice(template.purposes);
        const basis = randomChoice(template.basis);
        const accountSubject = template.accountSubject;
        const contractMethod = randomChoice(contractMethodList);
        const amount = randomChoice(template.amounts);
        const paymentMethod = randomChoice(paymentMethods);
        const creator = randomChoice(creatorNames);
        
        // 날짜 생성
        const proposalDate = randomDate(new Date('2025-01-01'), new Date('2025-12-31'));
        const approvalDate = new Date(proposalDate.getTime() + (Math.random() * 10 + 1) * 24 * 60 * 60 * 1000); // 1~10일 후
        const contractStart = new Date(approvalDate.getTime() + (Math.random() * 30 + 1) * 24 * 60 * 60 * 1000); // 승인 후 1~30일
        const contractDuration = Math.floor(Math.random() * 9) + 3; // 3~11개월
        const contractEnd = new Date(contractStart);
        contractEnd.setMonth(contractEnd.getMonth() + contractDuration);
        
        const contractPeriod = `${formatDate(contractStart)} ~ ${formatDate(contractEnd)}`;
        
        // 상태 (80% 승인, 20% 대기)
        const status = Math.random() < 0.8 ? 'approved' : 'pending';
        
        // 품의서 생성
        const [proposal] = await sequelize.query(`
          INSERT INTO proposals (
            contract_type, title, purpose, basis, budget_id, 
            account_subject, total_amount, contract_method, payment_method,
            contract_period, contract_start_date, contract_end_date,
            status, created_by, proposal_date, approval_date, is_draft,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
          ) RETURNING id
        `, {
          bind: [
            template.type,
            title,
            purpose,
            basis,
            budget.id,
            accountSubject,
            amount,
            contractMethod,
            paymentMethod,
            contractPeriod,
            formatDate(contractStart),
            formatDate(contractEnd),
            status,
            creator,
            formatDate(proposalDate),
            status === 'approved' ? formatDate(approvalDate) : null,
            false
          ]
        });

        const proposalId = proposal[0].id;

        // 품목 생성
        if (template.type === 'purchase') {
          const itemCount = Math.floor(Math.random() * 2) + 1; // 1~2개 품목
          let remainingAmount = amount;
          
          for (let j = 0; j < itemCount; j++) {
            const itemTemplate = randomChoice(template.items);
            const isLast = j === itemCount - 1;
            const itemAmount = isLast ? remainingAmount : Math.floor(remainingAmount * (0.5 + Math.random() * 0.3));
            remainingAmount -= itemAmount;
            
            const quantity = Math.floor(Math.random() * 5) + 1;
            const unitPrice = Math.floor(itemAmount / quantity);
            
            await sequelize.query(`
              INSERT INTO purchase_items (
                proposal_id, item, product_name, quantity, unit_price, amount, supplier,
                created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            `, {
              bind: [
                proposalId,
                itemTemplate.item,
                itemTemplate.productName,
                quantity,
                unitPrice,
                itemAmount,
                randomChoice(template.suppliers)
              ]
            });
          }
        } else if (template.type === 'service') {
          const personnelCount = Math.floor(Math.random() * 2) + 1; // 1~2명
          let remainingAmount = amount;
          
          for (let j = 0; j < personnelCount; j++) {
            const isLast = j === personnelCount - 1;
            const itemAmount = isLast ? remainingAmount : Math.floor(remainingAmount * (0.5 + Math.random() * 0.3));
            remainingAmount -= itemAmount;
            
            const period = randomChoice(template.periods);
            const monthlyRate = Math.floor(itemAmount / period);
            const skillLevel = randomChoice(template.skillLevels);
            
            await sequelize.query(`
              INSERT INTO service_items (
                proposal_id, item, name, personnel, skill_level, period, 
                monthly_rate, contract_amount, supplier,
                created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            `, {
              bind: [
                proposalId,
                '용역',
                `${randomChoice(['김', '이', '박', '최', '정'])}${skillLevel}개발자`,
                1,
                skillLevel,
                period,
                monthlyRate,
                itemAmount,
                randomChoice(template.suppliers)
              ]
            });
          }
        }

        // 비용귀속부서 (1~3개 부서)
        const deptCount = Math.floor(Math.random() * 3) + 1;
        const selectedDepts = [];
        for (let j = 0; j < deptCount; j++) {
          let dept;
          do {
            dept = randomChoice(deptNames);
          } while (selectedDepts.includes(dept));
          selectedDepts.push(dept);
        }

        // 비율 분배
        let remainingRatio = 100;
        for (let j = 0; j < selectedDepts.length; j++) {
          const isLast = j === selectedDepts.length - 1;
          const ratio = isLast ? remainingRatio : Math.floor(remainingRatio * (0.3 + Math.random() * 0.4));
          remainingRatio -= ratio;
          
          const deptAmount = Math.floor(amount * ratio / 100);
          
          await sequelize.query(`
            INSERT INTO cost_departments (
              proposal_id, department, amount, ratio,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, NOW(), NOW())
          `, {
            bind: [proposalId, selectedDepts[j], deptAmount, ratio]
          });
        }

        // 요청부서
        for (const dept of selectedDepts) {
          await sequelize.query(`
            INSERT INTO request_departments (
              proposal_id, department,
              created_at, updated_at
            ) VALUES ($1, $2, NOW(), NOW())
          `, {
            bind: [proposalId, dept]
          });
        }

        totalCreated++;
        totalAmount += amount;
        
        const statusEmoji = status === 'approved' ? '✅' : '⏳';
        console.log(`  ${statusEmoji} [ID: ${proposalId}] ${title.substring(0, 40)}... (${(amount/1000000).toFixed(0)}백만원, ${status})`);
      }
    }

    console.log('\n📊 생성 완료 통계:');
    console.log(`   - 총 품의서 수: ${totalCreated}건`);
    console.log(`   - 총 금액: ${(totalAmount / 100000000).toFixed(1)}억원`);
    console.log(`   - 사업예산당 평균: ${(totalCreated / budgets.length).toFixed(1)}건\n`);

    // 생성된 품의서 통계
    const [stats] = await sequelize.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_amount
      FROM proposals
      WHERE budget_id IN (${budgets.map(b => b.id).join(',')})
      GROUP BY status
      ORDER BY status
    `);

    console.log('📈 전체 품의서 통계:');
    stats.forEach(s => {
      console.log(`   - ${s.status}: ${s.count}건 (${(s.total_amount / 100000000).toFixed(1)}억원)`);
    });

    console.log('\n✅ 품의서 샘플 생성 완료!');
    console.log('🌐 브라우저에서 확인:');
    console.log('   - 사업예산 대시보드: http://localhost:3001/dashboard');
    console.log('   - 품의 목록: http://localhost:3001/proposals');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

createMoreProposals();

