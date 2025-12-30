require('dotenv').config();
const { Sequelize, QueryTypes } = require('sequelize');

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
  const dialect = process.env.EXTERNAL_DB_DIALECT || 'postgres';
  const isOracle = dialect === 'oracle';

  try {
    if (isOracle) {
      // Oracle 전용 연결 설정
      const connectString = process.env.EXTERNAL_DB_CONNECT_STRING || 
        `${process.env.EXTERNAL_DB_HOST}:${process.env.EXTERNAL_DB_PORT || 1521}/${process.env.EXTERNAL_DB_SERVICE_NAME || process.env.EXTERNAL_DB_NAME}`;

      console.log('🔗 Oracle 연결 시도...');
      console.log(`   - Connect String: ${connectString}`);
      console.log(`   - Username: ${process.env.EXTERNAL_DB_USERNAME}`);

      externalDb = new Sequelize({
        username: process.env.EXTERNAL_DB_USERNAME,
        password: process.env.EXTERNAL_DB_PASSWORD,
        database: process.env.EXTERNAL_DB_NAME,
        dialect: 'oracle',
        dialectOptions: {
          connectString: connectString
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        logging: console.log
      });
    } else {
      // PostgreSQL 또는 기타 DB
      externalDb = new Sequelize(
        process.env.EXTERNAL_DB_NAME,
        process.env.EXTERNAL_DB_USERNAME,
        process.env.EXTERNAL_DB_PASSWORD,
        {
          host: process.env.EXTERNAL_DB_HOST,
          port: process.env.EXTERNAL_DB_PORT || 5432,
          dialect: dialect,
          logging: console.log,
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
          }
        }
      );
    }

    console.log('✅ 외부 DB 연결 설정 완료');
  } catch (error) {
    console.error('❌ 외부 DB 연결 설정 실패:', error.message);
    console.error('   전체 에러:', error);
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

    // 부서 목록 조회 (Oracle) - NULL/빈 값 필터링 추가
    const query = `
      SELECT 
        ${deptTableConfig.columns.code} as "deptCode",
        ${deptTableConfig.columns.name} as "deptName"
      FROM ${deptTableConfig.tableName}
      WHERE ${deptTableConfig.columns.code} IS NOT NULL
        AND ${deptTableConfig.columns.name} IS NOT NULL
        AND MANG_YN = 'Y'
      ORDER BY ${deptTableConfig.columns.code}
    `;

    const [results] = await externalDb.query(query);
    
    console.log(`✅ 외부 DB에서 ${results.length}개의 부서 정보를 가져왔습니다.`);
    console.log(`📋 테이블: ${deptTableConfig.tableName}`);
    console.log(`📋 샘플 데이터:`, results.slice(0, 3));
    return results;
  } catch (error) {
    console.error('❌ 외부 DB 부서 조회 실패:', error.message);
    console.log('⚠️ 기본 부서 목록을 사용합니다.');
    return getDefaultDepartments();
  }
}

