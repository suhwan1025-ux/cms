# =====================================================
# Windows 작업 스케줄러 자동 등록 스크립트
# 매일 자정에 데이터베이스 백업을 실행하도록 설정
# =====================================================

# 관리자 권한 확인
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host ""
    Write-Host "❌ 오류: 이 스크립트는 관리자 권한이 필요합니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "해결 방법:" -ForegroundColor Yellow
    Write-Host "  1. PowerShell을 관리자 권한으로 실행" -ForegroundColor Yellow
    Write-Host "  2. 이 스크립트를 다시 실행" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "CMS 백업 작업 스케줄러 등록" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 프로젝트 루트 디렉토리 (현재 스크립트 위치 기준)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Get-Item $ScriptDir).Parent.Parent.FullName

Write-Host "프로젝트 경로: $ProjectRoot" -ForegroundColor Gray
Write-Host ""

# 파일 존재 확인
$BackupScriptPath = Join-Path $ProjectRoot "scripts\backup\run-daily-backup.ps1"

if (-not (Test-Path $BackupScriptPath)) {
    Write-Host "❌ 오류: 백업 스크립트를 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "   경로: $BackupScriptPath" -ForegroundColor Gray
    Write-Host ""
    pause
    exit 1
}

Write-Host "✓ 백업 스크립트 확인: $BackupScriptPath" -ForegroundColor Green
Write-Host ""

# 작업 스케줄러 설정
$TaskName = "CMS 데이터베이스 일일 백업"
$TaskDescription = "계약관리 시스템 데이터베이스 자동 백업 (매일 자정)"

# 기존 작업이 있는지 확인
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($ExistingTask) {
    Write-Host "⚠️  기존 작업이 이미 존재합니다: $TaskName" -ForegroundColor Yellow
    Write-Host ""
    $Response = Read-Host "기존 작업을 삭제하고 새로 등록하시겠습니까? (Y/N)"
    
    if ($Response -eq 'Y' -or $Response -eq 'y') {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "✓ 기존 작업 삭제 완료" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "작업 등록을 취소했습니다." -ForegroundColor Yellow
        pause
        exit 0
    }
}

try {
    # 트리거: 매일 자정 (00:00)
    Write-Host "작업 트리거 설정: 매일 자정 00:00" -ForegroundColor Gray
    $Trigger = New-ScheduledTaskTrigger -Daily -At "00:00"

    # 동작: PowerShell 스크립트 실행
    Write-Host "작업 동작 설정: PowerShell 스크립트 실행" -ForegroundColor Gray
    $Action = New-ScheduledTaskAction `
        -Execute "powershell.exe" `
        -Argument "-ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File `"$BackupScriptPath`"" `
        -WorkingDirectory $ProjectRoot

    # 작업 설정
    Write-Host "작업 옵션 설정" -ForegroundColor Gray
    $Settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 1) `
        -ExecutionTimeLimit (New-TimeSpan -Hours 1)

    # 보안 주체 (현재 사용자)
    $Principal = New-ScheduledTaskPrincipal `
        -UserId $env:USERNAME `
        -RunLevel Highest `
        -LogonType Interactive

    # 작업 등록
    Write-Host ""
    Write-Host "작업 스케줄러 등록 중..." -ForegroundColor Yellow
    
    $Task = Register-ScheduledTask `
        -TaskName $TaskName `
        -Description $TaskDescription `
        -Trigger $Trigger `
        -Action $Action `
        -Settings $Settings `
        -Principal $Principal `
        -Force

    Write-Host ""
    Write-Host "====================================" -ForegroundColor Green
    Write-Host "✓ 작업 등록 완료!" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "작업 이름: $TaskName" -ForegroundColor White
    Write-Host "실행 시간: 매일 자정 00:00" -ForegroundColor White
    Write-Host "스크립트: $BackupScriptPath" -ForegroundColor White
    Write-Host ""
    
    # 작업 정보 확인
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host "등록된 작업 정보" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    
    $TaskInfo = Get-ScheduledTask -TaskName $TaskName
    Write-Host "상태: $($TaskInfo.State)" -ForegroundColor $(if ($TaskInfo.State -eq 'Ready') { 'Green' } else { 'Yellow' })
    Write-Host "다음 실행 시간: $((Get-ScheduledTaskInfo -TaskName $TaskName).NextRunTime)" -ForegroundColor White
    Write-Host "마지막 실행 시간: $((Get-ScheduledTaskInfo -TaskName $TaskName).LastRunTime)" -ForegroundColor White
    Write-Host ""
    
    # 테스트 실행 제안
    Write-Host "====================================" -ForegroundColor Yellow
    Write-Host "테스트 실행" -ForegroundColor Yellow
    Write-Host "====================================" -ForegroundColor Yellow
    Write-Host ""
    $TestResponse = Read-Host "지금 백업을 테스트 실행하시겠습니까? (Y/N)"
    
    if ($TestResponse -eq 'Y' -or $TestResponse -eq 'y') {
        Write-Host ""
        Write-Host "백업 실행 중..." -ForegroundColor Yellow
        Write-Host ""
        
        # 스크립트 직접 실행
        & $BackupScriptPath
        
        Write-Host ""
        Write-Host "테스트 실행 완료" -ForegroundColor Green
        Write-Host "로그 파일 확인: logs\backup\" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host "작업 관리 방법" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "작업 스케줄러 열기:" -ForegroundColor White
    Write-Host "  Win + R → taskschd.msc" -ForegroundColor Gray
    Write-Host ""
    Write-Host "PowerShell 명령:" -ForegroundColor White
    Write-Host "  # 작업 상태 확인" -ForegroundColor Gray
    Write-Host "  Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  # 작업 수동 실행" -ForegroundColor Gray
    Write-Host "  Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  # 작업 중지" -ForegroundColor Gray
    Write-Host "  Stop-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  # 작업 삭제" -ForegroundColor Gray
    Write-Host "  Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "====================================" -ForegroundColor Red
    Write-Host "❌ 오류 발생" -ForegroundColor Red
    Write-Host "====================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "오류 메시지: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "문제 해결:" -ForegroundColor Yellow
    Write-Host "  1. 관리자 권한으로 실행했는지 확인" -ForegroundColor Yellow
    Write-Host "  2. 파일 경로가 올바른지 확인" -ForegroundColor Yellow
    Write-Host "  3. 작업 스케줄러 서비스가 실행 중인지 확인" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host ""
pause

