@echo off
chcp 65001 > nul
echo ================================
echo 계약관리시스템 이관 패키지 생성
echo ================================
echo.

set PACKAGE_NAME=contract-management-system-migration-%date:~0,4%%date:~5,2%%date:~8,2%
echo 패키지 이름: %PACKAGE_NAME%
echo.

echo [1/4] 임시 디렉토리 생성...
if exist temp_migration rmdir /s /q temp_migration
mkdir temp_migration
mkdir temp_migration\%PACKAGE_NAME%

echo [2/4] 필수 파일들 복사 중...
xcopy /E /I /H /Y src temp_migration\%PACKAGE_NAME%\src
xcopy /E /I /H /Y public temp_migration\%PACKAGE_NAME%\public
xcopy /E /I /H /Y config temp_migration\%PACKAGE_NAME%\config
xcopy /E /I /H /Y migrations temp_migration\%PACKAGE_NAME%\migrations

copy package.json temp_migration\%PACKAGE_NAME%\
copy server.js temp_migration\%PACKAGE_NAME%\
copy craco.config.js temp_migration\%PACKAGE_NAME%\
copy .env.example temp_migration\%PACKAGE_NAME%\
copy README.md temp_migration\%PACKAGE_NAME%\
copy setup.bat temp_migration\%PACKAGE_NAME%\
copy setup.sh temp_migration\%PACKAGE_NAME%\
copy MIGRATION_CHECKLIST.md temp_migration\%PACKAGE_NAME%\
copy .gitignore temp_migration\%PACKAGE_NAME%\

echo [3/4] 선택적 파일들 복사 중...
if exist uploads (
    echo uploads 폴더 복사 중...
    xcopy /E /I /H /Y uploads temp_migration\%PACKAGE_NAME%\uploads
)

echo [4/4] 압축 파일 생성...
cd temp_migration
powershell -command "Compress-Archive -Path '%PACKAGE_NAME%' -DestinationPath '../%PACKAGE_NAME%.zip' -Force"
cd ..

echo 정리 중...
rmdir /s /q temp_migration

echo.
echo ================================
echo 이관 패키지 생성 완료!
echo ================================
echo 파일: %PACKAGE_NAME%.zip
echo.
echo 다음 단계:
echo 1. %PACKAGE_NAME%.zip 파일을 새 PC로 복사
echo 2. 압축 해제 후 setup.bat 실행
echo 3. MIGRATION_CHECKLIST.md 참조
echo.
pause 