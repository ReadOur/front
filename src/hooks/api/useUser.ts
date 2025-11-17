/**
 * 사용자 관련 React Query 훅
 */

import { useQuery, useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import { MyPagePreview, UserProfilePreview, UpdateProfileRequest } from "@/types";

// ===== Query Keys =====
export const USER_QUERY_KEYS = {
  all: ["users"] as const,
  // 마이페이지
  myPage: () => [...USER_QUERY_KEYS.all, "myPage"] as const,
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
