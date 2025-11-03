import React, { useEffect, useRef, useState } from "react";
// Optional: npm i socket.io-client (when backend ready)
// import { io, Socket } from "socket.io-client";
import { X, Minus, Send, Circle, Loader2, MessageCircle } from "lucide-react";
import { useThreads, useInfiniteMessages, useSendMessage, useMarkAsRead } from "@/hooks/api";
import type {
  ChatThread as ApiChatThread,
  ChatMessage as ApiChatMessage,
  ChatUser as ApiChatUser,
} from "@/types";

/**
 * ChatDock — Facebook DM 스타일의 우측 고정 채팅 도크
 * - 페이지 우측에 항상 떠 있는 채팅 버튼/도크
 * - 스레드(대화방) 목록에서 클릭하면 작은 채팅 윈도우가 우측에 뜸 (동시 여러 개)
 * - 토큰 기반 색/테두리/라운드만 사용 (tokens.css)
 * - 소켓은 훅 분리 (useMockSocket / useSocket) — 백 준비 전에는 모킹으로 동작
 */



const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");

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
  fromId: string;
  text: string;
  createdAt: number; // epoch ms
}

export interface ChatThread {
  id: string;
  users: ChatUser[]; // participants
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

// ===== Type mapping functions =====
// Convert API types to ChatDock types
function mapApiUserToLocal(apiUser: ApiChatUser): ChatUser {
  return {
    id: apiUser.id,
    name: apiUser.nickname,
    avatarUrl: apiUser.profileImage,
    online: apiUser.isOnline,
  };
}

function mapApiMessageToLocal(apiMessage: ApiChatMessage): ChatMessage {
  return {
    id: apiMessage.id,
    threadId: apiMessage.threadId,
    fromId: apiMessage.senderId,
    text: apiMessage.content,
    createdAt: new Date(apiMessage.createdAt).getTime(),
  };
}

function mapApiThreadToLocal(apiThread: ApiChatThread): ChatThread {
  return {
    id: apiThread.id,
    users: apiThread.participants.map(mapApiUserToLocal),
    lastMessage: apiThread.lastMessage ? mapApiMessageToLocal(apiThread.lastMessage) : undefined,
    unreadCount: apiThread.unreadCount,
  };
}

// ===== Mock socket (dev only) =====
// Type-safe (no `any`) emit/on with event-specific payloads

type TypingPayload = { threadId: string; userId: string; typing: boolean };

type ListenerMap = {
  message: Array<(m: ChatMessage) => void>;
  typing: Array<(d: TypingPayload) => void>;
};

function useMockSocket() {
  const listeners = useRef<ListenerMap>({ message: [], typing: [] });

  function emit(event: "message", payload: ChatMessage): void;
  function emit(event: "typing", payload: TypingPayload): void;
  function emit(event: "message" | "typing", payload: ChatMessage | TypingPayload) {
    if (event === "message") {
      const fns = listeners.current.message;
      for (const fn of fns) fn(payload as ChatMessage);
    } else {
      const fns = listeners.current.typing;
      for (const fn of fns) fn(payload as TypingPayload);
    }
  }

  function on(event: "message", fn: (m: ChatMessage) => void): () => void;
  function on(event: "typing", fn: (d: TypingPayload) => void): () => void;
  function on(
    event: "message" | "typing",
    fn: ((m: ChatMessage) => void) | ((d: TypingPayload) => void)
  ) {
    if (event === "message") {
      const typed = fn as (m: ChatMessage) => void;
      listeners.current.message.push(typed);
      return () => {
        listeners.current.message = listeners.current.message.filter((x) => x !== typed);
      };
    } else {
      const typed = fn as (d: TypingPayload) => void;
      listeners.current.typing.push(typed);
      return () => {
        listeners.current.typing = listeners.current.typing.filter((x) => x !== typed);
      };
    }
  }

  return {
    on,
    sendMessage: (m: ChatMessage) => {
      setTimeout(() => emit("message", m), 200); // echo
    },
    setTyping: (threadId: string, userId: string, typing: boolean) => {
      emit("typing", { threadId, userId, typing });
    },
  };
}

// ===== Chat window container with message fetching =====
function ChatWindowContainer({
  me,
  thread,
  typingUserIds,
  onClose,
  onMinimize,
  onSend,
  __onDragStart,
}: {
  me: ChatUser;
  thread: ChatThread;
  typingUserIds: string[];
  onClose: () => void;
  onMinimize: () => void;
  onSend: (text: string) => void;
  __onDragStart?: (e: React.PointerEvent) => void;
}) {
  // Fetch messages for this thread using infinite query
  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteMessages(thread.id, 50);

  // Flatten all pages into single message array and convert to local format
  const messages: ChatMessage[] = React.useMemo(() => {
    if (!messagesData?.pages) return [];
    return messagesData.pages
      .flatMap((page) => page.items)
      .map(mapApiMessageToLocal);
  }, [messagesData]);

  if (isLoading) {
    return (
      <div className="w-[320px] h-[420px] flex items-center justify-center rounded-[var(--radius-lg)] bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-strong)] shadow-xl">
        <Loader2 className="w-6 h-6 animate-spin text-[color:var(--color-fg-muted)]" />
      </div>
    );
  }

  return (
    <ChatWindow
      me={me}
      thread={thread}
      messages={messages}
      typingUserIds={typingUserIds}
      onClose={onClose}
      onMinimize={onMinimize}
      onSend={onSend}
      __onDragStart={__onDragStart}
    />
  );
}

// ===== Chat window =====
function Avatar({ user, size = 24 }: { user: ChatUser; size?: number }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border border-[color:var(--color-border-subtle)]"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] grid place-items-center text-[10px] text-[color:var(--color-fg-muted)]"
      aria-label={user.name}
    >
      {user.name?.[0] ?? "U"}
    </div>
  );
}

