import React, { useState, useRef, useMemo } from "react";
import { X, Minimize2, Bell, Plus, Edit2, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import {
  useAnnouncements,
  useAnnouncementDetail,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
} from "@/hooks/api/useChat";
import { Announcement } from "@/types";
import { useToast } from "@/components/Toast/ToastProvider";

/**
 * NoticeDock - 공지 목록 조회 및 작성창 (우측 도크)
 * - 페이지 우측에 떠 있는 공지 윈도우
 * - ChatDock과 유사한 UI 패턴
 * - 권한이 있는 사용자는 공지 생성 가능
 * - 드래그하여 위치 이동 가능
 */

interface NoticeDockProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  hasPermission?: boolean; // 공지 작성 권한 여부
  roomId?: number; // 채팅방 ID (공지를 조회할 대상)
  permissionStatus?: "idle" | "checking" | "success" | "error";
  permissionErrorMessage?: string;
  onRetryPermission?: () => void;
}

export default function NoticeDock({
  isOpen,
  onClose,
  onMinimize,
  hasPermission = false,
  roomId = 1, // 기본값: 임시로 1번 룸 사용
  permissionStatus = "idle",
  permissionErrorMessage,
  onRetryPermission,
}: NoticeDockProps) {
  // 공지사항 API 연동
  const [page, setPage] = useState(0);
  const { data, isLoading } = useAnnouncements(
    { roomId, page, size: 20 },
    { enabled: isOpen && !!roomId }
  );

  const announcements = data?.items || [];
  const hasNextPage = data?.page?.hasNext || false;

  // 디버깅: 목록 조회 확인
  React.useEffect(() => {
    if (data) {
      console.log('📋 공지 목록 조회 완료:', data);
      console.log('📋 items:', data.items);
      if (data.items && data.items.length > 0) {
        console.log('📋 첫 번째 공지:', data.items[0]);
        console.log('📋 첫 번째 공지 content:', (data.items[0] as any).content);
      }
    }
  }, [data]);

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: "",
    content: "",
  });
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);

  // 선택된 공지의 상세 정보 조회 (목록 API는 content를 포함하지 않을 수 있음)
  const { data: selectedNotice, isLoading: isLoadingDetail } = useAnnouncementDetail(
    roomId,
    selectedNoticeId || 0,
    { enabled: !!selectedNoticeId }
  );

  // 디버깅: 상세 정보 조회 확인
  React.useEffect(() => {
    if (selectedNoticeId) {
      console.log('🔍 공지 상세 조회 시작:', { roomId, announcementId: selectedNoticeId });
    }
    if (selectedNotice) {
      console.log('✅ 공지 상세 조회 완료:', selectedNotice);
      console.log('📝 content:', selectedNotice.content);
      console.log('📏 content 길이:', selectedNotice.content?.length);
    }
  }, [selectedNoticeId, selectedNotice, roomId]);

  const toast = useToast();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  // 드래그 기능을 위한 상태
  const [position, setPosition] = useState({ x: window.innerWidth - 416, y: 100 }); // 우측에서 시작
  const dragInfo = useRef<{ isDragging: boolean; offsetX: number; offsetY: number }>({
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
  });

  const handleDragStart = (e: React.PointerEvent) => {
    dragInfo.current = {
      isDragging: true,
      offsetX: e.clientX - position.x,
      offsetY: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!dragInfo.current.isDragging) return;

    const x = e.clientX - dragInfo.current.offsetX;
    const y = e.clientY - dragInfo.current.offsetY;

    // 화면 밖으로 나가지 않도록 제한
    const W = 384; // w-96 = 384px
    const H = 600; // h-[600px]
    const margin = 16;
    const maxX = window.innerWidth - W - margin;
    const maxY = window.innerHeight - H - margin;

    setPosition({
      x: Math.min(Math.max(margin, x), maxX),
      y: Math.min(Math.max(margin, y), maxY),
    });
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    dragInfo.current.isDragging = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore safely: pointer capture may already be released
    }
  };

  const handleCreateNotice = async () => {
    if (!newNotice.title.trim() || !newNotice.content.trim()) {
      toast.show({
        title: "제목과 내용을 모두 입력해주세요.",
        variant: "error",
      });
      return;
    }

    createMutation.mutate(
      { roomId, data: { title: newNotice.title, content: newNotice.content } },
      {
        onSuccess: () => {
          toast.show({
            title: "공지가 등록되었습니다.",
            variant: "success",
          });
          setNewNotice({ title: "", content: "" });
          setIsCreating(false);
        },
        onError: (error) => {
          console.error('❌ 공지 생성 실패:', error);
          toast.show({
            title: `공지 등록 실패: ${error.message}`,
            variant: "error",
          });
        },
      }
    );
  };

  const handleUpdateNotice = async () => {
    if (!selectedNotice) return;

    if (!newNotice.title.trim() || !newNotice.content.trim()) {
      toast.show({
        title: "제목과 내용을 모두 입력해주세요.",
        variant: "error",
      });
      return;
    }

    updateMutation.mutate(
      {
        roomId,
        announcementId: selectedNotice.id,
        data: { title: newNotice.title, content: newNotice.content },
      },
      {
        onSuccess: (updatedAnnouncement) => {
          toast.show({
            title: "공지가 수정되었습니다.",
            variant: "success",
          });
          // 상세 정보가 자동으로 갱신됨 (React Query 캐시 무효화)
          setNewNotice({ title: "", content: "" });
          setIsEditing(false);
        },
        onError: (error) => {
          toast.show({
            title: `공지 수정 실패: ${error.message}`,
            variant: "error",
          });
        },
      }
    );
  };

  const handleDeleteNotice = (noticeId: number) => {
    if (!confirm("이 공지를 삭제하시겠습니까?")) {
      return;
    }

    deleteMutation.mutate(
      { roomId, announcementId: noticeId },
      {
        onSuccess: () => {
          toast.show({
            title: "공지가 삭제되었습니다.",
            variant: "success",
          });
          setSelectedNoticeId(null);
        },
        onError: (error) => {
          toast.show({
            title: `공지 삭제 실패: ${error.message}`,
            variant: "error",
          });
        },
      }
    );
  };

  const handleEditStart = () => {
    if (!selectedNotice) return;
    setNewNotice({
      title: selectedNotice.title,
      content: selectedNotice.content,
    });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setNewNotice({ title: "", content: "" });
    setIsEditing(false);
  };

  const permissionState = useMemo(() => permissionStatus, [permissionStatus]);
  const shouldShowCreateButton = true; // 항상 버튼 표시 (권한 없으면 비활성화)
  const isCreateDisabled = permissionState !== "success" || hasPermission !== true;
  const createButtonLabel =
    permissionState === "checking"
      ? "권한 확인 중"
      : permissionState === "error"
        ? "권한 재확인 필요"
        : "공지 작성";

  if (!isOpen) return null;

  return (
    <div
      className="fixed w-96 h-[600px] flex flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[color:var(--chatdock-bg-elev-2)] border border-[color:var(--chatdock-border-strong)] shadow-2xl z-50"
      style={{
        maxHeight: "calc(100vh - 2rem)",
        left: position.x,
        top: position.y,
      }}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerCancel={handleDragEnd}
    >
      <button
        className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-[color:var(--chatdock-bg-elev-3)] border border-[color:var(--chatdock-border-subtle)] cursor-grab active:cursor-grabbing"
        onPointerDown={handleDragStart}
        aria-label="창 위치 이동"
      />
      <button
        className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[color:var(--chatdock-bg-elev-3)] border border-[color:var(--chatdock-border-subtle)] cursor-grab active:cursor-grabbing"
        onPointerDown={handleDragStart}
        aria-label="창 위치 이동"
      />
      <button
        className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-[color:var(--chatdock-bg-elev-3)] border border-[color:var(--chatdock-border-subtle)] cursor-grab active:cursor-grabbing"
        onPointerDown={handleDragStart}
        aria-label="창 위치 이동"
      />
      <button
        className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-[color:var(--chatdock-bg-elev-3)] border border-[color:var(--chatdock-border-subtle)] cursor-grab active:cursor-grabbing"
        onPointerDown={handleDragStart}
        aria-label="창 위치 이동"
      />
      {/* 헤더 (드래그 가능) */}
      <div
        className="h-14 flex items-center gap-2 px-4 border-b border-[color:var(--chatdock-border-subtle)] bg-gradient-to-r from-orange-500 to-red-500 cursor-move"
        onPointerDown={handleDragStart}
      >
        <Bell className="w-5 h-5 text-white" />
        <div className="flex-1">
          <div className="text-sm font-bold text-white">공지사항</div>
          <div className="text-xs text-white/80">
            {isLoading ? "로딩 중..." : `${announcements.length}개의 공지`}
          </div>
        </div>
        {shouldShowCreateButton && !isCreating && !selectedNotice && !isEditing && (
          <button
            onClick={() => {
              if (!isCreateDisabled) {
                setIsCreating(true);
              }
            }}
            disabled={isCreateDisabled}
            className="w-28 h-9 px-2 grid place-items-center rounded-[var(--radius-md)] hover:bg-white/20 text-white text-xs border border-white/20 disabled:opacity-60 disabled:cursor-not-allowed"
            title={createButtonLabel}
          >
            <div className="flex items-center gap-1">
              {permissionState === "checking" && <Loader2 className="w-4 h-4 animate-spin" />}
              <Plus className="w-4 h-4" />
              <span>{createButtonLabel}</span>
            </div>
          </button>
        )}
        {onMinimize && (
          <button
            onClick={onMinimize}
            className="w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-white/20 text-white"
            title="최소화"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onClose}
          className="w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-white/20 text-white"
          title="닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {(permissionState === "checking" || permissionState === "error") && (
        <div
          className={
            permissionState === "error"
              ? "m-3 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-red-700"
              : "m-3 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800"
          }
        >
          <div className="flex items-start gap-2">
            <div className="pt-0.5">
              {permissionState === "error" ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-sm font-semibold">
                {permissionState === "error" ? "공지 권한을 확인하지 못했습니다." : "공지 권한을 확인하고 있습니다."}
              </div>
              {permissionState === "error" && permissionErrorMessage && (
                <div className="text-xs leading-snug break-words">{permissionErrorMessage}</div>
              )}
            </div>
            {permissionState === "error" && onRetryPermission && (
              <button
                type="button"
                onClick={onRetryPermission}
                className="px-3 py-1 text-xs font-semibold rounded-[var(--radius-sm)] bg-white text-red-700 border border-red-200 hover:bg-red-100"
              >
                다시 시도
              </button>
            )}
          </div>
        </div>
      )}

      {/* 공지 작성/수정 폼 */}
      {(isCreating || isEditing) && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--chatdock-fg-primary)] mb-1">
                제목
              </label>
              <input
                type="text"
                value={newNotice.title}
                onChange={(e) =>
                  setNewNotice({ ...newNotice, title: e.target.value })
                }
                placeholder="공지 제목을 입력하세요"
                className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500 text-[color:var(--chatdock-fg-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[color:var(--chatdock-fg-primary)] mb-1">
                내용
              </label>
              <textarea
                value={newNotice.content}
                onChange={(e) =>
                  setNewNotice({ ...newNotice, content: e.target.value })
                }
                placeholder="공지 내용을 입력하세요"
                rows={8}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] focus:outline-none focus:ring-2 focus:ring-orange-500 text-[color:var(--chatdock-fg-primary)] resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (isCreating) {
                    handleCreateNotice();
                  } else {
                    handleUpdateNotice();
                  }
                }}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 px-4 py-2 rounded-[var(--radius-md)] bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "처리 중..."
                  : isCreating
                  ? "등록"
                  : "수정"}
              </button>
              <button
                onClick={() => {
                  if (isCreating) {
                    setIsCreating(false);
                    setNewNotice({ title: "", content: "" });
                  } else {
                    handleEditCancel();
                  }
                }}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 px-4 py-2 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] text-[color:var(--chatdock-fg-primary)] hover:bg-[color:var(--chatdock-bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 공지 상세 보기 */}
      {selectedNoticeId && !isEditing && (
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingDetail ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[color:var(--chatdock-fg-muted)]" />
            </div>
          ) : selectedNotice ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[color:var(--chatdock-fg-primary)]">
                  {selectedNotice.title}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-[color:var(--chatdock-fg-muted)]">
                  <span>{selectedNotice.author.username}</span>
                  <span>•</span>
                  <span>
                    {new Date(selectedNotice.createdAt).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span className="text-orange-500">{selectedNotice.author.role}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNoticeId(null)}
                className="w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-[color:var(--chatdock-bg-hover)] text-[color:var(--chatdock-fg-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] min-h-[100px]">
              <p className="text-sm text-[color:var(--chatdock-fg-primary)] whitespace-pre-wrap break-words">
                {selectedNotice.content || "(내용 없음)"}
              </p>
            </div>
            {hasPermission === true && (
              <div className="flex gap-2">
                <button
                  onClick={handleEditStart}
                  disabled={deleteMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] text-[color:var(--chatdock-fg-primary)] hover:bg-[color:var(--chatdock-bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit2 className="w-4 h-4" />
                  수정
                </button>
                <button
                  onClick={() => handleDeleteNotice(selectedNotice.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleteMutation.isPending ? "삭제 중..." : "삭제"}
                </button>
              </div>
            )}
          </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[color:var(--chatdock-fg-muted)]">
              <p className="text-sm">공지를 불러올 수 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 공지 목록 */}
      {!isCreating && !selectedNoticeId && !isEditing && (
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-[color:var(--chatdock-fg-muted)]">
              <p className="text-sm">로딩 중...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[color:var(--chatdock-fg-muted)]">
              <p className="text-sm">등록된 공지가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-[color:var(--chatdock-border-subtle)]">
                {announcements.map((notice) => (
                  <button
                    key={notice.id}
                    onClick={() => setSelectedNoticeId(notice.id)}
                    className="w-full p-4 text-left hover:bg-[color:var(--chatdock-bg-hover)] transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          <h4 className="text-sm font-medium text-[color:var(--chatdock-fg-primary)] truncate">
                            {notice.title}
                          </h4>
                        </div>
                        <p className="mt-1 text-xs text-[color:var(--chatdock-fg-muted)] line-clamp-2">
                          {notice.content}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-[color:var(--chatdock-fg-muted)]">
                          <span>{notice.author.username}</span>
                          <span>•</span>
                          <span>
                            {new Date(notice.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {/* 페이지네이션 */}
              {(page > 0 || hasNextPage) && (
                <div className="flex items-center justify-between p-4 border-t border-[color:var(--chatdock-border-subtle)]">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] text-[color:var(--chatdock-fg-primary)] hover:bg-[color:var(--chatdock-bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    이전
                  </button>
                  <span className="text-xs text-[color:var(--chatdock-fg-muted)]">
                    페이지 {page + 1}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasNextPage}
                    className="px-3 py-1 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] text-[color:var(--chatdock-fg-primary)] hover:bg-[color:var(--chatdock-bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
