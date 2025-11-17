/**
 * API 엔드포인트 상수 정의
 * - 모든 API 경로를 중앙에서 관리
 * - 타입 안전성을 위해 함수로 제공
 */

/**
 * 인증 관련 엔드포인트
 */
export const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  LOGOUT: "/auth/logout",
  REFRESH: "/auth/refresh",
  ME: "/auth/me",
} as const;

/**
 * 사용자 관련 엔드포인트
 */
export const USER_ENDPOINTS = {
  PROFILE: (userId: string) => `/users/${userId}`,
  UPDATE_PROFILE: (userId: string) => `/users/${userId}`,
  AVATAR: (userId: string) => `/users/${userId}/avatar`,
  // 계정 관리
  FIND_ID: "/users/find-id",
  RESET_PASSWORD: "/users/reset-password",
  CHANGE_PASSWORD: "/users/change-password",
  // 마이페이지
  MY_PAGE: "/my-page", // 내 프로필 + 최근 글/댓글/좋아요 5개씩
  MY_POSTS: "/my-page/posts", // 내가 작성한 게시글 전체 (페이징)
  MY_LIKED_POSTS: "/my-page/liked-posts", // 좋아요 누른 글 전체 (페이징)
  MY_COMMENTS: "/my-page/comments", // 내가 작성한 댓글 전체 (페이징)
  // 마이페이지 - 특정 사용자 (TODO: 백엔드 API 확인 필요)
  USER_PROFILE: (userId: string) => `/users/${userId}/profile`,
} as const;

/**
 * 게시글 관련 엔드포인트
 */
export const POST_ENDPOINTS = {
  LIST: "/community/posts",
  SEARCH: "/community/posts/search",
  CREATE: "/community/posts",
  DETAIL: (postId: string) => `/community/posts/${postId}`,
  UPDATE: (postId: string) => `/community/posts/${postId}`,
  DELETE: (postId: string) => `/community/posts/${postId}`,
  LIKE: (postId: string) => `/community/posts/${postId}/like`,
  UNLIKE: (postId: string) => `/community/posts/${postId}/unlike`,
  VIEW: (postId: string) => `/community/posts/${postId}/view`, // 조회수 증가 API
} as const;

export const GET_ALL = {

}

/**
 * 댓글 관련 엔드포인트
 */
export const COMMENT_ENDPOINTS = {
  LIST: (postId: string) => `/community/posts/${postId}/comments`,
  CREATE: (postId: string) => `/community/posts/${postId}/comments`,
  DETAIL: (commentId: string) => `/community/comments/${commentId}`,
  UPDATE: (commentId: string) => `/community/comments/${commentId}`,
  DELETE: (commentId: string) => `/community/comments/${commentId}`,
  LIKE: (commentId: string) => `/community/comments/${commentId}/like`,
  UNLIKE: (commentId: string) => `/community/comments/${commentId}/unlike`,
  // 대댓글
  REPLIES: (commentId: string) => `/community/comments/${commentId}/replies`,
  CREATE_REPLY: (commentId: string) => `/community/comments/${commentId}/replies`,
} as const;

/**
 * 첨부파일 관련 엔드포인트
 */
export const ATTACHMENT_ENDPOINTS = {
  UPLOAD: "/attachments/upload",
  DELETE: (attachmentId: string) => `/attachments/${attachmentId}`,
  DOWNLOAD: (attachmentId: string) => `/attachments/${attachmentId}/download`,
} as const;

/**
 * 채팅 관련 엔드포인트
 */
export const CHAT_ENDPOINTS = {
  // 채팅방 목록 (백엔드 API)
  ROOMS_OVERVIEW: "/chat/rooms/overview", // 전체 채팅방 overview
  MY_ROOMS: "/chat/rooms/my", // 내 채팅방 목록

  // 채팅방 메시지 (백엔드 API)
  ROOM_MESSAGES: (roomId: number) => `/chat/rooms/${roomId}/messages`, // 채팅방 메시지 조회

  // 기존 엔드포인트 (향후 사용)
  THREADS: "/chat/threads",
  THREAD_DETAIL: (threadId: string) => `/chat/threads/${threadId}`,
  MESSAGES: (threadId: string) => `/chat/threads/${threadId}/messages`,
  SEND_MESSAGE: (threadId: string) => `/chat/threads/${threadId}/messages`,
  MARK_READ: (threadId: string) => `/chat/threads/${threadId}/read`,
  UNREAD_COUNT: "/chat/unread-count",
  CREATE_THREAD: "/chat/threads",
  PIN_THREAD: (threadId: string) => `/chat/threads/${threadId}/pin`,
} as const;

