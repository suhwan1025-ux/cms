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

async function compareDbVsModels() {
  try {
    console.log('🔍 데이터베이스와 모델 비교 시작...\n');
    await sequelize.authenticate();
    
    // 비교할 주요 테이블들
    const tablesToCheck = [
      'proposals',
      'purchase_items',
      'service_items',
      'budgets',
      'cost_departments',
      'departments',
      'suppliers',
      'contracts'
    ];
    
    for (const tableName of tablesToCheck) {
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
      
      console.log(`\n✅ 실제 DB 컬럼 (${dbColumns.length}개):`);
      dbColumns.forEach((col, idx) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const maxLen = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        console.log(`   ${(idx + 1).toString().padStart(2)}. ${col.column_name.padEnd(30)} ${col.data_type}${maxLen} ${nullable}`);
      });
      
      // 모델 파일 읽기 시도
      const modelFiles = {
        'proposals': 'Proposal.js',
        'purchase_items': 'PurchaseItem.js',
        'service_items': 'ServiceItem.js',
        'budgets': 'Budget.js',
        'cost_departments': 'CostDepartment.js',
        'departments': 'Department.js',
        'suppliers': 'Supplier.js',
        'contracts': 'Contract.js'
      };
      
      const modelFile = modelFiles[tableName];
      if (modelFile) {
        const modelPath = path.join(__dirname, 'src', 'models', modelFile);
        
        if (fs.existsSync(modelPath)) {
          const modelContent = fs.readFileSync(modelPath, 'utf8');
          
          // 모델에서 필드 추출 (간단한 정규식)
          const fieldMatches = modelContent.match(/(\w+):\s*{[^}]*type:\s*DataTypes\.(\w+)/g);
          
          if (fieldMatches) {
            console.log(`\n📝 모델 정의 (${fieldMatches.length}개):`);
            fieldMatches.forEach((match, idx) => {
              const fieldName = match.match(/(\w+):/)[1];
              const dataType = match.match(/DataTypes\.(\w+)/)[1];
              console.log(`   ${(idx + 1).toString().padStart(2)}. ${fieldName.padEnd(30)} ${dataType}`);
            });
          }
          
          // 차이점 분석
          const dbColumnNames = dbColumns.map(c => c.column_name);
          const modelFieldNames = fieldMatches ? fieldMatches.map(m => {
            const match = m.match(/(\w+):/);
            return match ? match[1] : null;
          }).filter(Boolean) : [];
          
          const missingInDb = modelFieldNames.filter(f => {
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
            }
            if (missingInModel.length > 0) {
              console.log('   ❌ DB에만 있음 (모델에 없음):');
              missingInModel.forEach(f => console.log(`      - ${f}`));
            }
          } else {
            console.log('\n✅ 모델과 DB가 일치합니다!');
          }
        }
      }
      
      console.log('\n');
    }
    
    console.log('='.repeat(80));
    console.log('🎯 분석 완료!\n');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  compareDbVsModels();
}

module.exports = { compareDbVsModels }; 