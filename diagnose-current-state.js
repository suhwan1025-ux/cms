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

async function diagnoseCurrentState() {
  try {
    console.log('🔍 현재 데이터베이스 상태 진단...\n');
    
    // 1. 연결 확인
    console.log('📋 1단계: 데이터베이스 연결 확인');
    console.log('='.repeat(60));
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    console.log(`   데이터베이스: ${process.env.DB_NAME || 'contract_management'}`);
    console.log(`   호스트: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
    
    // 2. 모든 테이블 목록
    console.log('\n📋 2단계: 테이블 목록 확인');
    console.log('='.repeat(60));
    const [tables] = await sequelize.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`총 ${tables.length}개 테이블 발견:\n`);
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name} (${table.column_count}개 컬럼)`);
    });
    
    // 3. 각 테이블의 데이터 개수
    console.log('\n📋 3단계: 테이블별 데이터 개수');
    console.log('='.repeat(60));
    
    const tableStats = {};
    for (const table of tables) {
      try {
        const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
        tableStats[table.table_name] = countResult[0].count;
        
        if (parseInt(countResult[0].count) > 0) {
          console.log(`✅ ${table.table_name}: ${countResult[0].count}개`);
        } else {
          console.log(`⚪ ${table.table_name}: 0개 (비어있음)`);
        }
      } catch (error) {
        console.log(`❌ ${table.table_name}: 오류 (${error.message})`);
      }
    }
    
    // 4. 중요 테이블의 스키마 확인
    console.log('\n📋 4단계: 중요 테이블 스키마 확인');
    console.log('='.repeat(60));
    
    const importantTables = ['proposals', 'approval_lines', 'purchase_items', 'service_items'];
    
    for (const tableName of importantTables) {
      if (tables.find(t => t.table_name === tableName)) {
        console.log(`\n🔍 ${tableName} 테이블:`);
        
        const [columns] = await sequelize.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position
        `);
        
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL 허용' : 'NOT NULL';
          console.log(`   - ${col.column_name}: ${col.data_type} (${nullable})`);
        });
      }
    }
    
    // 5. 외래키 관계 확인
    console.log('\n📋 5단계: 외래키 관계 확인');
    console.log('='.repeat(60));
    
    const [foreignKeys] = await sequelize.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    console.log(`총 ${foreignKeys.length}개의 외래키 관계:\n`);
    foreignKeys.forEach(fk => {
      console.log(`   ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // 6. 인덱스 확인
    console.log('\n📋 6단계: 인덱스 확인');
    console.log('='.repeat(60));
    
    const [indexes] = await sequelize.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    console.log(`총 ${indexes.length}개의 인덱스:\n`);
    const indexByTable = {};
    indexes.forEach(idx => {
      if (!indexByTable[idx.tablename]) {
        indexByTable[idx.tablename] = [];
      }
      indexByTable[idx.tablename].push(idx.indexname);
    });
    
    Object.entries(indexByTable).forEach(([table, idxList]) => {
      console.log(`   ${table}: ${idxList.length}개 인덱스`);
    });
    
    // 7. 시퀀스 확인
    console.log('\n📋 7단계: 시퀀스 상태 확인');
    console.log('='.repeat(60));
    
    const [sequences] = await sequelize.query(`
      SELECT sequencename, last_value, start_value
      FROM pg_sequences
      WHERE schemaname = 'public'
      ORDER BY sequencename
    `);
    
    console.log(`총 ${sequences.length}개의 시퀀스:\n`);
    sequences.forEach(seq => {
      console.log(`   ${seq.sequencename}: 현재값 ${seq.last_value} (시작값: ${seq.start_value})`);
    });
    
    // 8. 잠재적 문제 확인
    console.log('\n📋 8단계: 잠재적 문제 확인');
    console.log('='.repeat(60));
    
    const issues = [];
    
    // 데이터가 있는데 시퀀스가 낮은 경우
    for (const [tableName, count] of Object.entries(tableStats)) {
      if (parseInt(count) > 0) {
        const seqName = `${tableName}_id_seq`;
        const seq = sequences.find(s => s.sequencename === seqName);
        
        if (seq) {
          const [maxId] = await sequelize.query(`SELECT MAX(id) as max_id FROM ${tableName}`);
          const maxIdValue = parseInt(maxId[0].max_id) || 0;
          const seqValue = parseInt(seq.last_value);
          
          if (maxIdValue > seqValue) {
            issues.push(`⚠️  ${tableName}: 시퀀스(${seqValue})가 최대 ID(${maxIdValue})보다 작음 → 새 데이터 입력 시 충돌 가능`);
          }
        }
      }
    }
    
    // proposals와 관련 테이블 간 데이터 일관성 확인
    const proposalCount = parseInt(tableStats['proposals']) || 0;
    const approvalLineCount = parseInt(tableStats['approval_lines']) || 0;
    
    if (proposalCount > 0 && approvalLineCount === 0) {
      issues.push(`⚠️  proposals에 ${proposalCount}개 데이터가 있지만 approval_lines가 비어있음`);
    }
    
    if (proposalCount > 0) {
      const [orphanLines] = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM approval_lines al
        WHERE NOT EXISTS (SELECT 1 FROM proposals p WHERE p.id = al.proposal_id)
      `);
      
      if (parseInt(orphanLines[0].count) > 0) {
        issues.push(`⚠️  ${orphanLines[0].count}개의 approval_lines가 존재하지 않는 품의서를 참조함`);
      }
    }
    
    if (issues.length > 0) {
      console.log('\n⚠️  발견된 문제들:\n');
      issues.forEach(issue => console.log(issue));
    } else {
      console.log('✅ 문제가 발견되지 않았습니다!');
    }
    
    // 9. 종합 요약
    console.log('\n📊 종합 요약');
    console.log('='.repeat(60));
    
    const totalRecords = Object.values(tableStats).reduce((sum, count) => sum + parseInt(count), 0);
    const tablesWithData = Object.values(tableStats).filter(count => parseInt(count) > 0).length;
    
    console.log(`   총 테이블: ${tables.length}개`);
    console.log(`   데이터가 있는 테이블: ${tablesWithData}개`);
    console.log(`   총 레코드: ${totalRecords}개`);
    console.log(`   외래키: ${foreignKeys.length}개`);
    console.log(`   인덱스: ${indexes.length}개`);
    console.log(`   시퀀스: ${sequences.length}개`);
    console.log(`   발견된 문제: ${issues.length}개`);
    
  } catch (error) {
    console.error('\n❌ 진단 중 오류 발생:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

diagnoseCurrentState(); 