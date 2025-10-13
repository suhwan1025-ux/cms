# PostgreSQL을 Windows 서비스로 등록하고 자동 시작 설정하는 스크립트
# 관리자 권한으로 실행해야 합니다

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL 서비스 등록 및 자동 시작 설정" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 관리자 권한 확인
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ 이 스크립트는 관리자 권한이 필요합니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "다음 방법으로 다시 실행하세요:" -ForegroundColor Yellow
    Write-Host "1. PowerShell을 관리자 권한으로 실행" -ForegroundColor Yellow
    Write-Host "2. 이 스크립트를 다시 실행" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "아무 키나 눌러 종료..."
    exit 1
}

Write-Host "✓ 관리자 권한 확인됨" -ForegroundColor Green
Write-Host ""

# PostgreSQL 설치 경로 찾기
$pgPaths = @(
    "C:\PostgreSQL\pg\pgsql\bin",
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files\PostgreSQL\14\bin",
    "C:\Program Files\PostgreSQL\13\bin"
)

$pgBinPath = $null
$pgCtlPath = $null

foreach ($path in $pgPaths) {
    if (Test-Path (Join-Path $path "pg_ctl.exe")) {
        $pgBinPath = $path
        $pgCtlPath = Join-Path $path "pg_ctl.exe"
        break
    }
}

# psql 명령어로도 확인
if (-not $pgBinPath) {
    try {
        $psqlPath = Get-Command psql -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
        if ($psqlPath) {
            $pgBinPath = Split-Path -Parent $psqlPath
            $pgCtlPath = Join-Path $pgBinPath "pg_ctl.exe"
        }
    } catch {}
}

