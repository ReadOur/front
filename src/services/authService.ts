/**
 * 인증 관련 API 서비스
 */

import { apiClient } from '@/api/client';
import { AUTH_ENDPOINTS, USER_ENDPOINTS } from '@/api/endpoints';
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  FindIdRequest,
  FindIdResponse,
  ResetPasswordRequest,
  ChangePasswordRequest,
} from '@/types';

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

/**
 * 아이디(이메일) 찾기
 */
export async function findId(data: FindIdRequest): Promise<FindIdResponse> {
  return apiClient.post<FindIdResponse, FindIdRequest>(USER_ENDPOINTS.FIND_ID, data);
}

/**
 * 비밀번호 재설정 (임시 비밀번호 발급)
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<void> {
  await apiClient.post<void, ResetPasswordRequest>(USER_ENDPOINTS.RESET_PASSWORD, data);
}

/**
 * 비밀번호 변경 (로그인된 사용자)
 */
export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await apiClient.post<void, ChangePasswordRequest>(USER_ENDPOINTS.CHANGE_PASSWORD, data);
}

export const authService = {
  login,
  signup,
  logout,
  findId,
  resetPassword,
  changePassword,
};

export default authService;
