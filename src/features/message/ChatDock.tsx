import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { X, Minus, Send, Circle, Loader2, MessageCircle, Maximize2, Plus, Pin, Calendar, MoreVertical, Bell } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMyRooms, useSendRoomMessage, useRequestAI, useDeleteRoom, useMuteRoom, useUnmuteRoom, CHAT_QUERY_KEYS, useCreateRoom } from "@/hooks/api/useChat";
import { chatService } from "@/services/chatService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createEvent, CreateEventData } from "@/api/calendar";
import { useToast } from "@/components/Toast/ToastProvider";
import { useWebSocketManager } from "@/hooks/useWebSocketManager";
import type { WebSocketMessage } from "@/hooks/useWebSocket";
import AIDock from "@/features/ai/AIDock";
import NoticeDock from "@/features/notice/NoticeDock";
import "./ChatDock.css";
import { USER_QUERY_KEYS } from "@/hooks/api/useUser";
import { userService } from "@/services/userService";
import { extractUserIdFromToken } from "@/utils/auth";
import { AiCommandType, AiJobResponse } from "@/types";

/**
 * ChatDock — Facebook DM 스타일의 우측 고정 채팅 도크
 * - 페이지 우측에 항상 떠 있는 채팅 버튼/도크
 * - 스레드(대화방) 목록에서 클릭하면 작은 채팅 윈도우가 우측에 뜸 (동시 여러 개)
 * - 토큰 기반 색/테두리/라운드만 사용 (tokens.css)
 * - 소켓은 훅 분리 (useMockSocket / useSocket) — 백 준비 전에는 모킹으로 동작
 */



const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");

const AI_COMMAND_ALIASES: Record<string, AiCommandType> = {
  summary: "PUBLIC_SUMMARY",
  public_summary: "PUBLIC_SUMMARY",
  pubsum: "PUBLIC_SUMMARY",
  question: "GROUP_QUESTION_GENERATOR",
  questions: "GROUP_QUESTION_GENERATOR",
  q: "GROUP_QUESTION_GENERATOR",
  keypoints: "GROUP_KEYPOINTS",
  keypoint: "GROUP_KEYPOINTS",
  start: "SESSION_START",
  begin: "SESSION_START",
  end: "SESSION_END",
  finish: "SESSION_END",
  closing: "SESSION_CLOSING",
};

function resolveAiCommand(rawCommand: string): AiCommandType | null {
  const key = rawCommand.toLowerCase();
  return AI_COMMAND_ALIASES[key] || null;
}

function parseAiShortcut(aiContent: string): { command: AiCommandType; note?: string } {
  const [rawCommand, ...rest] = aiContent.split(/\s+/);
  const normalizedCommand = resolveAiCommand(rawCommand);

  if (normalizedCommand) {
    const note = rest.join(" ").trim();
    return { command: normalizedCommand, note: note || undefined };
  }

  const note = aiContent.trim();
  return { command: "PUBLIC_SUMMARY", note: note || undefined };
}

function formatAiPayload(payload: AiJobResponse["payload"]): string {
  if (!payload) {
    return "AI가 반환한 데이터가 없습니다.";
  }

  if (payload.fallback) {
    const reason = payload.reason ? ` (사유: ${payload.reason})` : "";
    return `컨텍스트가 충분하지 않습니다${reason}`;
  }

  if (typeof payload === "string") {
    return payload;
  }

  if ("summary" in payload && typeof payload.summary === "string") {
    return payload.summary;
  }

  if ("message" in payload && typeof payload.message === "string") {
    return payload.message;
  }

  return JSON.stringify(payload, null, 2);
}

function formatAiJobMessage(command: AiCommandType, response: AiJobResponse): string {
  const parts = [`[${command}] 상태: ${response.status}`];

  const payloadText = formatAiPayload(response.payload);
  if (payloadText) {
    parts.push(payloadText);
  }

  if (response.jobId) {
    parts.push(`jobId: ${response.jobId}`);
  }

  if (typeof response.latencyMs === "number") {
    parts.push(`지연 시간: ${response.latencyMs}ms`);
  }

  return parts.join("\n\n");
}

// ===== Types =====
export interface ChatUser {
  id: string;
  name: string;
  avatarUrl?: string;
  online?: boolean;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  /**
   * fromId: ChatDock 내부에서 예전부터 사용하던 발신자 식별자. 정렬/메뉴 노출 등 UI 판단이 이 값을 기준으로 이루어진다.
   * senderId: 백엔드가 내려주는 원본 키. 호환성 유지를 위해 둘 다 보유하며, 실제 렌더링에서는 fromId → senderId 순으로 확인한다.
   */
  fromId: string;
  senderId?: string;
  text: string;
  createdAt: number; // epoch ms
  senderNickname?: string; // 발신자 닉네임
  senderRole?: string; // 발신자 역할
}

export type ChatCategory = "DIRECT" | "GROUP" | "MEETING";

export interface ChatThread {
  id: string;
  users: ChatUser[]; // participants
  lastMessage?: ChatMessage;
  unreadCount?: number;
  category: ChatCategory; // 1:1, 단체, 모임
  isPinned?: boolean; // 상단 고정 여부
  joined?: boolean; // 참여 여부 (공개 채팅방용)
}

// ===== Chat window =====
function Avatar({ user, size = 24 }: { user: ChatUser; size?: number }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border border-[color:var(--chatdock-border-subtle)]"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-[color:var(--chatdock-bg-elev-2)] border border-[color:var(--chatdock-border-subtle)] grid place-items-center text-[10px] text-[color:var(--chatdock-fg-muted)]"
      aria-label={user.name}
    >
      {user.name?.[0] ?? "U"}
    </div>
  );
}

function ThreadChip({
  thread,
  onOpen,
  onTogglePin
}: {
  thread: ChatThread;
  onOpen: (t: ChatThread) => void;
  onTogglePin?: (threadId: string) => void;
}) {
  const title = thread.users.map((u) => u.name).join(", ");
  const unread = Math.min(99, thread.unreadCount || 0);

  return (
    <div className="relative w-full flex items-center gap-2 p-2 rounded-[var(--radius-md)] hover:bg-[color:var(--chatdock-bg-hover)] text-left group">
      <button
        onClick={() => onOpen(thread)}
        className="flex items-center gap-2 flex-1 min-w-0"
        title={title}
      >
        <div className="relative">
          <Avatar user={thread.users[0]} />
          {thread.users[0]?.online && (
            <Circle className="absolute -right-1 -bottom-1 w-3 h-3" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate text-[color:var(--chatdock-fg-primary)] flex items-center gap-1">
            {thread.isPinned && (
              <Pin className="w-3 h-3 text-[color:var(--color-accent)] fill-[color:var(--color-accent)]" />
            )}
            {title}
          </div>
          {thread.lastMessage && (
            <div className="text-xs text-[color:var(--chatdock-fg-muted)] truncate">
              {thread.lastMessage.text}
            </div>
          )}
        </div>
      </button>

      <div className="flex items-center gap-1">
        {unread > 0 && (
          <span className="min-w-5 h-5 px-1 grid place-items-center rounded-full text-[10px] font-bold bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]">
            {unread}
          </span>
        )}
        {onTogglePin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(thread.id);
            }}
            className="w-6 h-6 grid place-items-center rounded-[var(--radius-sm)] hover:bg-[color:var(--chatdock-bg-elev-2)] opacity-0 group-hover:opacity-100 transition-opacity"
            title={thread.isPinned ? "핀 해제" : "상단 고정"}
          >
            <Pin
              className={cls(
                "w-3.5 h-3.5",
                thread.isPinned
                  ? "text-[color:var(--color-accent)] fill-[color:var(--color-accent)]"
                  : "text-[color:var(--chatdock-fg-muted)]"
              )}
            />
          </button>
        )}
      </div>
    </div>
  );
}

