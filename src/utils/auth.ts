/**
 * 인증 관련 유틸리티 함수
 */

import { getLocalStorage, setLocalStorage, removeLocalStorage } from './storage';

/**
 * 게스트 사용자 ID 상수
 */
export const GUEST_USER_ID = -1;

/**
 * localStorage 키
 */
export const USER_ID_KEY = 'userId';
export const ACCESS_TOKEN_KEY = 'accessToken';

/**
 * 현재 사용자 ID 가져오기
 * @returns 사용자 ID (없으면 GUEST_USER_ID 반환)
 */
export function getUserId(): number {
  const userId = getLocalStorage<number>(USER_ID_KEY);
  return userId ?? GUEST_USER_ID;
}

/**
 * 사용자 ID 저장
 */
export function setUserId(userId: number): void {
  setLocalStorage(USER_ID_KEY, userId);
}

/**
 * 사용자 ID 제거 (로그아웃)
 */
export function removeUserId(): void {
  removeLocalStorage(USER_ID_KEY);
}

/**
 * 로그인 여부 확인
 * @returns 게스트가 아니면 true
 */
export function isLoggedIn(): boolean {
  return getUserId() !== GUEST_USER_ID;
}

/**
 * 게스트 여부 확인
 * @returns 게스트면 true
 */
export function isGuest(): boolean {
  return getUserId() === GUEST_USER_ID;
}

/**
 * Access Token 가져오기
 * @returns Access Token (없으면 null)
 */
export function getAccessToken(): string | null {
  return getLocalStorage<string>(ACCESS_TOKEN_KEY);
}

/**
 * Access Token 저장
 */
export function setAccessToken(token: string): void {
  setLocalStorage(ACCESS_TOKEN_KEY, token);
}

/**
 * Access Token 제거
 */
export function removeAccessToken(): void {
  removeLocalStorage(ACCESS_TOKEN_KEY);
}

/**
 * JWT 토큰에서 사용자 ID 추출
 * @param token JWT Access Token
 * @returns 사용자 ID (추출 실패 시 null)
 */
export function extractUserIdFromToken(token: string): number | null {
  try {
    // JWT는 header.payload.signature 형식
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // payload (base64url 디코딩)
    const payload = JSON.parse(atob(parts[1]));

    // sub 필드에서 사용자 ID 추출
    const userId = payload.sub ? parseInt(payload.sub, 10) : null;
    return userId;
  } catch (error) {
    console.error('Failed to extract user ID from token:', error);
    return null;
  }
}

/**
 * JWT 토큰에서 이메일 추출
 * @param token JWT Access Token
 * @returns 이메일 (추출 실패 시 null)
 */
export function extractEmailFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload.email || null;
  } catch (error) {
    console.error('Failed to extract email from token:', error);
    return null;
  }
}
