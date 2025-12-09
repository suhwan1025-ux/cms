// 품의서 비교 및 변경사항 표시 유틸리티

/**
 * 두 값을 비교하여 변경 여부 확인
 */
export const hasChanged = (oldValue, newValue) => {
  // null, undefined, 빈 문자열을 모두 같은 것으로 취급
  const normalizeValue = (val) => {
    if (val === null || val === undefined || val === '') return '';
    if (typeof val === 'number') return val.toString();
    return String(val).trim();
  };
  
  const normalizedOld = normalizeValue(oldValue);
  const normalizedNew = normalizeValue(newValue);
  
  return normalizedOld !== normalizedNew;
};

/**
 * 변경된 값을 취소선과 함께 표시 (한 줄 형식)
 */
export const renderChangedValue = (oldValue, newValue) => {
  if (!hasChanged(oldValue, newValue)) {
    return newValue || '-';
  }
  
  const oldDisplay = oldValue || '-';
  const newDisplay = newValue || '-';
  
  return `<span style="text-decoration: line-through; color: #999;">${oldDisplay}</span> <span style="color: #d32f2f;">→</span> <span style="color: #d32f2f; font-weight: bold;">${newDisplay}</span>`;
};

/**
 * 배열을 비교하여 변경 여부 확인
 */
export const hasArrayChanged = (oldArray, newArray) => {
  if (!oldArray && !newArray) return false;
  if (!oldArray || !newArray) return true;
  if (oldArray.length !== newArray.length) return true;
  
  // 간단한 문자열 배열 비교
  if (typeof oldArray[0] === 'string') {
    return JSON.stringify(oldArray.sort()) !== JSON.stringify(newArray.sort());
  }
  
  return false;
};

/**
 * 배열 변경사항 표시 (한 줄 형식)
 */
export const renderChangedArray = (oldArray, newArray) => {
  if (!hasArrayChanged(oldArray, newArray)) {
    return (newArray || []).join(', ') || '-';
  }
  
  const oldDisplay = (oldArray || []).join(', ') || '-';
  const newDisplay = (newArray || []).join(', ') || '-';
  
  return `<span style="text-decoration: line-through; color: #999;">${oldDisplay}</span> <span style="color: #d32f2f;">→</span> <span style="color: #d32f2f; font-weight: bold;">${newDisplay}</span>`;
};

/**
 * 숫자(금액) 변경사항 비교
 */
export const hasNumberChanged = (oldNum, newNum) => {
  const normalizeNum = (num) => {
    if (num === null || num === undefined || num === '') return 0;
    return parseFloat(num) || 0;
  };
  
  return normalizeNum(oldNum) !== normalizeNum(newNum);
};

/**
 * 숫자 변경사항 표시 (포맷 함수와 함께 사용, 한 줄 형식)
 */
export const renderChangedNumber = (oldNum, newNum, formatter) => {
  if (!hasNumberChanged(oldNum, newNum)) {
    return formatter ? formatter(newNum) : (newNum || '-');
  }
  
  const oldDisplay = formatter ? formatter(oldNum) : (oldNum || '-');
  const newDisplay = formatter ? formatter(newNum) : (newNum || '-');
  
  return `<span style="text-decoration: line-through; color: #999;">${oldDisplay}</span> <span style="color: #d32f2f;">→</span> <span style="color: #d32f2f; font-weight: bold;">${newDisplay}</span>`;
};

/**
 * 품목 배열 비교 (구매품목 또는 용역품목)
 */
export const compareItems = (oldItems, newItems) => {
  const changes = {
    added: [],
    removed: [],
    modified: []
  };
  
  if (!oldItems && !newItems) return changes;
  if (!oldItems) {
    changes.added = newItems || [];
    return changes;
  }
  if (!newItems) {
    changes.removed = oldItems || [];
    return changes;
  }
  
  // 간단한 비교: 개수나 내용이 다르면 수정으로 표시
  if (JSON.stringify(oldItems) !== JSON.stringify(newItems)) {
    changes.modified = {
      old: oldItems,
      new: newItems
    };
  }
  
  return changes;
};

