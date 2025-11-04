/**
 * 게시글 관련 API 서비스
 */

import { apiClient } from "@/api/client";
import { POST_ENDPOINTS } from "@/api/endpoints";
import { PostListResponse } from "@/api/posts";
import {
  Post,
  PostListItem,
  CreatePostRequest,
  UpdatePostRequest,
  GetPostsParams,
  PaginatedResponse,
  LikeResponse,
} from "@/types";

/**
 * 게시글 목록 조회
 */
export async function getPosts(params?: GetPostsParams): Promise<PaginatedResponse<PostListItem>> {
  return apiClient.get<PaginatedResponse<PostListItem>>(POST_ENDPOINTS.LIST, { params });
}

/**
 * 게시글 상세 조회
 */
export async function getPost(postId: string): Promise<Post> {
  return apiClient.get<Post>(POST_ENDPOINTS.DETAIL(postId));
}

/**
 * 게시글 생성
 */
export async function createPost(data: CreatePostRequest): Promise<Post> {
  return apiClient.post<Post, CreatePostRequest>(POST_ENDPOINTS.CREATE, data);
}

/**
 * 게시글 수정
 */
export async function updatePost(postId: string, data: UpdatePostRequest): Promise<Post> {
  return apiClient.put<Post, UpdatePostRequest>(POST_ENDPOINTS.UPDATE(postId), data);
}

/**
 * 게시글 삭제
 */
export async function deletePost(postId: string): Promise<void> {
  return apiClient.delete<void>(POST_ENDPOINTS.DELETE(postId));
}

/**
 * 게시글 좋아요
 */
export async function likePost(postId: string): Promise<LikeResponse> {
  return apiClient.post<LikeResponse>(POST_ENDPOINTS.LIKE(postId));
}

/**
 * 게시글 좋아요 취소
 */
export async function unlikePost(postId: string): Promise<LikeResponse> {
  return apiClient.post<LikeResponse>(POST_ENDPOINTS.UNLIKE(postId));
}

/**
 * 게시글 조회수 증가
 */
export async function viewPost(postId: string): Promise<void> {
  return apiClient.post<void>(POST_ENDPOINTS.VIEW(postId));
}

/**
 * 검색 타입
 */
export type SearchType = "TITLE" | "TITLE-CONTENT" | "USERNAME" | "BOOK_TITLE";

/**
 * 게시글 검색 파라미터
 */
export interface SearchPostsParams {
  type: SearchType;
  keyword: string;
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * 게시글 검색
 */
export async function searchPosts(params: SearchPostsParams): Promise<PostListResponse> {
  const { type, keyword, page = 0, size = 20, sort = "createdAt,desc" } = params;

  const response = await apiClient.get<PaginatedResponse<PostListItem>>(POST_ENDPOINTS.SEARCH, {
    params: {
      type,
      keyword,
      page,
      size,
      sort,
    },
  });

  // PaginatedResponse 형식을 PostListResponse 형식으로 변환
  return {
    items: response.items || [],
    page: response.meta?.page ?? page + 1, // 0-based를 1-based로 변환
    pageSize: response.meta?.pageSize ?? size,
    total: response.meta?.totalItems ?? 0,
    totalPages: response.meta?.totalPages ?? 0,
    hasNext: response.meta?.hasNext ?? false,
    hasPrevious: response.meta?.hasPrevious ?? false,
  };
}

/**
 * 게시글 서비스 객체
 */
export const postService = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  viewPost,
  searchPosts,
};

export default postService;
