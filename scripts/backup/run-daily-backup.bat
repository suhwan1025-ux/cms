@echo off
REM =====================================================
REM 일일 데이터베이스 백업 실행 배치 파일
REM 실행 시간: 매일 자정 00:00
REM =====================================================

echo ====================================
echo 일일 데이터베이스 백업 시작
echo 실행 시간: %date% %time%
echo ====================================
echo.

REM 프로젝트 디렉토리로 이동
cd /d D:\CMS_NEW

REM 로그 디렉토리 생성 (없으면)
if not exist "logs\backup" mkdir logs\backup

REM 로그 파일명 설정 (날짜_시간.log)
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set LOGFILE=logs\backup\backup_%TIMESTAMP%.log

echo 로그 파일: %LOGFILE%
echo.

REM 1단계: 백업 실행
echo [1/2] 데이터 백업 중...
node scripts/backup/daily-backup.js >> %LOGFILE% 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✓ 백업 완료
) else (
    echo ✗ 백업 실패 - 로그 확인 필요
    echo 백업 실패: %date% %time% >> %LOGFILE%
    goto :error
)

echo.

REM 2단계: 오래된 백업 정리
echo [2/2] 오래된 백업 데이터 정리 중...
node scripts/backup/cleanup-old-backups.js >> %LOGFILE% 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✓ 정리 완료
) else (
    echo ✗ 정리 실패 - 로그 확인 필요
    echo 정리 실패: %date% %time% >> %LOGFILE%
    goto :error
)

echo.
echo ====================================
echo 백업 작업이 완료되었습니다.
echo 종료 시간: %date% %time%
echo ====================================
echo.

REM 30일 이상된 로그 파일 삭제
forfiles /p "logs\backup" /s /m *.log /d -30 /c "cmd /c del @path" 2>nul

exit /b 0

:error
echo.
echo ====================================
echo 백업 작업 중 오류가 발생했습니다.
echo 로그 파일을 확인하세요: %LOGFILE%
echo ====================================
echo.
exit /b 1

