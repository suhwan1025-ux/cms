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

async function checkThreeColumns() {
  try {
    await sequelize.authenticate();
    console.log('🔍 3개 테이블의 특정 컬럼 확인\n');
    console.log('='.repeat(80));
    
    // 1. contract_methods 테이블의 value 컬럼
    console.log('\n1️⃣ contract_methods 테이블');
    const [cmCols] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'contract_methods'
      ORDER BY ordinal_position
    `);
    
    console.log('   전체 컬럼:');
    cmCols.forEach((col, idx) => {
      const marker = col.column_name === 'value' ? ' ← 확인 대상!' : '';
      console.log(`   ${(idx + 1).toString().padStart(2)}. ${col.column_name.padEnd(25)} ${col.data_type}${marker}`);
    });
    
    const hasValue = cmCols.some(c => c.column_name === 'value');
    console.log(`\n   ✓ value 컬럼 존재: ${hasValue ? '✅ 있음' : '❌ 없음'}`);
    
    // value 컬럼 데이터 확인
    if (hasValue) {
      const [values] = await sequelize.query(`SELECT id, value, name FROM contract_methods LIMIT 5`);
      console.log('\n   데이터 샘플:');
      values.forEach(v => console.log(`      ID ${v.id}: value="${v.value}", name="${v.name}"`));
    }
    
    // 2. proposals 테이블의 contract_method_id 컬럼
    console.log('\n\n2️⃣ proposals 테이블');
    const [pCols] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'proposals'
      ORDER BY ordinal_position
    `);
    
    const contractMethodCols = pCols.filter(c => 
      c.column_name.includes('contract') && c.column_name.includes('method')
    );
    
    console.log('   계약방식 관련 컬럼:');
    contractMethodCols.forEach(col => {
      const marker = col.column_name === 'contract_method_id' ? ' ← 확인 대상!' : '';
      console.log(`      - ${col.column_name.padEnd(25)} ${col.data_type}${marker}`);
    });
    
    const hasContractMethodId = pCols.some(c => c.column_name === 'contract_method_id');
    const hasContractMethod = pCols.some(c => c.column_name === 'contract_method');
    
    console.log(`\n   ✓ contract_method_id 존재: ${hasContractMethodId ? '✅ 있음' : '❌ 없음'}`);
    console.log(`   ✓ contract_method 존재: ${hasContractMethod ? '✅ 있음' : '❌ 없음'}`);
    
    // 데이터 확인
    if (hasContractMethodId) {
      const [data] = await sequelize.query(`
        SELECT id, contract_method, contract_method_id 
        FROM proposals 
        WHERE contract_method_id IS NOT NULL 
        LIMIT 5
      `);
      console.log(`\n   contract_method_id 사용 현황: ${data.length > 0 ? '사용 중' : '모두 NULL'}`);
      if (data.length > 0) {
        data.forEach(d => console.log(`      Proposal ${d.id}: method="${d.contract_method}", method_id=${d.contract_method_id}`));
      }
    }
    
    // 3. request_departments 테이블의 name 컬럼
    console.log('\n\n3️⃣ request_departments 테이블');
    const [rdCols] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'request_departments'
      ORDER BY ordinal_position
    `);
    
    console.log('   전체 컬럼:');
    rdCols.forEach((col, idx) => {
      const marker = col.column_name === 'name' ? ' ← 확인 대상!' : '';
      console.log(`   ${(idx + 1).toString().padStart(2)}. ${col.column_name.padEnd(25)} ${col.data_type}${marker}`);
    });
    
    const hasName = rdCols.some(c => c.column_name === 'name');
    console.log(`\n   ✓ name 컬럼 존재: ${hasName ? '✅ 있음' : '❌ 없음'}`);
    
    // name 컬럼 데이터 확인
    if (hasName) {
      const [names] = await sequelize.query(`SELECT id, proposal_id, name FROM request_departments LIMIT 5`);
      console.log(`\n   데이터 샘플 (${names.length}개):`);
      names.forEach(n => console.log(`      ID ${n.id} (Proposal ${n.proposal_id}): name="${n.name}"`));
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 확인 완료!\n');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ 오류:', error.message);
    await sequelize.close();
  }
}

checkThreeColumns(); 