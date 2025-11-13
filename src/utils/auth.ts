/**
 * 인증 관련 유틸리티 함수
 */

import { getLocalStorage, setLocalStorage, removeLocalStorage } from './storage';

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
