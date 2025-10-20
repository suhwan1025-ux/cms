const fs = require('fs');
const path = require('path');

console.log('🔍 모델 파일 확인...');
const modelFiles = fs.readdirSync('./src/models').filter(file => {
  return (
    file.indexOf('.') !== 0 &&
    file !== 'index.js' &&
    file.slice(-3) === '.js' &&
    file.indexOf('.test.js') === -1
  );
});

console.log('📁 발견된 모델 파일들:');
modelFiles.forEach(file => {
  console.log(`   - ${file}`);
});

console.log('\n🔍 모델 로딩 테스트...');
try {
  const models = require('../../src/models');
  console.log('✅ 모델 로딩 성공!');
  console.log('📋 로드된 모델들:');
  Object.keys(models).forEach(modelName => {
    if (modelName !== 'sequelize' && modelName !== 'Sequelize') {
      console.log(`   - ${modelName}`);
    }
  });
} catch (error) {
  console.error('❌ 모델 로딩 실패:', error.message);
} 