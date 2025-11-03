/**
 * 댓글 관련 타입 정의
 */

import { BaseEntity, PaginationParams } from "./api";
import { UserProfile } from "./user";

// ===== 댓글 엔티티 =====

/**
 * 댓글 정보
 */
export interface Comment extends BaseEntity {
  postId: string;
  content: string;
  author: UserProfile;
  parentId?: string | null; // 대댓글인 경우 부모 댓글 ID
  likeCount?: number;
  isLiked?: boolean; // 현재 사용자가 좋아요 했는지 여부
  replies?: Comment[]; // 대댓글 목록
  replyCount?: number; // 대댓글 수
}

// ===== 댓글 요청/응답 =====

/**
 * 댓글 생성 요청
 */
export interface CreateCommentRequest {
  postId: string;
  content: string;
  parentId?: string | null; // 대댓글인 경우 부모 댓글 ID
}

/**
 * 댓글 수정 요청
 */
export interface UpdateCommentRequest {
  content: string;
}

/**
 * 댓글 목록 조회 파라미터
 */
export interface GetCommentsParams extends PaginationParams {
  postId: string;
  includeReplies?: boolean; // 대댓글 포함 여부
}

/**
 * 댓글 좋아요 응답
 */
export interface CommentLikeResponse {
  isLiked: boolean;
  likeCount: number;
}
