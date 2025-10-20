# Python 3.14 제거 및 3.12 설치 스크립트
# 관리자 권한 필요

Write-Host "=== Python 3.14 제거 및 3.12 설치 ===" -ForegroundColor Cyan

# 관리자 권한 확인
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ 이 스크립트는 관리자 권한이 필요합니다." -ForegroundColor Red
    Write-Host "PowerShell을 관리자 권한으로 실행한 후 다시 시도해주세요." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "방법: PowerShell 아이콘 우클릭 -> '관리자 권한으로 실행'" -ForegroundColor Yellow
    Read-Host "계속하려면 Enter를 누르세요"
    exit 1
}

Write-Host ""
Write-Host "1단계: Python 3.14 제거 중..." -ForegroundColor Yellow

# Python 3.14 제거
$python314Path = "C:\Users\USER\AppData\Local\Programs\Python\Python314"
if (Test-Path $python314Path) {
    Write-Host "Python 3.14 폴더 발견: $python314Path" -ForegroundColor Gray
    
    # Uninstaller 찾기
    $uninstallers = Get-ChildItem "$python314Path" -Filter "*.exe" | Where-Object { $_.Name -match "uninstall" }
    
    if ($uninstallers) {
        Write-Host "제거 프로그램 실행 중..." -ForegroundColor Gray
        foreach ($uninstaller in $uninstallers) {
            Start-Process -FilePath $uninstaller.FullName -ArgumentList "/uninstall", "/quiet" -Wait -NoNewWindow
        }
    }
    
    # 폴더 강제 삭제
    Start-Sleep -Seconds 2
    if (Test-Path $python314Path) {
        Remove-Item -Path $python314Path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Python 3.14 폴더 삭제 완료" -ForegroundColor Green
    }
} else {
    Write-Host "Python 3.14 폴더가 없습니다." -ForegroundColor Gray
}

# PATH에서 Python 3.14 제거
Write-Host "환경변수에서 Python 3.14 경로 제거 중..." -ForegroundColor Gray
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$newPath = ($currentPath -split ';' | Where-Object { $_ -notmatch "Python314" }) -join ';'
[Environment]::SetEnvironmentVariable("Path", $newPath, "User")

Write-Host ""
Write-Host "2단계: Python 3.12.8 다운로드 중..." -ForegroundColor Yellow

$python312Url = "https://www.python.org/ftp/python/3.12.8/python-3.12.8-amd64.exe"
$installerPath = "$env:TEMP\python-3.12.8-amd64.exe"

try {
    Invoke-WebRequest -Uri $python312Url -OutFile $installerPath -UseBasicParsing
    Write-Host "✅ Python 3.12.8 다운로드 완료" -ForegroundColor Green
} catch {
    Write-Host "❌ 다운로드 실패: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "수동 다운로드 링크: $python312Url" -ForegroundColor Yellow
    Read-Host "계속하려면 Enter를 누르세요"
    exit 1
}

Write-Host ""
Write-Host "3단계: Python 3.12.8 설치 중..." -ForegroundColor Yellow
Write-Host "설치 경로: C:\Users\USER\AppData\Local\Programs\Python\Python312" -ForegroundColor Gray

# 자동 설치 (조용한 설치)
$installArgs = @(
    "/quiet",
    "InstallAllUsers=0",
    "PrependPath=1",
    "Include_test=0",
    "TargetDir=C:\Users\USER\AppData\Local\Programs\Python\Python312"
)

Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -NoNewWindow

Write-Host "✅ Python 3.12.8 설치 완료!" -ForegroundColor Green

Write-Host ""
Write-Host "4단계: 환경변수 설정 중..." -ForegroundColor Yellow

$python312Path = "C:\Users\USER\AppData\Local\Programs\Python\Python312"
$python312ScriptsPath = "$python312Path\Scripts"

# 현재 PATH 가져오기
$currentUserPath = [Environment]::GetEnvironmentVariable("Path", "User")

# Python 312 경로가 없으면 추가
if ($currentUserPath -notlike "*$python312Path*") {
    $newUserPath = "$python312Path;$python312ScriptsPath;$currentUserPath"
    [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
    Write-Host "✅ Python 3.12 경로를 환경변수에 추가했습니다." -ForegroundColor Green
} else {
    Write-Host "Python 3.12 경로가 이미 환경변수에 있습니다." -ForegroundColor Gray
}

# 환경변수 즉시 반영
$env:Path = [Environment]::GetEnvironmentVariable("Path", "User") + ";" + [Environment]::GetEnvironmentVariable("Path", "Machine")

Write-Host ""
Write-Host "5단계: 설치 확인 중..." -ForegroundColor Yellow

Start-Sleep -Seconds 2

if (Test-Path "$python312Path\python.exe") {
    $version = & "$python312Path\python.exe" --version
    Write-Host "✅ $version 설치 확인!" -ForegroundColor Green
} else {
    Write-Host "❌ Python 3.12 실행 파일을 찾을 수 없습니다." -ForegroundColor Red
}

Write-Host ""
Write-Host "6단계: 임시 파일 정리..." -ForegroundColor Yellow
if (Test-Path $installerPath) {
    Remove-Item -Path $installerPath -Force
    Write-Host "✅ 설치 파일 삭제 완료" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 모든 작업이 완료되었습니다!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. 이 PowerShell 창을 닫으세요" -ForegroundColor White
Write-Host "2. 새 PowerShell 창을 열어주세요" -ForegroundColor White
Write-Host "3. 다음 명령어로 확인:" -ForegroundColor White
Write-Host "   python --version" -ForegroundColor Cyan
Write-Host "   또는" -ForegroundColor White
Write-Host "   C:\Users\USER\AppData\Local\Programs\Python\Python312\python.exe --version" -ForegroundColor Cyan
Write-Host ""

Read-Host "완료! Enter를 눌러 종료하세요"

