// ============================================
// 날짜 계산 유틸리티 함수
// ============================================

// 나이 계산 함수
const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// 기간 계산 함수 (년 단위, 소수점 2자리)
// startDate: 시작일, endDate: 종료일 (없으면 오늘 날짜 기준)
const calculateYearsDiff = (startDate, endDate = null) => {
  if (!startDate) return null;
  
  const end = endDate ? new Date(endDate) : new Date();
  const start = new Date(startDate);
  
  // 시작일이 종료일보다 늦으면 0 반환
  if (start > end) return 0;
  
  const diffTime = Math.abs(end - start);
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  
  // 소수점 2자리까지 반올림 (예: 1.50)
  return parseFloat(diffYears.toFixed(2));
};

