/**
 * 내서재 관련 API 서비스
 */

import { apiClient } from "@/api/client";
import { LIBRARY_ENDPOINTS } from "@/api/endpoints";
import {
  Bookmark,
  SavedPost,
  FavoriteLibrary,
  Library,
  LibrarySearchParams,
  LibrarySearchResponse,
  MyLibraryResponse,
  MyLibraryWishlistPageResponse,
  MyLibraryReviewPageResponse,
  MyLibraryHighlightPageResponse,
} from "@/types/library";

// ===== 북마크 (책갈피) =====

/**
 * 북마크 목록 조회
 * GET /library/bookmarks
 */
export async function getBookmarks(): Promise<Bookmark[]> {
  return apiClient.get<Bookmark[]>(LIBRARY_ENDPOINTS.BOOKMARKS);
}

/**
 * 북마크 추가
 * POST /library/bookmarks
 */
export async function addBookmark(postId: number): Promise<Bookmark> {
  return apiClient.post<Bookmark>(LIBRARY_ENDPOINTS.ADD_BOOKMARK, { postId });
}

/**
 * 북마크 삭제
 * DELETE /library/bookmarks/{bookmarkId}
 */
export async function removeBookmark(bookmarkId: string): Promise<void> {
  return apiClient.delete(LIBRARY_ENDPOINTS.REMOVE_BOOKMARK(bookmarkId));
}

// ===== 저장한 게시글 =====

/**
 * 저장한 게시글 목록 조회
 * GET /library/saved-posts
 */
export async function getSavedPosts(): Promise<SavedPost[]> {
  return apiClient.get<SavedPost[]>(LIBRARY_ENDPOINTS.SAVED_POSTS);
}

// ===== 관심 도서관 =====

/**
 * 관심 도서관 목록 조회
 * GET /users/me/favorite-libraries
 */
export async function getFavoriteLibraries(): Promise<FavoriteLibrary[]> {
  return apiClient.get<FavoriteLibrary[]>(LIBRARY_ENDPOINTS.FAVORITE_LIBRARIES);
}

/**
 * 관심 도서관 추가
 * POST /users/me/favorite-libraries
 */
export async function addFavoriteLibrary(libraryName: string): Promise<FavoriteLibrary> {
  return apiClient.post<FavoriteLibrary>(LIBRARY_ENDPOINTS.ADD_FAVORITE_LIBRARY, {
    libraryName,
  });
}

/**
 * 관심 도서관 삭제
 * DELETE /users/me/favorite-libraries/{libraryName}
 */
export async function removeFavoriteLibrary(libraryName: string): Promise<void> {
  return apiClient.delete(LIBRARY_ENDPOINTS.REMOVE_FAVORITE_LIBRARY(libraryName));
}

// ===== 도서관 검색 =====

/**
 * 도서관 검색
 * GET /user/libraries/search
 */
export async function searchLibraries(
  params: LibrarySearchParams
): Promise<LibrarySearchResponse> {
  return apiClient.get<LibrarySearchResponse>(LIBRARY_ENDPOINTS.SEARCH_LIBRARIES, {
    params: {
      region: params.region,
      dtlRegion: params.dtlRegion,
      page: params.page || 0,
      size: params.size || 20,
    },
  });
}

// ===== 내 서재 메인 페이지 =====

/**
 * 내 서재 메인 페이지 조회
 * GET /my-library
 * 위시리스트, 리뷰, 하이라이트 미리보기 (각 최대 10개)
 */
export async function getMyLibrary(): Promise<MyLibraryResponse> {
  return apiClient.get<MyLibraryResponse>(LIBRARY_ENDPOINTS.MY_LIBRARY);
}

/**
 * 내 서재 - 위시리스트 페이징 조회
 * GET /my-library/wishlist
 */
export async function getMyLibraryWishlist(params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<MyLibraryWishlistPageResponse> {
  return apiClient.get<MyLibraryWishlistPageResponse>(LIBRARY_ENDPOINTS.MY_LIBRARY_WISHLIST, {
    params: {
      page: params?.page || 0,
      size: params?.size || 10,
      sort: params?.sort || "createdAt,ASC",
    },
  });
}

/**
 * 내 서재 - 리뷰 페이징 조회
 * GET /my-library/reviews
 */
export async function getMyLibraryReviews(params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<MyLibraryReviewPageResponse> {
  return apiClient.get<MyLibraryReviewPageResponse>(LIBRARY_ENDPOINTS.MY_LIBRARY_REVIEWS, {
    params: {
      page: params?.page || 0,
      size: params?.size || 10,
      sort: params?.sort || "createdAt,ASC",
    },
  });
}

/**
 * 내 서재 - 하이라이트 페이징 조회
 * GET /my-library/highlights
 */
export async function getMyLibraryHighlights(params?: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<MyLibraryHighlightPageResponse> {
  return apiClient.get<MyLibraryHighlightPageResponse>(LIBRARY_ENDPOINTS.MY_LIBRARY_HIGHLIGHTS, {
    params: {
      page: params?.page || 0,
      size: params?.size || 10,
      sort: params?.sort || "createdAt,ASC",
    },
  });
}

export const libraryService = {
  // 북마크
  getBookmarks,
  addBookmark,
  removeBookmark,
  // 저장한 게시글
  getSavedPosts,
  // 관심 도서관
  getFavoriteLibraries,
  addFavoriteLibrary,
  removeFavoriteLibrary,
  // 도서관 검색
  searchLibraries,
  // 내 서재
  getMyLibrary,
  getMyLibraryWishlist,
  getMyLibraryReviews,
  getMyLibraryHighlights,
};
