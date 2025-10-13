const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
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

// 표준 계약방식 데이터
const STANDARD_CONTRACT_METHODS = [
  {
    value: 'direct',
    name: '수의계약',
    regulation: '사내규정 제3조 - 1천만원 이하 계약',
    minAmount: 0,
    maxAmount: 10000000,
    description: '1천만원 이하의 계약은 수의계약으로 진행',
    isActive: true
  },
  {
    value: 'bidding',
    name: '입찰계약',
    regulation: '사내규정 제5조 - 1천만원 초과 계약',
    minAmount: 10000001,
    maxAmount: null,
    description: '1천만원 초과 계약은 입찰을 통한 계약',
    isActive: true
  },
  {
    value: 'lowest',
    name: '최저가계약',
    regulation: '사내규정 제7조 - 3개 업체 이상 견적 비교',
    minAmount: 0,
    maxAmount: null,
    description: '3개 이상 업체의 견적을 비교하여 최저가 업체와 계약',
    isActive: true
  },
  {
    value: 'negotiation',
    name: '협상계약',
    regulation: '사내규정 제9조 - 특수한 경우의 계약',
    minAmount: 0,
    maxAmount: null,
    description: '기술적으로 복잡하거나 특수한 경우 협상을 통한 계약',
    isActive: true
  }
];

