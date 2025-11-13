/**
 * 채팅 관련 React Query 훅
 */

import { useQuery, useMutation, useQueryClient, UseMutationOptions, useInfiniteQuery } from "@tanstack/react-query";
import { chatService } from "@/services/chatService";
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
} from "@/types";

// ===== Query Keys =====
export const CHAT_QUERY_KEYS = {
  all: ["chat"] as const,
  roomsOverview: () => [...CHAT_QUERY_KEYS.all, "rooms-overview"] as const,
  myRooms: (page: number) => [...CHAT_QUERY_KEYS.all, "my-rooms", page] as const,
  roomMessages: (roomId: number) => [...CHAT_QUERY_KEYS.all, "room-messages", roomId] as const,
  threads: () => [...CHAT_QUERY_KEYS.all, "threads"] as const,
  threadList: (params?: GetThreadsParams) => [...CHAT_QUERY_KEYS.threads(), params] as const,
  threadDetail: (id: string) => [...CHAT_QUERY_KEYS.threads(), id] as const,
  messages: (threadId: string) => [...CHAT_QUERY_KEYS.all, "messages", threadId] as const,
  unreadCount: () => [...CHAT_QUERY_KEYS.all, "unread-count"] as const,
};

// ===== Queries =====

/**
 * 채팅방 Overview 조회 (myRooms + publicRooms)
 */
export function useRoomsOverview(params?: GetRoomsOverviewParams, options?: { enabled?: boolean }) {
  return useQuery<RoomsOverviewResponse>({
    queryKey: CHAT_QUERY_KEYS.roomsOverview(),
    queryFn: () => chatService.getRoomsOverview(params || {}),
    enabled: options?.enabled !== false,
  });
}

/**
 * 내 채팅방 목록 조회 (ChatDock용)
 */
export function useMyRooms(params?: GetMyRoomsParams, options?: { enabled?: boolean }) {
  return useQuery<MyRoomsResponse>({
    queryKey: CHAT_QUERY_KEYS.myRooms(params?.page || 0),
    queryFn: () => chatService.getMyRooms(params || {}),
    enabled: options?.enabled !== false,
  });
}

/**
 * 채팅방 메시지 조회
 */
export function useRoomMessages(params: GetRoomMessagesParams, options?: { enabled?: boolean }) {
  return useQuery<RoomMessagesResponse>({
    queryKey: CHAT_QUERY_KEYS.roomMessages(params.roomId),
    queryFn: () => chatService.getRoomMessages(params),
    enabled: options?.enabled !== false && !!params.roomId,
  });
}

/**
 * 채팅 스레드 목록 조회
 */
export function useThreads(params?: GetThreadsParams) {
  return useQuery<PaginatedResponse<ChatThread>>({
    queryKey: CHAT_QUERY_KEYS.threadList(params),
    queryFn: () => chatService.getThreads(params),
  });
}

/**
 * 채팅 스레드 상세 조회
 */
export function useThread(threadId: string, options?: { enabled?: boolean }) {
  return useQuery<ChatThread>({
    queryKey: CHAT_QUERY_KEYS.threadDetail(threadId),
    queryFn: () => chatService.getThread(threadId),
    enabled: options?.enabled !== false && !!threadId,
  });
}

/**
 * 메시지 목록 조회
 */
export function useMessages(params: GetMessagesParams, options?: { enabled?: boolean }) {
  return useQuery<PaginatedResponse<ChatMessage>>({
    queryKey: CHAT_QUERY_KEYS.messages(params.threadId),
    queryFn: () => chatService.getMessages(params),
    enabled: options?.enabled !== false && !!params.threadId,
  });
}

/**
 * 메시지 목록 무한 스크롤
 * - 이전 메시지를 계속 로드할 수 있음
 */
export function useInfiniteMessages(threadId: string, pageSize: number = 50) {
  return useInfiniteQuery<PaginatedResponse<ChatMessage>>({
    queryKey: CHAT_QUERY_KEYS.messages(threadId),
    queryFn: ({ pageParam }) =>
      chatService.getMessages({
        threadId,
        pageSize,
        before: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => {
      // 다음 페이지가 있으면 마지막 메시지의 createdAt 반환
      if (lastPage.meta.hasNext && lastPage.items.length > 0) {
        return lastPage.items[lastPage.items.length - 1].createdAt;
      }
      return undefined;
    },
    initialPageParam: undefined,
    enabled: !!threadId,
  });
}

/**
 * 읽지 않은 채팅 메시지 수 조회
 */
export function useUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: CHAT_QUERY_KEYS.unreadCount(),
    queryFn: () => chatService.getUnreadCount(),
    refetchInterval: 30000, // 30초마다 자동 갱신
  });
}

