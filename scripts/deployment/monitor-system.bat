@echo off
chcp 65001 > nul
echo ================================
echo 계약관리시스템 모니터링 도구
echo ================================
echo.

:MENU
echo [1] 시스템 리소스 확인
echo [2] 프로세스 상태 확인
echo [3] 포트 사용 현황
echo [4] 데이터베이스 상태
echo [5] 로그 파일 확인
echo [6] 실시간 모니터링 시작
echo [0] 종료
echo.
set /p choice="선택하세요 (0-6): "

if "%choice%"=="1" goto SYSTEM_INFO
if "%choice%"=="2" goto PROCESS_INFO
if "%choice%"=="3" goto PORT_INFO
if "%choice%"=="4" goto DB_INFO
if "%choice%"=="5" goto LOG_INFO
if "%choice%"=="6" goto REALTIME_MONITOR
if "%choice%"=="0" goto EXIT
goto MENU

:SYSTEM_INFO
echo.
echo ================================
echo 시스템 리소스 정보
echo ================================
echo.
echo CPU 사용률:
wmic cpu get loadpercentage /value | findstr LoadPercentage
echo.
echo 메모리 사용률:
for /f "skip=1" %%p in ('wmic os get TotalVisibleMemorySize /value') do set TotalMem=%%p
for /f "skip=1" %%p in ('wmic os get FreePhysicalMemory /value') do set FreeMem=%%p
set /a UsedMem=%TotalMem:~23% - %FreeMem:~19%
set /a MemUsage=(%UsedMem% * 100) / %TotalMem:~23%
echo 사용중: %MemUsage%%%
echo.
echo 디스크 사용률:
wmic logicaldisk get size,freespace,caption /format:table
echo.
pause
goto MENU

:PROCESS_INFO
echo.
echo ================================
echo 프로세스 상태 확인
echo ================================
echo.
echo Node.js 프로세스:
tasklist /fi "imagename eq node.exe" /fo table
echo.
echo PostgreSQL 프로세스:
tasklist /fi "imagename eq postgres.exe" /fo table
echo.
pause
goto MENU

:PORT_INFO
echo.
echo ================================
echo 포트 사용 현황
echo ================================
echo.
echo 3001 포트 (백엔드):
netstat -ano | findstr :3001
echo.
echo 3002 포트 (프론트엔드):
netstat -ano | findstr :3002
echo.
echo 5432 포트 (PostgreSQL):
netstat -ano | findstr :5432
echo.
pause
goto MENU

:DB_INFO
echo.
echo ================================
echo 데이터베이스 상태 확인
echo ================================
echo.
node -e "
const { Sequelize } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(
    process.env.DB_NAME || 'contract_management',
    process.env.DB_USERNAME || 'postgres',
    process.env.DB_PASSWORD || 'meritz123!',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false
    }
);

async function checkDB() {
    try {
        await sequelize.authenticate();
        console.log('✓ 데이터베이스 연결: 정상');
        
        const [results] = await sequelize.query('SELECT COUNT(*) as count FROM proposals');
        console.log('품의서 총 개수:', results[0].count);
        
        const [activeConnections] = await sequelize.query('SELECT count(*) as active FROM pg_stat_activity WHERE state = \'active\'');
        console.log('활성 연결 수:', activeConnections[0].active);
        
        await sequelize.close();
    } catch (error) {
        console.log('✗ 데이터베이스 연결 실패:', error.message);
    }
}
checkDB();
"
echo.
pause
goto MENU

:LOG_INFO
echo.
echo ================================
echo 로그 파일 확인
echo ================================
echo.
if exist logs (
    echo 로그 파일 목록:
    dir logs /b
    echo.
    echo 최근 로그 파일 내용 (마지막 10줄):
    for /f %%i in ('dir logs\*.log /b /o-d 2^>nul ^| findstr /n "^" ^| findstr "^1:"') do (
        set latest=%%i
        goto SHOW_LOG
    )
    :SHOW_LOG
    set latest=%latest:~2%
    if defined latest (
        echo 파일: %latest%
        powershell -command "Get-Content 'logs\%latest%' -Tail 10"
    ) else (
        echo 로그 파일이 없습니다.
    )
) else (
    echo logs 폴더가 없습니다.
)
echo.
pause
goto MENU

:REALTIME_MONITOR
echo.
echo ================================
echo 실시간 모니터링 시작
echo ================================
echo Ctrl+C로 중단하세요.
echo.
:MONITOR_LOOP
cls
echo 실시간 모니터링 - %date% %time%
echo ================================
echo.
echo CPU 사용률:
wmic cpu get loadpercentage /value | findstr LoadPercentage
echo.
echo Node.js 프로세스:
tasklist /fi "imagename eq node.exe" /fo csv | findstr node.exe
echo.
echo 메모리 사용률:
for /f "skip=1" %%p in ('wmic os get FreePhysicalMemory /value') do set FreeMem=%%p
for /f "skip=1" %%p in ('wmic os get TotalVisibleMemorySize /value') do set TotalMem=%%p
set /a UsedMem=%TotalMem:~23% - %FreeMem:~19%
set /a MemUsage=(%UsedMem% * 100) / %TotalMem:~23%
echo 사용중: %MemUsage%%%
echo.
timeout /t 5 /nobreak >nul
goto MONITOR_LOOP

:EXIT
echo.
echo 모니터링을 종료합니다.
exit /b 0 