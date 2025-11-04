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
} as const;

/**
 * 게시글 관련 엔드포인트
 */
export const POST_ENDPOINTS = {
  LIST: "/community/posts",
  CREATE: "/community/posts",
  DETAIL: (postId: string) => `/community/posts/${postId}`,
  UPDATE: (postId: string) => `/community/posts/${postId}`,
  DELETE: (postId: string) => `/community/posts/${postId}`,
  LIKE: (postId: string) => `/community/posts/${postId}/like`,
  UNLIKE: (postId: string) => `/community/posts/${postId}/unlike`,
  VIEW: (postId: string) => `/community/posts/${postId}/view`,
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
  THREADS: "/chat/threads",
  THREAD_DETAIL: (threadId: string) => `/chat/threads/${threadId}`,
  MESSAGES: (threadId: string) => `/chat/threads/${threadId}/messages`,
  SEND_MESSAGE: (threadId: string) => `/chat/threads/${threadId}/messages`,
  MARK_READ: (threadId: string) => `/chat/threads/${threadId}/read`,
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
 * 내서재 관련 엔드포인트
 */
export const LIBRARY_ENDPOINTS = {
  BOOKMARKS: "/library/bookmarks",
  ADD_BOOKMARK: "/library/bookmarks",
  REMOVE_BOOKMARK: (bookmarkId: string) => `/library/bookmarks/${bookmarkId}`,
  SAVED_POSTS: "/library/saved-posts",
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
  LIBRARY: LIBRARY_ENDPOINTS,
} as const;
