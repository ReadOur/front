import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import AIDock, { AIMessage } from "@/features/ai/AIDock";
import NoticeDock from "@/features/notice/NoticeDock";
import "./ChatDock.css";
import { USER_QUERY_KEYS } from "@/hooks/api/useUser";
import { userService } from "@/services/userService";
import { extractUserIdFromToken } from "@/utils/auth";
import { AiCommandType, AiJobResponse, RoomMessage, RoomMessageType, SessionClosingPayload } from "@/types";
import { composeFileTargetId, formatFileSize, isImageFile, uploadFiles } from "@/api/files";

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
  "요약": "PUBLIC_SUMMARY",
  question: "GROUP_QUESTION_GENERATOR",
  questions: "GROUP_QUESTION_GENERATOR",
  q: "GROUP_QUESTION_GENERATOR",
  "질문생성": "GROUP_QUESTION_GENERATOR",
  keypoints: "GROUP_KEYPOINTS",
  keypoint: "GROUP_KEYPOINTS",
  "요점정리": "GROUP_KEYPOINTS",
  start: "SESSION_START",
  begin: "SESSION_START",
  "토론시작": "SESSION_START",
  end: "SESSION_END",
  finish: "SESSION_END",
  "토론종료": "SESSION_END",
  closing: "SESSION_CLOSING",
  "마감": "SESSION_CLOSING",
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

  if (
    typeof payload === "object" &&
    ("topicSummary" in payload || "alignment" in payload || "disagreement" in payload)
  ) {
    const sections: string[] = [];

    const appendSection = (label: string, value: unknown) => {
      if (!value) return;

      if (Array.isArray(value)) {
        sections.push(`${label}`);
        value.forEach((item) => {
          if (typeof item === "string") {
            sections.push(`- ${item}`);
          }
        });
        return;
      }

      if (typeof value === "string") {
        sections.push(`${label}${value}`);
      }
    };

    appendSection("요점 정리 : ", (payload as Record<string, unknown>).topicSummary);
    appendSection("조정 과정 : ", (payload as Record<string, unknown>).alignment);
    appendSection("쟁점 : ", (payload as Record<string, unknown>).disagreement);

    if (sections.length > 0) {
      return sections.join("\n");
    }
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

function formatAiQuestions(payload: AiJobResponse["payload"]): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  if ("fallback" in payload && payload.fallback) {
    return null;
  }

  const questions = (payload as { questions?: unknown }).questions;

  if (!Array.isArray(questions)) {
    return null;
  }

  const formatted = questions
    .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
    .map((q, idx) => `${idx + 1}. ${q.trim()}`);

  if (formatted.length === 0) {
    return "질문을 생성하지 못했습니다.";
  }

  return formatted.join("\n");
}

function formatAiJobMessage(command: AiCommandType, response: AiJobResponse): string {
  const questionsText = formatAiQuestions(response.payload);
  if (questionsText) {
    return questionsText;
  }

  const payloadText = formatAiPayload(response.payload);
  if (payloadText) {
    return payloadText;
  }

  return `${command} 결과를 불러오지 못했습니다.`;
}

function buildAiErrorMessage(error: any): string {
  const status = error?.response?.status as number | undefined;
  const serverMessage =
    error?.response?.data?.message || error?.response?.data?.error || error?.message;

  if (status && status >= 400 && status < 600) {
    return `AI 요청 실패 (${status})${serverMessage ? `: ${serverMessage}` : ''}`;
  }

  return serverMessage || "AI 요청에 실패했습니다.";
}

const DEFAULT_MESSAGE_LIMIT = 60;
const shouldHideAiMessage = (msg: { senderRole?: string; type?: RoomMessageType }) =>
  msg.senderRole === "AI" || msg.type === "AI_ASSIST";

const AI_COMMAND_LABELS: Record<AiCommandType, string> = {
  PUBLIC_SUMMARY: "공개 대화 요약",
  GROUP_QUESTION_GENERATOR: "추가 질문 제안",
  GROUP_KEYPOINTS: "토론 요점 정리",
  GROUP_CLOSING: "토론 마무리",
  SESSION_START: "세션 시작",
  SESSION_SUMMARY_SLICE: "세션 중간 요약",
  SESSION_END: "세션 종료",
  SESSION_CLOSING: "세션 클로징",
};

function formatAiRequestMessage(command: AiCommandType, note?: string) {
  const label = AI_COMMAND_LABELS[command] || command;
  if (note) {
    return `[${label}] ${note}`;
  }
  return `[${label}] 요청을 실행합니다.`;
}

// ===== Types =====
export interface ChatUser {
  id: string;
  name: string;
  avatarUrl?: string;
  online?: boolean;
}

export interface ChatAttachment {
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
  downloadUrl?: string;
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
  type?: RoomMessageType;
  attachment?: ChatAttachment;
}

export type ChatCategory = "PRIVATE" | "GROUP" | "PUBLIC";

export interface ChatThread {
  id: string;
  users: ChatUser[]; // participants
  lastMessage?: ChatMessage;
  unreadCount?: number;
  category: ChatCategory; // 1:1(PRIVATE), 모임(GROUP), 공개(PUBLIC)
  isPinned?: boolean; // 상단 고정 여부
  joined?: boolean; // 참여 여부 (공개 채팅방용)
}

const parseAttachmentExtra = (extra?: string): ChatAttachment | null => {
  if (!extra) return null;

  try {
    const parsed = typeof extra === "string" ? JSON.parse(extra) : extra;
    if (parsed && typeof parsed === "object" && "url" in parsed) {
      const payload = parsed as Record<string, any>;
      return {
        url: payload.url,
        name: payload.name,
        size: payload.size,
        mimeType: payload.mimeType || payload.contentType,
        downloadUrl: payload.downloadUrl || payload.url,
      };
    }
  } catch (error) {
    console.warn("첨부 메타데이터 파싱 실패", error);
  }

  return null;
};

const mapRoomMessageToChatMessage = (msg: RoomMessage): ChatMessage => {
  const attachment = parseAttachmentExtra(msg.body.extra);
  const fallbackText =
    msg.body.text ??
    (msg.type === "IMAGE" && attachment?.url
      ? "[이미지]"
      : msg.type === "FILE" && attachment?.name
        ? attachment.name
        : "");

  return {
    id: msg.id.toString(),
    threadId: msg.roomId.toString(),
    fromId: msg.senderId.toString(),
    senderId: msg.senderId.toString(),
    text: fallbackText,
    createdAt: new Date(msg.createdAt).getTime(),
    senderNickname: msg.senderNickname,
    senderRole: msg.senderRole,
    type: msg.type,
    attachment,
  };
};

const GROUP_AI_ALLOWED_ROLES = new Set(["OWNER", "MANAGER"]);

