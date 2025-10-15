# Microsoft Visual C++ Build Tools 설치 스크립트
# 관리자 권한 필요

Write-Host "=== Microsoft Visual C++ Build Tools 설치 ===" -ForegroundColor Cyan
Write-Host ""

# 관리자 권한 확인
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ 이 스크립트는 관리자 권한이 필요합니다." -ForegroundColor Red
    Write-Host "PowerShell을 관리자 권한으로 실행한 후 다시 시도해주세요." -ForegroundColor Yellow
    Read-Host "계속하려면 Enter를 누르세요"
    exit 1
}

Write-Host "1단계: Build Tools 다운로드 중..." -ForegroundColor Yellow
Write-Host ""

$buildToolsUrl = "https://aka.ms/vs/17/release/vs_buildtools.exe"
$installerPath = "$env:TEMP\vs_buildtools.exe"

try {
    Write-Host "다운로드 URL: $buildToolsUrl" -ForegroundColor Gray
    Invoke-WebRequest -Uri $buildToolsUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "✅ 다운로드 완료!" -ForegroundColor Green
} catch {
    Write-Host "❌ 다운로드 실패: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "수동 다운로드 링크:" -ForegroundColor Yellow
    Write-Host "https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Cyan
    Read-Host "계속하려면 Enter를 누르세요"
    exit 1
}

Write-Host ""
Write-Host "2단계: Build Tools 설치 중..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  주의사항:" -ForegroundColor Yellow
Write-Host "  - 설치에 약 2-5GB의 디스크 공간이 필요합니다" -ForegroundColor White
Write-Host "  - 설치 시간은 약 10-20분 소요됩니다" -ForegroundColor White
Write-Host "  - 인터넷 연결이 필요합니다" -ForegroundColor White
Write-Host ""
Write-Host "설치가 시작됩니다. Visual Studio Installer 창이 열립니다..." -ForegroundColor Cyan
Write-Host ""

# Build Tools 설치 (C++ 컴파일러 포함)
$installArgs = @(
    "--quiet",
    "--wait",
    "--norestart",
    "--nocache",
    "--add", "Microsoft.VisualStudio.Workload.VCTools",
    "--add", "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
    "--add", "Microsoft.VisualStudio.Component.Windows10SDK"
)

Write-Host "설치 명령어 실행 중..." -ForegroundColor Gray
$process = Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -PassThru -NoNewWindow

if ($process.ExitCode -eq 0 -or $process.ExitCode -eq 3010) {
    Write-Host ""
    Write-Host "✅ Microsoft Visual C++ Build Tools 설치 완료!" -ForegroundColor Green
    
    if ($process.ExitCode -eq 3010) {
        Write-Host ""
        Write-Host "⚠️  재부팅이 필요합니다!" -ForegroundColor Yellow
        Write-Host "시스템을 재부팅한 후 패키지 설치를 계속하세요." -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "❌ 설치 중 오류가 발생했습니다 (Exit Code: $($process.ExitCode))" -ForegroundColor Red
}

Write-Host ""
Write-Host "3단계: 임시 파일 정리..." -ForegroundColor Yellow
if (Test-Path $installerPath) {
    Remove-Item -Path $installerPath -Force
    Write-Host "✅ 정리 완료" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "설치 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. 이 PowerShell 창을 닫으세요" -ForegroundColor White
Write-Host "2. 새 PowerShell 창을 열어주세요" -ForegroundColor White
Write-Host "3. D:\CMS_NEW\ai_server 폴더로 이동:" -ForegroundColor White
Write-Host "   cd D:\CMS_NEW\ai_server" -ForegroundColor Cyan
Write-Host "4. 패키지 재설치:" -ForegroundColor White
Write-Host "   C:\Users\USER\AppData\Local\Programs\Python\Python312\python.exe -m pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt" -ForegroundColor Cyan
Write-Host ""

Read-Host "완료! Enter를 눌러 종료하세요"

