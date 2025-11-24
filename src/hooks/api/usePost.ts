/**
 * 게시글 관련 React Query 훅
 */

import { useQuery, useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { postService } from "@/services/postService";
import {
  Post,
  PostListItem,
  CreatePostRequest,
  UpdatePostRequest,
  GetPostsParams,
  PaginatedResponse,
  LikeResponse,
} from "@/types";


// ===== Query Keys =====
export const POST_QUERY_KEYS = {
  all: ["posts"] as const,
  lists: () => [...POST_QUERY_KEYS.all, "list"] as const,
  list: (params?: GetPostsParams) => [...POST_QUERY_KEYS.lists(), params] as const,
  details: () => [...POST_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...POST_QUERY_KEYS.details(), id] as const,
};

// ===== Queries =====

/**
 * 게시글 목록 조회
 */
export function usePosts(params?: GetPostsParams) {
  return useQuery<PaginatedResponse<PostListItem>>({
    queryKey: POST_QUERY_KEYS.list(params),
    queryFn: () => postService.getPosts(params),
  });
}

/**
 * 게시글 상세 조회
 */
export function usePost(postId: string, options?: { enabled?: boolean }) {
  return useQuery<Post>({
    queryKey: POST_QUERY_KEYS.detail(postId),
    queryFn: () => postService.getPost(postId),
    enabled: options?.enabled !== false && !!postId,
  });
}

// ===== Mutations =====

/**
 * 게시글 생성
 */
export function useCreatePost(
  options?: UseMutationOptions<Post, Error, CreatePostRequest, unknown>
) {
  const queryClient = useQueryClient();
  

  return useMutation<Post, Error, CreatePostRequest, unknown>({
    ...options,
    mutationFn: postService.createPost,
    onSuccess: (data, variables, context) => {
      // 게시글 관련 목록/상세 캐시 무효화 (새 게시글이 추가되었으므로 리패치)
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.all });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 게시글 수정
 */
export function useUpdatePost(
  options?: UseMutationOptions<Post, Error, { postId: string; data: UpdatePostRequest }, unknown>
) {
  const queryClient = useQueryClient();
  

  return useMutation<Post, Error, { postId: string; data: UpdatePostRequest }, unknown>({
    ...options,
    mutationFn: ({ postId, data }) => postService.updatePost(postId, data),
    onSuccess: (data, variables, context) => {
      // 게시글 상세 및 목록 캐시 무효화 (제목 등이 변경될 수 있음)
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.detail(variables.postId) });
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.all });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 게시글 삭제
 */
export function useDeletePost(options?: UseMutationOptions<void, Error, string, unknown>) {
  const queryClient = useQueryClient();
  

  return useMutation<void, Error, string, unknown>({
    ...options,
    mutationFn: postService.deletePost,
    onSuccess: (data, postId, context) => {
      // 해당 게시글 상세 제거
      queryClient.removeQueries({ queryKey: POST_QUERY_KEYS.detail(postId) });

      // 게시글 목록 무효화
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.all });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, postId, context);
      }
    },
  });
}

/**
 * 게시글 좋아요/좋아요 취소
 */
export function useLikePost(
  options?: UseMutationOptions<
    LikeResponse,
    Error,
    { postId: string; isLiked: boolean },
    { previousPost?: Post }
  >
) {
  const queryClient = useQueryClient();
  

  return useMutation<
    LikeResponse,
    Error,
    { postId: string; isLiked: boolean },
    { previousPost?: Post }
  >({
    ...options,
    mutationFn: ({ postId, isLiked }) =>
      isLiked ? postService.unlikePost(postId) : postService.likePost(postId),
    onMutate: async ({ postId, isLiked }) => {
      // 낙관적 업데이트: 즉시 UI 반영
      await queryClient.cancelQueries({ queryKey: POST_QUERY_KEYS.detail(postId) });

      const previousPost = queryClient.getQueryData<Post>(POST_QUERY_KEYS.detail(postId));

      if (previousPost) {
        queryClient.setQueryData<Post>(POST_QUERY_KEYS.detail(postId), {
          ...previousPost,
          isLiked: !isLiked,
          likeCount: isLiked ? previousPost.likeCount - 1 : previousPost.likeCount + 1,
        });
      }

      return { previousPost };
    },
    onError: (err, variables, context) => {
      // 에러 시 롤백
      if (context?.previousPost) {
        queryClient.setQueryData(POST_QUERY_KEYS.detail(variables.postId), context.previousPost);
      }
      if (options?.onError) {
        (options.onError as any)(err, variables, context);
      }
    },
    onSuccess: (data, variables, context) => {
      // 서버 응답으로 좋아요 관련 필드만 업데이트 (isApplied 등 다른 필드 보존)
      const currentPost = queryClient.getQueryData<Post>(POST_QUERY_KEYS.detail(variables.postId));
      if (currentPost) {
        queryClient.setQueryData<Post>(POST_QUERY_KEYS.detail(variables.postId), {
          ...currentPost,
          isLiked: data.isLiked,
          likeCount: data.likeCount,
        });
      }

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 게시글 조회수 증가
 */
export function useViewPost() {
  return useMutation<void, Error, string>({
    mutationFn: postService.viewPost,
    // 조회수는 별도로 캐시 무효화 하지 않음 (서버에서만 관리)
  });
}

/**
 * 모임 참여 토글
 * - 참여 중이면 참여 취소, 미참여면 참여
 */
export function useToggleRecruitmentApply(
  options?: UseMutationOptions<{ isApplied: boolean }, Error, string, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<{ isApplied: boolean }, Error, string, unknown>({
    ...options,
    mutationFn: postService.toggleRecruitmentApply,
    onSuccess: (data, postId, context) => {
      // 게시글 상세 무효화 (자동 refetch로 최신 데이터 가져오기)
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.detail(postId) });
      // 게시글 목록도 업데이트
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.all });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, postId, context);
      }
    },
    onError: (err, postId, context) => {
      if (options?.onError) {
        (options.onError as any)(err, postId, context);
      }
    },
  });
}
