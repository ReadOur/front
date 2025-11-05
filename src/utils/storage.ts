/**
 * 로컬 스토리지 및 세션 스토리지 유틸리티
 */

/**
 * 로컬 스토리지에 값 저장 (JSON 직렬화)
 */
export function setLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('로컬 스토리지 저장 실패:', error);
  }
}

/**
 * 로컬 스토리지에서 값 가져오기 (JSON 역직렬화)
 */
export function getLocalStorage<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue ?? null;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error('로컬 스토리지 읽기 실패:', error);
    return defaultValue ?? null;
  }
}

/**
 * 로컬 스토리지에서 값 제거
 */
export function removeLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('로컬 스토리지 삭제 실패:', error);
  }
}

/**
 * 로컬 스토리지 전체 클리어
 */
export function clearLocalStorage(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('로컬 스토리지 클리어 실패:', error);
  }
}

/**
 * 세션 스토리지에 값 저장 (JSON 직렬화)
 */
export function setSessionStorage<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('세션 스토리지 저장 실패:', error);
  }
}

/**
 * 세션 스토리지에서 값 가져오기 (JSON 역직렬화)
 */
export function getSessionStorage<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = sessionStorage.getItem(key);
    if (item === null) return defaultValue ?? null;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error('세션 스토리지 읽기 실패:', error);
    return defaultValue ?? null;
  }
}

/**
 * 세션 스토리지에서 값 제거
 */
export function removeSessionStorage(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error('세션 스토리지 삭제 실패:', error);
  }
}
