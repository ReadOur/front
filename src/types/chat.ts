/**
 * 채팅 관련 타입 정의
 */

import { BaseEntity } from "./api";
import { UserProfile } from "./user";

// ===== 채팅 사용자 =====

/**
 * 채팅 참여자 정보
 */
export interface ChatUser {
  id: string;
  nickname: string;
  avatarUrl?: string;
  online?: boolean;
  lastSeen?: string;
}

// ===== 채팅 메시지 =====

/**
 * 채팅 메시지
 */
export interface ChatMessage extends BaseEntity {
  threadId: string;
  senderId: string;
  sender: ChatUser;
  content: string;
  type: MessageType;
  isRead: boolean;
  readBy?: string[]; // 읽은 사용자 ID 목록
}

/**
 * 메시지 타입
 */
export enum MessageType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  FILE = "FILE",
  SYSTEM = "SYSTEM",
}

/**
 * 메시지 전송 요청
 */
export interface SendMessageRequest {
  threadId: string;
  content: string;
  type?: MessageType;
}

// ===== 채팅 스레드 (대화방) =====

/**
 * 채팅 스레드 (대화방)
 */
export interface ChatThread extends BaseEntity {
  title?: string; // 그룹 채팅일 경우 제목
  participants: ChatUser[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  type: ThreadType;
  isActive: boolean;
  isPinned: boolean; // 상단 고정 여부
}

/**
 * 스레드 타입
 */
export enum ThreadType {
  DIRECT = "DIRECT", // 1:1 채팅
  GROUP = "GROUP", // 그룹 채팅
}

/**
 * 스레드 목록 조회 파라미터
 */
export interface GetThreadsParams {
  page?: number;
  pageSize?: number;
  type?: ThreadType;
}

/**
 * 스레드 생성 요청
 */
export interface CreateThreadRequest {
  participantIds: string[];
  type: ThreadType;
  title?: string; // 그룹 채팅일 경우
}

/**
 * 메시지 목록 조회 파라미터
 */
export interface GetMessagesParams {
  threadId: string;
  page?: number;
  pageSize?: number;
  before?: string; // 특정 시간 이전 메시지 (무한 스크롤)
}

// ===== 타이핑 상태 =====

/**
 * 타이핑 상태
 */
export interface TypingStatus {
  threadId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

// ===== 읽음 표시 =====

/**
 * 메시지 읽음 처리 요청
 */
export interface MarkAsReadRequest {
  threadId: string;
  messageIds?: string[]; // 특정 메시지들만 읽음 처리 (없으면 전체)
}

/**
 * 읽음 표시 응답
 */
export interface MarkAsReadResponse {
  threadId: string;
  readCount: number;
}

// ===== 핀 기능 =====

/**
 * 스레드 핀 토글 요청
 */
export interface PinThreadRequest {
  threadId: string;
  isPinned: boolean;
}

/**
 * 스레드 핀 토글 응답
 */
export interface PinThreadResponse {
  threadId: string;
  isPinned: boolean;
}

// ===== 채팅방 Overview API =====

/**
 * 내 채팅방 아이템 (myRooms)
 */
export interface MyRoomItem {
  roomId: number;
  name: string;
  lastMsg: {
    id: number;
    preview: string;
    createdAt: string;
  };
  unreadCount: number;
  updatedAt: string;
  pinned: boolean;
  pinOrder: number;
}

/**
 * 공개 채팅방 아이템 (publicRooms)
 */
export interface PublicRoomItem {
  roomId: number;
  name: string;
  description: string;
  memberCount: number;
  joined: boolean;
  updatedAt: string;
}

/**
 * 페이지 정보
 */
export interface PageInfo {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
}

/**
 * 채팅방 목록 응답
 */
export interface RoomsOverviewResponse {
  myRooms: {
    items: MyRoomItem[];
    page: PageInfo;
  };
  publicRooms: {
    items: PublicRoomItem[];
    page: PageInfo;
  };
}

/**
 * 채팅방 Overview 조회 파라미터
 */
export interface GetRoomsOverviewParams {
  // accessToken으로 사용자 식별
}

/**
 * 내 채팅방 목록 응답
 */
export interface MyRoomsResponse {
  items: MyRoomItem[];
  page: PageInfo;
}

/**
 * 내 채팅방 목록 조회 파라미터
 */
export interface GetMyRoomsParams {
  page?: number;
  size?: number;
}

// ===== 채팅방 메시지 API =====

/**
 * 메시지 타입 (백엔드 API)
 */
export type RoomMessageType = "TEXT" | "IMAGE" | "FILE" | "POLL";

/**
 * 채팅방 메시지 아이템
 */
export interface RoomMessage {
  id: number;
  roomId: number;
  senderId: string;
  type: RoomMessageType;
  body: {
    text: string;
    extra?: string;
  };
  replyToMsgId: number | null;
  createdAt: string;
  deletedAt: string | null;
}

/**
 * 메시지 페이징 정보
 */
export interface MessagePaging {
  nextBefore: string | null;
}

/**
 * 채팅방 메시지 목록 응답
 */
export interface RoomMessagesResponse {
  items: RoomMessage[];
  paging: MessagePaging;
}

/**
 * 메시지 전송 요청
 */
export interface SendRoomMessageRequest {
  senderId: string;
  roomId: number;
  type: RoomMessageType;
  body: {
    text: string;
    extra?: string;
  };
  replyToMsgId?: number | null;
}

/**
 * 채팅방 메시지 조회 파라미터
 */
export interface GetRoomMessagesParams {
  roomId: number;
  before?: string; // 커서 기반 페이징
}

// ===== 채팅방 생성 =====

/**
 * 채팅방 카테고리 타입
 */
export type RoomCategory = "DIRECT" | "GROUP" | "MEETING";

/**
 * 채팅방 Scope 타입 (1:1 vs 그룹)
 */
export type RoomScope = "PRIVATE" | "PUBLIC";

/**
 * 채팅방 생성 요청
 */
export interface CreateRoomRequest {
  name: string;
  description?: string;
  category?: RoomCategory; // 기존 방식 (선택적)
  scope?: RoomScope; // 새로운 방식 (선택적)
  memberIds?: number[]; // 참여자 ID 목록 (1:1 채팅방 생성 시 사용)
}

/**
 * 채팅방 생성 응답
 */
export interface CreateRoomResponse {
  roomId: number;
  name: string;
  description: string;
  category?: RoomCategory;
  scope?: RoomScope;
  createdAt: string;
}

// ===== 공지사항 API =====

/**
 * 공지사항 작성자 정보
 */
export interface AnnouncementAuthor {
  id: number;
  username: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "MANAGER";
}

/**
 * 공지사항 아이템
 */
export interface Announcement {
  id: number;
  roomId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: AnnouncementAuthor;
}

/**
 * 공지사항 목록 응답
 */
export interface AnnouncementsResponse {
  items: Announcement[];
  page: PageInfo;
}

/**
 * 공지사항 목록 조회 파라미터
 */
export interface GetAnnouncementsParams {
  roomId: number;
  page?: number;
  size?: number;
}

/**
 * 공지사항 상세 응답
 */
export interface AnnouncementDetailResponse {
  id: number;
  roomId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: AnnouncementAuthor;
}

