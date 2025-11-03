/**
 * API 응답 데이터 변환 유틸리티
 * - 백엔드 형식 → 프론트엔드 형식 변환
 * - 날짜 처리, 기본값 설정 등
 */

import { PaginatedResponse, PaginationMeta } from "@/types";

/**
 * 날짜 문자열을 Date 객체로 변환
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 날짜 문자열을 타임스탬프(밀리초)로 변환
 */
export function parseTimestamp(dateString: string | null | undefined): number | null {
  const date = parseDate(dateString);
  return date ? date.getTime() : null;
}

/**
 * ISO 날짜를 한국어 형식으로 변환
 *
 * @example
 * formatKoreanDate("2024-01-15T10:30:00Z")
 * // "2024년 1월 15일"
 */
export function formatKoreanDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "";

  const date = typeof dateString === "string" ? parseDate(dateString) : dateString;
  if (!date) return "";

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 상대적 시간 표시 (예: "3시간 전", "2일 전")
 */
export function formatRelativeTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "";

  const date = typeof dateString === "string" ? parseDate(dateString) : dateString;
  if (!date) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}개월 전`;
  return `${Math.floor(diffDay / 365)}년 전`;
}

/**
 * 숫자를 한국어 표기로 변환 (예: 1000 → "1천", 10000 → "1만")
 */
export function formatKoreanNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "0";

  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(1)}억`;
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}천`;
  }
  return num.toString();
}

/**
 * 페이지네이션 응답 변환 헬퍼
 *
 * @example
 * // 백엔드가 다른 필드명을 사용할 경우 변환
 * transformPaginatedResponse(backendData, (item) => ({
 *   id: item.post_id,
 *   title: item.post_title,
 * }))
 */
export function transformPaginatedResponse<TInput, TOutput>(
  input: PaginatedResponse<TInput>,
  transformer: (item: TInput) => TOutput
): PaginatedResponse<TOutput> {
  return {
    items: input.items.map(transformer),
    meta: input.meta,
  };
}

/**
 * 페이지네이션 메타 정보 생성 (백엔드가 다른 형식을 사용할 경우)
 *
 * @example
 * // 백엔드 응답: { total: 100, current_page: 1, per_page: 20 }
 * createPaginationMeta({
 *   totalItems: backendData.total,
 *   page: backendData.current_page,
 *   pageSize: backendData.per_page,
 * })
 */
export function createPaginationMeta(params: {
  totalItems: number;
  page: number;
  pageSize: number;
}): PaginationMeta {
  const { totalItems, page, pageSize } = params;
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

/**
 * 배열을 페이지네이션 응답으로 변환 (클라이언트 사이드 페이지네이션)
 */
export function paginateArray<T>(
  items: T[],
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    meta: createPaginationMeta({
      totalItems: items.length,
      page,
      pageSize,
    }),
  };
}

/**
 * 안전한 속성 접근 (중첩 객체에서 값 가져오기)
 *
 * @example
 * safeGet(user, "profile.avatar.url", "default.png")
 * // user?.profile?.avatar?.url ?? "default.png"
 */
export function safeGet<T = unknown>(
  obj: Record<string, unknown> | null | undefined,
  path: string,
  defaultValue?: T
): T | undefined {
  if (!obj) return defaultValue;

  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return (current as T) ?? defaultValue;
}

/**
 * API 에러 메시지 추출
 */
export function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    // Axios 에러
    if ("response" in error && error.response) {
      const response = error.response as {
        data?: { message?: string; error?: { message?: string } };
      };
      return (
        response.data?.message ||
        response.data?.error?.message ||
        "서버 에러가 발생했습니다."
      );
    }

    // 일반 에러 객체
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }

  return "알 수 없는 에러가 발생했습니다.";
}

/**
 * 빈 값 처리 (null, undefined, 빈 문자열을 기본값으로 대체)
 */
export function withDefault<T>(value: T | null | undefined, defaultValue: T): T {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }
  return value;
}

/**
 * 객체 배열에서 특정 필드만 추출
 *
 * @example
 * pluck([{ id: 1, name: "A" }, { id: 2, name: "B" }], "id")
 * // [1, 2]
 */
export function pluck<T, K extends keyof T>(array: T[], key: K): T[K][] {
  return array.map((item) => item[key]);
}

/**
 * 객체 배열을 Map으로 변환 (빠른 조회를 위해)
 *
 * @example
 * const users = [{ id: "1", name: "A" }, { id: "2", name: "B" }];
 * const userMap = toMap(users, "id");
 * userMap.get("1") // { id: "1", name: "A" }
 */
export function toMap<T, K extends keyof T>(
  array: T[],
  key: K
): Map<T[K], T> {
  const map = new Map<T[K], T>();
  for (const item of array) {
    map.set(item[key], item);
  }
  return map;
}

/**
 * 객체 배열을 Record로 변환
 *
 * @example
 * const users = [{ id: "1", name: "A" }, { id: "2", name: "B" }];
 * const userRecord = toRecord(users, "id");
 * // { "1": { id: "1", name: "A" }, "2": { id: "2", name: "B" } }
 */
export function toRecord<T, K extends keyof T>(
  array: T[],
  key: K
): Record<string, T> {
  const record: Record<string, T> = {};
  for (const item of array) {
    const keyValue = item[key];
    if (typeof keyValue === "string" || typeof keyValue === "number") {
      record[String(keyValue)] = item;
    }
  }
  return record;
}
