/**
 * API 공통 타입 정의
 * - 모든 API 응답/요청에 사용되는 공통 인터페이스
 */

// ===== 공통 응답 타입 =====

/**
 * 표준 API 응답 래퍼
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

/**
 * API 에러 응답
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp?: string;
}

/**
 * 페이지네이션 메타 정보
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * 페이지네이션 요청 파라미터
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: "asc" | "desc";
}

// ===== 검색 관련 =====

/**
 * 검색 파라미터
 */
export interface SearchParams extends PaginationParams {
  query?: string;
  filter?: Record<string, unknown>;
}

// ===== 공통 엔티티 필드 =====

/**
 * 타임스탬프 필드 (모든 엔티티에 공통)
 */
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

/**
 * 소프트 삭제 필드
 */
export interface SoftDelete {
  deletedAt?: string | null;
}

/**
 * 기본 엔티티 (ID + 타임스탬프)
 */
export interface BaseEntity extends Timestamps {
  id: string;
}
