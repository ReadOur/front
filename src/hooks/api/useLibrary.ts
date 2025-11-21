/**
 * 내서재 관련 React Query 훅
 */

import { useQuery, useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { libraryService } from "@/services/libraryService";
import {
  Bookmark,
  SavedPost,
  FavoriteLibrary,
  LibrarySearchParams,
  LibrarySearchResponse,
} from "@/types/library";

// ===== Query Keys =====
export const LIBRARY_QUERY_KEYS = {
  all: ["library"] as const,
  bookmarks: () => [...LIBRARY_QUERY_KEYS.all, "bookmarks"] as const,
  savedPosts: () => [...LIBRARY_QUERY_KEYS.all, "savedPosts"] as const,
  favoriteLibraries: () => [...LIBRARY_QUERY_KEYS.all, "favoriteLibraries"] as const,
  librarySearch: (params: LibrarySearchParams) =>
    [...LIBRARY_QUERY_KEYS.all, "search", params] as const,
};

// ===== Queries =====

/**
 * 북마크 목록 조회
 */
export function useBookmarks() {
  return useQuery<Bookmark[]>({
    queryKey: LIBRARY_QUERY_KEYS.bookmarks(),
    queryFn: libraryService.getBookmarks,
  });
}

/**
 * 저장한 게시글 목록 조회
 */
export function useSavedPosts() {
  return useQuery<SavedPost[]>({
    queryKey: LIBRARY_QUERY_KEYS.savedPosts(),
    queryFn: libraryService.getSavedPosts,
  });
}

/**
 * 관심 도서관 목록 조회
 */
export function useFavoriteLibraries() {
  return useQuery<FavoriteLibrary[]>({
    queryKey: LIBRARY_QUERY_KEYS.favoriteLibraries(),
    queryFn: libraryService.getFavoriteLibraries,
  });
}

/**
 * 도서관 검색
 */
export function useLibrarySearch(params: LibrarySearchParams) {
  return useQuery<LibrarySearchResponse>({
    queryKey: LIBRARY_QUERY_KEYS.librarySearch(params),
    queryFn: () => libraryService.searchLibraries(params),
    enabled: !!(params.region || params.dtlRegion),
  });
}

// ===== Mutations =====

/**
 * 북마크 추가
 */
export function useAddBookmark(options?: UseMutationOptions<Bookmark, Error, number, unknown>) {
  const queryClient = useQueryClient();

  return useMutation<Bookmark, Error, number, unknown>({
    ...options,
    mutationFn: (postId: number) => libraryService.addBookmark(postId),
    onSuccess: (data, variables, context) => {
      // 북마크 목록 무효화
      queryClient.invalidateQueries({ queryKey: LIBRARY_QUERY_KEYS.bookmarks() });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 북마크 삭제
 */
export function useRemoveBookmark(
  options?: UseMutationOptions<void, Error, string, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, unknown>({
    ...options,
    mutationFn: (bookmarkId: string) => libraryService.removeBookmark(bookmarkId),
    onSuccess: (data, variables, context) => {
      // 북마크 목록 무효화
      queryClient.invalidateQueries({ queryKey: LIBRARY_QUERY_KEYS.bookmarks() });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 관심 도서관 추가
 */
export function useAddFavoriteLibrary(
  options?: UseMutationOptions<FavoriteLibrary, Error, string, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<FavoriteLibrary, Error, string, unknown>({
    ...options,
    mutationFn: (libraryName: string) => libraryService.addFavoriteLibrary(libraryName),
    onSuccess: (data, variables, context) => {
      // 관심 도서관 목록 무효화
      queryClient.invalidateQueries({ queryKey: LIBRARY_QUERY_KEYS.favoriteLibraries() });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 관심 도서관 삭제
 */
export function useRemoveFavoriteLibrary(
  options?: UseMutationOptions<void, Error, string, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, unknown>({
    ...options,
    mutationFn: (libraryName: string) => libraryService.removeFavoriteLibrary(libraryName),
    onSuccess: (data, variables, context) => {
      // 관심 도서관 목록 무효화
      queryClient.invalidateQueries({ queryKey: LIBRARY_QUERY_KEYS.favoriteLibraries() });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}
