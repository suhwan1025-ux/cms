const express = require('express');
const cors = require('cors');
const { Sequelize, Op } = require('sequelize');
const axios = require('axios');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 외부 DB 설정 (부서 정보, 사용자 정보 등)
const { getDepartmentsFromExternalDb, testExternalDbConnection, getUserByIP } = require('./config/externalDatabase');

const app = express();

// 환경변수 필수 체크
if (!process.env.PORT) {
  console.error('❌ 환경변수 설정 오류: PORT가 설정되지 않았습니다.');
  console.error('env.development 또는 env.production을 .env로 복사하세요.');
  process.exit(1);
}
const PORT = process.env.PORT;

// AI 서버 설정 (사용 안 함)
// const AI_SERVER_URL = process.env.AI_SERVER_URL;

// =====================================================
// IP 접근 제어 미들웨어
// =====================================================
// IP 패턴 매칭 함수 (와일드카드 지원: 172.22.*.*)
function matchIPPattern(ip, pattern) {
  // localhost 처리
  if (pattern === 'localhost' && (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost')) {
    return true;
  }
  
  // IPv6 형식의 localhost (::1)를 127.0.0.1로 변환
  const normalizedIP = ip === '::1' ? '127.0.0.1' : ip;
  
  // IPv6 형식의 IPv4 매핑 주소 처리 (::ffff:192.168.1.1 → 192.168.1.1)
  const cleanIP = normalizedIP.replace(/^::ffff:/, '');
  
  // 정확한 매칭
  if (cleanIP === pattern) {
    return true;
  }
  
  // 와일드카드 패턴 매칭 (172.22.*.* 형식)
  if (pattern.includes('*')) {
    const regexPattern = pattern
      .replace(/\./g, '\\.')  // . → \.
      .replace(/\*/g, '\\d+'); // * → \d+
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(cleanIP);
  }
  
  return false;
}

// IP 접근 제어 설정을 메모리에 캐시 (런타임 변경 가능)
let ipAccessControlConfig = {
  enabled: process.env.IP_ACCESS_CONTROL_ENABLED === 'true',
  allowedIPs: process.env.ALLOWED_IPS?.split(',').map(ip => ip.trim()) || []
};

// .env 파일 경로
const envPath = path.join(__dirname, '.env');

// .env 파일 자동 갱신 함수
function reloadEnvConfig() {
  try {
    // .env 파일 직접 읽어서 파싱 (dotenv 캐시 우회)
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const envLines = envConfig.split('\n');
    
    let newAllowedIPs = '';
    let newEnabled = 'false';
    
    // .env 파일 파싱
    envLines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        if (trimmedLine.startsWith('ALLOWED_IPS=')) {
          newAllowedIPs = trimmedLine.substring('ALLOWED_IPS='.length).trim();
        } else if (trimmedLine.startsWith('IP_ACCESS_CONTROL_ENABLED=')) {
          newEnabled = trimmedLine.substring('IP_ACCESS_CONTROL_ENABLED='.length).trim();
        }
      }
    });
    
    // 메모리 캐시 업데이트
    const previousEnabled = ipAccessControlConfig.enabled;
    const previousIPs = [...ipAccessControlConfig.allowedIPs];
    
    ipAccessControlConfig.enabled = newEnabled === 'true';
    ipAccessControlConfig.allowedIPs = newAllowedIPs ? newAllowedIPs.split(',').map(ip => ip.trim()) : [];
    
    // 변경사항이 있을 경우에만 로그 출력
    if (previousEnabled !== ipAccessControlConfig.enabled || 
        JSON.stringify(previousIPs) !== JSON.stringify(ipAccessControlConfig.allowedIPs)) {
      console.log('🔄 IP 접근 제어 설정 자동 갱신됨');
      console.log(`   - 활성화: ${ipAccessControlConfig.enabled}`);
      console.log(`   - 허용 IP: ${ipAccessControlConfig.allowedIPs.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ .env 파일 갱신 실패:', error.message);
  }
}

// .env 파일 감시 - 파일 변경 시 자동으로 갱신
let watchTimeout = null; // 중복 이벤트 방지용

if (fs.existsSync(envPath)) {
  // watchFile 사용 (Windows에서 더 안정적)
  fs.watchFile(envPath, { interval: 500 }, (curr, prev) => {
    // 파일이 실제로 변경되었는지 확인 (수정 시간 비교)
    if (curr.mtime !== prev.mtime) {
      console.log('📝 .env 파일 변경 감지 (자동 갱신 중...)');
      
      // 중복 실행 방지
      if (watchTimeout) {
        clearTimeout(watchTimeout);
      }
      
      // 파일 쓰기가 완료될 때까지 대기
      watchTimeout = setTimeout(() => {
        reloadEnvConfig();
        watchTimeout = null;
      }, 300);
    }
  });
  
  console.log('👁️  .env 파일 자동 감시 시작 (500ms 간격)');
  console.log(`   📁 감시 중: ${envPath}`);
} else {
  console.warn('⚠️  .env 파일을 찾을 수 없습니다. IP 접근 제어 자동 갱신이 비활성화됩니다.');
  console.warn(`   📁 경로: ${envPath}`);
}

// IP 접근 제어 미들웨어
function ipAccessControl(req, res, next) {
  // IP 접근 제어가 비활성화된 경우 통과
  if (!ipAccessControlConfig.enabled) {
    // IP는 추출하되 접근 제어는 하지 않음
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                     req.socket.remoteAddress || 
                     req.ip;
    req.clientIP = clientIP;
    console.log(`ℹ️  [IP 접근 제어 비활성화] IP: ${clientIP} - 모든 접근 허용`);
    return next();
  }
  
  // 허용 IP 목록 가져오기
  const allowedIPs = ipAccessControlConfig.allowedIPs;
  
  if (allowedIPs.length === 0) {
    console.warn('⚠️  경고: 허용 IP 목록이 비어있습니다. 모든 접근을 허용합니다.');
    return next();
  }
  
  // 클라이언트 IP 추출 (상세 로그)
  const xForwardedFor = req.headers['x-forwarded-for'];
  const socketAddress = req.socket.remoteAddress;
  const expressIP = req.ip;
  
  const clientIP = xForwardedFor?.split(',')[0].trim() || 
                   socketAddress || 
                   expressIP;
  
  // IP 추출 상세 로그
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 [IP 추출] 클라이언트 IP 정보:');
  console.log(`   📍 요청 경로: ${req.method} ${req.path}`);
  console.log(`   📌 x-forwarded-for: ${xForwardedFor || '없음'}`);
  console.log(`   📌 socket.remoteAddress: ${socketAddress || '없음'}`);
  console.log(`   📌 req.ip (Express): ${expressIP || '없음'}`);
  console.log(`   ✅ 최종 선택된 IP: ${clientIP}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // IP 매칭 확인
  const isAllowed = allowedIPs.some(pattern => matchIPPattern(clientIP, pattern));
  
  if (isAllowed) {
    // req 객체에 IP 저장 (나중에 사용)
    req.clientIP = clientIP;
    console.log(`✅ [접근 허용] IP: ${clientIP}`);
    return next();
  }
  
  // 접근 거부
  console.warn(`❌ [접근 거부] IP: ${clientIP} (허용 목록: ${allowedIPs.join(', ')})`);
  return res.status(403).json({ 
    error: '접근 권한이 없습니다.',
    message: '허가되지 않은 IP 주소에서의 접근입니다.',
    clientIP: clientIP
  });
}

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(ipAccessControl); // IP 접근 제어 적용

// API 로깅 미들웨어 (간략한 로그)
app.use((req, res, next) => {
  // 정적 파일 요청은 로깅하지 않음
  if (req.path.startsWith('/static') || req.path.match(/\.(js|css|png|jpg|ico|svg)$/)) {
    return next();
  }
  
  // API 요청만 로깅
  if (req.path.startsWith('/api')) {
    const timestamp = new Date().toLocaleString('ko-KR');
    const clientIP = req.clientIP || req.ip || 'unknown';
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${clientIP}`);
  }
  
  next();
});

// 절대 경로로 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'build'))); // React 빌드 파일 서빙

// 사업예산 확정집행액 동기화 함수 (결재완료된 품의서 기준)
// 확정집행액은 JOIN으로 실시간 계산하므로 별도 동기화 함수 불필요

// 데이터베이스 연결
if (!process.env.DB_NAME || !process.env.DB_USERNAME || !process.env.DB_PASSWORD || !process.env.DB_HOST) {
  console.error('❌ 환경변수 설정 오류: DB 연결 정보가 없습니다.');
  console.error('env.development 또는 env.production을 .env로 복사하세요.');
  process.exit(1);
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false // SQL 로그 비활성화
  }
);

// 모델 로드
const models = require('./src/models');

// API 라우트

// 0-1. 접속 로그 기록 (사용자 접속 추적)
app.post('/api/access-log', async (req, res) => {
  try {
    const clientIP = req.clientIP || req.ip;
    const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const userAgent = req.headers['user-agent'] || '알 수 없음';
    const referer = req.headers['referer'] || '직접 접속';
    
    console.log('');
    console.log('🌐🌐🌐━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌐🌐🌐');
    console.log('🔔 [시스템 접속 감지]');
    console.log(`   ⏰ 시간: ${timestamp}`);
    console.log(`   📍 IP 주소: ${clientIP}`);
    console.log(`   🖥️  User Agent: ${userAgent.substring(0, 80)}${userAgent.length > 80 ? '...' : ''}`);
    console.log(`   🔗 Referer: ${referer}`);
    
    // 외부 Oracle DB에서 사용자 정보 조회
    const externalUser = await getUserByIP(clientIP);
    
    if (externalUser) {
      console.log(`   ✅ 사용자 인식 성공!`);
      console.log(`      👤 이름: ${externalUser.name}`);
      console.log(`      🆔 사번: ${externalUser.empno}`);
      console.log(`      🏢 IP: ${externalUser.ipAddress}`);
      
      // 사용자 정보 반환
      const userInfo = {
        id: externalUser.empno || externalUser.id,
        name: externalUser.name || '사용자',
        empno: externalUser.empno,
        department: '미지정',
        position: '미지정',
        email: '',
        clientIP: clientIP,
        source: 'external_db',
        accessTime: timestamp
      };
      
      console.log(`   💾 접속 기록 저장 완료`);
      console.log('🌐🌐🌐━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌐🌐🌐');
      console.log('');
      
      return res.json(userInfo);
    } else {
      console.log(`   ⚠️  사용자 인식 실패 (Oracle DB에 IP 매핑 없음)`);
      console.log(`   💡 기본 사용자 정보로 접속 허용`);
      
      const defaultUser = {
        id: 'admin',
        name: '작성자',
        department: 'IT팀',
        position: '과장',
        email: 'admin@company.com',
        clientIP: clientIP,
        source: 'default',
        accessTime: timestamp
      };
      
      console.log('🌐🌐🌐━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🌐🌐🌐');
      console.log('');
      
      return res.json(defaultUser);
    }
  } catch (error) {
    console.error('❌ 접속 로그 기록 실패:', error);
    
    // 오류 발생 시에도 기본값 반환
    const fallbackUser = {
      id: 'admin',
      name: '작성자',
      department: 'IT팀',
      position: '과장',
      email: 'admin@company.com',
      clientIP: req.clientIP || req.ip,
      source: 'fallback',
      accessTime: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    };
    
    res.json(fallbackUser);
  }
});

// 0-2. 현재 사용자 정보 조회 (IP 기반 자동 인식)
app.get('/api/auth/me', async (req, res) => {
  try {
    const clientIP = req.clientIP || req.ip;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 [사용자 조회] /api/auth/me 요청');
    console.log(`   📌 req.clientIP (미들웨어): ${req.clientIP || '없음'}`);
    console.log(`   📌 req.ip (Express): ${req.ip || '없음'}`);
    console.log(`   ✅ 최종 사용 IP: ${clientIP}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 외부 Oracle DB에서 사용자 정보 조회
    const externalUser = await getUserByIP(clientIP);
    
    if (externalUser) {
      // Oracle DB에서 사용자 정보를 찾은 경우
      const userInfo = {
        id: externalUser.empno || externalUser.id,
        name: externalUser.name || '사용자',
        empno: externalUser.empno,
        department: '미지정', // 부서 정보는 별도 조회 필요 시 추가
        position: '미지정', // 직급 정보는 별도 조회 필요 시 추가
        email: '', // 이메일 정보는 별도 조회 필요 시 추가
        clientIP: clientIP,
        source: 'external_db' // 데이터 출처 표시
      };
      
      console.log(`✅ [외부 DB] 사용자 정보 조회 성공: ${userInfo.name} (${userInfo.empno})`);
      return res.json(userInfo);
    }
    
    // 외부 DB에서 사용자 정보를 찾지 못한 경우 기본값 반환
    // 개발환경에서는 '사용자1'로 설정 (작성중인 품의서 조회를 위해)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const defaultUser = {
      id: 'admin',
      name: isDevelopment ? '사용자1' : '작성자',
      department: 'IT팀',
      position: '과장',
      email: 'admin@company.com',
      clientIP: clientIP,
      source: 'default' // 데이터 출처 표시
    };
    
    console.log(`⚠️  [기본값] 사용자 정보 없음, 기본값 반환: ${defaultUser.name} (환경: ${isDevelopment ? '개발' : '운영'})`);
    res.json(defaultUser);
  } catch (error) {
    console.error('❌ 사용자 정보 조회 실패:', error);
    
    // 오류 발생 시에도 기본값 반환 (시스템 중단 방지)
    // 개발환경에서는 '사용자1'로 설정
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.json({
      id: 'admin',
      name: isDevelopment ? '사용자1' : '작성자',
      department: 'IT팀',
      position: '과장',
      email: 'admin@company.com',
      clientIP: req.clientIP || req.ip,
      source: 'fallback',
      error: error.message
    });
  }
});

