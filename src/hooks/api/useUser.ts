/**
 * 사용자 관련 React Query 훅
 */

import { useQuery, useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import {
  MyPagePreview,
  UserProfilePreview,
  UpdateProfileRequest,
  PaginatedResponse,
  PostListItem,
  Comment,
} from "@/types";

// ===== Query Keys =====
export const USER_QUERY_KEYS = {
  all: ["users"] as const,
  // 마이페이지
  myProfile: () => [...USER_QUERY_KEYS.all, "myProfile"] as const,
  myLikedPosts: (params?: { page?: number; size?: number }) =>
    [...USER_QUERY_KEYS.all, "myLikedPosts", params] as const,
  myPosts: (params?: { page?: number; size?: number }) =>
    [...USER_QUERY_KEYS.all, "myPosts", params] as const,
  myComments: (params?: { page?: number; size?: number }) =>
    [...USER_QUERY_KEYS.all, "myComments", params] as const,
  // 특정 사용자
  userProfile: (userId: string) => [...USER_QUERY_KEYS.all, "userProfile", userId] as const,
  userLikedPosts: (userId: string, params?: { page?: number; size?: number }) =>
    [...USER_QUERY_KEYS.all, "userLikedPosts", userId, params] as const,
  userPosts: (userId: string, params?: { page?: number; size?: number }) =>
    [...USER_QUERY_KEYS.all, "userPosts", userId, params] as const,
  userComments: (userId: string, params?: { page?: number; size?: number }) =>
    [...USER_QUERY_KEYS.all, "userComments", userId, params] as const,
};

// ===== Queries =====

/**
 * 내 마이페이지 조회
 */
export function useMyProfile() {
  return useQuery<MyPagePreview>({
    queryKey: USER_QUERY_KEYS.myProfile(),
    queryFn: userService.getMyProfile,
  });
}

/**
 * 특정 사용자 프로필 조회
 */
export function useUserProfile(userId: string) {
  return useQuery<UserProfilePreview>({
    queryKey: USER_QUERY_KEYS.userProfile(userId),
    queryFn: () => userService.getUserProfile(userId),
    enabled: !!userId,
  });
}

/**
 * 내가 좋아요 누른 게시글 목록
 */
export function useMyLikedPosts(params?: { page?: number; size?: number }) {
  return useQuery<PaginatedResponse<PostListItem>>({
    queryKey: USER_QUERY_KEYS.myLikedPosts(params),
    queryFn: () => userService.getMyLikedPosts(params),
  });
}

/**
 * 특정 사용자가 좋아요 누른 게시글 목록
 */
export function useUserLikedPosts(userId: string, params?: { page?: number; size?: number }) {
  return useQuery<PaginatedResponse<PostListItem>>({
    queryKey: USER_QUERY_KEYS.userLikedPosts(userId, params),
    queryFn: () => userService.getUserLikedPosts(userId, params),
    enabled: !!userId,
  });
}

/**
 * 내가 작성한 게시글 목록
 */
export function useMyPosts(params?: { page?: number; size?: number }) {
  return useQuery<PaginatedResponse<PostListItem>>({
    queryKey: USER_QUERY_KEYS.myPosts(params),
    queryFn: () => userService.getMyPosts(params),
  });
}

/**
 * 특정 사용자가 작성한 게시글 목록
 */
export function useUserPosts(userId: string, params?: { page?: number; size?: number }) {
  return useQuery<PaginatedResponse<PostListItem>>({
    queryKey: USER_QUERY_KEYS.userPosts(userId, params),
    queryFn: () => userService.getUserPosts(userId, params),
    enabled: !!userId,
  });
}

/**
 * 내가 작성한 댓글 목록
 */
export function useMyComments(params?: { page?: number; size?: number }) {
  return useQuery<PaginatedResponse<Comment>>({
    queryKey: USER_QUERY_KEYS.myComments(params),
    queryFn: () => userService.getMyComments(params),
  });
}

/**
 * 특정 사용자가 작성한 댓글 목록
 */
export function useUserComments(userId: string, params?: { page?: number; size?: number }) {
  return useQuery<PaginatedResponse<Comment>>({
    queryKey: USER_QUERY_KEYS.userComments(userId, params),
    queryFn: () => userService.getUserComments(userId, params),
    enabled: !!userId,
  });
}

// ===== Mutations =====

/**
 * 프로필 수정
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
      // 내 프로필 무효화
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.myProfile() });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}
