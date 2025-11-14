require('dotenv').config();
const { Sequelize } = require('sequelize');

/**
 * 외부 DB 연결 설정
 * 
 * 사용 방법:
 * 1. .env 파일에 아래 환경변수를 설정하세요:
 * 
 * # 외부 DB 설정 (부서 정보 등)
 * EXTERNAL_DB_ENABLED=true              # 외부 DB 사용 여부 (true/false)
 * EXTERNAL_DB_HOST=your_host            # 외부 DB 호스트
 * EXTERNAL_DB_PORT=5432                 # 외부 DB 포트
 * EXTERNAL_DB_NAME=your_database        # 외부 DB 데이터베이스명
 * EXTERNAL_DB_USERNAME=your_username    # 외부 DB 사용자명
 * EXTERNAL_DB_PASSWORD=your_password    # 외부 DB 비밀번호
 * EXTERNAL_DB_DIALECT=postgres          # 외부 DB 종류 (postgres, mysql, mssql, oracle 등)
 * 
 * # 부서 테이블 설정
 * EXTERNAL_DEPT_TABLE=departments       # 부서 테이블명
 * EXTERNAL_DEPT_CODE_COLUMN=dept_code   # 부서 코드 컬럼명
 * EXTERNAL_DEPT_NAME_COLUMN=dept_name   # 부서명 컬럼명
 * EXTERNAL_DEPT_PARENT_COLUMN=parent_dept # 상위 부서 컬럼명 (선택)
 * EXTERNAL_DEPT_ACTIVE_COLUMN=is_active # 활성화 상태 컬럼명 (선택)
 */

// 외부 DB 사용 여부
const isExternalDbEnabled = process.env.EXTERNAL_DB_ENABLED === 'true';

// 외부 DB 연결 설정
let externalDb = null;

if (isExternalDbEnabled) {
  const externalDbConfig = {
    host: process.env.EXTERNAL_DB_HOST,
    port: process.env.EXTERNAL_DB_PORT || 5432,
    database: process.env.EXTERNAL_DB_NAME,
    username: process.env.EXTERNAL_DB_USERNAME,
    password: process.env.EXTERNAL_DB_PASSWORD,
    dialect: process.env.EXTERNAL_DB_DIALECT || 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };

  try {
    externalDb = new Sequelize(
      externalDbConfig.database,
      externalDbConfig.username,
      externalDbConfig.password,
      {
        host: externalDbConfig.host,
        port: externalDbConfig.port,
        dialect: externalDbConfig.dialect,
        logging: externalDbConfig.logging,
        pool: externalDbConfig.pool
      }
    );

    console.log('✅ 외부 DB 연결 설정 완료');
  } catch (error) {
    console.error('❌ 외부 DB 연결 설정 실패:', error.message);
  }
}

// 부서 테이블 설정
const deptTableConfig = {
  tableName: process.env.EXTERNAL_DEPT_TABLE || 'TBCPPD001M00',
  columns: {
    code: process.env.EXTERNAL_DEPT_CODE_COLUMN || 'DPCD',
    name: process.env.EXTERNAL_DEPT_NAME_COLUMN || 'DPNM',
    parent: process.env.EXTERNAL_DEPT_PARENT_COLUMN || null,  // 상위 부서 없음
    active: process.env.EXTERNAL_DEPT_ACTIVE_COLUMN || null   // 활성화 컬럼 없음
  }
};

// 외부 DB에서 부서 목록 조회
async function getDepartmentsFromExternalDb() {
  if (!isExternalDbEnabled || !externalDb) {
    console.log('⚠️ 외부 DB가 비활성화되어 있습니다. 기본 부서 목록을 사용합니다.');
    return getDefaultDepartments();
  }

  try {
    // 외부 DB 연결 테스트
    await externalDb.authenticate();

    // 부서 목록 조회 (Oracle)
    const query = `
      SELECT 
        ${deptTableConfig.columns.code} as "deptCode",
        ${deptTableConfig.columns.name} as "deptName"
      FROM ${deptTableConfig.tableName}
      ORDER BY ${deptTableConfig.columns.code}
    `;

    const [results] = await externalDb.query(query);
    
    console.log(`✅ 외부 DB에서 ${results.length}개의 부서 정보를 가져왔습니다.`);
    console.log(`📋 테이블: ${deptTableConfig.tableName}`);
    return results;
  } catch (error) {
    console.error('❌ 외부 DB 부서 조회 실패:', error.message);
    console.log('⚠️ 기본 부서 목록을 사용합니다.');
    return getDefaultDepartments();
  }
}

