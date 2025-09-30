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

async function checkContractMethodId() {
  try {
    console.log('🔍 contract_method_id 컬럼 상세 체크\n');
    
    await sequelize.authenticate();
    
    // 1. 컬럼 정의 확인
    const [columnInfo] = await sequelize.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'proposals' 
        AND column_name = 'contract_method_id'
    `);
    
    console.log('📋 1. 컬럼 정의:');
    console.log(columnInfo[0]);
    console.log();
    
    // 2. 외래키 관계 확인
    const [fkInfo] = await sequelize.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_name = 'proposals' 
        AND kcu.column_name = 'contract_method_id'
    `);
    
    console.log('📋 2. 외래키 관계:');
    if (fkInfo.length > 0) {
      console.log(fkInfo[0]);
    } else {
      console.log('⚠️  외래키가 설정되지 않았습니다!');
    }
    console.log();
    
    // 3. 데이터 샘플 확인
    const [dataSamples] = await sequelize.query(`
      SELECT 
        id, 
        title, 
        contract_method_id,
        contract_method,
        created_at
      FROM proposals 
      ORDER BY id DESC
      LIMIT 10
    `);
    
    console.log('📋 3. 최근 데이터 샘플 (contract_method_id 값):');
    dataSamples.forEach((row, idx) => {
      const titlePreview = row.title ? row.title.substring(0, 40) : 'null';
      console.log(`${idx+1}. ID: ${row.id} | contract_method_id: ${row.contract_method_id} | contract_method: ${row.contract_method || 'null'}`);
      console.log(`   제목: ${titlePreview}`);
    });
    console.log();
    
    // 4. 통계
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(contract_method_id) as with_method_id,
        COUNT(*) - COUNT(contract_method_id) as null_method_id
      FROM proposals
    `);
    
    console.log('📊 4. 통계:');
    console.log(`총 품의서: ${stats[0].total}개`);
    console.log(`contract_method_id가 있는 품의서: ${stats[0].with_method_id}개`);
    console.log(`contract_method_id가 NULL인 품의서: ${stats[0].null_method_id}개`);
    console.log();
    
    // 5. contract_methods 테이블 확인
    const [methodsData] = await sequelize.query(`
      SELECT id, value, name, is_active
      FROM contract_methods
      ORDER BY id
    `);
    
    console.log('📋 5. contract_methods 테이블 데이터:');
    if (methodsData.length > 0) {
      methodsData.forEach(method => {
        console.log(`ID: ${method.id} | value: ${method.value} | name: ${method.name} | is_active: ${method.is_active}`);
      });
    } else {
      console.log('⚠️  contract_methods 테이블이 비어있습니다!');
    }
    console.log();
    
    // 6. 관계 매칭 확인
    const [joinCheck] = await sequelize.query(`
      SELECT 
        p.id,
        p.title,
        p.contract_method_id,
        cm.id as method_id,
        cm.name as method_name,
        cm.value as method_value
      FROM proposals p
      LEFT JOIN contract_methods cm ON p.contract_method_id = cm.id
      WHERE p.contract_method_id IS NOT NULL
      LIMIT 5
    `);
    
    console.log('📋 6. proposals와 contract_methods 조인 확인:');
    if (joinCheck.length > 0) {
      joinCheck.forEach((row, idx) => {
        console.log(`${idx+1}. Proposal ID: ${row.id} | contract_method_id: ${row.contract_method_id}`);
        console.log(`   => 연결된 계약방식: ${row.method_name} (${row.method_value})`);
      });
    } else {
      console.log('⚠️  contract_method_id가 설정된 품의서가 없습니다!');
    }
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkContractMethodId(); 