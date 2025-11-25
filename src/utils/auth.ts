/**
 * 인증 관련 유틸리티 함수
 */

/**
 * localStorage 키
 */
export const ACCESS_TOKEN_KEY = 'accessToken';

/**
 * JWT Access Token에서 userId/sub/id/uid 후보 키를 추출해 문자열로 반환합니다.
 */
export function extractUserIdFromToken(token?: string | null): string | undefined {
  if (!token) return undefined;

  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    const rawId = payload.userId ?? payload.sub ?? payload.id ?? payload.uid;
    return rawId ? rawId.toString() : undefined;
  } catch (error) {
    console.warn('토큰에서 userId를 파싱하지 못했습니다:', error);
    return undefined;
  }
}

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
