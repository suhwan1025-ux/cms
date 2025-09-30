const express = require('express');
const cors = require('cors');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './env.production' });

const app = express();
const PORT = process.env.PORT || 3001;

// 프로덕션 환경 설정
const isProduction = process.env.NODE_ENV === 'production';

// CORS 설정 (인트라망 환경에 맞게 조정)
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 제공 (빌드된 React 앱)
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'build')));
}

// API 라우트 (기존 server.js의 라우트들을 여기에 복사)
// ... 기존 API 라우트들 ...

// 프로덕션 환경에서 React 앱 라우팅 처리
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// 데이터베이스 연결
const sequelize = new Sequelize(
  process.env.DB_NAME || 'contract_management',
  process.env.DB_USERNAME || 'postgres',
  process.env.DB_PASSWORD || 'meritz123!',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: isProduction ? false : console.log,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    }
  }
);

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 프로덕션 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📊 환경: ${process.env.NODE_ENV}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});

// 데이터베이스 연결 테스트
sequelize.authenticate()
  .then(() => {
    console.log('✅ 데이터베이스 연결 성공');
  })
  .catch(err => {
    console.error('❌ 데이터베이스 연결 실패:', err);
  });

// 프로세스 종료 시 정리
process.on('SIGTERM', () => {
  console.log('🔄 서버 종료 신호 수신, 정리 작업 시작...');
  sequelize.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 서버 종료 신호 수신, 정리 작업 시작...');
  sequelize.close();
  process.exit(0);
}); 