/**
 * 캘린더 관련 엔드포인트
 */
export const CALENDAR_ENDPOINTS = {
  EVENTS: "/calendar/events",
  EVENT_DETAIL: (eventId: string) => `/calendar/events/${eventId}`,
  CREATE: "/calendar/events",
  UPDATE: (eventId: string) => `/calendar/events/${eventId}`,
  DELETE: (eventId: string) => `/calendar/events/${eventId}`,
} as const;

/**
 * 책 관련 엔드포인트
 */
export const BOOK_ENDPOINTS = {
  // 책 정보
  DETAIL: (bookId: string) => `/books/${bookId}`, // 책 상세 정보 조회
  DETAIL_BY_ISBN: (isbn13: string) => `/books/isbn/${isbn13}`, // ISBN으로 책 조회
  RELATED_POSTS: (bookId: string) => `/books/${bookId}/posts`, // 책 연관 게시글
  AVAILABILITY: "/books/availability", // 도서관 대출 가능 여부 (쿼리: isbn13)
  // 위시리스트
  TOGGLE_WISHLIST: (bookId: string) => `/books/${bookId}/wishlist`,
  WISHLIST: "/books/wishlist", // 위시리스트 목록 조회
  // 리뷰
  REVIEWS: (bookId: string) => `/books/${bookId}/reviews`,
  CREATE_REVIEW: (bookId: string) => `/books/${bookId}/reviews`,
  UPDATE_REVIEW: (bookId: string, reviewId: string) => `/books/${bookId}/reviews/${reviewId}`,
  DELETE_REVIEW: (bookId: string, reviewId: string) => `/books/${bookId}/reviews/${reviewId}`,
  // 하이라이트
  HIGHLIGHTS: (bookId: string) => `/books/${bookId}/highlights`,
  CREATE_HIGHLIGHT: (bookId: string) => `/books/${bookId}/highlights`,
  UPDATE_HIGHLIGHT: (bookId: string, highlightId: string) => `/books/${bookId}/highlights/${highlightId}`,
  DELETE_HIGHLIGHT: (bookId: string, highlightId: string) => `/books/${bookId}/highlights/${highlightId}`,
} as const;

/**
 * 내서재 관련 엔드포인트
 */
export const LIBRARY_ENDPOINTS = {
  BOOKMARKS: "/library/bookmarks",
  ADD_BOOKMARK: "/library/bookmarks",
  REMOVE_BOOKMARK: (bookmarkId: string) => `/library/bookmarks/${bookmarkId}`,
  SAVED_POSTS: "/library/saved-posts",
  // 내 서재 - 리뷰
  MY_REVIEWS: "/my-library/reviews", // 내가 작성한 리뷰 목록 (페이지네이션)
  // 관심 도서관
  FAVORITE_LIBRARIES: "/users/me/favorite-libraries",
  ADD_FAVORITE_LIBRARY: "/users/me/favorite-libraries",
  REMOVE_FAVORITE_LIBRARY: (libraryName: string) => `/users/me/favorite-libraries/${encodeURIComponent(libraryName)}`,
  // 도서관 검색
  SEARCH_LIBRARIES: "/user/libraries/search",
} as const;

/**
 * 지역 관련 엔드포인트
 */
export const REGION_ENDPOINTS = {
  PROVINCES: "/regions", // 광역시/도 목록
  CITIES: (regionId: number) => `/regions/${regionId}/details`, // 시/군/구 목록
  SEARCH: "/regions/search", // 지역 이름 검색
} as const;

/**
 * 모든 엔드포인트 통합
 */
export const ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  USER: USER_ENDPOINTS,
  POST: POST_ENDPOINTS,
  COMMENT: COMMENT_ENDPOINTS,
  ATTACHMENT: ATTACHMENT_ENDPOINTS,
  CHAT: CHAT_ENDPOINTS,
  CALENDAR: CALENDAR_ENDPOINTS,
  BOOK: BOOK_ENDPOINTS,
  LIBRARY: LIBRARY_ENDPOINTS,
  REGION: REGION_ENDPOINTS,
} as const;