async function importContractMethods(dataSource = 'standard') {
  try {
    console.log('========================================');
    console.log('📥 계약방식 데이터 Import 시작');
    console.log('========================================');
    console.log('');
    
    // 연결 테스트
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    console.log('');
    
    let contractMethods = [];
    
    // 데이터 소스 선택
    if (dataSource === 'file') {
      // JSON 파일에서 읽기
      const files = fs.readdirSync(__dirname)
        .filter(f => f.match(/data-export-.*\.json/))
        .sort()
        .reverse();
      
      if (files.length === 0) {
        console.log('⚠️  export 파일을 찾을 수 없습니다. 표준 데이터를 사용합니다.');
        contractMethods = STANDARD_CONTRACT_METHODS;
      } else {
        const latestFile = files[0];
        console.log(`📂 파일에서 읽기: ${latestFile}`);
        const exportData = JSON.parse(fs.readFileSync(path.join(__dirname, latestFile), 'utf8'));
        
        if (exportData.contract_methods && exportData.contract_methods.length > 0) {
          contractMethods = exportData.contract_methods;
          console.log(`✅ ${contractMethods.length}개의 계약방식 데이터를 파일에서 읽었습니다.`);
        } else {
          console.log('⚠️  파일에 contract_methods 데이터가 없습니다. 표준 데이터를 사용합니다.');
          contractMethods = STANDARD_CONTRACT_METHODS;
        }
      }
    } else {
      // 표준 데이터 사용
      console.log('📋 표준 계약방식 데이터를 사용합니다.');
      contractMethods = STANDARD_CONTRACT_METHODS;
    }
    
    console.log('');
    
    // 테이블 존재 확인
    const [tableExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'contract_methods'
      );
    `);
    
    if (!tableExists[0].exists) {
      console.log('❌ contract_methods 테이블이 존재하지 않습니다.');
      console.log('먼저 테이블을 생성해주세요.');
      return;
    }
    
    console.log('✅ contract_methods 테이블 확인');
    console.log('');
    
    // 현재 데이터 확인
    const [existingData] = await sequelize.query('SELECT * FROM contract_methods;');
    console.log(`📊 현재 등록된 계약방식: ${existingData.length}개`);
    
    if (existingData.length > 0) {
      console.log('');
      console.log('기존 데이터:');
      existingData.forEach(method => {
        console.log(`  - ${method.name} (${method.value})`);
      });
      console.log('');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('기존 데이터를 삭제하고 새로 Import하시겠습니까? (Y/N): ', resolve);
      });
      readline.close();
      
      if (answer.toLowerCase() !== 'y') {
        console.log('❌ Import가 취소되었습니다.');
        return;
      }
      
      // 기존 데이터 삭제
      console.log('');
      console.log('🗑️  기존 데이터 삭제 중...');
      await sequelize.query('DELETE FROM contract_methods;');
      await sequelize.query('ALTER SEQUENCE contract_methods_id_seq RESTART WITH 1;');
      console.log('✅ 기존 데이터 삭제 완료');
    }
    
    console.log('');
    console.log('📥 새로운 데이터 Import 중...');
    console.log('');
    
    // 데이터 삽입
    let imported = 0;
    for (const method of contractMethods) {
      try {
        const fields = [];
        const values = [];
        const params = [];
        let paramCount = 1;
        
        // 동적으로 필드와 값 구성
        if (method.value) {
          fields.push('value');
          values.push(`$${paramCount++}`);
          params.push(method.value);
        }
        
        if (method.name) {
          fields.push('name');
          values.push(`$${paramCount++}`);
          params.push(method.name);
        }
        
        if (method.regulation || method.basis) {
          fields.push('regulation');
          values.push(`$${paramCount++}`);
          params.push(method.regulation || method.basis || '');
        }
        
        if (method.minAmount !== undefined) {
          fields.push('min_amount');
          values.push(`$${paramCount++}`);
          params.push(method.minAmount || method.min_amount || null);
        }
        
        if (method.maxAmount !== undefined) {
          fields.push('max_amount');
          values.push(`$${paramCount++}`);
          params.push(method.maxAmount || method.max_amount || null);
        }
        
        if (method.isActive !== undefined || method.is_active !== undefined) {
          fields.push('is_active');
          values.push(`$${paramCount++}`);
          params.push(method.isActive !== undefined ? method.isActive : method.is_active);
        }
        
        if (method.description) {
          fields.push('description');
          values.push(`$${paramCount++}`);
          params.push(method.description);
        }
        
        const query = `
          INSERT INTO contract_methods (${fields.join(', ')})
          VALUES (${values.join(', ')})
          ON CONFLICT (value) DO UPDATE SET
            name = EXCLUDED.name,
            regulation = EXCLUDED.regulation,
            min_amount = EXCLUDED.min_amount,
            max_amount = EXCLUDED.max_amount,
            is_active = EXCLUDED.is_active,
            description = EXCLUDED.description,
            updated_at = NOW()
          RETURNING *;
        `;
        
        const [result] = await sequelize.query(query, {
          bind: params
        });
        
        console.log(`  ✅ ${result[0].name} (${result[0].value})`);
        imported++;
        
      } catch (error) {
        console.log(`  ❌ ${method.name} Import 실패: ${error.message}`);
      }
    }
    
    console.log('');
    console.log('========================================');
    console.log('✅ Import 완료!');
    console.log('========================================');
    console.log(`📊 총 ${imported}개의 계약방식이 Import되었습니다.`);
    console.log('');
    
    // 최종 데이터 확인
    const [finalData] = await sequelize.query(`
      SELECT id, value, name, regulation, min_amount, max_amount, is_active 
      FROM contract_methods 
      ORDER BY id;
    `);
    
    console.log('📋 Import된 계약방식 목록:');
    console.log('');
    finalData.forEach(method => {
      const amountRange = method.min_amount !== null || method.max_amount !== null
        ? ` [${method.min_amount || 0}원 ~ ${method.max_amount ? method.max_amount + '원' : '무제한'}]`
        : '';
      console.log(`  ${method.id}. ${method.name} (${method.value})${amountRange}`);
      console.log(`     근거: ${method.regulation}`);
      console.log(`     상태: ${method.is_active ? '활성' : '비활성'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Import 실패:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// 실행
if (require.main === module) {
  const dataSource = process.argv[2] || 'standard';
  
  console.log('');
  console.log('사용법:');
  console.log('  node import-contract-methods.js           # 표준 데이터 사용');
  console.log('  node import-contract-methods.js file       # export 파일에서 읽기');
  console.log('');
  
  importContractMethods(dataSource);
}

module.exports = { importContractMethods };

