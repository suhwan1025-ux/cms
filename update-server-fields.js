const fs = require('fs');

console.log('🔄 서버 파일에서 필드 업데이트 시작...');

let serverContent = fs.readFileSync('server.js', 'utf8');

// customContractPeriod를 새로운 날짜 필드로 교체
serverContent = serverContent.replace(
  /customContractPeriod: item\.customContractPeriod \|\| ''/g,
  'contractStartDate: item.contractStartDate || null,\n        contractEndDate: item.contractEndDate || null'
);

serverContent = serverContent.replace(
  /customContractPeriod: item\.customContractPeriod/g,
  'contractStartDate: item.contractStartDate,\n        contractEndDate: item.contractEndDate'
);

// 파일 저장
fs.writeFileSync('server.js', serverContent, 'utf8');

console.log('✅ 서버 파일 업데이트 완료!');
console.log('🔍 변경된 내용:');
console.log('  - customContractPeriod → contractStartDate, contractEndDate'); 