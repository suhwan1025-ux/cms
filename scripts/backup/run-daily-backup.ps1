# =====================================================
# 일일 데이터베이스 백업 실행 PowerShell 스크립트
# 실행 시간: 매일 자정 00:00
# =====================================================

# 오류 발생 시 중단
$ErrorActionPreference = "Stop"

# 프로젝트 루트 디렉토리
$ProjectRoot = "D:\CMS_NEW"
Set-Location $ProjectRoot

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "일일 데이터베이스 백업 시작" -ForegroundColor Cyan
Write-Host "실행 시간: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 로그 디렉토리 생성
$LogDir = Join-Path $ProjectRoot "logs\backup"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# 로그 파일명 설정
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LogFile = Join-Path $LogDir "backup_$Timestamp.log"

Write-Host "로그 파일: $LogFile" -ForegroundColor Gray
Write-Host ""

# 로그 시작
"====================================" | Out-File $LogFile -Encoding UTF8
"일일 데이터베이스 백업" | Out-File $LogFile -Append -Encoding UTF8
"시작 시간: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File $LogFile -Append -Encoding UTF8
"====================================" | Out-File $LogFile -Append -Encoding UTF8
"" | Out-File $LogFile -Append -Encoding UTF8

try {
    # 1단계: 백업 실행
    Write-Host "[1/2] 데이터 백업 중..." -ForegroundColor Yellow
    
    $BackupScript = Join-Path $ProjectRoot "scripts\backup\daily-backup.js"
    $BackupOutput = & node $BackupScript 2>&1
    $BackupOutput | Out-File $LogFile -Append -Encoding UTF8
    
    if ($LASTEXITCODE -ne 0) {
        throw "백업 실행 실패"
    }
    
    Write-Host "✓ 백업 완료" -ForegroundColor Green
    Write-Host ""
    
    # 2단계: 오래된 백업 정리
    Write-Host "[2/2] 오래된 백업 데이터 정리 중..." -ForegroundColor Yellow
    
    $CleanupScript = Join-Path $ProjectRoot "scripts\backup\cleanup-old-backups.js"
    $CleanupOutput = & node $CleanupScript 2>&1
    $CleanupOutput | Out-File $LogFile -Append -Encoding UTF8
    
    if ($LASTEXITCODE -ne 0) {
        throw "백업 정리 실패"
    }
    
    Write-Host "✓ 정리 완료" -ForegroundColor Green
    Write-Host ""
    
    # 성공 메시지
    Write-Host "====================================" -ForegroundColor Green
    Write-Host "백업 작업이 완료되었습니다." -ForegroundColor Green
    Write-Host "종료 시간: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
    Write-Host ""
    
    # 30일 이상된 로그 파일 삭제
    $OldLogs = Get-ChildItem -Path $LogDir -Filter "*.log" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) }
    foreach ($Log in $OldLogs) {
        Remove-Item $Log.FullName -Force
        Write-Host "오래된 로그 삭제: $($Log.Name)" -ForegroundColor Gray
    }
    
    # 로그 종료
    "" | Out-File $LogFile -Append -Encoding UTF8
    "====================================" | Out-File $LogFile -Append -Encoding UTF8
    "백업 완료" | Out-File $LogFile -Append -Encoding UTF8
    "종료 시간: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File $LogFile -Append -Encoding UTF8
    "====================================" | Out-File $LogFile -Append -Encoding UTF8
    
    exit 0
    
} catch {
    # 오류 처리
    Write-Host "" -ForegroundColor Red
    Write-Host "====================================" -ForegroundColor Red
    Write-Host "백업 작업 중 오류가 발생했습니다." -ForegroundColor Red
    Write-Host "오류: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "로그 파일을 확인하세요: $LogFile" -ForegroundColor Red
    Write-Host "====================================" -ForegroundColor Red
    Write-Host ""
    
    # 로그에 오류 기록
    "" | Out-File $LogFile -Append -Encoding UTF8
    "====================================" | Out-File $LogFile -Append -Encoding UTF8
    "백업 실패" | Out-File $LogFile -Append -Encoding UTF8
    "오류: $($_.Exception.Message)" | Out-File $LogFile -Append -Encoding UTF8
    "종료 시간: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File $LogFile -Append -Encoding UTF8
    "====================================" | Out-File $LogFile -Append -Encoding UTF8
    
    exit 1
}

