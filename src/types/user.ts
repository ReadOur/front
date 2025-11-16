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
  tokenType: string;
  accessToken: string;
  accessTokenExpiresAt: string;
}

/**
 * 회원가입 요청
 */
export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string; // YYYY-MM-DD 형식
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

// ===== 계정 관리 =====

/**
 * 아이디(이메일) 찾기 요청
 */
export interface FindIdRequest {
  nickname: string;
  birthDate: string; // YYYY-MM-DD 형식
}

/**
 * 아이디(이메일) 찾기 응답
 */
export interface FindIdResponse {
  email: string;
}

/**
 * 비밀번호 재설정(임시 비밀번호 발급) 요청
 */
export interface ResetPasswordRequest {
  email: string;
  nickname: string;
  birthDate: string; // YYYY-MM-DD 형식
}

/**
 * 비밀번호 변경 요청
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ===== 마이페이지 관련 =====

/**
 * 마이페이지 미리보기 (본인용)
 */
export interface MyPagePreview {
  userId: string;
  nickname: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  postCount: number;
  commentCount: number;
  likedPostCount: number;
  createdAt?: string;
}

/**
 * 사용자 프로필 미리보기 (다른 사용자 조회용)
 */
export interface UserProfilePreview {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  bio?: string;
  postCount: number;
  commentCount: number;
  likedPostCount: number;
}
