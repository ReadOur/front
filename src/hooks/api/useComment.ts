/**
 * 댓글 관련 React Query 훅
 */

import { useQuery, useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { commentService } from "@/services/commentService";
import {
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  GetCommentsParams,
  PaginatedResponse,
  CommentLikeResponse,
} from "@/types";
import { POST_QUERY_KEYS } from "./usePost";

// ===== Query Keys =====
export const COMMENT_QUERY_KEYS = {
  all: ["comments"] as const,
  lists: () => [...COMMENT_QUERY_KEYS.all, "list"] as const,
  list: (params: GetCommentsParams) => [...COMMENT_QUERY_KEYS.lists(), params] as const,
  details: () => [...COMMENT_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...COMMENT_QUERY_KEYS.details(), id] as const,
  replies: (commentId: string) => [...COMMENT_QUERY_KEYS.all, "replies", commentId] as const,
};

// ===== Queries =====

/**
 * 댓글 목록 조회
 */
export function useComments(params: GetCommentsParams) {
  return useQuery<PaginatedResponse<Comment>>({
    queryKey: COMMENT_QUERY_KEYS.list(params),
    queryFn: () => commentService.getComments(params),
    enabled: !!params.postId,
  });
}

/**
 * 댓글 상세 조회
 */
export function useComment(commentId: string, options?: { enabled?: boolean }) {
  return useQuery<Comment>({
    queryKey: COMMENT_QUERY_KEYS.detail(commentId),
    queryFn: () => commentService.getComment(commentId),
    enabled: options?.enabled !== false && !!commentId,
  });
}

/**
 * 대댓글 목록 조회
 */
export function useReplies(commentId: string, options?: { enabled?: boolean }) {
  return useQuery<Comment[]>({
    queryKey: COMMENT_QUERY_KEYS.replies(commentId),
    queryFn: () => commentService.getReplies(commentId),
    enabled: options?.enabled !== false && !!commentId,
  });
}

// ===== Mutations =====

/**
 * 댓글 생성
 */
export function useCreateComment(
  options?: UseMutationOptions<Comment, Error, CreateCommentRequest>
) {
  const queryClient = useQueryClient();

  return useMutation<Comment, Error, CreateCommentRequest>({
    mutationFn: commentService.createComment,
    onSuccess: (data, variables, context) => {
      // 댓글 목록 무효화
      queryClient.invalidateQueries({
        queryKey: COMMENT_QUERY_KEYS.lists(),
      });

      // 게시글 상세도 무효화 (댓글 수 업데이트)
      queryClient.invalidateQueries({
        queryKey: POST_QUERY_KEYS.detail(variables.postId),
      });

      // 대댓글인 경우 부모 댓글의 replies도 무효화
      if (variables.parentId) {
        queryClient.invalidateQueries({
          queryKey: COMMENT_QUERY_KEYS.replies(variables.parentId),
        });
      }

      // 사용자 정의 onSuccess 실행
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * 댓글 수정
 */
export function useUpdateComment(
  options?: UseMutationOptions<Comment, Error, { commentId: string; postId: string; data: UpdateCommentRequest }>
) {
  const queryClient = useQueryClient();

  return useMutation<Comment, Error, { commentId: string; postId: string; data: UpdateCommentRequest }>({
    mutationFn: ({ commentId, data }) => commentService.updateComment(commentId, data),
    onSuccess: (data, variables, context) => {
      // 해당 댓글 상세 무효화
      queryClient.invalidateQueries({
        queryKey: COMMENT_QUERY_KEYS.detail(variables.commentId),
      });

      // 댓글 목록도 무효화
      queryClient.invalidateQueries({
        queryKey: COMMENT_QUERY_KEYS.lists(),
      });

      // 게시글 상세도 무효화 (댓글 내용 업데이트)
      queryClient.invalidateQueries({
        queryKey: POST_QUERY_KEYS.detail(variables.postId),
      });

      // 사용자 정의 onSuccess 실행
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * 댓글 삭제
 */
export function useDeleteComment(
  options?: UseMutationOptions<void, Error, { commentId: string; postId: string }>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { commentId: string; postId: string }>({
    mutationFn: ({ commentId }) => commentService.deleteComment(commentId),
    onSuccess: (data, variables, context) => {
      // 해당 댓글 제거
      queryClient.removeQueries({
        queryKey: COMMENT_QUERY_KEYS.detail(variables.commentId),
      });

      // 댓글 목록 무효화
      queryClient.invalidateQueries({
        queryKey: COMMENT_QUERY_KEYS.lists(),
      });

      // 게시글 상세도 무효화 (댓글 수 업데이트)
      queryClient.invalidateQueries({
        queryKey: POST_QUERY_KEYS.detail(variables.postId),
      });

      // 사용자 정의 onSuccess 실행
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * 댓글 좋아요/좋아요 취소
 */
export function useLikeComment(
  options?: UseMutationOptions<
    CommentLikeResponse,
    Error,
    { commentId: string; isLiked: boolean }
  >
) {
  const queryClient = useQueryClient();

  return useMutation<CommentLikeResponse, Error, { commentId: string; isLiked: boolean }>({
    mutationFn: ({ commentId, isLiked }) =>
      isLiked ? commentService.unlikeComment(commentId) : commentService.likeComment(commentId),
    onMutate: async ({ commentId, isLiked }) => {
      // 낙관적 업데이트
      await queryClient.cancelQueries({ queryKey: COMMENT_QUERY_KEYS.detail(commentId) });

      const previousComment = queryClient.getQueryData<Comment>(
        COMMENT_QUERY_KEYS.detail(commentId)
      );

      if (previousComment) {
        queryClient.setQueryData<Comment>(COMMENT_QUERY_KEYS.detail(commentId), {
          ...previousComment,
          isLiked: !isLiked,
          likeCount: isLiked
            ? (previousComment.likeCount ?? 0) - 1
            : (previousComment.likeCount ?? 0) + 1,
        });
      }

      return { previousComment };
    },
    onError: (err, { commentId }, context) => {
      // 에러 시 롤백
      if (context?.previousComment) {
        queryClient.setQueryData(COMMENT_QUERY_KEYS.detail(commentId), context.previousComment);
      }
    },
    onSuccess: (data, variables, context) => {
      // 서버 응답으로 최종 업데이트
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.detail(variables.commentId) });

      // 사용자 정의 onSuccess 실행
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}
