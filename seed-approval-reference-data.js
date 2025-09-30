const { Sequelize } = require('sequelize');
require('dotenv').config();

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

async function seedApprovalReferenceData() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');

    // 1. 결재자 마스터 데이터 삽입
    console.log('🌱 결재자 마스터 데이터 삽입...');
    const approvers = [
      {
        code: 'compliance',
        name: '준법감시인',
        title: '준법감시인',
        department: '준법감시팀',
        description: '법적 준수성 검토 및 감시',
        basis: '내부통제 시행세칙 제 10조 1-11'
      },
      {
        code: 'audit',
        name: '감사본부장',
        title: '감사본부장',
        department: '감사본부',
        description: '감사 및 내부통제 검토',
        basis: '감사위원회 직무규정 일상감사 대상업무'
      },
      {
        code: 'management',
        name: '경영관리팀',
        title: '경영관리팀',
        department: '경영관리팀',
        description: '경영 효율성 및 예산 검토',
        basis: '예산집행 전결 한도표'
      },
      {
        code: 'it_audit',
        name: 'IT 내부감사인',
        title: 'IT 내부감사인',
        department: 'IT감사팀',
        description: 'IT 시스템 및 보안 검토',
        basis: 'IT자체감사 지침 제 10조[감사 실시] 7 - 계약금액 1천만원 초과 3억이하 본부장 전결'
      }
    ];

    for (const approver of approvers) {
      await sequelize.query(`
        INSERT INTO approval_approvers (code, name, title, department, description, basis)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (code) DO NOTHING;
      `, {
        bind: [approver.code, approver.name, approver.title, approver.department, approver.description, approver.basis]
      });
    }
    console.log('✅ 결재자 마스터 데이터 삽입 완료');

    // 2. 결재자 조건 데이터 삽입
    console.log('🌱 결재자 조건 데이터 삽입...');
    const conditions = [
      { approver_code: 'compliance', condition_type: 'contract_type', condition_value: 'service', condition_label: '용역계약' },
      { approver_code: 'audit', condition_type: 'amount', condition_value: 'over_50m', condition_label: '계약금액 5천만원 초과' },
      { approver_code: 'management', condition_type: 'amount', condition_value: 'over_2m', condition_label: '계약금액 2백만원 초과' },
      { approver_code: 'it_audit', condition_type: 'amount', condition_value: '10m_300m', condition_label: '계약금액 1천만원 초과 3억이하 본부장 전결' }
    ];

    for (const condition of conditions) {
      await sequelize.query(`
        INSERT INTO approval_conditions (approver_id, condition_type, condition_value, condition_label)
        SELECT id, $2, $3, $4
        FROM approval_approvers
        WHERE code = $1
        ON CONFLICT DO NOTHING;
      `, {
        bind: [condition.approver_code, condition.condition_type, condition.condition_value, condition.condition_label]
      });
    }
    console.log('✅ 결재자 조건 데이터 삽입 완료');

    // 3. 결재라인 규칙 데이터 삽입
    console.log('🌱 결재라인 규칙 데이터 삽입...');
    const rules = [
      {
        rule_type: 'amount',
        rule_name: '💰 금액별 규칙',
        rule_content: JSON.stringify([
          '1천만원 이하: 담당자 (2백만원 초과 시 경영관리팀장)',
          '1천만원 초과 ~ 5천만원 이하: 경영관리팀장',
          '5천만원 초과 ~ 3억원 이하: 경영지원본부장',
          '3억원 초과 ~ 50억원 이하: 경영지원실장'
        ]),
        basis: '예산집행 전결 한도표'
      },
      {
        rule_type: 'contract_type',
        rule_name: '📋 계약유형별 규칙',
        rule_content: JSON.stringify([
          '용역계약: 준법감시인 필수 포함',
          '구매계약: 일반 결재라인 적용',
          '입찰계약: 일반 결재라인 적용',
          '변경계약: 기존 결재라인 참조',
          '연장계약: 기존 결재라인 참조'
        ]),
        basis: '내부통제 시행세칙 제 10조 1-11'
      },
      {
        rule_type: 'audit',
        rule_name: '🔍 감사 규칙',
        rule_content: JSON.stringify([
          '계약금액 1천만원 초과: IT 내부감사인 포함',
          '계약금액 5천만원 이상: 감사본부장 포함',
          'IT본부장 전결: 천만원 이상~3억원 이하 구매/계약'
        ]),
        basis: 'IT자체감사 지침 제 10조[감사 실시] 7'
      }
    ];

    for (const rule of rules) {
      await sequelize.query(`
        INSERT INTO approval_rules (rule_type, rule_name, rule_content, basis)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING;
      `, {
        bind: [rule.rule_type, rule.rule_name, rule.rule_content, rule.basis]
      });
    }
    console.log('✅ 결재라인 규칙 데이터 삽입 완료');

    // 4. 결재라인 참고자료 데이터 삽입
    console.log('🌱 결재라인 참고자료 데이터 삽입...');
    const references = [
      {
        amount_range: '1천만원 이하',
        min_amount: 0,
        max_amount: 10000000,
        included_approvers: '경영관리팀장 (2백만원 초과 시)',
        final_approver: '팀장'
      },
      {
        amount_range: '1천만원 초과 ~ 5천만원 이하',
        min_amount: 10000000,
        max_amount: 50000000,
        included_approvers: 'IT내부감사인, 경영관리팀장',
        final_approver: '본부장'
      },
      {
        amount_range: '5천만원 초과 ~ 3억원 이하',
        min_amount: 50000000,
        max_amount: 300000000,
        included_approvers: 'IT내부감사인, 경영지원본부장, 감사본부장',
        final_approver: '본부장'
      },
      {
        amount_range: '3억원 초과 ~ 50억원 이하',
        min_amount: 300000000,
        max_amount: 5000000000,
        included_approvers: '경영지원실장, 감사본부장',
        final_approver: '대표이사'
      }
    ];

    for (const ref of references) {
      await sequelize.query(`
        INSERT INTO approval_references (amount_range, min_amount, max_amount, included_approvers, final_approver)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING;
      `, {
        bind: [ref.amount_range, ref.min_amount, ref.max_amount, ref.included_approvers, ref.final_approver]
      });
    }
    console.log('✅ 결재라인 참고자료 데이터 삽입 완료');

    // 5. 삽입된 데이터 확인
    console.log('\n📋 삽입된 데이터 확인...');
    
    const [approverCount] = await sequelize.query('SELECT COUNT(*) as count FROM approval_approvers;');
    const [conditionCount] = await sequelize.query('SELECT COUNT(*) as count FROM approval_conditions;');
    const [ruleCount] = await sequelize.query('SELECT COUNT(*) as count FROM approval_rules;');
    const [referenceCount] = await sequelize.query('SELECT COUNT(*) as count FROM approval_references;');
    
    console.log(`결재자 수: ${approverCount[0].count}개`);
    console.log(`결재자 조건 수: ${conditionCount[0].count}개`);
    console.log(`결재라인 규칙 수: ${ruleCount[0].count}개`);
    console.log(`참고자료 수: ${referenceCount[0].count}개`);

    console.log('\n✅ 결재라인 참조 데이터 이전 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

seedApprovalReferenceData(); 