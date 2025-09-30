const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 현재 데이터베이스 연결
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

// 내보낼 테이블 목록 (순서 중요)
const EXPORT_TABLES = [
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

async function exportSchemaAndData() {
  try {
    console.log('🔄 스키마 및 데이터 내보내기 시작...');
    
    // 연결 테스트
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        databaseName: process.env.DB_NAME || 'contract_management',
        totalTables: 0,
        totalRecords: 0
      },
      schemas: {},
      data: {},
      indexes: {},
      foreignKeys: {},
      sequences: {}
    };
    
    console.log('\n📋 1단계: 스키마 정보 내보내기...');
    console.log('='.repeat(50));
    
    // 각 테이블의 스키마 정보 수집
    for (const tableName of EXPORT_TABLES) {
      try {
        console.log(`🔍 ${tableName} 스키마 분석 중...`);
        
        // 테이블 존재 확인
        const [tableExists] = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          );
        `);
        
        if (!tableExists[0].exists) {
          console.log(`⏭️  ${tableName} 테이블이 존재하지 않습니다. 건너뜁니다.`);
          continue;
        }
        
        // 1. 컬럼 정보
        const [columns] = await sequelize.query(`
          SELECT 
            column_name,
            data_type,
            character_maximum_length,
            numeric_precision,
            numeric_scale,
            is_nullable,
            column_default,
            ordinal_position
          FROM information_schema.columns
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position
        `);
        
        // 2. 기본키 정보
        const [primaryKeys] = await sequelize.query(`
          SELECT kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = '${tableName}' 
            AND tc.constraint_type = 'PRIMARY KEY'
        `);
        
        // 3. 인덱스 정보
        const [indexes] = await sequelize.query(`
          SELECT 
            indexname,
            indexdef
          FROM pg_indexes 
          WHERE tablename = '${tableName}'
        `);
        
        // 4. 외래키 정보
        const [foreignKeys] = await sequelize.query(`
          SELECT 
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            tc.constraint_name
          FROM information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = '${tableName}'
        `);
        
        // 스키마 정보 저장
        exportData.schemas[tableName] = {
          columns: columns,
          primaryKeys: primaryKeys.map(pk => pk.column_name),
          foreignKeys: foreignKeys,
          tableName: tableName
        };
        
        // 인덱스 정보 저장
        exportData.indexes[tableName] = indexes;
        
        console.log(`✅ ${tableName}: ${columns.length}개 컬럼, ${primaryKeys.length}개 기본키, ${foreignKeys.length}개 외래키`);
        
      } catch (error) {
        console.log(`❌ ${tableName} 스키마 분석 실패: ${error.message}`);
      }
    }
    
    console.log('\n📋 2단계: 시퀀스 정보 내보내기...');
    console.log('='.repeat(50));
    
    // 시퀀스 정보 수집
    const [sequences] = await sequelize.query(`
      SELECT 
        schemaname,
        sequencename,
        last_value,
        start_value,
        increment_by,
        max_value,
        min_value,
        cache_value,
        is_cycled
      FROM pg_sequences 
      WHERE schemaname = 'public'
    `);
    
    exportData.sequences = sequences;
    console.log(`✅ 시퀀스 정보: ${sequences.length}개`);
    
    console.log('\n📋 3단계: 데이터 내보내기...');
    console.log('='.repeat(50));
    
    let totalRecords = 0;
    let totalTables = 0;
    
    // 각 테이블 데이터 내보내기
    for (const tableName of EXPORT_TABLES) {
      try {
        console.log(`📋 ${tableName} 데이터 내보내는 중...`);
        
        // 테이블 존재 확인
        const [tableExists] = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          );
        `);
        
        if (!tableExists[0].exists) {
          console.log(`⏭️  ${tableName} 테이블이 존재하지 않습니다. 건너뜁니다.`);
          continue;
        }
        
        // 데이터 조회
        const [results] = await sequelize.query(`SELECT * FROM ${tableName} ORDER BY id`);
        exportData.data[tableName] = results;
        
        totalRecords += results.length;
        totalTables++;
        
        console.log(`✅ ${tableName}: ${results.length}개 데이터 내보냄`);
        
      } catch (error) {
        console.log(`❌ ${tableName} 데이터 내보내기 실패: ${error.message}`);
        exportData.data[tableName] = [];
      }
    }
    
    // 메타데이터 업데이트
    exportData.metadata.totalTables = totalTables;
    exportData.metadata.totalRecords = totalRecords;
    
    console.log('\n📋 4단계: 파일 저장...');
    console.log('='.repeat(50));
    
    // JSON 파일로 저장
    const exportFileName = `complete-export-${timestamp}.json`;
    const exportPath = path.join(__dirname, exportFileName);
    
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf8');
    
    // SQL 스크립트도 생성
    const sqlFileName = `schema-${timestamp}.sql`;
    const sqlPath = path.join(__dirname, sqlFileName);
    let sqlContent = '-- 데이터베이스 스키마 생성 스크립트\n';
    sqlContent += `-- 생성일: ${new Date().toISOString()}\n\n`;
    
    // 테이블 생성 SQL 생성
    for (const [tableName, schema] of Object.entries(exportData.schemas)) {
      sqlContent += `-- ${tableName} 테이블\n`;
      sqlContent += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      
      const columnDefs = schema.columns.map(col => {
        let def = `  ${col.column_name} ${col.data_type}`;
        
        if (col.character_maximum_length) {
          def += `(${col.character_maximum_length})`;
        } else if (col.numeric_precision) {
          def += `(${col.numeric_precision}${col.numeric_scale ? ',' + col.numeric_scale : ''})`;
        }
        
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }
        
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }
        
        return def;
      });
      
      sqlContent += columnDefs.join(',\n');
      
      // 기본키 추가
      if (schema.primaryKeys.length > 0) {
        sqlContent += `,\n  PRIMARY KEY (${schema.primaryKeys.join(', ')})`;
      }
      
      sqlContent += '\n);\n\n';
    }
    
    // 외래키 제약조건 추가
    for (const [tableName, schema] of Object.entries(exportData.schemas)) {
      if (schema.foreignKeys.length > 0) {
        schema.foreignKeys.forEach(fk => {
          sqlContent += `ALTER TABLE ${tableName} ADD CONSTRAINT ${fk.constraint_name} `;
          sqlContent += `FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name});\n`;
        });
        sqlContent += '\n';
      }
    }
    
    fs.writeFileSync(sqlPath, sqlContent, 'utf8');
    
    console.log('='.repeat(60));
    console.log('✅ 스키마 및 데이터 내보내기 완료!');
    console.log(`📁 완전한 내보내기 파일: ${exportFileName}`);
    console.log(`📁 스키마 SQL 파일: ${sqlFileName}`);
    console.log('='.repeat(60));
    
    // 요약 정보 출력
    console.log('\n📊 내보내기 요약:');
    console.log(`   총 테이블: ${totalTables}개`);
    console.log(`   총 레코드: ${totalRecords}개`);
    console.log(`   시퀀스: ${sequences.length}개`);
    
    console.log('\n📋 테이블별 상세:');
    for (const [tableName, data] of Object.entries(exportData.data)) {
      if (data.length > 0) {
        const schema = exportData.schemas[tableName];
        console.log(`   ${tableName}: ${data.length}개 레코드, ${schema?.columns.length || 0}개 컬럼`);
      }
    }
    
    console.log('\n🔍 스키마 정보:');
    for (const [tableName, schema] of Object.entries(exportData.schemas)) {
      console.log(`   ${tableName}:`);
      console.log(`     - 컬럼: ${schema.columns.length}개`);
      console.log(`     - 기본키: ${schema.primaryKeys.length}개`);
      console.log(`     - 외래키: ${schema.foreignKeys.length}개`);
    }
    
    return { exportFileName, sqlFileName };
    
  } catch (error) {
    console.error('❌ 내보내기 실패:', error.message);
    return null;
  } finally {
    await sequelize.close();
  }
}

// 실행
if (require.main === module) {
  exportSchemaAndData();
}

module.exports = { exportSchemaAndData }; 