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
} from "@/types";

// ===== 채팅방 목록 (백엔드 API) =====

/**
 * 채팅방 Overview 조회 (myRooms + publicRooms)
 */
export async function getRoomsOverview(params: GetRoomsOverviewParams): Promise<RoomsOverviewResponse> {
  return apiClient.get<RoomsOverviewResponse>(CHAT_ENDPOINTS.ROOMS_OVERVIEW, { params });
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

/**
 * 채팅 서비스 객체
 */
export const chatService = {
  // 채팅방 목록
  getRoomsOverview,

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
};

export default chatService;
