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

async function verifyAllIssues() {
  try {
    await sequelize.authenticate();
    console.log('🔍 SCHEMA_MIGRATION_FIXES.md에서 지적한 문제들 검증\n');
    console.log('='.repeat(80));
    
    const issues = [];
    
    // 1. business_budgets 테이블 체크
    console.log('\n1️⃣ business_budgets 테이블 컬럼 확인');
    const [bbCols] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'business_budgets'
    `);
    const bbColNames = bbCols.map(c => c.column_name);
    
    const requiredBBCols = ['start_date', 'end_date', 'project_purpose'];
    requiredBBCols.forEach(col => {
      if (bbColNames.includes(col)) {
        console.log(`   ✅ ${col} - 존재함`);
      } else {
        console.log(`   ❌ ${col} - 누락!`);
        issues.push(`business_budgets.${col} 컬럼 누락`);
      }
    });
    
    // 2. approval_lines 테이블 구조 체크
    console.log('\n2️⃣ approval_lines 테이블 구조 확인');
    const [alCols] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'approval_lines'
      ORDER BY ordinal_position
    `);
    
    console.log('   실제 컬럼들:');
    alCols.forEach(c => console.log(`      - ${c.column_name}`));
    
    const requiredALCols = ['proposal_id', 'step', 'is_conditional', 'is_final', 'approved_at', 'approved_by'];
    const alColNames = alCols.map(c => c.column_name);
    
    console.log('\n   필수 컬럼 체크:');
    requiredALCols.forEach(col => {
      if (alColNames.includes(col)) {
        console.log(`   ✅ ${col} - 존재함`);
      } else {
        console.log(`   ❌ ${col} - 누락!`);
        issues.push(`approval_lines.${col} 컬럼 누락`);
      }
    });
    
    // 3. purchase_items 테이블 - 문서에서 말한 필드명 확인
    console.log('\n3️⃣ purchase_items 테이블 필드명 확인');
    const [piCols] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'purchase_items'
    `);
    const piColNames = piCols.map(c => c.column_name);
    
    // 문서에서 말한 구조 vs 실제 구조
    const fieldCheck = [
      { doc: 'item_name', current: 'item', desc: '구매품목' },
      { doc: 'specification', current: 'product_name', desc: '사양/제품명' },
      { doc: 'manufacturer', current: 'supplier', desc: '제조사/공급업체' },
      { doc: 'model_number', current: null, desc: '모델번호' },
      { doc: 'delivery_location', current: null, desc: '납품장소' },
      { doc: 'notes', current: null, desc: '비고' }
    ];
    
    console.log('\n   문서 vs 현재 환경:');
    fieldCheck.forEach(f => {
      const hasDoc = piColNames.includes(f.doc);
      const hasCurrent = f.current ? piColNames.includes(f.current) : false;
      
      if (hasDoc) {
        console.log(`   ✅ ${f.doc.padEnd(20)} - 문서 구조로 존재 (${f.desc})`);
      } else if (hasCurrent) {
        console.log(`   ⚠️  ${f.current.padEnd(20)} - 다른 이름으로 존재 (문서는 ${f.doc})`);
        issues.push(`purchase_items: ${f.current} → ${f.doc} 변경 필요`);
      } else {
        console.log(`   ❌ ${f.doc.padEnd(20)} - 누락! (${f.desc})`);
        issues.push(`purchase_items.${f.doc} 컬럼 누락`);
      }
    });
    
    // 4. 외래키 관계 확인
    console.log('\n4️⃣ 외래키 관계 확인');
    
    // purchase_items.supplier_id
    if (piColNames.includes('supplier_id')) {
      console.log('   ✅ purchase_items.supplier_id 존재 (문서는 없어야 한다고 함)');
      issues.push('purchase_items.supplier_id는 없어야 함 (문서)');
    } else {
      console.log('   ⚠️  purchase_items.supplier_id 없음 (문서와 일치)');
    }
    
    // proposals.contract_method_id
    const [pCols] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'proposals' AND column_name = 'contract_method_id'
    `);
    
    if (pCols.length > 0) {
      console.log('   ⚠️  proposals.contract_method_id 존재 (모델에 없음)');
      issues.push('proposals.contract_method_id는 모델에 추가 필요');
    } else {
      console.log('   ✅ proposals.contract_method_id 없음');
    }
    
    // 요약
    console.log('\n' + '='.repeat(80));
    console.log('📊 검증 요약\n');
    
    if (issues.length === 0) {
      console.log('✅ 모든 검증 통과! 문제 없음.');
    } else {
      console.log(`⚠️  ${issues.length}개의 문제 발견:\n`);
      issues.forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue}`);
      });
      
      console.log('\n💡 해결 방법:');
      console.log('1. SCHEMA_MIGRATION_FIXES.md의 해결 절차를 따라 수정');
      console.log('2. 모든 수정 후 create-complete-tables.js 업데이트');
      console.log('3. 모델 파일들 수정');
      console.log('4. 마이그레이션 스크립트 재테스트');
    }
    
    console.log('='.repeat(80));
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ 오류:', error.message);
    await sequelize.close();
  }
}

verifyAllIssues(); 