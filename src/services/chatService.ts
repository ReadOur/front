/**
 * 채팅 관련 API 서비스
 */

import { apiClient } from "@/api/client";
import { CHAT_ENDPOINTS } from "@/api/endpoints";
import {
  ChatThread,
  ChatMessage,
  GetThreadsParams,
  GetMessagesParams,
  SendMessageRequest,
  CreateThreadRequest,
  MarkAsReadRequest,
  MarkAsReadResponse,
  PinThreadRequest,
  PinThreadResponse,
  PaginatedResponse,
  RoomsOverviewResponse,
  GetRoomsOverviewParams,
  RoomMessagesResponse,
  GetRoomMessagesParams,
  MyRoomsResponse,
  GetMyRoomsParams,
  SendRoomMessageRequest,
  RoomMessage,
  CreateRoomRequest,
  CreateRoomResponse,
  AnnouncementsResponse,
  GetAnnouncementsParams,
  AnnouncementDetailResponse,
} from "@/types";

// ===== 채팅방 목록 (백엔드 API) =====

/**
 * 채팅방 Overview 조회 (myRooms + publicRooms)
 */
export async function getRoomsOverview(params: GetRoomsOverviewParams): Promise<RoomsOverviewResponse> {
  // userId를 쿼리 파라미터로 포함
  return apiClient.get<RoomsOverviewResponse>(CHAT_ENDPOINTS.ROOMS_OVERVIEW, { params });
}

/**
 * 내 채팅방 목록 조회
 */
export async function getMyRooms(params: GetMyRoomsParams): Promise<MyRoomsResponse> {
  // userId를 쿼리 파라미터로 포함
  return apiClient.get<MyRoomsResponse>(CHAT_ENDPOINTS.MY_ROOMS, { params });
}

/**
 * 채팅방 생성
 */
export async function createRoom(data: CreateRoomRequest): Promise<CreateRoomResponse> {
  return apiClient.post<CreateRoomResponse>(CHAT_ENDPOINTS.CREATE_ROOM, data);
}

/**
 * 채팅방 메시지 조회
 */
export async function getRoomMessages(params: GetRoomMessagesParams): Promise<RoomMessagesResponse> {
  const { roomId, before } = params;
  return apiClient.get<RoomMessagesResponse>(
    CHAT_ENDPOINTS.ROOM_MESSAGES(roomId),
    {
      params: before ? { before } : undefined,
    }
  );
}

/**
 * 메시지 전송
 */
export async function sendRoomMessage(data: SendRoomMessageRequest): Promise<RoomMessage> {
  const { roomId } = data;
  return apiClient.post<RoomMessage>(
    CHAT_ENDPOINTS.ROOM_MESSAGES(roomId),
    data
  );
}

// ===== 스레드 (대화방) 관련 =====

/**
 * 채팅 스레드 목록 조회
 */
export async function getThreads(params?: GetThreadsParams): Promise<PaginatedResponse<ChatThread>> {
  return apiClient.get<PaginatedResponse<ChatThread>>(CHAT_ENDPOINTS.THREADS, { params });
}

/**
 * 채팅 스레드 상세 조회
 */
export async function getThread(threadId: string): Promise<ChatThread> {
  return apiClient.get<ChatThread>(CHAT_ENDPOINTS.THREAD_DETAIL(threadId));
}

/**
 * 채팅 스레드 생성
 */
export async function createThread(data: CreateThreadRequest): Promise<ChatThread> {
  return apiClient.post<ChatThread, CreateThreadRequest>(CHAT_ENDPOINTS.THREADS, data);
}

// ===== 메시지 관련 =====

/**
 * 메시지 목록 조회
 */
export async function getMessages(params: GetMessagesParams): Promise<PaginatedResponse<ChatMessage>> {
  const { threadId, ...restParams } = params;
  return apiClient.get<PaginatedResponse<ChatMessage>>(CHAT_ENDPOINTS.MESSAGES(threadId), {
    params: restParams,
  });
}

/**
 * 메시지 전송
 */
export async function sendMessage(data: SendMessageRequest): Promise<ChatMessage> {
  return apiClient.post<ChatMessage, SendMessageRequest>(
    CHAT_ENDPOINTS.SEND_MESSAGE(data.threadId),
    data
  );
}

/**
 * 메시지 읽음 처리
 */
export async function markAsRead(data: MarkAsReadRequest): Promise<MarkAsReadResponse> {
  return apiClient.post<MarkAsReadResponse, MarkAsReadRequest>(
    CHAT_ENDPOINTS.MARK_READ(data.threadId),
    data
  );
}

