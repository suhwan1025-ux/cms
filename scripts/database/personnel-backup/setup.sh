#!/bin/bash
# ============================================================
# Personnel Backup 초기 설정 스크립트 (Linux/Mac)
# ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Personnel Backup 초기 설정"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 실행 권한 부여
echo "🔧 실행 권한 설정 중..."
chmod +x scripts/database/personnel-backup/04-auto-backup.js
chmod +x scripts/database/personnel-backup/setup.sh
echo "✅ 실행 권한 설정 완료"
echo ""

# DB 설정 확인
echo "🔍 DB 설정 확인..."
if [ -f ".env" ]; then
  echo "✅ .env 파일 존재"
  
  if grep -q "DB_NAME" .env && grep -q "DB_USERNAME" .env; then
    echo "✅ DB 설정 발견"
  else
    echo "⚠️  .env에 DB 설정이 없습니다"
    echo "   DB_NAME, DB_USERNAME, DB_PASSWORD 설정 필요"
  fi
else
  echo "⚠️  .env 파일이 없습니다"
fi
echo ""

# 테이블 생성 안내
echo "📋 다음 단계:"
echo "   1. personnel_backup 테이블 생성"
echo "      psql -U postgres -d cms_db -f scripts/database/personnel-backup/01-create-personnel-backup-table.sql"
echo ""
echo "   2. 첫 백업 실행"
echo "      node scripts/database/personnel-backup/04-auto-backup.js"
echo ""
echo "   3. 자동 백업 설정 (선택사항)"
echo "      crontab -e"
echo "      0 0 1 * * cd $(pwd) && node scripts/database/personnel-backup/04-auto-backup.js >> /var/log/personnel-backup.log 2>&1"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 초기 설정 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

