/**
 * 인증 관련 유틸리티 함수
 */

/**
 * localStorage 키
 */
export const ACCESS_TOKEN_KEY = 'accessToken';

/**
 * 로그인 여부 확인
 * @returns accessToken이 있으면 true
 */
export function isLoggedIn(): boolean {
  return getAccessToken() !== null;
}

/**
 * 게스트 여부 확인
 * @returns accessToken이 없으면 true
 */
export function isGuest(): boolean {
  return getAccessToken() === null;
}

/**
 * Access Token 가져오기
 * @returns Access Token (없으면 null)
 *
 * 주의: 토큰은 단순 문자열이므로 JSON.stringify/parse를 사용하지 않고 직접 저장/로드
 */
export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('토큰 읽기 실패:', error);
    return null;
  }
}

/**
 * Access Token 저장
 *
 * 주의: 토큰은 단순 문자열이므로 JSON.stringify/parse를 사용하지 않고 직접 저장/로드
 */
export function setAccessToken(token: string): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error('토큰 저장 실패:', error);
  }
}

/**
 * Access Token 제거
 */
export function removeAccessToken(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('토큰 삭제 실패:', error);
  }
}
