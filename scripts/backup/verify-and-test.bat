@echo off
REM =====================================================
REM 백업 시스템 검증 및 테스트 배치 파일
REM =====================================================

echo ====================================
echo 백업 시스템 검증 및 테스트
echo ====================================
echo.

cd /d D:\CMS_NEW

echo [1/3] 백업 시스템 검증 중...
echo.
node scripts/backup/test-backup-system.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ====================================
    echo 검증 중 오류가 발생했습니다.
    echo ====================================
    pause
    exit /b 1
)

echo.
echo ====================================
echo [2/3] 작업 스케줄러 상태 확인
echo ====================================
echo.

powershell -Command "Get-ScheduledTask -TaskName 'CMS 데이터베이스 일일 백업' -ErrorAction SilentlyContinue | Format-Table -Property TaskName, State, NextRunTime"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo 작업 스케줄러가 등록되지 않았습니다.
    echo 다음 명령으로 등록하세요:
    echo   .\scripts\setup\register-backup-scheduler.ps1
    echo.
)

echo.
echo ====================================
echo [3/3] 테스트 백업 실행 여부 확인
echo ====================================
echo.

set /p RUN_TEST="테스트 백업을 실행하시겠습니까? (Y/N): "

if /i "%RUN_TEST%"=="Y" (
    echo.
    echo 테스트 백업 실행 중...
    node scripts/backup/daily-backup.js
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✓ 테스트 백업 완료
        echo.
        echo 정리 작업 실행 중...
        node scripts/backup/cleanup-old-backups.js
    ) else (
        echo.
        echo ✗ 테스트 백업 실패
    )
)

echo.
echo ====================================
echo 검증 완료
echo ====================================
echo.

pause