if (-not $pgBinPath -or -not (Test-Path $pgCtlPath)) {
    Write-Host "❌ PostgreSQL 설치 경로를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "다음 경로를 확인했습니다:" -ForegroundColor Yellow
    foreach ($path in $pgPaths) {
        Write-Host "  - $path" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "PostgreSQL이 다른 경로에 설치되어 있다면 수동으로 경로를 지정해야 합니다." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "아무 키나 눌러 종료..."
    exit 1
}

Write-Host "✓ PostgreSQL 설치 경로 확인: $pgBinPath" -ForegroundColor Green
Write-Host ""

# 데이터 디렉토리 찾기
$pgDataPath = $null
$possibleDataPaths = @(
    "C:\PostgreSQL\pg\pgsql\data",
    "C:\PostgreSQL\data",
    "C:\Program Files\PostgreSQL\16\data",
    "C:\Program Files\PostgreSQL\15\data",
    "C:\Program Files\PostgreSQL\14\data",
    "C:\Program Files\PostgreSQL\13\data"
)

foreach ($path in $possibleDataPaths) {
    if (Test-Path (Join-Path $path "postgresql.conf")) {
        $pgDataPath = $path
        break
    }
}

if (-not $pgDataPath) {
    Write-Host "⚠ 데이터 디렉토리를 자동으로 찾을 수 없습니다." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "데이터 디렉토리 경로를 입력하세요 (예: C:\PostgreSQL\pg\pgsql\data):" -ForegroundColor Cyan
    $pgDataPath = Read-Host "경로"
    
    if (-not (Test-Path (Join-Path $pgDataPath "postgresql.conf"))) {
        Write-Host "❌ 유효하지 않은 데이터 디렉토리입니다." -ForegroundColor Red
        Write-Host ""
        Read-Host "아무 키나 눌러 종료..."
        exit 1
    }
}

Write-Host "✓ 데이터 디렉토리 확인: $pgDataPath" -ForegroundColor Green
Write-Host ""

# 서비스 이름 설정
$serviceName = "PostgreSQL"
$serviceDisplayName = "PostgreSQL Database Server"

# 기존 서비스 확인
$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($existingService) {
    Write-Host "기존 PostgreSQL 서비스가 있습니다:" -ForegroundColor Yellow
    Write-Host "  이름: $($existingService.Name)" -ForegroundColor Gray
    Write-Host "  상태: $($existingService.Status)" -ForegroundColor Gray
    Write-Host ""
    
    $overwrite = Read-Host "기존 서비스를 제거하고 다시 등록하시겠습니까? (Y/N)"
    if ($overwrite -eq 'Y' -or $overwrite -eq 'y') {
        Write-Host "기존 서비스 중지 중..." -ForegroundColor Yellow
        try {
            Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        } catch {}
        
        Write-Host "기존 서비스 제거 중..." -ForegroundColor Yellow
        try {
            & $pgCtlPath unregister -N $serviceName -D $pgDataPath
            Write-Host "✓ 기존 서비스 제거 완료" -ForegroundColor Green
        } catch {
            Write-Host "⚠ 서비스 제거 중 오류 발생 (계속 진행합니다)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "작업이 취소되었습니다." -ForegroundColor Yellow
        Read-Host "아무 키나 눌러 종료..."
        exit 0
    }
}

# PostgreSQL 서비스 등록
Write-Host ""
Write-Host "PostgreSQL 서비스 등록 중..." -ForegroundColor Yellow
Write-Host "  명령어: $pgCtlPath register -N $serviceName -D $pgDataPath" -ForegroundColor Gray
Write-Host ""

try {
    $output = & $pgCtlPath register -N $serviceName -D $pgDataPath 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ PostgreSQL 서비스 등록 완료" -ForegroundColor Green
    } else {
        Write-Host "⚠ 서비스 등록 중 경고:" -ForegroundColor Yellow
        Write-Host $output -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ 서비스 등록 실패: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Read-Host "아무 키나 눌러 종료..."
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 2

# 서비스를 자동 시작으로 설정
Write-Host "서비스를 자동 시작으로 설정 중..." -ForegroundColor Yellow
try {
    Set-Service -Name $serviceName -StartupType Automatic
    Write-Host "✓ 시작 유형이 '자동'으로 설정되었습니다." -ForegroundColor Green
} catch {
    Write-Host "❌ 시작 유형 설정 실패: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 서비스 시작
Write-Host "PostgreSQL 서비스 시작 중..." -ForegroundColor Yellow
try {
    Start-Service -Name $serviceName
    Start-Sleep -Seconds 3
    
    $service = Get-Service -Name $serviceName
    if ($service.Status -eq 'Running') {
        Write-Host "✓ PostgreSQL 서비스가 시작되었습니다." -ForegroundColor Green
    } else {
        Write-Host "⚠ 서비스 상태: $($service.Status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 서비스 시작 실패: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "수동으로 시작해보세요:" -ForegroundColor Yellow
    Write-Host "  net start $serviceName" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "설정 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "서비스 정보:" -ForegroundColor Cyan
Write-Host "  서비스 이름: $serviceName" -ForegroundColor White
Write-Host "  표시 이름: $serviceDisplayName" -ForegroundColor White
Write-Host "  PostgreSQL 경로: $pgBinPath" -ForegroundColor White
Write-Host "  데이터 디렉토리: $pgDataPath" -ForegroundColor White
Write-Host ""

# 현재 서비스 상태 표시
Write-Host "현재 서비스 상태:" -ForegroundColor Cyan
Get-Service -Name $serviceName | Format-Table Name, DisplayName, Status, StartType -AutoSize

Write-Host ""
Write-Host "Windows 시작 시 PostgreSQL이 자동으로 실행됩니다!" -ForegroundColor Green
Write-Host ""

# 포트 확인
Write-Host "포트 5432 상태 확인:" -ForegroundColor Cyan
$portStatus = netstat -ano | findstr :5432
if ($portStatus) {
    Write-Host $portStatus -ForegroundColor Gray
} else {
    Write-Host "⚠ 포트 5432가 열려있지 않습니다." -ForegroundColor Yellow
}

Write-Host ""
Read-Host "아무 키나 눌러 종료..."

