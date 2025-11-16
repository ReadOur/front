/**
 * 사용자 관련 API 서비스
 */

import { apiClient } from "@/api/client";
import { USER_ENDPOINTS } from "@/api/endpoints";
import {
  MyPagePreview,
  UserProfilePreview,
  UpdateProfileRequest,
  PaginatedResponse,
  PostListItem,
  Comment,
} from "@/types";

/**
 * 내 마이페이지 조회 (미리보기)
 */
export async function getMyProfile(): Promise<MyPagePreview> {
  return apiClient.get<MyPagePreview>(USER_ENDPOINTS.MY_PROFILE);
}

/**
 * 특정 사용자 프로필 조회 (미리보기)
 */
export async function getUserProfile(userId: string): Promise<UserProfilePreview> {
  return apiClient.get<UserProfilePreview>(USER_ENDPOINTS.USER_PROFILE(userId));
}

/**
 * 내가 좋아요 누른 게시글 목록 조회
 */
export async function getMyLikedPosts(params?: {
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<PostListItem>> {
  return apiClient.get<PaginatedResponse<PostListItem>>(USER_ENDPOINTS.MY_LIKED_POSTS, {
    params: { page: params?.page || 0, size: params?.size || 20 },
  });
}

/**
 * 특정 사용자가 좋아요 누른 게시글 목록 조회
 */
export async function getUserLikedPosts(
  userId: string,
  params?: { page?: number; size?: number }
): Promise<PaginatedResponse<PostListItem>> {
  return apiClient.get<PaginatedResponse<PostListItem>>(
    USER_ENDPOINTS.USER_LIKED_POSTS(userId),
    {
      params: { page: params?.page || 0, size: params?.size || 20 },
    }
  );
}

/**
 * 내가 작성한 게시글 목록 조회
 */
export async function getMyPosts(params?: {
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<PostListItem>> {
  return apiClient.get<PaginatedResponse<PostListItem>>(USER_ENDPOINTS.MY_POSTS, {
    params: { page: params?.page || 0, size: params?.size || 20 },
  });
}

/**
 * 특정 사용자가 작성한 게시글 목록 조회
 */
export async function getUserPosts(
  userId: string,
  params?: { page?: number; size?: number }
): Promise<PaginatedResponse<PostListItem>> {
  return apiClient.get<PaginatedResponse<PostListItem>>(USER_ENDPOINTS.USER_POSTS(userId), {
    params: { page: params?.page || 0, size: params?.size || 20 },
  });
}

/**
 * 내가 작성한 댓글 목록 조회
 */
export async function getMyComments(params?: {
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<Comment>> {
  return apiClient.get<PaginatedResponse<Comment>>(USER_ENDPOINTS.MY_COMMENTS, {
    params: { page: params?.page || 0, size: params?.size || 20 },
  });
}

/**
 * 특정 사용자가 작성한 댓글 목록 조회
 */
export async function getUserComments(
  userId: string,
  params?: { page?: number; size?: number }
): Promise<PaginatedResponse<Comment>> {
  return apiClient.get<PaginatedResponse<Comment>>(USER_ENDPOINTS.USER_COMMENTS(userId), {
    params: { page: params?.page || 0, size: params?.size || 20 },
  });
}

/**
 * 프로필 수정
 */
export async function updateProfile(
  userId: string,
  data: UpdateProfileRequest
): Promise<UserProfilePreview> {
  return apiClient.put<UserProfilePreview>(USER_ENDPOINTS.UPDATE_PROFILE(userId), data);
}

export const userService = {
  getMyProfile,
  getUserProfile,
  getMyLikedPosts,
  getUserLikedPosts,
  getMyPosts,
  getUserPosts,
  getMyComments,
  getUserComments,
  updateProfile,
};