// 기본 부서 목록 (외부 DB 연동 전까지 사용)
function getDefaultDepartments() {
  return [
    { deptCode: 'IT001', deptName: 'IT팀', parentDept: null },
    { deptCode: 'IT002', deptName: 'IT기획팀', parentDept: 'IT001' },
    { deptCode: 'IT003', deptName: 'IT개발팀', parentDept: 'IT001' },
    { deptCode: 'IT004', deptName: 'IT운영팀', parentDept: 'IT001' },
    { deptCode: 'SEC001', deptName: '보안팀', parentDept: null },
    { deptCode: 'GA001', deptName: '총무팀', parentDept: null },
    { deptCode: 'PL001', deptName: '기획팀', parentDept: null },
    { deptCode: 'SA001', deptName: '영업팀', parentDept: null },
    { deptCode: 'MK001', deptName: '마케팅팀', parentDept: null },
    { deptCode: 'FI001', deptName: '재무팀', parentDept: null },
    { deptCode: 'ST001', deptName: '증권팀', parentDept: null },
    { deptCode: 'DA001', deptName: '데이터팀', parentDept: null },
    { deptCode: 'HR001', deptName: '인사팀', parentDept: null }
  ];
}

// 외부 DB 연결 테스트
async function testExternalDbConnection() {
  if (!isExternalDbEnabled || !externalDb) {
    return {
      success: false,
      message: '외부 DB가 비활성화되어 있습니다.'
    };
  }

  try {
    await externalDb.authenticate();
    return {
      success: true,
      message: '외부 DB 연결 성공'
    };
  } catch (error) {
    return {
      success: false,
      message: `외부 DB 연결 실패: ${error.message}`
    };
  }
}

/**
 * IP 주소로 사용자 정보 조회 (Oracle DB)
 * @param {string} clientIP - 클라이언트 IP 주소
 * @returns {Promise<Object|null>} 사용자 정보 또는 null
 */
async function getUserByIP(clientIP) {
  // 외부 DB가 비활성화된 경우 null 반환
  if (!isExternalDbEnabled()) {
    console.log('⚠️  외부 DB 비활성화 - 사용자 정보 조회 불가');
    return null;
  }

  try {
    // 외부 DB 연결 확인
    if (!externalDb) {
      console.log('⚠️  외부 DB 연결 실패 - 사용자 정보 조회 불가');
      return null;
    }

    // 환경변수에서 테이블/컬럼 정보 가져오기
    const userTable = process.env.EXTERNAL_USER_TABLE || 'TBCPPU001I01';
    const ipTable = process.env.EXTERNAL_IP_TABLE || 'TBCPPD001I01';
    const userNameColumn = process.env.EXTERNAL_USER_NAME_COLUMN || 'FLNM';
    const userEmpnoColumn = process.env.EXTERNAL_USER_EMPNO_COLUMN || 'EMPNO';
    const ipAddressColumn = process.env.EXTERNAL_IP_ADDRESS_COLUMN || 'IPAD';
    const ipEmpnoColumn = process.env.EXTERNAL_IP_EMPNO_COLUMN || 'EMPNO';

    console.log(`🔍 사용자 정보 조회 시도: IP ${clientIP}`);

    // Oracle DB에서 사용자 정보 조회
    const query = `
      SELECT 
        A.${userEmpnoColumn} AS empno,
        A.${userNameColumn} AS userName,
        B.${ipAddressColumn} AS ipAddress
      FROM ${userTable} A
      LEFT JOIN ${ipTable} B
      ON A.${userEmpnoColumn} = B.${ipEmpnoColumn}
      WHERE B.${ipAddressColumn} = :clientIP
    `;

    const result = await externalDb.query(query, {
      replacements: { clientIP },
      type: QueryTypes.SELECT
    });

    if (result && result.length > 0) {
      const user = result[0];
      console.log(`✅ 사용자 정보 조회 성공: ${user.userName} (${user.empno})`);
      
      return {
        id: user.empno,
        name: user.userName,
        empno: user.empno,
        ipAddress: user.ipAddress
      };
    }

    console.log(`⚠️  사용자 정보 없음: IP ${clientIP}`);
    return null;
  } catch (error) {
    console.error('❌ 사용자 정보 조회 실패:', error);
    return null;
  }
}

module.exports = {
  externalDb,
  isExternalDbEnabled,
  deptTableConfig,
  getDepartmentsFromExternalDb,
  getDefaultDepartments,
  testExternalDbConnection,
  getUserByIP
};

