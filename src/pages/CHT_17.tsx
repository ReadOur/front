import React, { useState } from "react";
import { MessageCircle, Search, Star, Users, Send, Loader2 } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import { ChatThread, ChatUser } from "@/features/message/ChatDock";
import { useThreads } from "@/hooks/api/useChat";

/**
 * CHT_17 - 채팅방 목록 페이지
 * - 모든 채팅방 목록 표시
 * - 검색 및 필터링
 * - 채팅방 클릭 시 Floating Dock에서 열기
 */

// Mock 데이터 (실제로는 API에서 가져옴)
const mockThreads: ChatThread[] = [
  {
    id: "t1",
    users: [{ id: "u1", name: "콩콩", online: true }],
    unreadCount: 2,
    lastMessage: {
      id: "m0",
      threadId: "t1",
      fromId: "u1",
      text: "오늘 저녁 뭐 먹어?",
      createdAt: Date.now() - 600000,
    },
  },
  {
    id: "t2",
    users: [{ id: "u2", name: "쭈꾸미", online: false }],
    lastMessage: {
      id: "m1",
      threadId: "t2",
      fromId: "u2",
      text: "파일 확인했어!",
      createdAt: Date.now() - 3600000,
    },
  },
  {
    id: "t3",
    users: [{ id: "u3", name: "자몽", online: true }],
    lastMessage: {
      id: "m2",
      threadId: "t3",
      fromId: "u3",
      text: "굿굿",
      createdAt: Date.now() - 7200000,
    },
  },
  {
    id: "t4",
    users: [{ id: "u4", name: "망고", online: false }],
    unreadCount: 5,
    lastMessage: {
      id: "m3",
      threadId: "t4",
      fromId: "u4",
      text: "내일 미팅 시간 확인 부탁해요",
      createdAt: Date.now() - 10800000,
    },
  },
  {
    id: "t5",
    users: [
      { id: "u5", name: "딸기", online: true },
      { id: "u6", name: "바나나" },
      { id: "u7", name: "오렌지" },
    ],
    unreadCount: 12,
    lastMessage: {
      id: "m4",
      threadId: "t5",
      fromId: "u5",
      text: "스터디 그룹에 오신 걸 환영합니다!",
      createdAt: Date.now() - 14400000,
    },
  },
];

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
}

function ThreadListItem({ thread }: { thread: ChatThread }) {
  const { openThread, isThreadOpen } = useChatContext();
  const isGroup = thread.users.length > 1;
  const displayName = isGroup
    ? `${thread.users.map((u) => u.name).join(", ")}`
    : thread.users[0]?.name || "알 수 없음";

  const isOpen = isThreadOpen(thread.id);

  return (
    <div
      className="flex items-start gap-3 p-4 hover:bg-[color:var(--color-bg-subtle)] cursor-pointer border-b border-[color:var(--color-border-subtle)] transition-colors"
      onClick={() => openThread(thread.id)}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {isGroup ? (
          <div className="w-12 h-12 rounded-full bg-[color:var(--color-primary)] text-[color:var(--on-primary)] grid place-items-center">
            <Users className="w-6 h-6" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-[color:var(--color-accent)] text-[color:var(--color-fg-primary)] grid place-items-center font-medium">
            {displayName.charAt(0)}
          </div>
        )}
        {!isGroup && thread.users[0]?.online && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[color:var(--color-bg)]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h3 className="font-medium text-[color:var(--color-fg-primary)] truncate">
            {displayName}
          </h3>
          {thread.lastMessage && (
            <span className="text-xs text-[color:var(--color-fg-muted)] flex-shrink-0">
              {formatRelativeTime(thread.lastMessage.createdAt)}
            </span>
          )}
        </div>
        {thread.lastMessage && (
          <p className="text-sm text-[color:var(--color-fg-muted)] truncate">
            {thread.lastMessage.text}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          {thread.unreadCount && thread.unreadCount > 0 ? (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-[color:var(--color-accent)] text-[color:var(--color-fg-primary)] rounded-full">
              {thread.unreadCount}
            </span>
          ) : null}
          {isOpen && (
            <span className="text-xs text-[color:var(--color-primary)] font-medium">
              Dock에서 열림
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CHT_17() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);

  // TODO: 백엔드 준비되면 useThreads 훅 사용
  // const { data, isLoading } = useThreads();
  // const threads = data?.items || [];

  // 현재는 mock 데이터 사용
  const threads = mockThreads;
  const isLoading = false;

  const filteredThreads = threads.filter((thread) => {
    const displayName = thread.users.map((u) => u.name).join(", ");
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-200px)] bg-[color:var(--color-bg)] rounded-[var(--radius-xl)] overflow-hidden border border-[color:var(--color-border-subtle)]">
      {/* 왼쪽: 채팅방 목록 */}
      <div className="w-full md:w-96 flex flex-col border-r border-[color:var(--color-border-subtle)]">
        {/* 헤더 */}
        <div className="p-4 border-b border-[color:var(--color-border-subtle)]">
          <h1 className="text-xl font-bold text-[color:var(--color-fg-primary)] mb-3 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            채팅
          </h1>
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--color-fg-muted)]" />
            <input
              type="text"
              placeholder="채팅방 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-[var(--radius-md)] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/40 text-[color:var(--color-fg-primary)]"
            />
          </div>
        </div>

        {/* 채팅방 목록 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 flex flex-col items-center justify-center text-[color:var(--color-fg-muted)]">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p>로딩 중...</p>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-[color:var(--color-fg-muted)]">
              {searchQuery ? "검색 결과가 없습니다" : "채팅방이 없습니다"}
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <ThreadListItem key={thread.id} thread={thread} />
            ))
          )}
        </div>
      </div>

      {/* 오른쪽: 안내 메시지 */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-[color:var(--color-bg-subtle)]">
        <div className="text-center max-w-md p-8">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-[color:var(--color-fg-muted)]" />
          <h2 className="text-xl font-bold text-[color:var(--color-fg-primary)] mb-2">
            채팅방을 선택하세요
          </h2>
          <p className="text-[color:var(--color-fg-muted)] mb-6">
            왼쪽 목록에서 채팅방을 클릭하면
            <br />
            우측 하단 Floating Dock에서 채팅창이 열립니다
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-lg)] bg-[color:var(--color-accent)]/10 text-[color:var(--color-fg-primary)] text-sm">
            <Send className="w-4 h-4" />
            웹사이트를 보면서 채팅하세요!
          </div>
        </div>
      </div>
    </div>
  );
}
