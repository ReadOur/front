import React, { useState, useMemo, useEffect, useRef } from "react";
import { MessageCircle, Search, Star, Users, Send, Loader2, User, Plus, X, Pin, MoreVertical } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useChatContext } from "@/contexts/ChatContext";
import { ChatThread, ChatUser, ChatCategory } from "@/features/message/ChatDock";
import { useRoomsOverview, useCreateRoom, useJoinRoom, useLeaveRoom, usePinRoom, useUnpinRoom } from "@/hooks/api/useChat";
import { MyRoomItem, PublicRoomItem } from "@/types/chat";
import Modal from "@/components/Modal/Modal";
import { useToast } from "@/components/Toast/ToastProvider";

/**
 * CHT_17 - 채팅방 목록 페이지
 * - 모든 채팅방 목록 표시
 * - 검색 및 필터링
 * - 채팅방 클릭 시 Floating Dock에서 열기
 */

// ChatThread 타입 확장 (isPublic 필드 추가)
interface ExtendedChatThread extends ChatThread {
  isPublic?: boolean;
}

// Mock 데이터 (실제로는 API에서 가져옴)
const mockThreads: ChatThread[] = [
  // 1:1 채팅
  {
    id: "t1",
    users: [{ id: "u1", name: "콩콩", online: true }],
    category: "DIRECT",
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
    category: "DIRECT",
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
    category: "DIRECT",
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
    category: "DIRECT",
    unreadCount: 5,
    lastMessage: {
      id: "m3",
      threadId: "t4",
      fromId: "u4",
      text: "내일 미팅 시간 확인 부탁해요",
      createdAt: Date.now() - 10800000,
    },
  },
  // 단체 채팅
  {
    id: "t5",
    users: [
      { id: "u5", name: "딸기", online: true },
      { id: "u6", name: "바나나" },
      { id: "u7", name: "오렌지" },
    ],
    category: "GROUP",
    unreadCount: 12,
    lastMessage: {
      id: "m4",
      threadId: "t5",
      fromId: "u5",
      text: "스터디 그룹에 오신 걸 환영합니다!",
      createdAt: Date.now() - 14400000,
    },
  },
  {
    id: "t6",
    users: [
      { id: "u8", name: "포도" },
      { id: "u9", name: "키위" },
      { id: "u10", name: "복숭아" },
      { id: "u11", name: "수박" },
    ],
    category: "GROUP",
    unreadCount: 3,
    lastMessage: {
      id: "m5",
      threadId: "t6",
      fromId: "u8",
      text: "다음주 프로젝트 일정 공유드립니다",
      createdAt: Date.now() - 18000000,
    },
  },
  // 모임 채팅
  {
    id: "t7",
    users: [
      { id: "u12", name: "레몬" },
      { id: "u13", name: "라임" },
      { id: "u14", name: "귤" },
    ],
    category: "MEETING",
    unreadCount: 8,
    lastMessage: {
      id: "m6",
      threadId: "t7",
      fromId: "u12",
      text: "이번 주 토요일 독서 모임 참석 가능하신 분?",
      createdAt: Date.now() - 21600000,
    },
  },
  {
    id: "t8",
    users: [
      { id: "u15", name: "사과", online: true },
      { id: "u16", name: "배" },
      { id: "u17", name: "감" },
      { id: "u18", name: "밤" },
    ],
    category: "MEETING",
    lastMessage: {
      id: "m7",
      threadId: "t8",
      fromId: "u15",
      text: "다음 모임 장소 투표합시다!",
      createdAt: Date.now() - 28800000,
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

function ThreadListItem({ thread }: { thread: ExtendedChatThread }) {
  const { openThread } = useChatContext();
  const toast = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isGroup = thread.users.length > 1;
  const displayName = isGroup
    ? `${thread.users.map((u) => u.name).join(", ")}`
    : thread.users[0]?.name || "알 수 없음";

  // 공개 채팅방 참여하기 mutation
  const joinRoomMutation = useJoinRoom({
    onSuccess: () => {
      toast.show({ title: "채팅방에 참여했습니다.", variant: "success" });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "채팅방 참여에 실패했습니다.";
      toast.show({ title: errorMessage, variant: "error" });
    },
  });

  // 채팅방 나가기 mutation
  const leaveRoomMutation = useLeaveRoom({
    onSuccess: () => {
      toast.show({ title: "채팅방에서 나갔습니다.", variant: "success" });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "채팅방 나가기에 실패했습니다.";
      toast.show({ title: errorMessage, variant: "error" });
    },
  });

  // 채팅방 핀 고정 mutation
  const pinRoomMutation = usePinRoom({
    onSuccess: () => {
      setIsPinned(true);
      toast.show({ title: "채팅방을 고정했습니다.", variant: "success" });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "채팅방 고정에 실패했습니다.";
      toast.show({ title: errorMessage, variant: "error" });
    },
  });

  // 채팅방 핀 해제 mutation
  const unpinRoomMutation = useUnpinRoom({
    onSuccess: () => {
      setIsPinned(false);
      toast.show({ title: "채팅방 고정을 해제했습니다.", variant: "success" });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "채팅방 고정 해제에 실패했습니다.";
      toast.show({ title: errorMessage, variant: "error" });
    },
  });

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  const handleLeaveRoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('채팅방을 나가시겠습니까?')) {
      const roomId = Number(thread.id);
      leaveRoomMutation.mutate(roomId);
    }
    setIsMenuOpen(false);
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    const roomId = Number(thread.id);
    if (isPinned) {
      unpinRoomMutation.mutate(roomId);
    } else {
      pinRoomMutation.mutate(roomId);
    }
    setIsMenuOpen(false);
  };

  const handleJoinRoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    const roomId = Number(thread.id);
    joinRoomMutation.mutate(roomId);
  };

  return (
    <div
      className="flex items-start gap-3 p-4 hover:bg-[color:var(--color-bg-subtle)] cursor-pointer border-b border-[color:var(--color-border-subtle)] transition-colors relative"
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
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isPinned && <Pin className="w-4 h-4 text-[color:var(--color-accent)] flex-shrink-0" />}
            <h3 className="font-medium text-[color:var(--color-fg-primary)] truncate">
              {displayName}
            </h3>
          </div>
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
        </div>
      </div>

      {/* Menu Button or Join Button */}
      {thread.isPublic ? (
        // 공개 채팅방: 참여하기 버튼
        <div className="flex-shrink-0">
          <button
            onClick={handleJoinRoom}
            disabled={joinRoomMutation.isPending}
            className="px-4 py-2 rounded-[var(--radius-md)] bg-[color:var(--color-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {joinRoomMutation.isPending ? "참여 중..." : "참여하기"}
          </button>
        </div>
      ) : (
        // 내 채팅방: 메뉴 버튼
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-2 hover:bg-[color:var(--color-bg-hover)] rounded-full transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-[color:var(--color-fg-muted)]" />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-[color:var(--color-bg-elev-1)] border border-[color:var(--color-border-subtle)] rounded-lg shadow-lg z-10 overflow-hidden">
              <button
                onClick={handleTogglePin}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-[color:var(--color-fg-primary)] hover:bg-[color:var(--color-bg-hover)] transition-colors text-sm"
              >
                <Pin className="w-4 h-4" />
                <span>{isPinned ? '핀 해제' : '핀 고정'}</span>
              </button>
              <button
                onClick={handleLeaveRoom}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-500 hover:bg-[color:var(--color-bg-hover)] transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                <span>나가기</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type CategoryFilter = "ALL" | ChatCategory;

const categoryLabels: Record<CategoryFilter, string> = {
  ALL: "전체",
  DIRECT: "1:1",
  GROUP: "단체",
  MEETING: "모임",
};

export default function CHT_17() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("ALL");
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { openThread } = useChatContext();

  // 모임모집 모달 상태
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");

  // TODO: 실제 로그인 구현 후 userId를 동적으로 가져오기
  const userId = '1'; // 테스트용 userId

  // 채팅방 데이터 가져오기
  const { data, isLoading, error } = useRoomsOverview({ userId });

  // 채팅방 생성 mutation
  const createRoomMutation = useCreateRoom({
    onSuccess: (data) => {
      alert(`"${data.name}" 채팅방이 생성되었습니다!`);
      setIsCreateRoomModalOpen(false);
      setRoomName("");
      setRoomDescription("");
      // 생성된 채팅방 열기
      openThread(data.roomId.toString());
    },
    onError: (error) => {
      alert(`채팅방 생성 실패: ${error.message}`);
    },
  });

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      alert("채팅방 이름을 입력해주세요.");
      return;
    }

    createRoomMutation.mutate({
      name: roomName.trim(),
      description: roomDescription.trim() || undefined,
      category: "GROUP",
    });
  };

  // 백엔드 응답을 UI 형식으로 변환
  const threads = useMemo(() => {
    if (!data) return [];

    const myRoomIds = new Set(data.myRooms.items.map(room => room.roomId));

    const myRooms: ChatThread[] = data.myRooms.items.map((room) => ({
      id: room.roomId.toString(),
      users: [{ id: "unknown", name: room.name }], // 임시: 실제로는 참여자 정보 필요
      category: "GROUP" as ChatCategory, // 임시: 실제로는 백엔드에서 카테고리 받아야 함
      unreadCount: room.unreadCount,
      isPublic: false, // 내 채팅방
      lastMessage: room.lastMsg
        ? {
            id: room.lastMsg.id.toString(),
            threadId: room.roomId.toString(),
            fromId: "unknown",
            text: room.lastMsg.preview,
            createdAt: new Date(room.lastMsg.createdAt).getTime(),
          }
        : undefined,
    }));

    const publicRooms: ChatThread[] = data.publicRooms.items.map((room) => ({
      id: room.roomId.toString(),
      users: [{ id: "unknown", name: room.name }],
      category: "MEETING" as ChatCategory, // 공개방은 MEETING으로 표시
      unreadCount: 0,
      isPublic: true, // 공개 채팅방 (참여 전)
      lastMessage: undefined,
    }));

    return [...myRooms, ...publicRooms];
  }, [data]);

  // URL에서 roomId 쿼리 파라미터를 읽어서 자동으로 채팅방 열기
  useEffect(() => {
    const roomId = searchParams.get('roomId');
    if (roomId && threads.length > 0) {
      // 해당 채팅방이 존재하는지 확인
      const targetThread = threads.find(t => t.id === roomId);
      if (targetThread) {
        openThread(roomId);
        // 쿼리 파라미터 제거 (한 번만 실행하도록)
        setSearchParams({});
      }
    }
  }, [searchParams, threads, openThread, setSearchParams]);

  // 카테고리별 읽지 않은 메시지 수 계산
  const unreadCounts = {
    ALL: threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0),
    DIRECT: threads.filter(t => t.category === "DIRECT").reduce((sum, t) => sum + (t.unreadCount || 0), 0),
    GROUP: threads.filter(t => t.category === "GROUP").reduce((sum, t) => sum + (t.unreadCount || 0), 0),
    MEETING: threads.filter(t => t.category === "MEETING").reduce((sum, t) => sum + (t.unreadCount || 0), 0),
  };

  const filteredThreads = threads.filter((thread) => {
    // 카테고리 필터
    if (selectedCategory !== "ALL" && thread.category !== selectedCategory) {
      return false;
    }

    // 검색 필터
    const displayName = thread.users.map((u) => u.name).join(", ");
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-200px)] bg-[color:var(--color-bg)] rounded-[var(--radius-xl)] overflow-hidden border border-[color:var(--color-border-subtle)]">
      {/* 왼쪽: 채팅방 목록 */}
      <div className="w-full md:w-96 flex flex-col border-r border-[color:var(--color-border-subtle)]">
        {/* 헤더 */}
        <div className="p-4 border-b border-[color:var(--color-border-subtle)]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-[color:var(--color-fg-primary)] flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              채팅
            </h1>
            <button
              onClick={() => setIsCreateRoomModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-md)] bg-[color:var(--color-primary)] text-white hover:opacity-90 transition-opacity text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              새 채팅방
            </button>
          </div>
          {/* 검색 */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--color-fg-muted)]" />
            <input
              type="text"
              placeholder="채팅방 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-[var(--radius-md)] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/40 text-[color:var(--color-fg-primary)]"
            />
          </div>
          {/* 카테고리 탭 */}
          <div className="flex gap-1 p-1 bg-[color:var(--color-bg-subtle)] rounded-[var(--radius-md)]">
            {(["ALL", "DIRECT", "GROUP", "MEETING"] as CategoryFilter[]).map((category) => {
              const isActive = selectedCategory === category;
              const Icon = category === "DIRECT" ? User : category === "GROUP" ? Users : category === "MEETING" ? MessageCircle : MessageCircle;
              const unreadCount = unreadCounts[category];

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`relative flex-1 h-8 px-2 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[color:var(--color-bg)] text-[color:var(--color-fg-primary)] shadow-sm"
                      : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg-primary)]"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Icon className="w-3 h-3" />
                    <span>{categoryLabels[category]}</span>
                    {unreadCount > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[color:var(--color-accent)] text-[color:var(--color-fg-primary)] leading-none">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 채팅방 목록 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 flex flex-col items-center justify-center text-[color:var(--color-fg-muted)]">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p>로딩 중...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              <p className="mb-2">채팅방을 불러오는 중 오류가 발생했습니다.</p>
              <p className="text-sm text-[color:var(--color-fg-muted)]">
                {error instanceof Error ? error.message : "알 수 없는 오류"}
              </p>
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

      {/* 채팅방 생성 모달 */}
      <Modal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        title="모임 채팅방 만들기"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[color:var(--color-fg-primary)] mb-2">
              채팅방 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="예: 독서 모임, 스터디 그룹 등"
              className="w-full px-4 py-2 rounded-[var(--radius-md)] bg-[color:var(--color-bg)] border border-[color:var(--color-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/40 text-[color:var(--color-fg-primary)]"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--color-fg-primary)] mb-2">
              채팅방 설명 (선택)
            </label>
            <textarea
              value={roomDescription}
              onChange={(e) => setRoomDescription(e.target.value)}
              placeholder="채팅방에 대한 간단한 설명을 입력해주세요"
              className="w-full px-4 py-2 rounded-[var(--radius-md)] bg-[color:var(--color-bg)] border border-[color:var(--color-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/40 text-[color:var(--color-fg-primary)] resize-none"
              rows={4}
              maxLength={200}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsCreateRoomModalOpen(false)}
              className="flex-1 px-4 py-2 rounded-[var(--radius-md)] bg-[color:var(--color-bg-subtle)] text-[color:var(--color-fg-primary)] hover:bg-[color:var(--color-bg-muted)] transition-colors"
              disabled={createRoomMutation.isPending}
            >
              취소
            </button>
            <button
              onClick={handleCreateRoom}
              disabled={createRoomMutation.isPending || !roomName.trim()}
              className="flex-1 px-4 py-2 rounded-[var(--radius-md)] bg-[color:var(--color-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createRoomMutation.isPending ? "생성 중..." : "채팅방 만들기"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
