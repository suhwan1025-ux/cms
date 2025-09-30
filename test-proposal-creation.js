const { Sequelize } = require('sequelize');

// 데이터베이스 연결
const sequelize = new Sequelize(
  'contract_management',
  'postgres',
  'meritz123!',
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function testProposalCreation() {
  try {
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');
    
    // proposals 테이블 구조 확인
    const tableInfo = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'proposals' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 proposals 테이블 구조:');
    tableInfo[0].forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 테스트 데이터로 품의서 생성 시도
    const testProposal = {
      contractType: 'purchase',
      purpose: '테스트 품의서',
      basis: '테스트 근거',
      budgetId: 1,
      contractMethod: '일반계약',
      accountSubject: '테스트 계정',
      totalAmount: 1000000,
      status: 'draft',
      createdBy: '테스트사용자',
      isDraft: true
    };
    
    console.log('\n🧪 테스트 품의서 데이터:', testProposal);
    
    // 직접 SQL로 삽입 시도
    const insertResult = await sequelize.query(`
      INSERT INTO proposals (
        contract_type, purpose, basis, budget_id, contract_method, 
        account_subject, total_amount, status, created_by, is_draft,
        created_at, updated_at
      ) VALUES (
        :contractType, :purpose, :basis, :budgetId, :contractMethod,
        :accountSubject, :totalAmount, :status, :createdBy, :isDraft,
        NOW(), NOW()
      ) RETURNING id
    `, {
      replacements: testProposal,
      type: Sequelize.QueryTypes.INSERT
    });
    
    console.log('✅ 테스트 품의서 생성 성공:', insertResult[0][0]);
    
    // 생성된 품의서 조회
    const createdProposal = await sequelize.query(`
      SELECT * FROM proposals WHERE id = :id
    `, {
      replacements: { id: insertResult[0][0].id },
      type: Sequelize.QueryTypes.SELECT
    });
    
    console.log('\n📄 생성된 품의서:', createdProposal[0]);
    
    // 테스트 데이터 삭제
    await sequelize.query(`
      DELETE FROM proposals WHERE id = :id
    `, {
      replacements: { id: insertResult[0][0].id }
    });
    
    console.log('🧹 테스트 데이터 정리 완료');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    
    if (error.message.includes('notNull Violation')) {
      console.log('\n🔍 notNull 위반 필드:');
      console.log('- contractType:', error.fields?.contractType);
      console.log('- createdBy:', error.fields?.createdBy);
      console.log('- purpose:', error.fields?.purpose);
    }
  } finally {
    await sequelize.close();
  }
}

testProposalCreation(); 