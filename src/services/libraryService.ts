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
};
