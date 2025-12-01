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
 * downloadUrl에서 파일 ID 추출하는 헬퍼 함수
 */
function extractFileIdFromDownloadUrl(downloadUrl: string): number | null {
  // downloadUrl 형식: "/api/files/146/download" 또는 "/files/146/download"
  const match = downloadUrl.match(/\/(\d+)\/download$/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * 게시글 상세 조회
 */
export async function getPost(postId: string): Promise<Post> {
  const response = await apiClient.get<Post>(POST_ENDPOINTS.DETAIL(postId));
  
  // attachments에 id 필드가 없으면 downloadUrl에서 추출
  if (response.attachments && Array.isArray(response.attachments)) {
    response.attachments = response.attachments.map((att) => {
      // 이미 id가 있으면 그대로 사용
      if (att.id) {
        return att;
      }
      // downloadUrl에서 ID 추출
      const fileId = att.downloadUrl ? extractFileIdFromDownloadUrl(att.downloadUrl) : null;
      return {
        ...att,
        id: fileId || 0, // 추출 실패 시 0
      };
    });
  }

  console.log('[postService.getPost] API 응답 (매핑 후):', {
    postId,
    attachments: response.attachments,
    attachmentsCount: response.attachments?.length || 0,
    attachmentsIds: response.attachments?.map((a) => a.id) || [],
  });
  
  return response;
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
 * - 백엔드가 같은 엔드포인트로 토글 처리하므로 like와 동일한 경로에 POST 요청
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
 * 모임 참여 토글
 * - 참여 중이면 참여 취소, 미참여면 참여
 * - 백엔드에서 자동으로 토글 처리
 */
export async function toggleRecruitmentApply(postId: string): Promise<{ isApplied: boolean }> {
  return apiClient.post<{ isApplied: boolean }>(POST_ENDPOINTS.TOGGLE_RECRUITMENT_APPLY(postId));
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

export type PostList = {
  items: Post[];
  totalPages: number;
  page: number;
  pageSize: number;
};

/**
 * 게시글 검색
 */
// postService.ts

// postService.ts

// 1) 서버가 줄 수 있는 두 가지 페이징 모양을 명시
type SpringPage<T> = {
  content: T[];
  totalPages: number;
  totalElements?: number;
  number: number; // 0-based
  size: number;
};

type CommonPage<T> = {
  items: T[];
  meta: {
    page: number;       // 1-based
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
  };
};

// 2) 안전한 타입가드
function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function isSpringPage<T>(x: unknown): x is SpringPage<T> {
  if (!isObject(x)) return false;
  return "content" in x && Array.isArray((x as { content: unknown }).content);
}

function isCommonPage<T>(x: unknown): x is CommonPage<T> {
  if (!isObject(x)) return false;
  const hasItems = "items" in x && Array.isArray((x as { items: unknown }).items);
  const hasMeta = "meta" in x && isObject((x as { meta: unknown }).meta);
  return hasItems && hasMeta;
}

// 3) any 없이 제너릭 지정 + 유니온으로 수신 후 분기
export async function searchPosts(params: SearchPostsParams): Promise<PostListResponse> {
  const { type, keyword, page = 0, size = 20, sort = "createdAt,desc" } = params;

  // apiClient는 데이터 언래핑을 해 준다는 전제(getPosts와 동일하게 사용)
  const res = await apiClient.get<SpringPage<PostListItem> | CommonPage<PostListItem>>(
    POST_ENDPOINTS.SEARCH,
    { params: { type, keyword, page, size, sort } }
  );

  // Spring Data 스타일
  if (isSpringPage<PostListItem>(res)) {
    const n = typeof res.number === "number" ? res.number : page;
    const s = typeof res.size === "number" ? res.size : size;
    const total = typeof res.totalElements === "number" ? res.totalElements : 0;
    const tPages = typeof res.totalPages === "number" ? res.totalPages : 1;
    return {
      items: res.content,
      page: n + 1,               // 0-based → 1-based
      pageSize: s,
      total: total,
      totalPages: tPages,
      hasNext: n + 1 < tPages,
      hasPrevious: n > 0,
    };
  }

  // 공통 페이징 스타일
  if (isCommonPage<PostListItem>(res)) {
    const m = res.meta;
    return {
      items: res.items,
      page: m.page,
      pageSize: m.pageSize,
      total: m.totalItems,
      totalPages: m.totalPages,
      hasNext: Boolean(m.hasNext ?? (m.page < m.totalPages)),
      hasPrevious: Boolean(m.hasPrevious ?? (m.page > 1)),
    };
  }

  // 예외: 모양이 다를 때(빈 값 반환)
  return {
    items: [],
    page: page + 1,
    pageSize: size,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
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
  toggleRecruitmentApply,
  searchPosts,
};

export default postService;
