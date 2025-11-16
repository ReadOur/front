/**
 * 사용자 관련 API 서비스
 */

import { apiClient } from "@/api/client";
import { USER_ENDPOINTS } from "@/api/endpoints";
import { MyPagePreview, UserProfilePreview, UpdateProfileRequest } from "@/types";

/**
 * 내 마이페이지 조회
 * GET /my-page
 * - 내 프로필 정보
 * - 최근 작성한 게시글 5개 (myPosts)
 * - 최근 댓글 단 게시글 5개 (myComments)
 * - 최근 좋아요 누른 게시글 5개 (likedPosts)
 */
export async function getMyPage(): Promise<MyPagePreview> {
  return apiClient.get<MyPagePreview>(USER_ENDPOINTS.MY_PAGE);
}

/**
 * 특정 사용자 프로필 조회
 * TODO: 백엔드 API 구현 확인 필요
 */
export async function getUserProfile(userId: string): Promise<UserProfilePreview> {
  return apiClient.get<UserProfilePreview>(USER_ENDPOINTS.USER_PROFILE(userId));
}

/**
 * 프로필 수정
 * TODO: 백엔드 API 구현 확인 필요
 */
export async function updateProfile(
  userId: string,
  data: UpdateProfileRequest
): Promise<UserProfilePreview> {
  return apiClient.put<UserProfilePreview>(USER_ENDPOINTS.UPDATE_PROFILE(userId), data);
}

export const userService = {
  getMyPage,
  getUserProfile,
  updateProfile,
};

export default userService;
