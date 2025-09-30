# 워크스테이션 환경 설치 가이드

## 🖥️ 워크스테이션 특별 고려사항

### 하드웨어 요구사항
- **RAM**: 최소 8GB, 권장 16GB 이상
- **저장공간**: 최소 10GB 여유 공간
- **CPU**: 멀티코어 프로세서 권장 (Node.js는 싱글스레드이지만 PostgreSQL과 동시 실행)

### 네트워크 설정
- **방화벽**: Windows Defender 또는 기업 방화벽 설정
- **포트**: 3001(백엔드), 3002(프론트엔드), 5432(PostgreSQL)
- **프록시**: 기업 프록시 환경 고려

## 🔧 워크스테이션별 설정

### Windows 워크스테이션

#### 1. 관리자 권한 필요 작업
```cmd
# PowerShell을 관리자 권한으로 실행
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 2. Windows Defender 방화벽 설정
```cmd
# 포트 허용 (관리자 권한 필요)
netsh advfirewall firewall add rule name="Node.js Backend" dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall add rule name="React Frontend" dir=in action=allow protocol=TCP localport=3002
netsh advfirewall firewall add rule name="PostgreSQL" dir=in action=allow protocol=TCP localport=5432
```

#### 3. 성능 최적화
- **가상 메모리**: 시스템 관리 크기로 설정
- **백그라운드 앱**: 불필요한 앱 비활성화
- **Windows 업데이트**: 최신 상태 유지

### Linux 워크스테이션 (Ubuntu/CentOS)

#### 1. 시스템 업데이트
```bash
# Ubuntu
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

#### 2. 방화벽 설정
```bash
# Ubuntu (ufw)
sudo ufw allow 3001
sudo ufw allow 3002
sudo ufw allow 5432

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=3002/tcp
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload
```

## 🚀 성능 최적화 설정

### Node.js 성능 튜닝
```bash
# 메모리 제한 증가 (4GB)
export NODE_OPTIONS="--max-old-space-size=4096"

# 프로덕션 환경 변수
export NODE_ENV=production
```

### PostgreSQL 성능 튜닝
워크스테이션 사양에 맞는 `postgresql.conf` 설정:

```ini
# 메모리 설정 (총 RAM의 25%)
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 64MB
maintenance_work_mem = 512MB

# 연결 설정
max_connections = 100
```

## 🔒 보안 설정

### 1. 데이터베이스 보안
```sql
-- 강력한 비밀번호 설정
ALTER USER postgres PASSWORD 'Strong_Password_123!';

-- 불필요한 권한 제거
REVOKE ALL ON DATABASE template1 FROM PUBLIC;
```

### 2. 애플리케이션 보안
```env
# .env 파일 보안 설정
SESSION_SECRET=your_very_long_random_string_here_min_32_chars
DB_PASSWORD=Strong_Database_Password_123!
```

### 3. 파일 권한 설정
```bash
# Linux에서 파일 권한 설정
chmod 600 .env
chmod -R 755 uploads/
chmod -R 644 logs/
```

## 🌐 네트워크 환경 설정

### 기업 프록시 환경
```bash
# npm 프록시 설정
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Git 프록시 설정 (필요시)
git config --global http.proxy http://proxy.company.com:8080
```

### 내부 네트워크 접근
```javascript
// server.js에 IP 바인딩 설정 추가
const HOST = process.env.HOST || '0.0.0.0'; // 모든 IP에서 접근 허용
app.listen(PORT, HOST, () => {
    console.log(`서버가 http://${HOST}:${PORT}에서 실행 중입니다.`);
});
```

## 📊 모니터링 및 로깅

### 시스템 리소스 모니터링
```bash
# Windows
tasklist /fi "imagename eq node.exe"
wmic process where name="postgres.exe" get ProcessId,PageFileUsage

# Linux
ps aux | grep node
ps aux | grep postgres
```

### 로그 관리
```javascript
// 로그 로테이션 설정 (선택사항)
const winston = require('winston');
require('winston-daily-rotate-file');

const logger = winston.createLogger({
    transports: [
        new winston.transports.DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d'
        })
    ]
});
```

## 🔄 자동 시작 설정

### Windows 서비스 등록
```cmd
# PM2를 사용한 서비스 등록
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### Linux Systemd 서비스
```ini
# /etc/systemd/system/contract-management.service
[Unit]
Description=Contract Management System
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/contract-management-system
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## 🛠️ 개발 도구 설정

### VS Code 확장 프로그램
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- PostgreSQL (SQLTools)
- Thunder Client (API 테스트)

### 디버깅 설정
```json
// .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch Backend",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/server.js",
            "env": {
                "NODE_ENV": "development"
            }
        }
    ]
}
```

## ⚠️ 주의사항

### 1. 백업 전략
- **자동 백업**: 매일 데이터베이스 백업
- **코드 백업**: Git 저장소 사용 권장
- **설정 백업**: .env 파일 별도 보관

### 2. 업데이트 관리
- **의존성 업데이트**: 정기적으로 `npm audit` 실행
- **보안 패치**: Node.js, PostgreSQL 보안 업데이트 적용
- **기능 테스트**: 업데이트 후 전체 기능 테스트

### 3. 용량 관리
- **로그 파일**: 정기적으로 정리
- **업로드 파일**: 용량 제한 설정
- **데이터베이스**: 불필요한 데이터 정리

## 🆘 문제 해결

### 일반적인 워크스테이션 문제들

#### 메모리 부족
```bash
# Node.js 메모리 사용량 확인
node -e "console.log(process.memoryUsage())"

# PostgreSQL 메모리 사용량 확인
SELECT * FROM pg_stat_activity;
```

#### 포트 충돌
```cmd
# Windows에서 포트 사용 확인
netstat -ano | findstr :3001
netstat -ano | findstr :3002

# Linux에서 포트 사용 확인
lsof -i :3001
lsof -i :3002
```

#### 성능 저하
- CPU 사용률 확인
- 메모리 사용량 모니터링
- 디스크 I/O 확인
- 네트워크 지연 측정

---

**워크스테이션 환경에서는 특히 리소스 관리와 보안 설정이 중요합니다. 위 가이드를 참고하여 안정적인 운영 환경을 구축하세요.** 