// 기본 부서 목록 (외부 DB 연동 전까지 사용)
function getDefaultDepartments() {
  console.log('⚠️  기본 부서 목록 사용 중 (외부 DB 미연동)');
  return [
    { deptCode: 'IT001', deptName: 'IT팀', parentDept: null, description: 'IT 본부' },
    { deptCode: 'IT002', deptName: 'IT기획팀', parentDept: 'IT001', description: 'IT 기획' },
    { deptCode: 'IT003', deptName: 'IT개발팀', parentDept: 'IT001', description: 'IT 개발' },
    { deptCode: 'IT004', deptName: 'IT운영팀', parentDept: 'IT001', description: 'IT 운영' },
    { deptCode: 'SEC001', deptName: '보안팀', parentDept: null, description: '정보보안' },
    { deptCode: 'GA001', deptName: '총무팀', parentDept: null, description: '총무/관리' },
    { deptCode: 'PL001', deptName: '기획팀', parentDept: null, description: '경영기획' },
    { deptCode: 'SA001', deptName: '영업팀', parentDept: null, description: '영업' },
    { deptCode: 'MK001', deptName: '마케팅팀', parentDept: null, description: '마케팅' },
    { deptCode: 'FI001', deptName: '재무팀', parentDept: null, description: '재무/회계' },
    { deptCode: 'ST001', deptName: '증권팀', parentDept: null, description: '증권' },
    { deptCode: 'DA001', deptName: '데이터팀', parentDept: null, description: '데이터분석' },
    { deptCode: 'HR001', deptName: '인사팀', parentDept: null, description: '인사' }
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
/**
 * IP 주소를 DB 저장 형식으로 변환
 * 예: 172.17.162.50 → 172017162050
 */
function formatIPForDB(ip) {
  try {
    const octets = ip.split('.');
    if (octets.length !== 4) {
      console.warn(`⚠️  잘못된 IP 형식: ${ip}`);
      return ip;
    }
    
    // 각 옥텟을 3자리로 패딩 (앞에 0 추가)
    const formatted = octets.map(octet => octet.padStart(3, '0')).join('');
    return formatted;
  } catch (error) {
    console.error('IP 변환 오류:', error);
    return ip;
  }
}

async function getUserByIP(clientIP) {
  // 외부 DB가 비활성화된 경우 null 반환
  if (!isExternalDbEnabled) {
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

    // IP 주소를 DB 저장 형식으로 변환
    const formattedIP = formatIPForDB(clientIP);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 [Oracle DB] 사용자 정보 조회 시도');
    console.log(`   📌 원본 IP: ${clientIP}`);
    console.log(`   📌 변환된 IP: ${formattedIP}`);
    console.log(`   📊 사용자 테이블: ${userTable}`);
    console.log(`   📊 IP 매핑 테이블: ${ipTable}`);
    console.log(`   📋 컬럼: ${userNameColumn}, ${userEmpnoColumn}, ${ipAddressColumn}`);

    // Oracle DB에서 사용자 정보 조회
    // ⚠️ Oracle은 alias를 큰따옴표로 감싸야 대소문자 유지됨!
    const query = `
      SELECT 
        A.${userEmpnoColumn} AS "empno",
        A.${userNameColumn} AS "userName",
        B.${ipAddressColumn} AS "ipAddress"
      FROM ${userTable} A
      LEFT JOIN ${ipTable} B
      ON A.${userEmpnoColumn} = B.${ipEmpnoColumn}
      WHERE B.${ipAddressColumn} = :clientIP
    `;

    console.log(`   📝 실행 쿼리:`);
    console.log(query.trim().split('\n').map(line => `      ${line.trim()}`).join('\n'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const result = await externalDb.query(query, {
      replacements: { clientIP: formattedIP },
      type: QueryTypes.SELECT
    });

    console.log(`   📊 조회 결과: ${result ? result.length : 0}개`);

    if (result && result.length > 0) {
      const user = result[0];
      console.log('   ✅ 사용자 발견!');
      console.log('      🔍 결과 객체 구조:', JSON.stringify(user, null, 2));
      console.log(`      - 이름: ${user.userName}`);
      console.log(`      - 사번: ${user.empno}`);
      console.log(`      - IP: ${user.ipAddress}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return {
        id: user.empno,
        name: user.userName,
        empno: user.empno,
        ipAddress: user.ipAddress
      };
    }

    console.log(`   ⚠️  조회 결과 없음!`);
    console.log(`   💡 힌트: Oracle DB의 ${ipTable} 테이블에 IP ${clientIP} 매핑 데이터가 있는지 확인하세요.`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return null;
  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [Oracle DB] 사용자 정보 조회 실패!');
    console.error(`   🔴 에러 타입: ${error.name}`);
    console.error(`   🔴 에러 메시지: ${error.message}`);
    if (error.original) {
      console.error(`   🔴 Oracle 에러: ${error.original.message}`);
    }
    console.log('   💡 힌트:');
    console.log('      1. Oracle DB 연결 상태 확인');
    console.log('      2. 테이블명/컬럼명이 정확한지 확인');
    console.log('      3. 사용자 권한 확인 (SELECT 권한)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return null;
  }
}

/**
 * 외부 DB에서 내부인력 명단 조회 및 동기화 비교
 * 조건: TNOF_CLS_CODE = '10' AND SUBSTR(EMPNO,1,1) <> 'S' AND BLNG_DPCD IN (SELECT DPCD FROM TBCPPD001M00 WHERE MANG_YN = 'Y' AND BSOP_HDQR_CODE IN ('69','49'))
 */
async function getInternalPersonnelFromExternalDb() {
  if (!isExternalDbEnabled || !externalDb) {
    console.log('⚠️ 외부 DB가 비활성화되어 있거나 연결되지 않았습니다.');
    return [];
  }

  try {
    const query = `
      SELECT 
        EMPNO, 
        FLNM 
      FROM TBCPPU001I00 
      WHERE TNOF_CLS_CODE = '10' 
        AND REGEXP_LIKE(SUBSTR(EMPNO, 1, 1), '^[0-9]')
        AND BLNG_DPCD IN (
          SELECT DPCD 
          FROM TBCPPD001M00 
          WHERE MANG_YN = 'Y' 
            AND BSOP_HDQR_CODE IN ('69','49')
        )
    `;

    console.log('🔍 [Oracle DB] 내부인력 명단 조회');
    const results = await externalDb.query(query, {
      type: QueryTypes.SELECT
    });
    
    console.log(`✅ 조회 결과: ${results.length}명`);
    return results;
  } catch (error) {
    console.error('❌ 내부인력 조회 실패:', error.message);
    throw error;
  }
}

module.exports = {
  externalDb,
  isExternalDbEnabled,
  deptTableConfig,
  getDepartmentsFromExternalDb,
  getDefaultDepartments,
  testExternalDbConnection,
  getUserByIP,
  getInternalPersonnelFromExternalDb
};

