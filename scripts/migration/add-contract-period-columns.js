const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 데이터베이스 파일 경로
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🔄 계약기간 컬럼 추가 시작...');
console.log('📁 데이터베이스 경로:', dbPath);

// 데이터베이스 연결
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 데이터베이스 연결 실패:', err.message);
    return;
  }
  console.log('✅ SQLite 데이터베이스 연결 성공');
});

// 컬럼 추가 함수
function addColumns() {
  return new Promise((resolve, reject) => {
    // 트랜잭션 시작
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // 첫 번째 컬럼 추가
      db.run(`ALTER TABLE purchase_items ADD COLUMN contract_period_type VARCHAR(50) DEFAULT 'permanent'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('❌ contract_period_type 컬럼 추가 실패:', err.message);
          db.run('ROLLBACK');
          reject(err);
          return;
        }
        console.log('✅ contract_period_type 컬럼 추가 완료 (또는 이미 존재)');

        // 두 번째 컬럼 추가
        db.run(`ALTER TABLE purchase_items ADD COLUMN custom_contract_period TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('❌ custom_contract_period 컬럼 추가 실패:', err.message);
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          console.log('✅ custom_contract_period 컬럼 추가 완료 (또는 이미 존재)');

          // 기본값 설정
          db.run(`UPDATE purchase_items SET contract_period_type = 'permanent' WHERE contract_period_type IS NULL`, (err) => {
            if (err) {
              console.error('❌ 기본값 설정 실패:', err.message);
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            console.log('✅ 기본값 설정 완료');

            // 커밋
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('❌ 커밋 실패:', err.message);
                reject(err);
                return;
              }
              console.log('✅ 트랜잭션 커밋 완료');
              resolve();
            });
          });
        });
      });
    });
  });
}

// 스키마 확인 함수
function checkSchema() {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(purchase_items)", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('\n📊 purchase_items 테이블 스키마:');
      console.table(rows);
      resolve(rows);
    });
  });
}

// 메인 실행
async function main() {
  try {
    console.log('\n🔍 현재 스키마 확인...');
    await checkSchema();
    
    console.log('\n🔧 컬럼 추가 중...');
    await addColumns();
    
    console.log('\n🔍 업데이트된 스키마 확인...');
    await checkSchema();
    
    console.log('\n🎉 계약기간 컬럼 추가가 완료되었습니다!');
    
  } catch (error) {
    console.error('💥 오류 발생:', error.message);
  } finally {
    // 데이터베이스 연결 종료
    db.close((err) => {
      if (err) {
        console.error('❌ 데이터베이스 연결 종료 실패:', err.message);
      } else {
        console.log('✅ 데이터베이스 연결 종료 완료');
      }
    });
  }
}

main(); 