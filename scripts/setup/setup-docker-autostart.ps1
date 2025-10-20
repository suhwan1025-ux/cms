# Docker PostgreSQL 자동 시작 설정 스크립트
# Windows 작업 스케줄러에 등록하여 부팅 시 자동으로 PostgreSQL 컨테이너를 시작합니다

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Docker PostgreSQL 자동 시작 설정" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 관리자 권한 확인
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ 이 스크립트는 관리자 권한이 필요합니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "PowerShell을 관리자 권한으로 실행한 후 다시 시도하세요." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "아무 키나 눌러 종료..."
    exit 1
}

Write-Host "✓ 관리자 권한 확인됨" -ForegroundColor Green
Write-Host ""

# Docker 설치 확인
Write-Host "Docker 설치 확인 중..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker 설치 확인: $dockerVersion" -ForegroundColor Green
    } else {
        throw "Docker not found"
    }
} catch {
    Write-Host "❌ Docker가 설치되지 않았습니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "Docker Desktop을 먼저 설치하세요:" -ForegroundColor Yellow
    Write-Host "https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "아무 키나 눌러 종료..."
    exit 1
}

# docker-compose.yml 파일 확인
$projectPath = "D:\CMS_NEW"
$composeFile = Join-Path $projectPath "docker-compose.yml"

if (-not (Test-Path $composeFile)) {
    Write-Host "❌ docker-compose.yml 파일을 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "경로: $composeFile" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "아무 키나 눌러 종료..."
    exit 1
}

Write-Host "✓ docker-compose.yml 파일 확인" -ForegroundColor Green
Write-Host ""

# 자동 시작 스크립트 생성
$startupScriptPath = Join-Path $projectPath "auto-start-postgres-docker.ps1"
$startupScriptContent = @"
# PostgreSQL Docker 컨테이너 자동 시작 스크립트
# 이 스크립트는 Windows 작업 스케줄러에 의해 부팅 시 자동 실행됩니다

`$logFile = "$projectPath\postgres-autostart.log"
`$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# 로그 함수
function Write-Log {
    param([string]`$message)
    "`$timestamp - `$message" | Out-File -FilePath `$logFile -Append -Encoding UTF8
    Write-Host `$message
}

Write-Log "========================================"
Write-Log "PostgreSQL Docker 자동 시작 시도"

# Docker가 준비될 때까지 대기 (최대 60초)
`$maxWait = 60
`$waited = 0
Write-Log "Docker 서비스 대기 중..."

while (`$waited -lt `$maxWait) {
    try {
        docker info 2>`$null | Out-Null
        if (`$LASTEXITCODE -eq 0) {
            Write-Log "Docker 서비스 준비 완료 (`$waited 초 대기)"
            break
        }
    } catch {}
    
    Start-Sleep -Seconds 2
    `$waited += 2
}

if (`$waited -ge `$maxWait) {
    Write-Log "Docker 서비스 시작 시간 초과"
    exit 1
}

# 프로젝트 디렉토리로 이동
Set-Location "$projectPath"

# PostgreSQL 컨테이너 시작
Write-Log "PostgreSQL 컨테이너 시작 중..."
try {
    docker-compose up -d postgres 2>&1 | Out-String | Write-Log
    
    if (`$LASTEXITCODE -eq 0) {
        Write-Log "PostgreSQL 컨테이너 시작 성공"
        
        # 컨테이너 상태 확인
        `$containerStatus = docker ps --filter "name=postgres" --format "{{.Names}} - {{.Status}}"
        Write-Log "컨테이너 상태: `$containerStatus"
    } else {
        Write-Log "PostgreSQL 컨테이너 시작 실패 (종료 코드: `$LASTEXITCODE)"
    }
} catch {
    Write-Log "오류 발생: `$(`$_.Exception.Message)"
}

Write-Log "========================================"
"@

Write-Host "자동 시작 스크립트 생성 중..." -ForegroundColor Yellow
$startupScriptContent | Out-File -FilePath $startupScriptPath -Encoding UTF8 -Force
Write-Host "✓ 스크립트 생성 완료: $startupScriptPath" -ForegroundColor Green
Write-Host ""

# 작업 스케줄러에 등록
Write-Host "Windows 작업 스케줄러에 등록 중..." -ForegroundColor Yellow

$taskName = "PostgreSQL Docker AutoStart"
$taskDescription = "Windows 시작 시 PostgreSQL Docker 컨테이너를 자동으로 시작합니다"

# 기존 작업이 있으면 삭제
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "기존 작업 삭제 중..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# 작업 생성
try {
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startupScriptPath`""
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    # 지연 시작 설정 (Docker가 완전히 시작될 때까지 대기)
    $trigger.Delay = "PT1M"  # 1분 지연
    
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description $taskDescription | Out-Null
    
    Write-Host "✓ 작업 스케줄러 등록 완료" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "설정 완료!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "다음 사항이 설정되었습니다:" -ForegroundColor Cyan
    Write-Host "✓ 자동 시작 스크립트: $startupScriptPath" -ForegroundColor White
    Write-Host "✓ 작업 스케줄러 작업: $taskName" -ForegroundColor White
    Write-Host "✓ 시작 시점: Windows 부팅 후 1분 지연" -ForegroundColor White
    Write-Host ""
    Write-Host "추가 설정 권장사항:" -ForegroundColor Yellow
    Write-Host "1. Docker Desktop 설정 열기" -ForegroundColor White
    Write-Host "2. Settings → General 이동" -ForegroundColor White
    Write-Host "3. 'Start Docker Desktop when you log in' 체크" -ForegroundColor White
    Write-Host ""
    Write-Host "로그 파일 위치: $projectPath\postgres-autostart.log" -ForegroundColor Cyan
    Write-Host ""
    
    # 테스트 옵션 제공
    $test = Read-Host "지금 스크립트를 테스트하시겠습니까? (Y/N)"
    if ($test -eq 'Y' -or $test -eq 'y') {
        Write-Host ""
        Write-Host "스크립트 실행 중..." -ForegroundColor Yellow
        & $startupScriptPath
        Write-Host ""
        Write-Host "컨테이너 상태 확인:" -ForegroundColor Cyan
        docker ps --filter "name=postgres"
    }
    
} catch {
    Write-Host "❌ 작업 스케줄러 등록 실패: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Read-Host "아무 키나 눌러 종료..."

