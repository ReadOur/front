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
  // 사용자 정보 수정
  UPDATE_NICKNAME: "/users/me/nickname",
  UPDATE_EMAIL: "/users/me/email",
  // 마이페이지 - 내 프로필
  MY_PAGE: "/my-page", // 내 프로필 + 최근 글/댓글/좋아요 5개씩
  MY_POSTS: "/my-page/posts", // 내가 작성한 게시글 전체 (페이징)
  MY_LIKED_POSTS: "/my-page/liked-posts", // 좋아요 누른 글 전체 (페이징)
  MY_COMMENTS: "/my-page/comments", // 내가 작성한 댓글 전체 (페이징)
  // 마이페이지 - 특정 사용자 프로필
  USER_MY_PAGE: (userId: number | string) => `/users/${userId}/my-page`, // 특정 사용자 프로필 미리보기
  USER_MY_PAGE_POSTS: (userId: number | string) => `/users/${userId}/my-page/posts`, // 특정 사용자 작성 게시글 (페이징)
  USER_MY_PAGE_LIKED_POSTS: (userId: number | string) => `/users/${userId}/my-page/liked-posts`, // 특정 사용자 좋아요 게시글 (페이징)
  USER_MY_PAGE_COMMENTS: (userId: number | string) => `/users/${userId}/my-page/comments`, // 특정 사용자 작성 댓글 (페이징)
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
  // 백엔드에서 같은 엔드포인트로 토글 처리하므로 취소도 LIKE로 요청
  UNLIKE: (postId: string) => `/community/posts/${postId}/like`,
  VIEW: (postId: string) => `/community/posts/${postId}/view`, // 조회수 증가 API
  TOGGLE_RECRUITMENT_APPLY: (postId: string) => `/community/recruitments/${postId}/apply-toggle`, // 모임 참여 토글
} as const;

/**
 * 메인 페이지 관련 엔드포인트
 */
export const MAIN_PAGE_ENDPOINTS = {
  MAIN: "/main-page", // 메인 페이지 데이터 (인기 게시글, 최근 게시글 등)
} as const;

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
  CREATE_ROOM: "/chat/rooms", // 채팅방 생성

  // 채팅방 메시지 (백엔드 API)
  ROOM_MESSAGES: (roomId: number) => `/chat/rooms/${roomId}/messages`, // 채팅방 메시지 조회

  // 공지사항 (백엔드 API)
  ANNOUNCEMENTS: (roomId: number) => `/chat/rooms/${roomId}/announcements`, // 공지사항 목록 조회
  ANNOUNCEMENT_DETAIL: (roomId: number, announcementId: number) => `/chat/rooms/${roomId}/announcements/${announcementId}`, // 공지사항 상세 조회
  CREATE_ANNOUNCEMENT: (roomId: number) => `/chat/rooms/${roomId}/announcements`, // 공지사항 생성
  UPDATE_ANNOUNCEMENT: (roomId: number, announcementId: number) => `/chat/rooms/${roomId}/announcements/${announcementId}`, // 공지사항 수정
  DELETE_ANNOUNCEMENT: (roomId: number, announcementId: number) => `/rooms/${roomId}/announcements/${announcementId}`, // 공지사항 삭제

  // 일정 (백엔드 API)
  SCHEDULES: (roomId: number) => `/chat/rooms/${roomId}/schedules`, // 일정 목록 조회
  SCHEDULE_DETAIL: (roomId: number, scheduleId: number) => `/chat/rooms/${roomId}/schedules/${scheduleId}`, // 일정 상세 조회
  CREATE_SCHEDULE: (roomId: number) => `/chat/rooms/${roomId}/schedules`, // 일정 생성
  UPDATE_SCHEDULE: (roomId: number, scheduleId: number) => `/chat/rooms/${roomId}/schedules/${scheduleId}`, // 일정 수정
  DELETE_SCHEDULE: (roomId: number, scheduleId: number) => `/chat/rooms/${roomId}/schedules/${scheduleId}`, // 일정 삭제
  SCHEDULE_PARTICIPANTS: (roomId: number, scheduleId: number) => `/rooms/${roomId}/schedules/${scheduleId}/participants`, // 일정 참여자 관리

  // 투표 (백엔드 API)
  POLLS: (roomId: number) => `/chat/rooms/${roomId}/polls`, // 투표 목록 조회
  POLL_DETAIL: (roomId: number, pollId: number) => `/chat/rooms/${roomId}/polls/${pollId}`, // 투표 상세 조회
  CREATE_POLL: (roomId: number) => `/chat/rooms/${roomId}/polls`, // 투표 생성
  DELETE_POLL: (roomId: number, pollId: number) => `/chat/rooms/${roomId}/polls/${pollId}`, // 투표 삭제
  VOTE: (roomId: number, pollId: number) => `/chat/rooms/${roomId}/polls/${pollId}/votes`, // 투표 참여/수정
  POLL_RESULTS: (roomId: number, pollId: number) => `/chat/rooms/${roomId}/polls/${pollId}/results`, // 투표 결과 조회

  // 채팅방 관리 (백엔드 API)
  JOIN_ROOM: (roomId: number) => `/chat/rooms/${roomId}/join`, // 채팅방 참여
  LEAVE_ROOM: (roomId: number) => `/chat/rooms/${roomId}/leave`, // 채팅방 나가기
  DELETE_ROOM: (roomId: number) => `/chat/rooms/${roomId}`, // 채팅방 삭제(폭파) - 방장 전용
  PIN_ROOM: (roomId: number) => `/chat/rooms/${roomId}/pin`, // 채팅방 핀 고정/해제
  MUTE_ROOM: (roomId: number) => `/chat/rooms/${roomId}/mute`, // 채팅방 알림 끄기
  KICK_USER: (roomId: number) => `/chat/rooms/${roomId}/kick`, // 채팅방 강퇴
  AI_JOB: (roomId: number) => `/chat/rooms/${roomId}/ai/jobs`, // AI 작업 요청

  // 메시지 관리 (백엔드 API)
  HIDE_MESSAGE: (roomId: number, messageId: number) => `/chat/rooms/${roomId}/messages/${messageId}/hide`, // 메시지 숨기기 (POST), 숨김 해제 (DELETE)

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
  // 책 검색
  SEARCH: "/books/search", // 책 검색 (쿼리: type, keyword, page, size)
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
  UPDATE_REVIEW: (reviewId: string) => `/books/reviews/${reviewId}`,
  DELETE_REVIEW: (reviewId: string) => `/books/reviews/${reviewId}`,
  // 하이라이트
  HIGHLIGHTS: (bookId: string) => `/books/${bookId}/highlights`,
  CREATE_HIGHLIGHT: (bookId: string) => `/books/${bookId}/highlights`,
  UPDATE_HIGHLIGHT: (highlightId: string) => `/books/highlights/${highlightId}`,
  DELETE_HIGHLIGHT: (highlightId: string) => `/books/highlights/${highlightId}`,
} as const;

