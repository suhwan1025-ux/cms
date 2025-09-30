const { testConnection, syncDatabase, seedInitialData } = require('./src/database');

async function testDatabase() {
  console.log('🔍 데이터베이스 연결 테스트 시작...\n');
  
  // 1. 연결 테스트
  const isConnected = await testConnection();
  if (!isConnected) {
    console.log('❌ 데이터베이스 연결에 실패했습니다.');
    console.log('📋 다음 사항을 확인해주세요:');
    console.log('   1. PostgreSQL이 설치되어 있는지 확인');
    console.log('   2. PostgreSQL 서비스가 실행 중인지 확인');
    console.log('   3. 데이터베이스가 생성되어 있는지 확인');
    console.log('   4. .env 파일의 연결 정보가 올바른지 확인');
    return;
  }
  
  // 2. 데이터베이스 동기화
  console.log('\n🔄 데이터베이스 동기화 시작...');
  const isSynced = await syncDatabase();
  if (!isSynced) {
    console.log('❌ 데이터베이스 동기화에 실패했습니다.');
    return;
  }
  
  // 3. 초기 데이터 생성
  console.log('\n🌱 초기 데이터 생성 시작...');
  await seedInitialData();
  
  console.log('\n✅ 모든 테스트가 완료되었습니다!');
}

testDatabase().catch(console.error); 