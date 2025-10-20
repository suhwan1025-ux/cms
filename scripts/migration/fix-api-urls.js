const fs = require('fs');
const path = require('path');

// API 베이스 URL 설정 코드
const API_BASE_URL_CODE = `
// API 베이스 URL 동적 설정
const getApiBaseUrl = () => {
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return \`http://\${window.location.hostname}:3001\`;
  }
  return 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();`;

// 수정할 파일들
const filesToFix = [
  'src/components/Statistics.js',
  'src/components/PastBudgetView.js',
  'src/components/DraftList.js',
  'src/components/BudgetRegistration.js',
  'src/components/BudgetRegistrationAPI.js',
  'src/components/ApprovalLine.js'
];

function fixFile(filePath) {
  try {
    console.log(`\n🔧 수정 중: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ 파일이 존재하지 않음: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // API_BASE_URL 설정이 이미 있는지 확인
    if (!content.includes('const API_BASE_URL = getApiBaseUrl()')) {
      // import 문 다음에 API_BASE_URL 설정 추가
      const importRegex = /(import.*?from.*?;[\s\S]*?(?=\n\n|\nconst|\nfunction|\nexport))/;
      if (importRegex.test(content)) {
        content = content.replace(importRegex, `$1${API_BASE_URL_CODE}\n`);
        modified = true;
        console.log('   ✅ API_BASE_URL 설정 추가');
      }
    }

    // localhost:3001을 API_BASE_URL로 교체
    const localhostRegex = /['"`]http:\/\/localhost:3001/g;
    if (localhostRegex.test(content)) {
      content = content.replace(/['"`]http:\/\/localhost:3001/g, '`${API_BASE_URL}');
      modified = true;
      console.log('   ✅ localhost:3001 → API_BASE_URL 교체');
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`   ✅ ${filePath} 수정 완료`);
    } else {
      console.log(`   ℹ️ ${filePath} 수정 불필요`);
    }

  } catch (error) {
    console.error(`❌ ${filePath} 수정 실패:`, error.message);
  }
}

console.log('🚀 API URL 일괄 수정 시작...\n');

filesToFix.forEach(fixFile);

console.log('\n🎉 API URL 일괄 수정 완료!');
console.log('\n📝 수정된 파일들을 확인하고 React 서버를 재시작하세요:');
console.log('   npm start'); 