const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');

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

async function generateSchemaDoc() {
  try {
    console.log('🔍 데이터베이스 연결 확인...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!\n');

    // 모든 테이블의 상세 스키마 정보 조회
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    let schemaDoc = '# 데이터베이스 스키마 상세 정보\n\n';
    schemaDoc += `**생성일시**: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n\n`;
    schemaDoc += '---\n\n';

    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`📊 ${tableName} 분석 중...`);

      schemaDoc += `## ${tableName}\n\n`;

      // 컬럼 정보 조회
      const [columns] = await sequelize.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${tableName}'
        ORDER BY ordinal_position
      `);

      schemaDoc += '### 컬럼 정보\n\n';
      schemaDoc += '| 컬럼명 | 데이터 타입 | Null | 기본값 |\n';
      schemaDoc += '|--------|------------|------|--------|\n';

      for (const col of columns) {
        let dataType = col.data_type;
        if (col.character_maximum_length) {
          dataType += `(${col.character_maximum_length})`;
        } else if (col.numeric_precision) {
          dataType += `(${col.numeric_precision}${col.numeric_scale ? ',' + col.numeric_scale : ''})`;
        }
        
        const nullable = col.is_nullable === 'YES' ? 'YES' : 'NO';
        const defaultVal = col.column_default || '-';

        schemaDoc += `| \`${col.column_name}\` | ${dataType} | ${nullable} | ${defaultVal} |\n`;
      }

      // 인덱스 정보 조회
      const [indexes] = await sequelize.query(`
        SELECT
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename = '${tableName}'
        ORDER BY indexname
      `);

      if (indexes.length > 0) {
        schemaDoc += '\n### 인덱스\n\n';
        for (const idx of indexes) {
          schemaDoc += `- **${idx.indexname}**\n`;
          schemaDoc += `  \`\`\`sql\n  ${idx.indexdef}\n  \`\`\`\n`;
        }
      }

      // 외래키 정보 조회
      const [foreignKeys] = await sequelize.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = '${tableName}'
      `);

      if (foreignKeys.length > 0) {
        schemaDoc += '\n### 외래키\n\n';
        for (const fk of foreignKeys) {
          schemaDoc += `- **${fk.constraint_name}**: \`${fk.column_name}\` → \`${fk.foreign_table_name}.${fk.foreign_column_name}\`\n`;
        }
      }

      // 레코드 수 조회
      try {
        const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        schemaDoc += `\n**현재 레코드 수**: ${count[0].count}개\n`;
      } catch (err) {
        schemaDoc += `\n**현재 레코드 수**: 조회 실패\n`;
      }

      schemaDoc += '\n---\n\n';
    }

    // 파일 저장
    const outputPath = '../../docs/DATABASE_SCHEMA_DETAIL.md';
    fs.writeFileSync(require('path').resolve(__dirname, outputPath), schemaDoc);
    
    console.log('\n✅ 스키마 문서 생성 완료!');
    console.log(`📄 저장 위치: docs/DATABASE_SCHEMA_DETAIL.md`);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await sequelize.close();
  }
}

generateSchemaDoc();