// 1. 부서 목록 조회 (외부 DB 연동)
app.get('/api/departments', async (req, res) => {
  try {
    // 외부 DB에서 부서 정보 조회 (외부 DB가 설정되지 않았으면 기본 부서 목록 반환)
    const departments = await getDepartmentsFromExternalDb();
    
    // 프론트엔드에서 사용하는 구조로 변환 (deptCode → id, deptName → name)
    const formattedDepartments = departments.map(dept => ({
      id: dept.deptCode || dept.id,
      name: dept.deptName || dept.name,
      code: dept.deptCode,
      description: dept.description || null,
      parentDept: dept.parentDept || null
    }));
    
    console.log(`✅ /api/departments 반환: ${formattedDepartments.length}개`);
    res.json(formattedDepartments);
  } catch (error) {
    console.error('부서 목록 조회 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

// 1-1. 외부 DB 연결 테스트
app.get('/api/external-db/test', async (req, res) => {
  try {
    const result = await testExternalDbConnection();
    res.json(result);
  } catch (error) {
    console.error('외부 DB 연결 테스트 실패:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// 1-2. IP 접근 제어 설정 조회 (관리자용)
app.get('/api/admin/ip-access-control', async (req, res) => {
  try {
    res.json({
      enabled: ipAccessControlConfig.enabled,
      allowedIPs: ipAccessControlConfig.allowedIPs,
      currentClientIP: req.clientIP || req.ip
    });
  } catch (error) {
    console.error('IP 접근 제어 설정 조회 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

// 1-3. IP 접근 제어 설정 갱신 (관리자용 - 서버 재시작 불필요)
app.post('/api/admin/ip-access-control/reload', async (req, res) => {
  try {
    // .env 파일 다시 로드
    require('dotenv').config();
    
    // 메모리 캐시 업데이트
    ipAccessControlConfig.enabled = process.env.IP_ACCESS_CONTROL_ENABLED === 'true';
    ipAccessControlConfig.allowedIPs = process.env.ALLOWED_IPS?.split(',').map(ip => ip.trim()) || [];
    
    console.log('✅ IP 접근 제어 설정 갱신 완료');
    console.log(`   - 활성화: ${ipAccessControlConfig.enabled}`);
    console.log(`   - 허용 IP: ${ipAccessControlConfig.allowedIPs.join(', ')}`);
    
    res.json({
      success: true,
      message: 'IP 접근 제어 설정이 갱신되었습니다.',
      config: {
        enabled: ipAccessControlConfig.enabled,
        allowedIPs: ipAccessControlConfig.allowedIPs
      }
    });
  } catch (error) {
    console.error('IP 접근 제어 설정 갱신 실패:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// 2. 공급업체 목록 조회
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await models.Supplier.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. 예산 목록 조회
app.get('/api/budgets', async (req, res) => {
  try {
    const budgets = await models.Budget.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3-1. 사업예산 통계 데이터 조회 (JOIN 방식으로 실시간 계산)
app.get('/api/budget-statistics', async (req, res) => {
  try {
    // 모든 사업예산 데이터와 확정집행액, 미집행액, 예산초과액을 JOIN으로 실시간 계산
    const allBudgetData = await sequelize.query(`
      SELECT 
        bb.id,
        bb.project_name as "projectName",
        bb.initiator_department as "initiatorDepartment",
        bb.executor_department as "executorDepartment",
        bb.budget_category as "budgetCategory",
        bb.budget_amount as "budgetAmount",
        bb.executed_amount as "executedAmount",
        bb.pending_amount as "pendingAmount",
        COALESCE(SUM(CASE WHEN p.status = 'approved' THEN p.total_amount ELSE 0 END), 0) as "confirmedExecutionAmount",
        -- 예산초과액: 기집행액이 (예산 + 추가예산)보다 크면 초과분, 아니면 0
        CASE 
          WHEN COALESCE(bb.executed_amount, 0) > (bb.budget_amount + COALESCE(bb.additional_budget, 0))
          THEN COALESCE(bb.executed_amount, 0) - (bb.budget_amount + COALESCE(bb.additional_budget, 0))
          ELSE 0
        END as "budgetExcessAmount",
        -- 미집행액: 기집행액이 (예산 + 추가예산) 이하면 잔액, 아니면 0
        CASE 
          WHEN COALESCE(bb.executed_amount, 0) <= (bb.budget_amount + COALESCE(bb.additional_budget, 0))
          THEN (bb.budget_amount + COALESCE(bb.additional_budget, 0)) - COALESCE(bb.executed_amount, 0)
          ELSE 0
        END as "unexecutedAmountCalc",
        bb.additional_budget as "additionalBudget",
        bb.hold_cancel_reason as "holdCancelReason",
        bb.notes,
        bb.it_plan_reported as "itPlanReported",
        bb.start_date as "startDate",
        bb.end_date as "endDate",
        bb.is_essential as "isEssential",
        bb.project_purpose as "projectPurpose",
        pp.code as "projectPurposeCode",
        pp.description as "projectPurposeDescription",
        bb.budget_year as "budgetYear",
        bb.status,
        bb.created_by as "createdBy",
        bb.created_at as "createdAt",
        COUNT(CASE WHEN p.status = 'approved' THEN p.id ELSE NULL END) as "approvedProposalCount"
      FROM business_budgets bb
      LEFT JOIN project_purposes pp ON bb.project_purpose = pp.code AND bb.budget_year = pp.year
      LEFT JOIN proposals p ON p.budget_id = bb.id
      GROUP BY bb.id, pp.code, pp.description
      ORDER BY bb.created_at DESC
    `);

    const allBudgets = allBudgetData[0] || [];

    // 각 사업예산에 계산된 값 추가
    const budgetsWithExecution = allBudgets.map(budget => {
      const totalBudget = parseFloat(budget.budgetAmount || 0) + parseFloat(budget.additionalBudget || 0);
      return {
        ...budget,
        unexecutedAmount: budget.unexecutedAmountCalc || 0,  // 계산된 미집행액 적용 (0 이상)
        budgetExcessAmount: budget.budgetExcessAmount || 0,  // 예산초과액 (초과분만)
        remainingAmount: parseFloat(budget.budgetAmount || 0) - parseFloat(budget.confirmedExecutionAmount || 0),
        executionRate: totalBudget > 0 
          ? Math.round((parseFloat(budget.executedAmount || 0) / totalBudget) * 100) 
          : 0
      };
    });

    // 전체 통계 계산
    const totalBudgets = allBudgets.length;
    const totalBudgetAmount = allBudgets.reduce((sum, budget) => sum + parseFloat(budget.budgetAmount || 0), 0);
    const totalExecutedAmount = allBudgets.reduce((sum, budget) => sum + parseFloat(budget.confirmedExecutionAmount || 0), 0);
    const totalRemainingAmount = totalBudgetAmount - totalExecutedAmount;
    const totalApprovedProposals = allBudgets.reduce((sum, budget) => sum + parseInt(budget.approvedProposalCount || 0), 0);

    // 부서별 통계 (확정집행액 반영)
    const budgetByDepartment = {};
    budgetsWithExecution.forEach(budget => {
      const dept = budget.executorDepartment;
      if (!budgetByDepartment[dept]) {
        budgetByDepartment[dept] = { department: dept, totalAmount: 0, executedAmount: 0, count: 0 };
      }
      budgetByDepartment[dept].totalAmount += parseFloat(budget.budgetAmount || 0);
      budgetByDepartment[dept].executedAmount += parseFloat(budget.confirmedExecutionAmount || 0);
      budgetByDepartment[dept].count += 1;
    });

    // 년도별 통계 (확정집행액 반영)
    const budgetByYear = {};
    budgetsWithExecution.forEach(budget => {
      const year = budget.budgetYear;
      if (!budgetByYear[year]) {
        budgetByYear[year] = { year, totalAmount: 0, executedAmount: 0, count: 0 };
      }
      budgetByYear[year].totalAmount += parseFloat(budget.budgetAmount || 0);
      budgetByYear[year].executedAmount += parseFloat(budget.confirmedExecutionAmount || 0);
      budgetByYear[year].count += 1;
    });

    // 현재 연도 가져오기
    const currentYear = new Date().getFullYear();

    res.json({
      totalBudgets,
      totalBudgetAmount,
      executedBudgetAmount: totalExecutedAmount,
      remainingBudgetAmount: totalRemainingAmount,
      budgetByDepartment: Object.values(budgetByDepartment),
      budgetByYear: Object.values(budgetByYear),
      budgetData: budgetsWithExecution,
      currentYear,
      approvedProposalsCount: totalApprovedProposals,
      totalExecutedFromProposals: totalExecutedAmount
    });
  } catch (error) {
    console.error('사업예산 통계 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3-2. 사업예산 목록 조회
app.get('/api/business-budgets', async (req, res) => {
  try {
    const { year, status, department } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const replacements = [];
    
    if (year) {
      whereClause += ' AND bb.budget_year = ?';
      replacements.push(parseInt(year));
    }
    
    if (status) {
      whereClause += ' AND bb.status = ?';
      replacements.push(status);
    }
    
    if (department) {
      whereClause += ' AND (bb.initiator_department = ? OR bb.executor_department = ?)';
      replacements.push(department, department);
    }
    
    // 사업예산과 실제 품의서 집행금액, 미집행액, 예산초과액을 함께 조회
    const budgets = await sequelize.query(`
      SELECT 
        bb.*,
        COALESCE(SUM(bbd.total_amount), 0) as detail_total_amount,
        COUNT(bbd.id) as detail_count,
        COALESCE(proposal_executions.executed_amount, 0) as actual_executed_amount,
        COALESCE(proposal_executions.proposal_count, 0) as executed_proposal_count,
        -- 확정집행액을 실시간으로 계산 (승인된 품의서 합계)
        COALESCE(proposal_executions.executed_amount, 0) as confirmed_execution_amount,
        -- 예산초과액: 확정집행액이 (예산 + 추가예산)보다 크면 초과분, 아니면 0
        CASE 
          WHEN COALESCE(proposal_executions.executed_amount, 0) > (bb.budget_amount + COALESCE(bb.additional_budget, 0))
          THEN COALESCE(proposal_executions.executed_amount, 0) - (bb.budget_amount + COALESCE(bb.additional_budget, 0))
          ELSE 0
        END as budget_excess_amount_calculated,
        -- 미집행액: 확정집행액이 (예산 + 추가예산) 이하면 잔액, 아니면 0
        CASE 
          WHEN COALESCE(proposal_executions.executed_amount, 0) <= (bb.budget_amount + COALESCE(bb.additional_budget, 0))
          THEN (bb.budget_amount + COALESCE(bb.additional_budget, 0)) - COALESCE(proposal_executions.executed_amount, 0)
          ELSE 0
        END as unexecuted_amount_calculated
      FROM business_budgets bb
      LEFT JOIN business_budget_details bbd ON bb.id = bbd.budget_id
      LEFT JOIN (
        SELECT 
          p.budget_id as budget_id,
          SUM(p.total_amount) as executed_amount,
          COUNT(p.id) as proposal_count
        FROM proposals p
        WHERE p.status = 'approved' AND p.budget_id IS NOT NULL
        GROUP BY p.budget_id
      ) as proposal_executions ON bb.id = proposal_executions.budget_id
      ${whereClause}
      GROUP BY bb.id, proposal_executions.executed_amount, proposal_executions.proposal_count
      ORDER BY bb.created_at DESC
    `, { replacements });
    
    // 각 예산의 집행률과 잔여금액, 미집행액, 예산초과액 계산
    const budgetsWithCalculations = budgets[0].map(budget => {
      // bb.*에서 가져온 기존 unexecuted_amount를 제거하고 계산된 값 사용
      const { unexecuted_amount, ...budgetWithoutUnexecuted } = budget;
      
      // 사업예산의 확정집행액 사용
      const executedAmount = parseFloat(budget.confirmed_execution_amount || 0);
      
      const totalBudget = parseFloat(budget.budget_amount || 0) + parseFloat(budget.additional_budget || 0);
      
      return {
        ...budgetWithoutUnexecuted,
        executed_amount: executedAmount,
        confirmed_execution_amount: executedAmount,
        unexecuted_amount: budget.unexecuted_amount_calculated || 0,  // 계산된 값 사용 (0 이상)
        budget_excess_amount: budget.budget_excess_amount_calculated || 0,  // 예산초과액 (초과분만)
        remaining_amount: parseFloat(budget.budget_amount || 0) - executedAmount,
        execution_rate: totalBudget > 0 
          ? Math.round((executedAmount / totalBudget) * 100) 
          : 0
      };
    });
    
    res.json(budgetsWithCalculations);
  } catch (error) {
    console.error('사업예산 목록 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3-3. 사업예산 상세 조회
app.get('/api/business-budgets/:id', async (req, res) => {
  try {
    const budgetId = req.params.id;
    
    // 사업예산 기본 정보 + 확정집행액 실시간 계산
    const budget = await sequelize.query(`
      SELECT 
        bb.*,
        COALESCE(SUM(CASE WHEN p.status = 'approved' THEN p.total_amount ELSE 0 END), 0) as confirmed_execution_amount
      FROM business_budgets bb
      LEFT JOIN proposals p ON p.budget_id = bb.id
      WHERE bb.id = ?
      GROUP BY bb.id
    `, { replacements: [budgetId] });
    
    if (budget[0].length === 0) {
      return res.status(404).json({ error: '사업예산을 찾을 수 없습니다.' });
    }
    
    const budgetData = budget[0][0];
    
    // 확정집행액을 executed_amount로도 사용
    budgetData.executed_amount = budgetData.confirmed_execution_amount || 0;
    
    // 상세 내역
    const details = await sequelize.query(`
      SELECT * FROM business_budget_details WHERE budget_id = ? ORDER BY id
    `, { replacements: [budgetId] });
    
    // 승인 이력
    const approvals = await sequelize.query(`
      SELECT * FROM business_budget_approvals WHERE budget_id = ? ORDER BY approved_at
    `, { replacements: [budgetId] });
    
    res.json({
      budget: budgetData,
      details: details[0],
      approvals: approvals[0]
    });
  } catch (error) {
    console.error('사업예산 상세 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3-4. 사업예산 생성
app.post('/api/business-budgets', async (req, res) => {
  try {
    const budgetData = req.body;
    
    // 사업예산 생성
    const budgetResult = await sequelize.query(`
      INSERT INTO business_budgets (
        project_name, initiator_department, executor_department,
        budget_type, budget_category, budget_amount, executed_amount, confirmed_execution_amount,
        start_date, end_date, is_essential, project_purpose, budget_year, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `, {
      replacements: [
        budgetData.projectName,
        budgetData.initiatorDepartment,
        budgetData.executorDepartment,
        budgetData.budgetType,
        budgetData.budgetCategory,
        budgetData.budgetAmount,
        budgetData.executedAmount || 0,
        budgetData.confirmedExecutionAmount || 0,
        budgetData.startDate,
        budgetData.endDate,
        budgetData.isEssential,
        budgetData.projectPurpose,
        budgetData.budgetYear,
        budgetData.status || '대기',
        budgetData.createdBy || '작성자'
      ]
    });
    
    const budgetId = budgetResult[0][0].id;
    
    // 상세 내역 생성
    if (budgetData.details && budgetData.details.length > 0) {
      for (const detail of budgetData.details) {
        await sequelize.query(`
          INSERT INTO business_budget_details (
            budget_id, item_name, item_description, unit_price, quantity, total_amount
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, {
          replacements: [
            budgetId,
            detail.itemName,
            detail.itemDescription,
            detail.unitPrice,
            detail.quantity,
            detail.totalAmount
          ]
        });
      }
    }
    
    // 변경이력 저장 (신규 등록)
    await saveBusinessBudgetHistory(
      budgetId, 
      'CREATE', 
      null, 
      null, 
      '사업예산 신규 등록', 
      budgetData.createdBy || 'system'
    );
    
    res.status(201).json({
      message: '사업예산이 성공적으로 생성되었습니다.',
      budgetId: budgetId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3-5. 사업예산 수정 (번호, 등록일, 등록자 제외한 모든 항목 수정 가능 - 사업연도 수정 가능)
app.put('/api/business-budgets/:id', async (req, res) => {
  try {
    const budgetId = req.params.id;
    const budgetData = req.body;
    
    // 기존 데이터 조회 (변경이력 기록용)
    const [oldData] = await sequelize.query(`
      SELECT * FROM business_budgets WHERE id = ?
    `, { replacements: [budgetId], type: Sequelize.QueryTypes.SELECT });
    
    if (!oldData) {
      return res.status(404).json({ error: '사업예산을 찾을 수 없습니다.' });
    }
    
    // 변경된 필드 감지 및 이력 저장
    const fieldMapping = {
      projectName: 'project_name',
      initiatorDepartment: 'initiator_department',
      executorDepartment: 'executor_department',
      budgetYear: 'budget_year',
      budgetCategory: 'budget_category',
      budgetAmount: 'budget_amount',
      startDate: 'start_date',
      endDate: 'end_date',
      isEssential: 'is_essential',
      projectPurpose: 'project_purpose',
      status: 'status',
      executedAmount: 'executed_amount',
      pendingAmount: 'pending_amount',
      confirmedExecutionAmount: 'confirmed_execution_amount',
      unexecutedAmount: 'unexecuted_amount',
      additionalBudget: 'additional_budget',
      holdCancelReason: 'hold_cancel_reason',
      notes: 'notes',
      itPlanReported: 'it_plan_reported'
    };
    
    // 사업예산 수정 (id, created_at, created_by 제외 - budget_year 수정 가능)
    await sequelize.query(`
      UPDATE business_budgets SET
        project_name = ?,
        initiator_department = ?,
        executor_department = ?,
        budget_year = ?,
        budget_category = ?,
        budget_amount = ?,
        start_date = ?,
        end_date = ?,
        is_essential = ?,
        project_purpose = ?,
        status = ?,
        executed_amount = ?,
        pending_amount = ?,
        confirmed_execution_amount = ?,
        unexecuted_amount = ?,
        additional_budget = ?,
        hold_cancel_reason = ?,
        notes = ?,
        it_plan_reported = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, {
      replacements: [
        budgetData.projectName,
        budgetData.initiatorDepartment,
        budgetData.executorDepartment,
        budgetData.budgetYear,
        budgetData.budgetCategory,
        budgetData.budgetAmount,
        budgetData.startDate,
        budgetData.endDate,
        budgetData.isEssential,
        budgetData.projectPurpose,
        budgetData.status || '대기',
        budgetData.executedAmount || 0,
        budgetData.pendingAmount || 0,
        budgetData.confirmedExecutionAmount || 0,
        budgetData.unexecutedAmount || 0,
        budgetData.additionalBudget || 0,
        budgetData.holdCancelReason || null,
        budgetData.notes || null,
        budgetData.itPlanReported !== undefined ? budgetData.itPlanReported : false,
        budgetId
      ]
    });
    
    // 변경된 필드 이력 저장
    for (const [frontKey, dbKey] of Object.entries(fieldMapping)) {
      const oldValue = oldData[dbKey];
      const newValue = budgetData[frontKey] !== undefined ? budgetData[frontKey] : (
        dbKey === 'status' ? '대기' :
        ['executed_amount', 'pending_amount', 'confirmed_execution_amount', 'unexecuted_amount', 'additional_budget'].includes(dbKey) ? 0 :
        dbKey === 'it_plan_reported' ? false :
        null
      );
      
      // 값 정규화 함수 (null, undefined, "" 를 같은 것으로 취급)
      const normalizeValue = (value) => {
        if (value === null || value === undefined || value === '') {
          return null;
        }
        // boolean 값 처리
        if (typeof value === 'boolean') {
          return value;
        }
        // 숫자 값 처리 (문자열 숫자도 숫자로 변환)
        if (typeof value === 'number' || !isNaN(Number(value))) {
          return Number(value);
        }
        return String(value);
      };
      
      const normalizedOldValue = normalizeValue(oldValue);
      const normalizedNewValue = normalizeValue(newValue);
      
      // 값이 실제로 변경된 경우에만 이력 저장
      if (normalizedOldValue !== normalizedNewValue) {
        await saveBusinessBudgetHistory(
          budgetId,
          'UPDATE',
          frontKey,
          oldValue,
          newValue,
          budgetData.changedBy || 'system'
        );
      }
    }
    
    // 기존 상세 내역 삭제
    await sequelize.query(`
      DELETE FROM business_budget_details WHERE budget_id = ?
    `, { replacements: [budgetId] });
    
    // 새로운 상세 내역 생성
    if (budgetData.details && budgetData.details.length > 0) {
      for (const detail of budgetData.details) {
        await sequelize.query(`
          INSERT INTO business_budget_details (
            budget_id, item_name, item_description, unit_price, quantity, total_amount
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, {
          replacements: [
            budgetId,
            detail.itemName,
            detail.itemDescription,
            detail.unitPrice,
            detail.quantity,
            detail.totalAmount
          ]
        });
      }
    }
    
    res.json({ message: '사업예산이 성공적으로 수정되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3-6. 사업예산 삭제
app.delete('/api/business-budgets/:id', async (req, res) => {
  try {
    const budgetId = req.params.id;
    const { deletedBy } = req.query; // 삭제자 정보 받기
    
    // 변경이력 저장을 위해 삭제 전에 예산 정보 조회
    const [budgetInfo] = await sequelize.query(`
      SELECT project_name, budget_year FROM business_budgets WHERE id = ?
    `, { 
      replacements: [budgetId],
      type: Sequelize.QueryTypes.SELECT 
    });
    
    // 사업예산 삭제 (CASCADE로 상세내역과 승인이력도 함께 삭제됨)
    await sequelize.query(`
      DELETE FROM business_budgets WHERE id = ?
    `, { replacements: [budgetId] });
    
    // 변경이력 저장 (삭제)
    if (budgetInfo) {
      await saveBusinessBudgetHistory(
        budgetId,
        'DELETE',
        null,
        null,
        '사업예산 삭제',
        deletedBy || 'system'
      );
    }
    
    res.json({ message: '사업예산이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3-7. 사업예산 승인
app.post('/api/business-budgets/:id/approve', async (req, res) => {
  try {
    const budgetId = req.params.id;
    const { approverName, approverTitle, approvalStatus, approvalComment } = req.body;
    
    // 승인 이력 추가
    await sequelize.query(`
      INSERT INTO business_budget_approvals (
        budget_id, approver_name, approver_title, approval_status, approval_comment
      ) VALUES (?, ?, ?, ?, ?)
    `, {
      replacements: [budgetId, approverName, approverTitle, approvalStatus, approvalComment]
    });
    
    // 사업예산 상태 업데이트
    await sequelize.query(`
      UPDATE business_budgets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, { replacements: [approvalStatus === '승인' ? '진행중' : '반려', budgetId] });
    
    res.json({ message: '승인이 처리되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 전산운용비 예산 관리 API ====================

// 전산운용비 예산 목록 조회
app.get('/api/operating-budgets', async (req, res) => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        ob.id,
        ob.fiscal_year,
        ob.account_subject,
        ob.budget_amount,
        COALESCE(proposal_executions.executed_amount, 0) as executed_amount,
        COALESCE(proposal_executions.proposal_count, 0) as executed_proposal_count,
        ob.created_at,
        ob.updated_at
      FROM operating_budgets ob
      LEFT JOIN (
        SELECT 
          p.operating_budget_id as budget_id,
          SUM(p.total_amount) as executed_amount,
          COUNT(p.id) as proposal_count
        FROM proposals p
        WHERE p.status = 'approved' AND p.operating_budget_id IS NOT NULL
        GROUP BY p.operating_budget_id
      ) as proposal_executions ON ob.id = proposal_executions.budget_id
      GROUP BY ob.id, ob.fiscal_year, ob.account_subject, ob.budget_amount, ob.created_at, ob.updated_at, proposal_executions.executed_amount, proposal_executions.proposal_count
      ORDER BY ob.fiscal_year DESC, ob.created_at DESC
    `);
    
    res.json(results);
  } catch (error) {
    console.error('전산운용비 예산 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 전산운용비 예산 등록
app.post('/api/operating-budgets', async (req, res) => {
  try {
    const { accountSubject, budgetAmount, fiscalYear } = req.body;

    if (!accountSubject || !budgetAmount || !fiscalYear) {
      return res.status(400).json({ error: '필수 필드를 입력해주세요.' });
    }

    const [result] = await sequelize.query(`
      INSERT INTO operating_budgets (
        fiscal_year, account_subject, budget_amount, created_at, updated_at
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, {
      replacements: [fiscalYear, accountSubject, budgetAmount]
    });

    res.json({ 
      message: '등록되었습니다.',
      id: result
    });
  } catch (error) {
    console.error('전산운용비 예산 등록 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 전산운용비 예산 수정
app.put('/api/operating-budgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { accountSubject, budgetAmount, fiscalYear } = req.body;

    if (!accountSubject || !budgetAmount || !fiscalYear) {
      return res.status(400).json({ error: '필수 필드를 입력해주세요.' });
    }

    await sequelize.query(`
      UPDATE operating_budgets 
      SET 
        fiscal_year = ?,
        account_subject = ?,
        budget_amount = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, {
      replacements: [fiscalYear, accountSubject, budgetAmount, id]
    });

    res.json({ message: '수정되었습니다.' });
  } catch (error) {
    console.error('전산운용비 예산 수정 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 전산운용비 예산 삭제
app.delete('/api/operating-budgets/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 해당 예산에 연결된 집행내역이 있는지 확인
    const [executions] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM operating_budget_executions 
      WHERE budget_id = ?
    `, {
      replacements: [id]
    });

    const executionCount = executions[0].count || 0;
    
    if (executionCount > 0) {
      // 집행내역이 있으면 삭제 불가
      return res.status(400).json({ 
        error: '집행내역이 존재하여 삭제할 수 없습니다.',
        message: `해당 계정과목에 ${executionCount}건의 집행내역이 있습니다. 먼저 집행내역을 삭제해주세요.`
      });
    }

    // 집행내역이 없으면 삭제 진행
    await sequelize.query(`
      DELETE FROM operating_budgets WHERE id = ?
    `, {
      replacements: [id]
    });

    res.json({ message: '삭제되었습니다.' });
  } catch (error) {
    console.error('전산운용비 예산 삭제 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 전산운용비 집행 내역 조회
app.get('/api/operating-budget-executions', async (req, res) => {
  try {
    const { budgetId, fiscalYear } = req.query;
    
    let query = `
      SELECT 
        e.*,
        b.fiscal_year,
        b.account_subject as budget_account_subject
      FROM operating_budget_executions e
      LEFT JOIN operating_budgets b ON e.budget_id = b.id
      WHERE 1=1
    `;
    const replacements = [];
    
    if (budgetId) {
      query += ` AND e.budget_id = ?`;
      replacements.push(budgetId);
    }
    
    if (fiscalYear) {
      query += ` AND b.fiscal_year = ?`;
      replacements.push(fiscalYear);
    }
    
    query += ` ORDER BY e.created_at DESC`;
    
    const [results] = await sequelize.query(query, { replacements });
    res.json(results);
  } catch (error) {
    console.error('전산운용비 집행 내역 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 전산운용비 집행 내역 등록
app.post('/api/operating-budget-executions', async (req, res) => {
  try {
    const { 
      budgetId, accountSubject, sapDescription, 
      contract, proposalName, confirmedExecutionAmount, executionAmount,
      billingPeriod, costAttribution, fiscalYear
    } = req.body;

    if (!budgetId || !accountSubject) {
      return res.status(400).json({ error: '필수 필드를 입력해주세요.' });
    }

    // 해당 연도 및 계정과목의 최대 번호 조회
    const [maxNumber] = await sequelize.query(`
      SELECT COALESCE(MAX(CAST(e.execution_number AS INTEGER)), 0) as max_num
      FROM operating_budget_executions e
      JOIN operating_budgets b ON e.budget_id = b.id
      WHERE b.fiscal_year = ? AND e.account_subject = ?
      AND e.execution_number ~ '^[0-9]+$'
    `, {
      replacements: [fiscalYear, accountSubject]
    });

    const nextNumber = (maxNumber[0]?.max_num || 0) + 1;
    const executionNumber = nextNumber.toString();

    const [result] = await sequelize.query(`
      INSERT INTO operating_budget_executions (
        budget_id, account_subject, execution_number, sap_description,
        contract, proposal_name, confirmed_execution_amount, execution_amount,
        billing_period, cost_attribution, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, {
      replacements: [
        budgetId, accountSubject, executionNumber, sapDescription || null,
        contract || null, proposalName || null, 
        confirmedExecutionAmount || 0, executionAmount || 0,
        billingPeriod || null, costAttribution || null
      ]
    });

    res.json({ 
      message: '등록되었습니다.',
      id: result,
      executionNumber: executionNumber
    });
  } catch (error) {
    console.error('전산운용비 집행 내역 등록 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 전산운용비 집행 내역 수정
app.put('/api/operating-budget-executions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      budgetId, accountSubject, sapDescription, 
      contract, proposalName, confirmedExecutionAmount, executionAmount,
      billingPeriod, costAttribution 
    } = req.body;

    if (!budgetId || !accountSubject) {
      return res.status(400).json({ error: '필수 필드를 입력해주세요.' });
    }

    // 수정 시에는 기존 번호 유지
    await sequelize.query(`
      UPDATE operating_budget_executions 
      SET 
        budget_id = ?,
        account_subject = ?,
        sap_description = ?,
        contract = ?,
        proposal_name = ?,
        confirmed_execution_amount = ?,
        execution_amount = ?,
        billing_period = ?,
        cost_attribution = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, {
      replacements: [
        budgetId, accountSubject, sapDescription || null,
        contract || null, proposalName || null, 
        confirmedExecutionAmount || 0, executionAmount || 0,
        billingPeriod || null, costAttribution || null, id
      ]
    });

    res.json({ message: '수정되었습니다.' });
  } catch (error) {
    console.error('전산운용비 집행 내역 수정 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 전산운용비 집행 내역 삭제
app.delete('/api/operating-budget-executions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await sequelize.query(`
      DELETE FROM operating_budget_executions WHERE id = ?
    `, {
      replacements: [id]
    });

    res.json({ message: '삭제되었습니다.' });
  } catch (error) {
    console.error('전산운용비 집행 내역 삭제 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 전산운용비 집행 내역 엑셀 다운로드
app.get('/api/operating-budget-executions/export/excel', async (req, res) => {
  try {
    const { fiscalYear } = req.query;
    
    // 집행 내역 조회
    let query = `
      SELECT 
        e.id,
        b.fiscal_year as "회계연도",
        e.account_subject as "계정과목",
        e.execution_number as "번호",
        e.sap_description as "SAP적요",
        e.contract as "계약",
        e.proposal_name as "품의서명",
        e.confirmed_execution_amount as "확정집행액",
        e.execution_amount as "집행액",
        e.billing_period as "청구시기",
        e.cost_attribution as "비용귀속",
        TO_CHAR(e.created_at, 'YYYY-MM-DD HH24:MI:SS') as "등록일"
      FROM operating_budget_executions e
      LEFT JOIN operating_budgets b ON e.budget_id = b.id
      WHERE 1=1
    `;
    const replacements = [];
    
    if (fiscalYear) {
      query += ` AND b.fiscal_year = ?`;
      replacements.push(fiscalYear);
    }
    
    query += ` ORDER BY b.fiscal_year DESC, e.account_subject, e.created_at DESC`;
    
    const [results] = await sequelize.query(query, { replacements });
    
    if (results.length === 0) {
      return res.status(404).json({ error: '다운로드할 데이터가 없습니다.' });
    }
    
    // 엑셀 데이터 생성
    const worksheet = XLSX.utils.json_to_sheet(results);
    
    // 컬럼 너비 설정
    worksheet['!cols'] = [
      { wch: 8 },   // ID
      { wch: 12 },  // 회계연도
      { wch: 20 },  // 계정과목
      { wch: 8 },   // 번호
      { wch: 30 },  // SAP적요
      { wch: 25 },  // 계약
      { wch: 40 },  // 품의서명
      { wch: 15 },  // 확정집행액
      { wch: 15 },  // 집행액
      { wch: 15 },  // 청구시기
      { wch: 12 },  // 비용귀속
      { wch: 20 }   // 등록일
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '전산운용비 집행내역');
    
    // 엑셀 파일 생성
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // 파일명 생성
    const fileName = fiscalYear 
      ? `전산운용비_집행내역_${fiscalYear}년_${new Date().toISOString().slice(0, 10)}.xlsx`
      : `전산운용비_집행내역_전체_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    // 응답 헤더 설정
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('전산운용비 집행 내역 엑셀 다운로드 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

  // 4. 계약방식 목록 조회
  app.get('/api/contract-methods', async (req, res) => {
    try {
      const contractMethods = await sequelize.query(`
        SELECT * FROM contract_methods 
        WHERE is_active = true 
        ORDER BY id
      `);
      res.json(contractMethods[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. 결재자 목록 조회
  app.get('/api/approval-approvers', async (req, res) => {
    try {
      const approvers = await sequelize.query(`
        SELECT 
          aa.*,
          array_agg(ac.condition_label) as conditions
        FROM approval_approvers aa
        LEFT JOIN approval_conditions ac ON aa.id = ac.approver_id
        WHERE aa.is_active = true
        GROUP BY aa.id
        ORDER BY aa.id
      `);
      res.json(approvers[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 6. 결재라인 규칙 조회
  app.get('/api/approval-rules', async (req, res) => {
    try {
      const rules = await sequelize.query(`
        SELECT * FROM approval_rules 
        WHERE is_active = true 
        ORDER BY rule_type, id
      `);
      res.json(rules[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 7. 결재라인 참고자료 조회
  app.get('/api/approval-references', async (req, res) => {
    try {
      const references = await sequelize.query(`
        SELECT * FROM approval_references 
        WHERE is_active = true 
        ORDER BY min_amount
      `);
      res.json(references[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // === 결재자 CRUD ===
  // 결재자 추가
  app.post('/api/approval-approvers', async (req, res) => {
    try {
      const { name, title, department, description, conditions, basis } = req.body;
      
      const result = await sequelize.query(`
        INSERT INTO approval_approvers (name, title, department, description, basis, is_active)
        VALUES (?, ?, ?, ?, ?, true)
        RETURNING id
      `, {
        replacements: [name, title, department, description, basis]
      });
      
      const approverId = result[0][0].id;
      
      // 조건 추가
      if (conditions && conditions.length > 0) {
        for (const condition of conditions) {
          if (condition.trim()) {
            await sequelize.query(`
              INSERT INTO approval_conditions (approver_id, condition_label)
              VALUES (?, ?)
            `, {
              replacements: [approverId, condition.trim()]
            });
          }
        }
      }
      
      res.json({ success: true, id: approverId });
    } catch (error) {
      console.error('결재자 추가 실패:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 결재자 수정
  app.put('/api/approval-approvers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, title, department, description, conditions, basis } = req.body;
      
      await sequelize.query(`
        UPDATE approval_approvers 
        SET name = ?, title = ?, department = ?, description = ?, basis = ?
        WHERE id = ?
      `, {
        replacements: [name, title, department, description, basis, id]
      });
      
      // 기존 조건 삭제 후 재추가
      await sequelize.query(`
        DELETE FROM approval_conditions WHERE approver_id = ?
      `, {
        replacements: [id]
      });
      
      if (conditions && conditions.length > 0) {
        for (const condition of conditions) {
          if (condition.trim()) {
            await sequelize.query(`
              INSERT INTO approval_conditions (approver_id, condition_label)
              VALUES (?, ?)
            `, {
              replacements: [id, condition.trim()]
            });
          }
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('결재자 수정 실패:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 결재자 삭제 (소프트 삭제)
  app.delete('/api/approval-approvers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      await sequelize.query(`
        UPDATE approval_approvers 
        SET is_active = false 
        WHERE id = ?
      `, {
        replacements: [id]
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('결재자 삭제 실패:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // === 결재라인 규칙 CRUD ===
  // 규칙 추가
  app.post('/api/approval-rules', async (req, res) => {
    try {
      const { rule_name, rule_content, basis } = req.body;
      
      const result = await sequelize.query(`
        INSERT INTO approval_rules (rule_type, rule_name, rule_content, basis, is_active)
        VALUES ('custom', ?, ?, ?, true)
        RETURNING id
      `, {
        replacements: [rule_name, rule_content, basis]
      });
      
      res.json({ success: true, id: result[0][0].id });
    } catch (error) {
      console.error('규칙 추가 실패:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 규칙 수정
  app.put('/api/approval-rules/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { rule_name, rule_content, basis } = req.body;
      
      await sequelize.query(`
        UPDATE approval_rules 
        SET rule_name = ?, rule_content = ?, basis = ?
        WHERE id = ?
      `, {
        replacements: [rule_name, rule_content, basis, id]
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('규칙 수정 실패:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 규칙 삭제 (소프트 삭제)
  app.delete('/api/approval-rules/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      await sequelize.query(`
        UPDATE approval_rules 
        SET is_active = false 
        WHERE id = ?
      `, {
        replacements: [id]
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('규칙 삭제 실패:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // === 결재라인 참고자료 CRUD ===
  // 참고자료 추가
  app.post('/api/approval-references', async (req, res) => {
    try {
      const { amount_range, included_approvers, final_approver } = req.body;
      
      const result = await sequelize.query(`
        INSERT INTO approval_references (amount_range, included_approvers, final_approver, is_active)
        VALUES (?, ?, ?, true)
        RETURNING id
      `, {
        replacements: [amount_range, included_approvers, final_approver]
      });
      
      res.json({ success: true, id: result[0][0].id });
    } catch (error) {
      console.error('참고자료 추가 실패:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 참고자료 수정
  app.put('/api/approval-references/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { amount_range, included_approvers, final_approver } = req.body;
      
      await sequelize.query(`
        UPDATE approval_references 
        SET amount_range = ?, included_approvers = ?, final_approver = ?
        WHERE id = ?
      `, {
        replacements: [amount_range, included_approvers, final_approver, id]
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('참고자료 수정 실패:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 참고자료 삭제 (소프트 삭제)
  app.delete('/api/approval-references/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      await sequelize.query(`
        UPDATE approval_references 
        SET is_active = false 
        WHERE id = ?
      `, {
        replacements: [id]
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('참고자료 삭제 실패:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 8. 기존 구매 내역 조회 (추천용) - 품의서 작성완료된 정보만 (테스트 데이터 제외)
  app.get('/api/purchase-history', async (req, res) => {
    try {
      const { search, field, category } = req.query;
      let whereClause = 'WHERE p.status = \'approved\' AND p.created_by != \'테스트사용자\'';
      const replacements = [];
      
      // 구분(카테고리) 필터 추가
      if (category && category.trim()) {
        whereClause += ' AND pi.item = ?';
        replacements.push(category.trim());
        console.log('구분 필터 적용:', category.trim());
      }
      
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        
        if (field === 'item') {
          whereClause += ' AND pi.item ILIKE ?';
          replacements.push(searchTerm);
        } else if (field === 'productName') {
          whereClause += ' AND pi.product_name ILIKE ?';
          replacements.push(searchTerm);
        } else if (field === 'supplier') {
          whereClause += ' AND pi.supplier ILIKE ?';
          replacements.push(searchTerm);
        } else {
          // 전체 검색
          whereClause += ' AND (pi.item ILIKE ? OR pi.product_name ILIKE ? OR pi.supplier ILIKE ?)';
          replacements.push(searchTerm, searchTerm, searchTerm);
        }
      }
      
      const history = await sequelize.query(`
        SELECT 
          pi.item,
          pi.product_name,
          pi.supplier,
          COUNT(*) as frequency,
          AVG(pi.unit_price) as avg_unit_price,
          MAX(p.approval_date) as last_purchase_date,
          p.contract_type,
          p.total_amount as proposal_total_amount
        FROM purchase_items pi
        INNER JOIN proposals p ON pi.proposal_id = p.id
        ${whereClause}
        GROUP BY pi.item, pi.product_name, pi.supplier, p.contract_type, p.total_amount
        ORDER BY frequency DESC, last_purchase_date DESC
        LIMIT 15
      `, { replacements });
      
      res.json(history[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// 4. 품의서 생성
app.post('/api/proposals', async (req, res) => {
  try {
    const proposalData = req.body;
    
    // 필수 필드 검증 및 기본값 설정 (강화)
    console.log('\n🔥🔥🔥 === 서버 수신 데이터 (상세) === 🔥🔥🔥');
    console.log('전체 req.body:', JSON.stringify(proposalData, null, 2));
    console.log('contractType 값:', proposalData.contractType, '타입:', typeof proposalData.contractType);
    console.log('createdBy 값:', proposalData.createdBy, '타입:', typeof proposalData.createdBy);
    console.log('purpose 값:', proposalData.purpose, '타입:', typeof proposalData.purpose);
    console.log('budget 값:', proposalData.budget, '타입:', typeof proposalData.budget);
    console.log('accountSubject 값:', proposalData.accountSubject, '타입:', typeof proposalData.accountSubject);
    console.log('basis 값:', proposalData.basis, '타입:', typeof proposalData.basis);
    
    // contractType 검증 및 설정 (사용자 선택값 검증)
    if (!proposalData.contractType || proposalData.contractType === '' || proposalData.contractType === null || proposalData.contractType === undefined) {
      console.log('❌ contractType이 없음 - 사용자가 계약 유형을 선택해야 함');
      return res.status(400).json({ 
        error: '계약 유형을 선택해주세요. (구매계약, 용역계약, 변경계약, 연장계약, 자유양식 중 선택)' 
      });
    }
    
    // 유효한 계약 유형인지 검증
    const validContractTypes = ['purchase', 'service', 'change', 'extension', 'freeform'];
    if (!validContractTypes.includes(proposalData.contractType)) {
      console.log('❌ 유효하지 않은 계약 유형:', proposalData.contractType);
      return res.status(400).json({ 
        error: `유효하지 않은 계약 유형입니다: ${proposalData.contractType}. 허용된 값: ${validContractTypes.join(', ')}` 
      });
    }
    
    console.log('✅ 계약 유형 검증 통과:', {
      value: proposalData.contractType,
      description: {
        'purchase': '구매계약',
        'service': '용역계약',
        'change': '변경계약',
        'extension': '연장계약',
        'freeform': '자유양식'
      }[proposalData.contractType]
    });
    
    // createdBy 검증 및 설정 (사용자 정보 검증)
    if (!proposalData.createdBy || proposalData.createdBy === '' || proposalData.createdBy === null || proposalData.createdBy === undefined) {
      console.log('❌ createdBy가 없음 - 사용자 정보가 필요함');
      return res.status(400).json({ 
        error: '작성자 정보가 누락되었습니다. 로그인 상태를 확인해주세요.' 
      });
    }
    
    console.log('✅ 작성자 정보 검증 통과:', proposalData.createdBy);
    
    // purpose 검증 및 설정 (더 강력한 검증)
    if (!proposalData.purpose || proposalData.purpose === '' || proposalData.purpose === null || proposalData.purpose === undefined) {
      console.log('⚠️ purpose가 없음, 기본값 "품의서" 설정');
      proposalData.purpose = '품의서';
    }
    
    // 예산 검증 및 처리 (budgetId 또는 operatingBudgetId)
    console.log('🔍 받은 데이터 - budgetId:', proposalData.budgetId, 'operatingBudgetId:', proposalData.operatingBudgetId);
    console.log('🔍 selectedBudgetType:', proposalData.selectedBudgetType);
    
    let finalBudgetId = null;
    let finalOperatingBudgetId = null;
    
    // 프론트엔드에서 이미 구분해서 보냈는지 확인
    if (proposalData.budgetId || proposalData.operatingBudgetId) {
      // 프론트엔드에서 구분해서 보낸 경우
      finalBudgetId = proposalData.budgetId ? parseInt(proposalData.budgetId) : null;
      finalOperatingBudgetId = proposalData.operatingBudgetId ? parseInt(proposalData.operatingBudgetId) : null;
      console.log('✅ 프론트엔드에서 구분해서 받음 - budgetId:', finalBudgetId, 'operatingBudgetId:', finalOperatingBudgetId);
    } else if (proposalData.budget) {
      // 기존 방식 (budget 필드 사용) - 하위 호환성
      const budgetId = parseInt(proposalData.budget);
      if (isNaN(budgetId)) {
        console.log('❌ budget이 유효하지 않은 숫자:', proposalData.budget);
        return res.status(400).json({ 
          error: '유효하지 않은 사업예산입니다. 다시 선택해주세요.' 
        });
      }
      
      if (proposalData.selectedBudgetType === 'operating') {
        console.log('⚠️ 전산운용비 예산 선택 - operating_budget_id에 저장');
        finalBudgetId = null;
        finalOperatingBudgetId = budgetId;
      } else {
        console.log('✅ 자본예산 선택 - budget_id에 저장');
        finalBudgetId = budgetId;
        finalOperatingBudgetId = null;
      }
    } else {
      console.log('❌ 예산 정보 없음');
      return res.status(400).json({ 
        error: '사업예산을 선택해주세요.' 
      });
    }
    
    // 최종 값 설정 (명확하게)
    proposalData.budget = finalBudgetId;
    proposalData.operatingBudgetId = finalOperatingBudgetId;
    
    console.log('✅ 최종 설정 - budget:', proposalData.budget, 'operatingBudgetId:', proposalData.operatingBudgetId);
    
    // accountSubject 검증 (필수 필드)
    if (!proposalData.accountSubject || proposalData.accountSubject === '' || proposalData.accountSubject === null || proposalData.accountSubject === undefined) {
      console.log('❌ accountSubject가 없음 - 계정과목을 입력해야 함');
      return res.status(400).json({ 
        error: '계정과목을 입력해주세요.' 
      });
    }
    
    // basis 검증 (필수 필드)
    if (!proposalData.basis || proposalData.basis === '' || proposalData.basis === null || proposalData.basis === undefined) {
      console.log('❌ basis가 없음 - 근거를 입력해야 함');
      return res.status(400).json({ 
        error: '근거를 입력해주세요.' 
      });
    }
    
    console.log('=== 최종 설정된 데이터 ===');
    console.log('contractType:', proposalData.contractType);
    console.log('createdBy:', proposalData.createdBy);
    console.log('purpose:', proposalData.purpose);
    
    // 최종 검증
    if (!proposalData.contractType || !proposalData.createdBy || !proposalData.purpose) {
      throw new Error(`필수 필드 설정 실패: contractType=${proposalData.contractType}, createdBy=${proposalData.createdBy}, purpose=${proposalData.purpose}`);
    }
    
    // 품의서 생성 전 최종 확인
    console.log('=== 품의서 생성 시작 ===');
    console.log('생성할 데이터:', {
      contractType: proposalData.contractType,
      purpose: proposalData.purpose,
      createdBy: proposalData.createdBy,
      budgetId: proposalData.budget,
      totalAmount: proposalData.totalAmount,
      isDraft: proposalData.isDraft,
      status: proposalData.status
    });
    
    // enum 필드 처리 (빈 문자열을 null로 변환) - 일반 품의서용
    const processedPaymentMethodGeneral = proposalData.paymentMethod && proposalData.paymentMethod.trim() !== '' 
      ? proposalData.paymentMethod 
      : null;

    const processedContractMethodGeneral = proposalData.contractMethod && proposalData.contractMethod.trim() !== '' 
      ? proposalData.contractMethod 
      : null;

    console.log('🔧 일반 품의서 enum 필드 처리:', {
      originalPaymentMethod: proposalData.paymentMethod,
      processedPaymentMethodGeneral,
      originalContractMethod: proposalData.contractMethod,
      processedContractMethodGeneral
    });

    // 품의서 생성 (모든 필수 필드가 검증된 상태)
    console.log('🔥 Sequelize create 직전 데이터:');
    console.log('🔍 최종 budget 값:', proposalData.budget);
    console.log('🔍 최종 operatingBudgetId 값:', proposalData.operatingBudgetId);
    
    const createData = {
      contractType: proposalData.contractType, // camelCase 사용 (Sequelize가 자동 변환)
      title: proposalData.title || '',
      purpose: proposalData.purpose,
      basis: proposalData.basis,
      budgetId: proposalData.budget, // camelCase 사용 (자본예산)
      operatingBudgetId: proposalData.operatingBudgetId || null, // 전산운용비 예산
      contractMethod: processedContractMethodGeneral,
      accountSubject: proposalData.accountSubject, // camelCase 사용
      totalAmount: proposalData.totalAmount || 0,
      changeReason: proposalData.changeReason || '',
      extensionReason: proposalData.extensionReason || '',
      contractPeriod: proposalData.contractPeriod || '',
      contractStartDate: proposalData.contractStartDate || null,
      contractEndDate: proposalData.contractEndDate || null,
      paymentMethod: processedPaymentMethodGeneral,
      wysiwygContent: proposalData.wysiwygContent || '', // 자유양식 문서 내용 추가
      status: proposalData.isDraft ? 'draft' : 'submitted', // 요청된 상태에 따라 설정
      createdBy: proposalData.createdBy, // camelCase 사용
      isDraft: proposalData.isDraft !== undefined ? proposalData.isDraft : true // 요청된 값 또는 기본값
    };
    console.log('createData:', JSON.stringify(createData, null, 2));
    
    const proposal = await models.Proposal.create(createData);
    
    console.log('✅ 품의서 생성 성공:', {
      id: proposal.id,
      contractType: proposal.contractType,
      createdBy: proposal.createdBy,
      purpose: proposal.purpose
    });

    // 구매품목 생성 (임시저장)
    if (proposalData.purchaseItems && proposalData.purchaseItems.length > 0) {
      const purchaseItems = proposalData.purchaseItems.map(item => ({
        proposalId: proposal.id,
        item: item.item || '',
        productName: item.productName || '',
        quantity: item.quantity && item.quantity !== '' ? parseInt(item.quantity) || 0 : 0,
        unitPrice: item.unitPrice && item.unitPrice !== '' ? parseInt(item.unitPrice) || 0 : 0,
        amount: item.amount && item.amount !== '' ? parseInt(item.amount) || 0 : 0,
        supplier: item.supplier || '',
        contractPeriodType: item.contractPeriodType || 'permanent',
        contractStartDate: item.contractStartDate || null,
        contractEndDate: item.contractEndDate || null
      }));
      
      console.log('🏢 구매품목 계약기간 저장 (전체):', purchaseItems.map(item => ({
        item: item.item,
        contractPeriodType: item.contractPeriodType,
        contractStartDate: item.contractStartDate,
        contractEndDate: item.contractEndDate
      })));
      
      await models.PurchaseItem.bulkCreate(purchaseItems);
    }

    // 용역항목 생성
    if (proposalData.serviceItems && proposalData.serviceItems.length > 0) {
      const serviceItems = proposalData.serviceItems.map(item => ({
        proposalId: proposal.id,
        item: item.item || '',
        name: item.name || '', // 성명 필드 추가
        personnel: item.personnel && item.personnel !== '' ? parseInt(item.personnel) || 1 : 1, // INTEGER: 기본값 1
        skillLevel: item.skillLevel && item.skillLevel !== '' ? item.skillLevel : 'junior', // ENUM: 기본값 junior
        period: item.period && item.period !== '' ? parseFloat(item.period) || 1 : 1, // DECIMAL: 소수점 허용
        monthlyRate: item.monthlyRate && item.monthlyRate !== '' ? parseInt(item.monthlyRate) || 0 : 0,
        contractAmount: item.contractAmount && item.contractAmount !== '' ? parseInt(item.contractAmount) || 0 : 0,
        supplier: item.supplier || '',
        creditRating: item.creditRating || null, // 빈 값 허용
        contractPeriodStart: item.contractPeriodStart || null,
        contractPeriodEnd: item.contractPeriodEnd || null,
        paymentMethod: item.paymentMethod || null
      }));
      await models.ServiceItem.bulkCreate(serviceItems);
    }

    // 비용귀속부서 생성 (임시저장)
    if (proposalData.costDepartments && proposalData.costDepartments.length > 0) {
      const costDepartments = proposalData.costDepartments.map(dept => ({
        proposalId: proposal.id,
        department: dept.department || '',
        amount: dept.amount && dept.amount !== '' ? parseInt(dept.amount) || 0 : 0,
        ratio: dept.ratio && dept.ratio !== '' ? parseInt(dept.ratio) || 0 : 0
      }));
      await models.CostDepartment.bulkCreate(costDepartments);
    }

    // 결재라인 생성
    if (proposalData.approvalLine && proposalData.approvalLine.length > 0) {
      const approvalLines = proposalData.approvalLine.map((line, index) => ({
        proposalId: proposal.id,
        step: index + 1,
        name: line.name,
        title: line.title,
        description: line.description,
        isConditional: line.conditional || false,
        isFinal: line.final || false,
        status: 'pending'
      }));
      await models.ApprovalLine.bulkCreate(approvalLines);
    }

    // 구매품목별 비용분배 정보 저장 (일반 API에서도 처리)
    console.log('받은 purchaseItemCostAllocations:', proposalData.purchaseItemCostAllocations);
    
    if (proposalData.purchaseItemCostAllocations && proposalData.purchaseItemCostAllocations.length > 0) {
      console.log('=== 구매품목별 비용분배 정보 저장 시작 ===');
      console.log('저장할 비용분배 정보 수:', proposalData.purchaseItemCostAllocations.length);
      
      // 구매품목 ID 매핑을 위해 생성된 구매품목들을 조회
      const createdPurchaseItems = await models.PurchaseItem.findAll({
        where: { proposalId: proposal.id },
        order: [['id', 'ASC']]
      });
      
      console.log('생성된 구매품목 수:', createdPurchaseItems.length);
      
      proposalData.purchaseItemCostAllocations.forEach(alloc => {
        console.log(`비용분배 정보: 품목인덱스=${alloc.itemIndex}, 부서=${alloc.department}, 타입=${alloc.type}, 값=${alloc.value}, 금액=${alloc.amount}`);
        console.log('  전체 alloc 객체:', JSON.stringify(alloc, null, 2));
      });
      
      const costDepartments = proposalData.purchaseItemCostAllocations.map(alloc => {
        const purchaseItem = createdPurchaseItems[alloc.itemIndex];
        return {
          proposalId: proposal.id,
          purchaseItemId: purchaseItem ? purchaseItem.id : null,
          department: alloc.department,
          allocationType: alloc.type || 'percentage',
          ratio: alloc.value || 0, // ratio 필드 사용
          amount: alloc.amount || 0
        };
      });
      
      console.log('저장할 CostDepartment 데이터:', costDepartments);
      await models.CostDepartment.bulkCreate(costDepartments);
      console.log('✅ 구매품목별 비용분배 정보 저장 완료');
    }
    
    // 용역품목별 비용분배 정보 저장 (일반 API)
    console.log('받은 serviceItemCostAllocations:', proposalData.serviceItemCostAllocations);
    
    if (proposalData.serviceItemCostAllocations && proposalData.serviceItemCostAllocations.length > 0) {
      console.log('=== 용역품목별 비용분배 정보 저장 시작 ===');
      console.log('저장할 비용분배 정보 수:', proposalData.serviceItemCostAllocations.length);
      
      // 용역품목 ID 매핑을 위해 생성된 용역품목들을 조회
      const createdServiceItems = await models.ServiceItem.findAll({
        where: { proposalId: proposal.id },
        order: [['id', 'ASC']]
      });
      
      console.log('생성된 용역품목 수:', createdServiceItems.length);
      
      const serviceCostDepartments = proposalData.serviceItemCostAllocations.map(alloc => {
        const serviceItem = createdServiceItems[alloc.itemIndex];
        return {
          proposalId: proposal.id,
          serviceItemId: serviceItem ? serviceItem.id : null,
          department: alloc.department,
          allocationType: alloc.type || 'percentage',
          ratio: alloc.value || 0,
          amount: alloc.amount || 0
        };
      });
      
      console.log('저장할 용역품목 CostDepartment 데이터:', serviceCostDepartments);
      await models.CostDepartment.bulkCreate(serviceCostDepartments);
      console.log('✅ 용역품목별 비용분배 정보 저장 완료');
    }

    // 요청부서 생성
    if (proposalData.requestDepartments && proposalData.requestDepartments.length > 0) {
      console.log('🔥🔥🔥 요청부서 원본 데이터:', JSON.stringify(proposalData.requestDepartments, null, 2));
      
      // 유효한 요청부서만 필터링
      const validRequestDepartments = proposalData.requestDepartments
        .map((dept, index) => {
          console.log(`  [${index}] 타입: ${typeof dept}, 값:`, dept);
          const deptName = typeof dept === 'string' ? dept : (dept.department || dept.name || '');
          console.log(`  [${index}] 추출된 부서명: "${deptName}"`);
          return { original: dept, deptName };
        })
        .filter(({ deptName }) => {
          const isValid = deptName && deptName.trim() !== '';
          console.log(`  필터링: "${deptName}" => ${isValid ? 'VALID ✅' : 'INVALID ❌'}`);
          return isValid;
        })
        .map(({ original, deptName }) => {
          const result = {
            proposalId: proposal.id,
            department: deptName.trim(),
            departmentId: typeof original === 'object' ? (original.departmentId || original.id || null) : null
          };
          console.log('  생성할 데이터:', result);
          return result;
        });
      
      console.log('🔥 필터링 후 최종 데이터:', JSON.stringify(validRequestDepartments, null, 2));
      
      if (validRequestDepartments.length > 0) {
        await models.RequestDepartment.bulkCreate(validRequestDepartments);
        console.log('✅ 요청부서 저장 완료:', validRequestDepartments.length, '개');
      } else {
        console.log('⚠️ 유효한 요청부서가 없어 저장하지 않음');
      }
    } else {
      console.log('⚠️ requestDepartments가 없거나 빈 배열입니다');
    }

    res.status(201).json({
      message: '품의서가 성공적으로 생성되었습니다.',
      proposalId: proposal.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. 품의서 목록 조회
app.get('/api/proposals', async (req, res) => {
  try {
    // 쿼리 파라미터로 필터링 조건 설정
    const whereClause = {};
    
    // budgetId 필터링
    if (req.query.budgetId) {
      whereClause.budgetId = req.query.budgetId;
    }
    
    // isDraft 필터링 (작성중 여부)
    if (req.query.isDraft !== undefined) {
      whereClause.isDraft = req.query.isDraft === 'true';
    }
    
    // createdBy 필터링 (작성자)
    if (req.query.createdBy) {
      whereClause.createdBy = req.query.createdBy;
    }
    
    // status 필터링 (승인 상태)
    if (req.query.status) {
      whereClause.status = req.query.status;
    }
    
    // 등록일 필터링 (최근 N개월)
    if (req.query.createdWithinMonths) {
      const monthsAgo = parseInt(req.query.createdWithinMonths);
      if (monthsAgo > 0) {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - monthsAgo);
        whereClause.createdAt = { [models.Sequelize.Op.gte]: cutoffDate };
      }
    }
    
    // 결재완료일 필터링 (최근 N개월)
    if (req.query.approvedWithinMonths) {
      const monthsAgo = parseInt(req.query.approvedWithinMonths);
      if (monthsAgo > 0) {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - monthsAgo);
        whereClause.approvalDate = { 
          [models.Sequelize.Op.and]: [
            { [models.Sequelize.Op.ne]: null },
            { [models.Sequelize.Op.gte]: cutoffDate }
          ]
        };
      }
    }

    // 페이지네이션 파라미터 (limit, offset)
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 [품의서 조회] API 호출');
    console.log('   Query Params:', req.query);
    console.log('   Where Clause:', whereClause);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // findAndCountAll로 변경하여 전체 개수도 함께 반환
    const queryOptions = {
      where: whereClause,
      distinct: true,  // JOIN으로 인한 중복 카운트 방지
      include: [
        {
          model: models.PurchaseItem,
          as: 'purchaseItems'
        },
        {
          model: models.ServiceItem,
          as: 'serviceItems'
        },
        {
          model: models.CostDepartment,
          as: 'costDepartments'
        },
        {
          model: models.ApprovalLine,
          as: 'approvalLines'
        },
        {
          model: models.RequestDepartment,
          as: 'requestDepartments'
        }
      ],
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['contract_method_id'] }
    };
    
    // limit이 있으면 페이지네이션 적용
    if (limit) {
      queryOptions.limit = limit;
      queryOptions.offset = offset;
    }

    const result = await models.Proposal.findAndCountAll(queryOptions);
    const proposals = result.rows;

    // 예산 정보와 비용분배 정보를 포함하여 응답
    const proposalsWithBudget = await Promise.all(proposals.map(async (proposal) => {
      const proposalData = proposal.toJSON();
      
      // 예산 정보 가져오기 (자본예산 또는 전산운용비)
      if (proposalData.budgetId) {
        // 자본예산
        try {
          const budgetResult = await sequelize.query(`
            SELECT project_name, budget_type, budget_category, budget_amount, budget_year
            FROM business_budgets 
            WHERE id = ?
          `, { replacements: [proposalData.budgetId] });
          
          if (budgetResult[0] && budgetResult[0].length > 0) {
            const budget = budgetResult[0][0];
            proposalData.budgetInfo = {
              projectName: budget.project_name,
              budgetType: budget.budget_type,
              budgetCategory: budget.budget_category,
              budgetAmount: budget.budget_amount,
              budgetYear: budget.budget_year
            };
          }
        } catch (error) {
          console.error('자본예산 정보 조회 실패:', error);
        }
      } else if (proposalData.operatingBudgetId) {
        // 전산운용비
        try {
          const budgetResult = await sequelize.query(`
            SELECT account_subject as project_name, fiscal_year as budget_year, budget_amount
            FROM operating_budgets 
            WHERE id = ?
          `, { replacements: [proposalData.operatingBudgetId] });
          
          if (budgetResult[0] && budgetResult[0].length > 0) {
            const budget = budgetResult[0][0];
            proposalData.budgetInfo = {
              projectName: budget.project_name,
              budgetType: '전산운용비',
              budgetCategory: '운영',
              budgetAmount: budget.budget_amount,
              budgetYear: budget.budget_year
            };
          }
        } catch (error) {
          console.error('전산운용비 정보 조회 실패:', error);
        }
      }
      
      // 각 구매품목에 비용분배 정보 추가 (목록 조회용)
      if (proposalData.purchaseItems) {
        proposalData.purchaseItems.forEach(purchaseItem => {
          // 해당 구매품목의 비용분배 정보 찾기
          const itemCostAllocations = proposalData.costDepartments.filter(dept => 
            dept.purchaseItemId === purchaseItem.id || 
            dept.purchaseItemId === null || 
            dept.purchaseItemId == null ||
            !dept.purchaseItemId
          );
          
          // costAllocations 필드 추가
          purchaseItem.costAllocations = itemCostAllocations.map(dept => ({
            department: dept.department,
            type: dept.allocationType || 'percentage',
            value: dept.ratio || 0, // ratio 필드 사용
            amount: dept.amount || 0
          }));
          
          // requestDepartments 배열로 변환
          if (purchaseItem.requestDepartment) {
            try {
              purchaseItem.requestDepartments = Array.isArray(purchaseItem.requestDepartment) 
                ? purchaseItem.requestDepartment 
                : JSON.parse(purchaseItem.requestDepartment);
            } catch (e) {
              purchaseItem.requestDepartments = [purchaseItem.requestDepartment];
            }
          } else {
            purchaseItem.requestDepartments = [];
          }
        });
      }
      
      return proposalData;
    }));

    // 반환 데이터 로그 (첫 번째 품의서만)
    if (proposalsWithBudget.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 [품의서 조회] 첫 번째 데이터 필드:');
      console.log('   - ID:', proposalsWithBudget[0].id);
      console.log('   - Title:', proposalsWithBudget[0].title);
      console.log('   - createdBy:', proposalsWithBudget[0].createdBy);
      console.log('   - requesterName:', proposalsWithBudget[0].requesterName);
      console.log('   - status:', proposalsWithBudget[0].status);
      console.log('   총 조회 건수:', proposalsWithBudget.length);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // limit이 있으면 페이지네이션 정보 포함하여 응답
    if (limit) {
      res.json({
        proposals: proposalsWithBudget,
        total: result.count,
        limit: limit,
        offset: offset,
        hasMore: (offset + proposalsWithBudget.length) < result.count
      });
    } else {
      res.json(proposalsWithBudget);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5-1. 사업예산별 품의서 조회 (프로젝트 연동용)
app.get('/api/proposals/by-budget/:businessBudgetId', async (req, res) => {
  try {
    const businessBudgetId = req.params.businessBudgetId;
    const status = req.query.status; // approved, rejected, pending 등
    
    const whereClause = {
      budgetId: businessBudgetId
    };
    
    // status 필터링
    if (status === 'approved') {
      whereClause.status = 'approved';
    } else if (status) {
      whereClause.status = status;
    }
    
    const proposals = await models.Proposal.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    
    res.json(proposals);
  } catch (error) {
    console.error('사업예산별 품의서 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. 품의서 상세 조회
app.get('/api/proposals/:id', async (req, res) => {
  try {
    const proposal = await models.Proposal.findByPk(req.params.id, {
      include: [
        {
          model: models.PurchaseItem,
          as: 'purchaseItems'
        },
        {
          model: models.ServiceItem,
          as: 'serviceItems'
        },
        {
          model: models.CostDepartment,
          as: 'costDepartments'
        },
        {
          model: models.ApprovalLine,
          as: 'approvalLines'
        },
        {
          model: models.RequestDepartment,
          as: 'requestDepartments'
        }
      ]
    });
    
    if (!proposal) {
      return res.status(404).json({ error: '품의서를 찾을 수 없습니다.' });
    }

    // 구매품목별 비용분배 정보 추가
    const proposalData = proposal.toJSON();
    
    // 계약방식 설명 추가
    if (proposalData.contractMethod) {
      const contractMethodInfo = await sequelize.query(`
        SELECT basis FROM contract_methods WHERE value = ?
      `, {
        replacements: [proposalData.contractMethod],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (contractMethodInfo && contractMethodInfo.length > 0) {
        proposalData.contract_method_description = contractMethodInfo[0].basis;
      }
    }
    
    // 예산 정보 가져오기 (자본예산 또는 전산운용비)
    if (proposalData.budgetId) {
      // 자본예산
      try {
        const budgetResult = await sequelize.query(`
          SELECT project_name, budget_type, budget_category, budget_amount, budget_year
          FROM business_budgets 
          WHERE id = ?
        `, { replacements: [proposalData.budgetId] });
        
        if (budgetResult[0] && budgetResult[0].length > 0) {
          const budget = budgetResult[0][0];
          proposalData.budgetInfo = {
            projectName: budget.project_name,
            budgetType: budget.budget_type,
            budgetCategory: budget.budget_category,
            budgetAmount: budget.budget_amount,
            budgetYear: budget.budget_year
          };
        }
      } catch (error) {
        console.error('자본예산 정보 조회 실패:', error);
      }
    } else if (proposalData.operatingBudgetId) {
      // 전산운용비
      try {
        const budgetResult = await sequelize.query(`
          SELECT account_subject as project_name, fiscal_year as budget_year, budget_amount
          FROM operating_budgets 
          WHERE id = ?
        `, { replacements: [proposalData.operatingBudgetId] });
        
        if (budgetResult[0] && budgetResult[0].length > 0) {
          const budget = budgetResult[0][0];
          proposalData.budgetInfo = {
            projectName: budget.project_name,
            budgetType: '전산운용비',
            budgetCategory: '운영',
            budgetAmount: budget.budget_amount,
            budgetYear: budget.budget_year
          };
        }
      } catch (error) {
        console.error('전산운용비 정보 조회 실패:', error);
      }
    }
    
    // 각 구매품목에 비용분배 정보와 요청부서 정보 추가
    if (proposalData.purchaseItems) {
      proposalData.purchaseItems.forEach(purchaseItem => {
        // 해당 구매품목의 비용분배 정보 찾기 (구매품목별 또는 품의서 전체)
        const itemCostAllocations = proposalData.costDepartments.filter(dept => 
          dept.purchaseItemId === purchaseItem.id || 
          dept.purchaseItemId === null || 
          dept.purchaseItemId == null ||
          !dept.purchaseItemId
        );
        
        console.log(`구매품목 "${purchaseItem.item}" (ID: ${purchaseItem.id}) 비용분배 찾기:`, itemCostAllocations.length, '개');
        console.log('  - 전체 costDepartments:', proposalData.costDepartments.length, '개');
        console.log('  - 필터링된 itemCostAllocations:', itemCostAllocations);
        proposalData.costDepartments.forEach((dept, index) => {
          console.log(`    costDepartment ${index + 1}: purchaseItemId=${dept.purchaseItemId}, department=${dept.department}`);
        });
        
        // costAllocations 필드 추가
        purchaseItem.costAllocations = itemCostAllocations.map(dept => ({
          department: dept.department,
          type: dept.allocationType || 'percentage',
          value: dept.ratio || 0, // ratio 필드 사용
          amount: dept.amount || 0
        }));
        
        // costAllocation 필드 추가 (중첩 구조로)
        purchaseItem.costAllocation = {
          type: 'percentage',
          allocations: purchaseItem.costAllocations
        };
        
        // requestDepartments 배열로 변환 (JSON 배열 지원)
        if (purchaseItem.requestDepartment) {
          try {
            // JSON 배열로 저장된 경우
            purchaseItem.requestDepartments = Array.isArray(purchaseItem.requestDepartment) 
              ? purchaseItem.requestDepartment 
              : JSON.parse(purchaseItem.requestDepartment);
          } catch (e) {
            // 기존 단일 문자열 데이터 호환성
            purchaseItem.requestDepartments = [purchaseItem.requestDepartment];
          }
        } else {
          purchaseItem.requestDepartments = [];
        }
        
        console.log(`구매품목 "${purchaseItem.item}" 요청부서 (전체):`, purchaseItem.requestDepartments);
      });
    }
    
    // 각 용역품목에 비용분배 정보 추가
    if (proposalData.serviceItems) {
      proposalData.serviceItems.forEach(serviceItem => {
        // 해당 용역품목의 비용분배 정보 찾기
        const itemCostAllocations = proposalData.costDepartments.filter(dept => 
          dept.serviceItemId === serviceItem.id
        );
        
        console.log(`용역품목 "${serviceItem.item}" (ID: ${serviceItem.id}) 비용분배 찾기:`, itemCostAllocations.length, '개');
        
        // costAllocations 필드 추가
        serviceItem.costAllocations = itemCostAllocations.map(dept => ({
          department: dept.department,
          type: dept.allocationType || 'percentage',
          value: dept.ratio || 0,
          amount: dept.amount || 0
        }));
        
        // costAllocation 필드 추가 (중첩 구조로)
        serviceItem.costAllocation = {
          type: 'percentage',
          allocations: serviceItem.costAllocations
        };
        
        console.log(`용역품목 "${serviceItem.item}" 비용분배:`, serviceItem.costAllocation);
      });
    }
    
    res.json(proposalData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6-1. 품의서 업데이트
app.put('/api/proposals/:id', async (req, res) => {
  try {
    const proposalData = req.body;
    console.log('=== 품의서 수정 요청 ===');
    console.log('수정할 데이터:', {
      proposalId: req.params.id,
      isDraft: proposalData.isDraft,
      status: proposalData.status,
      purpose: proposalData.purpose
    });
    
    const proposal = await models.Proposal.findByPk(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({ error: '품의서를 찾을 수 없습니다.' });
    }
    
    // budgetId 검증 및 변환
    let budgetId = null;
    if (proposalData.budget) {
      if (typeof proposalData.budget === 'string') {
        budgetId = parseInt(proposalData.budget);
        if (isNaN(budgetId)) {
          return res.status(400).json({ 
            error: '유효하지 않은 예산 정보입니다. 예산을 다시 선택해주세요.' 
          });
        }
      } else {
        budgetId = proposalData.budget;
      }
    }

    console.log('🔄 품의서 업데이트:', {
      id: req.params.id,
      contractType: proposalData.contractType,
      budgetId: budgetId,
      createdBy: proposalData.createdBy || '사용자1'
    });

    // enum 필드 처리 (빈 문자열을 null로 변환)
    const processedPaymentMethod = proposalData.paymentMethod && proposalData.paymentMethod.trim() !== '' 
      ? proposalData.paymentMethod 
      : (proposal.paymentMethod || null);

    const processedContractMethod = proposalData.contractMethod && proposalData.contractMethod.trim() !== '' 
      ? proposalData.contractMethod 
      : (proposal.contractMethod || null);

    console.log('🔧 enum 필드 처리:', {
      originalPaymentMethod: proposalData.paymentMethod,
      processedPaymentMethod,
      originalContractMethod: proposalData.contractMethod,
      processedContractMethod
    });

    // 품의서 기본 정보 업데이트
    await proposal.update({
      contractType: proposalData.contractType || proposal.contractType,
      title: proposalData.title !== undefined ? proposalData.title : proposal.title,
      purpose: proposalData.purpose || proposal.purpose,
      basis: proposalData.basis || proposal.basis,
      budgetId: budgetId || proposal.budgetId,
      contractMethod: processedContractMethod,
      accountSubject: proposalData.accountSubject || proposal.accountSubject,
      totalAmount: proposalData.totalAmount || proposal.totalAmount || 0,
      changeReason: proposalData.changeReason || proposal.changeReason,
      extensionReason: proposalData.extensionReason || proposal.extensionReason,
      contractPeriod: proposalData.contractPeriod || proposal.contractPeriod,
        contractStartDate: proposalData.contractStartDate || proposal.contractStartDate || null,
        contractEndDate: proposalData.contractEndDate || proposal.contractEndDate || null,
      paymentMethod: processedPaymentMethod,
      wysiwygContent: proposalData.wysiwygContent || proposal.wysiwygContent || '', // 자유양식 문서 내용 추가
      createdBy: proposalData.createdBy || proposal.createdBy || '사용자1',
      status: proposalData.isDraft ? 'draft' : 'submitted',
      isDraft: proposalData.isDraft !== undefined ? proposalData.isDraft : false
    });

    // 트랜잭션 시작
    const transaction = await sequelize.transaction();
    
    try {
      // 기존 관련 데이터 삭제 (외래키 제약조건을 고려한 순서)
      console.log('🗑️ 기존 관련 데이터 삭제 시작...');
      
      // 1. 먼저 참조하는 테이블들 삭제
      await models.CostDepartment.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ CostDepartment 삭제 완료');
      
      await models.RequestDepartment.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ RequestDepartment 삭제 완료');
      
      await models.ApprovalLine.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ ApprovalLine 삭제 완료');
      
      // 2. 그 다음 참조되는 테이블들 삭제
      await models.PurchaseItem.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ PurchaseItem 삭제 완료');
      
      await models.ServiceItem.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ ServiceItem 삭제 완료');
      
      console.log('🗑️ 모든 관련 데이터 삭제 완료');
      
      // 새 데이터 생성
      if (proposalData.costDepartments && proposalData.costDepartments.length > 0) {
        const costDepartments = proposalData.costDepartments.map(dept => ({
          proposalId: proposal.id,
          department: dept.department || '',
          amount: dept.amount && dept.amount !== '' ? parseInt(dept.amount) || 0 : 0,
          ratio: dept.ratio && dept.ratio !== '' ? parseInt(dept.ratio) || 0 : 0
        }));
        await models.CostDepartment.bulkCreate(costDepartments, { transaction });
        console.log('✅ CostDepartment 생성 완료');
      }

      if (proposalData.purchaseItems && proposalData.purchaseItems.length > 0) {
        const purchaseItems = proposalData.purchaseItems.map(item => ({
          proposalId: proposal.id,
          item: item.item || '',
          productName: item.productName || '',
          quantity: item.quantity && item.quantity !== '' ? parseInt(item.quantity) || 0 : 0,
          unitPrice: item.unitPrice && item.unitPrice !== '' ? parseInt(item.unitPrice) || 0 : 0,
          amount: item.amount && item.amount !== '' ? parseInt(item.amount) || 0 : 0,
          supplier: item.supplier || '',
          contractPeriodType: item.contractPeriodType || 'permanent',
          contractStartDate: item.contractStartDate || null,
        contractEndDate: item.contractEndDate || null
        }));
        await models.PurchaseItem.bulkCreate(purchaseItems, { transaction });
        console.log('✅ PurchaseItem 생성 완료');
      }

      if (proposalData.serviceItems && proposalData.serviceItems.length > 0) {
        const serviceItems = proposalData.serviceItems.map(item => ({
          proposalId: proposal.id,
          item: item.item || '',
          name: item.name || '', // 성명 필드 추가
          personnel: item.personnel && item.personnel !== '' ? parseInt(item.personnel) || 1 : 1, // INTEGER: 기본값 1
          skillLevel: item.skillLevel && item.skillLevel !== '' ? item.skillLevel : 'junior', // ENUM: 기본값 junior
          period: item.period && item.period !== '' ? parseFloat(item.period) || 1 : 1, // DECIMAL: 소수점 허용
          monthlyRate: item.monthlyRate && item.monthlyRate !== '' ? parseInt(item.monthlyRate) || 0 : 0,
          contractAmount: item.contractAmount && item.contractAmount !== '' ? parseInt(item.contractAmount) || 0 : 0,
          supplier: item.supplier || '',
          creditRating: item.creditRating || null, // 빈 값 허용
          contractPeriodStart: item.contractPeriodStart || null,
          contractPeriodEnd: item.contractPeriodEnd || null,
          paymentMethod: item.paymentMethod || null
        }));
        await models.ServiceItem.bulkCreate(serviceItems, { transaction });
        console.log('✅ ServiceItem 생성 완료');
      }

      if (proposalData.approvalLine && proposalData.approvalLine.length > 0) {
        const approvalLines = proposalData.approvalLine.map((line, index) => ({
          proposalId: proposal.id,
          step: index + 1,
          name: line.name,
          title: line.title,
          description: line.description,
          isConditional: line.conditional || false,
          isFinal: line.final || false,
          status: 'pending'
        }));
        await models.ApprovalLine.bulkCreate(approvalLines, { transaction });
        console.log('✅ ApprovalLine 생성 완료');
      }

      // 구매품목별 비용분배 정보 저장 (PUT API에서도 처리)
      console.log('받은 purchaseItemCostAllocations:', proposalData.purchaseItemCostAllocations);
      
      if (proposalData.purchaseItemCostAllocations && proposalData.purchaseItemCostAllocations.length > 0) {
        console.log('=== 구매품목별 비용분배 정보 저장 시작 (PUT) ===');
        console.log('저장할 비용분배 정보 수:', proposalData.purchaseItemCostAllocations.length);
        
        // 구매품목 ID 매핑을 위해 생성된 구매품목들을 조회
        const createdPurchaseItems = await models.PurchaseItem.findAll({
          where: { proposalId: proposal.id },
          order: [['id', 'ASC']],
          transaction
        });
        
        console.log('생성된 구매품목 수:', createdPurchaseItems.length);
        
        proposalData.purchaseItemCostAllocations.forEach(alloc => {
          console.log(`비용분배 정보: 품목인덱스=${alloc.itemIndex}, 부서=${alloc.department}, 타입=${alloc.type}, 값=${alloc.value}, 금액=${alloc.amount}`);
          console.log('  전체 alloc 객체:', JSON.stringify(alloc, null, 2));
        });
        
        const costDepartments = proposalData.purchaseItemCostAllocations.map(alloc => {
          const purchaseItem = createdPurchaseItems[alloc.itemIndex];
          return {
            proposalId: proposal.id,
            purchaseItemId: purchaseItem ? purchaseItem.id : null,
            department: alloc.department,
            allocationType: alloc.type || 'percentage',
            ratio: alloc.value || 0, // ratio 필드 사용
            amount: alloc.amount || 0
          };
        });
        
        console.log('저장할 CostDepartment 데이터:', costDepartments);
        await models.CostDepartment.bulkCreate(costDepartments, { transaction });
        console.log('✅ 구매품목별 비용분배 정보 저장 완료 (PUT)');
      }
      
      // 용역품목별 비용분배 정보 저장 (PUT API)
      console.log('받은 serviceItemCostAllocations:', proposalData.serviceItemCostAllocations);
      
      if (proposalData.serviceItemCostAllocations && proposalData.serviceItemCostAllocations.length > 0) {
        console.log('=== 용역품목별 비용분배 정보 저장 시작 (PUT) ===');
        console.log('저장할 비용분배 정보 수:', proposalData.serviceItemCostAllocations.length);
        
        // 용역품목 ID 매핑을 위해 생성된 용역품목들을 조회
        const createdServiceItems = await models.ServiceItem.findAll({
          where: { proposalId: proposal.id },
          order: [['id', 'ASC']],
          transaction
        });
        
        console.log('생성된 용역품목 수:', createdServiceItems.length);
        
        const serviceCostDepartments = proposalData.serviceItemCostAllocations.map(alloc => {
          const serviceItem = createdServiceItems[alloc.itemIndex];
          return {
            proposalId: proposal.id,
            serviceItemId: serviceItem ? serviceItem.id : null,
            department: alloc.department,
            allocationType: alloc.type || 'percentage',
            ratio: alloc.value || 0,
            amount: alloc.amount || 0
          };
        });
        
        console.log('저장할 용역품목 CostDepartment 데이터:', serviceCostDepartments);
        await models.CostDepartment.bulkCreate(serviceCostDepartments, { transaction });
        console.log('✅ 용역품목별 비용분배 정보 저장 완료 (PUT)');
      }

      // 요청부서 생성 (PUT)
      if (proposalData.requestDepartments && proposalData.requestDepartments.length > 0) {
        console.log('🔥🔥🔥 [PUT] 요청부서 원본 데이터:', JSON.stringify(proposalData.requestDepartments, null, 2));
        
        // 유효한 요청부서만 필터링
        const validRequestDepartments = proposalData.requestDepartments
          .map((dept, index) => {
            console.log(`  [PUT][${index}] 타입: ${typeof dept}, 값:`, dept);
            const deptName = typeof dept === 'string' ? dept : (dept.department || dept.name || '');
            console.log(`  [PUT][${index}] 추출된 부서명: "${deptName}"`);
            return { original: dept, deptName };
          })
          .filter(({ deptName }) => {
            const isValid = deptName && deptName.trim() !== '';
            console.log(`  [PUT] 필터링: "${deptName}" => ${isValid ? 'VALID ✅' : 'INVALID ❌'}`);
            return isValid;
          })
          .map(({ original, deptName }) => {
            const result = {
              proposalId: proposal.id,
              department: deptName.trim(),
              departmentId: typeof original === 'object' ? (original.departmentId || original.id || null) : null
            };
            console.log('  [PUT] 생성할 데이터:', result);
            return result;
          });
        
        console.log('🔥 [PUT] 필터링 후 최종 데이터:', JSON.stringify(validRequestDepartments, null, 2));
        
        if (validRequestDepartments.length > 0) {
          await models.RequestDepartment.bulkCreate(validRequestDepartments, { transaction });
          console.log('✅ [PUT] 요청부서 저장 완료:', validRequestDepartments.length, '개');
        } else {
          console.log('⚠️ [PUT] 유효한 요청부서가 없어 저장하지 않음');
        }
      } else {
        console.log('⚠️ [PUT] requestDepartments가 없거나 빈 배열입니다');
      }

      // 트랜잭션 커밋
      await transaction.commit();
      console.log('✅ 데이터 생성 완료');
      
    } catch (error) {
      // 트랜잭션 롤백
      await transaction.rollback();
      console.error('❌ 데이터 생성 실패:', error);
      throw error;
    }

    console.log('✅ 품의서 업데이트 완료:', {
      proposalId: proposal.id,
      status: proposal.status,
      isDraft: proposal.isDraft
    });

    res.json({
      message: '품의서가 성공적으로 업데이트되었습니다.',
      proposalId: proposal.id
    });
  } catch (error) {
    console.error('❌ 품의서 업데이트 실패:', {
      proposalId: req.params.id,
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });

    // 구체적인 에러 메시지 제공
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        error: '입력 데이터 검증 실패',
        details: error.errors.map(e => e.message)
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        error: '이미 존재하는 품의서입니다.',
        details: error.errors.map(e => e.message)
      });
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        error: '참조하는 데이터가 존재하지 않습니다. 예산이나 부서 정보를 확인해주세요.',
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      details: error.message 
    });
  }
});

// 7. 품의서 상태 업데이트
app.patch('/api/proposals/:id/status', async (req, res) => {
  try {
    console.log('=== 품의서 상태 업데이트 요청 ===');
    console.log('품의서 ID:', req.params.id);
    console.log('요청 데이터:', req.body);
    
    const { status, statusDate, changeReason, changedBy = '시스템관리자' } = req.body;
    const proposal = await models.Proposal.findByPk(req.params.id);
    
    if (!proposal) {
      console.log('❌ 품의서를 찾을 수 없음:', req.params.id);
      return res.status(404).json({ error: '품의서를 찾을 수 없습니다.' });
    }
    
    const previousStatus = proposal.status;
    console.log('이전 상태:', previousStatus);
    
    // 상태는 submitted 또는 approved만 허용
    let dbStatus;
    if (status === 'approved' || status === '결재완료') {
      dbStatus = 'approved';
    } else if (status === 'submitted' || status === '결재대기') {
      dbStatus = 'submitted';
    } else {
      // 기본값: submitted
      dbStatus = 'submitted';
    }
    
    console.log('변환된 DB 상태:', status, '->', dbStatus);
    
    // 상태 변경 유효성 검사
    if (previousStatus === 'approved' && dbStatus === 'submitted') {
      console.log('⚠️ approved -> submitted 변경 불가');
      return res.status(400).json({ 
        error: '결재완료된 품의서는 결재대기로 변경할 수 없습니다.' 
      });
    }
    
    // 결재완료로 변경하려면 submitted 상태여야 함
    if (dbStatus === 'approved' && previousStatus !== 'submitted') {
      console.log('⚠️ submitted 상태가 아닌 품의서는 결재완료로 변경 불가');
      return res.status(400).json({ 
        error: '결재대기 상태의 품의서만 결재완료로 변경할 수 있습니다.' 
      });
    }
    
    // 결재완료로 변경되는 경우, 먼저 전산운용비 예산인지 확인하고 집행내역 추가
    if (dbStatus === 'approved' && proposal.operatingBudgetId) {
      console.log('결재완료 처리: 전산운용비 예산 확인 중...');
      console.log('품의서 operatingBudgetId:', proposal.operatingBudgetId);
      
      // 전산운용비에서 찾기
      const operatingBudgets = await sequelize.query(`
        SELECT * FROM operating_budgets WHERE id = ?
      `, {
        replacements: [proposal.operatingBudgetId],
        type: sequelize.QueryTypes.SELECT
      });
      
      const operatingBudget = operatingBudgets.length > 0 ? operatingBudgets[0] : null;
      
      console.log('전산운용비 조회 결과:', operatingBudget);
      
      if (operatingBudget) {
        // 전산운용비 예산인 경우 집행내역 자동 추가
        console.log('✅ 전산운용비 예산 확인 - 집행내역 추가 시작');
        
        // 번호 자동 생성 (현재 년도 기준 순번)
        const currentYear = new Date().getFullYear();
        const [countResult] = await sequelize.query(`
          SELECT COUNT(*) as count FROM operating_budget_executions 
          WHERE budget_id = ? AND EXTRACT(YEAR FROM created_at) = ?
        `, {
          replacements: [proposal.operatingBudgetId, currentYear],
          type: sequelize.QueryTypes.SELECT
        });
        
        const executionNumber = `${currentYear}-${String(countResult.count + 1).padStart(4, '0')}`;
        console.log('생성된 집행 번호:', executionNumber);
        
        // 총 계약금액을 정수로 변환 (bigint 타입 호환)
        const totalAmountInt = Math.floor(parseFloat(proposal.totalAmount) || 0);
        console.log('총 계약금액 변환:', {
          원본: proposal.totalAmount,
          타입: typeof proposal.totalAmount,
          변환후: totalAmountInt
        });
        
        // 집행내역 추가 (확정집행액에 총 계약금액 연동)
        await sequelize.query(`
          INSERT INTO operating_budget_executions (
            budget_id, 
            account_subject, 
            execution_number,
            proposal_name, 
            confirmed_execution_amount,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `, {
          replacements: [
            proposal.operatingBudgetId,
            operatingBudget.account_subject, // 예산의 계정과목
            executionNumber, // 자동 생성된 번호
            proposal.title, // 품의서 제목
            totalAmountInt // 총 계약금액 → 확정집행액
          ]
        });
        
        console.log('✅ 전산운용비 집행내역 추가 완료:', {
          budgetId: proposal.operatingBudgetId,
          accountSubject: operatingBudget.account_subject,
          executionNumber: executionNumber,
          proposalName: proposal.title,
          confirmedExecutionAmount: totalAmountInt
        });
        
        // 운영예산의 집행액은 집행내역 조회 시 SUM으로 계산됨
        console.log('✅ 전산운용비 처리 완료 (집행액은 집행내역에서 자동 계산됨)');
      } else {
        console.log('ℹ️ 자본예산 - 집행내역 추가 없음');
      }
    }
    
    // 집행내역 추가 완료 후 상태 업데이트
    const updateData = { 
      status: dbStatus,
      isDraft: false
    };
    
    // 결재완료로 변경되는 경우 approvalDate 설정
    if (dbStatus === 'approved') {
      // statusDate가 전달되면 해당 날짜 사용, 없으면 현재 날짜 사용
      updateData.approvalDate = statusDate || new Date().toISOString().split('T')[0];
      console.log('결재완료일 설정:', updateData.approvalDate);
    }
    
    console.log('업데이트할 데이터:', updateData);
    await proposal.update(updateData);
    console.log('✅ 상태 업데이트 완료');
    
    // 히스토리 저장 (현재 테이블 구조에 맞게)
    await models.ProposalHistory.create({
      proposalId: proposal.id,
      changedBy,
      changedAt: new Date(),
      changeType: 'status_update',
      fieldName: 'status',
      oldValue: previousStatus,
      newValue: status,
      description: changeReason || `상태 변경: ${previousStatus} → ${status}`
    });
    
    res.json({ 
      message: '상태가 업데이트되었습니다.', 
      status,
      historyId: proposal.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7-1. 품의서 히스토리 조회
app.get('/api/proposals/:id/history', async (req, res) => {
  try {
    const histories = await models.ProposalHistory.findAll({
      where: { proposalId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(histories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7-2. 결재완료일 업데이트
app.patch('/api/proposals/:id/approval-date', async (req, res) => {
  try {
    const { approvalDate } = req.body;
    const proposal = await models.Proposal.findByPk(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({ error: '품의서를 찾을 수 없습니다.' });
    }
    
    // 결재완료일 업데이트
    await proposal.update({ approvalDate });
    
    res.json({ 
      message: '결재완료일이 업데이트되었습니다.', 
      approvalDate 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. 임시저장
app.post('/api/proposals/draft', async (req, res) => {
  try {
    const proposalData = req.body;
    console.log('=== 임시저장 요청 받음 ===');
    console.log('받은 데이터:', JSON.stringify(proposalData, null, 2));
    
    // 편집 모드인지 확인 (proposalId가 있으면 편집 모드)
    const isEditMode = proposalData.proposalId && proposalData.proposalId > 0;
    let proposal;
    
    if (isEditMode) {
      console.log('=== 편집 모드 - 기존 품의서 업데이트 ===');
      console.log('업데이트할 품의서 ID:', proposalData.proposalId);
      
      // 트랜잭션 시작
      const transaction = await models.sequelize.transaction();
      
      try {
        // 기존 품의서 조회
        proposal = await models.Proposal.findByPk(proposalData.proposalId, { transaction });
        if (!proposal) {
          await transaction.rollback();
          return res.status(404).json({ error: '수정할 품의서를 찾을 수 없습니다.' });
        }
      
      // budgetId와 operatingBudgetId 처리
      let budgetId = null;
      let operatingBudgetId = null;
      
      // 프론트엔드에서 구분해서 보낸 경우
      if (proposalData.budgetId !== undefined || proposalData.operatingBudgetId !== undefined) {
        budgetId = proposalData.budgetId ? parseInt(proposalData.budgetId) : null;
        operatingBudgetId = proposalData.operatingBudgetId ? parseInt(proposalData.operatingBudgetId) : null;
        console.log('✅ 임시저장(편집) - 프론트엔드에서 구분해서 받음:', { budgetId, operatingBudgetId });
      } else if (proposalData.budget) {
        // 기존 방식 (하위 호환성)
        const budgetNum = parseInt(proposalData.budget);
        if (!isNaN(budgetNum) && budgetNum > 0) {
          if (proposalData.selectedBudgetType === 'operating') {
            operatingBudgetId = budgetNum;
            budgetId = null;
            console.log('✅ 임시저장(편집) - 전산운용비 예산 업데이트:', operatingBudgetId);
          } else {
            budgetId = budgetNum;
            operatingBudgetId = null;
            console.log('✅ 임시저장(편집) - 자본예산 업데이트:', budgetId);
          }
        } else {
          console.log('⚠️ 임시저장(편집) - budget이 유효하지 않은 숫자, 기존 값 유지');
          budgetId = proposal.budgetId || null;
          operatingBudgetId = proposal.operatingBudgetId || null;
        }
      } else {
        // 기존 값 유지
        budgetId = proposal.budgetId || null;
        operatingBudgetId = proposal.operatingBudgetId || null;
        console.log('⚠️ 임시저장(편집) - 예산 정보 없음, 기존 값 유지:', { budgetId, operatingBudgetId });
      }
      
      console.log('📝 임시저장(편집) - 최종 예산 상태:', { budgetId, operatingBudgetId });
      
      // enum 필드 처리 (빈 문자열을 null로 변환) - 임시저장용
      const processedPaymentMethodDraft = proposalData.paymentMethod && proposalData.paymentMethod.trim() !== '' 
        ? proposalData.paymentMethod 
        : (proposal.paymentMethod || null);

      const processedContractMethodDraft = proposalData.contractMethod && proposalData.contractMethod.trim() !== '' 
        ? proposalData.contractMethod 
        : (proposal.contractMethod || null);

      console.log('🔧 임시저장 enum 필드 처리:', {
        originalPaymentMethod: proposalData.paymentMethod,
        processedPaymentMethodDraft,
        originalContractMethod: proposalData.contractMethod,
        processedContractMethodDraft
      });

      // 기존 품의서 업데이트 (기존 값 유지 우선)
      await proposal.update({
        contractType: proposalData.contractType || proposal.contractType || 'purchase',
        title: proposalData.title || proposal.title || '', // 제목 필드 추가
        purpose: proposalData.purpose || proposal.purpose || '',
        basis: proposalData.basis || proposal.basis || '',
        budgetId: budgetId,
        operatingBudgetId: operatingBudgetId,
        contractMethod: processedContractMethodDraft,
        accountSubject: proposalData.accountSubject || proposal.accountSubject || '',
        totalAmount: proposalData.totalAmount || proposal.totalAmount || 0,
        changeReason: proposalData.changeReason || proposal.changeReason || null,
        extensionReason: proposalData.extensionReason || proposal.extensionReason || null,
        contractPeriod: proposalData.contractPeriod || proposal.contractPeriod,
        contractStartDate: proposalData.contractStartDate || proposal.contractStartDate || null,
        contractEndDate: proposalData.contractEndDate || proposal.contractEndDate || null || null,
        paymentMethod: processedPaymentMethodDraft,
        wysiwygContent: proposalData.wysiwygContent || proposal.wysiwygContent || '', // 자유양식 내용 추가
        other: proposalData.other || proposal.other || '', // 기타 사항 추가
        status: proposalData.status || 'draft', // 요청된 상태 또는 기본값
        createdBy: proposalData.createdBy || proposal.createdBy || '시스템',
        proposalDate: new Date().toISOString().split('T')[0],
        isDraft: proposalData.isDraft !== undefined ? proposalData.isDraft : true // 요청된 값 또는 기본값
      }, { transaction });
      
      // 기존 관련 데이터 삭제 (외래키 제약조건을 고려한 순서)
      console.log('🗑️ 기존 관련 데이터 삭제 시작...');
      
      // 1. 먼저 참조하는 테이블들 삭제
      await models.CostDepartment.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ CostDepartment 삭제 완료');
      
      await models.RequestDepartment.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ RequestDepartment 삭제 완료');
      
      await models.ApprovalLine.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ ApprovalLine 삭제 완료');
      
      // 2. 그 다음 참조되는 테이블들 삭제
      await models.PurchaseItem.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ PurchaseItem 삭제 완료');
      
      await models.ServiceItem.destroy({ where: { proposalId: proposal.id }, transaction });
      console.log('✅ ServiceItem 삭제 완료');
      
      console.log('🗑️ 모든 관련 데이터 삭제 완료');
      
      // 트랜잭션 커밋
      await transaction.commit();
      console.log('✅ 기존 품의서 업데이트 완료');
      
    } catch (error) {
      // 트랜잭션 롤백
      await transaction.rollback();
      console.error('❌ 편집 모드 업데이트 실패:', error);
      throw error;
    }
    } else {
      console.log('=== 새 품의서 생성 ===');
      
      // budgetId와 operatingBudgetId 처리
      let budgetId = null;
      let operatingBudgetId = null;
      
      // 프론트엔드에서 구분해서 보낸 경우
      if (proposalData.budgetId !== undefined || proposalData.operatingBudgetId !== undefined) {
        budgetId = proposalData.budgetId ? parseInt(proposalData.budgetId) : null;
        operatingBudgetId = proposalData.operatingBudgetId ? parseInt(proposalData.operatingBudgetId) : null;
        console.log('✅ 임시저장(신규) - 프론트엔드에서 구분해서 받음:', { budgetId, operatingBudgetId });
      } else if (proposalData.budget) {
        // 기존 방식 (하위 호환성)
        const budgetNum = parseInt(proposalData.budget);
        if (!isNaN(budgetNum) && budgetNum > 0) {
          if (proposalData.selectedBudgetType === 'operating') {
            operatingBudgetId = budgetNum;
            budgetId = null;
            console.log('✅ 임시저장(신규) - 전산운용비 예산 설정:', operatingBudgetId);
          } else {
            budgetId = budgetNum;
            operatingBudgetId = null;
            console.log('✅ 임시저장(신규) - 자본예산 설정:', budgetId);
          }
        } else {
          console.log('⚠️ 임시저장(신규) - budget이 유효하지 않은 숫자, null로 설정');
        }
      } else {
        console.log('📝 임시저장(신규) - budget이 없음, null로 설정');
      }
      
      console.log('📝 임시저장(신규) - 최종 예산 상태:', { budgetId, operatingBudgetId });

      // enum 필드 처리 (빈 문자열을 null로 변환) - 새 품의서용
      const processedPaymentMethodNew = proposalData.paymentMethod && proposalData.paymentMethod.trim() !== '' 
        ? proposalData.paymentMethod 
        : null;

      const processedContractMethodNew = proposalData.contractMethod && proposalData.contractMethod.trim() !== '' 
        ? proposalData.contractMethod 
        : null;

      console.log('🔧 새 품의서 enum 필드 처리:', {
        originalPaymentMethod: proposalData.paymentMethod,
        processedPaymentMethodNew,
        originalContractMethod: proposalData.contractMethod,
        processedContractMethodNew
      });

      // 새 품의서 생성
      proposal = await models.Proposal.create({
        contractType: proposalData.contractType || 'purchase',
        title: proposalData.title || '', // 제목 필드 추가
        purpose: proposalData.purpose || '',
        basis: proposalData.basis || '',
        budgetId: budgetId,
        operatingBudgetId: operatingBudgetId,
        contractMethod: processedContractMethodNew,
        accountSubject: proposalData.accountSubject || '',
        totalAmount: proposalData.totalAmount || 0,
        changeReason: proposalData.changeReason || null,
        extensionReason: proposalData.extensionReason || null,
        contractPeriod: proposalData.contractPeriod || null,
      contractStartDate: proposalData.contractStartDate || null,
      contractEndDate: proposalData.contractEndDate || null,
        paymentMethod: processedPaymentMethodNew,
        wysiwygContent: proposalData.wysiwygContent || '', // 자유양식 내용 추가
        other: proposalData.other || '', // 기타 사항 추가
        status: proposalData.status || 'draft', // 요청된 상태 또는 기본값
        createdBy: proposalData.createdBy || '시스템', // 작성자 필드 추가
        proposalDate: new Date().toISOString().split('T')[0], // 오늘 날짜로 설정
        isDraft: proposalData.isDraft !== undefined ? proposalData.isDraft : true // 요청된 값 또는 기본값
      });
    }

    // 구매품목 생성 (임시저장)
    if (proposalData.purchaseItems && proposalData.purchaseItems.length > 0) {
      const purchaseItems = proposalData.purchaseItems.map(item => ({
        proposalId: proposal.id,
        item: item.item || '',
        productName: item.productName || '',
        quantity: item.quantity && item.quantity !== '' ? parseInt(item.quantity) || 0 : 0,
        unitPrice: item.unitPrice && item.unitPrice !== '' ? parseInt(item.unitPrice) || 0 : 0,
        amount: item.amount && item.amount !== '' ? parseInt(item.amount) || 0 : 0,
        supplier: item.supplier || '',
        contractPeriodType: item.contractPeriodType || 'permanent',
        contractStartDate: item.contractStartDate || null,
        contractEndDate: item.contractEndDate || null
      }));
      
      console.log('🏢 구매품목 계약기간 저장 (전체):', purchaseItems.map(item => ({
        item: item.item,
        contractPeriodType: item.contractPeriodType,
        contractStartDate: item.contractStartDate,
        contractEndDate: item.contractEndDate
      })));
      
      await models.PurchaseItem.bulkCreate(purchaseItems);
    }

    // 용역항목 생성 (임시저장)
    if (proposalData.serviceItems && proposalData.serviceItems.length > 0) {
      const serviceItems = proposalData.serviceItems.map(item => ({
        proposalId: proposal.id,
        item: item.item || '',
        personnel: item.personnel && item.personnel !== '' ? parseInt(item.personnel) || 1 : 1, // INTEGER: 기본값 1
        name: item.name || '', // 성명 필드 추가
        skillLevel: item.skillLevel && item.skillLevel !== '' ? item.skillLevel : 'junior', // ENUM: 기본값 junior
        period: item.period && item.period !== '' ? parseFloat(item.period) || 1 : 1, // DECIMAL: 소수점 허용
        monthlyRate: item.monthlyRate && item.monthlyRate !== '' ? parseInt(item.monthlyRate) || 0 : 0,
        contractAmount: item.contractAmount && item.contractAmount !== '' ? parseInt(item.contractAmount) || 0 : 0,
        supplier: item.supplier || '',
        creditRating: item.creditRating || null, // 빈 값 허용
        contractPeriodStart: item.contractPeriodStart || null,
        contractPeriodEnd: item.contractPeriodEnd || null,
        paymentMethod: item.paymentMethod || null
      }));
      await models.ServiceItem.bulkCreate(serviceItems);
    }

    // 비용귀속부서 생성 (임시저장)
    if (proposalData.costDepartments && proposalData.costDepartments.length > 0) {
      const costDepartments = proposalData.costDepartments.map(dept => ({
        proposalId: proposal.id,
        department: dept.department || '',
        amount: dept.amount && dept.amount !== '' ? parseInt(dept.amount) || 0 : 0,
        ratio: dept.ratio && dept.ratio !== '' ? parseInt(dept.ratio) || 0 : 0
      }));
      await models.CostDepartment.bulkCreate(costDepartments);
    }

    // 구매품목별 비용분배 정보 저장
    console.log('=== 구매품목별 비용분배 정보 처리 ===');
    console.log('받은 purchaseItemCostAllocations:', proposalData.purchaseItemCostAllocations);
    
    if (proposalData.purchaseItemCostAllocations && proposalData.purchaseItemCostAllocations.length > 0) {
      // 기존 구매품목 정보 가져오기
      const purchaseItems = await models.PurchaseItem.findAll({
        where: { proposalId: proposal.id },
        order: [['id', 'ASC']]
      });
      
      console.log('저장된 구매품목:', purchaseItems.map(item => ({ id: item.id, item: item.item })));
      
      // 각 구매품목의 비용분배 정보를 costDepartments에 추가
      const additionalCostDepartments = [];
      
      proposalData.purchaseItemCostAllocations.forEach(alloc => {
        const purchaseItem = purchaseItems[alloc.itemIndex];
        if (purchaseItem) {
          console.log(`구매품목 "${purchaseItem.item}" (ID: ${purchaseItem.id}) 비용분배:`, alloc);
          
          // 비용분배 정보를 costDepartments에 추가
          additionalCostDepartments.push({
            proposalId: proposal.id,
            department: alloc.department,
            amount: alloc.type === 'percentage' ? (purchaseItem.amount * (alloc.value / 100)) : alloc.value,
            ratio: alloc.value,
            purchaseItemId: purchaseItem.id,
            allocationType: alloc.type
          });
        }
      });
      
      if (additionalCostDepartments.length > 0) {
        console.log('추가할 비용귀속부서 데이터:', additionalCostDepartments);
        await models.CostDepartment.bulkCreate(additionalCostDepartments);
      }
    }
    
    // 용역품목별 비용분배 정보 저장
    console.log('=== 용역품목별 비용분배 정보 처리 ===');
    console.log('받은 serviceItemCostAllocations:', proposalData.serviceItemCostAllocations);
    
    if (proposalData.serviceItemCostAllocations && proposalData.serviceItemCostAllocations.length > 0) {
      // 기존 용역품목 정보 가져오기
      const serviceItems = await models.ServiceItem.findAll({
        where: { proposalId: proposal.id },
        order: [['id', 'ASC']]
      });
      
      console.log('저장된 용역품목:', serviceItems.map(item => ({ id: item.id, item: item.item })));
      
      // 각 용역품목의 비용분배 정보를 costDepartments에 추가
      const additionalServiceCostDepartments = [];
      
      proposalData.serviceItemCostAllocations.forEach(alloc => {
        const serviceItem = serviceItems[alloc.itemIndex];
        if (serviceItem) {
          console.log(`용역품목 "${serviceItem.item}" (ID: ${serviceItem.id}) 비용분배:`, alloc);
          
          // 비용분배 정보를 costDepartments에 추가
          additionalServiceCostDepartments.push({
            proposalId: proposal.id,
            department: alloc.department,
            amount: alloc.type === 'percentage' ? (serviceItem.contractAmount * (alloc.value / 100)) : alloc.value,
            ratio: alloc.value,
            serviceItemId: serviceItem.id,
            allocationType: alloc.type
          });
        }
      });
      
      if (additionalServiceCostDepartments.length > 0) {
        console.log('추가할 용역품목 비용귀속부서 데이터:', additionalServiceCostDepartments);
        await models.CostDepartment.bulkCreate(additionalServiceCostDepartments);
      }
    }

    // 요청부서 생성 (임시저장)
    console.log('=== 요청부서 데이터 처리 (임시저장) ===');
    console.log('받은 requestDepartments:', proposalData.requestDepartments);
    
    if (proposalData.requestDepartments && proposalData.requestDepartments.length > 0) {
      const requestDepartments = proposalData.requestDepartments
        .filter(dept => {
          // null이나 undefined가 아닌 유효한 데이터만 필터링
          const deptName = typeof dept === 'string' ? dept : (dept.department || dept.name || '');
          return deptName && deptName.trim() !== '';
        })
        .map(dept => {
          const deptName = typeof dept === 'string' ? dept : (dept.department || dept.name || '');
          return {
            proposalId: proposal.id,
            department: deptName.trim(), // ✅ department 필드로 변경
            departmentId: typeof dept === 'object' ? (dept.departmentId || dept.id || null) : null
          };
        })
        .filter(dept => {
          // 최종 검증: department가 유효한지 확인
          return dept.department && dept.department.trim() !== '';
        });
      
      if (requestDepartments.length > 0) {
        console.log('저장할 요청부서 데이터:', requestDepartments);
        await models.RequestDepartment.bulkCreate(requestDepartments);
      }
    }

    // 결재라인 생성
    if (proposalData.approvalLine && proposalData.approvalLine.length > 0) {
      const approvalLines = proposalData.approvalLine.map((line, index) => ({
        proposalId: proposal.id,
        step: index + 1,
        name: line.name,
        title: line.title,
        description: line.description,
        isConditional: line.conditional || false,
        isFinal: line.final || false,
        status: 'pending'
      }));
      await models.ApprovalLine.bulkCreate(approvalLines);
    }

    res.status(201).json({
      message: '품의서가 임시저장되었습니다.',
      proposalId: proposal.id
    });
  } catch (error) {
    console.error('=== 임시저장 오류 상세 ===');
    console.error('오류 이름:', error.name);
    console.error('오류 메시지:', error.message);
    console.error('오류 스택:', error.stack);
    
    // 데이터베이스 오류인지 확인
    if (error.name === 'SequelizeValidationError') {
      console.error('검증 오류:', error.errors);
      return res.status(400).json({ 
        error: '입력 데이터가 올바르지 않습니다. 필수 필드를 확인해주세요.',
        details: error.errors.map(e => e.message)
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('중복 제약 오류:', error.errors);
      return res.status(409).json({ 
        error: '이미 존재하는 품의서입니다.',
        details: error.errors.map(e => e.message)
      });
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      console.error('외래키 제약 오류:', error.message);
      console.error('참조 테이블:', error.table);
      console.error('참조 필드:', error.fields);
      return res.status(400).json({ 
        error: '참조하는 데이터가 존재하지 않습니다. 예산이나 부서 정보를 확인해주세요.',
        details: error.message 
      });
    }
    
    console.error('기타 오류:', error);
    res.status(500).json({ 
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      details: error.message 
    });
  }
});

// 8-1. 사업예산 집행금액 수동 동기화
app.post('/api/sync-budget-execution', async (req, res) => {
  try {
    await updateBudgetExecutionAmount();
    res.json({ message: '사업예산 집행금액이 성공적으로 동기화되었습니다.' });
  } catch (error) {
    console.error('수동 동기화 실패:', error);
    res.status(500).json({ error: '동기화 중 오류가 발생했습니다.' });
  }
});

// 8-2. 품의서-사업예산 매칭 상태 확인 (디버깅용)
app.get('/api/debug/proposal-budget-mapping', async (req, res) => {
  try {
    // 1. 결재완료된 품의서 조회
    const approvedProposals = await sequelize.query(`
      SELECT 
        id,
        purpose,
        budget_id,
        total_amount,
        status
      FROM proposals 
      WHERE status = 'approved'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // 2. 사업예산 목록 조회
    const budgets = await sequelize.query(`
      SELECT 
        id,
        project_name,
        budget_amount,
        executed_amount
      FROM business_budgets 
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // 3. 매칭 상태 확인
    const matchingQuery = await sequelize.query(`
      SELECT 
        p.id as proposal_id,
        p.purpose,
        p.budget_id as proposal_budget,
        p.total_amount,
        bb.id as budget_id,
        bb.project_name as budget_project_name,
        bb.budget_amount
      FROM proposals p
      LEFT JOIN business_budgets bb ON p.budget_id = bb.id
      WHERE p.status = 'approved'
      ORDER BY p.created_at DESC
    `);

    // 4. 실제 집행금액 계산
    const executionQuery = await sequelize.query(`
      SELECT 
        p.budget_id as budget_id,
        COUNT(p.id) as proposal_count,
        SUM(p.total_amount) as total_executed
      FROM proposals p
      INNER JOIN business_budgets bb ON p.budget_id = bb.id
      WHERE p.status = 'approved'
      GROUP BY p.budget_id
      ORDER BY total_executed DESC
    `);

    res.json({
      approvedProposals: approvedProposals[0],
      budgets: budgets[0],
      matching: matchingQuery[0],
      executions: executionQuery[0]
    });
  } catch (error) {
    console.error('디버깅 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 9. 품의서 삭제
app.delete('/api/proposals/:id', async (req, res) => {
  try {
    const proposalId = req.params.id;
    const force = req.query.force === 'true'; // 강제 삭제 여부
    
    console.log('=== 품의서 삭제 요청 ===');
    console.log('삭제할 품의서 ID:', proposalId);
    console.log('강제 삭제 여부:', force);

    // 품의서 존재 여부 확인
    const proposal = await models.Proposal.findByPk(proposalId);
    if (!proposal) {
      return res.status(404).json({ 
        error: '삭제할 품의서를 찾을 수 없습니다.' 
      });
    }

    // 트랜잭션 시작
    const transaction = await sequelize.transaction();
    
    try {
      // 관련 데이터 삭제 (외래키 제약조건을 고려한 순서)
      console.log('🗑️ 관련 데이터 삭제 시작...');
      
      // 1. 먼저 참조하는 테이블들 삭제
      await models.CostDepartment.destroy({ 
        where: { proposalId: proposalId }, 
        transaction 
      });
      console.log('✅ CostDepartment 삭제 완료');
      
      await models.RequestDepartment.destroy({ 
        where: { proposalId: proposalId }, 
        transaction 
      });
      console.log('✅ RequestDepartment 삭제 완료');
      
      await models.ApprovalLine.destroy({ 
        where: { proposalId: proposalId }, 
        transaction 
      });
      console.log('✅ ApprovalLine 삭제 완료');
      
      // 2. 그 다음 참조되는 테이블들 삭제
      await models.PurchaseItem.destroy({ 
        where: { proposalId: proposalId }, 
        transaction 
      });
      console.log('✅ PurchaseItem 삭제 완료');
      
      await models.ServiceItem.destroy({ 
        where: { proposalId: proposalId }, 
        transaction 
      });
      console.log('✅ ServiceItem 삭제 완료');
      
      // 3. 마지막으로 품의서 삭제
      await proposal.destroy({ transaction });
      console.log('✅ 품의서 삭제 완료');
      
      // 트랜잭션 커밋
      await transaction.commit();
      console.log('✅ 모든 삭제 작업 완료');
      
    } catch (error) {
      // 트랜잭션 롤백
      await transaction.rollback();
      console.error('❌ 삭제 작업 실패:', error);
      throw error;
    }

    console.log('✅ 품의서 삭제 완료:', proposalId);
    
    res.json({ 
      message: '품의서가 성공적으로 삭제되었습니다.',
      deletedId: proposalId
    });
      } catch (error) {
      console.error('=== 품의서 삭제 오류 ===');
      console.error('오류 이름:', error.name);
      console.error('오류 메시지:', error.message);
      console.error('오류 스택:', error.stack);
      
      // 구체적인 에러 메시지 제공
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
          error: '관련 데이터가 있어서 삭제할 수 없습니다. 강제 삭제를 원하시면 ?force=true를 추가해주세요.',
          details: error.message,
          suggestion: '강제 삭제: DELETE /api/proposals/' + proposalId + '?force=true'
        });
      }
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: '삭제할 수 없는 상태의 품의서입니다.',
          details: error.errors.map(e => e.message)
        });
      }
      
      res.status(500).json({ 
        error: '품의서 삭제 중 오류가 발생했습니다.',
        details: error.message 
      });
    }
});

// 마이그레이션 엔드포인트 추가
app.post('/api/migrate-contract-period', async (req, res) => {
  try {
    console.log('🔄 계약기간 필드 마이그레이션 시작...');

    // 트랜잭션 시작
    const transaction = await sequelize.transaction();

    try {
      // 1. 새로운 컬럼 추가 (이미 존재할 수 있으므로 에러 무시)
      try {
        await sequelize.query(`
          ALTER TABLE purchase_items 
          ADD COLUMN contract_period_type VARCHAR(50) DEFAULT 'permanent'
        `, { transaction });
        console.log('✅ contract_period_type 컬럼 추가 완료');
      } catch (e) {
        console.log('ℹ️ contract_period_type 컬럼이 이미 존재하거나 추가할 수 없음');
      }

      try {
        await sequelize.query(`
          ALTER TABLE purchase_items 
          ADD COLUMN custom_contract_period TEXT
        `, { transaction });
        console.log('✅ custom_contract_period 컬럼 추가 완료');
      } catch (e) {
        console.log('ℹ️ custom_contract_period 컬럼이 이미 존재하거나 추가할 수 없음');
      }

      // 2. 기존 데이터를 새로운 구조로 변환
      console.log('🔄 기존 데이터 변환 중...');
      
      const updateResult = await sequelize.query(`
        UPDATE purchase_items 
        SET contract_period_type = 'permanent', 
            custom_contract_period = NULL
        WHERE contract_period_type IS NULL OR contract_period_type = ''
      `, { transaction });

      console.log('✅ 데이터 업데이트 완료:', updateResult[0]);

      await transaction.commit();
      console.log('✅ 계약기간 필드 마이그레이션 완료!');

      // 마이그레이션 결과 확인
      const result = await sequelize.query(`
        SELECT id, item, contract_period_type, custom_contract_period 
        FROM purchase_items 
        LIMIT 10
      `);

      res.json({
        success: true,
        message: '계약기간 필드 마이그레이션이 완료되었습니다.',
        sampleData: result[0]
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    res.status(500).json({
      success: false,
      message: '마이그레이션 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 데이터베이스 스키마 자동 업데이트 함수
async function updateDatabaseSchema() {
  try {
    console.log('🔄 데이터베이스 스키마 확인 중...');
    
    // PostgreSQL용 컬럼 정보 확인
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'purchase_items'
    `);
    const columns = results.map(col => col.column_name);
    
    console.log('📋 현재 컬럼:', columns);
    
    // contract_period_type 컬럼이 없으면 추가
    if (!columns.includes('contract_period_type')) {
      console.log('➕ contract_period_type 컬럼 추가 중...');
      await sequelize.query(`ALTER TABLE purchase_items ADD COLUMN contract_period_type VARCHAR(50) DEFAULT 'permanent'`);
      console.log('✅ contract_period_type 컬럼 추가 완료');
    }
    
    // contract_start_date 컬럼이 없으면 추가
    if (!columns.includes('contract_start_date')) {
      console.log('➕ contract_start_date 컬럼 추가 중...');
      await sequelize.query(`ALTER TABLE purchase_items ADD COLUMN contract_start_date DATE`);
      console.log('✅ contract_start_date 컬럼 추가 완료');
    }
    
    // contract_end_date 컬럼이 없으면 추가
    if (!columns.includes('contract_end_date')) {
      console.log('➕ contract_end_date 컬럼 추가 중...');
      await sequelize.query(`ALTER TABLE purchase_items ADD COLUMN contract_end_date DATE`);
      console.log('✅ contract_end_date 컬럼 추가 완료');
    }
    
    // contract_start_date 컬럼을 proposals 테이블에도 추가
    const [proposalsResults] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'proposals'
    `);
    const proposalsColumns = proposalsResults.map(col => col.column_name);
    
    if (!proposalsColumns.includes('contract_start_date')) {
      console.log('➕ proposals 테이블에 contract_start_date 컬럼 추가 중...');
      await sequelize.query(`ALTER TABLE proposals ADD COLUMN contract_start_date DATE`);
      console.log('✅ proposals contract_start_date 컬럼 추가 완료');
    }
    
    if (!proposalsColumns.includes('contract_end_date')) {
      console.log('➕ proposals 테이블에 contract_end_date 컬럼 추가 중...');
      await sequelize.query(`ALTER TABLE proposals ADD COLUMN contract_end_date DATE`);
      console.log('✅ proposals contract_end_date 컬럼 추가 완료');
    }

    // 기존 데이터 업데이트
    await sequelize.query(`UPDATE purchase_items SET contract_period_type = 'permanent' WHERE contract_period_type IS NULL`);
    console.log('✅ 기존 데이터 업데이트 완료');
    
    // ============================================================
    // 프로젝트 관리 테이블 추가
    // ============================================================
    console.log('🔄 프로젝트 관리 테이블 확인 중...');
    
    // projects 테이블 존재 여부 확인
    const [tableCheck] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'projects'
    `);
    
    if (tableCheck.length === 0) {
      console.log('➕ projects 테이블 생성 중...');
      await sequelize.query(`
        CREATE TABLE projects (
          id SERIAL PRIMARY KEY,
          
          -- 기본 정보
          project_code VARCHAR(50) UNIQUE NOT NULL,
          business_budget_id INTEGER,
          project_name VARCHAR(255) NOT NULL,
          budget_year INTEGER NOT NULL,
          
          -- 부서 정보
          initiator_department VARCHAR(100),
          executor_department VARCHAR(100),
          
          -- 예산 정보
          budget_amount NUMERIC(15, 2) DEFAULT 0,
          executed_amount NUMERIC(15, 2) DEFAULT 0,
          
          -- 프로젝트 관리 정보
          is_it_committee BOOLEAN DEFAULT false,
          status VARCHAR(50) DEFAULT '진행중',
          progress_rate NUMERIC(5, 2) DEFAULT 0,
          execution_rate NUMERIC(5, 2) DEFAULT 0,
          health_status VARCHAR(20) DEFAULT '양호',
          start_date DATE,
          deadline DATE,
          pm VARCHAR(100),
          issues TEXT,
          shared_folder_path VARCHAR(500),
          
          -- 메타 정보
          created_by VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (business_budget_id) REFERENCES business_budgets(id) ON DELETE SET NULL
        )
      `);
      console.log('✅ projects 테이블 생성 완료');
      
      // 인덱스 추가
      await sequelize.query(`CREATE INDEX idx_projects_code ON projects(project_code)`);
      await sequelize.query(`CREATE INDEX idx_projects_budget_id ON projects(business_budget_id)`);
      await sequelize.query(`CREATE INDEX idx_projects_year ON projects(budget_year)`);
      console.log('✅ projects 테이블 인덱스 생성 완료');
    } else {
      console.log('✅ projects 테이블이 이미 존재합니다');
      
      // 기존 테이블에 health_status 컬럼 추가 (없는 경우)
      const [projectColumns] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'projects'
      `);
      const projectColumnNames = projectColumns.map(col => col.column_name);
      
      if (!projectColumnNames.includes('health_status')) {
        console.log('➕ projects 테이블에 health_status 컬럼 추가 중...');
        await sequelize.query(`ALTER TABLE projects ADD COLUMN health_status VARCHAR(20) DEFAULT '양호'`);
        console.log('✅ health_status 컬럼 추가 완료');
      }
      
      if (!projectColumnNames.includes('shared_folder_path')) {
        console.log('➕ projects 테이블에 shared_folder_path 컬럼 추가 중...');
        await sequelize.query(`ALTER TABLE projects ADD COLUMN shared_folder_path VARCHAR(500)`);
        console.log('✅ shared_folder_path 컬럼 추가 완료');
      }
      
      if (!projectColumnNames.includes('execution_rate')) {
        console.log('➕ projects 테이블에 execution_rate 컬럼 추가 중...');
        await sequelize.query(`ALTER TABLE projects ADD COLUMN execution_rate NUMERIC(5, 2) DEFAULT 0`);
        console.log('✅ execution_rate 컬럼 추가 완료');
      }
    }
    
    // ============================================================
    // project_budgets 중간 테이블 (프로젝트-사업예산 다대다 관계)
    // ============================================================
    const [projectBudgetsCheck] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'project_budgets'
    `);
    
    if (projectBudgetsCheck.length === 0) {
      console.log('➕ project_budgets 테이블 생성 중...');
      await sequelize.query(`
        CREATE TABLE project_budgets (
          id SERIAL PRIMARY KEY,
          project_id INTEGER NOT NULL,
          business_budget_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (business_budget_id) REFERENCES business_budgets(id) ON DELETE CASCADE,
          UNIQUE(project_id, business_budget_id)
        )
      `);
      console.log('✅ project_budgets 테이블 생성 완료');
      
      // 인덱스 추가
      await sequelize.query(`CREATE INDEX idx_project_budgets_project ON project_budgets(project_id)`);
      await sequelize.query(`CREATE INDEX idx_project_budgets_budget ON project_budgets(business_budget_id)`);
      console.log('✅ project_budgets 테이블 인덱스 생성 완료');
    } else {
      console.log('✅ project_budgets 테이블이 이미 존재합니다');
    }
    
    // ============================================================
    // business_budgets confirmed_execution_amount 초기화
    // ============================================================
    console.log('🔄 사업예산 confirmed_execution_amount 확인 중...');
    
    // confirmed_execution_amount가 NULL이거나 0인 레코드 확인
    const [budgetsToUpdate] = await sequelize.query(`
      SELECT id, executed_amount, confirmed_execution_amount
      FROM business_budgets
      WHERE confirmed_execution_amount IS NULL OR confirmed_execution_amount = 0
    `);
    
    if (budgetsToUpdate.length > 0) {
      console.log(`➕ ${budgetsToUpdate.length}개 사업예산의 confirmed_execution_amount 초기화 중...`);
      
      // confirmed_execution_amount를 0으로 초기화 (사용자가 직접 입력해야 함)
      await sequelize.query(`
        UPDATE business_budgets 
        SET confirmed_execution_amount = 0
        WHERE confirmed_execution_amount IS NULL
      `);
      
      console.log('✅ confirmed_execution_amount 초기화 완료 (사업예산 수정 화면에서 값을 입력해주세요)');
    } else {
      console.log('✅ confirmed_execution_amount가 모두 설정되어 있습니다');
    }
    
  } catch (error) {
    console.error('⚠️ 스키마 업데이트 중 오류 (무시하고 계속):', error.message);
  }
}

// ============================================================
// 프로젝트 코드 자동생성 함수 (MIT-25001 형식)
// ============================================================
async function generateProjectCode(year) {
  try {
    const yearPrefix = year.toString().slice(-2); // 2025 → 25
    
    // 해당 연도의 마지막 프로젝트 코드 조회
    const [lastProject] = await sequelize.query(`
      SELECT project_code 
      FROM projects 
      WHERE budget_year = ?
        AND project_code LIKE 'MIT-${yearPrefix}%'
      ORDER BY project_code DESC 
      LIMIT 1
    `, {
      replacements: [year]
    });
    
    let nextNumber = 1;
    
    if (lastProject.length > 0) {
      // MIT-25001 → 001 추출 → 1 → 2
      const lastCode = lastProject[0].project_code;
      const lastNumber = parseInt(lastCode.split('-')[1].slice(2));
      nextNumber = lastNumber + 1;
    }
    
    // MIT-25001 형식으로 생성
    const projectCode = `MIT-${yearPrefix}${String(nextNumber).padStart(3, '0')}`;
    
    console.log(`📋 프로젝트 코드 생성: ${projectCode} (${year}년도)`);
    
    return projectCode;
  } catch (error) {
    console.error('프로젝트 코드 생성 실패:', error);
    // 실패 시 임시 코드 반환
    return `MIT-${year.toString().slice(-2)}TMP`;
  }
}

// ============================================================
// 프로젝트 관리 API
// ============================================================

// 4-1. 프로젝트 목록 조회
app.get('/api/projects', async (req, res) => {
  try {
    const { year, status, department } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const replacements = [];
    
    if (year) {
      whereClause += ' AND p.budget_year = ?';
      replacements.push(parseInt(year));
    }
    
    if (status) {
      whereClause += ' AND p.status = ?';
      replacements.push(status);
    }
    
    if (department) {
      whereClause += ' AND (p.initiator_department = ? OR p.executor_department = ?)';
      replacements.push(department, department);
    }
    
    const [projects] = await sequelize.query(`
      SELECT 
        p.*,
        bb.project_name as business_budget_name,
        bb.budget_category,
        bb.budget_amount as bb_budget_amount,
        COALESCE((
          SELECT SUM(pr.total_amount) 
          FROM proposals pr 
          WHERE pr.budget_id = bb.id AND pr.status = 'approved'
        ), 0) as bb_executed_amount
      FROM projects p
      LEFT JOIN business_budgets bb ON p.business_budget_id = bb.id
      ${whereClause}
      ORDER BY p.created_at DESC
    `, {
      replacements
    });
    
    // 각 프로젝트에 연결된 사업예산 목록 조회 및 합계 계산
    for (let project of projects) {
      // 다대다 관계의 연결된 사업예산 조회 (확정집행액 실시간 계산)
      const [linkedBudgets] = await sequelize.query(`
        SELECT 
          bb.id, 
          bb.project_name,
          bb.budget_amount,
          COALESCE(SUM(CASE WHEN p.status = 'approved' THEN p.total_amount ELSE 0 END), 0) as executed_amount
        FROM project_budgets pb
        JOIN business_budgets bb ON pb.business_budget_id = bb.id
        LEFT JOIN proposals p ON p.budget_id = bb.id
        WHERE pb.project_id = ?
        GROUP BY bb.id, bb.project_name, bb.budget_amount
      `, {
        replacements: [project.id]
      });
      // 단일 사업예산도 linked_budgets에 포함시키기
      if (project.business_budget_id && project.business_budget_name) {
        // 단일 사업예산이 이미 linked_budgets에 있는지 확인
        const alreadyLinked = linkedBudgets.some(b => b.id === project.business_budget_id);
        
        if (!alreadyLinked) {
          // 단일 사업예산을 linked_budgets 맨 앞에 추가
          linkedBudgets.unshift({
            id: project.business_budget_id,
            project_name: project.business_budget_name,
            budget_amount: project.bb_budget_amount || 0,
            executed_amount: project.bb_executed_amount || 0
          });
        }
      }
      
      project.linked_budgets = linkedBudgets;
      
      // 모든 연결된 사업예산(단일 + 다중)의 합계를 프로젝트 예산/집행액에 반영
      if (linkedBudgets.length > 0) {
        const totalBudget = linkedBudgets.reduce((sum, b) => 
          sum + (parseFloat(b.budget_amount) || 0), 0
        );
        const totalExecuted = linkedBudgets.reduce((sum, b) => 
          sum + (parseFloat(b.executed_amount) || 0), 0
        );
        
        project.budget_amount = totalBudget;
        project.executed_amount = totalExecuted;
      }
      
      // 임시 필드 제거
      delete project.bb_budget_amount;
      delete project.bb_executed_amount;
    }
    
    console.log(`✅ 프로젝트 목록 조회: ${projects.length}개`);
    res.json(projects);
  } catch (error) {
    console.error('프로젝트 목록 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4-2. 프로젝트 상세 조회
app.get('/api/projects/:id', async (req, res) => {
  try {
    const [project] = await sequelize.query(`
      SELECT 
        p.*,
        bb.project_name as business_budget_name,
        bb.budget_category,
        bb.project_purpose,
        bb.budget_amount as bb_budget_amount,
        COALESCE((
          SELECT SUM(pr.total_amount) 
          FROM proposals pr 
          WHERE pr.budget_id = bb.id AND pr.status = 'approved'
        ), 0) as bb_executed_amount
      FROM projects p
      LEFT JOIN business_budgets bb ON p.business_budget_id = bb.id
      WHERE p.id = ?
    `, {
      replacements: [req.params.id]
    });
    
    if (project.length === 0) {
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
    }
    
    const projectData = project[0];
    
    // 연결된 사업예산 목록 조회 (확정집행액 실시간 계산)
    const [linkedBudgets] = await sequelize.query(`
      SELECT 
        bb.id, 
        bb.project_name,
        bb.budget_amount,
        COALESCE(SUM(CASE WHEN p.status = 'approved' THEN p.total_amount ELSE 0 END), 0) as executed_amount
      FROM project_budgets pb
      JOIN business_budgets bb ON pb.business_budget_id = bb.id
      LEFT JOIN proposals p ON p.budget_id = bb.id
      WHERE pb.project_id = ?
      GROUP BY bb.id, bb.project_name, bb.budget_amount
    `, {
      replacements: [req.params.id]
    });
    
    // 단일 사업예산도 linked_budgets에 포함시키기
    if (projectData.business_budget_id && projectData.business_budget_name) {
      // 단일 사업예산이 이미 linked_budgets에 있는지 확인
      const alreadyLinked = linkedBudgets.some(b => b.id === projectData.business_budget_id);
      
      if (!alreadyLinked) {
        // 단일 사업예산을 linked_budgets 맨 앞에 추가
        linkedBudgets.unshift({
          id: projectData.business_budget_id,
          project_name: projectData.business_budget_name,
          budget_amount: projectData.bb_budget_amount || 0,
          executed_amount: projectData.bb_executed_amount || 0
        });
      }
    }
    
    projectData.linked_budgets = linkedBudgets;
    
    // 모든 연결된 사업예산(단일 + 다중)의 합계를 프로젝트 예산/집행액에 반영
    if (linkedBudgets.length > 0) {
      const totalBudget = linkedBudgets.reduce((sum, b) => 
        sum + (parseFloat(b.budget_amount) || 0), 0
      );
      const totalExecuted = linkedBudgets.reduce((sum, b) => 
        sum + (parseFloat(b.executed_amount) || 0), 0
      );
      
      projectData.budget_amount = totalBudget;
      projectData.executed_amount = totalExecuted;
    }
    
    // 임시 필드 제거
    delete projectData.bb_budget_amount;
    delete projectData.bb_executed_amount;
    
    res.json(projectData);
  } catch (error) {
    console.error('프로젝트 상세 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 날짜 유효성 검증 함수 (YYYY-MM-DD 형식)
function validateDate(dateString) {
  if (!dateString) return null;
  
  // YYYY-MM-DD 형식 검증
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    console.warn(`⚠️  잘못된 날짜 형식: ${dateString} → NULL로 변환`);
    return null;
  }
  
  // 실제 날짜 유효성 검증
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.warn(`⚠️  유효하지 않은 날짜: ${dateString} → NULL로 변환`);
    return null;
  }
  
  return dateString;
}

// 4-3. 사업예산에서 프로젝트 생성
app.post('/api/projects/from-budget/:budgetId', async (req, res) => {
  try {
    const budgetId = req.params.budgetId;
    
    // 사업예산 정보 조회
    const [budget] = await sequelize.query(`
      SELECT * FROM business_budgets WHERE id = ?
    `, {
      replacements: [budgetId]
    });
    
    if (budget.length === 0) {
      return res.status(404).json({ error: '사업예산을 찾을 수 없습니다.' });
    }
    
    const budgetData = budget[0];
    
    // 이미 프로젝트가 생성되었는지 확인
    const [existing] = await sequelize.query(`
      SELECT id FROM projects WHERE business_budget_id = ?
    `, {
      replacements: [budgetId]
    });
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        error: '이미 프로젝트가 생성된 사업예산입니다.',
        projectId: existing[0].id 
      });
    }
    
    // 프로젝트 코드 자동생성
    const projectCode = await generateProjectCode(budgetData.budget_year);
    
    // 날짜 유효성 검증
    const startDate = validateDate(budgetData.start_date);
    const deadline = validateDate(budgetData.end_date);
    
    console.log(`📅 날짜 검증:`);
    console.log(`   원본 start_date: ${budgetData.start_date} → ${startDate}`);
    console.log(`   원본 end_date: ${budgetData.end_date} → ${deadline}`);
    
    // 프로젝트 생성 (집행액은 사업예산에서 JOIN으로 조회하므로 0으로 저장)
    const [result] = await sequelize.query(`
      INSERT INTO projects (
        project_code,
        business_budget_id,
        project_name,
        budget_year,
        initiator_department,
        executor_department,
        budget_amount,
        executed_amount,
        status,
        progress_rate,
        start_date,
        deadline,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, '진행중', 0, ?, ?, ?)
      RETURNING id
    `, {
      replacements: [
        projectCode,
        budgetId,
        budgetData.project_name,
        budgetData.budget_year,
        budgetData.initiator_department,
        budgetData.executor_department,
        budgetData.budget_amount,
        startDate,
        deadline,
        req.body.createdBy || '관리자'
      ]
    });
    
    console.log(`✅ 프로젝트 생성: ${projectCode} (사업예산 ID: ${budgetId})`);
    
    res.json({
      success: true,
      projectId: result[0].id,
      projectCode: projectCode,
      message: `프로젝트 ${projectCode}가 생성되었습니다.`
    });
  } catch (error) {
    console.error('프로젝트 생성 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4-4. 프로젝트 수정
app.put('/api/projects/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const updateData = req.body;
    
    const updates = [];
    const replacements = [];
    
    // 수정 가능한 필드들 (executed_amount는 제외 - 사업예산에서 JOIN으로 조회)
    const allowedFields = [
      'project_name', 'is_it_committee', 'status', 'progress_rate', 'execution_rate', 'health_status',
      'start_date', 'deadline', 'pm', 'issues', 'shared_folder_path',
      'budget_amount'
    ];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        replacements.push(updateData[field]);
      }
    });
    
    if (updates.length === 0) {
      return res.status(400).json({ error: '수정할 데이터가 없습니다.' });
    }
    
    // updated_at 추가
    updates.push('updated_at = CURRENT_TIMESTAMP');
    replacements.push(projectId);
    
    await sequelize.query(`
      UPDATE projects 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, {
      replacements
    });
    
    console.log(`✅ 프로젝트 수정: ID ${projectId}`);
    
    res.json({
      success: true,
      message: '프로젝트가 수정되었습니다.'
    });
  } catch (error) {
    console.error('프로젝트 수정 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4-5. 프로젝트 수기 등록 (여러 사업예산을 하나의 프로젝트로)
app.post('/api/projects/manual', async (req, res) => {
  try {
    const { 
      projectName, 
      budgetYear, 
      initiatorDepartment, 
      executorDepartment, 
      budgetIds, // 배열: 선택된 사업예산 ID들
      isItCommittee,
      createdBy 
    } = req.body;
    
    console.log('📋 프로젝트 수기 등록 시작:', {
      projectName, budgetYear, initiatorDepartment, executorDepartment, 
      budgetIds, isItCommittee
    });
    
    // 입력값 검증
    if (!projectName || !budgetYear || !budgetIds || budgetIds.length === 0) {
      return res.status(400).json({ 
        error: '프로젝트명, 연도, 관련 사업예산은 필수입니다.' 
      });
    }
    
    // 프로젝트 코드 자동생성
    const projectCode = await generateProjectCode(budgetYear);
    
    // 선택된 사업예산들의 정보 조회 및 합산
    const [budgets] = await sequelize.query(`
      SELECT id, budget_amount, confirmed_execution_amount 
      FROM business_budgets 
      WHERE id IN (${budgetIds.map(() => '?').join(',')})
    `, {
      replacements: budgetIds
    });
    
    if (budgets.length === 0) {
      return res.status(400).json({ error: '유효한 사업예산을 찾을 수 없습니다.' });
    }
    
    // 예산액 합산 (집행액은 project_budgets JOIN으로 조회)
    const totalBudgetAmount = budgets.reduce((sum, b) => sum + parseFloat(b.budget_amount || 0), 0);
    
    console.log(`💰 예산 합산: 예산액=${totalBudgetAmount}`);
    
    // 프로젝트 생성 (집행액은 0으로, 조회 시 linked_budgets에서 합산)
    const [result] = await sequelize.query(`
      INSERT INTO projects (
        project_code,
        project_name,
        budget_year,
        initiator_department,
        executor_department,
        budget_amount,
        executed_amount,
        is_it_committee,
        status,
        progress_rate,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, '진행중', 0, ?)
      RETURNING id
    `, {
      replacements: [
        projectCode,
        projectName,
        budgetYear,
        initiatorDepartment || null,
        executorDepartment || null,
        totalBudgetAmount,
        isItCommittee || false,
        createdBy || '관리자'
      ]
    });
    
    const projectId = result[0].id;
    
    // project_budgets 중간 테이블에 연결 정보 저장
    for (const budgetId of budgetIds) {
      await sequelize.query(`
        INSERT INTO project_budgets (project_id, business_budget_id)
        VALUES (?, ?)
      `, {
        replacements: [projectId, budgetId]
      });
    }
    
    console.log(`✅ 프로젝트 생성: ${projectCode} (ID: ${projectId})`);
    console.log(`   연결된 사업예산: ${budgetIds.length}개`);
    
    res.json({
      success: true,
      projectId: projectId,
      projectCode: projectCode,
      message: `프로젝트 ${projectCode}가 생성되었습니다.`
    });
  } catch (error) {
    console.error('프로젝트 수기 등록 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4-6. 프로젝트에 사업예산 추가
app.post('/api/projects/:projectId/budgets', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { budgetIds } = req.body;
    
    if (!budgetIds || !Array.isArray(budgetIds) || budgetIds.length === 0) {
      return res.status(400).json({ error: '추가할 사업예산을 선택해주세요.' });
    }
    
    console.log(`📎 프로젝트 ${projectId}에 사업예산 추가:`, budgetIds);
    
    // 각 사업예산을 project_budgets에 추가
    for (const budgetId of budgetIds) {
      // 이미 연결되어 있는지 확인
      const [existing] = await sequelize.query(`
        SELECT id FROM project_budgets 
        WHERE project_id = ? AND business_budget_id = ?
      `, {
        replacements: [projectId, budgetId]
      });
      
      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO project_budgets (project_id, business_budget_id)
          VALUES (?, ?)
        `, {
          replacements: [projectId, budgetId]
        });
      }
    }
    
    // 프로젝트의 총 예산액 재계산 (집행액은 조회 시 JOIN으로 계산)
    const [budgets] = await sequelize.query(`
      SELECT 
        COALESCE(SUM(bb.budget_amount), 0) as total_budget
      FROM project_budgets pb
      JOIN business_budgets bb ON pb.business_budget_id = bb.id
      WHERE pb.project_id = ?
    `, {
      replacements: [projectId]
    });
    
    // 프로젝트 예산액만 업데이트 (집행액은 사업예산에서 JOIN으로 조회)
    await sequelize.query(`
      UPDATE projects 
      SET budget_amount = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, {
      replacements: [budgets[0].total_budget, projectId]
    });
    
    console.log(`✅ 사업예산 추가 완료: ${budgetIds.length}개`);
    
    res.json({
      success: true,
      message: `${budgetIds.length}개의 사업예산이 추가되었습니다.`
    });
  } catch (error) {
    console.error('사업예산 추가 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4-7. 프로젝트에서 사업예산 삭제
app.delete('/api/projects/:projectId/budgets/:budgetId', async (req, res) => {
  try {
    const { projectId, budgetId } = req.params;
    
    console.log(`🗑️ 프로젝트 ${projectId}에서 사업예산 ${budgetId} 삭제`);
    
    // project_budgets에서 삭제
    await sequelize.query(`
      DELETE FROM project_budgets 
      WHERE project_id = ? AND business_budget_id = ?
    `, {
      replacements: [projectId, budgetId]
    });
    
    // 프로젝트의 총 예산액 재계산 (집행액은 조회 시 JOIN으로 계산)
    const [budgets] = await sequelize.query(`
      SELECT 
        COALESCE(SUM(bb.budget_amount), 0) as total_budget
      FROM project_budgets pb
      JOIN business_budgets bb ON pb.business_budget_id = bb.id
      WHERE pb.project_id = ?
    `, {
      replacements: [projectId]
    });
    
    // 프로젝트 예산액만 업데이트 (집행액은 사업예산에서 JOIN으로 조회)
    await sequelize.query(`
      UPDATE projects 
      SET budget_amount = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, {
      replacements: [budgets[0].total_budget, projectId]
    });
    
    console.log(`✅ 사업예산 삭제 완료`);
    
    res.json({
      success: true,
      message: '사업예산이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('사업예산 삭제 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4-8. 프로젝트 삭제
app.delete('/api/projects/:id', async (req, res) => {
  try {
    await sequelize.query(`
      DELETE FROM projects WHERE id = ?
    `, {
      replacements: [req.params.id]
    });
    
    console.log(`✅ 프로젝트 삭제: ID ${req.params.id}`);
    
    res.json({
      success: true,
      message: '프로젝트가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('프로젝트 삭제 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI 어시스턴스 API 엔드포인트들
// 통계 요약 API
app.get('/api/statistics/summary', async (req, res) => {
  try {
    console.log('통계 요약 API 호출됨');
    
    // 품의서 통계 - 더 안전한 쿼리
    const [proposalStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_proposals,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN contract_type = 'purchase' THEN 1 ELSE 0 END) as purchase_count,
        SUM(CASE WHEN contract_type = 'service' THEN 1 ELSE 0 END) as service_count,
        SUM(CASE WHEN contract_type = 'change' THEN 1 ELSE 0 END) as change_count,
        SUM(CASE WHEN contract_type = 'extension' THEN 1 ELSE 0 END) as extension_count,
        SUM(CASE WHEN contract_type = 'bidding' THEN 1 ELSE 0 END) as bidding_count,
        COALESCE(SUM(CASE WHEN total_amount IS NOT NULL THEN CAST(total_amount AS NUMERIC) ELSE 0 END), 0) as total_contract_amount
      FROM proposals
    `);

    console.log('품의서 통계 조회 완료:', proposalStats[0]);

    // 최근 활동 - 더 간단한 쿼리
    let recentActivity = [];
    try {
      const [activityResults] = await sequelize.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM proposals 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) DESC
        LIMIT 7
      `);
      recentActivity = activityResults;
    } catch (activityError) {
      console.log('최근 활동 조회 실패, 빈 배열로 대체:', activityError.message);
    }

    // 예산 통계 - 테이블 존재 여부 확인
    let budgetStats = [{ total_budgets: 0, total_budget_amount: 0, total_executed_amount: 0 }];
    try {
      const [budgetResults] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_budgets,
          COALESCE(SUM(CASE WHEN total_amount IS NOT NULL THEN CAST(total_amount AS NUMERIC) ELSE 0 END), 0) as total_budget_amount,
          COALESCE(SUM(CASE WHEN executed_amount IS NOT NULL THEN CAST(executed_amount AS NUMERIC) ELSE 0 END), 0) as total_executed_amount
        FROM business_budgets
        WHERE is_active = true OR is_active IS NULL
      `);
      budgetStats = budgetResults;
    } catch (budgetError) {
      console.log('예산 통계 조회 실패, 기본값 사용:', budgetError.message);
    }

    const result = {
      proposals: proposalStats[0] || {
        total_proposals: 0,
        draft_count: 0,
        submitted_count: 0,
        approved_count: 0,
        rejected_count: 0,
        purchase_count: 0,
        service_count: 0,
        change_count: 0,
        extension_count: 0,
        bidding_count: 0,
        total_contract_amount: 0
      },
      recentActivity: recentActivity || [],
      budgets: budgetStats[0] || {
        total_budgets: 0,
        total_budget_amount: 0,
        total_executed_amount: 0
      }
    };

    console.log('통계 요약 응답:', result);
    res.json(result);
  } catch (error) {
    console.error('통계 요약 조회 실패:', error);
    res.status(500).json({ 
      error: '통계 데이터 조회에 실패했습니다.',
      details: error.message,
      proposals: {
        total_proposals: 0,
        draft_count: 0,
        submitted_count: 0,
        approved_count: 0,
        rejected_count: 0,
        purchase_count: 0,
        service_count: 0,
        change_count: 0,
        extension_count: 0,
        bidding_count: 0,
        total_contract_amount: 0
      },
      recentActivity: [],
      budgets: {
        total_budgets: 0,
        total_budget_amount: 0,
        total_executed_amount: 0
      }
    });
  }
});

// AI 검색 API
app.post('/api/ai/search', async (req, res) => {
  try {
    const { query, filters = {} } = req.body;
    
    let whereClause = '1=1';
    let replacements = [];
    
    // 텍스트 검색
    if (query && query.trim()) {
      const searchTerms = query.trim().split(' ').filter(term => term.length > 0);
      const searchConditions = searchTerms.map(() => 
        '(purpose ILIKE ? OR basis ILIKE ? OR account_subject ILIKE ?)'
      ).join(' AND ');
      
      whereClause += ` AND (${searchConditions})`;
      searchTerms.forEach(term => {
        const likePattern = `%${term}%`;
        replacements.push(likePattern, likePattern, likePattern);
      });
    }
    
    // 필터 적용
    if (filters.contractType) {
      whereClause += ' AND contract_type = ?';
      replacements.push(filters.contractType);
    }
    
    if (filters.status) {
      whereClause += ' AND status = ?';
      replacements.push(filters.status);
    }
    
    if (filters.minAmount) {
      whereClause += ' AND CAST(total_amount AS DECIMAL) >= ?';
      replacements.push(filters.minAmount);
    }
    
    if (filters.maxAmount) {
      whereClause += ' AND CAST(total_amount AS DECIMAL) <= ?';
      replacements.push(filters.maxAmount);
    }

    const [results] = await sequelize.query(`
      SELECT 
        id,
        contract_type,
        purpose,
        basis,
        total_amount,
        status,
        account_subject,
        created_at,
        updated_at
      FROM proposals 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT 50
    `, { replacements });

    res.json({
      results: results || [],
      total: results?.length || 0
    });
  } catch (error) {
    console.error('AI 검색 실패:', error);
    res.status(500).json({ error: '검색에 실패했습니다.' });
  }
});

// AI 요약 API
app.get('/api/ai/summary/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 10 } = req.query;

    let results = [];
    
    switch (type) {
      case 'recent':
        const [recentProposals] = await sequelize.query(`
          SELECT 
            id,
            contract_type,
            purpose,
            total_amount,
            status,
            created_at
          FROM proposals 
          ORDER BY created_at DESC
          LIMIT ?
        `, { replacements: [parseInt(limit)] });
        results = recentProposals;
        break;
        
      case 'pending':
        const [pendingProposals] = await sequelize.query(`
          SELECT 
            id,
            contract_type,
            purpose,
            total_amount,
            status,
            created_at
          FROM proposals 
          WHERE status IN ('draft', 'submitted')
          ORDER BY created_at DESC
          LIMIT ?
        `, { replacements: [parseInt(limit)] });
        results = pendingProposals;
        break;
        
      case 'high-value':
        const [highValueProposals] = await sequelize.query(`
          SELECT 
            id,
            contract_type,
            purpose,
            total_amount,
            status,
            created_at
          FROM proposals 
          WHERE CAST(total_amount AS DECIMAL) > 1000000
          ORDER BY CAST(total_amount AS DECIMAL) DESC
          LIMIT ?
        `, { replacements: [parseInt(limit)] });
        results = highValueProposals;
        break;
        
      default:
        return res.status(400).json({ error: '지원하지 않는 요약 타입입니다.' });
    }

    res.json({
      type,
      results: results || [],
      total: results?.length || 0
    });
  } catch (error) {
    console.error('AI 요약 실패:', error);
    res.status(500).json({ error: '요약 생성에 실패했습니다.' });
  }
});

// 품목별 분석 API
app.get('/api/ai/item-analysis', async (req, res) => {
  try {
    console.log('품목별 분석 API 호출됨');
    
    // 구매 품목 분석
    const [purchaseItems] = await sequelize.query(`
      SELECT 
        pi.item,
        pi.product_name,
        COUNT(*) as purchase_count,
        SUM(pi.quantity) as total_quantity,
        SUM(CAST(pi.amount AS NUMERIC)) as total_amount,
        AVG(CAST(pi.unit_price AS NUMERIC)) as avg_unit_price,
        pi.supplier,
        COUNT(DISTINCT pi.supplier) as supplier_count
      FROM purchase_items pi
      JOIN proposals p ON pi.proposal_id = p.id
      WHERE p.status = 'approved'
      GROUP BY pi.item, pi.product_name, pi.supplier
      ORDER BY purchase_count DESC, total_amount DESC
      LIMIT 50
    `);

    // 용역 항목 분석
    const [serviceItems] = await sequelize.query(`
      SELECT 
        si.service_type,
        si.service_content,
        COUNT(*) as service_count,
        SUM(CAST(si.amount AS NUMERIC)) as total_amount,
        si.supplier
      FROM service_items si
      JOIN proposals p ON si.proposal_id = p.id
      WHERE p.status = 'approved'
      GROUP BY si.service_type, si.service_content, si.supplier
      ORDER BY service_count DESC, total_amount DESC
      LIMIT 50
    `);

    // 계정과목별 분석
    const [accountAnalysis] = await sequelize.query(`
      SELECT 
        account_subject,
        COUNT(*) as usage_count,
        SUM(CAST(total_amount AS NUMERIC)) as total_amount
      FROM proposals
      WHERE status = 'approved'
      GROUP BY account_subject
      ORDER BY usage_count DESC, total_amount DESC
      LIMIT 20
    `);

    // 공급업체별 분석
    const [supplierAnalysis] = await sequelize.query(`
      SELECT 
        supplier,
        COUNT(*) as contract_count,
        SUM(CAST(amount AS NUMERIC)) as total_amount
      FROM (
        SELECT supplier, amount FROM purchase_items pi 
        JOIN proposals p ON pi.proposal_id = p.id 
        WHERE p.status = 'approved'
        UNION ALL
        SELECT supplier, amount FROM service_items si 
        JOIN proposals p ON si.proposal_id = p.id 
        WHERE p.status = 'approved'
      ) combined
      GROUP BY supplier
      ORDER BY contract_count DESC, total_amount DESC
      LIMIT 20
    `);

    res.json({
      purchaseItems: purchaseItems || [],
      serviceItems: serviceItems || [],
      accountAnalysis: accountAnalysis || [],
      supplierAnalysis: supplierAnalysis || []
    });

  } catch (error) {
    console.error('품목별 분석 실패:', error);
    res.status(500).json({ 
      error: '품목 분석 중 오류가 발생했습니다.',
      details: error.message,
      purchaseItems: [],
      serviceItems: [],
      accountAnalysis: [],
      supplierAnalysis: []
    });
  }
});

// ========================================
// 5. 사업목적 관리 API
// ========================================

// 5-1. 사업목적 목록 조회 (연도별)
app.get('/api/project-purposes', async (req, res) => {
  try {
    const { year } = req.query;
    
    let query = 'SELECT * FROM project_purposes';
    const replacements = [];
    
    if (year) {
      query += ' WHERE year = ?';
      replacements.push(parseInt(year));
    }
    
    query += ' ORDER BY code ASC';
    
    const purposes = await sequelize.query(query, {
      replacements,
      type: Sequelize.QueryTypes.SELECT
    });
    
    res.json(purposes);
  } catch (error) {
    console.error('사업목적 조회 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5-2. 사업목적 추가
app.post('/api/project-purposes', async (req, res) => {
  try {
    const { code, description, year } = req.body;
    
    if (!code || !description || !year) {
      return res.status(400).json({ error: '코드, 설명, 연도는 필수입니다.' });
    }
    
    // 중복 체크
    const existing = await sequelize.query(
      'SELECT * FROM project_purposes WHERE code = ? AND year = ?',
      {
        replacements: [code, year],
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: '이미 존재하는 코드입니다.' });
    }
    
    await sequelize.query(
      'INSERT INTO project_purposes (code, description, year, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      {
        replacements: [code, description, year]
      }
    );
    
    res.json({ message: '사업목적이 추가되었습니다.' });
  } catch (error) {
    console.error('사업목적 추가 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5-3. 사업목적 수정
app.put('/api/project-purposes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, description, year } = req.body;
    
    // 고정 항목 체크
    const [existing] = await sequelize.query(
      'SELECT is_fixed FROM project_purposes WHERE id = ?',
      {
        replacements: [id],
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (existing && existing.is_fixed) {
      return res.status(403).json({ error: '정기구입(S)과 정보보호(Z) 코드는 수정할 수 없습니다.' });
    }
    
    await sequelize.query(
      'UPDATE project_purposes SET code = ?, description = ?, year = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      {
        replacements: [code, description, year, id]
      }
    );
    
    res.json({ message: '사업목적이 수정되었습니다.' });
  } catch (error) {
    console.error('사업목적 수정 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5-4. 사업목적 삭제
app.delete('/api/project-purposes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 고정 항목 체크
    const [existing] = await sequelize.query(
      'SELECT is_fixed FROM project_purposes WHERE id = ?',
      {
        replacements: [id],
        type: Sequelize.QueryTypes.SELECT
      }
    );
    
    if (existing && existing.is_fixed) {
      return res.status(403).json({ error: '정기구입(S)과 정보보호(Z) 코드는 삭제할 수 없습니다.' });
    }
    
    await sequelize.query(
      'DELETE FROM project_purposes WHERE id = ?',
      {
        replacements: [id]
      }
    );
    
    res.json({ message: '사업목적이 삭제되었습니다.' });
  } catch (error) {
    console.error('사업목적 삭제 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 6. 사업예산 변경이력 API
// ========================================

// 변경이력 저장 함수
async function saveBusinessBudgetHistory(budgetId, changeType, changedField, oldValue, newValue, changedBy) {
  try {
    // 사업예산 정보 조회 (사업명, 사업연도)
    const [budget] = await sequelize.query(
      'SELECT project_name, budget_year FROM business_budgets WHERE id = ?',
      {
        replacements: [budgetId],
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (!budget) {
      console.error('사업예산 정보를 찾을 수 없습니다:', budgetId);
      return;
    }

    await sequelize.query(
      `INSERT INTO business_budget_history 
        (budget_id, change_type, changed_field, old_value, new_value, changed_at, changed_by) 
       VALUES (?, ?, ?, ?, ?, timezone('Asia/Seoul', now()), ?)`,
      {
        replacements: [
          budgetId,
          changeType,
          changedField || null,
          oldValue !== undefined && oldValue !== null ? String(oldValue) : null,
          newValue !== undefined && newValue !== null ? String(newValue) : null,
          changedBy || 'system'
        ]
      }
    );
  } catch (error) {
    console.error('변경이력 저장 실패:', error);
  }
}

// 6-1. 변경이력 조회
app.get('/api/budget-history', async (req, res) => {
  try {
    const { budgetId, budgetYear, limit, offset } = req.query;
    
    let query = `
      SELECT 
        h.*,
        b.project_name as "projectName",
        b.budget_year as "budgetYear"
      FROM business_budget_history h
      LEFT JOIN business_budgets b ON h.budget_id = b.id
      WHERE 1=1
    `;
    const replacements = [];
    
    if (budgetId) {
      query += ' AND h.budget_id = ?';
      replacements.push(parseInt(budgetId));
    }
    
    if (budgetYear) {
      query += ' AND b.budget_year = ?';
      replacements.push(parseInt(budgetYear));
    }
    
    query += ' ORDER BY h.changed_at DESC';
    
    if (limit) {
      query += ' LIMIT ?';
      replacements.push(parseInt(limit));
    }
    
    if (offset) {
      query += ' OFFSET ?';
      replacements.push(parseInt(offset));
    }
    
    const histories = await sequelize.query(query, {
      replacements,
      type: Sequelize.QueryTypes.SELECT
    });
    
    // 필드명을 camelCase로 변환
    const formattedHistories = histories.map(h => ({
      id: h.id,
      budgetId: h.budget_id,
      projectName: h.projectName,
      budgetYear: h.budgetYear,
      changeType: h.change_type,
      changedField: h.changed_field,
      oldValue: h.old_value,
      newValue: h.new_value,
      changedAt: h.changed_at,
      changedBy: h.changed_by,
      changeDescription: h.change_description
    }));
    
    res.json(formattedHistories);
  } catch (error) {
    console.error('변경이력 조회 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

// React 앱 라우팅 처리 (모든 API 라우트 이후에 위치)

// ========================================
// AI 어시스턴트 API (프록시)
// ========================================

// AI 헬스 체크
app.get('/api/ai/health', async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVER_URL}/health`, { timeout: 5000 });
    res.json(response.data);
  } catch (error) {
    console.error('AI 서버 헬스 체크 실패:', error.message);
    res.status(503).json({ 
      status: 'unavailable',
      message: 'AI 서버가 응답하지 않습니다. AI 서버가 실행 중인지 확인하세요.'
    });
  }
});

// AI 채팅
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { question, conversation_id, use_history } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: '질문을 입력해주세요.' });
    }
    
    console.log('💬 AI 질문 전달:', question);
    
    const response = await axios.post(
      `${AI_SERVER_URL}/chat`,
      {
        question,
        conversation_id: conversation_id || null,
        use_history: use_history !== false
      },
      { timeout: 60000 } // 60초 타임아웃
    );
    
    console.log('✅ AI 답변 수신');
    res.json(response.data);
    
  } catch (error) {
    console.error('AI 채팅 오류:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'AI 서버에 연결할 수 없습니다. AI 서버가 실행 중인지 확인하세요.' 
      });
    }
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return res.status(504).json({ 
        error: 'AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.' 
      });
    }
    
    res.status(500).json({ 
      error: error.response?.data?.detail || error.message || '알 수 없는 오류가 발생했습니다.' 
    });
  }
});

// AI 데이터 재인덱싱
app.post('/api/ai/reindex', async (req, res) => {
  try {
    console.log('🔄 AI 데이터 재인덱싱 요청');
    
    const response = await axios.post(
      `${AI_SERVER_URL}/reindex`,
      {},
      { timeout: 300000 } // 5분 타임아웃 (재인덱싱은 시간이 걸릴 수 있음)
    );
    
    console.log('✅ 재인덱싱 완료');
    res.json(response.data);
    
  } catch (error) {
    console.error('AI 재인덱싱 오류:', error.message);
    res.status(500).json({ 
      error: error.response?.data?.detail || error.message 
    });
  }
});

// AI 통계 조회
app.get('/api/ai/stats', async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVER_URL}/stats`, { timeout: 5000 });
    res.json(response.data);
  } catch (error) {
    console.error('AI 통계 조회 오류:', error.message);
    res.status(500).json({ 
      error: error.response?.data?.detail || error.message 
    });
  }
});

// ============================================
// 업무 관리 API
// ============================================

// 업무 목록 조회
app.get('/api/tasks', async (req, res) => {
  try {
    const { status, priority, assignedPerson, year } = req.query;
    const where = { isActive: true };
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedPerson) {
      // 담당자 이름으로 부분 일치 검색 (여러명 중 한 명이라도 포함되면)
      where.assignedPerson = {
        [Op.iLike]: `%${assignedPerson}%`
      };
    }
    if (year) {
      // 연도별 필터링 (시작일 기준, null 제외)
      where.startDate = {
        [Op.and]: [
          { [Op.ne]: null },  // null이 아닌 것만
          { [Op.gte]: `${year}-01-01` },
          { [Op.lte]: `${year}-12-31` }
        ]
      };
    }
    
    const tasks = await models.Task.findAll({
      where,
      order: [
        ['priority', 'DESC'],  // high -> medium -> low
        ['startDate', 'ASC'],
        ['id', 'DESC']
      ]
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('업무 목록 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 업무 상세 조회
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await models.Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ error: '업무를 찾을 수 없습니다.' });
    }
    res.json(task);
  } catch (error) {
    console.error('업무 상세 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 업무 생성
app.post('/api/tasks', async (req, res) => {
  try {
    const taskData = req.body;
    const task = await models.Task.create(taskData);
    res.status(201).json(task);
  } catch (error) {
    console.error('업무 생성 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 업무 수정
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const task = await models.Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ error: '업무를 찾을 수 없습니다.' });
    }
    
    await task.update(req.body);
    res.json(task);
  } catch (error) {
    console.error('업무 수정 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 업무 삭제 (소프트 삭제)
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const task = await models.Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ error: '업무를 찾을 수 없습니다.' });
    }
    
    await task.update({ isActive: false });
    res.json({ message: '업무가 삭제되었습니다.' });
  } catch (error) {
    console.error('업무 삭제 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 업무 통계 조회
app.get('/api/tasks/stats/summary', async (req, res) => {
  try {
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority_count,
        COUNT(*) as total_count
      FROM tasks
      WHERE is_active = true
    `);
    
    res.json(stats[0]);
  } catch (error) {
    console.error('업무 통계 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 업무보고 API
// ============================================

// 기간별 보고서 데이터 조회
app.get('/api/work-reports', async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: '시작일과 종료일을 입력해주세요.' });
    }
    
    // 결재완료된 품의서만 조회 (status: 'approved', 결재일 기준)
    const proposals = await models.Proposal.findAll({
      where: {
        status: 'approved',
        [Op.or]: [
          // approvalDate 필드가 있는 경우 (결재일 기준)
          {
            approvalDate: {
              [Op.gte]: new Date(startDate),
              [Op.lte]: new Date(endDate + ' 23:59:59')
            }
          },
          // approvalDate가 없으면 updatedAt 사용 (결재 시 업데이트되므로)
          {
            approvalDate: null,
            updatedAt: {
              [Op.gte]: new Date(startDate),
              [Op.lte]: new Date(endDate + ' 23:59:59')
            }
          }
        ]
      },
      include: [
        {
          model: models.PurchaseItem,
          as: 'purchaseItems',
          required: false
        },
        {
          model: models.ServiceItem,
          as: 'serviceItems',
          required: false
        },
        {
          model: models.RequestDepartment,
          as: 'requestDepartments',
          required: false
        },
        {
          model: models.CostDepartment,
          as: 'costDepartments',
          required: false
        }
      ],
      order: [['approvalDate', 'DESC'], ['createdAt', 'DESC']]
    });
    
    // 사업예산 정보 조회 (자본예산 + 전산운용비)
    const budgetIds = [...new Set(proposals.map(p => p.budgetId).filter(id => id !== null))];
    const operatingBudgetIds = [...new Set(proposals.map(p => p.operatingBudgetId).filter(id => id !== null))];
    let budgetMap = {};
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 [업무보고] 예산 정보 조회');
    console.log('   자본예산 IDs:', budgetIds);
    console.log('   전산운용비 IDs:', operatingBudgetIds);
    
    // 자본예산 조회
    if (budgetIds.length > 0) {
      const [budgetResults] = await sequelize.query(`
        SELECT id, project_name, budget_amount, budget_year, initiator_department
        FROM business_budgets
        WHERE id IN (${budgetIds.join(',')})
      `);
      
      console.log('   자본예산 조회 결과:', budgetResults.length, '개');
      
      budgetResults.forEach(b => {
        budgetMap['capital_' + b.id] = {
          id: b.id,
          name: b.project_name,
          totalAmount: parseFloat(b.budget_amount || 0),
          year: b.budget_year,
          department: b.initiator_department,
          type: '자본예산'
        };
      });
    }
    
    // 전산운용비 조회
    if (operatingBudgetIds.length > 0) {
      const [operatingResults] = await sequelize.query(`
        SELECT id, account_subject, budget_amount, fiscal_year
        FROM operating_budgets
        WHERE id IN (${operatingBudgetIds.join(',')})
      `);
      
      console.log('   전산운용비 조회 결과:', operatingResults.length, '개');
      
      operatingResults.forEach(b => {
        budgetMap['operating_' + b.id] = {
          id: b.id,
          name: b.account_subject,
          totalAmount: parseFloat(b.budget_amount || 0),
          year: b.fiscal_year,
          department: '',
          type: '전산운용비'
        };
      });
    }
    
    console.log('   BudgetMap 키:', Object.keys(budgetMap));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 계약 유형별 집계
    const contractTypeStats = {};
    let totalAmount = 0;
    let totalCount = proposals.length;
    
    proposals.forEach(proposal => {
      let type = proposal.contractType || 'unknown';
      let contractMethod = proposal.contractMethod;
      
      // 자유양식일 때 contractMethod에 템플릿 이름(한글)이 있으면 템플릿명으로 집계
      if (type === 'freeform' && contractMethod && 
          /[가-힣]/.test(contractMethod) && 
          !contractMethod.includes('_')) {
        type = contractMethod; // 템플릿명을 키로 사용
      }
      
      if (!contractTypeStats[type]) {
        contractTypeStats[type] = {
          count: 0,
          amount: 0,
          contractMethod: type === contractMethod ? contractMethod : null
        };
      }
      contractTypeStats[type].count++;
      contractTypeStats[type].amount += parseFloat(proposal.totalAmount || 0);
      totalAmount += parseFloat(proposal.totalAmount || 0);
    });
    
    // 월별 집계 (결재일 기준)
    const monthlyStats = {};
    proposals.forEach(proposal => {
      // 결재일 우선, 없으면 작성일 사용
      const dateToUse = proposal.approvalDate || proposal.createdAt;
      const month = new Date(dateToUse).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyStats[month]) {
        monthlyStats[month] = {
          count: 0,
          amount: 0
        };
      }
      monthlyStats[month].count++;
      monthlyStats[month].amount += parseFloat(proposal.totalAmount || 0);
    });
    
    // 부서별 비용귀속 집계
    const departmentStats = {};
    proposals.forEach(proposal => {
      if (proposal.costDepartments && proposal.costDepartments.length > 0) {
        proposal.costDepartments.forEach(dept => {
          const deptName = dept.department || '미지정';
          if (!departmentStats[deptName]) {
            departmentStats[deptName] = {
              count: 0,
              amount: 0
            };
          }
          // 비용귀속부서는 ratio(비율)을 가지고 있음
          const ratio = parseFloat(dept.ratio || 0) / 100; // 비율을 소수로 변환
          const allocatedAmount = parseFloat(proposal.totalAmount || 0) * ratio;
          
          departmentStats[deptName].count++;
          departmentStats[deptName].amount += allocatedAmount;
        });
      } else {
        // 비용귀속부서가 없는 경우 미지정으로 처리
        const deptName = '미지정';
        if (!departmentStats[deptName]) {
          departmentStats[deptName] = {
            count: 0,
            amount: 0
          };
        }
        departmentStats[deptName].count++;
        departmentStats[deptName].amount += parseFloat(proposal.totalAmount || 0);
      }
    });
    
    // 사업예산 집행 현황 조회 (business_budgets 테이블 사용)
    const budgetStats = {};
    let totalBudgetAmount = 0;
    let totalExecutionAmount = 0;
    
    try {
      // 1. 조회기간 내 품의서에서 사용된 예산 집계 (자본예산 + 전산운용비)
      const budgetUsage = {};  // 자본예산
      const operatingBudgetUsage = {};  // 전산운용비
      
      proposals.forEach(proposal => {
        if (proposal.budgetId) {
          // 자본예산
          if (!budgetUsage[proposal.budgetId]) {
            budgetUsage[proposal.budgetId] = 0;
          }
          budgetUsage[proposal.budgetId] += parseFloat(proposal.totalAmount || 0);
        } else if (proposal.operatingBudgetId) {
          // 전산운용비
          if (!operatingBudgetUsage[proposal.operatingBudgetId]) {
            operatingBudgetUsage[proposal.operatingBudgetId] = 0;
          }
          operatingBudgetUsage[proposal.operatingBudgetId] += parseFloat(proposal.totalAmount || 0);
        }
      });
      
      // 실제 사용된 budgetId 조회
      const usedBudgetIds = Object.keys(budgetUsage);
      const usedOperatingBudgetIds = Object.keys(operatingBudgetUsage);
      
      // 2. 자본예산 처리
      if (usedBudgetIds.length > 0) {
        const [usedBudgets] = await sequelize.query(`
          SELECT id, project_name, budget_amount, budget_year, initiator_department
          FROM business_budgets
          WHERE id IN (${usedBudgetIds.join(',')})
        `);
        
        // 누적 집행액 계산
        const [cumulativeExecution] = await sequelize.query(`
          SELECT budget_id, SUM(total_amount) as cumulative_amount
          FROM proposals
          WHERE status = 'approved'
          AND budget_id IN (${usedBudgetIds.join(',')})
          GROUP BY budget_id
        `);
        
        const cumulativeMap = {};
        cumulativeExecution.forEach(row => {
          cumulativeMap[row.budget_id] = parseFloat(row.cumulative_amount || 0);
        });
        
        usedBudgets.forEach(budget => {
          const budgetName = `[자본] ${budget.project_name || '미지정'}`;
          const budgetAmount = parseFloat(budget.budget_amount || 0);
          const executionAmount = budgetUsage[budget.id] || 0;
          const confirmedExecutionAmount = cumulativeMap[budget.id] || 0;
          
          const executionRate = budgetAmount > 0 ? (confirmedExecutionAmount / budgetAmount) * 100 : 0;
          const executionRateChange = budgetAmount > 0 ? (executionAmount / budgetAmount) * 100 : 0;
          
          totalBudgetAmount += budgetAmount;
          totalExecutionAmount += executionAmount;
          
          budgetStats[budgetName] = {
            budgetId: budget.id,
            budgetType: '자본예산',
            budgetAmount,
            executionAmount,
            confirmedExecutionAmount,
            executionCount: 0,
            executionRate,
            executionRateChange
          };
        });
      }
      
      // 3. 전산운용비 처리
      if (usedOperatingBudgetIds.length > 0) {
        const [usedOperatingBudgets] = await sequelize.query(`
          SELECT id, account_subject, budget_amount, fiscal_year
          FROM operating_budgets
          WHERE id IN (${usedOperatingBudgetIds.join(',')})
        `);
        
        // 누적 집행액 계산
        const [cumulativeOperatingExecution] = await sequelize.query(`
          SELECT operating_budget_id, SUM(total_amount) as cumulative_amount
          FROM proposals
          WHERE status = 'approved'
          AND operating_budget_id IN (${usedOperatingBudgetIds.join(',')})
          GROUP BY operating_budget_id
        `);
        
        const cumulativeOperatingMap = {};
        cumulativeOperatingExecution.forEach(row => {
          cumulativeOperatingMap[row.operating_budget_id] = parseFloat(row.cumulative_amount || 0);
        });
        
        usedOperatingBudgets.forEach(budget => {
          const budgetName = `[운영] ${budget.account_subject || '미지정'}`;
          const budgetAmount = parseFloat(budget.budget_amount || 0);
          const executionAmount = operatingBudgetUsage[budget.id] || 0;
          const confirmedExecutionAmount = cumulativeOperatingMap[budget.id] || 0;
          
          const executionRate = budgetAmount > 0 ? (confirmedExecutionAmount / budgetAmount) * 100 : 0;
          const executionRateChange = budgetAmount > 0 ? (executionAmount / budgetAmount) * 100 : 0;
          
          totalBudgetAmount += budgetAmount;
          totalExecutionAmount += executionAmount;
          
          budgetStats[budgetName] = {
            budgetId: budget.id,
            budgetType: '전산운용비',
            budgetAmount,
            executionAmount,
            confirmedExecutionAmount,
            executionCount: 0,
            executionRate,
            executionRateChange
          };
        });
      }
    } catch (error) {
      console.error('예산 집행 현황 조회 오류:', error);
      // 오류가 발생해도 계속 진행
    }
    
    // 인력현황 증감 조회
    let personnelStats = {
      current: { total: 0, byDepartment: {} },
      previous: { total: 0, byDepartment: {} },
      changes: { total: 0, byDepartment: {} },
      external: {
        current: { total: 0, byWorkType: {}, bySkillLevel: {} },
        previous: { total: 0, byWorkType: {}, bySkillLevel: {} },
        changes: { total: 0, byWorkType: {}, bySkillLevel: {} }
      }
    };
    
    try {
      // 현재 인력현황 조회 (종료일 기준 재직중인 인원)
      const currentPersonnel = await models.Personnel.findAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [
                { join_date: null },
                { join_date: { [Op.lte]: new Date(endDate) } }
              ]
            },
            {
              [Op.or]: [
                { resignation_date: null },
                { resignation_date: { [Op.gt]: new Date(endDate) } }
              ]
            }
          ]
        }
      });
      
      let previousPersonnel = [];
      let useBackupData = false;
      
      // 백업 테이블이 있는지 확인하고 백업 데이터 조회 시도
      try {
        const [backupDates] = await sequelize.query(`
          SELECT DISTINCT backup_date 
          FROM personnel_backup 
          WHERE backup_date <= :startDate
          ORDER BY backup_date DESC
          LIMIT 1
        `, {
          replacements: { startDate },
          type: Sequelize.QueryTypes.SELECT
        });
        
        if (backupDates && backupDates.backup_date) {
          // 백업 데이터 조회
          const [backupData] = await sequelize.query(`
            SELECT * FROM personnel_backup 
            WHERE backup_date = :backupDate
            AND (resignation_date IS NULL OR resignation_date > :backupDate)
          `, {
            replacements: { backupDate: backupDates.backup_date },
            type: Sequelize.QueryTypes.SELECT
          });
          
          if (backupData && backupData.length > 0) {
            previousPersonnel = backupData;
            useBackupData = true;
          }
        }
      } catch (backupError) {
        console.log('백업 테이블 없음 또는 조회 오류, personnel 테이블로 계산:', backupError.message);
      }
      
      // 백업 데이터가 없으면 personnel 테이블에서 시작일 기준으로 계산
      if (!useBackupData) {
        previousPersonnel = await models.Personnel.findAll({
          where: {
            [Op.and]: [
              {
                [Op.or]: [
                  { join_date: null },
                  { join_date: { [Op.lte]: new Date(startDate) } }
                ]
              },
              {
                [Op.or]: [
                  { resignation_date: null },
                  { resignation_date: { [Op.gt]: new Date(startDate) } }
                ]
              }
            ]
          }
        });
      }
      
      // 현재 인력 집계 (내부인력)
      personnelStats.current.total = currentPersonnel.length;
      currentPersonnel.forEach(p => {
        const dept = p.department || '미지정';
        personnelStats.current.byDepartment[dept] = (personnelStats.current.byDepartment[dept] || 0) + 1;
      });
      
      // 이전 인력 집계 (내부인력)
      personnelStats.previous.total = previousPersonnel.length;
      previousPersonnel.forEach(p => {
        const dept = p.department || '미지정';
        personnelStats.previous.byDepartment[dept] = (personnelStats.previous.byDepartment[dept] || 0) + 1;
      });
      
      // 증감 계산 (내부인력)
      personnelStats.changes.total = personnelStats.current.total - personnelStats.previous.total;
      
      // 부서별 증감
      const allDepts = new Set([
        ...Object.keys(personnelStats.current.byDepartment),
        ...Object.keys(personnelStats.previous.byDepartment)
      ]);
      allDepts.forEach(dept => {
        const current = personnelStats.current.byDepartment[dept] || 0;
        const previous = personnelStats.previous.byDepartment[dept] || 0;
        personnelStats.changes.byDepartment[dept] = current - previous;
      });
      
      // 증감된 내부인력 상세 정보 추출
      personnelStats.newPersonnel = []; // 신규 입사
      personnelStats.endedPersonnel = []; // 퇴사
      
      // 이전 기간의 인력 ID 목록
      const previousPersonnelIds = new Set(previousPersonnel.map(p => p.id));
      const currentPersonnelIds = new Set(currentPersonnel.map(p => p.id));
      
      // 신규 입사: 현재에는 있지만 이전에는 없는 인력
      currentPersonnel.forEach(person => {
        if (!previousPersonnelIds.has(person.id)) {
          personnelStats.newPersonnel.push({
            id: person.id,
            name: person.name || '-',
            department: person.department || '미지정',
            position: person.position || '-',
            joinDate: person.join_date ? new Date(person.join_date).toISOString().split('T')[0] : '-',
            resignationDate: '-'
          });
        }
      });
      
      // 퇴사: 이전에는 있었지만 현재에는 없는 인력
      previousPersonnel.forEach(person => {
        if (!currentPersonnelIds.has(person.id)) {
          personnelStats.endedPersonnel.push({
            id: person.id,
            name: person.name || '-',
            department: person.department || '미지정',
            position: person.position || '-',
            joinDate: person.join_date ? new Date(person.join_date).toISOString().split('T')[0] : '-',
            resignationDate: person.resignation_date ? new Date(person.resignation_date).toISOString().split('T')[0] : '-'
          });
        }
      });
      
      // ===== 외주인력 증감 조회 =====
      // 대시보드와 동일한 로직: 결재완료 + 용역계약만 조회
      const allExternalPersonnel = await models.ServiceItem.findAll({
        include: [
          {
            model: models.Proposal,
            as: 'proposal',
            where: {
              status: 'approved', // 결재완료만 포함
              contractType: 'service' // 용역계약만 포함 (대시보드와 동일)
            },
            required: true,
            include: [
              {
                model: models.RequestDepartment,
                as: 'requestDepartments',
                required: false
              }
            ]
          },
          {
            model: models.ExternalPersonnelInfo,
            as: 'personnelInfo',
            required: false
          }
        ]
      });
      
      // 133번 품의서만 확인 (간단 로그)
      try {
        const proposal133 = await models.Proposal.findByPk(133, {
          include: [{ model: models.ServiceItem, as: 'serviceItems', required: false }]
        });
        
        if (proposal133) {
          const isIncluded = allExternalPersonnel.some(item => item.proposal?.id === 133);
          const approvalDate = proposal133.approvalDate ? new Date(proposal133.approvalDate) : null;
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          const isWithinYear = approvalDate && approvalDate >= oneYearAgo;
          
          console.log(`\n[133번 품의서] 상태:${proposal133.status} | 유형:${proposal133.contractType} | 용역항목:${proposal133.serviceItems?.length || 0}개`);
          console.log(`  결재일:${approvalDate ? approvalDate.toISOString().split('T')[0] : '없음'} | 최근1년:${isWithinYear ? 'O' : 'X'} | 업무보고포함:${isIncluded ? 'O' : 'X'}`);
          
          if (!isWithinYear && proposal133.status === 'approved') {
            console.log(`  ⚠️ 대시보드 제외이유: 결재일이 1년 이전\n`);
          } else if (proposal133.status !== 'approved') {
            console.log(`  ⚠️ 대시보드 제외이유: 상태가 '${proposal133.status}' (approved 아님)\n`);
          }
        }
      } catch (error) {
        console.error('133번 품의서 조회 오류:', error.message);
      }
      
      // 대시보드와 동일한 계약기간 계산 함수
      const calculateContractDates = (item) => {
        let contractStart = null;
        let contractEnd = null;
        
        // 1순위: 용역항목에 입력된 계약 시작일 사용
        if (item.contractPeriodStart) {
          contractStart = new Date(item.contractPeriodStart);
        } else if (item.proposal?.approvalDate) {
          // 2순위: 승인일 사용
          contractStart = new Date(item.proposal.approvalDate);
        }
        
        // 종료일 계산
        if (item.contractPeriodEnd) {
          contractEnd = new Date(item.contractPeriodEnd);
        } else if (contractStart && item.period) {
          // 계약 종료일이 없으면 시작일 + 기간으로 자동 계산
          contractEnd = new Date(contractStart);
          contractEnd.setMonth(contractEnd.getMonth() + parseFloat(item.period));
        }
        
        return { contractStart, contractEnd };
      };
      
      // 특정 날짜 기준으로 재직중인지 확인하는 함수 (대시보드와 동일)
      const isWorkingOnDate = (item, targetDate) => {
        const { contractStart, contractEnd } = calculateContractDates(item);
        
        // 시작일과 종료일이 모두 있어야 판단 가능
        if (!contractStart || !contractEnd) return false;
        
        const target = new Date(targetDate);
        target.setHours(0, 0, 0, 0);
        
        const start = new Date(contractStart);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(contractEnd);
        end.setHours(0, 0, 0, 0);
        
        // 대시보드와 동일한 로직: target >= start && target <= end
        // 즉, target이 계약기간 내에 있으면 재직중
        return target >= start && target <= end;
      };
      
      // *** 중요: 조회 기간의 TO 날짜(endDate) 기준으로 재직중인 외주인력 ***
      // 이것이 "현재 외주인원"이 됩니다
      const currentExternalPersonnel = allExternalPersonnel.filter(item => 
        isWorkingOnDate(item, endDate)
      );
      
      // *** 중요: 조회 기간의 FROM 날짜(startDate) 기준으로 재직중인 외주인력 ***
      // 이것이 "기준시점 외주인원"이 됩니다
      const previousExternalPersonnel = allExternalPersonnel.filter(item => 
        isWorkingOnDate(item, startDate)
      );
      
      console.log(`\n📊 [외주인력 현황] ${startDate} ~ ${endDate}`);
      console.log(`전체: ${allExternalPersonnel.length}개 | 현재: ${currentExternalPersonnel.length}개 | 기준시점: ${previousExternalPersonnel.length}개`);
      
      // 각 항목의 인원수 확인 및 합산
      let currentTotalPersonnel = 0;
      let previousTotalPersonnel = 0;
      
      currentExternalPersonnel.forEach(item => {
        const personnel = parseInt(item.personnel) || 1;
        currentTotalPersonnel += personnel;
      });
      
      previousExternalPersonnel.forEach(item => {
        const personnel = parseInt(item.personnel) || 1;
        previousTotalPersonnel += personnel;
      });
      
      console.log('\n[외주인력 집계 결과]');
      console.log(`✓ 현재 외주인원: ${currentTotalPersonnel}명 (${currentExternalPersonnel.length}개 계약)`);
      console.log(`✓ 기준시점 외주인원: ${previousTotalPersonnel}명 (${previousExternalPersonnel.length}개 계약)`);
      console.log(`✓ 증감: ${currentTotalPersonnel - previousTotalPersonnel > 0 ? '+' : ''}${currentTotalPersonnel - previousTotalPersonnel}명\n`);
      
      // 현재 외주인력 집계
      currentExternalPersonnel.forEach(item => {
        const personnel = parseInt(item.personnel) || 1;
        const skillLevel = item.skillLevel || '미지정';
        const workType = item.personnelInfo?.workType || '미지정';
        
        personnelStats.external.current.total += personnel;
        personnelStats.external.current.bySkillLevel[skillLevel] = 
          (personnelStats.external.current.bySkillLevel[skillLevel] || 0) + personnel;
        personnelStats.external.current.byWorkType[workType] = 
          (personnelStats.external.current.byWorkType[workType] || 0) + personnel;
      });
      
      // 이전 외주인력 집계
      previousExternalPersonnel.forEach(item => {
        const personnel = parseInt(item.personnel) || 1;
        const skillLevel = item.skillLevel || '미지정';
        const workType = item.personnelInfo?.workType || '미지정';
        
        personnelStats.external.previous.total += personnel;
        personnelStats.external.previous.bySkillLevel[skillLevel] = 
          (personnelStats.external.previous.bySkillLevel[skillLevel] || 0) + personnel;
        personnelStats.external.previous.byWorkType[workType] = 
          (personnelStats.external.previous.byWorkType[workType] || 0) + personnel;
      });
      
      // 외주인력 증감 계산
      personnelStats.external.changes.total = 
        personnelStats.external.current.total - personnelStats.external.previous.total;
      
      // 증감된 인력 상세 정보 추출
      personnelStats.external.newPersonnel = []; // 신규 투입
      personnelStats.external.endedPersonnel = []; // 계약 종료
      
      // 이전 기간의 serviceItemId 목록
      const previousItemIds = new Set(previousExternalPersonnel.map(item => item.id));
      
      // 신규 투입 인력 (현재에는 있지만 이전에는 없는)
      currentExternalPersonnel.forEach(item => {
        if (!previousItemIds.has(item.id)) {
          const { contractStart, contractEnd } = calculateContractDates(item);
          personnelStats.external.newPersonnel.push({
            id: item.id,
            name: item.name || '-',
            item: item.item || '-',
            skillLevel: item.skillLevel,
            personnel: item.personnel,
            contractPeriodStart: contractStart,
            contractPeriodEnd: contractEnd,
            workType: item.personnelInfo?.workType || '-',
            requestDepartments: item.proposal?.requestDepartments?.map(d => d.department).join(', ') || '-'
          });
        }
      });
      
      // 현재 기간의 serviceItemId 목록
      const currentItemIds = new Set(currentExternalPersonnel.map(item => item.id));
      
      // 계약 종료 인력 (이전에는 있지만 현재에는 없는)
      previousExternalPersonnel.forEach(item => {
        if (!currentItemIds.has(item.id)) {
          const { contractStart, contractEnd } = calculateContractDates(item);
          personnelStats.external.endedPersonnel.push({
            id: item.id,
            name: item.name || '-',
            item: item.item || '-',
            skillLevel: item.skillLevel,
            personnel: item.personnel,
            contractPeriodStart: contractStart,
            contractPeriodEnd: contractEnd,
            workType: item.personnelInfo?.workType || '-',
            requestDepartments: item.proposal?.requestDepartments?.map(d => d.department).join(', ') || '-'
          });
        }
      });
      
    } catch (error) {
      console.error('❌ 인력현황 조회 오류:', error.message);
    }
    
    res.json({
      period,
      startDate,
      endDate,
      summary: {
        totalCount,
        totalAmount,
        avgAmount: totalCount > 0 ? totalAmount / totalCount : 0,
        totalBudgetAmount,
        totalExecutionAmount,
        totalExecutionRate: totalBudgetAmount > 0 ? (totalExecutionAmount / totalBudgetAmount) * 100 : 0
      },
      contractTypeStats,
      monthlyStats,
      departmentStats,
      budgetStats,
      personnelStats,
      proposals: proposals.map((p, index) => {
        // 자본예산 또는 전산운용비 예산 정보 가져오기
        let budget = null;
        let budgetKey = null;
        
        if (p.budgetId) {
          budgetKey = 'capital_' + p.budgetId;
          budget = budgetMap[budgetKey];
        } else if (p.operatingBudgetId) {
          budgetKey = 'operating_' + p.operatingBudgetId;
          budget = budgetMap[budgetKey];
        }
        
        // 처음 2개 품의서만 로그 출력 (디버깅용)
        if (index < 2) {
          console.log(`\n[품의서 ${p.id}] budgetId:${p.budgetId} | operatingBudgetId:${p.operatingBudgetId}`);
          console.log(`  budgetKey: ${budgetKey || '없음'}`);
          console.log(`  budget 찾음: ${budget ? 'O' : 'X'} | budgetName: ${budget?.name || '-'}`);
        }
        
        return {
          id: p.id,
          title: p.title,
          contractType: p.contractType,
          contractMethod: p.contractMethod,
          totalAmount: p.totalAmount,
          createdAt: p.createdAt,
          approvalDate: p.approvalDate,
          createdBy: p.createdBy,
          budgetId: p.budgetId,
          operatingBudgetId: p.operatingBudgetId,
          budgetName: budget?.name || '-',
          budgetType: budget?.type || '-',
          budgetAmount: budget?.totalAmount || 0,
          requestDepartments: p.requestDepartments?.map(d => d.department) || []
        };
      })
    });
  } catch (error) {
    console.error('업무보고 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 문서 템플릿 관리 API
// ============================================

// 템플릿 목록 조회 (활성화된 템플릿만)
app.get('/api/document-templates', async (req, res) => {
  try {
    const { category } = req.query;
    const where = { isActive: true };
    
    if (category) {
      where.category = category;
    }
    
    const templates = await models.DocumentTemplate.findAll({
      where,
      order: [
        ['displayOrder', 'ASC'],
        ['createdAt', 'DESC']
      ]
    });
    
    res.json(templates);
  } catch (error) {
    console.error('템플릿 목록 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 템플릿 상세 조회
app.get('/api/document-templates/:id', async (req, res) => {
  try {
    const template = await models.DocumentTemplate.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ error: '템플릿을 찾을 수 없습니다.' });
    }
    res.json(template);
  } catch (error) {
    console.error('템플릿 상세 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 템플릿 생성
app.post('/api/document-templates', async (req, res) => {
  try {
    const { name, description, content, category, displayOrder } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({ error: '템플릿 이름과 내용은 필수입니다.' });
    }
    
    const template = await models.DocumentTemplate.create({
      name,
      description,
      content,
      category: category || 'general',
      displayOrder: displayOrder || 0,
      createdBy: '사용자1', // 실제로는 로그인한 사용자 정보 사용
      isActive: true
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error('템플릿 생성 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 템플릿 수정
app.put('/api/document-templates/:id', async (req, res) => {
  try {
    const template = await models.DocumentTemplate.findByPk(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: '템플릿을 찾을 수 없습니다.' });
    }
    
    const { name, description, content, category, displayOrder, isActive } = req.body;
    
    await template.update({
      name: name !== undefined ? name : template.name,
      description: description !== undefined ? description : template.description,
      content: content !== undefined ? content : template.content,
      category: category !== undefined ? category : template.category,
      displayOrder: displayOrder !== undefined ? displayOrder : template.displayOrder,
      isActive: isActive !== undefined ? isActive : template.isActive
    });
    
    res.json(template);
  } catch (error) {
    console.error('템플릿 수정 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 템플릿 삭제 (논리 삭제)
app.delete('/api/document-templates/:id', async (req, res) => {
  try {
    const template = await models.DocumentTemplate.findByPk(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: '템플릿을 찾을 수 없습니다.' });
    }
    
    await template.update({ isActive: false });
    
    res.json({ message: '템플릿이 삭제되었습니다.' });
  } catch (error) {
    console.error('템플릿 삭제 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== 인력현황 관리 API ====================

// 1. 백업 일자 목록 조회 (구체적인 경로를 먼저 정의)
app.get('/api/personnel/backups/dates', async (req, res) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📅 [API 호출] GET /api/personnel/backups/dates');
    console.log(`   📍 Client IP: ${req.clientIP || req.ip}`);
    
    const query = `
      SELECT DISTINCT backup_date 
      FROM personnel_backup 
      ORDER BY backup_date DESC 
      LIMIT 365  -- 최근 1년 (365개)
    `;
    const dates = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT
    });
    
    console.log(`   ✅ 백업 일자 조회 성공: ${dates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    res.json(dates.map(d => d.backup_date));
  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ 백업 일자 조회 오류:', error.message);
    console.error('   전체 에러:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // personnel_backup 테이블이 없으면 빈 배열 반환
    if (error.message && (error.message.includes('does not exist') || error.message.includes('no such table'))) {
      console.log('⚠️  personnel_backup 테이블이 없습니다. 빈 배열을 반환합니다.');
      return res.json([]);
    }
    
    res.status(500).json({ error: '백업 일자 조회 중 오류가 발생했습니다.', details: error.message });
  }
});

// 2. 엑셀 다운로드 (구체적인 경로를 먼저 정의)
app.get('/api/personnel/export/excel', async (req, res) => {
  try {
    const { date } = req.query;
    
    let personnel;
    
    if (date) {
      // 특정 일자의 백업 데이터
      const query = `
        SELECT * FROM personnel_backup 
        WHERE backup_date = :date
        ORDER BY id
      `;
      personnel = await sequelize.query(query, {
        replacements: { date },
        type: Sequelize.QueryTypes.SELECT
      });
    } else {
      // 현재 데이터
      personnel = await models.Personnel.findAll({
        order: [['id', 'ASC']],
        raw: true
      });
    }
    
    // 엑셀 데이터 변환
    const excelData = personnel.map((p, index) => ({
      'No': index + 1,
      '본부': p.division || '',
      '부서': p.department || '',
      '직책': p.position || '',
      '사번': p.employee_number || '',
      '성명': p.name || '',
      '직위': p.rank || '',
      '담당업무': p.duties || '',
      '직능': p.job_function || '',
      '한국은행직능': p.bok_job_function || '',
      '직종구분': p.job_category || '',
      '정보기술인력': p.is_it_personnel ? 'O' : 'X',
      '정보보호인력': p.is_security_personnel ? 'O' : 'X',
      '생년월일': p.birth_date || '',
      '성별': p.gender || '',
      '나이': p.age || '',
      '그룹입사일': p.group_join_date || '',
      '입사일': p.join_date || '',
      '퇴사일': p.resignation_date || '',
      '총재직기간(년)': p.total_service_years || '',
      '정산경력기준일': p.career_base_date || '',
      '전산경력': p.it_career_years || '',
      '현업무발령일': p.current_duty_date || '',
      '현업무기간': p.current_duty_period || '',
      '직전소속': p.previous_department || '',
      '전공': p.major || '',
      '전산전공여부': p.is_it_major ? 'O' : 'X',
      '전산자격증1': p.it_certificate_1 || '',
      '전산자격증2': p.it_certificate_2 || '',
      '전산자격증3': p.it_certificate_3 || '',
      '전산자격증4': p.it_certificate_4 || ''
    }));
    
    // 워크북 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // 컬럼 너비 설정
    ws['!cols'] = [
      { wch: 5 },  // No
      { wch: 15 }, // 본부
      { wch: 15 }, // 부서
      { wch: 12 }, // 직책
      { wch: 12 }, // 사번
      { wch: 10 }, // 성명
      { wch: 10 }, // 직위
      { wch: 30 }, // 담당업무
      { wch: 15 }, // 직능
      { wch: 15 }, // 한국은행직능
      { wch: 12 }, // 직종구분
      { wch: 12 }, // 정보기술인력
      { wch: 12 }, // 정보보호인력
      { wch: 12 }, // 생년월일
      { wch: 8 },  // 성별
      { wch: 8 },  // 나이
      { wch: 12 }, // 그룹입사일
      { wch: 12 }, // 입사일
      { wch: 12 }, // 퇴사일
      { wch: 15 }, // 총재직기간
      { wch: 15 }, // 정산경력기준일
      { wch: 12 }, // 전산경력
      { wch: 12 }, // 현업무발령일
      { wch: 12 }, // 현업무기간
      { wch: 15 }, // 직전소속
      { wch: 15 }, // 전공
      { wch: 12 }, // 전산전공여부
      { wch: 20 }, // 전산자격증1
      { wch: 20 }, // 전산자격증2
      { wch: 20 }, // 전산자격증3
      { wch: 20 }  // 전산자격증4
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, '인력현황');
    
    // 버퍼로 변환
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // 파일명 설정
    const filename = date 
      ? `인력현황_${date}.xlsx`
      : `인력현황_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // 응답 헤더 설정
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('엑셀 다운로드 오류:', error);
    res.status(500).json({ error: '엑셀 다운로드 중 오류가 발생했습니다.' });
  }
});

// 3. 인력현황 목록 조회 (일자별 조회 포함)
app.get('/api/personnel', async (req, res) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 [API 호출] GET /api/personnel');
    console.log(`   📍 Client IP: ${req.clientIP || req.ip}`);
    console.log(`   🔍 Query: ${JSON.stringify(req.query)}`);
    
    const { date } = req.query;
    
    let personnel;
    
    if (date) {
      // 특정 일자의 백업 데이터 조회
      console.log(`   📅 백업 데이터 조회: ${date}`);
      const query = `
        SELECT * FROM personnel_backup 
        WHERE backup_date = :date
        ORDER BY id
      `;
      personnel = await sequelize.query(query, {
        replacements: { date },
        type: Sequelize.QueryTypes.SELECT
      });
    } else {
      // 현재 데이터 조회
      console.log('   📊 현재 데이터 조회');
      personnel = await models.Personnel.findAll({
        order: [['id', 'ASC']]
      });
    }
    
    console.log(`   ✅ 조회 성공: ${personnel.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    res.json(personnel);
  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ 인력현황 조회 오류:', error.message);
    console.error('   전체 에러:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    res.status(500).json({ error: '인력현황 조회 중 오류가 발생했습니다.', details: error.message });
  }
});

// 4. 인력현황 상세 조회
app.get('/api/personnel/:id', async (req, res) => {
  try {
    const personnel = await models.Personnel.findByPk(req.params.id);
    
    if (!personnel) {
      return res.status(404).json({ error: '인력 정보를 찾을 수 없습니다.' });
    }
    
    res.json(personnel);
  } catch (error) {
    console.error('인력현황 상세 조회 오류:', error);
    res.status(500).json({ error: '인력현황 조회 중 오류가 발생했습니다.' });
  }
});

// 5. 인력현황 등록
app.post('/api/personnel', async (req, res) => {
  try {
    console.log('POST /api/personnel 요청 받음');
    console.log('요청 데이터:', JSON.stringify(req.body, null, 2));
    
    if (!models.Personnel) {
      console.error('Personnel 모델을 찾을 수 없습니다!');
      return res.status(500).json({ error: 'Personnel 모델을 찾을 수 없습니다.' });
    }
    
    const personnel = await models.Personnel.create(req.body);
    console.log('인력현황 등록 성공:', personnel.id);
    res.status(201).json(personnel);
  } catch (error) {
    console.error('인력현황 등록 오류 (상세):', error.message);
    console.error('오류 스택:', error.stack);
    res.status(500).json({ 
      error: '인력현황 등록 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// 6. 인력현황 수정
app.put('/api/personnel/:id', async (req, res) => {
  try {
    const personnel = await models.Personnel.findByPk(req.params.id);
    
    if (!personnel) {
      return res.status(404).json({ error: '인력 정보를 찾을 수 없습니다.' });
    }
    
    await personnel.update(req.body);
    res.json(personnel);
  } catch (error) {
    console.error('인력현황 수정 오류:', error);
    res.status(500).json({ error: '인력현황 수정 중 오류가 발생했습니다.' });
  }
});

// 7. 인력현황 삭제
app.delete('/api/personnel/:id', async (req, res) => {
  try {
    const personnel = await models.Personnel.findByPk(req.params.id);
    
    if (!personnel) {
      return res.status(404).json({ error: '인력 정보를 찾을 수 없습니다.' });
    }
    
    await personnel.destroy();
    res.json({ message: '인력 정보가 삭제되었습니다.' });
  } catch (error) {
    console.error('인력현황 삭제 오류:', error);
    res.status(500).json({ error: '인력현황 삭제 중 오류가 발생했습니다.' });
  }
});

// ==================== 외주인력 관리 API ====================

// 외주인력 목록 조회
app.get('/api/external-personnel', async (req, res) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👥 [API 호출] GET /api/external-personnel');
    console.log(`   📍 Client IP: ${req.clientIP || req.ip}`);
    
    const serviceItems = await models.ServiceItem.findAll({
      include: [
        {
          model: models.Proposal,
          as: 'proposal',
          attributes: ['id', 'title', 'purpose', 'approvalDate', 'contractType'],
          required: true, // INNER JOIN으로 proposal이 있는 것만
          where: {
            approvalDate: {
              [models.Sequelize.Op.ne]: null // 결재완료된 품의서만
            },
            contractType: 'service' // 용역계약만
          },
          include: [{
            model: models.RequestDepartment,
            as: 'requestDepartments',
            attributes: ['department', 'name']
          }]
        },
        {
          model: models.ExternalPersonnelInfo,
          as: 'personnelInfo',
          required: false // LEFT JOIN (없어도 조회)
        }
      ],
      order: [['id', 'DESC']]
    });

    // 데이터 변환: 협업팀 정보 추출 및 계약기간 계산
    const externalPersonnel = serviceItems.map(item => {
      const department = item.proposal?.requestDepartments?.[0]?.department || 
                        item.proposal?.requestDepartments?.[0]?.name || 
                        '-';
      
      // 시작일과 종료일 - 대시보드와 동일한 로직
      let startDate = null;
      let endDate = null;
      
      // 1순위: 용역항목에 입력된 계약 시작일 사용
      if (item.contractPeriodStart) {
        startDate = new Date(item.contractPeriodStart);
      } else if (item.proposal?.approvalDate) {
        // 2순위: 승인일 사용
        startDate = new Date(item.proposal.approvalDate);
      }
      
      // 종료일 계산
      if (item.contractPeriodEnd) {
        endDate = new Date(item.contractPeriodEnd);
      } else if (startDate && item.period) {
        // 계약 종료일이 없으면 시작일 + 기간으로 자동 계산
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + parseFloat(item.period));
      }
      
      // 날짜를 YYYY-MM-DD 형식으로 변환
      const formatDate = (date) => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      return {
        id: item.id,
        proposal_id: item.proposalId,
        proposal_title: item.proposal?.title || item.proposal?.purpose || '-',
        employee_number: item.personnelInfo?.employeeNumber || null,
        name: item.name,
        rank: item.personnelInfo?.rank || null,
        item: item.item,
        contract_start_date: formatDate(startDate),
        contract_end_date: formatDate(endDate),
        skill_level: item.skillLevel,
        department: department,
        work_type: item.personnelInfo?.workType || null,
        is_onsite: item.personnelInfo?.isOnsite !== undefined ? item.personnelInfo.isOnsite : null,
        work_load: item.personnelInfo?.workLoad || null,
        monthly_rate: item.monthlyRate,
        period: item.period,
        contract_amount: item.contractAmount,
        has_personnel_info: !!item.personnelInfo // 관리 정보 존재 여부
      };
    });

    console.log(`   ✅ 조회 성공: ${externalPersonnel.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.json(externalPersonnel);
  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ 외주인력 조회 오류:', error.message);
    console.error('   전체 에러:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    res.status(500).json({ error: '외주인력 조회 중 오류가 발생했습니다.', details: error.message });
  }
});

// 외주인력 관리 정보 수정
app.put('/api/external-personnel/:serviceItemId', async (req, res) => {
  try {
    const { serviceItemId } = req.params;
    const { employee_number, rank, work_type, is_onsite, work_load } = req.body;

    // ServiceItem 존재 확인
    const serviceItem = await models.ServiceItem.findByPk(serviceItemId);
    if (!serviceItem) {
      return res.status(404).json({ error: '용역항목을 찾을 수 없습니다.' });
    }

    // ExternalPersonnelInfo가 있으면 업데이트, 없으면 생성
    const [personnelInfo, created] = await models.ExternalPersonnelInfo.findOrCreate({
      where: { serviceItemId },
      defaults: {
        serviceItemId,
        employeeNumber: employee_number,
        rank,
        workType: work_type,
        isOnsite: is_onsite,
        workLoad: work_load
      }
    });

    if (!created) {
      // 이미 존재하면 업데이트
      await personnelInfo.update({
        employeeNumber: employee_number,
        rank,
        workType: work_type,
        isOnsite: is_onsite,
        workLoad: work_load
      });
    }

    res.json({ 
      message: '외주인력 관리 정보가 업데이트되었습니다.',
      data: personnelInfo
    });
  } catch (error) {
    console.error('외주인력 정보 수정 오류:', error);
    res.status(500).json({ error: '외주인력 정보 수정 중 오류가 발생했습니다.' });
  }
});

// SPA를 위한 폴백 라우트 (API 라우트가 아닌 모든 요청)
app.use((req, res, next) => {
  // API 요청이거나 정적 파일 요청이면 다음 미들웨어로
  if (req.path.startsWith('/api') || req.path.match(/\.[a-zA-Z0-9]+$/)) {
    return next();
  }
  // 그 외의 경우 React 앱 제공
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// ==================== Personnel 자동 백업 ====================
async function autoBackupPersonnel() {
  try {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Personnel 자동 백업 시작...');
    
    const today = new Date().toISOString().split('T')[0];
    
    // 오늘 백업이 이미 있는지 확인
    const [existing] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM personnel_backup 
      WHERE backup_date = :today
    `, {
      replacements: { today },
      type: Sequelize.QueryTypes.SELECT
    });
    
    if (existing.count > 0) {
      console.log(`⚠️  ${today} 백업이 이미 존재합니다. 건너뜁니다.`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }
    
    // 백업 실행
    await sequelize.query(`
      INSERT INTO personnel_backup (
        backup_date, original_id,
        division, department, position, employee_number, name, rank,
        duties, job_function, bok_job_function, job_category,
        is_it_personnel, is_security_personnel,
        birth_date, gender, age,
        group_join_date, join_date, resignation_date,
        total_service_years, career_base_date, it_career_years,
        current_duty_date, current_duty_period, previous_department,
        major, is_it_major,
        it_certificate_1, it_certificate_2, it_certificate_3, it_certificate_4,
        is_active, notes,
        created_at, updated_at
      )
      SELECT
        :today AS backup_date, id AS original_id,
        division, department, position, employee_number, name, rank,
        duties, job_function, bok_job_function, job_category,
        is_it_personnel, is_security_personnel,
        birth_date, gender, age,
        group_join_date, join_date, resignation_date,
        total_service_years, career_base_date, it_career_years,
        current_duty_date, current_duty_period, previous_department,
        major, is_it_major,
        it_certificate_1, it_certificate_2, it_certificate_3, it_certificate_4,
        is_active, notes,
        created_at, updated_at
      FROM personnel
      WHERE is_active = TRUE
    `, {
      replacements: { today }
    });
    
    const [result] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM personnel_backup 
      WHERE backup_date = :today
    `, {
      replacements: { today },
      type: Sequelize.QueryTypes.SELECT
    });
    
    console.log(`✅ 백업 완료! ${result.count}명`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  } catch (error) {
    // personnel_backup 테이블이 없으면 무시
    if (error.message && (error.message.includes('does not exist') || error.message.includes('no such table'))) {
      console.log('⚠️  personnel_backup 테이블이 없습니다. 백업 건너뜀.');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.error('❌ Personnel 백업 실패:', error.message);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  }
}

// 매일 자정에 백업 실행하는 스케줄러
function schedulePersonnelBackup() {
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // 다음 날
    0, 0, 0 // 자정
  );
  const msUntilMidnight = night.getTime() - now.getTime();
  
  console.log(`⏰ 다음 백업 예정: ${night.toLocaleString('ko-KR')}`);
  
  // 첫 번째 백업 (자정까지 대기)
  setTimeout(() => {
    autoBackupPersonnel();
    
    // 이후 24시간마다 반복
    setInterval(() => {
      autoBackupPersonnel();
    }, 24 * 60 * 60 * 1000); // 24시간
  }, msUntilMidnight);
}

// 서버 시작
app.listen(PORT, '0.0.0.0', async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공!');
    
    // 스키마 자동 업데이트
    await updateDatabaseSchema();
    
    console.log(`🚀 API 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`🌐 로컬 접근: http://localhost:${PORT}`);
    console.log(`🌐 네트워크 접근: http://172.22.32.200:${PORT}`);
    console.log(`📱 React 앱: http://172.22.32.200:${PORT}`);
    console.log('💡 다른 기기에서 접근하려면 방화벽에서 포트 3002를 허용해주세요.');
    
    // Personnel 자동 백업 스케줄러 시작
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📅 Personnel 자동 백업 스케줄러 시작');
    schedulePersonnelBackup();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error.message);
  }
}); 