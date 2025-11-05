/**
 * 사용자 관련 타입 정의
 */

import { BaseEntity } from "./api";

// ===== 사용자 엔티티 =====

/**
 * 사용자 정보
 */
export interface User extends BaseEntity {
  email: string;
  nickname: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  isActive: boolean;
}

/**
 * 사용자 역할
 */
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
}

/**
 * 사용자 프로필 (공개 정보만)
 */
export interface UserProfile {
  id: string;
  nickname: string;
  avatarUrl?: string;
  bio?: string;
}

// ===== 인증 관련 =====

/**
 * 로그인 요청
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 로그인 응답
 */
export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * 회원가입 요청
 */
export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
  /**
   * 선택 사용자 아이디 (이메일과 별개의 로그인 ID)
   */
  userId?: string;
}

/**
 * 토큰 갱신 요청
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * 토큰 갱신 응답
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ===== 프로필 수정 =====

/**
 * 프로필 수정 요청
 */
export interface UpdateProfileRequest {
  nickname?: string;
  bio?: string;
  avatarUrl?: string;
}
