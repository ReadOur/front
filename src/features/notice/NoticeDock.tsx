import React, { useState, useRef, useEffect } from "react";
import { X, Minimize2, Bell, Plus, Edit2, Trash2 } from "lucide-react";

/**
 * NoticeDock - 공지 목록 조회 및 작성창 (우측 도크)
 * - 페이지 우측에 떠 있는 공지 윈도우
 * - ChatDock과 유사한 UI 패턴
 * - 권한이 있는 사용자는 공지 생성 가능
 * - 추후 Notice API 연동 예정
 */

interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: number;
  isPinned?: boolean;
}

interface NoticeDockProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  hasPermission?: boolean; // 공지 작성 권한 여부
}

export default function NoticeDock({
  isOpen,
  onClose,
  onMinimize,
  hasPermission = false,
}: NoticeDockProps) {
  const [notices, setNotices] = useState<Notice[]>([
    {
      id: "notice-1",
      title: "환영합니다!",
      content: "공지사항 시스템이 곧 오픈됩니다.",
      author: "관리자",
      createdAt: Date.now() - 86400000,
      isPinned: true,
    },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: "",
    content: "",
    isPinned: false,
  });
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const handleCreateNotice = async () => {
    if (!newNotice.title.trim() || !newNotice.content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    // TODO: API 연동
    const notice: Notice = {
      id: `notice-${Date.now()}`,
      title: newNotice.title,
      content: newNotice.content,
      author: "현재 사용자", // TODO: 실제 사용자 정보
      createdAt: Date.now(),
      isPinned: newNotice.isPinned,
    };

    setNotices((prev) => [notice, ...prev]);
    setNewNotice({ title: "", content: "", isPinned: false });
    setIsCreating(false);
    alert("공지가 등록되었습니다.");
  };

  const handleDeleteNotice = (noticeId: string) => {
    if (confirm("이 공지를 삭제하시겠습니까?")) {
      setNotices((prev) => prev.filter((n) => n.id !== noticeId));
      setSelectedNotice(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed right-4 bottom-4 w-96 h-[600px] flex flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[color:var(--chatdock-bg-elev-2)] border border-[color:var(--chatdock-border-strong)] shadow-2xl z-50"
      style={{ maxHeight: "calc(100vh - 2rem)" }}
    >
      {/* 헤더 */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-[color:var(--chatdock-border-subtle)] bg-gradient-to-r from-orange-500 to-red-500">
        <Bell className="w-5 h-5 text-white" />
        <div className="flex-1">
          <div className="text-sm font-bold text-white">공지사항</div>
          <div className="text-xs text-white/80">
            {notices.length}개의 공지
          </div>
        </div>
        {hasPermission && !isCreating && !selectedNotice && (
          <button
            onClick={() => setIsCreating(true)}
            className="w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-white/20 text-white"
            title="공지 작성"
          >
            <Plus className="w-4 h-4" />
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

      {/* 공지 작성 폼 */}
      {isCreating && (
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPinned"
                checked={newNotice.isPinned}
                onChange={(e) =>
                  setNewNotice({ ...newNotice, isPinned: e.target.checked })
                }
                className="w-4 h-4 rounded border-[color:var(--chatdock-border-subtle)] text-orange-500 focus:ring-orange-500"
              />
              <label
                htmlFor="isPinned"
                className="text-sm text-[color:var(--chatdock-fg-primary)]"
              >
                상단 고정
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateNotice}
                className="flex-1 px-4 py-2 rounded-[var(--radius-md)] bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                등록
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewNotice({ title: "", content: "", isPinned: false });
                }}
                className="flex-1 px-4 py-2 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] text-[color:var(--chatdock-fg-primary)] hover:bg-[color:var(--chatdock-bg-hover)] transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 공지 상세 보기 */}
      {selectedNotice && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[color:var(--chatdock-fg-primary)]">
                  {selectedNotice.title}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-[color:var(--chatdock-fg-muted)]">
                  <span>{selectedNotice.author}</span>
                  <span>•</span>
                  <span>
                    {new Date(selectedNotice.createdAt).toLocaleDateString()}
                  </span>
                  {selectedNotice.isPinned && (
                    <>
                      <span>•</span>
                      <span className="text-orange-500">고정됨</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-[color:var(--chatdock-bg-hover)] text-[color:var(--chatdock-fg-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)]">
              <p className="text-sm text-[color:var(--chatdock-fg-primary)] whitespace-pre-wrap">
                {selectedNotice.content}
              </p>
            </div>
            {hasPermission && (
              <div className="flex gap-2">
                <button
                  onClick={() => alert("수정 기능은 추후 구현 예정입니다.")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] text-[color:var(--chatdock-fg-primary)] hover:bg-[color:var(--chatdock-bg-hover)] transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  수정
                </button>
                <button
                  onClick={() => handleDeleteNotice(selectedNotice.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 공지 목록 */}
      {!isCreating && !selectedNotice && (
        <div className="flex-1 overflow-y-auto">
          {notices.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[color:var(--chatdock-fg-muted)]">
              <p className="text-sm">등록된 공지가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-[color:var(--chatdock-border-subtle)]">
              {notices
                .sort((a, b) => {
                  // 고정된 공지를 먼저 표시
                  if (a.isPinned && !b.isPinned) return -1;
                  if (!a.isPinned && b.isPinned) return 1;
                  return b.createdAt - a.createdAt;
                })
                .map((notice) => (
                  <button
                    key={notice.id}
                    onClick={() => setSelectedNotice(notice)}
                    className="w-full p-4 text-left hover:bg-[color:var(--chatdock-bg-hover)] transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {notice.isPinned && (
                            <Bell className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          )}
                          <h4 className="text-sm font-medium text-[color:var(--chatdock-fg-primary)] truncate">
                            {notice.title}
                          </h4>
                        </div>
                        <p className="mt-1 text-xs text-[color:var(--chatdock-fg-muted)] line-clamp-2">
                          {notice.content}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-[color:var(--chatdock-fg-muted)]">
                          <span>{notice.author}</span>
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
          )}
        </div>
      )}
    </div>
  );
}