/**
 * 읽지 않은 채팅 메시지 수 조회
 */
export async function getUnreadCount(): Promise<{ count: number }> {
  return apiClient.get<{ count: number }>(CHAT_ENDPOINTS.UNREAD_COUNT);
}

/**
 * 채팅 스레드 핀 토글
 */
export async function pinThread(data: PinThreadRequest): Promise<PinThreadResponse> {
  return apiClient.post<PinThreadResponse, PinThreadRequest>(
    CHAT_ENDPOINTS.PIN_THREAD(data.threadId),
    data
  );
}

// ===== 공지사항 관련 =====

/**
 * 공지사항 목록 조회
 */
export async function getAnnouncements(params: GetAnnouncementsParams): Promise<AnnouncementsResponse> {
  const { roomId, page = 0, size = 10 } = params;
  return apiClient.get<AnnouncementsResponse>(
    CHAT_ENDPOINTS.ANNOUNCEMENTS(roomId),
    {
      params: { page, size },
    }
  );
}

/**
 * 공지사항 상세 조회
 */
export async function getAnnouncementDetail(roomId: number, announcementId: number): Promise<AnnouncementDetailResponse> {
  return apiClient.get<AnnouncementDetailResponse>(
    CHAT_ENDPOINTS.ANNOUNCEMENT_DETAIL(roomId, announcementId)
  );
}

/**
 * 채팅방 나가기
 */
export async function leaveRoom(roomId: number): Promise<void> {
  return apiClient.post<void>(CHAT_ENDPOINTS.LEAVE_ROOM(roomId));
}

/**
 * 채팅방 핀 고정
 */
export async function pinRoom(roomId: number): Promise<void> {
  return apiClient.post<void>(CHAT_ENDPOINTS.PIN_ROOM(roomId));
}

/**
 * 채팅방 핀 해제
 */
export async function unpinRoom(roomId: number): Promise<void> {
  return apiClient.delete<void>(CHAT_ENDPOINTS.PIN_ROOM(roomId));
}

/**
 * 채팅방 삭제 (폭파) - 방장 전용
 */
export async function deleteRoom(roomId: number): Promise<void> {
  return apiClient.delete<void>(CHAT_ENDPOINTS.DELETE_ROOM(roomId));
}

/**
 * 채팅방 알림 끄기/메시지 가리기
 */
export async function muteRoom(roomId: number): Promise<void> {
  return apiClient.post<void>(CHAT_ENDPOINTS.MUTE_ROOM(roomId));
}

/**
 * 채팅방 알림 켜기/메시지 보이기
 */
export async function unmuteRoom(roomId: number): Promise<void> {
  return apiClient.delete<void>(CHAT_ENDPOINTS.MUTE_ROOM(roomId));
}

/**
 * AI 작업 요청
 */
export async function requestAI(roomId: number, data: {
  command: string;
  messageLimit?: number;
  note?: string;
}): Promise<any> {
  return apiClient.post<any>(CHAT_ENDPOINTS.AI_JOB(roomId), data);
}

// ===== 메시지 관리 =====

/**
 * 메시지 숨기기
 */
export async function hideMessage(roomId: number, messageId: number): Promise<void> {
  return apiClient.post<void>(CHAT_ENDPOINTS.HIDE_MESSAGE(roomId, messageId));
}

/**
 * 메시지 숨김 해제
 */
export async function unhideMessage(roomId: number, messageId: number): Promise<void> {
  return apiClient.delete<void>(CHAT_ENDPOINTS.HIDE_MESSAGE(roomId, messageId));
}

/**
 * 메시지 삭제
 */
export async function deleteMessage(roomId: number, messageId: number): Promise<void> {
  return apiClient.delete<void>(CHAT_ENDPOINTS.DELETE_MESSAGE(roomId, messageId));
}

/**
 * 채팅 서비스 객체
 */
export const chatService = {
  // 채팅방 목록
  getRoomsOverview,
  getMyRooms,
  getRoomMessages,
  sendRoomMessage,
  createRoom,

  // 채팅방 관리
  leaveRoom,
  deleteRoom,
  pinRoom,
  unpinRoom,
  muteRoom,
  unmuteRoom,

  // AI 기능
  requestAI,

  // 스레드
  getThreads,
  getThread,
  createThread,

  // 메시지
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,

  // 핀 기능
  pinThread,

  // 공지사항
  getAnnouncements,
  getAnnouncementDetail,

  // 메시지 관리
  hideMessage,
  unhideMessage,
  deleteMessage,
};

export default chatService;
