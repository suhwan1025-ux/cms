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
  tableName: process.env.EXTERNAL_DEPT_TABLE || 'departments',
  columns: {
    code: process.env.EXTERNAL_DEPT_CODE_COLUMN || 'dept_code',
    name: process.env.EXTERNAL_DEPT_NAME_COLUMN || 'dept_name',
    parent: process.env.EXTERNAL_DEPT_PARENT_COLUMN || 'parent_dept',
    active: process.env.EXTERNAL_DEPT_ACTIVE_COLUMN || 'is_active'
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

    // 부서 목록 조회
    const query = `
      SELECT 
        ${deptTableConfig.columns.code} as "deptCode",
        ${deptTableConfig.columns.name} as "deptName",
        ${deptTableConfig.columns.parent} as "parentDept"
      FROM ${deptTableConfig.tableName}
      ${deptTableConfig.columns.active ? `WHERE ${deptTableConfig.columns.active} = true` : ''}
      ORDER BY ${deptTableConfig.columns.code}
    `;

    const [results] = await externalDb.query(query);
    
    console.log(`✅ 외부 DB에서 ${results.length}개의 부서 정보를 가져왔습니다.`);
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

module.exports = {
  externalDb,
  isExternalDbEnabled,
  deptTableConfig,
  getDepartmentsFromExternalDb,
  getDefaultDepartments,
  testExternalDbConnection
};

