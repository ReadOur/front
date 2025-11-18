/**
 * 사용자 관련 React Query 훅
 */

import { useQuery, useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import {
  MyPagePreview,
  UserProfilePreview,
  UserProfilePostsResponse,
  UserProfileLikedPostsResponse,
  UserProfileCommentsResponse,
  UpdateProfileRequest,
  SpringPage,
  PostListItem,
} from "@/types";

// ===== Query Keys =====
export const USER_QUERY_KEYS = {
  all: ["users"] as const,
  // 마이페이지 - 내 프로필
  myPage: () => [...USER_QUERY_KEYS.all, "myPage"] as const,
  myPosts: (params?: { page?: number; size?: number; sort?: string }) =>
    [...USER_QUERY_KEYS.all, "myPosts", params] as const,
  myLikedPosts: (params?: { page?: number; size?: number; sort?: string }) =>
    [...USER_QUERY_KEYS.all, "myLikedPosts", params] as const,
  myComments: (params?: { page?: number; size?: number; sort?: string }) =>
    [...USER_QUERY_KEYS.all, "myComments", params] as const,
  // 마이페이지 - 특정 사용자
  userMyPage: (userId: number | string) => [...USER_QUERY_KEYS.all, "userMyPage", userId] as const,
  userMyPagePosts: (userId: number | string, params?: { page?: number; size?: number; sort?: string }) =>
    [...USER_QUERY_KEYS.all, "userMyPagePosts", userId, params] as const,
  userMyPageLikedPosts: (userId: number | string, params?: { page?: number; size?: number; sort?: string }) =>
    [...USER_QUERY_KEYS.all, "userMyPageLikedPosts", userId, params] as const,
  userMyPageComments: (userId: number | string, params?: { page?: number; size?: number; sort?: string }) =>
    [...USER_QUERY_KEYS.all, "userMyPageComments", userId, params] as const,
};

// ===== Queries =====

/**
 * 내 마이페이지 조회
 * - 내 프로필 정보 (userId, nickname)
 * - 최근 작성한 게시글 5개
 * - 최근 댓글 단 게시글 5개
 * - 최근 좋아요 누른 게시글 5개
 */
export function useMyPage() {
  return useQuery<MyPagePreview>({
    queryKey: USER_QUERY_KEYS.myPage(),
    queryFn: userService.getMyPage,
  });
}

/**
 * 내가 작성한 게시글 전체 조회 (페이징)
 */
export function useMyPosts(params?: { page?: number; size?: number; sort?: string }) {
  return useQuery<SpringPage<PostListItem>>({
    queryKey: USER_QUERY_KEYS.myPosts(params),
    queryFn: () => userService.getMyPosts(params),
  });
}

/**
 * 좋아요 누른 글 전체 조회 (페이징)
 */
export function useMyLikedPosts(params?: { page?: number; size?: number; sort?: string }) {
  return useQuery<SpringPage<PostListItem>>({
    queryKey: USER_QUERY_KEYS.myLikedPosts(params),
    queryFn: () => userService.getMyLikedPosts(params),
  });
}

/**
 * 내가 작성한 댓글 전체 조회 (페이징)
 */
export function useMyComments(params?: { page?: number; size?: number; sort?: string }) {
  return useQuery<SpringPage<PostListItem>>({
    queryKey: USER_QUERY_KEYS.myComments(params),
    queryFn: () => userService.getMyComments(params),
  });
}

/**
 * 특정 사용자 마이페이지 조회 (미리보기)
 * - 특정 사용자 프로필 정보 (userId, nickname)
 * - 최근 작성한 게시글 5개
 * - 최근 댓글 단 게시글 5개
 * - 최근 좋아요 누른 게시글 5개
 */
export function useUserMyPage(userId: number | string) {
  return useQuery<UserProfilePreview>({
    queryKey: USER_QUERY_KEYS.userMyPage(userId),
    queryFn: () => userService.getUserMyPage(userId),
    enabled: !!userId,
  });
}

/**
 * 특정 사용자 작성 게시글 전체 조회 (페이징)
 */
export function useUserMyPagePosts(
  userId: number | string,
  params?: { page?: number; size?: number; sort?: string }
) {
  return useQuery<UserProfilePostsResponse>({
    queryKey: USER_QUERY_KEYS.userMyPagePosts(userId, params),
    queryFn: () => userService.getUserMyPagePosts(userId, params),
    enabled: !!userId,
  });
}

/**
 * 특정 사용자 좋아요 게시글 전체 조회 (페이징)
 */
export function useUserMyPageLikedPosts(
  userId: number | string,
  params?: { page?: number; size?: number; sort?: string }
) {
  return useQuery<UserProfileLikedPostsResponse>({
    queryKey: USER_QUERY_KEYS.userMyPageLikedPosts(userId, params),
    queryFn: () => userService.getUserMyPageLikedPosts(userId, params),
    enabled: !!userId,
  });
}

/**
 * 특정 사용자 작성 댓글 전체 조회 (페이징)
 */
export function useUserMyPageComments(
  userId: number | string,
  params?: { page?: number; size?: number; sort?: string }
) {
  return useQuery<UserProfileCommentsResponse>({
    queryKey: USER_QUERY_KEYS.userMyPageComments(userId, params),
    queryFn: () => userService.getUserMyPageComments(userId, params),
    enabled: !!userId,
  });
}

// ===== Mutations =====

/**
 * 프로필 수정
 * TODO: 백엔드 API 구현 확인 필요
 */
export function useUpdateProfile(
  options?: UseMutationOptions<
    UserProfilePreview,
    Error,
    { userId: string; data: UpdateProfileRequest },
    unknown
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    UserProfilePreview,
    Error,
    { userId: string; data: UpdateProfileRequest },
    unknown
  >({
    ...options,
    mutationFn: ({ userId, data }) => userService.updateProfile(userId, data),
    onSuccess: (data, variables, context) => {
      // 내 마이페이지 무효화
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.myPage() });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}
