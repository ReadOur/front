/**
 * 게시글 관련 타입 정의
 */

import { BaseEntity, PaginationParams } from "./api";
import { UserProfile } from "./user";

// ===== 게시글 엔티티 =====

/**
 * 게시글 정보
 */
export interface Post extends BaseEntity {
  title: string;
  content: string;
  author: UserProfile;
  category?: string;
  tags?: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  attachments?: Attachment[];
  isPinned?: boolean;
  isLiked?: boolean; // 현재 사용자가 좋아요 했는지 여부
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
  id: string;
  title: string;
  author: UserProfile;
  category?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
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