function ChatWindow({
                      me,
                      thread,
                      messages,
                      typingUserIds = [],
                      onClose,
                      onMinimize,
                      onSend,
                      onRequestAI,
                      onDeleteRoom,
                      onMuteRoom,
                      onUnmuteRoom,
                      __onDragStart,
                      __onResizeStart,
                      width = 320,
                      height = 420,
                      roomId,
                      isOwner = false,
                      isMuted = false,
                      currentUserIdNumber,
                    }: {
  me: ChatUser;
  thread: ChatThread;
  messages: ChatMessage[];
  typingUserIds?: string[];
  onClose: () => void;
  onMinimize: () => void;
  onSend: (text: string) => void;
  onRequestAI?: (command: AiCommandType, note?: string) => void;
  onDeleteRoom?: () => void;
  onMuteRoom?: () => void;
  onUnmuteRoom?: () => void;
  __onDragStart?: (e: React.PointerEvent) => void;
  __onResizeStart?: (direction: string, e: React.PointerEvent) => void;
  width?: number;
  height?: number;
  roomId?: number;
  isOwner?: boolean;
  isMuted?: boolean;
  currentUserIdNumber?: number | null;
}) {
  const [text, setText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAIDockOpen, setIsAIDockOpen] = useState(false);
  const [isNoticeDockOpen, setIsNoticeDockOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 메시지별 메뉴 관련 상태
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set());
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);
  const [aiSessionStart, setAiSessionStart] = useState<string | null>(null);
  const [aiSessionEnd, setAiSessionEnd] = useState<string | null>(null);
  const messageMenuRef = useRef<HTMLDivElement>(null);
  type SelectedProfile = {
    userId?: number;
    nickname?: string;
    role?: string;
  };
  const [selectedProfileMessageId, setSelectedProfileMessageId] = useState<string | null>(null);
  const selectedProfile = useMemo<SelectedProfile | null>(() => {
    const message = messages.find((m) => m.id === selectedProfileMessageId);
    if (!message) return null;

    const rawSenderId = message.senderId ?? message.fromId;
    const numericId = rawSenderId ? Number(rawSenderId) : undefined;

    return {
      userId: numericId && !Number.isNaN(numericId) ? numericId : undefined,
      nickname: message.senderNickname,
      role: message.senderRole,
    };
  }, [messages, selectedProfileMessageId]);

  useEffect(() => {
    if (selectedProfileMessageId && !selectedProfile) {
      setSelectedProfileMessageId(null);
    }
  }, [selectedProfile, selectedProfileMessageId]);

  useEffect(() => {
    setSelectedProfileMessageId(null);
  }, [roomId, thread.id]);

  const toast = useToast();

  const createRoomMutation = useCreateRoom({
    onSuccess: (data) => {
      toast.show({
        title: "1:1 채팅방을 생성했습니다.",
        description: data.name,
        variant: "success",
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || "채팅방 생성에 실패했습니다.";
      toast.show({ title: message, variant: "error" });
    },
  });

  const [newEvent, setNewEvent] = useState<CreateEventData>({
    title: "",
    description: "",
    location: "",
    startsAt: "",
    endsAt: "",
    allDay: false,
  });

  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [messages]);

  // 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (messageMenuRef.current && !messageMenuRef.current.contains(event.target as Node)) {
        setMessageMenuOpen(null);
      }
    };

    if (isMenuOpen || messageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, messageMenuOpen]);

  const handleSenderProfileClick = (message: ChatMessage) => {
    if (selectedProfileMessageId === message.id) {
      setSelectedProfileMessageId(null);
      return;
    }

    setSelectedProfileMessageId(message.id);
  };

  const handleCreateDirectRoom = (targetUserId: number | undefined, nickname?: string) => {
    if (!currentUserIdNumber) {
      toast.show({ title: "로그인이 필요합니다.", variant: "warning" });
      return;
    }

    if (!targetUserId) {
      toast.show({ title: "1:1 채팅을 만들 수 있는 사용자 정보가 없습니다.", variant: "warning" });
      return;
    }

    createRoomMutation.mutate({
      scope: "PRIVATE",
      name: `${nickname ?? "사용자"}님과의 채팅`,
      description: "1:1 채팅방",
      memberIds: [currentUserIdNumber, targetUserId],
    });
  };

  const handleOpenEventModal = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}T09:00`;

    setNewEvent({
      title: "",
      description: "",
      location: "",
      startsAt: todayStr,
      endsAt: todayStr,
      allDay: false,
    });
    setIsEventModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.startsAt || !newEvent.endsAt) {
      alert("제목, 시작 시간, 종료 시간은 필수입니다.");
      return;
    }

    try {
      const eventData = {
        ...newEvent,
        startsAt: newEvent.startsAt.length === 16 ? `${newEvent.startsAt}:00` : newEvent.startsAt,
        endsAt: newEvent.endsAt.length === 16 ? `${newEvent.endsAt}:00` : newEvent.endsAt,
      };

      await createEvent(eventData);
      alert("일정이 추가되었습니다.");
      setIsEventModalOpen(false);
    } catch (error: any) {
      console.error("일정 추가 실패:", error);
      if (error.response?.status === 404) {
        alert("권한이 없습니다. 일정을 추가할 수 없습니다.");
      } else {
        alert("일정 추가에 실패했습니다.");
      }
    }
  };

  const title = thread.users.map((u) => u.name).join(", ");

  return (
    <div
      className="flex flex-col overflow-hidden relative
             rounded-[var(--radius-lg)]
             bg-[color:var(--chatdock-bg-elev-2)]
             border border-[color:var(--chatdock-border-strong)]
             shadow-xl"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* header */}
      <div className="h-11 flex items-center gap-2 px-2 border-b border-[color:var(--chatdock-border-subtle)] cursor-move select-none"
        onPointerDown={__onDragStart}
      >
        <Avatar user={thread.users[0]} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{title}</div>
          <div className="text-[10px] text-[color:var(--chatdock-fg-muted)] truncate">
            {typingUserIds.length > 0 ? "입력 중…" : "대화 중"}
          </div>
        </div>
        {/* 메뉴 버튼 - 투명도 추가 */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-[color:var(--chatdock-bg-hover)] opacity-60 hover:opacity-100 transition-opacity"
            title="메뉴"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {/* 메뉴 드롭다운 */}
          {isMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-80 rounded-[var(--radius-md)] border border-[color:var(--chatdock-border-subtle)] bg-[color:var(--chatdock-bg-elev-1)] shadow-lg overflow-hidden z-50">
              {/* AI 명령어 섹션 */}
              <div className="border-b border-[color:var(--chatdock-border-subtle)] py-1">
                <div className="px-3 py-1 text-xs text-[color:var(--chatdock-fg-muted)] font-semibold">
                  AI 명령
                </div>
                <button
                  onClick={() => {
                    const note = prompt("요약과 함께 궁금한 점을 입력하세요 (선택 사항)") || undefined;
                    onRequestAI?.("PUBLIC_SUMMARY", note);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  공개 대화 요약
                </button>
                <button
                  onClick={() => {
                    onRequestAI?.("GROUP_KEYPOINTS", undefined);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  토론 요점 정리
                </button>
                <button
                  onClick={() => {
                    onRequestAI?.("GROUP_QUESTION_GENERATOR", undefined);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  추가 질문 제안
                </button>
                {isOwner && (
                  <>
                    <button
                      onClick={() => {
                        onRequestAI?.("SESSION_START", undefined);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      세션 시작
                    </button>
                    <button
                      onClick={() => {
                        onRequestAI?.("SESSION_END", undefined);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      세션 종료
                    </button>
                    <button
                      onClick={() => {
                        onRequestAI?.("SESSION_CLOSING", undefined);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      마감문 생성
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setIsAIDockOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  AI 기능창 열기
                </button>
              </div>

              {/* 일반 기능 섹션 */}
              <div className="border-b border-[color:var(--chatdock-border-subtle)] py-1">
                <button
                  onClick={handleOpenEventModal}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                >
                  <Calendar className="w-4 h-4" />
                  일정 추가
                </button>
                <button
                  onClick={() => {
                    setIsNoticeDockOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                >
                  <Bell className="w-4 h-4" />
                  공지 목록 조회
                </button>
                <button
                  onClick={() => {
                    if (isMuted) {
                      onUnmuteRoom?.();
                    } else {
                      onMuteRoom?.();
                    }
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                >
                  <Bell className="w-4 h-4" />
                  {isMuted ? "메시지 보이기" : "메시지 가리기"}
                </button>
              </div>

              {/* 방장 전용 기능 섹션 */}
              {isOwner && (
                <div className="py-1">
                  <div className="px-3 py-1 text-xs text-[color:var(--chatdock-fg-muted)] font-semibold">
                    방장 전용
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("정말로 채팅방을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                        onDeleteRoom?.();
                        setIsMenuOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--color-error)]/10 text-left text-sm text-[color:var(--color-error)]"
                  >
                    <X className="w-4 h-4" />
                    방 폭파
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <button onClick={onMinimize} className="w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-[color:var(--chatdock-bg-hover)]" title="최소화">
          <Minus className="w-4 h-4" />
        </button>
        <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-[color:var(--chatdock-bg-hover)]" title="닫기">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* body */}
      <div ref={boxRef} className="flex-1 overflow-auto p-3 space-y-2">
        {messages.map((m) => {
          const senderId = (m.fromId ?? m.senderId)?.toString();
          const mine = senderId === me.id?.toString();
          const isHidden = hiddenMessageIds.has(m.id);
          const isAISessionStart = aiSessionStart === m.id;
          const isAISessionEnd = aiSessionEnd === m.id;
          const isProfileOpen = selectedProfileMessageId === m.id;
          const profile = isProfileOpen ? selectedProfile : null;

          return (
            <div key={m.id} className="relative group">
              {/* AI 세션 시작 마커 */}
              {isAISessionStart && (
                <div className="flex items-center gap-2 mb-1 text-xs text-[color:var(--color-primary)]">
                  <div className="h-px flex-1 bg-[color:var(--color-primary)]/30" />
                  <span className="font-semibold">AI 세션 시작</span>
                  <div className="h-px flex-1 bg-[color:var(--color-primary)]/30" />
                </div>
              )}

              <div className={cls("flex items-start gap-1 w-full", mine ? "justify-end" : "justify-start")}> 
                {mine ? (
                  <>
                    {/* 메시지 메뉴 버튼 (왼쪽) */}
                    <div className="relative" ref={messageMenuOpen === m.id ? messageMenuRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMessageMenuOpen(messageMenuOpen === m.id ? null : m.id);
                        }}
                        className={cls(
                          "w-6 h-6 grid place-items-center rounded-[var(--radius-sm)] hover:bg-[color:var(--chatdock-bg-hover)] transition-opacity",
                          messageMenuOpen === m.id ? "opacity-100" : "opacity-0 group-hover:opacity-60 hover:!opacity-100"
                        )}
                        title="메시지 메뉴"
                      >
                        <MoreVertical className="w-3.5 h-3.5 text-[color:var(--chatdock-fg-muted)]" />
                      </button>

                      {messageMenuOpen === m.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 rounded-[var(--radius-md)] border border-[color:var(--chatdock-border-subtle)] bg-[color:var(--chatdock-bg-elev-1)] shadow-lg overflow-hidden z-50">
                          <button
                            onClick={() => {
                              setHiddenMessageIds(prev => {
                                const next = new Set(prev);
                                if (next.has(m.id)) {
                                  next.delete(m.id);
                                } else {
                                  next.add(m.id);
                                }
                                return next;
                              });
                              setMessageMenuOpen(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                          >
                            {isHidden ? "메시지 보이기" : "메시지 가리기"}
                          </button>

                          {isOwner && (
                            <>
                              <div className="h-px bg-[color:var(--chatdock-border-subtle)] my-1" />
                              <button
                                onClick={() => {
                                  setAiSessionStart(aiSessionStart === m.id ? null : m.id);
                                  if (aiSessionStart === m.id) {
                                    setAiSessionEnd(null);
                                  }
                                  setMessageMenuOpen(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm text-[color:var(--color-primary)]"
                              >
                                {aiSessionStart === m.id ? "✓ AI 세션 시작" : "AI 세션 시작 설정"}
                              </button>
                              <button
                                onClick={() => {
                                  setAiSessionEnd(aiSessionEnd === m.id ? null : m.id);
                                  setMessageMenuOpen(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm text-[color:var(--color-primary)]"
                                disabled={!aiSessionStart}
                              >
                                {aiSessionEnd === m.id ? "✓ AI 세션 끝" : "AI 세션 끝 설정"}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 메시지 버블 (오른쪽) */}
                    <div className={cls(
                      "max-w-[75%] px-3 py-2 rounded-[var(--radius-lg)] transition-opacity",
                      "bg-[color:var(--color-accent)] text-[color:var(--chatdock-on-accent)]",
                      isHidden && "opacity-30 blur-sm"
                    )}>
                      <div className="text-sm leading-snug whitespace-pre-wrap break-words">
                        {isHidden ? "가려진 메시지" : m.text}
                      </div>
                      <div className="mt-1 text-[10px] opacity-80">
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* 메시지 버블 (왼쪽) */}
                    <div className={cls(
                      "max-w-[75%] px-3 py-2 rounded-[var(--radius-lg)] transition-opacity",
                      "bg-[color:var(--chatdock-bg-elev-1)] text-[color:var(--chatdock-fg-primary)]",
                      isHidden && "opacity-30 blur-sm"
                    )}>
                      {(
                        <button
                          type="button"
                          onClick={() => handleSenderProfileClick(m)}
                          className="text-[10px] font-semibold mb-1 opacity-80 underline-offset-2 hover:underline"
                        >
                          {m.senderNickname || "알 수 없는 사용자"}
                        </button>
                      )}
                      <div className="text-sm leading-snug whitespace-pre-wrap break-words">
                        {isHidden ? "가려진 메시지" : m.text}
                      </div>
                      <div className="mt-1 text-[10px] text-[color:var(--chatdock-fg-muted)]">
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </div>
                    </div>

                    {/* 메시지 메뉴 버튼 (오른쪽) */}
                    <div className="relative" ref={messageMenuOpen === m.id ? messageMenuRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMessageMenuOpen(messageMenuOpen === m.id ? null : m.id);
                        }}
                        className={cls(
                          "w-6 h-6 grid place-items-center rounded-[var(--radius-sm)] hover:bg-[color:var(--chatdock-bg-hover)] transition-opacity",
                          messageMenuOpen === m.id ? "opacity-100" : "opacity-0 group-hover:opacity-60 hover:!opacity-100"
                        )}
                        title="메시지 메뉴"
                      >
                        <MoreVertical className="w-3.5 h-3.5 text-[color:var(--chatdock-fg-muted)]" />
                      </button>

                      {messageMenuOpen === m.id && (
                        <div className="absolute left-0 top-full mt-1 w-48 rounded-[var(--radius-md)] border border-[color:var(--chatdock-border-subtle)] bg-[color:var(--chatdock-bg-elev-1)] shadow-lg overflow-hidden z-50">
                          <button
                            onClick={() => {
                              setHiddenMessageIds(prev => {
                                const next = new Set(prev);
                                if (next.has(m.id)) {
                                  next.delete(m.id);
                                } else {
                                  next.add(m.id);
                                }
                                return next;
                              });
                              setMessageMenuOpen(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                          >
                            {isHidden ? "메시지 보이기" : "메시지 가리기"}
                          </button>

                          {isOwner && (
                            <>
                              <div className="h-px bg-[color:var(--chatdock-border-subtle)] my-1" />
                              <button
                                onClick={() => {
                                  setAiSessionStart(aiSessionStart === m.id ? null : m.id);
                                  if (aiSessionStart === m.id) {
                                    setAiSessionEnd(null);
                                  }
                                  setMessageMenuOpen(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm text-[color:var(--color-primary)]"
                              >
                                {aiSessionStart === m.id ? "✓ AI 세션 시작" : "AI 세션 시작 설정"}
                              </button>
                              <button
                                onClick={() => {
                                  setAiSessionEnd(aiSessionEnd === m.id ? null : m.id);
                                  setMessageMenuOpen(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm text-[color:var(--color-primary)]"
                                disabled={!aiSessionStart}
                              >
                                {aiSessionEnd === m.id ? "✓ AI 세션 끝" : "AI 세션 끝 설정"}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {isProfileOpen && (
                <div className="mt-2 p-3 rounded-[var(--radius-md)] border border-[color:var(--chatdock-border-subtle)] bg-[color:var(--chatdock-bg-elev-1)] text-[color:var(--chatdock-fg-primary)] space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{profile?.nickname ?? "사용자 정보"}</div>
                      <div className="text-xs text-[color:var(--chatdock-fg-muted)]">
                        {profile?.role ? `권한: ${profile.role}` : "권한 정보 없음"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProfileMessageId(null)}
                      className="w-7 h-7 grid place-items-center rounded-[var(--radius-sm)] border border-[color:var(--chatdock-border-subtle)] hover:bg-[color:var(--chatdock-bg-hover)] text-[color:var(--chatdock-fg-muted)]"
                      aria-label="프로필 카드 닫기"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-sm space-y-1 text-[color:var(--chatdock-fg-primary)]">
                    <div>닉네임: {profile?.nickname ?? "알 수 없음"}</div>
                    <div>권한: {profile?.role ?? "정보 없음"}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => profile?.userId && handleCreateDirectRoom(profile.userId, profile.nickname)}
                      disabled={!profile?.userId || createRoomMutation.isPending || !currentUserIdNumber}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-[color:var(--on-primary)] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    >
                      <span>💬</span>
                      <span>{createRoomMutation.isPending ? "채팅방 생성 중..." : "1:1 채팅방 만들기"}</span>
                    </button>
                    {!currentUserIdNumber && (
                      <span className="text-xs text-[color:var(--chatdock-fg-muted)]">로그인 후 생성할 수 있습니다.</span>
                    )}
                  </div>
                </div>
              )}

              {/* AI 세션 끝 마커 */}
              {isAISessionEnd && (
                <div className="flex items-center gap-2 mt-1 text-xs text-[color:var(--color-primary)]">
                  <div className="h-px flex-1 bg-[color:var(--color-primary)]/30" />
                  <span className="font-semibold">AI 세션 끝</span>
                  <div className="h-px flex-1 bg-[color:var(--color-primary)]/30" />
                </div>
              )}
            </div>
          );
        })}
        {typingUserIds.length > 0 && (
          <div className="inline-flex items-center gap-2 text-[color:var(--chatdock-fg-muted)] text-xs">
            <Loader2 className="w-3 h-3 animate-spin" /> 입력 중…
          </div>
        )}
      </div>

      {/* input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const v = text.trim();
          if (!v) return;
          onSend(v);
          setText("");
        }}
        className="p-2 border-t border-[color:var(--chatdock-border-subtle)] bg-[color:var(--chatdock-bg-elev-1)]"
      >
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="flex-1 h-9 px-3 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-2)] border border-[color:var(--chatdock-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/40"
          />
          <button type="submit" className="h-9 px-3 rounded-[var(--radius-md)] border border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-[color:var(--on-primary)] inline-flex items-center gap-1">
            <Send className="w-4 h-4" />
            보내기
          </button>
        </div>
      </form>

      {/* 리사이즈 핸들 - 8방향 */}
      {__onResizeStart && (
        <>
          {/* 모서리 4개 */}
          <div
            onPointerDown={(e) => __onResizeStart('nw', e)}
            className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
            style={{ touchAction: 'none' }}
          />
          <div
            onPointerDown={(e) => __onResizeStart('ne', e)}
            className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
            style={{ touchAction: 'none' }}
          />
          <div
            onPointerDown={(e) => __onResizeStart('sw', e)}
            className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
            style={{ touchAction: 'none' }}
          />
          <div
            onPointerDown={(e) => __onResizeStart('se', e)}
            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
            style={{ touchAction: 'none' }}
          />

          {/* 변 4개 */}
          <div
            onPointerDown={(e) => __onResizeStart('n', e)}
            className="absolute top-0 left-3 right-3 h-1 cursor-n-resize"
            style={{ touchAction: 'none' }}
          />
          <div
            onPointerDown={(e) => __onResizeStart('s', e)}
            className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize"
            style={{ touchAction: 'none' }}
          />
          <div
            onPointerDown={(e) => __onResizeStart('w', e)}
            className="absolute top-3 bottom-3 left-0 w-1 cursor-w-resize"
            style={{ touchAction: 'none' }}
          />
          <div
            onPointerDown={(e) => __onResizeStart('e', e)}
            className="absolute top-3 bottom-3 right-0 w-1 cursor-e-resize"
            style={{ touchAction: 'none' }}
          />
        </>
      )}

      {/* 일정 추가 모달 */}
      {isEventModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
          onClick={() => setIsEventModalOpen(false)}
        >
          <div
            className="bg-[color:var(--chatdock-bg-elev-1)] p-6 rounded-[var(--radius-lg)] shadow-lg max-w-md w-full mx-4 border border-[color:var(--chatdock-border-subtle)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-[color:var(--chatdock-fg-primary)]">
              새 일정 추가
            </h3>

            <div className="space-y-3">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-semibold mb-1 text-[color:var(--chatdock-fg-primary)]">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[color:var(--chatdock-border-subtle)] bg-[color:var(--chatdock-bg-elev-2)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
                  placeholder="일정 제목을 입력하세요"
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-semibold mb-1 text-[color:var(--chatdock-fg-primary)]">
                  설명
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[color:var(--chatdock-border-subtle)] bg-[color:var(--chatdock-bg-elev-2)] resize-none focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
                  placeholder="일정 설명을 입력하세요"
                  rows={3}
                />
              </div>

              {/* 장소 */}
              <div>
                <label className="block text-sm font-semibold mb-1 text-[color:var(--chatdock-fg-primary)]">
                  장소
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[color:var(--chatdock-border-subtle)] bg-[color:var(--chatdock-bg-elev-2)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
                  placeholder="예: 집 앞 카페"
                />
              </div>

              {/* 종일 일정 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newEvent.allDay}
                  onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-semibold text-[color:var(--chatdock-fg-primary)]">
                  종일 일정
                </label>
              </div>

              {/* 시작 시간 */}
              <div>
                <label className="block text-sm font-semibold mb-1 text-[color:var(--chatdock-fg-primary)]">
                  시작 시간 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.startsAt}
                  onChange={(e) => setNewEvent({ ...newEvent, startsAt: e.target.value })}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[color:var(--chatdock-border-subtle)] bg-[color:var(--chatdock-bg-elev-2)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
                  disabled={newEvent.allDay}
                />
              </div>

              {/* 종료 시간 */}
              <div>
                <label className="block text-sm font-semibold mb-1 text-[color:var(--chatdock-fg-primary)]">
                  종료 시간 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={newEvent.endsAt}
                  onChange={(e) => setNewEvent({ ...newEvent, endsAt: e.target.value })}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[color:var(--chatdock-border-subtle)] bg-[color:var(--chatdock-bg-elev-2)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
                  disabled={newEvent.allDay}
                />
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="flex-1 px-4 py-2 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-hover)] hover:opacity-80 transition font-semibold text-[color:var(--chatdock-fg-primary)]"
              >
                취소
              </button>
              <button
                onClick={handleAddEvent}
                className="flex-1 px-4 py-2 rounded-[var(--radius-md)] bg-[color:var(--color-primary)] text-[color:var(--on-primary)] hover:opacity-80 transition font-semibold"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Dock */}
      <AIDock
        isOpen={isAIDockOpen}
        onClose={() => setIsAIDockOpen(false)}
        onMinimize={() => setIsAIDockOpen(false)}
      />

      {/* Notice Dock */}
      <NoticeDock
        isOpen={isNoticeDockOpen}
        onClose={() => setIsNoticeDockOpen(false)}
        onMinimize={() => setIsNoticeDockOpen(false)}
        hasPermission={false} // TODO: 실제 권한 체크 로직 추가
        roomId={Number(thread.id)}
      />
    </div>
  );
}

// ===== Dock (collapsed icon that expands on hover/click) =====
export default function ChatDock() {
  const navigate = useNavigate();
  const { openThreadIds, minimizedThreadIds, openThread: openThreadInContext, closeThread: closeThreadInContext, minimizeThread: minimizeThreadInContext, restoreThread } = useChatContext();
  const { user, accessToken } = useAuth();
  const toast = useToast();

  const [zMap, setZMap] = useState<Record<string, number>>({});
  const zSeed = useRef(100); // 창 기본 z-index 기준보다 크게

  const { data: myPage } = useQuery({
    queryKey: USER_QUERY_KEYS.myPage(),
    queryFn: userService.getMyPage,
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  });

  const bringToFront = (id: string) => {
    zSeed.current += 1;
    setZMap(prev => ({ ...prev, [id]: zSeed.current }));
  };

  // User data
  const tokenUserId = useMemo(() => extractUserIdFromToken(accessToken), [accessToken]);

  const myUserId = myPage?.userId ? myPage.userId.toString() : tokenUserId;
  const myUserIdNumber = useMemo(() => (myUserId ? Number(myUserId) : null), [myUserId]);
  const me: ChatUser = {
    id: myUserId || "me",
    name: myPage?.nickname || user?.name || user?.email || "나",
    avatarUrl: "",
  };

  // React Query client
  const queryClient = useQueryClient();

  // 채팅방 목록 API 연결 (로그인된 경우에만)
  const { data: myRoomsData, isLoading: _isLoadingRooms } = useMyRooms(
    { page: 0, size: 20 },
    { enabled: !!user }
  );

  // 메시지 전송 mutation
  const sendMessageMutation = useSendRoomMessage();

  // AI 요청 mutation
  const requestAIMutation = useRequestAI({
    onSuccess: (data, variables) => {
      // AI 응답을 채팅 메시지로 표시
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        threadId: variables.roomId.toString(),
        fromId: "ai",
        senderId: "ai",
        text: formatAiJobMessage(variables.command, data),
        createdAt: Date.now(),
      };

      setMessages((prev) => ({
        ...prev,
        [variables.roomId.toString()]: [...(prev[variables.roomId.toString()] || []), aiMessage],
      }));

      toast.show({ title: "AI 작업이 완료되었습니다.", variant: "success" });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "AI 요청에 실패했습니다.";
      toast.show({ title: errorMessage, variant: "error" });
    },
  });

  // 방 삭제 mutation
  const deleteRoomMutation = useDeleteRoom({
    onSuccess: (data, roomId) => {
      toast.show({ title: "채팅방이 삭제되었습니다.", variant: "success" });
      // 삭제된 방 닫기
      closeThreadInContext(roomId.toString());
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "채팅방 삭제에 실패했습니다.";
      toast.show({ title: errorMessage, variant: "error" });
    },
  });

  // 방 알림 끄기 mutation
  const muteRoomMutation = useMuteRoom({
    onSuccess: () => {
      toast.show({ title: "채팅방 알림을 껐습니다.", variant: "success" });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "알림 끄기에 실패했습니다.";
      toast.show({ title: errorMessage, variant: "error" });
    },
  });

  // 방 알림 켜기 mutation
  const unmuteRoomMutation = useUnmuteRoom({
    onSuccess: () => {
      toast.show({ title: "채팅방 알림을 켰습니다.", variant: "success" });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "알림 켜기에 실패했습니다.";
      toast.show({ title: errorMessage, variant: "error" });
    },
  });

  // 백엔드 응답을 UI 형식으로 변환
  const threads = useMemo(() => {
    if (!myRoomsData) return [];

    return myRoomsData.items.map((room) => {
      const threadId = room.roomId.toString();
      // 채팅방이 열려있으면 (focus 상태) unreadCount를 0으로 설정
      const isOpen = openThreadIds.includes(threadId);

      return {
        id: threadId,
        users: [{ id: "unknown", name: room.name }],
        category: "GROUP" as ChatCategory, // 임시: 실제로는 백엔드에서 카테고리 받아야 함
        unreadCount: isOpen ? 0 : room.unreadCount,
        isPinned: room.pinned,
        lastMessage: room.lastMsg
          ? {
              id: room.lastMsg.id.toString(),
              threadId: room.roomId.toString(),
              fromId: "unknown",
              senderId: "unknown",
              text: room.lastMsg.preview,
              createdAt: new Date(room.lastMsg.createdAt).getTime(),
            }
          : undefined,
      };
    });
  }, [myRoomsData, openThreadIds]);

  // 핀 토글 함수
  // TODO: 백엔드 API에 핀 토글 엔드포인트 추가 후 구현 필요
  const togglePin = (threadId: string) => {
    console.log("Pin toggle requested for room:", threadId);
    // 백엔드 API 연동 필요: PUT /chat/rooms/{roomId}/pin
  };

  // 핀된 채팅방을 상단에 표시하도록 정렬
  const sortedThreads = [...threads].sort((a, b) => {
    // isPinned가 true인 것을 먼저
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // 같은 isPinned 상태면 마지막 메시지 시간순
    const aTime = a.lastMessage?.createdAt || 0;
    const bTime = b.lastMessage?.createdAt || 0;
    return bTime - aTime;
  });
  // ===== 추가 =====

// 채팅창 위치 상태 (픽셀 단위)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

// 채팅창 크기 상태 (픽셀 단위)
  const [sizes, setSizes] = useState<Record<string, { width: number; height: number }>>({});

// 드래그 중인 창 정보
  const dragInfo = useRef<{ id: string | null; offsetX: number; offsetY: number }>({
    id: null,
    offsetX: 0,
    offsetY: 0,
  });

// 리사이즈 중인 창 정보
  const resizeInfo = useRef<{
    id: string | null;
    direction: string | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startPosX: number;
    startPosY: number;
  }>({
    id: null,
    direction: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startPosX: 0,
    startPosY: 0,
  });

  const onDragStart = (id: string, e: React.PointerEvent) => {
    const p = positions[id] || { x: 0, y: 0 };
    dragInfo.current = { id, offsetX: e.clientX - p.x, offsetY: e.clientY - p.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onDragMove = (e: React.PointerEvent) => {
    const id = dragInfo.current.id;
    if (!id) return;
    const x = e.clientX - dragInfo.current.offsetX;
    const y = e.clientY - dragInfo.current.offsetY;

    const W = 320, H = 420, margin = 8;
    const maxX = window.innerWidth - W - margin;
    const maxY = window.innerHeight - H - margin;

    setPositions((prev) => ({
      ...prev,
      [id]: {
        x: Math.min(Math.max(margin, x), maxX),
        y: Math.min(Math.max(margin, y), maxY),
      },
    }));
  };

  const onDragEnd = (e: React.PointerEvent) => {
    dragInfo.current.id = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore safely: pointer capture may already be released
    }
  };

  // 리사이즈 시작
  const onResizeStart = (id: string, direction: string, e: React.PointerEvent) => {
    e.stopPropagation(); // 드래그 이벤트와 충돌 방지
    const currentSize = sizes[id] || { width: 320, height: 420 };
    const currentPos = positions[id] || { x: 0, y: 0 };
    resizeInfo.current = {
      id,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: currentSize.width,
      startHeight: currentSize.height,
      startPosX: currentPos.x,
      startPosY: currentPos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // 리사이즈 이동
  const onResizeMove = (e: React.PointerEvent) => {
    const { id, direction } = resizeInfo.current;
    if (!id || !direction) return;

    const deltaX = e.clientX - resizeInfo.current.startX;
    const deltaY = e.clientY - resizeInfo.current.startY;

    let newWidth = resizeInfo.current.startWidth;
    let newHeight = resizeInfo.current.startHeight;
    let newX = resizeInfo.current.startPosX;
    let newY = resizeInfo.current.startPosY;

    // 방향에 따라 크기 및 위치 조정
    if (direction.includes('e')) {
      newWidth = Math.max(280, Math.min(800, resizeInfo.current.startWidth + deltaX));
    }
    if (direction.includes('w')) {
      const widthChange = Math.max(280 - resizeInfo.current.startWidth, Math.min(800 - resizeInfo.current.startWidth, -deltaX));
      newWidth = resizeInfo.current.startWidth + widthChange;
      newX = resizeInfo.current.startPosX - widthChange;
    }
    if (direction.includes('s')) {
      newHeight = Math.max(300, Math.min(800, resizeInfo.current.startHeight + deltaY));
    }
    if (direction.includes('n')) {
      const heightChange = Math.max(300 - resizeInfo.current.startHeight, Math.min(800 - resizeInfo.current.startHeight, -deltaY));
      newHeight = resizeInfo.current.startHeight + heightChange;
      newY = resizeInfo.current.startPosY - heightChange;
    }

    setSizes((prev) => ({
      ...prev,
      [id]: { width: newWidth, height: newHeight },
    }));

    setPositions((prev) => ({
      ...prev,
      [id]: { x: newX, y: newY },
    }));
  };

  // 리사이즈 종료
  const onResizeEnd = (e: React.PointerEvent) => {
    resizeInfo.current.id = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore safely: pointer capture may already be released
    }
  };

  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});
  const [typing] = useState<Record<string, string[]>>({});
  const [panelOpen, setPanelOpen] = useState(false); // for mobile/tap

  // ===== 패널 자동 닫힘 타이머 관련 =====
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPanel = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setPanelOpen(true);
  };

  const scheduleClose = (delay = 1000) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setPanelOpen(false);
      closeTimer.current = null;
    }, delay);
  };

// 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  // ===== 메시지 로딩 =====
  // 채팅방이 열릴 때 메시지 가져오기
  useEffect(() => {
    openThreadIds.forEach(async (threadId) => {
      // 이미 로딩 중이거나 메시지가 있으면 스킵
      if (loadingMessages[threadId] || messages[threadId]) {
        return;
      }

      setLoadingMessages((prev) => ({ ...prev, [threadId]: true }));

      try {
        const roomId = parseInt(threadId, 10);
        const response = await chatService.getRoomMessages({ roomId });

        // 백엔드 메시지를 UI 형식으로 변환
        const convertedMessages: ChatMessage[] = response.items.map((msg) => ({
          id: msg.id.toString(),
          threadId: msg.roomId.toString(),
          fromId: msg.senderId.toString(),
          senderId: msg.senderId.toString(),
          text: msg.body.text,
          createdAt: new Date(msg.createdAt).getTime(),
          senderNickname: msg.senderNickname,
          senderRole: msg.senderRole,
        }));

        setMessages((prev) => ({
          ...prev,
          [threadId]: convertedMessages,
        }));

        // 메시지 조회 성공 시 백엔드에서 자동으로 읽음 처리되므로
        // 채팅방 목록을 다시 가져와서 unreadCount 업데이트
        queryClient.invalidateQueries({
          queryKey: CHAT_QUERY_KEYS.myRooms(0)
        });
      } catch (error) {
        console.error("Failed to load messages for thread:", threadId, error);
      } finally {
        setLoadingMessages((prev) => ({ ...prev, [threadId]: false }));
      }
    });
  }, [loadingMessages, messages, openThreadIds, queryClient]);

  // ===== 웹소켓 연결 관리 =====
  // openThreadIds를 roomId(number)로 변환
  const openRoomIds = useMemo(() => {
    return openThreadIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
  }, [openThreadIds]);

  // 웹소켓 메시지 수신 핸들러
  const handleWebSocketMessage = useCallback((roomId: number, message: WebSocketMessage) => {
    const threadId = roomId.toString();

    // 백엔드 메시지를 UI 형식으로 변환
    const convertedMessage: ChatMessage = {
      id: message.id.toString(),
      threadId: threadId,
      fromId: message.senderId.toString(),
      senderId: message.senderId.toString(),
      text: message.body.text || "",
      createdAt: new Date(message.createdAt).getTime(),
      senderNickname: message.senderNickname,
      senderRole: message.senderRole,
    };

    // 메시지 목록에 추가
    setMessages((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), convertedMessage],
    }));

    // 채팅방 목록 업데이트 (lastMessage, unreadCount)
    queryClient.invalidateQueries({
      queryKey: CHAT_QUERY_KEYS.myRooms(0),
    });
  }, [queryClient]);

  // 웹소켓 연결 (로그인된 경우에만)
  useWebSocketManager({
    roomIds: openRoomIds,
    onMessage: handleWebSocketMessage,
    enabled: !!user,
  });

  const unreadTotal = Math.min(99, threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0));

  // ===== 브라우저 리사이즈 시 채팅 윈도우 위치 조정 =====
  useEffect(() => {
    const handleResize = () => {
      setPositions((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.keys(updated).forEach((threadId) => {
          const pos = updated[threadId];
          const size = sizes[threadId] || { width: 320, height: 420 };
          const margin = 8;

          // 화면 크기에 맞게 최대 위치 계산
          const maxX = Math.max(margin, window.innerWidth - size.width - margin);
          const maxY = Math.max(margin, window.innerHeight - size.height - margin);

          // 현재 위치가 화면 밖이면 조정
          const newX = Math.min(Math.max(margin, pos.x), maxX);
          const newY = Math.min(Math.max(margin, pos.y), maxY);

          if (newX !== pos.x || newY !== pos.y) {
            updated[threadId] = { x: newX, y: newY };
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sizes]);

  const openThread = (t: ChatThread) => {
    openThreadInContext(t.id);

    // ✨ 기본 위치 설정 (창이 처음 열릴 때만)
    setPositions((prev) => {
      if (prev[t.id]) return prev;
      const W = 320;
      const H = 420;
      const m = 16;
      const x = Math.max(8, window.innerWidth - (88 + W) - m);
      const y = Math.max(8, window.innerHeight - (H + m));
      return { ...prev, [t.id]: { x, y } };
    });
    bringToFront(t.id)
  };

  const closeThread = (id: string) => closeThreadInContext(id);
  const minimizeThread = (id: string) => minimizeThreadInContext(id);

  const sendMessage = (threadId: string, text: string) => {
    const roomId = parseInt(threadId, 10);

    if (!myUserId) {
      toast.show({ title: "사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.", variant: "warning" });
      return;
    }

    // @ai 메시지 감지 및 처리
    if (text.trim().startsWith("@ai")) {
      // @ai 제거하고 나머지 파싱
      const aiContent = text.trim().substring(3).trim();

      const { command, note } = parseAiShortcut(aiContent);

      // AI 요청 전송
      requestAIMutation.mutate({
        roomId,
        command,
        note,
      });

      // 사용자 메시지도 채팅에 표시 (선택적)
      const userMessage: ChatMessage = {
        id: `user-ai-${Date.now()}`,
        threadId: threadId,
        fromId: myUserId,
        senderId: myUserId,
        text: text,
        createdAt: Date.now(),
      };

      setMessages((prev) => ({
        ...prev,
        [threadId]: [...(prev[threadId] || []), userMessage],
      }));

      return;
    }

    // 일반 메시지 전송
    sendMessageMutation.mutate({
      senderId: myUserId,
      roomId,
      type: "TEXT",
      body: { text },
      replyToMsgId: null,
    });
  };

  // 변경 2: 반환부 전체 교체 (return ...)
  return (
    <div id="chatdock-root" style={{ position: "fixed", right: 16, bottom: 16, zIndex: 60 }}>
      {/* 버튼 + 패널 래퍼: 이 영역 안에서 이동할 때는 닫기 예약 취소됨 */}
      <div onMouseEnter={openPanel} onMouseLeave={() => scheduleClose(1000)}>
        {/* Floating Chat Button */}
        <button
          onClick={() => (panelOpen ? setPanelOpen(false) : openPanel())}
          className="relative w-12 h-12 rounded-full border border-[color:var(--chatdock-border-subtle)] bg-[color:var(--chatdock-bg-elev-1)] shadow-md grid place-items-center"
          aria-label="채팅 열기"
        >
          <MessageCircle className="w-6 h-6 text-[color:var(--chatdock-fg-primary)]" />
          {unreadTotal > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 grid place-items-center rounded-full text-[10px] font-bold bg-[color:var(--color-accent)] text-[color:var(--chatdock-on-accent)]">
            {unreadTotal}
          </span>
          )}
        </button>

        {/* 패널: 아이콘의 왼쪽-위로 띄우기 */}
        <div
          className={cls(
            "absolute w-[280px] max-h-[60vh] transition-all duration-200",
            panelOpen
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-2 scale-95 pointer-events-none"
          )}
          style={{ right: "calc(100% + 8px)", bottom: "calc(100% + 8px)" }}
        >
          <div className="rounded-[var(--radius-lg)] border border-[color:var(--chatdock-border-subtle)] bg-[color:var(--chatdock-bg-elev-1)] shadow-xl overflow-hidden">
            <div className="h-10 flex items-center justify-between px-2 border-b border-[color:var(--chatdock-border-subtle)]">
              <div className="text-sm font-semibold">채팅</div>
              <button onClick={() => setPanelOpen(false)} className="text-xs text-[color:var(--chatdock-fg-muted)] hover:underline">
                닫기
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto">
              {/* 최소화된 채팅 목록 */}
              {minimizedThreadIds.length > 0 && (
                <div className="p-2 border-b border-[color:var(--chatdock-border-subtle)]">
                  <div className="text-xs text-[color:var(--chatdock-fg-muted)] mb-1 px-1">최소화된 채팅</div>
                  {minimizedThreadIds.map((id) => {
                    const t = threads.find((x) => x.id === id);
                    if (!t) return null;
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          restoreThread(id);
                          setPanelOpen(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-[var(--radius-md)] hover:bg-[color:var(--chatdock-bg-hover)] text-left"
                      >
                        <Maximize2 className="w-3 h-3 text-[color:var(--color-primary)]" />
                        <div className="flex-1 text-sm truncate text-[color:var(--chatdock-fg-primary)]">
                          {t.users.map((u) => u.name).join(", ")}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {/* 열려있는 채팅 목록 (최소화되지 않은 것만) */}
              {openThreadIds.filter(id => !minimizedThreadIds.includes(id)).length > 0 && (
                <div className="p-2 border-b border-[color:var(--chatdock-border-subtle)]">
                  <div className="text-xs text-[color:var(--chatdock-fg-muted)] mb-1 px-1">
                    열린 채팅
                  </div>
                  {openThreadIds
                    .filter(id => !minimizedThreadIds.includes(id))
                    .map((id) => {
                      const t = threads.find(x => x.id === id);
                      if (!t) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            bringToFront(id);
                            setPanelOpen(false);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-[var(--radius-md)] hover:bg-[color:var(--chatdock-bg-hover)] text-left"
                        >
                          <Circle className="w-2 h-2 fill-[color:var(--color-primary)] text-[color:var(--color-primary)]" />
                          <div className="flex-1 text-sm truncate text-[color:var(--chatdock-fg-primary)]">
                            {t.users.map((u) => u.name).join(", ")}
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}

              {/* 모든 채팅 목록 (핀된 채팅 상단 표시) */}
              <div className="p-2">
                <div className="text-xs text-[color:var(--chatdock-fg-muted)] mb-1 px-1">
                  모든 채팅
                </div>
                {sortedThreads.map((thread) => (
                  <ThreadChip
                    key={thread.id}
                    thread={thread}
                    onOpen={openThread}
                    onTogglePin={togglePin}
                  />
                ))}
              </div>
            </div>

            {/* 전체 채팅 보기 버튼 */}
            <button
              onClick={() => {
                navigate("/chat");
                setPanelOpen(false);
              }}
              className="w-full h-10 flex items-center justify-center gap-2 border-t border-[color:var(--chatdock-border-subtle)] hover:bg-[color:var(--chatdock-bg-hover)] transition-colors text-sm font-medium text-[color:var(--color-primary)]"
            >
              <Plus className="w-4 h-4" />
              전체 채팅 보기
            </button>
          </div>
        </div>
      </div>

      {/* Floating chat windows */}
      {openThreadIds.map((id) => {
          // 최소화된 창은 렌더링하지 않음
          if (minimizedThreadIds.includes(id)) return null;

          const t = threads.find((x) => x.id === id);
          if (!t) return null;
          const msgs = messages[id] || [];
          const typingIds = typing[id] || [];
          const pos = positions[id] || { x: 0, y: 0 };
          const z = zMap[id] ?? 61; // 기본값(다른 전역 UI 위)

          return (
            <div
              key={id}
              style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: z }}
              onPointerMove={(e) => {
                onDragMove(e);
                onResizeMove(e);
              }}
              onPointerUp={(e) => {
                onDragEnd(e);
                onResizeEnd(e);
              }}
              onPointerCancel={(e) => {
                onDragEnd(e);
                onResizeEnd(e);
              }}
              onMouseDown={() => bringToFront(id)}   // ✅ 클릭 시 맨 위
            >
              <ChatWindow
                me={me}
                thread={t}
                messages={msgs}
                typingUserIds={typingIds}
                onClose={() => closeThread(id)}
                onMinimize={() => minimizeThread(id)}
                onSend={(text) => sendMessage(id, text)}
                onRequestAI={(command, note) => {
                  const roomId = parseInt(id, 10);
                  requestAIMutation.mutate({
                    roomId,
                    command,
                    note,
                  });
                }}
                onDeleteRoom={() => {
                  const roomId = parseInt(id, 10);
                  deleteRoomMutation.mutate(roomId);
                }}
                onMuteRoom={() => {
                  const roomId = parseInt(id, 10);
                  muteRoomMutation.mutate(roomId);
                }}
                onUnmuteRoom={() => {
                  const roomId = parseInt(id, 10);
                  unmuteRoomMutation.mutate(roomId);
                }}
                __onDragStart={(e: React.PointerEvent) => onDragStart(id, e)}
                __onResizeStart={(direction: string, e: React.PointerEvent) => onResizeStart(id, direction, e)}
                width={sizes[id]?.width || 320}
                height={sizes[id]?.height || 420}
                roomId={parseInt(id, 10)}
                isOwner={false} // TODO: 백엔드에서 방장 정보 받아오기
                isMuted={false} // TODO: 백엔드에서 뮤트 상태 받아오기
                currentUserIdNumber={myUserIdNumber}
              />
            </div>
          );
        })}

        </div>
  );

}


