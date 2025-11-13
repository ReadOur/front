/**
 * 책 관련 React Query 훅
 */

import { useQuery, useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { bookService } from "@/services/bookService";
import {
  WishlistResponse,
  WishlistItem,
  BookReview,
  BookHighlight,
} from "@/types";

// ===== Query Keys =====
export const BOOK_QUERY_KEYS = {
  all: ["books"] as const,
  wishlists: () => [...BOOK_QUERY_KEYS.all, "wishlist"] as const,
  wishlist: () => [...BOOK_QUERY_KEYS.wishlists()] as const,
  reviews: () => [...BOOK_QUERY_KEYS.all, "reviews"] as const,
  reviewList: (bookId: string) => [...BOOK_QUERY_KEYS.reviews(), bookId] as const,
  highlights: () => [...BOOK_QUERY_KEYS.all, "highlights"] as const,
  highlightList: (bookId: string) => [...BOOK_QUERY_KEYS.highlights(), bookId] as const,
};

// ===== Queries =====

/**
 * 위시리스트 목록 조회
 */
export function useWishlist() {
  return useQuery<WishlistItem[]>({
    queryKey: BOOK_QUERY_KEYS.wishlist(),
    queryFn: bookService.getWishlist,
  });
}

/**
 * 책 리뷰 목록 조회
 */
export function useBookReviews(bookId: string) {
  return useQuery<BookReview[]>({
    queryKey: BOOK_QUERY_KEYS.reviewList(bookId),
    queryFn: () => bookService.getBookReviews(bookId),
    enabled: !!bookId,
  });
}

/**
 * 책 하이라이트 목록 조회
 */
export function useBookHighlights(bookId: string) {
  return useQuery<BookHighlight[]>({
    queryKey: BOOK_QUERY_KEYS.highlightList(bookId),
    queryFn: () => bookService.getBookHighlights(bookId),
    enabled: !!bookId,
  });
}

// ===== Mutations =====

/**
 * 위시리스트 토글 (추가/삭제)
 */
export function useToggleWishlist(
  options?: UseMutationOptions<
    WishlistResponse,
    Error,
    { bookId: string; isWishlisted: boolean },
    { previousWishlist?: WishlistItem[] }
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    WishlistResponse,
    Error,
    { bookId: string; isWishlisted: boolean },
    { previousWishlist?: WishlistItem[] }
  >({
    ...options,
    mutationFn: ({ bookId }) => bookService.toggleWishlist(bookId),
    onMutate: async ({ bookId, isWishlisted }) => {
      // 낙관적 업데이트: 즉시 UI 반영
      await queryClient.cancelQueries({ queryKey: BOOK_QUERY_KEYS.wishlist() });

      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(
        BOOK_QUERY_KEYS.wishlist()
      );

      // 위시리스트 목록 낙관적 업데이트 (있으면 제거, 없으면 추가)
      if (previousWishlist) {
        if (isWishlisted) {
          // 제거
          queryClient.setQueryData<WishlistItem[]>(
            BOOK_QUERY_KEYS.wishlist(),
            previousWishlist.filter((item) => item.bookId !== bookId)
          );
        } else {
          // 추가 (임시 데이터, 실제 데이터는 서버에서 받아옴)
          // 실제로는 book 정보가 있어야 하지만, 여기서는 낙관적 업데이트만 수행
        }
      }

      return { previousWishlist };
    },
    onError: (err, variables, context) => {
      // 에러 시 롤백
      if (context?.previousWishlist) {
        queryClient.setQueryData(BOOK_QUERY_KEYS.wishlist(), context.previousWishlist);
      }
      if (options?.onError) {
        (options.onError as any)(err, variables, context);
      }
    },
    onSuccess: (data, variables, context) => {
      // 서버 응답으로 최종 업데이트
      queryClient.invalidateQueries({ queryKey: BOOK_QUERY_KEYS.wishlist() });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 책 리뷰 작성
 */
export function useCreateBookReview(
  options?: UseMutationOptions<
    BookReview,
    Error,
    { bookId: string; content: string; rating: number },
    unknown
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    BookReview,
    Error,
    { bookId: string; content: string; rating: number },
    unknown
  >({
    ...options,
    mutationFn: ({ bookId, content, rating }) =>
      bookService.createBookReview(bookId, { content, rating }),
    onSuccess: (data, variables, context) => {
      // 리뷰 목록 무효화
      queryClient.invalidateQueries({ queryKey: BOOK_QUERY_KEYS.reviewList(variables.bookId) });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 책 리뷰 수정
 */
export function useUpdateBookReview(
  options?: UseMutationOptions<
    BookReview,
    Error,
    { bookId: string; reviewId: string; content: string; rating: number },
    unknown
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    BookReview,
    Error,
    { bookId: string; reviewId: string; content: string; rating: number },
    unknown
  >({
    ...options,
    mutationFn: ({ bookId, reviewId, content, rating }) =>
      bookService.updateBookReview(bookId, reviewId, { content, rating }),
    onSuccess: (data, variables, context) => {
      // 리뷰 목록 무효화
      queryClient.invalidateQueries({ queryKey: BOOK_QUERY_KEYS.reviewList(variables.bookId) });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 책 리뷰 삭제
 */
export function useDeleteBookReview(
  options?: UseMutationOptions<void, Error, { bookId: string; reviewId: string }, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { bookId: string; reviewId: string }, unknown>({
    ...options,
    mutationFn: ({ bookId, reviewId }) => bookService.deleteBookReview(bookId, reviewId),
    onSuccess: (data, variables, context) => {
      // 리뷰 목록 무효화
      queryClient.invalidateQueries({ queryKey: BOOK_QUERY_KEYS.reviewList(variables.bookId) });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 책 하이라이트 작성
 */
export function useCreateBookHighlight(
  options?: UseMutationOptions<
    BookHighlight,
    Error,
    { bookId: string; content: string; page?: number },
    unknown
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    BookHighlight,
    Error,
    { bookId: string; content: string; page?: number },
    unknown
  >({
    ...options,
    mutationFn: ({ bookId, content, page }) =>
      bookService.createBookHighlight(bookId, { content, page }),
    onSuccess: (data, variables, context) => {
      // 하이라이트 목록 무효화
      queryClient.invalidateQueries({
        queryKey: BOOK_QUERY_KEYS.highlightList(variables.bookId),
      });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 책 하이라이트 수정
 */
export function useUpdateBookHighlight(
  options?: UseMutationOptions<
    BookHighlight,
    Error,
    { bookId: string; highlightId: string; content: string; page?: number },
    unknown
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    BookHighlight,
    Error,
    { bookId: string; highlightId: string; content: string; page?: number },
    unknown
  >({
    ...options,
    mutationFn: ({ bookId, highlightId, content, page }) =>
      bookService.updateBookHighlight(bookId, highlightId, { content, page }),
    onSuccess: (data, variables, context) => {
      // 하이라이트 목록 무효화
      queryClient.invalidateQueries({
        queryKey: BOOK_QUERY_KEYS.highlightList(variables.bookId),
      });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 책 하이라이트 삭제
 */
export function useDeleteBookHighlight(
  options?: UseMutationOptions<void, Error, { bookId: string; highlightId: string }, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { bookId: string; highlightId: string }, unknown>({
    ...options,
    mutationFn: ({ bookId, highlightId }) => bookService.deleteBookHighlight(bookId, highlightId),
    onSuccess: (data, variables, context) => {
      // 하이라이트 목록 무효화
      queryClient.invalidateQueries({
        queryKey: BOOK_QUERY_KEYS.highlightList(variables.bookId),
      });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}
