/**
 * 게시글 관련 React Query 훅
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { postService } from "@/services/postService";
import {
  Post as PostDetail,
  PostListItem,
  CreatePostRequest,
  UpdatePostRequest,
  GetPostsParams,
  PaginatedResponse,
  LikeResponse,
} from "@/types";
import type { Post as LegacyPostSummary, PostListResponse as LegacyPostListResponse } from "@/api/posts";

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
    staleTime: 0,
    refetchOnMount: "always",
  });
}

/**
 * 게시글 상세 조회
 */
export function usePost(postId: string, options?: { enabled?: boolean }) {
  return useQuery<PostDetail>({
    queryKey: POST_QUERY_KEYS.detail(postId),
    queryFn: () => postService.getPost(postId),
    enabled: options?.enabled !== false && !!postId,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

// ===== Mutations =====

/**
 * 게시글 생성
 */
export function useCreatePost(
  options?: UseMutationOptions<PostDetail, Error, CreatePostRequest>
) {
  const queryClient = useQueryClient();

  return useMutation<PostDetail, Error, CreatePostRequest>({
    mutationFn: postService.createPost,
    onSuccess: (data, variables, context) => {
      // 게시글 관련 목록/상세 캐시 무효화 (새 게시글이 추가되었으므로 리패치)
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.all });

      // 사용자 정의 onSuccess 실행
      await options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * 게시글 수정
 */
export function useUpdatePost(
  options?: UseMutationOptions<PostDetail, Error, { postId: string; data: UpdatePostRequest }>
) {
  const queryClient = useQueryClient();

  return useMutation<PostDetail, Error, { postId: string; data: UpdatePostRequest }>({
    mutationFn: ({ postId, data }) => postService.updatePost(postId, data),
    onSuccess: (data, variables, context) => {
      // 게시글 상세 및 목록 캐시 무효화 (제목 등이 변경될 수 있음)
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.detail(variables.postId) });
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.all });

      // 사용자 정의 onSuccess 실행
      await options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * 게시글 삭제
 */
export function useDeletePost(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: postService.deletePost,
    onSuccess: async (data, postId, context) => {
      // 해당 게시글 상세 제거
      queryClient.removeQueries({ queryKey: POST_QUERY_KEYS.detail(postId) });

      // 게시글 목록 무효화
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.all });

      // 사용자 정의 onSuccess 실행
      await options?.onSuccess?.(data, postId, context);
    },
    ...options,
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
    { previousPost?: PostDetail }
  >
) {
  const queryClient = useQueryClient();

  return useMutation<LikeResponse, Error, { postId: string; isLiked: boolean }>({
    mutationFn: ({ postId, isLiked }) =>
      isLiked ? postService.unlikePost(postId) : postService.likePost(postId),
    onMutate: async ({ postId, isLiked }) => {
      // 낙관적 업데이트: 즉시 UI 반영
      await queryClient.cancelQueries({ queryKey: POST_QUERY_KEYS.detail(postId) });

      const previousPost = queryClient.getQueryData<PostDetail>(POST_QUERY_KEYS.detail(postId));

      if (previousPost) {
        queryClient.setQueryData<PostDetail>(POST_QUERY_KEYS.detail(postId), {
          ...previousPost,
          isLiked: !isLiked,
          likeCount: isLiked ? previousPost.likeCount - 1 : previousPost.likeCount + 1,
        });
      }

      return { previousPost };
    },
    onError: (err, { postId }, context) => {
      // 에러 시 롤백
      if (context?.previousPost) {
        queryClient.setQueryData(POST_QUERY_KEYS.detail(postId), context.previousPost);
      }
    },
    onSuccess: (data, variables, context) => {
      // 서버 응답으로 최종 업데이트
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.detail(variables.postId) });

      updateCachedPostListEntry(queryClient, variables.postId, (item) => ({
        ...item,
        likeCount: data.likeCount,
      }));

      // 사용자 정의 onSuccess 실행
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
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

type PostListCacheItem = PostListItem | LegacyPostSummary;
type PostListCache = PaginatedResponse<PostListItem> | LegacyPostListResponse;

export function updateCachedPostListEntry(
  queryClient: QueryClient,
  postId: string | number,
  updater: (item: PostListCacheItem) => PostListCacheItem
) {
  void queryClient.setQueriesData<PostListCache | undefined>(
    { queryKey: POST_QUERY_KEYS.all, exact: false },
    (cache) => {
      if (!cache || !Array.isArray(cache.items)) {
        return cache;
      }

      const items = cache.items as PostListCacheItem[];
      let changed = false;
      const nextItems = items.map((item) => {
        if (String(item.postId) !== String(postId)) {
          return item;
        }

        changed = true;
        return updater(item);
      }) as PostListCacheItem[];

      if (!changed) {
        return cache;
      }

      return { ...cache, items: nextItems } as PostListCache;
    }
  );
}

export function forceRefetchAllPostQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.all, refetchType: "all" });
}
