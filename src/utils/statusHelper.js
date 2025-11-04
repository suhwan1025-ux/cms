/**
 * 품의서 상태를 한글로 변환하는 헬퍼 함수
 * 시스템에서 사용하는 상태: draft(작성중), pending(결재대기), approved(결재완료)
 */

export const getStatusLabel = (status) => {
  const statusMap = {
    'draft': '작성중',
    'pending': '결재대기',
    'approved': '결재완료'
  };

  return statusMap[status] || status;
};

/**
 * 품의서 상태별 색상 반환
 */
export const getStatusColor = (status) => {
  const colorMap = {
    'draft': '#999',        // 작성중: 회색
    'pending': '#ff9800',   // 결재대기: 주황색
    'approved': '#4caf50'   // 결재완료: 녹색
  };

  return colorMap[status] || '#666';
};

/**
 * 품의서 상태별 배경색 반환
 */
export const getStatusBgColor = (status) => {
  const bgColorMap = {
    'draft': '#f5f5f5',     // 작성중: 밝은 회색
    'pending': '#fff3e0',   // 결재대기: 밝은 주황색
    'approved': '#e8f5e9'   // 결재완료: 밝은 녹색
  };

  return bgColorMap[status] || '#f5f5f5';
};

