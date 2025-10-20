const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');
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

async function compareAllTables() {
  try {
    console.log('🔍 모든 테이블 포괄 비교 시작...\n');
    await sequelize.authenticate();
    
    // 모든 주요 테이블들 (모델 매핑 포함)
    const tablesToCheck = [
      { table: 'proposals', model: 'Proposal.js' },
      { table: 'purchase_items', model: 'PurchaseItem.js' },
      { table: 'service_items', model: 'ServiceItem.js' },
      { table: 'budgets', model: 'Budget.js' },
      { table: 'cost_departments', model: 'CostDepartment.js' },
      { table: 'departments', model: 'Department.js' },
      { table: 'suppliers', model: 'Supplier.js' },
      { table: 'contracts', model: 'Contract.js' },
      { table: 'approval_lines', model: 'ApprovalLine.js' },
      { table: 'contract_methods', model: 'ContractMethod.js' },
      { table: 'request_departments', model: 'RequestDepartment.js' },
      { table: 'proposal_histories', model: 'ProposalHistory.js' },
      { table: 'business_budgets', model: null },
      { table: 'business_budget_details', model: null },
      { table: 'business_budget_approvals', model: null }
    ];
    
    const issues = [];
    
    for (const { table: tableName, model: modelFile } of tablesToCheck) {
      console.log('='.repeat(80));
      console.log(`📋 테이블: ${tableName}`);
      console.log('='.repeat(80));
      
      // 실제 DB의 컬럼 조회
      const [dbColumns] = await sequelize.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
        ORDER BY ordinal_position;
      `);
      
      if (dbColumns.length === 0) {
        console.log(`⚠️  테이블이 DB에 존재하지 않습니다!\n`);
        issues.push({ table: tableName, issue: 'DB에 테이블 없음' });
        continue;
      }
      
      console.log(`\n✅ 실제 DB 컬럼 (${dbColumns.length}개):`);
      dbColumns.forEach((col, idx) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const maxLen = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        console.log(`   ${(idx + 1).toString().padStart(2)}. ${col.column_name.padEnd(30)} ${col.data_type}${maxLen.padEnd(10)} ${nullable}`);
      });
      
      // 모델 파일이 있는 경우
      if (modelFile) {
        const modelPath = path.join(__dirname, 'src', 'models', modelFile);
        
        if (fs.existsSync(modelPath)) {
          const modelContent = fs.readFileSync(modelPath, 'utf8');
          
          // 모델에서 필드 추출
          const fieldMatches = modelContent.match(/(\w+):\s*{[^}]*type:\s*DataTypes\.(\w+)/g);
          
          if (fieldMatches) {
            console.log(`\n📝 모델 정의 (${fieldMatches.length}개):`);
            
            const dbColumnNames = dbColumns.map(c => c.column_name);
            const modelFieldNames = fieldMatches.map(m => {
              const match = m.match(/(\w+):/);
              return match ? match[1] : null;
            }).filter(Boolean);
            
            // 차이점 분석
            const missingInDb = modelFieldNames.filter(f => {
              if (f === 'createdAt' || f === 'updatedAt') {
                return !dbColumnNames.includes('created_at') && !dbColumnNames.includes('updated_at');
              }
              const snakeCase = f.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
              return !dbColumnNames.includes(snakeCase);
            });
            
            const missingInModel = dbColumnNames.filter(c => {
              if (c === 'created_at' || c === 'updated_at') return false;
              const camelCase = c.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
              return !modelFieldNames.includes(camelCase);
            });
            
            if (missingInDb.length > 0 || missingInModel.length > 0) {
              console.log('\n⚠️  차이점 발견:');
              if (missingInDb.length > 0) {
                console.log('   ❌ 모델에만 있음 (DB에 없음):');
                missingInDb.forEach(f => console.log(`      - ${f}`));
                issues.push({ table: tableName, issue: `모델에만 있음: ${missingInDb.join(', ')}` });
              }
              if (missingInModel.length > 0) {
                console.log('   ❌ DB에만 있음 (모델에 없음):');
                missingInModel.forEach(f => console.log(`      - ${f}`));
                issues.push({ table: tableName, issue: `DB에만 있음: ${missingInModel.join(', ')}` });
              }
            } else {
              console.log('\n✅ 모델과 DB가 완벽히 일치합니다!');
            }
          }
        } else {
          console.log(`\n⚠️  모델 파일을 찾을 수 없음: ${modelFile}`);
          issues.push({ table: tableName, issue: `모델 파일 없음: ${modelFile}` });
        }
      } else {
        console.log(`\n📝 모델 없음 (SQL로 직접 관리되는 테이블)`);
      }
      
      console.log('\n');
    }
    
    // 요약
    console.log('='.repeat(80));
    console.log('📊 검토 요약\n');
    
    if (issues.length === 0) {
      console.log('✅ 모든 테이블이 동기화되어 있습니다!');
    } else {
      console.log(`⚠️  ${issues.length}개의 이슈가 발견되었습니다:\n`);
      issues.forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue.table}: ${issue.issue}`);
      });
    }
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  compareAllTables();
}

module.exports = { compareAllTables }; 