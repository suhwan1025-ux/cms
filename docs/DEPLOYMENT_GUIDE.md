# 🚀 계약관리시스템 인트라망 배포 가이드

## 📋 목차
1. [사전 준비사항](#사전-준비사항)
2. [방법 1: 직접 배포](#방법-1-직접-배포)
3. [방법 2: Docker 배포](#방법-2-docker-배포)
4. [방법 3: PM2 배포](#방법-3-pm2-배포)
5. [방화벽 및 네트워크 설정](#방화벽-및-네트워크-설정)
6. [모니터링 및 로그](#모니터링-및-로그)
7. [문제 해결](#문제-해결)

## 🔧 사전 준비사항

### 필수 소프트웨어
- **Node.js 18+** (LTS 버전 권장)
- **PostgreSQL 15+** 또는 기존 인트라망 DB
- **Git** (소스코드 관리용)

### 시스템 요구사항
- **CPU**: 최소 2코어, 권장 4코어
- **메모리**: 최소 4GB, 권장 8GB
- **디스크**: 최소 20GB 여유 공간
- **네트워크**: 인트라망 접근 가능

## 🎯 방법 1: 직접 배포

### 1단계: 환경 설정
```bash
# 1. 프로젝트 디렉토리로 이동
cd contract-management-system

# 2. 의존성 설치
npm install

# 3. 환경 설정 파일 수정
# env.production 파일에서 다음 정보를 수정:
# - DB_HOST: 인트라망 DB 서버 IP
# - DB_USERNAME: DB 사용자명
# - DB_PASSWORD: DB 비밀번호
# - CORS_ORIGIN: 인트라망 도메인
```

### 2단계: 프로덕션 빌드
```bash
# React 앱 빌드
npm run build:prod

# 빌드 확인
ls -la build/
```

### 3단계: 서버 시작
```bash
# 프로덕션 서버 시작
npm run start:prod

# 또는 직접 실행
node server.prod.js
```

### 4단계: 자동화 스크립트 사용
```powershell
# PowerShell에서 실행
.\deploy.ps1
```

## 🐳 방법 2: Docker 배포

### 1단계: Docker 설치 확인
```bash
docker --version
docker-compose --version
```

### 2단계: 환경 설정
```bash
# env.production 파일 수정 (위와 동일)
# docker-compose.yml에서 환경변수 확인
```

### 3단계: 컨테이너 실행
```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 상태 확인
docker-compose ps
```

### 4단계: 개별 서비스 관리
```bash
# 특정 서비스만 재시작
docker-compose restart contract-management

# 서비스 중지
docker-compose down

# 볼륨 포함 완전 삭제
docker-compose down -v
```

## 📊 방법 3: PM2 배포

### 1단계: PM2 설치
```bash
npm install -g pm2
```

### 2단계: PM2 설정
```bash
# ecosystem.config.js 파일 확인 후 실행
pm2 start ecosystem.config.js --env production

# 또는 직접 실행
pm2 start server.prod.js --name "contract-management" --env production
```

### 3단계: PM2 관리
```bash
# 프로세스 상태 확인
pm2 status

# 로그 확인
pm2 logs contract-management

# 재시작
pm2 restart contract-management

# 중지
pm2 stop contract-management

# 삭제
pm2 delete contract-management
```

## 🔒 방화벽 및 네트워크 설정

### 포트 설정
- **3001**: 애플리케이션 서버
- **5432**: PostgreSQL (필요시)
- **80/443**: Nginx (선택사항)

### Windows 방화벽 설정
```powershell
# 인바운드 규칙 추가
New-NetFirewallRule -DisplayName "Contract Management System" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow

# 아웃바운드 규칙 추가
New-NetFirewallRule -DisplayName "Contract Management System Outbound" -Direction Outbound -Protocol TCP -LocalPort 3001 -Action Allow
```

### Linux 방화벽 설정 (ufw)
```bash
# 포트 열기
sudo ufw allow 3001
sudo ufw allow 5432

# 방화벽 상태 확인
sudo ufw status
```

## 📈 모니터링 및 로그

### 로그 디렉토리 생성
```bash
mkdir logs
mkdir uploads
```

### 로그 모니터링
```bash
# 실시간 로그 확인
tail -f logs/combined.log

# 에러 로그 확인
tail -f logs/err.log

# 출력 로그 확인
tail -f logs/out.log
```

### 시스템 모니터링
```bash
# 프로세스 상태 확인
ps aux | grep node

# 포트 사용 확인
netstat -tulpn | grep :3001

# 메모리 사용량 확인
free -h
```

## 🚨 문제 해결

### 일반적인 문제들

#### 1. 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :3001

# 프로세스 종료
taskkill /PID [프로세스ID] /F
```

#### 2. 데이터베이스 연결 실패
```bash
# DB 서버 연결 테스트
telnet [DB_IP] 5432

# 환경변수 확인
echo $DB_HOST
echo $DB_PASSWORD
```

#### 3. 권한 문제
```bash
# 파일 권한 확인
ls -la

# 권한 수정
chmod 755 server.prod.js
chmod 644 env.production
```

### 디버깅 모드
```bash
# 개발 모드로 실행하여 상세 로그 확인
NODE_ENV=development node server.js

# 또는 로그 레벨 상향
LOG_LEVEL=debug node server.prod.js
```

## 🔄 업데이트 및 유지보수

### 코드 업데이트
```bash
# 1. 최신 코드 가져오기
git pull origin main

# 2. 의존성 업데이트
npm install

# 3. 재빌드
npm run build:prod

# 4. 서버 재시작
pm2 restart contract-management
# 또는
docker-compose restart contract-management
```

### 백업 및 복구
```bash
# 데이터베이스 백업
pg_dump -h [DB_HOST] -U [DB_USER] contract_management > backup_$(date +%Y%m%d).sql

# 애플리케이션 백업
tar -czf app_backup_$(date +%Y%m%d).tar.gz . --exclude=node_modules --exclude=logs
```

## 📞 지원 및 문의

### 로그 파일 위치
- **애플리케이션 로그**: `./logs/`
- **에러 로그**: `./logs/err.log`
- **출력 로그**: `./logs/out.log`

### 모니터링 명령어
```bash
# PM2 상태
pm2 monit

# Docker 상태
docker stats

# 시스템 리소스
htop
```

---

## 🎉 배포 완료!

배포가 완료되면 다음 URL로 접속하여 확인할 수 있습니다:
- **로컬**: http://localhost:3001
- **인트라망**: http://[서버IP]:3001

문제가 발생하면 위의 문제 해결 섹션을 참고하거나 로그 파일을 확인해주세요. 