function canUseAI(
  category: ChatCategory | undefined,
  role: string | null | undefined,
  command: AiCommandType
): { allowed: boolean; reason?: string } {
  if (category === "PRIVATE") {
    return { allowed: false, reason: "1:1 채팅방에서는 AI 기능을 사용할 수 없습니다." };
  }

  if (category === "PUBLIC") {
    if (command === "PUBLIC_SUMMARY") {
      return { allowed: true };
    }
    return { allowed: false, reason: "공개 채팅방에서는 공개 대화 요약만 이용할 수 있습니다." };
  }

  if (category === "GROUP") {
    if (!role || !GROUP_AI_ALLOWED_ROLES.has(role)) {
      return { allowed: false, reason: "모임 채팅방에서는 관리자 이상만 AI 기능을 사용할 수 있습니다." };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: "AI 기능을 사용할 수 없습니다." };
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
                      onMuteRoom: _onMuteRoom,
                      onUnmuteRoom: _onUnmuteRoom,
                      aiMessages,
                      aiIsLoading,
                      onAIDockSend,
                      isAIDockOpen,
                      onOpenAIDock,
                      onCloseAIDock,
                      __onDragStart,
                      __onResizeStart,
                      width = 320,
                      height = 420,
                      roomId,
                      isMuted: _isMuted = false,
                      currentUserIdNumber,
                      onLoadMoreMessages,
                      hasMoreMessages,
                      isLoadingMessages,
                    }: {
  me: ChatUser;
  thread: ChatThread;
  messages: ChatMessage[];
  typingUserIds?: string[];
  onClose: () => void;
  onMinimize: () => void;
  onSend: (text: string, currentUserRole?: string | null) => void;
  onRequestAI?: (command: AiCommandType, note?: string) => void;
  onDeleteRoom?: () => void;
  onMuteRoom?: () => void;
  onUnmuteRoom?: () => void;
  aiMessages?: AIMessage[];
  aiIsLoading?: boolean;
  onAIDockSend?: (text: string) => void;
  isAIDockOpen?: boolean;
  onOpenAIDock?: () => void;
  onCloseAIDock?: () => void;
  __onDragStart?: (e: React.PointerEvent) => void;
  __onResizeStart?: (direction: string, e: React.PointerEvent) => void;
  width?: number;
  height?: number;
  roomId?: number;
  isMuted?: boolean;
  currentUserIdNumber?: number | null;
  onLoadMoreMessages?: () => Promise<boolean>;
  hasMoreMessages?: boolean;
  isLoadingMessages?: boolean;
}) {
  // 상태 선언 (먼저)
  const [text, setText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isNoticeDockOpen, setIsNoticeDockOpen] = useState(false);
  const [noticePermission, setNoticePermission] = useState<{
    status: "idle" | "checking" | "success" | "error";
    hasPermission?: boolean;
    errorMessage?: string;
  }>({ status: "idle" });
  const menuRef = useRef<HTMLDivElement>(null);

  // 메시지별 메뉴 관련 상태
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set());
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const messageMenuRef = useRef<HTMLDivElement>(null);
  const [messageMenuPositions, setMessageMenuPositions] = useState<Record<string, { left: number; top: number }>>({});
  const messageMenuDrag = useRef<{ messageId: string | null; offsetX: number; offsetY: number }>({
    messageId: null,
    offsetX: 0,
    offsetY: 0,
  });
  const [profileTarget, setProfileTarget] = useState<{
    messageId: string | null;
    userId?: number;
    nickname?: string;
    role?: string;
  } | null>(null);

  const aiDockMessagesSafe = aiMessages ?? [];
  const aiDockLoadingSafe = aiIsLoading ?? false;
  const aiDockOpen = isAIDockOpen ?? false;

  // 현재 사용자의 role 상태
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [targetUserRole, setTargetUserRole] = useState<string | null>(null);

  // 현재 사용자 ID 추출 (props로 전달되지 않았을 경우 토큰에서 추출)
  const actualCurrentUserId = React.useMemo(() => {
    if (currentUserIdNumber !== undefined && currentUserIdNumber !== null) {
      return currentUserIdNumber;
    }
    const userIdStr = extractUserIdFromToken(localStorage.getItem("accessToken") || "");
    return userIdStr ? Number(userIdStr) : null;
  }, [currentUserIdNumber]);

  // 메뉴 드래그 상태
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const menuDrag = useRef<{ active: boolean; offsetX: number; offsetY: number }>({
    active: false,
    offsetX: 0,
    offsetY: 0,
  });

  // 현재 사용자의 role 조회
  useEffect(() => {
    if (!roomId || !actualCurrentUserId) return;

    chatService.getRoomMemberProfile(roomId, actualCurrentUserId)
      .then((profile) => {
        setCurrentUserRole(profile.role);
      })
      .catch((error) => {
        console.error('❌ Failed to load current user role:', error);
      });
  }, [roomId, actualCurrentUserId]);

  // 프로필 대상 사용자의 role 조회
  useEffect(() => {
    if (!roomId || !profileTarget?.userId) {
      setTargetUserRole(null);
      return;
    }

    chatService.getRoomMemberProfile(roomId, profileTarget.userId)
      .then((profile) => {
        setTargetUserRole(profile.role);
      })
      .catch((error) => {
        console.error('❌ Failed to load target user role:', error);
      });
  }, [roomId, profileTarget?.userId]);

  // role에 따른 권한 확인
  const isOwner = currentUserRole === "OWNER";

  const toast = useToast();

  const aiPermissions = useMemo(
    () => {
      const permissions = {
        publicSummary: canUseAI(thread.category, currentUserRole, "PUBLIC_SUMMARY"),
        groupKeypoints: canUseAI(thread.category, currentUserRole, "GROUP_KEYPOINTS"),
        groupQuestions: canUseAI(thread.category, currentUserRole, "GROUP_QUESTION_GENERATOR"),
        sessionStart: canUseAI(thread.category, currentUserRole, "SESSION_START"),
        sessionEnd: canUseAI(thread.category, currentUserRole, "SESSION_END"),
        sessionClosing: canUseAI(thread.category, currentUserRole, "SESSION_CLOSING"),
      };
      return permissions;
    },
    [currentUserRole, thread.category]
  );

  const isPublicThread = thread.category === "PUBLIC";
  const isGroupThread = thread.category === "GROUP";

  const canManageGroupAI =
    aiPermissions.groupKeypoints.allowed ||
    aiPermissions.groupQuestions.allowed ||
    aiPermissions.sessionStart.allowed ||
    aiPermissions.sessionEnd.allowed ||
    aiPermissions.sessionClosing.allowed;
  const canShowAISection =
    (isPublicThread && aiPermissions.publicSummary.allowed) ||
    (isGroupThread && canManageGroupAI);

  const requestAICommand = useCallback(
    (command: AiCommandType, note?: string) => {
      const permission = canUseAI(thread.category, currentUserRole, command);
      if (!permission.allowed) {
        toast.show({ title: permission.reason || "AI 기능을 사용할 수 없습니다.", variant: "warning" });
        return;
      }

      onRequestAI?.(command, note);
    },
    [currentUserRole, onRequestAI, thread.category, toast]
  );
  const [profileCardPosition, setProfileCardPosition] = useState<{ left: number; top: number } | null>(null);
  const profileCardDrag = useRef<{ active: boolean; offsetX: number; offsetY: number }>({
    active: false,
    offsetX: 0,
    offsetY: 0,
  });
  const dockContainerRef = useRef<HTMLDivElement>(null);

  const resolveProfileFromMessage = useCallback((messageId: string | null) => {
    if (!messageId) return null;

    const message = messages.find((m) => m.id === messageId);
    if (!message) return null;

    const rawSenderId = message.senderId ?? message.fromId;
    const numericId = rawSenderId ? Number(rawSenderId) : undefined;

    return {
      messageId,
      userId: numericId && !Number.isNaN(numericId) ? numericId : undefined,
      nickname: message.senderNickname,
      role: message.senderRole,
    };
  }, [messages]);

  useEffect(() => {
    setProfileTarget((prev) => resolveProfileFromMessage(prev?.messageId));
    setProfileCardPosition((prev) => {
      if (!prev || !profileTarget) return prev;

      const cardWidth = 288;
      const cardHeight = 180;
      const margin = 12;

      return {
        left: Math.min(Math.max(margin, prev.left), window.innerWidth - cardWidth - margin),
        top: Math.min(Math.max(margin, prev.top), window.innerHeight - cardHeight - margin),
      };
    });
  }, [messages, resolveProfileFromMessage, profileTarget]);

  useEffect(() => {
    setProfileTarget(null);
    setProfileCardPosition(null);
  }, [roomId, thread.id]);

  useEffect(() => {
    if (!profileTarget || profileCardPosition) return;

    const cardWidth = 288;
    const cardHeight = 180;
    const margin = 12;
    const dockRect = dockContainerRef.current?.getBoundingClientRect();
    const preferredLeft = dockRect ? dockRect.right + 12 : window.innerWidth - cardWidth - margin;
    const preferredTop = dockRect ? dockRect.top + 48 : margin;

    setProfileCardPosition({
      left: Math.min(Math.max(margin, preferredLeft), window.innerWidth - cardWidth - margin),
      top: Math.min(Math.max(margin, preferredTop), window.innerHeight - cardHeight - margin),
    });
  }, [profileTarget, profileCardPosition]);

  const createRoomMutation = useCreateRoom({
    onSuccess: () => {
      toast.show({
        title: "1:1 채팅방을 생성했습니다.",
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
  const prependStateRef = useRef<{ active: boolean; prevScrollHeight: number; prevScrollTop: number }>({
    active: false,
    prevScrollHeight: 0,
    prevScrollTop: 0,
  });

  useEffect(() => {
    const container = boxRef.current;
    if (!container) return;

    if (prependStateRef.current.active) {
      const { prevScrollHeight, prevScrollTop } = prependStateRef.current;
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
      prependStateRef.current.active = false;
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const container = boxRef.current;
    if (!container || !onLoadMoreMessages) return;

    const loading = isLoadingMessages ?? false;
    const hasMore = hasMoreMessages ?? false;

    const handleScroll = async () => {
      if (!hasMore || loading || loadingMoreRef.current) return;

      if (container.scrollTop <= 40) {
        const prevScrollHeight = container.scrollHeight;
        const prevScrollTop = container.scrollTop;
        loadingMoreRef.current = true;
        prependStateRef.current = {
          active: true,
          prevScrollHeight,
          prevScrollTop,
        };

        try {
          const loaded = await onLoadMoreMessages();
          if (!loaded) {
            prependStateRef.current.active = false;
          }
        } catch (error) {
          console.error("Failed to load older messages", error);
          prependStateRef.current.active = false;
        } finally {
          loadingMoreRef.current = false;
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [hasMoreMessages, isLoadingMessages, onLoadMoreMessages]);

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
    if (profileTarget?.messageId === message.id) {
      setProfileTarget(null);
      return;
    }

    setProfileTarget(resolveProfileFromMessage(message.id));
  };

  const loadNoticePermission = useCallback(async () => {
    if (!roomId || !actualCurrentUserId) return;

    setNoticePermission({ status: "checking" });

    try {
      const profile = await chatService.getRoomMemberProfile(roomId, actualCurrentUserId);
      const hasPermission = ["OWNER", "MANAGER"].includes(profile.role);

      setNoticePermission({ status: "success", hasPermission });
    } catch (error: any) {
      const message = error?.response?.data?.message || error.message || "공지 권한을 확인하지 못했습니다.";

      setNoticePermission({ status: "error", errorMessage: message });
      toast.show({
        title: "공지 권한 확인 실패",
        variant: "error",
      });
    }
  }, [actualCurrentUserId, roomId, toast]);

  useEffect(() => {
    if (!isNoticeDockOpen) return;

    loadNoticePermission();
  }, [isNoticeDockOpen, loadNoticePermission]);

  const handleCreateDirectRoom = (targetUserId: number | undefined, nickname?: string) => {
    if (!actualCurrentUserId) {
      toast.show({ title: "로그인이 필요합니다.", variant: "warning" });
      return;
    }

    if (!targetUserId) {
      toast.show({ title: "1:1 채팅을 만들 수 있는 사용자 정보가 없습니다.", variant: "warning" });
      return;
    }

    // 자기 자신과의 채팅 방지
    if (actualCurrentUserId === targetUserId) {
      toast.show({ title: "자기 자신과는 채팅할 수 없습니다.", variant: "warning" });
      return;
    }

    createRoomMutation.mutate({
      scope: "PRIVATE",
      name: `${me.name} & ${nickname ?? "사용자"}`,
      description: "1:1 채팅방",
      memberIds: [actualCurrentUserId, targetUserId],
    });
  };

  const handleProfileCardDragStart = (e: React.PointerEvent) => {
    if (!profileCardPosition) return;

    profileCardDrag.current = {
      active: true,
      offsetX: e.clientX - profileCardPosition.left,
      offsetY: e.clientY - profileCardPosition.top,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleProfileCardDragMove = (e: React.PointerEvent) => {
    if (!profileCardDrag.current.active) return;

    const cardWidth = 288;
    const cardHeight = 180;
    const margin = 12;

    const left = Math.min(
      Math.max(margin, e.clientX - profileCardDrag.current.offsetX),
      window.innerWidth - cardWidth - margin
    );
    const top = Math.min(
      Math.max(margin, e.clientY - profileCardDrag.current.offsetY),
      window.innerHeight - cardHeight - margin
    );

    setProfileCardPosition({ left, top });
  };

  const handleProfileCardDragEnd = (e: React.PointerEvent) => {
    profileCardDrag.current.active = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
  };

  const handleMenuDragStart = (e: React.PointerEvent) => {
    if (!menuPosition) return;

    menuDrag.current = {
      active: true,
      offsetX: e.clientX - menuPosition.left,
      offsetY: e.clientY - menuPosition.top,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleMenuDragMove = (e: React.PointerEvent) => {
    if (!menuDrag.current.active) return;

    const menuWidth = 450;
    const menuHeight = 400; // approximate height
    const margin = 12;

    const left = Math.min(
      Math.max(margin, e.clientX - menuDrag.current.offsetX),
      window.innerWidth - menuWidth - margin
    );
    const top = Math.min(
      Math.max(margin, e.clientY - menuDrag.current.offsetY),
      window.innerHeight - menuHeight - margin
    );

    setMenuPosition({ left, top });
  };

  const handleMenuDragEnd = (e: React.PointerEvent) => {
    menuDrag.current.active = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
  };

  const handleMessageMenuDragStart = (messageId: string, e: React.PointerEvent) => {
    const position = messageMenuPositions[messageId];
    if (!position) return;

    messageMenuDrag.current = {
      messageId,
      offsetX: e.clientX - position.left,
      offsetY: e.clientY - position.top,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleMessageMenuDragMove = (e: React.PointerEvent) => {
    const { messageId } = messageMenuDrag.current;
    if (!messageId) return;

    const menuWidth = 192; // w-48 = 192px
    const menuHeight = 200; // approximate
    const margin = 12;

    const left = Math.min(
      Math.max(margin, e.clientX - messageMenuDrag.current.offsetX),
      window.innerWidth - menuWidth - margin
    );
    const top = Math.min(
      Math.max(margin, e.clientY - messageMenuDrag.current.offsetY),
      window.innerHeight - menuHeight - margin
    );

    setMessageMenuPositions((prev) => ({
      ...prev,
      [messageId]: { left, top },
    }));
  };

  const handleMessageMenuDragEnd = (e: React.PointerEvent) => {
    messageMenuDrag.current.messageId = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
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
      ref={dockContainerRef}
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
              if (!isMenuOpen) {
                // Initialize menu position near the button
                const buttonRect = (e.target as HTMLElement).getBoundingClientRect();
                const menuWidth = 450;
                const margin = 12;

                setMenuPosition({
                  left: Math.max(margin, Math.min(buttonRect.right + 8, window.innerWidth - menuWidth - margin)),
                  top: Math.max(margin, buttonRect.top),
                });
              }
              setIsMenuOpen(!isMenuOpen);
            }}
            className="w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-[color:var(--chatdock-bg-hover)] opacity-60 hover:opacity-100 transition-opacity"
            title="메뉴"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {/* 메뉴 드롭다운 */}
          {isMenuOpen && menuPosition && (
            <div
              className="fixed w-[450px] rounded-[var(--radius-md)] border border-[color:var(--chatdock-border-strong)] bg-[color:var(--chatdock-bg-elev-1)] shadow-2xl overflow-hidden z-[120]"
              style={{ left: menuPosition.left, top: menuPosition.top }}
              onPointerMove={handleMenuDragMove}
              onPointerUp={handleMenuDragEnd}
              onPointerCancel={handleMenuDragEnd}
            >
              {/* Draggable header */}
              <div
                className="flex items-center justify-between px-3 py-2 border-b border-[color:var(--chatdock-border-subtle)] cursor-move bg-[color:var(--chatdock-bg-elev-2)]"
                onPointerDown={handleMenuDragStart}
              >
                <div className="text-sm font-semibold text-[color:var(--chatdock-fg-primary)]">채팅방 메뉴</div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    setMenuPosition(null);
                  }}
                  className="w-7 h-7 grid place-items-center rounded-[var(--radius-sm)] border border-[color:var(--chatdock-border-subtle)] hover:bg-[color:var(--chatdock-bg-hover)] text-[color:var(--chatdock-fg-muted)]"
                  aria-label="메뉴 닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
              {/* AI 요약 섹션 - 범위/권한에 따라 노출 */}
              {canShowAISection && (
                <div className="border-b-2 border-[color:var(--chatdock-border-subtle)] py-2">
                  <div className="px-3 pb-1 text-xs text-[color:var(--chatdock-fg-muted)] font-semibold">AI</div>
                  <div className="grid grid-cols-2 gap-2 px-2">
                    {aiPermissions.publicSummary.allowed && (
                      <button
                        onClick={() => {
                          const note = prompt("요약과 함께 궁금한 점을 입력하세요 (선택 사항)");
                          if (note === null) return; // 취소 누르면 실행 안함
                          requestAICommand("PUBLIC_SUMMARY", note || undefined);
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                      >
                        <MessageCircle className="w-4 h-4 flex-shrink-0" />
                        공개 대화 요약
                      </button>
                    )}

                    {/* 토론 요점 정리 - GROUP 전용 */}
                    {isGroupThread && aiPermissions.groupKeypoints.allowed && (
                      <button
                        onClick={() => {
                          requestAICommand("GROUP_KEYPOINTS", undefined);
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                      >
                        <MessageCircle className="w-4 h-4 flex-shrink-0" />
                        토론 요점 정리
                      </button>
                    )}

                    {/* 추가 질문 제안 - GROUP 전용 */}
                    {isGroupThread && aiPermissions.groupQuestions.allowed && (
                      <button
                        onClick={() => {
                          requestAICommand("GROUP_QUESTION_GENERATOR", undefined);
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                      >
                        <MessageCircle className="w-4 h-4 flex-shrink-0" />
                        추가 질문 제안
                      </button>
                    )}
                    {/* AI 요약창 열기 - PUBLIC(모두) 또는 GROUP(관리자) */}
                    {((isPublicThread && aiPermissions.publicSummary.allowed) ||
                      (isGroupThread && canManageGroupAI)) && (
                      <button
                        onClick={() => {
                          onOpenAIDock?.();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                      >
                        <MessageCircle className="w-4 h-4 flex-shrink-0" />
                        AI 요약창 열기
                      </button>
                    )}

                    {/* AI 세션 시작/끝 토글 버튼 - GROUP 전용 */}
                    {isGroupThread && (aiPermissions.sessionStart.allowed || aiPermissions.sessionEnd.allowed) && (
                      <button
                        onClick={() => {
                          if (!isSessionActive) {
                            // 세션 시작
                            requestAICommand("SESSION_START", undefined);
                            setIsSessionActive(true);
                          } else {
                            // 세션 끝
                            requestAICommand("SESSION_END", undefined);
                            setIsSessionActive(false);
                          }
                          setIsMenuOpen(false);
                        }}
                        className={cls(
                          "flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-left text-sm transition-colors",
                          isSessionActive
                            ? "bg-[color:var(--color-primary)] text-white hover:opacity-90"
                            : "hover:bg-[color:var(--chatdock-bg-hover)]"
                        )}
                      >
                        <div className={cls("w-2 h-2 rounded-full flex-shrink-0", isSessionActive ? "bg-white animate-pulse" : "bg-red-500")} />
                        {isSessionActive ? "세션 종료" : "세션 시작"}
                      </button>
                    )}
                    {isGroupThread && aiPermissions.sessionClosing.allowed && (
                      <button
                        onClick={() => {
                          requestAICommand("SESSION_CLOSING", undefined);
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                      >
                        <MessageCircle className="w-4 h-4 flex-shrink-0" />
                        마감문 생성
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 일반 기능 섹션 */}
              <div className="border-b-2 border-[color:var(--chatdock-border-subtle)] py-2">
                <div className="grid grid-cols-2 gap-2 px-2">
                  {createEvent && (
                    <button
                      onClick={handleOpenEventModal}
                      className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                    >
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      일정 추가
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsNoticeDockOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[color:var(--chatdock-bg-hover)] text-left text-sm"
                  >
                    <Bell className="w-4 h-4 flex-shrink-0" />
                    공지
                  </button>
                </div>
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
          const attachment = m.attachment;
          const isImageMessage = m.type === "IMAGE" && attachment?.url;

          const renderAttachment = () => {
            if (!attachment) return null;
            return (
              <div className="space-y-2">
                {isImageMessage && (
                  <div className="overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--chatdock-border-subtle)] bg-[color:var(--chatdock-bg-elev-2)]">
                    <img
                      src={attachment.url}
                      alt={attachment.name || "이미지"}
                      className="max-h-64 w-full object-contain bg-black/5"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-[color:var(--chatdock-fg-primary)] break-all">
                  <span className="font-semibold">{attachment.name || (isImageMessage ? "이미지" : "파일")}</span>
                  {attachment.size && (
                    <span className="text-xs text-[color:var(--chatdock-fg-muted)]">{formatFileSize(attachment.size)}</span>
                  )}
                  {attachment.downloadUrl && (
                    <a
                      href={attachment.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[color:var(--color-primary)] underline-offset-2 hover:underline"
                    >
                      다운로드
                    </a>
                  )}
                </div>
                {m.text && !isImageMessage && (
                  <div className="text-sm whitespace-pre-wrap break-words">{m.text}</div>
                )}
              </div>
            );
          };

          const renderMessageContent = () => {
            if (isHidden) return <div className="text-sm leading-snug whitespace-pre-wrap break-words">가려진 메시지</div>;
            if (attachment) return renderAttachment();
            return <div className="text-sm leading-snug whitespace-pre-wrap break-words">{m.text}</div>;
          };
          return (
            <div key={m.id} className="relative group">
              <div className={cls("flex items-start gap-1 w-full", mine ? "justify-end" : "justify-start")}> 
                {mine ? (
                  <>
                    {/* 메시지 메뉴 버튼 (왼쪽) */}
                    <div className="relative" ref={messageMenuOpen === m.id ? messageMenuRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (messageMenuOpen !== m.id) {
                            // Initialize menu position near the button
                            const buttonRect = (e.target as HTMLElement).getBoundingClientRect();
                            const menuWidth = 192; // w-48
                            const margin = 12;

                            setMessageMenuPositions((prev) => ({
                              ...prev,
                              [m.id]: {
                                left: Math.max(margin, Math.min(buttonRect.left - menuWidth - 8, window.innerWidth - menuWidth - margin)),
                                top: Math.max(margin, buttonRect.top),
                              },
                            }));
                          }
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

                      {messageMenuOpen === m.id && messageMenuPositions[m.id] && (
                        <div
                          className="fixed w-48 rounded-[var(--radius-md)] border border-[color:var(--chatdock-border-strong)] bg-[color:var(--chatdock-bg-elev-1)] shadow-2xl overflow-hidden z-[120]"
                          style={{ left: messageMenuPositions[m.id].left, top: messageMenuPositions[m.id].top }}
                          onPointerMove={handleMessageMenuDragMove}
                          onPointerUp={handleMessageMenuDragEnd}
                          onPointerCancel={handleMessageMenuDragEnd}
                        >
                          {/* Draggable header */}
                          <div
                            className="flex items-center justify-between px-3 py-1.5 border-b border-[color:var(--chatdock-border-subtle)] cursor-move bg-[color:var(--chatdock-bg-elev-2)]"
                            onPointerDown={(e) => handleMessageMenuDragStart(m.id, e)}
                          >
                            <div className="text-xs font-semibold text-[color:var(--chatdock-fg-primary)]">메시지 메뉴</div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMessageMenuOpen(null);
                              }}
                              className="w-5 h-5 grid place-items-center rounded-[var(--radius-sm)] hover:bg-[color:var(--chatdock-bg-hover)] text-[color:var(--chatdock-fg-muted)]"
                              aria-label="메뉴 닫기"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div>
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

                          </div>
                        </div>
                      )}
                    </div>

                    {/* 메시지 버블 (오른쪽) */}
                    <div className={cls(
                      "max-w-[75%] px-3 py-2 rounded-[var(--radius-lg)] transition-opacity",
                      "bg-[color:var(--color-accent)] text-[color:var(--chatdock-on-accent)]",
                      isHidden && "opacity-30 blur-sm"
                    )}>
                      {renderMessageContent()}
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
                      {renderMessageContent()}
                      <div className="mt-1 text-[10px] text-[color:var(--chatdock-fg-muted)]">
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </div>
                    </div>

                    {/* 메시지 메뉴 버튼 (오른쪽) */}
                    <div className="relative" ref={messageMenuOpen === m.id ? messageMenuRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (messageMenuOpen !== m.id) {
                            // Initialize menu position near the button
                            const buttonRect = (e.target as HTMLElement).getBoundingClientRect();
                            const menuWidth = 192; // w-48
                            const margin = 12;

                            setMessageMenuPositions((prev) => ({
                              ...prev,
                              [m.id]: {
                                left: Math.max(margin, Math.min(buttonRect.right + 8, window.innerWidth - menuWidth - margin)),
                                top: Math.max(margin, buttonRect.top),
                              },
                            }));
                          }
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

                      {messageMenuOpen === m.id && messageMenuPositions[m.id] && (
                        <div
                          className="fixed w-48 rounded-[var(--radius-md)] border border-[color:var(--chatdock-border-strong)] bg-[color:var(--chatdock-bg-elev-1)] shadow-2xl overflow-hidden z-[120]"
                          style={{ left: messageMenuPositions[m.id].left, top: messageMenuPositions[m.id].top }}
                          onPointerMove={handleMessageMenuDragMove}
                          onPointerUp={handleMessageMenuDragEnd}
                          onPointerCancel={handleMessageMenuDragEnd}
                        >
                          {/* Draggable header */}
                          <div
                            className="flex items-center justify-between px-3 py-1.5 border-b border-[color:var(--chatdock-border-subtle)] cursor-move bg-[color:var(--chatdock-bg-elev-2)]"
                            onPointerDown={(e) => handleMessageMenuDragStart(m.id, e)}
                          >
                            <div className="text-xs font-semibold text-[color:var(--chatdock-fg-primary)]">메시지 메뉴</div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMessageMenuOpen(null);
                              }}
                              className="w-5 h-5 grid place-items-center rounded-[var(--radius-sm)] hover:bg-[color:var(--chatdock-bg-hover)] text-[color:var(--chatdock-fg-muted)]"
                              aria-label="메뉴 닫기"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div>
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

                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

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
          onSend(v, currentUserRole);
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

      {profileTarget && profileCardPosition && (
        <div
          className="fixed z-[120] w-72 rounded-[var(--radius-lg)] border border-[color:var(--chatdock-border-strong)] bg-[color:var(--chatdock-bg-elev-2)] shadow-2xl"
          style={{ top: profileCardPosition.top, left: profileCardPosition.left }}
          onPointerMove={handleProfileCardDragMove}
          onPointerUp={handleProfileCardDragEnd}
          onPointerCancel={handleProfileCardDragEnd}
        >
          <div
            className="flex items-start justify-between gap-2 px-3 py-2 border-b border-[color:var(--chatdock-border-subtle)] cursor-move"
            onPointerDown={handleProfileCardDragStart}
          >
            <div>
              <div className="font-semibold text-[color:var(--chatdock-fg-primary)]">{profileTarget.nickname ?? "사용자 정보"}</div>
              <div className="text-xs text-[color:var(--chatdock-fg-muted)]">
                {targetUserRole ? `권한: ${targetUserRole}` : "권한 정보 없음"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setProfileTarget(null);
                setProfileCardPosition(null);
              }}
              className="w-7 h-7 grid place-items-center rounded-[var(--radius-sm)] border border-[color:var(--chatdock-border-subtle)] hover:bg-[color:var(--chatdock-bg-hover)] text-[color:var(--chatdock-fg-muted)]"
              aria-label="프로필 카드 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 py-3 text-[color:var(--chatdock-fg-primary)]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => profileTarget.userId && handleCreateDirectRoom(profileTarget.userId, profileTarget.nickname)}
                disabled={!profileTarget.userId || createRoomMutation.isPending || !currentUserIdNumber}
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
        </div>
      )}

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
        isOpen={aiDockOpen}
        anchorRef={dockContainerRef}
        onClose={() => onCloseAIDock?.()}
        onMinimize={() => onCloseAIDock?.()}
        messages={aiDockMessagesSafe}
        isLoading={aiDockLoadingSafe}
        onSend={onAIDockSend}
      />

      {/* Notice Dock */}
      <NoticeDock
        isOpen={isNoticeDockOpen}
        onClose={() => setIsNoticeDockOpen(false)}
        onMinimize={() => setIsNoticeDockOpen(false)}
        hasPermission={noticePermission.status === "success" ? noticePermission.hasPermission : undefined}
        permissionStatus={noticePermission.status}
        permissionErrorMessage={noticePermission.errorMessage}
        onRetryPermission={loadNoticePermission}
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

  const [aiDockMessagesByRoom, setAiDockMessagesByRoom] = useState<Record<string, AIMessage[]>>({});
  const [aiDockLoadingByRoom, setAiDockLoadingByRoom] = useState<Record<string, boolean>>({});
  const [aiDockOpenByRoom, setAiDockOpenByRoom] = useState<Record<string, boolean>>({});

  // AI 요청 mutation
  const requestAIMutation = useRequestAI();

  const ensureAiDockState = useCallback((roomId: string) => {
    setAiDockMessagesByRoom((prev) => {
      if (prev[roomId]) return prev;
      return {
        ...prev,
        [roomId]: [
          {
            id: `welcome-${roomId}`,
            type: "ai",
            text: "안녕하세요! AI 어시스턴트입니다. 무엇을 도와드릴까요?",
            timestamp: Date.now(),
          },
        ],
      };
    });
  }, []);

  const addAiDockMessage = useCallback(
    (roomId: string, message: Omit<AIMessage, "id" | "timestamp"> & Partial<Pick<AIMessage, "id" | "timestamp">>) => {
      setAiDockMessagesByRoom((prev) => {
        const baseMessages =
          prev[roomId] || [
            {
              id: `welcome-${roomId}`,
              type: "ai",
              text: "안녕하세요! AI 어시스턴트입니다. 무엇을 도와드릴까요?",
              timestamp: Date.now(),
            },
          ];

        const nextMessage: AIMessage = {
          id: message.id ?? `ai-${Date.now()}`,
          timestamp: message.timestamp ?? Date.now(),
          ...message,
        } as AIMessage;

        return {
          ...prev,
          [roomId]: [...baseMessages, nextMessage],
        };
      });
    },
    []
  );

  const setAiDockLoading = useCallback((roomId: string, isLoading: boolean) => {
    setAiDockLoadingByRoom((prev) => ({ ...prev, [roomId]: isLoading }));
  }, []);

  const openAiDock = useCallback(
    (roomId: string) => {
      ensureAiDockState(roomId);
      setAiDockOpenByRoom((prev) => ({ ...prev, [roomId]: true }));
    },
    [ensureAiDockState]
  );

  const closeAiDock = useCallback((roomId: string) => {
    setAiDockOpenByRoom((prev) => ({ ...prev, [roomId]: false }));
  }, []);

  const triggerAiRequest = useCallback(
    (roomId: number, command: AiCommandType, note?: string) => {
      const roomKey = roomId.toString();
      openAiDock(roomKey);
      setAiDockLoading(roomKey, true);
      addAiDockMessage(roomKey, { type: "user", text: formatAiRequestMessage(command, note) });

      requestAIMutation.mutate(
        { roomId, command, note },
        {
          onSuccess: (data) => {
            const payload = data.payload as SessionClosingPayload | null;

            if (command === "SESSION_CLOSING" && payload && !payload.fallback) {
              addAiDockMessage(roomKey, {
                type: "ai",
                text: formatAiJobMessage(command, data),
                sessionClosing: {
                  payload,
                  meta: { jobId: data.jobId, latencyMs: data.latencyMs },
                },
              });
            } else {
              addAiDockMessage(roomKey, { type: "ai", text: formatAiJobMessage(command, data) });
            }

            toast.show({ title: "AI 작업이 완료되었습니다.", variant: "success" });
          },
          onError: (error: any) => {
            const errorMessage = buildAiErrorMessage(error);
            addAiDockMessage(roomKey, { type: "ai", text: `요청 실패: ${errorMessage}` });
            toast.show({ title: errorMessage, variant: "error" });
          },
          onSettled: () => {
            setAiDockLoading(roomKey, false);
          },
        }
      );
    },
    [addAiDockMessage, openAiDock, requestAIMutation, setAiDockLoading, toast]
  );

  const handleAiDockSend = useCallback(
    (roomId: string, text: string) => {
      if (!text.trim()) return;
      const numericRoomId = parseInt(roomId, 10);
      if (Number.isNaN(numericRoomId)) return;

      const { command, note } = parseAiShortcut(text.trim());
      triggerAiRequest(numericRoomId, command, note);
    },
    [triggerAiRequest]
  );

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

      // scope를 ChatCategory로 매핑
      // 백엔드가 scope를 반환하지 않을 경우 임시 fallback 로직
      let category: ChatCategory;
      if (room.scope) {
        category = room.scope as ChatCategory;
      } else {
        // TODO: 백엔드에서 scope 추가 후 이 fallback 로직 제거
        // 임시 로직: 1:1 채팅방 이름 패턴으로 추측
        if (room.name.includes('님과의 채팅')) {
          category = "PRIVATE";
        } else {
          category = "GROUP"; // 기본값
        }
      }

      return {
        id: threadId,
        users: [{ id: "unknown", name: room.name }],
        category,
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
  const togglePin = (_threadId: string) => {
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
  const [messageLimits, setMessageLimits] = useState<Record<string, number>>({});
  const [messageHasMore, setMessageHasMore] = useState<Record<string, boolean>>({});
  const [typing] = useState<Record<string, string[]>>({});
  const [panelOpen, setPanelOpen] = useState(false); // for mobile/tap
  const [activeDropThreadId, setActiveDropThreadId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null);
  const [pendingPreviews, setPendingPreviews] = useState<Record<string, string>>({});
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const resetPendingUploads = useCallback(() => {
    Object.values(pendingPreviews).forEach((url) => URL.revokeObjectURL(url));
    setPendingFiles([]);
    setPendingThreadId(null);
    setPendingPreviews({});
    setIsUploadModalOpen(false);
    setUploadProgress(0);
    setActiveDropThreadId(null);
  }, [pendingPreviews]);

  useEffect(() => {
    return () => {
      Object.values(pendingPreviews).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pendingPreviews]);

  const handleThreadDragOver = (event: React.DragEvent, threadId: string) => {
    if (!event.dataTransfer?.files?.length) return;
    event.preventDefault();
    setActiveDropThreadId(threadId);
  };

  const handleThreadDragLeave = (event: React.DragEvent, threadId: string) => {
    event.preventDefault();
    setActiveDropThreadId((prev) => (prev === threadId ? null : prev));
  };

  const handleThreadDrop = (event: React.DragEvent, threadId: string) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files || []);
    setActiveDropThreadId(null);

    if (!files.length) return;

    const previews: Record<string, string> = {};
    files.forEach((file) => {
      if (isImageFile(file.type)) {
        previews[file.name] = URL.createObjectURL(file);
      }
    });

    setPendingFiles(files);
    setPendingThreadId(threadId);
    setPendingPreviews(previews);
    setIsUploadModalOpen(true);
  };

  const handleConfirmFileSend = async () => {
    if (!pendingThreadId || pendingFiles.length === 0 || !myUserId) {
      resetPendingUploads();
      return;
    }

    const roomId = parseInt(pendingThreadId, 10);
    const targetId = composeFileTargetId("CHAT", myUserId, roomId);
    setUploadProgress(0);

    try {
      const uploaded = await uploadFiles({
        files: pendingFiles,
        targetType: "CHAT",
        targetId,
        onProgress: (progress) => setUploadProgress(progress),
      });

      uploaded.forEach((attachment) => {
        const payload = {
          url: attachment.fileUrl || attachment.url,
          name: attachment.fileName || attachment.originalFilename,
          size: attachment.fileSize || attachment.size,
          mimeType: attachment.mimeType || attachment.contentType,
          downloadUrl: attachment.downloadUrl || attachment.url,
        };
        const isImage = isImageFile(payload.mimeType || "");
        const text = isImage ? "[이미지]" : payload.name || "파일";

        sendMessageMutation.mutate({
          senderId: myUserId,
          roomId,
          type: isImage ? "IMAGE" : "FILE",
          body: { text, extra: JSON.stringify(payload) },
          replyToMsgId: null,
        });
      });

      toast.show({ title: "파일을 전송했습니다.", variant: "success" });
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "파일 전송에 실패했습니다.";
      toast.show({ title: message, variant: "error" });
    } finally {
      resetPendingUploads();
    }
  };

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
        const limit = messageLimits[threadId] ?? DEFAULT_MESSAGE_LIMIT;
        const response = await chatService.getRoomMessages({ roomId, limit });

        // 백엔드 메시지를 UI 형식으로 변환
        const convertedMessages: ChatMessage[] = response.items
          .filter((msg) => !shouldHideAiMessage(msg))
          .map(mapRoomMessageToChatMessage)
          .sort((a, b) => a.createdAt - b.createdAt);

        setMessages((prev) => ({
          ...prev,
          [threadId]: convertedMessages,
        }));

        setMessageLimits((prev) => ({ ...prev, [threadId]: limit }));
        setMessageHasMore((prev) => ({ ...prev, [threadId]: response.items.length >= limit }));

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
  }, [loadingMessages, messageLimits, messages, openThreadIds, queryClient]);

  const loadOlderMessages = useCallback(
    async (threadId: string) => {
      if (loadingMessages[threadId]) {
        return false;
      }

      const currentLimit = messageLimits[threadId] ?? DEFAULT_MESSAGE_LIMIT;
      const nextLimit = currentLimit + 40;

      setLoadingMessages((prev) => ({ ...prev, [threadId]: true }));

      try {
        const roomId = parseInt(threadId, 10);
        const response = await chatService.getRoomMessages({ roomId, limit: nextLimit });

        const convertedMessages: ChatMessage[] = response.items
          .filter((msg) => !shouldHideAiMessage(msg))
          .map(mapRoomMessageToChatMessage)
          .sort((a, b) => a.createdAt - b.createdAt);

        let added = false;
        setMessages((prev) => {
          const existing = prev[threadId] || [];
          added = convertedMessages.length > existing.length;
          return {
            ...prev,
            [threadId]: convertedMessages,
          };
        });

        setMessageLimits((prev) => ({ ...prev, [threadId]: nextLimit }));
        setMessageHasMore((prev) => ({ ...prev, [threadId]: response.items.length >= nextLimit }));

        return added;
      } catch (error) {
        console.error("Failed to load older messages for thread:", threadId, error);
        return false;
      } finally {
        setLoadingMessages((prev) => ({ ...prev, [threadId]: false }));
      }
    },
    [loadingMessages, messageLimits]
  );

  // ===== 웹소켓 연결 관리 =====
  // openThreadIds를 roomId(number)로 변환
  const openRoomIds = useMemo(() => {
    return openThreadIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
  }, [openThreadIds]);

  // 웹소켓 메시지 수신 핸들러
  const handleWebSocketMessage = useCallback((roomId: number, message: WebSocketMessage) => {
    const threadId = roomId.toString();

    if (shouldHideAiMessage(message as any)) {
      return;
    }

    // 백엔드 메시지를 UI 형식으로 변환
    const convertedMessage: ChatMessage = {
      id: message.id.toString(),
      threadId: threadId,
      fromId: message.senderId.toString(),
      senderId: message.senderId.toString(),
      text: message.body.text ?? "",
      createdAt: new Date(message.createdAt).getTime(),
      senderNickname: message.senderNickname,
      senderRole: message.senderRole,
      type: message.type,
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

  const sendMessage = (threadId: string, text: string, currentUserRole?: string | null) => {
    const roomId = parseInt(threadId, 10);
    const targetThread = threads.find((t) => t.id === threadId);

    if (!myUserId) {
      toast.show({ title: "사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.", variant: "warning" });
      return;
    }

    if (!targetThread) {
      toast.show({ title: "채팅방 정보를 찾을 수 없습니다.", variant: "error" });
      return;
    }

    // @ai 메시지 감지 및 처리
    if (text.trim().startsWith("@ai")) {
      // @ai 제거하고 나머지 파싱
      const aiContent = text.trim().substring(3).trim();

      const { command, note } = parseAiShortcut(aiContent);

      const permission = canUseAI(targetThread.category, currentUserRole, command);
      if (!permission.allowed) {
        toast.show({ title: permission.reason || "AI 기능을 사용할 수 없습니다.", variant: "warning" });
        return;
      }

      // AI 요청 전송
      triggerAiRequest(roomId, command, note);

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
              className={cls(
                activeDropThreadId === id &&
                  "ring-2 ring-[color:var(--color-accent)] ring-offset-2 ring-offset-[color:var(--chatdock-bg-elev-2)]"
              )}
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
              onDragOver={(e) => handleThreadDragOver(e, id)}
              onDragLeave={(e) => handleThreadDragLeave(e, id)}
              onDrop={(e) => handleThreadDrop(e, id)}
            >
              <ChatWindow
                me={me}
                thread={t}
                messages={msgs}
                typingUserIds={typingIds}
                onClose={() => closeThread(id)}
                onMinimize={() => minimizeThread(id)}
                onSend={(text, currentUserRole) => sendMessage(id, text, currentUserRole)}
                onRequestAI={(command, note) => {
                  const roomId = parseInt(id, 10);
                  triggerAiRequest(roomId, command, note);
                }}
                aiMessages={aiDockMessagesByRoom[id] || []}
                aiIsLoading={aiDockLoadingByRoom[id] || false}
                isAIDockOpen={aiDockOpenByRoom[id] || false}
                onOpenAIDock={() => openAiDock(id)}
                onCloseAIDock={() => closeAiDock(id)}
                onAIDockSend={(text) => handleAiDockSend(id, text)}
                onLoadMoreMessages={() => loadOlderMessages(id)}
                hasMoreMessages={messageHasMore[id] ?? true}
                isLoadingMessages={!!loadingMessages[id]}
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
                isMuted={false} // TODO: 백엔드에서 뮤트 상태 받아오기
                currentUserIdNumber={myUserIdNumber}
              />
            </div>
          );
        })}

        {isUploadModalOpen && pendingThreadId && (
          <div
            className="fixed inset-0 z-[140] bg-black/50 flex items-center justify-center"
            onClick={resetPendingUploads}
          >
            <div
              className="w-[480px] max-w-[90vw] rounded-[var(--radius-lg)] border border-[color:var(--chatdock-border-strong)] bg-[color:var(--chatdock-bg-elev-1)] shadow-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <div className="text-lg font-semibold text-[color:var(--chatdock-fg-primary)]">파일 전송</div>
                  <div className="text-xs text-[color:var(--chatdock-fg-muted)]">
                    {threads.find((t) => t.id === pendingThreadId)?.users.map((u) => u.name).join(", ") || "채팅방"}
                    에 보낼 파일을 확인하세요.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetPendingUploads}
                  className="w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-[color:var(--chatdock-bg-hover)] text-[color:var(--chatdock-fg-muted)]"
                  aria-label="파일 전송 모달 닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-3 mb-2">
                {pendingFiles.map((file) => {
                  const preview = pendingPreviews[file.name];
                  const isImage = isImageFile(file.type);
                  return (
                    <div
                      key={file.name}
                      className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[color:var(--chatdock-border-subtle)] p-2 bg-[color:var(--chatdock-bg-elev-2)]"
                    >
                      <div className="w-14 h-14 rounded-md overflow-hidden bg-[color:var(--chatdock-bg-elev-1)] grid place-items-center text-xl">
                        {preview ? (
                          <img src={preview} alt={file.name} className="w-full h-full object-cover" />
                        ) : isImage ? (
                          "🖼️"
                        ) : (
                          "📎"
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[color:var(--chatdock-fg-primary)] break-all">{file.name}</div>
                        <div className="text-xs text-[color:var(--chatdock-fg-muted)]">{formatFileSize(file.size)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {uploadProgress > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-[color:var(--chatdock-fg-muted)] mb-1">업로드 {uploadProgress}%</div>
                  <div className="w-full h-2 rounded-full bg-[color:var(--chatdock-bg-elev-2)] overflow-hidden">
                    <div
                      className="h-full bg-[color:var(--color-accent)]"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetPendingUploads}
                  className="px-4 py-2 rounded-[var(--radius-md)] border border-[color:var(--chatdock-border-subtle)] bg-[color:var(--chatdock-bg-elev-2)] hover:bg-[color:var(--chatdock-bg-hover)] text-sm"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFileSend}
                  disabled={uploadProgress > 0 && uploadProgress < 100}
                  className="px-4 py-2 rounded-[var(--radius-md)] bg-[color:var(--color-primary)] text-[color:var(--on-primary)] hover:opacity-90 text-sm disabled:opacity-60"
                >
                  전송
                </button>
              </div>
            </div>
          </div>
        )}

    </div>
  );
}
