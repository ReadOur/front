/**
 * 인증 관련 유틸리티 함수
 */

import { getLocalStorage, setLocalStorage, removeLocalStorage } from './storage';

/**
 * 게스트 사용자 ID 상수
 */
export const GUEST_USER_ID = 'guest';

/**
 * localStorage 키
 */
export const USER_ID_KEY = 'userId';

/**
 * 현재 사용자 ID 가져오기
 * @returns 사용자 ID (없으면 GUEST_USER_ID 반환)
 */
export function getUserId(): string {
  const userId = getLocalStorage<string>(USER_ID_KEY);
  return userId ?? GUEST_USER_ID;
}

/**
 * 사용자 ID 저장
 */
export function setUserId(userId: string): void {
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
