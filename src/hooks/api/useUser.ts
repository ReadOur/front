/**
 * 사용자 관련 React Query 훅
 */

import { useQuery, useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import { MyPagePreview, UserProfilePreview, UpdateProfileRequest, SpringPage, PostListItem } from "@/types";

// ===== Query Keys =====
export const USER_QUERY_KEYS = {
  all: ["users"] as const,
  // 마이페이지
  myPage: () => [...USER_QUERY_KEYS.all, "myPage"] as const,
  myPosts: (params?: { page?: number; size?: number; sort?: string }) =>
    [...USER_QUERY_KEYS.all, "myPosts", params] as const,
  myLikedPosts: (params?: { page?: number; size?: number; sort?: string }) =>
    [...USER_QUERY_KEYS.all, "myLikedPosts", params] as const,
  myComments: (params?: { page?: number; size?: number; sort?: string }) =>
    [...USER_QUERY_KEYS.all, "myComments", params] as const,
  // 특정 사용자
  userProfile: (userId: string) => [...USER_QUERY_KEYS.all, "userProfile", userId] as const,
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
 * 특정 사용자 프로필 조회
 * TODO: 백엔드 API 구현 확인 필요
 */
export function useUserProfile(userId: string) {
  return useQuery<UserProfilePreview>({
    queryKey: USER_QUERY_KEYS.userProfile(userId),
    queryFn: () => userService.getUserProfile(userId),
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
