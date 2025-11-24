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
  CreateRoomRequest,
  CreateRoomResponse,
  AnnouncementsResponse,
  GetAnnouncementsParams,
  AnnouncementDetailResponse,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  Announcement,
  SchedulesResponse,
  GetSchedulesParams,
  Schedule,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  ScheduleParticipantsResponse,
  PollsResponse,
  GetPollsParams,
  Poll,
  CreatePollRequest,
  VoteRequest,
  PollResultsResponse,
} from "@/types";

// ===== Query Keys =====
export const CHAT_QUERY_KEYS = {
  all: ["chat"] as const,
  roomsOverview: () => [...CHAT_QUERY_KEYS.all, "rooms-overview"] as const,
  myRooms: (page: number) => [...CHAT_QUERY_KEYS.all, "my-rooms", page] as const,
  roomMessages: (roomId: number) => [...CHAT_QUERY_KEYS.all, "room-messages", roomId] as const,
  announcements: (roomId: number, page: number) => [...CHAT_QUERY_KEYS.all, "announcements", roomId, page] as const,
  announcementDetail: (roomId: number, announcementId: number) => [...CHAT_QUERY_KEYS.all, "announcement-detail", roomId, announcementId] as const,
  schedules: (roomId: number, page: number) => [...CHAT_QUERY_KEYS.all, "schedules", roomId, page] as const,
  scheduleDetail: (roomId: number, scheduleId: number) => [...CHAT_QUERY_KEYS.all, "schedule-detail", roomId, scheduleId] as const,
  scheduleParticipants: (roomId: number, scheduleId: number) => [...CHAT_QUERY_KEYS.all, "schedule-participants", roomId, scheduleId] as const,
  polls: (roomId: number, page: number) => [...CHAT_QUERY_KEYS.all, "polls", roomId, page] as const,
  pollDetail: (roomId: number, pollId: number) => [...CHAT_QUERY_KEYS.all, "poll-detail", roomId, pollId] as const,
  pollResults: (roomId: number, pollId: number) => [...CHAT_QUERY_KEYS.all, "poll-results", roomId, pollId] as const,
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

/**
 * 공지사항 목록 조회
 */
export function useAnnouncements(params: GetAnnouncementsParams, options?: { enabled?: boolean }) {
  return useQuery<AnnouncementsResponse>({
    queryKey: CHAT_QUERY_KEYS.announcements(params.roomId, params.page || 0),
    queryFn: () => chatService.getAnnouncements(params),
    enabled: options?.enabled !== false && !!params.roomId,
  });
}

/**
 * 공지사항 상세 조회
 */
export function useAnnouncementDetail(
  roomId: number,
  announcementId: number,
  options?: { enabled?: boolean }
) {
  return useQuery<AnnouncementDetailResponse>({
    queryKey: CHAT_QUERY_KEYS.announcementDetail(roomId, announcementId),
    queryFn: () => chatService.getAnnouncementDetail(roomId, announcementId),
    enabled: options?.enabled !== false && !!roomId && !!announcementId,
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

/**
 * 채팅방 생성
 */
export function useCreateRoom(
  options?: UseMutationOptions<CreateRoomResponse, Error, CreateRoomRequest, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<CreateRoomResponse, Error, CreateRoomRequest, unknown>({
    ...options,
    mutationFn: chatService.createRoom,
    onSuccess: (data, variables, context) => {
      // 채팅방 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.roomsOverview() });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.myRooms(0) });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 채팅방 참여
 */
export function useJoinRoom(
  options?: UseMutationOptions<void, Error, number, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, unknown>({
    ...options,
    mutationFn: chatService.joinRoom,
    onSuccess: (data, variables, context) => {
      // 채팅방 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.roomsOverview() });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.myRooms(0) });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 채팅방 나가기
 */
export function useLeaveRoom(
  options?: UseMutationOptions<void, Error, number, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, unknown>({
    ...options,
    mutationFn: chatService.leaveRoom,
    onSuccess: (data, variables, context) => {
      // 채팅방 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.roomsOverview() });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.myRooms(0) });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 채팅방 핀 고정
 */
export function usePinRoom(
  options?: UseMutationOptions<void, Error, number, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, unknown>({
    ...options,
    mutationFn: chatService.pinRoom,
    onSuccess: (data, variables, context) => {
      // 채팅방 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.roomsOverview() });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.myRooms(0) });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 채팅방 핀 해제
 */
export function useUnpinRoom(
  options?: UseMutationOptions<void, Error, number, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, unknown>({
    ...options,
    mutationFn: chatService.unpinRoom,
    onSuccess: (data, variables, context) => {
      // 채팅방 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.roomsOverview() });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.myRooms(0) });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 채팅방 삭제 (폭파) - 방장 전용
 */
export function useDeleteRoom(
  options?: UseMutationOptions<void, Error, number, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, unknown>({
    ...options,
    mutationFn: chatService.deleteRoom,
    onSuccess: (data, variables, context) => {
      // 채팅방 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.roomsOverview() });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.myRooms(0) });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 채팅방 알림 끄기/메시지 가리기
 */
export function useMuteRoom(
  options?: UseMutationOptions<void, Error, number, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, unknown>({
    ...options,
    mutationFn: chatService.muteRoom,
    onSuccess: (data, variables, context) => {
      // 채팅방 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.roomsOverview() });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.myRooms(0) });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 채팅방 알림 켜기/메시지 보이기
 */
export function useUnmuteRoom(
  options?: UseMutationOptions<void, Error, number, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, unknown>({
    ...options,
    mutationFn: chatService.unmuteRoom,
    onSuccess: (data, variables, context) => {
      // 채팅방 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.roomsOverview() });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.myRooms(0) });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * AI 작업 요청
 */
export function useRequestAI(
  options?: UseMutationOptions<any, Error, { roomId: number; command: string; messageLimit?: number; note?: string }, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { roomId: number; command: string; messageLimit?: number; note?: string }, unknown>({
    ...options,
    mutationFn: ({ roomId, ...data }) => chatService.requestAI(roomId, data),
    onSuccess: (data, variables, context) => {
      // 채팅방 메시지 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.roomMessages(variables.roomId) });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 메시지 숨기기
 */
export function useHideMessage(
  options?: UseMutationOptions<void, Error, { roomId: number; messageId: number }, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { roomId: number; messageId: number }, unknown>({
    ...options,
    mutationFn: ({ roomId, messageId }) => chatService.hideMessage(roomId, messageId),
    onSuccess: (data, variables, context) => {
      // 채팅방 메시지 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.roomMessages(variables.roomId) });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 메시지 숨김 해제
 */
export function useUnhideMessage(
  options?: UseMutationOptions<void, Error, { roomId: number; messageId: number }, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { roomId: number; messageId: number }, unknown>({
    ...options,
    mutationFn: ({ roomId, messageId }) => chatService.unhideMessage(roomId, messageId),
    onSuccess: (data, variables, context) => {
      // 채팅방 메시지 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.roomMessages(variables.roomId) });

      // 사용자 정의 onSuccess 실행
      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

// ===== 공지사항 관련 Mutations =====

/**
 * 공지사항 생성
 */
export function useCreateAnnouncement(
  options?: UseMutationOptions<Announcement, Error, { roomId: number; data: CreateAnnouncementRequest }, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<Announcement, Error, { roomId: number; data: CreateAnnouncementRequest }, unknown>({
    ...options,
    mutationFn: ({ roomId, data }) => chatService.createAnnouncement(roomId, data),
    onSuccess: (data, variables, context) => {
      // 공지사항 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.announcements(variables.roomId, 0) });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 공지사항 수정
 */
export function useUpdateAnnouncement(
  options?: UseMutationOptions<
    Announcement,
    Error,
    { roomId: number; announcementId: number; data: UpdateAnnouncementRequest },
    unknown
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    Announcement,
    Error,
    { roomId: number; announcementId: number; data: UpdateAnnouncementRequest },
    unknown
  >({
    ...options,
    mutationFn: ({ roomId, announcementId, data }) => chatService.updateAnnouncement(roomId, announcementId, data),
    onSuccess: (data, variables, context) => {
      // 공지사항 목록 및 상세 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.announcements(variables.roomId, 0) });
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.announcementDetail(variables.roomId, variables.announcementId),
      });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 공지사항 삭제
 */
export function useDeleteAnnouncement(
  options?: UseMutationOptions<void, Error, { roomId: number; announcementId: number }, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { roomId: number; announcementId: number }, unknown>({
    ...options,
    mutationFn: ({ roomId, announcementId }) => chatService.deleteAnnouncement(roomId, announcementId),
    onSuccess: (data, variables, context) => {
      // 공지사항 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.announcements(variables.roomId, 0) });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

// ===== 일정 관련 Queries =====

/**
 * 일정 목록 조회
 */
export function useSchedules(params: GetSchedulesParams, options?: { enabled?: boolean }) {
  return useQuery<SchedulesResponse>({
    queryKey: CHAT_QUERY_KEYS.schedules(params.roomId, params.page || 0),
    queryFn: () => chatService.getSchedules(params),
    enabled: options?.enabled !== false && !!params.roomId,
  });
}

/**
 * 일정 상세 조회
 */
export function useScheduleDetail(roomId: number, scheduleId: number, options?: { enabled?: boolean }) {
  return useQuery<Schedule>({
    queryKey: CHAT_QUERY_KEYS.scheduleDetail(roomId, scheduleId),
    queryFn: () => chatService.getScheduleDetail(roomId, scheduleId),
    enabled: options?.enabled !== false && !!roomId && !!scheduleId,
  });
}

/**
 * 일정 참여자 목록 조회
 */
export function useScheduleParticipants(roomId: number, scheduleId: number, options?: { enabled?: boolean }) {
  return useQuery<ScheduleParticipantsResponse>({
    queryKey: CHAT_QUERY_KEYS.scheduleParticipants(roomId, scheduleId),
    queryFn: () => chatService.getScheduleParticipants(roomId, scheduleId),
    enabled: options?.enabled !== false && !!roomId && !!scheduleId,
  });
}

// ===== 일정 관련 Mutations =====

/**
 * 일정 생성
 */
export function useCreateSchedule(
  options?: UseMutationOptions<Schedule, Error, { roomId: number; data: CreateScheduleRequest }, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<Schedule, Error, { roomId: number; data: CreateScheduleRequest }, unknown>({
    ...options,
    mutationFn: ({ roomId, data }) => chatService.createSchedule(roomId, data),
    onSuccess: (data, variables, context) => {
      // 일정 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.schedules(variables.roomId, 0) });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 일정 수정
 */
export function useUpdateSchedule(
  options?: UseMutationOptions<
    Schedule,
    Error,
    { roomId: number; scheduleId: number; data: UpdateScheduleRequest },
    unknown
  >
) {
  const queryClient = useQueryClient();

  return useMutation<Schedule, Error, { roomId: number; scheduleId: number; data: UpdateScheduleRequest }, unknown>({
    ...options,
    mutationFn: ({ roomId, scheduleId, data }) => chatService.updateSchedule(roomId, scheduleId, data),
    onSuccess: (data, variables, context) => {
      // 일정 목록 및 상세 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.schedules(variables.roomId, 0) });
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.scheduleDetail(variables.roomId, variables.scheduleId),
      });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 일정 삭제
 */
export function useDeleteSchedule(
  options?: UseMutationOptions<void, Error, { roomId: number; scheduleId: number }, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { roomId: number; scheduleId: number }, unknown>({
    ...options,
    mutationFn: ({ roomId, scheduleId }) => chatService.deleteSchedule(roomId, scheduleId),
    onSuccess: (data, variables, context) => {
      // 일정 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.schedules(variables.roomId, 0) });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 일정 참여 추가
 */
export function useAddScheduleParticipant(
  options?: UseMutationOptions<void, Error, { roomId: number; scheduleId: number }, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { roomId: number; scheduleId: number }, unknown>({
    ...options,
    mutationFn: ({ roomId, scheduleId }) => chatService.addScheduleParticipant(roomId, scheduleId),
    onSuccess: (data, variables, context) => {
      // 일정 참여자 목록 무효화
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.scheduleParticipants(variables.roomId, variables.scheduleId),
      });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 일정 참여 취소
 */
export function useRemoveScheduleParticipant(
  options?: UseMutationOptions<void, Error, { roomId: number; scheduleId: number }, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { roomId: number; scheduleId: number }, unknown>({
    ...options,
    mutationFn: ({ roomId, scheduleId }) => chatService.removeScheduleParticipant(roomId, scheduleId),
    onSuccess: (data, variables, context) => {
      // 일정 참여자 목록 무효화
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.scheduleParticipants(variables.roomId, variables.scheduleId),
      });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

// ===== 투표 관련 Queries =====

/**
 * 투표 목록 조회
 */
export function usePolls(params: GetPollsParams, options?: { enabled?: boolean }) {
  return useQuery<PollsResponse>({
    queryKey: CHAT_QUERY_KEYS.polls(params.roomId, params.page || 0),
    queryFn: () => chatService.getPolls(params),
    enabled: options?.enabled !== false && !!params.roomId,
  });
}

/**
 * 투표 상세 조회
 */
export function usePollDetail(roomId: number, pollId: number, options?: { enabled?: boolean }) {
  return useQuery<Poll>({
    queryKey: CHAT_QUERY_KEYS.pollDetail(roomId, pollId),
    queryFn: () => chatService.getPollDetail(roomId, pollId),
    enabled: options?.enabled !== false && !!roomId && !!pollId,
  });
}

/**
 * 투표 결과 조회
 */
export function usePollResults(roomId: number, pollId: number, options?: { enabled?: boolean }) {
  return useQuery<PollResultsResponse>({
    queryKey: CHAT_QUERY_KEYS.pollResults(roomId, pollId),
    queryFn: () => chatService.getPollResults(roomId, pollId),
    enabled: options?.enabled !== false && !!roomId && !!pollId,
  });
}

// ===== 투표 관련 Mutations =====

/**
 * 투표 생성
 */
export function useCreatePoll(
  options?: UseMutationOptions<Poll, Error, { roomId: number; data: CreatePollRequest }, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<Poll, Error, { roomId: number; data: CreatePollRequest }, unknown>({
    ...options,
    mutationFn: ({ roomId, data }) => chatService.createPoll(roomId, data),
    onSuccess: (data, variables, context) => {
      // 투표 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.polls(variables.roomId, 0) });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 투표 삭제
 */
export function useDeletePoll(options?: UseMutationOptions<void, Error, { roomId: number; pollId: number }, unknown>) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { roomId: number; pollId: number }, unknown>({
    ...options,
    mutationFn: ({ roomId, pollId }) => chatService.deletePoll(roomId, pollId),
    onSuccess: (data, variables, context) => {
      // 투표 목록 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.polls(variables.roomId, 0) });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}

/**
 * 투표 참여/수정
 */
export function useVote(
  options?: UseMutationOptions<void, Error, { roomId: number; pollId: number; data: VoteRequest }, unknown>
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { roomId: number; pollId: number; data: VoteRequest }, unknown>({
    ...options,
    mutationFn: ({ roomId, pollId, data }) => chatService.vote(roomId, pollId, data),
    onSuccess: (data, variables, context) => {
      // 투표 결과 무효화
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.pollResults(variables.roomId, variables.pollId) });
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.pollDetail(variables.roomId, variables.pollId) });

      if (options?.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
}
