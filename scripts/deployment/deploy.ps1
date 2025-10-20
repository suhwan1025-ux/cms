# 계약관리시스템 배포 스크립트
# PowerShell에서 실행

Write-Host "🚀 계약관리시스템 배포를 시작합니다..." -ForegroundColor Green

# 1. 의존성 설치 확인
Write-Host "📦 의존성 설치 확인 중..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    Write-Host "📥 node_modules가 없습니다. npm install을 실행합니다..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "✅ 의존성이 이미 설치되어 있습니다." -ForegroundColor Green
}

# 2. 프로덕션 빌드
Write-Host "🔨 프로덕션 빌드를 시작합니다..." -ForegroundColor Yellow
try {
    npm run build:prod
    Write-Host "✅ 빌드가 완료되었습니다." -ForegroundColor Green
} catch {
    Write-Host "❌ 빌드 실패: $_" -ForegroundColor Red
    exit 1
}

# 3. 환경 설정 확인
Write-Host "⚙️ 환경 설정을 확인합니다..." -ForegroundColor Yellow
if (!(Test-Path "env.production")) {
    Write-Host "❌ env.production 파일이 없습니다." -ForegroundColor Red
    Write-Host "📝 env.production 파일을 생성하고 데이터베이스 정보를 설정해주세요." -ForegroundColor Yellow
    exit 1
}

# 4. 서버 시작
Write-Host "🌐 프로덕션 서버를 시작합니다..." -ForegroundColor Yellow
try {
    Start-Process -FilePath "node" -ArgumentList "server.prod.js" -WindowStyle Normal
    Write-Host "✅ 서버가 백그라운드에서 시작되었습니다." -ForegroundColor Green
    Write-Host "🌐 브라우저에서 http://localhost:3001 을 열어 확인하세요." -ForegroundColor Cyan
} catch {
    Write-Host "❌ 서버 시작 실패: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 배포가 완료되었습니다!" -ForegroundColor Green
Write-Host "📋 다음 단계:" -ForegroundColor Cyan
Write-Host "   1. env.production 파일에서 데이터베이스 정보를 수정하세요" -ForegroundColor White
Write-Host "   2. 인트라망 서버의 IP 주소로 접속해보세요" -ForegroundColor White
Write-Host "   3. 방화벽에서 3001 포트를 열어주세요" -ForegroundColor White 