# 환경변수 PATH에 Python과 Ollama 자동 추가
# 관리자 권한 필요

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  환경변수 PATH 추가" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 관리자 권한 확인
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[!] 관리자 권한으로 실행해주세요." -ForegroundColor Red
    Write-Host "    PowerShell 우클릭 > 관리자 권한으로 실행" -ForegroundColor Yellow
    pause
    exit 1
}

# 현재 PATH 가져오기
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

# Python 경로 찾기
$pythonPaths = @(
    "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python312",
    "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python312\Scripts",
    "C:\Python312",
    "C:\Python312\Scripts"
)

Write-Host "[*] Python 경로 확인 중..." -ForegroundColor Yellow
foreach ($path in $pythonPaths) {
    if (Test-Path $path) {
        if ($currentPath -notlike "*$path*") {
            Write-Host "[+] 추가: $path" -ForegroundColor Green
            $currentPath += ";$path"
        } else {
            Write-Host "[✓] 이미 있음: $path" -ForegroundColor Gray
        }
    }
}

# Ollama 경로 찾기
$ollamaPaths = @(
    "C:\Program Files\Ollama",
    "C:\Users\$env:USERNAME\AppData\Local\Programs\Ollama"
)

Write-Host "[*] Ollama 경로 확인 중..." -ForegroundColor Yellow
foreach ($path in $ollamaPaths) {
    if (Test-Path $path) {
        if ($currentPath -notlike "*$path*") {
            Write-Host "[+] 추가: $path" -ForegroundColor Green
            $currentPath += ";$path"
        } else {
            Write-Host "[✓] 이미 있음: $path" -ForegroundColor Gray
        }
    }
}

# PATH 저장
Write-Host ""
Write-Host "[*] 환경변수 저장 중..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("Path", $currentPath, "Machine")

Write-Host "[+] 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  PowerShell을 닫고 새로 열어야 적용됩니다!" -ForegroundColor Yellow
Write-Host ""

# 확인
Write-Host "확인:" -ForegroundColor Cyan
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  Python: 아직 사용 불가 (PowerShell 재시작 필요)" -ForegroundColor Yellow
}

try {
    $ollamaVersion = ollama --version 2>&1
    Write-Host "  Ollama: $ollamaVersion" -ForegroundColor Green
} catch {
    Write-Host "  Ollama: 아직 사용 불가 (PowerShell 재시작 필요)" -ForegroundColor Yellow
}

Write-Host ""
pause

