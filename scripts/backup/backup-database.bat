@echo off
chcp 65001 > nul
echo ================================
echo 데이터베이스 백업 스크립트
echo ================================
echo.

set BACKUP_DATE=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DATE=%BACKUP_DATE: =0%
set BACKUP_FILE=contract_management_backup_%BACKUP_DATE%.sql

echo 백업 파일: %BACKUP_FILE%
echo.

echo PostgreSQL 데이터베이스를 백업하는 중...
echo 비밀번호를 입력하세요:

pg_dump -U postgres -h localhost -d contract_management > %BACKUP_FILE%

if %errorlevel% equ 0 (
    echo.
    echo ================================
    echo 백업 완료!
    echo ================================
    echo 파일: %BACKUP_FILE%
    echo.
    echo 새 PC에서 복원하려면:
    echo psql -U postgres -h localhost -d contract_management ^< %BACKUP_FILE%
) else (
    echo.
    echo 백업 실패!
    echo PostgreSQL이 설치되어 있고 서비스가 실행 중인지 확인하세요.
)

echo.
pause 