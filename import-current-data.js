const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 새로운 데이터베이스 연결
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

// 임포트할 테이블 목록 (순서 중요 - 외래키 관계 고려)
const IMPORT_TABLES = [
  'departments',
  'budgets',
  'suppliers',
  'contract_methods',
  'cost_departments',
  'proposals',
  'request_departments',
  'purchase_items',
  'purchase_item_cost_allocations',
  'service_items',
  'contracts',
  'approval_lines',
  'approval_approvers',
  'approval_conditions',
  'approval_references',
  'approval_rules',
  'proposal_histories'
];

async function importCurrentData(importFileName) {
  try {
    console.log('🔄 데이터 임포트 시작...');
    
    // 연결 테스트
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // JSON 파일 읽기
    const importPath = path.join(__dirname, importFileName);
    
    if (!fs.existsSync(importPath)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${importFileName}`);
      console.log('💡 사용법: node import-current-data.js data-export-YYYY-MM-DDTHH-MM-SS.json');
      return;
    }
    
    console.log(`📂 파일 읽는 중: ${importFileName}`);
    const fileContent = fs.readFileSync(importPath, 'utf8');
    const importData = JSON.parse(fileContent);
    
    console.log('='.repeat(50));
    
    let totalImported = 0;
    
    // 각 테이블 데이터 임포트
    for (const tableName of IMPORT_TABLES) {
      try {
        const data = importData[tableName];
        
        if (!data || data.length === 0) {
          console.log(`⏭️  ${tableName}: 데이터 없음`);
          continue;
        }
        
        console.log(`📋 ${tableName} 임포트 중... (${data.length}개)`);
        
        // 테이블 존재 확인
        const [tableExists] = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          );
        `);
        
        if (!tableExists[0].exists) {
          console.log(`❌ ${tableName} 테이블이 존재하지 않습니다. 테이블을 먼저 생성해주세요.`);
          continue;
        }
        
        // 각 레코드 삽입
        let imported = 0;
        for (const record of data) {
          try {
            // 컬럼명과 값 추출
            const columns = Object.keys(record);
            const values = Object.values(record);
            
            // 플레이스홀더 생성
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            const columnsStr = columns.join(', ');
            
            // INSERT 쿼리 실행
            await sequelize.query(
              `INSERT INTO ${tableName} (${columnsStr}) VALUES (${placeholders})
               ON CONFLICT (id) DO UPDATE SET 
               ${columns.map(col => `${col} = EXCLUDED.${col}`).join(', ')}`,
              {
                bind: values
              }
            );
            
            imported++;
          } catch (error) {
            console.log(`  ⚠️  레코드 삽입 실패 (ID: ${record.id}): ${error.message}`);
          }
        }
        
        console.log(`✅ ${tableName}: ${imported}/${data.length}개 임포트 완료`);
        totalImported += imported;
        
        // 시퀀스 업데이트 (id 자동 증가를 위해)
        if (data.length > 0) {
          const maxId = Math.max(...data.map(r => r.id || 0));
          if (maxId > 0) {
            await sequelize.query(
              `SELECT setval('${tableName}_id_seq', ${maxId}, true);`
            );
          }
        }
        
      } catch (error) {
        console.log(`❌ ${tableName} 임포트 실패: ${error.message}`);
      }
    }
    
    console.log('='.repeat(50));
    console.log('✅ 데이터 임포트 완료!');
    console.log(`📊 총 ${totalImported}개 레코드 임포트됨`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ 데이터 임포트 실패:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// 실행
if (require.main === module) {
  const importFileName = process.argv[2];
  
  if (!importFileName) {
    console.error('❌ 임포트할 파일명을 지정해주세요.');
    console.log('💡 사용법: node import-current-data.js data-export-YYYY-MM-DDTHH-MM-SS.json');
    process.exit(1);
  }
  
  importCurrentData(importFileName);
}

module.exports = { importCurrentData }; 