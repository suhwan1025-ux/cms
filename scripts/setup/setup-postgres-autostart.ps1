# PostgreSQL 자동 시작 설정 스크립트
# 관리자 권한으로 실행해야 합니다

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL 자동 시작 설정 스크립트" -ForegroundColor Cyan
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
    Write-Host "또는 다음 명령어를 복사하여 관리자 PowerShell에서 실행:" -ForegroundColor Yellow
    Write-Host "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File ""$PSCommandPath""' -Verb RunAs" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "아무 키나 눌러 종료..."
    exit 1
}

Write-Host "✓ 관리자 권한 확인됨" -ForegroundColor Green
Write-Host ""

# PostgreSQL 서비스 찾기
Write-Host "PostgreSQL 서비스 검색 중..." -ForegroundColor Yellow
$pgServices = Get-Service | Where-Object {
    $_.DisplayName -like "*PostgreSQL*" -or 
    $_.Name -like "*postgresql*" -or
    $_.DisplayName -like "*postgres*"
}

if ($pgServices) {
    Write-Host "✓ PostgreSQL 서비스를 찾았습니다:" -ForegroundColor Green
    Write-Host ""
    
    foreach ($service in $pgServices) {
        Write-Host "서비스 이름: $($service.Name)" -ForegroundColor Cyan
        Write-Host "표시 이름: $($service.DisplayName)" -ForegroundColor Cyan
        Write-Host "현재 상태: $($service.Status)" -ForegroundColor Cyan
        Write-Host "시작 유형: $($service.StartType)" -ForegroundColor Cyan
        Write-Host ""
        
        # 자동 시작으로 설정
        try {
            Write-Host "시작 유형을 '자동'으로 설정 중..." -ForegroundColor Yellow
            Set-Service -Name $service.Name -StartupType Automatic
            Write-Host "✓ 시작 유형이 '자동'으로 설정되었습니다." -ForegroundColor Green
            
            # 서비스가 중지되어 있으면 시작
            if ($service.Status -ne 'Running') {
                Write-Host "서비스 시작 중..." -ForegroundColor Yellow
                Start-Service -Name $service.Name
                Start-Sleep -Seconds 2
                $status = (Get-Service -Name $service.Name).Status
                if ($status -eq 'Running') {
                    Write-Host "✓ 서비스가 시작되었습니다." -ForegroundColor Green
                } else {
                    Write-Host "⚠ 서비스 시작 실패 (현재 상태: $status)" -ForegroundColor Red
                }
            } else {
                Write-Host "✓ 서비스가 이미 실행 중입니다." -ForegroundColor Green
            }
            
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "설정 완료!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "Windows 시작 시 PostgreSQL이 자동으로 실행됩니다." -ForegroundColor Green
            Write-Host ""
            
        } catch {
            Write-Host "❌ 오류 발생: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
} else {
    Write-Host "❌ PostgreSQL 서비스를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "가능한 원인:" -ForegroundColor Yellow
    Write-Host "1. PostgreSQL이 설치되지 않았습니다." -ForegroundColor Yellow
    Write-Host "2. Docker를 통해 PostgreSQL을 실행하고 있습니다." -ForegroundColor Yellow
    Write-Host ""
    
    # Docker 확인
    Write-Host "Docker 확인 중..." -ForegroundColor Yellow
    try {
        $dockerVersion = docker --version 2>$null
        if ($dockerVersion) {
            Write-Host "✓ Docker가 설치되어 있습니다: $dockerVersion" -ForegroundColor Green
            Write-Host ""
            Write-Host "Docker로 PostgreSQL을 실행하려면:" -ForegroundColor Cyan
            Write-Host "1. Docker Desktop이 자동 시작되도록 설정" -ForegroundColor White
            Write-Host "   - Docker Desktop 설정 → General → 'Start Docker Desktop when you log in' 체크" -ForegroundColor White
            Write-Host ""
            Write-Host "2. 다음 명령어로 PostgreSQL 컨테이너 시작:" -ForegroundColor White
            Write-Host "   cd D:\CMS_NEW" -ForegroundColor Gray
            Write-Host "   docker-compose up -d postgres" -ForegroundColor Gray
            Write-Host ""
            Write-Host "3. Windows 시작 시 자동 실행 스크립트 등록:" -ForegroundColor White
            Write-Host "   .\setup-docker-autostart.ps1 실행" -ForegroundColor Gray
            Write-Host ""
        } else {
            throw "Docker not found"
        }
    } catch {
        Write-Host "⚠ Docker가 설치되지 않았습니다." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "PostgreSQL 설치 방법:" -ForegroundColor Cyan
        Write-Host "1. PostgreSQL 다운로드: https://www.postgresql.org/download/windows/" -ForegroundColor White
        Write-Host "2. 설치 시 'Launch PostgreSQL at Windows startup' 옵션 체크" -ForegroundColor White
        Write-Host "3. 설치 후 이 스크립트를 다시 실행" -ForegroundColor White
        Write-Host ""
        Write-Host "또는 Docker 사용:" -ForegroundColor Cyan
        Write-Host "1. Docker Desktop 다운로드: https://www.docker.com/products/docker-desktop" -ForegroundColor White
        Write-Host "2. 설치 후 docker-compose로 PostgreSQL 실행" -ForegroundColor White
        Write-Host ""
    }
}

# 현재 상태 표시
Write-Host ""
Write-Host "현재 PostgreSQL 관련 서비스 상태:" -ForegroundColor Cyan
Get-Service | Where-Object {
    $_.DisplayName -like "*PostgreSQL*" -or 
    $_.Name -like "*postgresql*"
} | Select-Object Name, DisplayName, Status, StartType | Format-Table -AutoSize

Write-Host ""
Read-Host "아무 키나 눌러 종료..."

