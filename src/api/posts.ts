/**
 * 게시글 API
 * - 게시글 목록, 상세, 작성, 수정, 삭제 등
 */

import { apiClient } from './client';
import { createQuery } from './queryBuilder';
import { SpringPage, convertSpringPage } from '@/types/spring';
import { POST_ENDPOINTS } from './endpoints';

/**
 * 게시글 타입 (API 응답용 - 간단한 버전)
 * 전체 타입은 @/types/post.ts의 Post를 참조
 */
export interface Post {
  postId: number;
  title: string;
  content?: string;
  authorNickname: string;
  authorId: number;
  category: string;
  createdAt: string;
  updatedAt?: string;
  likeCount: number;
  hit: number;
  commentCount?: number;
  isLiked?: boolean;
  attachments?: Array<{ id: string; name: string; url: string }>;
}

/**
 * 게시글 목록 조회 파라미터
 */
export interface GetPostsParams {
  page?: number;
  size?: number;
  sort?: string;
  category?: string;
  search?: string;
}

/**
 * 게시글 목록 응답 (우리 프로젝트 형식)
 */
export interface PostListResponse {
  items: Post[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * 게시글 목록 조회
 *
 * @example
 * const posts = await getPosts({ page: 1, size: 20 });
 */
export async function getPosts(params: GetPostsParams = {}): Promise<PostListResponse> {
  const { page = 1, size = 20, sort, category, search } = params;

  // Spring은 0부터 시작하므로 -1
  const query = createQuery()
    .page(page - 1)
    .pageSize(size);

  // Spring Boot 형식의 정렬 적용 (예: "createdAt,desc")
  if (sort) query.sort(sort);
  if (category) query.filter('category', category);
  if (search) query.search(search);

  const queryParams = query.build();

  // Spring Page 응답 받기 (endpoints.ts의 상수 사용)
  const springPage = await apiClient.get<SpringPage<Post>>(POST_ENDPOINTS.LIST, {
    params: queryParams,
  });

  // 우리 형식으로 변환
  const converted = convertSpringPage(springPage);

  return {
    items: converted.items,
    page: converted.meta.page,
    pageSize: converted.meta.pageSize,
    total: converted.meta.totalItems,
    totalPages: converted.meta.totalPages,
    hasNext: converted.meta.hasNext,
    hasPrevious: converted.meta.hasPrevious,
  };
}

/**
 * 게시글 상세 조회
 *
 * @example
 * const post = await getPost('123');
 */
export async function getPost(postId: string | number): Promise<Post> {
  return apiClient.get<Post>(POST_ENDPOINTS.DETAIL(String(postId)));
}

/**
 * 게시글 작성
 *
 * @example
 * const newPost = await createPost({
 *   title: '제목',
 *   content: '내용',
 *   category: 'tech',
 * });
 */
export async function createPost(data: {
  title: string;
  content: string;
  category: string;
}): Promise<Post> {
  return apiClient.post<Post>(POST_ENDPOINTS.CREATE, data);
}

/**
 * 게시글 수정
 *
 * @example
 * const updated = await updatePost('123', {
 *   title: '수정된 제목',
 * });
 */
export async function updatePost(
  postId: string | number,
  data: Partial<Post>
): Promise<Post> {
  return apiClient.put<Post>(POST_ENDPOINTS.UPDATE(String(postId)), data);
}

/**
 * 게시글 삭제
 *
 * @example
 * await deletePost('123');
 */
export async function deletePost(postId: string | number): Promise<void> {
  return apiClient.delete(POST_ENDPOINTS.DELETE(String(postId)));
}

/**
 * 게시글 좋아요
 *
 * @example
 * await likePost('123');
 */
export async function likePost(postId: string | number): Promise<void> {
  return apiClient.post(POST_ENDPOINTS.LIKE(String(postId)));
}
