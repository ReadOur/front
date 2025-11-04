/**
 * 게시글 관련 타입 정의
 */

import { PaginationParams } from "./api";

// ===== 게시글 엔티티 =====

/**
 * 게시글 카테고리
 */
export type PostCategory = "NOTICE" | "GENERAL" | "QNA" | "FREE" | "REVIEW" | "DISCUSSION" | "QUESTION";

/**
 * 게시글 경고
 */
export interface PostWarning {
  id: {
    postId: number;
    warning: string;
  };
}

/**
 * 게시글 댓글 (간략 버전)
 */
export interface PostComment {
  commentId: number;
  content: string;
  authorNickname: string;
  authorId: number;
  createdAt: string;
}

/**
 * 게시글 정보 (백엔드 응답과 동일)
 */
export interface Post {
  postId: number;
  title: string;
  content: string;
  category: PostCategory;
  isSpoiler?: boolean;
  authorNickname: string;
  authorId: number;
  hit: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  warnings?: PostWarning[];
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
  comments?: PostComment[];
}

/**
 * 첨부파일 정보
 */
export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

/**
 * 게시글 목록 아이템 (요약 정보)
 */
export interface PostListItem {
  postId: number;
  title: string;
  authorNickname: string;
  authorId: number;
  category: PostCategory;
  hit: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt?: string;
  isPinned?: boolean;
}

// ===== 게시글 요청/응답 =====

/**
 * 게시글 생성 요청
 */
export interface CreatePostRequest {
  title: string;
  content: string;
  category?: string;
  isSpoiler?: boolean;
  tags?: string[];
  attachmentIds?: string[];
}

/**
 * 게시글 수정 요청
 */
export interface UpdatePostRequest {
  title?: string;
  content?: string;
  category?: string;
  isSpoiler?: boolean;
  tags?: string[];
  attachmentIds?: string[];
}

/**
 * 게시글 목록 조회 파라미터
 */
export interface GetPostsParams extends PaginationParams {
  category?: string;
  tag?: string;
  authorId?: string;
  search?: string;
}

/**
 * 좋아요 응답
 */
export interface LikeResponse {
  isLiked: boolean;
  likeCount: number;
}
