/**
 * 사용자 관련 API 서비스
 */

import { apiClient } from "@/api/client";
import { USER_ENDPOINTS } from "@/api/endpoints";
import {
  MyPagePreview,
  UserProfilePreview,
  UserProfilePostsResponse,
  UserProfileLikedPostsResponse,
  UserProfileCommentsResponse,
  UpdateProfileRequest,
  MyPagePostsResponse,
  MyPageLikedPostsResponse,
  MyPageCommentsResponse,
} from "@/types";

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
 * 특정 사용자 마이페이지 조회 (미리보기)
 * GET /api/users/{userId}/my-page
 * - 특정 사용자 프로필 정보
 * - 최근 작성한 게시글 5개 (myPosts)
 * - 최근 댓글 단 게시글 5개 (myComments)
 * - 최근 좋아요 누른 게시글 5개 (likedPosts)
 */
export async function getUserMyPage(userId: number | string): Promise<UserProfilePreview> {
  return apiClient.get<UserProfilePreview>(USER_ENDPOINTS.USER_MY_PAGE(userId));
}

/**
 * 특정 사용자 작성 게시글 전체 조회 (페이징)
 * GET /api/users/{userId}/my-page/posts?page=0&size=20&sort=createdAt,DESC
 */
export async function getUserMyPagePosts(
  userId: number | string,
  params?: {
    page?: number;
    size?: number;
    sort?: string;
  }
): Promise<UserProfilePostsResponse> {
  return apiClient.get<UserProfilePostsResponse>(USER_ENDPOINTS.USER_MY_PAGE_POSTS(userId), {
    params: {
      page: params?.page || 0,
      size: params?.size || 20,
      sort: params?.sort || "createdAt,DESC",
    },
  });
}

/**
 * 특정 사용자 좋아요 게시글 전체 조회 (페이징)
 * GET /api/users/{userId}/my-page/liked-posts?page=0&size=20&sort=createdAt,DESC
 */
export async function getUserMyPageLikedPosts(
  userId: number | string,
  params?: {
    page?: number;
    size?: number;
    sort?: string;
  }
): Promise<UserProfileLikedPostsResponse> {
  return apiClient.get<UserProfileLikedPostsResponse>(USER_ENDPOINTS.USER_MY_PAGE_LIKED_POSTS(userId), {
    params: {
      page: params?.page || 0,
      size: params?.size || 20,
      sort: params?.sort || "createdAt,DESC",
    },
  });
}

/**
 * 특정 사용자 작성 댓글 전체 조회 (페이징)
 * GET /api/users/{userId}/my-page/comments?page=0&size=20&sort=createdAt,DESC
 */
export async function getUserMyPageComments(
  userId: number | string,
  params?: {
    page?: number;
    size?: number;
    sort?: string;
  }
): Promise<UserProfileCommentsResponse> {
  return apiClient.get<UserProfileCommentsResponse>(USER_ENDPOINTS.USER_MY_PAGE_COMMENTS(userId), {
    params: {
      page: params?.page || 0,
      size: params?.size || 20,
      sort: params?.sort || "createdAt,DESC",
    },
  });
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

/**
 * 내가 작성한 게시글 전체 조회 (페이징)
 * GET /my-page/posts?page=0&size=20&sort=createdAt,DESC
 */
export async function getMyPosts(params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<MyPagePostsResponse> {
  return apiClient.get<MyPagePostsResponse>(USER_ENDPOINTS.MY_POSTS, {
    params: {
      page: params?.page || 0,
      size: params?.size || 20,
      sort: params?.sort || "createdAt,DESC",
    },
  });
}

/**
 * 좋아요 누른 글 전체 조회 (페이징)
 * GET /my-page/liked-posts?page=0&size=20&sort=createdAt,DESC
 */
export async function getMyLikedPosts(params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<MyPageLikedPostsResponse> {
  return apiClient.get<MyPageLikedPostsResponse>(USER_ENDPOINTS.MY_LIKED_POSTS, {
    params: {
      page: params?.page || 0,
      size: params?.size || 20,
      sort: params?.sort || "createdAt,DESC",
    },
  });
}

/**
 * 내가 작성한 댓글 전체 조회 (페이징)
 * GET /my-page/comments?page=0&size=20&sort=createdAt,DESC
 */
export async function getMyComments(params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<MyPageCommentsResponse> {
  return apiClient.get<MyPageCommentsResponse>(USER_ENDPOINTS.MY_COMMENTS, {
    params: {
      page: params?.page || 0,
      size: params?.size || 20,
      sort: params?.sort || "createdAt,DESC",
    },
  });
}

/**
 * 닉네임 수정
 * PATCH /users/me/nickname
 */
export async function updateNickname(nickname: string): Promise<void> {
  return apiClient.patch<void>(USER_ENDPOINTS.UPDATE_NICKNAME, { nickname });
}

/**
 * 이메일 수정
 * PATCH /users/me/email
 */
export async function updateEmail(email: string): Promise<void> {
  return apiClient.patch<void>(USER_ENDPOINTS.UPDATE_EMAIL, { email });
}

export const userService = {
  getMyPage,
  getUserMyPage,
  getUserMyPagePosts,
  getUserMyPageLikedPosts,
  getUserMyPageComments,
  updateProfile,
  getMyPosts,
  getMyLikedPosts,
  getMyComments,
  updateNickname,
  updateEmail,
};

export default userService;
