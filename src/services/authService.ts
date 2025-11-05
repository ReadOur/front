/**
 * 인증 관련 API 서비스
 */

import { apiClient } from '@/api/client';
import { AUTH_ENDPOINTS } from '@/api/endpoints';
import type { LoginRequest, LoginResponse, SignupRequest } from '@/types';

/**
 * 로그인
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse, LoginRequest>(AUTH_ENDPOINTS.LOGIN, data);
}

/**
 * 회원가입
 */
export async function signup(data: SignupRequest): Promise<void> {
  await apiClient.post<void, SignupRequest>(AUTH_ENDPOINTS.SIGNUP, data);
}

/**
 * 로그아웃
 */
export async function logout(): Promise<void> {
  await apiClient.post<void>(AUTH_ENDPOINTS.LOGOUT);
}

export const authService = {
  login,
  signup,
  logout,
};

export default authService;