/**
 * 내서재 관련 엔드포인트
 */
export const LIBRARY_ENDPOINTS = {
  BOOKMARKS: "/library/bookmarks",
  ADD_BOOKMARK: "/library/bookmarks",
  REMOVE_BOOKMARK: (bookmarkId: string) => `/library/bookmarks/${bookmarkId}`,
  SAVED_POSTS: "/library/saved-posts",
  // 내 서재 메인 페이지
  MY_LIBRARY: "/my-library", // 내 서재 메인 페이지 (위시리스트, 리뷰, 하이라이트 미리보기)
  MY_LIBRARY_WISHLIST: "/my-library/wishlist", // 내 서재 - 위시리스트 (페이지네이션)
  MY_LIBRARY_REVIEWS: "/my-library/reviews", // 내 서재 - 리뷰 목록 (페이지네이션)
  MY_LIBRARY_HIGHLIGHTS: "/my-library/highlights", // 내 서재 - 하이라이트 목록 (페이지네이션)
  // 관심 도서관
  FAVORITE_LIBRARIES: "/user/libraries",
  ADD_FAVORITE_LIBRARY: "/user/libraries",
  REMOVE_FAVORITE_LIBRARY: (libraryCode: string) => `/user/libraries/${libraryCode}`,
  // 도서관 검색
  SEARCH_LIBRARIES: "/user/libraries/search",
} as const;

/**
 * 지역 관련 엔드포인트
 */
export const REGION_ENDPOINTS = {
  PROVINCES: "/regions", // 광역시/도 목록
  CITIES: (regionCode: string) => `/regions/${regionCode}/details`, // 시/군/구 목록
  SEARCH: "/regions/search", // 지역 이름 검색
} as const;

/**
 * 모든 엔드포인트 통합
 */
export const ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  USER: USER_ENDPOINTS,
  POST: POST_ENDPOINTS,
  MAIN_PAGE: MAIN_PAGE_ENDPOINTS,
  COMMENT: COMMENT_ENDPOINTS,
  ATTACHMENT: ATTACHMENT_ENDPOINTS,
  CHAT: CHAT_ENDPOINTS,
  CALENDAR: CALENDAR_ENDPOINTS,
  BOOK: BOOK_ENDPOINTS,
  LIBRARY: LIBRARY_ENDPOINTS,
  REGION: REGION_ENDPOINTS,
} as const;
