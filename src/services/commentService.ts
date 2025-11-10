/**
 * 댓글 관련 API 서비스
 */

import { apiClient } from "@/api/client";
import { COMMENT_ENDPOINTS } from "@/api/endpoints";
import {
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  GetCommentsParams,
  PaginatedResponse,
  CommentLikeResponse,
} from "@/types";

/**
 * 댓글 목록 조회
 */
export async function getComments(params: GetCommentsParams): Promise<PaginatedResponse<Comment>> {
  const { postId, ...restParams } = params;
  return apiClient.get<PaginatedResponse<Comment>>(COMMENT_ENDPOINTS.LIST(postId), {
    params: restParams,
  });
}

/**
 * 댓글 상세 조회
 */
export async function getComment(commentId: string): Promise<Comment> {
  return apiClient.get<Comment>(COMMENT_ENDPOINTS.DETAIL(commentId));
}

/**
 * 댓글 생성
 */
export async function createComment(data: CreateCommentRequest): Promise<Comment> {
  return apiClient.post<Comment, CreateCommentRequest>(
    COMMENT_ENDPOINTS.CREATE(String(data.postId)),
    data
  );
}

/**
 * 댓글 수정
 */
export async function updateComment(
  commentId: string,
  data: UpdateCommentRequest
): Promise<Comment> {
  return apiClient.put<Comment, UpdateCommentRequest>(
    COMMENT_ENDPOINTS.UPDATE(commentId),
    data
  );
}

/**
 * 댓글 삭제
 */
export async function deleteComment(commentId: string): Promise<void> {
  return apiClient.delete<void>(COMMENT_ENDPOINTS.DELETE(commentId));
}

/**
 * 댓글 좋아요
 */
export async function likeComment(commentId: string): Promise<CommentLikeResponse> {
  return apiClient.post<CommentLikeResponse>(COMMENT_ENDPOINTS.LIKE(commentId));
}

/**
 * 댓글 좋아요 취소
 */
export async function unlikeComment(commentId: string): Promise<CommentLikeResponse> {
  return apiClient.post<CommentLikeResponse>(COMMENT_ENDPOINTS.UNLIKE(commentId));
}

/**
 * 대댓글 목록 조회
 */
export async function getReplies(commentId: string): Promise<Comment[]> {
  return apiClient.get<Comment[]>(COMMENT_ENDPOINTS.REPLIES(commentId));
}

/**
 * 대댓글 생성
 */
export async function createReply(
  commentId: string,
  data: Omit<CreateCommentRequest, "parentId">
): Promise<Comment> {
  return apiClient.post<Comment, Omit<CreateCommentRequest, "parentId">>(
    COMMENT_ENDPOINTS.CREATE_REPLY(commentId),
    data
  );
}

/**
 * 댓글 서비스 객체
 */
export const commentService = {
  getComments,
  getComment,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  getReplies,
  createReply,
};

export default commentService;