function ThreadChip({ thread, onOpen }: { thread: ChatThread; onOpen: (t: ChatThread) => void }) {
  const title = thread.users.map((u) => u.name).join(", ");
  const unread = Math.min(99, thread.unreadCount || 0);
  return (
    <button
      onClick={() => onOpen(thread)}
      className="relative w-full flex items-center gap-2 p-2 rounded-[var(--radius-md)] hover:bg-[color:var(--color-bg-hover)] text-left"
      title={title}
    >
      <div className="relative">
        <Avatar user={thread.users[0]} />
        {thread.users[0]?.online && (
          <Circle className="absolute -right-1 -bottom-1 w-3 h-3" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate text-[color:var(--color-fg-primary)]">{title}</div>
        {thread.lastMessage && (
          <div className="text-xs text-[color:var(--color-fg-muted)] truncate">
            {thread.lastMessage.text}
          </div>
        )}
      </div>
      {unread > 0 && (
        <span className="ml-auto min-w-5 h-5 px-1 grid place-items-center rounded-full text-[10px] font-bold bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]">
          {unread}
        </span>
      )}
    </button>
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
                      __onDragStart,

                    }: {
  me: ChatUser;
  thread: ChatThread;
  messages: ChatMessage[];
  typingUserIds?: string[];
  onClose: () => void;
  onMinimize: () => void;
  onSend: (text: string) => void;
  __onDragStart? : (e: React.PointerEvent) => void;
}) {
  const [text, setText] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [messages]);

  const title = thread.users.map((u) => u.name).join(", ");

  return (
    <div className="w-[320px] h-[420px] flex flex-col overflow-hidden
             rounded-[var(--radius-lg)]
             bg-[color:var(--color-bg-elev-2)]
             border border-[color:var(--color-border-strong)]
             shadow-xl">
      {/* header */}
      <div className="h-11 flex items-center gap-2 px-2 border-b border-[color:var(--color-border-subtle)] cursor-move select-none"
        onPointerDown={__onDragStart}
      >
        <Avatar user={thread.users[0]} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{title}</div>
          <div className="text-[10px] text-[color:var(--color-fg-muted)] truncate">
            {typingUserIds.length > 0 ? "입력 중…" : "대화 중"}
          </div>
        </div>
        <button onClick={onMinimize} className="w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-[color:var(--color-bg-hover)]" title="최소화">
          <Minus className="w-4 h-4" />
        </button>
        <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-[color:var(--color-bg-hover)]" title="닫기">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* body */}
      <div ref={boxRef} className="flex-1 overflow-auto p-3 space-y-2">
        {messages.map((m) => {
          const mine = m.fromId === me.id;
          return (
            <div key={m.id} className={cls("max-w-[75%] px-3 py-2 rounded-[var(--radius-lg)]", mine ? "ml-auto bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]" : "bg-[color:var(--color-bg-elev-2)] text-[color:var(--color-fg-primary)]") }>
              <div className="text-sm leading-snug whitespace-pre-wrap break-words">{m.text}</div>
              <div className={cls("mt-1 text-[10px]", mine ? "opacity-80" : "text-[color:var(--color-fg-muted)]")}>{new Date(m.createdAt).toLocaleTimeString()}</div>
            </div>
          );
        })}
        {typingUserIds.length > 0 && (
          <div className="inline-flex items-center gap-2 text-[color:var(--color-fg-muted)] text-xs">
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
        className="p-2 border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)]"
      >
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="flex-1 h-9 px-3 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/40"
          />
          <button type="submit" className="h-9 px-3 rounded-[var(--radius-md)] border border-[color:var(--btn-primary-border)] bg-[color:var(--btn-primary-bg)] text-[color:var(--btn-primary-fg)] inline-flex items-center gap-1">
            <Send className="w-4 h-4" />
            보내기
          </button>
        </div>
      </form>
    </div>
  );
}

// ===== Dock (collapsed icon that expands on hover/click) =====
export default function ChatDock() {
  const [zMap, setZMap] = useState<Record<string, number>>({});
  const zSeed = useRef(100); // 창 기본 z-index 기준보다 크게

  const bringToFront = (id: string) => {
    zSeed.current += 1;
    setZMap(prev => ({ ...prev, [id]: zSeed.current }));
  };

  // Fetch threads from API
  const { data: threadsData, isLoading: threadsLoading } = useThreads();
  const threads = threadsData?.items.map(mapApiThreadToLocal) || [];

  // Current user - TODO: get from auth context when available
  const me: ChatUser = { id: "me", name: "나", avatarUrl: "" };
  // ===== 추가 =====

// 채팅창 위치 상태 (픽셀 단위)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

// 드래그 중인 창 정보
  const dragInfo = useRef<{ id: string | null; offsetX: number; offsetY: number }>({
    id: null,
    offsetX: 0,
    offsetY: 0,
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

  const [openIds, setOpenIds] = useState<string[]>([]); // opened window threadIds (order matters)
  const [typing, setTyping] = useState<Record<string, string[]>>({});
  const [panelOpen, setPanelOpen] = useState(false); // for mobile/tap

  // API mutations
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();

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


  // TODO: Replace with real WebSocket when backend is ready
  const socket = useMockSocket();
  useEffect(() => {
    // Keep typing indicator socket for now (will be replaced with real WebSocket)
    const offTyping = socket.on("typing", ({ threadId, userId, typing }: { threadId: string; userId: string; typing: boolean }) => {
      setTyping((prev) => {
        const list = new Set(prev[threadId] || []);
        if (typing) list.add(userId);
        else list.delete(userId);
        return { ...prev, [threadId]: [...list] };
      });
    });
    return () => {
      offTyping?.();
    };
  }, []);

  const unreadTotal = Math.min(99, threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0));

  const openThread = (t: ChatThread) => {
    setOpenIds((ids) => (ids.includes(t.id) ? ids : [...ids, t.id].slice(-3)));

    // Mark as read via API
    if (t.unreadCount && t.unreadCount > 0) {
      markAsReadMutation.mutate({ threadId: t.id });
    }

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

  const closeThread = (id: string) => setOpenIds((ids) => ids.filter((x) => x !== id));
  const minimizeThread = (id: string) => setOpenIds((ids) => [id, ...ids.filter((x) => x !== id)]); // move to leftmost

  const sendMessage = (threadId: string, text: string) => {
    sendMessageMutation.mutate({
      threadId,
      content: text,
      type: "TEXT",
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
          className="relative w-12 h-12 rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] shadow-md grid place-items-center"
          aria-label="채팅 열기"
        >
          <MessageCircle className="w-6 h-6 text-[color:var(--color-fg-primary)]" />
          {unreadTotal > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 grid place-items-center rounded-full text-[10px] font-bold bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]">
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
          <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] shadow-xl overflow-hidden">
            <div className="h-10 flex items-center justify-between px-2 border-b border-[color:var(--color-border-subtle)]">
              <div className="text-sm font-semibold">채팅</div>
              <button onClick={() => setPanelOpen(false)} className="text-xs text-[color:var(--color-fg-muted)] hover:underline">
                닫기
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto p-1">
              {threadsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[color:var(--color-fg-muted)]" />
                </div>
              ) : threads.length === 0 ? (
                <div className="py-8 text-center text-sm text-[color:var(--color-fg-muted)]">
                  채팅 내역이 없습니다
                </div>
              ) : (
                threads.map((t) => (
                  <ThreadChip
                    key={t.id}
                    thread={t}
                    onOpen={(thr) => {
                      openThread(thr);
                      setPanelOpen(false); // 항목 클릭하면 패널 닫기 (원하면 유지로 바꿔도 됨)
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating chat windows */}
      {openIds.map((id) => {
          const t = threads.find((x) => x.id === id);
          if (!t) return null;
          const typingIds = typing[id] || [];
          const pos = positions[id] || { x: 0, y: 0 };
          const z = zMap[id] ?? 61; // 기본값(다른 전역 UI 위)

          return (
            <div
              key={id}
              style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: z }}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
              onMouseDown={() => bringToFront(id)}   // ✅ 클릭 시 맨 위
            >
              <ChatWindowContainer
                me={me}
                thread={t}
                typingUserIds={typingIds}
                onClose={() => closeThread(id)}
                onMinimize={() => minimizeThread(id)}
                onSend={(text) => sendMessage(id, text)}
                __onDragStart={(e: React.PointerEvent) => onDragStart(id, e)}
              />
            </div>
          );
        })}

        </div>
  );

}