// ===== Mutations =====

/**
 * 채팅방 메시지 전송
 */
export function useSendRoomMessage(
  options?: UseMutationOptions<RoomMessage, Error, SendRoomMessageRequest, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<RoomMessage, Error, SendRoomMessageRequest, unknown>({
    ...options,
    mutationFn: chatService.sendRoomMessage,
    onSuccess: (data, variables, context) => {
      // 해당 채팅방의 메시지 목록 무효화
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.roomMessages(variables.roomId)
      });

      // 채팅방 목록 무효화 (lastMessage 업데이트)
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.roomsOverview()
      });
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.myRooms(0)
      });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 채팅 스레드 생성
 */
export function useCreateThread(
  options?: UseMutationOptions<ChatThread, Error, CreateThreadRequest, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<ChatThread, Error, CreateThreadRequest, unknown>({
    ...options,
    mutationFn: chatService.createThread,
    onSuccess: (data, variables, context) => {
      // 스레드 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.threads() });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 메시지 전송
 */
export function useSendMessage(
  options?: UseMutationOptions<
    ChatMessage,
    Error,
    SendMessageRequest,
    { previousMessages?: PaginatedResponse<ChatMessage> }
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    ChatMessage,
    Error,
    SendMessageRequest,
    { previousMessages?: PaginatedResponse<ChatMessage> }
  >({
    ...options,
    mutationFn: chatService.sendMessage,
    onMutate: async (newMessage) => {
      // 낙관적 업데이트: 즉시 UI에 메시지 추가
      const threadId = newMessage.threadId;
      const messagesKey = CHAT_QUERY_KEYS.messages(threadId);

      await queryClient.cancelQueries({ queryKey: messagesKey });

      const previousMessages = queryClient.getQueryData<PaginatedResponse<ChatMessage>>(messagesKey);

      // 임시 메시지 생성
      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        threadId,
        senderId: "me", // 현재 사용자 ID
        sender: {
          id: "me",
          nickname: "나",
        },
        content: newMessage.content,
        type: (newMessage.type || "TEXT") as any,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (previousMessages) {
        queryClient.setQueryData<PaginatedResponse<ChatMessage>>(messagesKey, {
          ...previousMessages,
          items: [...previousMessages.items, tempMessage],
        });
      }

      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      // 에러 시 롤백
      if (context?.previousMessages) {
        queryClient.setQueryData(
          CHAT_QUERY_KEYS.messages(newMessage.threadId),
          context.previousMessages
        );
      }
      if (options?.onError) {
        (options.onError as any)(err, newMessage, context);
      }
    },
    onSuccess: (data, variables, context) => {
      // 서버 응답으로 메시지 목록 업데이트
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(variables.threadId) });

      // 스레드 목록도 업데이트 (lastMessage 변경)
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.threads() });

      // 읽지 않은 메시지 수 갱신
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.unreadCount() });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 메시지 읽음 처리
 */
export function useMarkAsRead(
  options?: UseMutationOptions<MarkAsReadResponse, Error, MarkAsReadRequest, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<MarkAsReadResponse, Error, MarkAsReadRequest, unknown>({
    ...options,
    mutationFn: chatService.markAsRead,
    onSuccess: (data, variables, context) => {
      // 해당 스레드의 unreadCount 업데이트
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.threadDetail(variables.threadId) });

      // 스레드 목록도 업데이트
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.threads() });

      // 메시지 목록 업데이트 (isRead 상태 변경)
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(variables.threadId) });

      // 읽지 않은 메시지 수 갱신
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.unreadCount() });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 채팅 스레드 핀 토글
 */
export function usePinThread(
  options?: UseMutationOptions<PinThreadResponse, Error, PinThreadRequest, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<PinThreadResponse, Error, PinThreadRequest, unknown>({
    ...options,
    mutationFn: chatService.pinThread,
    onSuccess: (data, variables, context) => {
      // 스레드 목록 갱신 (정렬 순서 변경)
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.threads() });

      // 해당 스레드 상세도 업데이트
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.threadDetail(variables.threadId) });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}
