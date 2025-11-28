import React, { useState, useRef, useMemo } from "react";
import { X, Minimize2, BarChart3, Plus, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import {
  usePolls,
  useCreatePoll,
  useDeletePoll,
  useVote,
  usePollResults,
} from "@/hooks/api/useChat";
import { Poll } from "@/types";
import { useToast } from "@/components/Toast/ToastProvider";

/**
 * PollDock - 투표 목록 조회 및 생성창 (우측 도크)
 * - 페이지 우측에 떠 있는 투표 윈도우
 * - ChatDock과 유사한 UI 패턴
 * - 권한이 있는 사용자는 투표 생성 가능
 * - 드래그하여 위치 이동 가능
 */

interface PollDockProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  hasPermission?: boolean; // 투표 생성 권한 여부
  roomId?: number; // 채팅방 ID (투표를 조회할 대상)
  permissionStatus?: "idle" | "checking" | "success" | "error";
  permissionErrorMessage?: string;
  onRetryPermission?: () => void;
}

export default function PollDock({
  isOpen,
  onClose,
  onMinimize,
  hasPermission = false,
  roomId = 1,
  permissionStatus = "idle",
  permissionErrorMessage,
  onRetryPermission,
}: PollDockProps) {
  // 투표 API 연동
  const [page, setPage] = useState(0);
  const { data, isLoading } = usePolls(
    { roomId, page, size: 20 },
    { enabled: isOpen && !!roomId }
  );

  const polls = data?.items || [];
  const hasNextPage = data?.page?.hasNext || false;

  const [isCreating, setIsCreating] = useState(false);
  const [newPoll, setNewPoll] = useState({
    question: "",
    description: "",
    options: ["", ""],
    multipleChoice: false,
  });
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const toast = useToast();
  const createMutation = useCreatePoll();
  const deleteMutation = useDeletePoll();
  const voteMutation = useVote();

  // 투표 결과 조회
  const { data: pollResults } = usePollResults(
    roomId,
    selectedPoll?.id || 0,
    { enabled: !!selectedPoll }
  );

  // 드래그 기능을 위한 상태
  const [position, setPosition] = useState({ x: window.innerWidth - 416, y: 100 });
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

    const W = 384;
    const H = 600;
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

  const handleCreatePoll = async () => {
    if (!newPoll.question.trim()) {
      toast.show({
        title: "투표 제목을 입력해주세요.",
        variant: "error",
      });
      return;
    }

    const validOptions = newPoll.options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      toast.show({
        title: "최소 2개 이상의 선택지를 입력해주세요.",
        variant: "error",
      });
      return;
    }

    createMutation.mutate(
      {
        roomId,
        data: {
          question: newPoll.question,
          description: newPoll.description || undefined,
          options: validOptions,
          multipleChoice: newPoll.multipleChoice,
        },
      },
      {
        onSuccess: () => {
          toast.show({
            title: "투표가 생성되었습니다.",
            variant: "success",
          });
          setNewPoll({ question: "", description: "", options: ["", ""], multipleChoice: false });
          setIsCreating(false);
        },
        onError: (error) => {
          console.error('❌ 투표 생성 실패:', error);
          toast.show({
            title: `투표 생성 실패: ${error.message}`,
            variant: "error",
          });
        },
      }
    );
  };

  const handleDeletePoll = (pollId: number) => {
    if (!confirm("이 투표를 삭제하시겠습니까?")) {
      return;
    }

    deleteMutation.mutate(
      { roomId, pollId },
      {
        onSuccess: () => {
          toast.show({
            title: "투표가 삭제되었습니다.",
            variant: "success",
          });
          setSelectedPoll(null);
        },
        onError: (error) => {
          console.error('❌ 투표 삭제 실패:', error);
          toast.show({
            title: `투표 삭제 실패: ${error.message}`,
            variant: "error",
          });
        },
      }
    );
  };

  const handleVote = () => {
    if (!selectedPoll) return;

    if (selectedOptions.length === 0) {
      toast.show({
        title: "선택지를 선택해주세요.",
        variant: "error",
      });
      return;
    }

    voteMutation.mutate(
      {
        roomId,
        pollId: selectedPoll.id,
        data: { selections: selectedOptions },
      },
      {
        onSuccess: () => {
          toast.show({
            title: "투표 참여가 완료되었습니다.",
            variant: "success",
          });
          setSelectedOptions([]);
        },
        onError: (error) => {
          console.error('❌ 투표 참여 실패:', error);
          toast.show({
            title: `투표 참여 실패: ${error.message}`,
            variant: "error",
          });
        },
      }
    );
  };

  const handleOptionToggle = (optionId: string) => {
    if (!selectedPoll) return;

    if (selectedPoll.multipleChoice) {
      // 복수 선택
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      // 단일 선택
      setSelectedOptions([optionId]);
    }
  };

  const addOption = () => {
    setNewPoll(prev => ({ ...prev, options: [...prev.options, ""] }));
  };

  const removeOption = (index: number) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const updateOption = (index: number, value: string) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  const permissionState = useMemo(() => permissionStatus, [permissionStatus]);
  const shouldShowCreateButton = true;
  const isCreateDisabled = permissionState !== "success" || hasPermission !== true;
  const createButtonLabel =
    permissionState === "checking"
      ? "권한 확인 중"
      : permissionState === "error"
        ? "권한 재확인 필요"
        : "투표 생성";

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

      {/* 헤더 */}
      <div
        className="h-14 flex items-center gap-2 px-4 border-b border-[color:var(--chatdock-border-subtle)] bg-gradient-to-r from-blue-500 to-purple-500 cursor-move"
        onPointerDown={handleDragStart}
      >
        <BarChart3 className="w-5 h-5 text-white" />
        <div className="flex-1">
          <div className="text-sm font-bold text-white">투표</div>
          <div className="text-xs text-white/80">
            {isLoading ? "로딩 중..." : `${polls.length}개의 투표`}
          </div>
        </div>
        {shouldShowCreateButton && !isCreating && !selectedPoll && (
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
                {permissionState === "error" ? "투표 권한을 확인하지 못했습니다." : "투표 권한을 확인하고 있습니다."}
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

      {/* 투표 생성 폼 */}
      {isCreating && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--chatdock-fg-primary)] mb-1">
                투표 제목
              </label>
              <input
                type="text"
                value={newPoll.question}
                onChange={(e) =>
                  setNewPoll({ ...newPoll, question: e.target.value })
                }
                placeholder="투표 제목을 입력하세요"
                className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-[color:var(--chatdock-fg-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[color:var(--chatdock-fg-primary)] mb-1">
                설명 (선택사항)
              </label>
              <textarea
                value={newPoll.description}
                onChange={(e) =>
                  setNewPoll({ ...newPoll, description: e.target.value })
                }
                placeholder="투표 설명을 입력하세요"
                rows={3}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-[color:var(--chatdock-fg-primary)] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[color:var(--chatdock-fg-primary)] mb-1">
                선택지
              </label>
              <div className="space-y-2">
                {newPoll.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`선택지 ${index + 1}`}
                      className="flex-1 px-3 py-2 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-[color:var(--chatdock-fg-primary)]"
                    />
                    {newPoll.options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="px-3 py-2 rounded-[var(--radius-md)] bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] text-[color:var(--chatdock-fg-primary)] hover:bg-[color:var(--chatdock-bg-hover)] transition-colors text-sm"
                >
                  + 선택지 추가
                </button>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-[color:var(--chatdock-fg-primary)]">
                <input
                  type="checkbox"
                  checked={newPoll.multipleChoice}
                  onChange={(e) =>
                    setNewPoll({ ...newPoll, multipleChoice: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-[color:var(--chatdock-border-subtle)]"
                />
                복수 선택 허용
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreatePoll}
                disabled={createMutation.isPending}
                className="flex-1 px-4 py-2 rounded-[var(--radius-md)] bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? "생성 중..." : "투표 생성"}
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewPoll({ question: "", description: "", options: ["", ""], multipleChoice: false });
                }}
                disabled={createMutation.isPending}
                className="flex-1 px-4 py-2 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] text-[color:var(--chatdock-fg-primary)] hover:bg-[color:var(--chatdock-bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 투표 상세 보기 */}
      {selectedPoll && !isCreating && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[color:var(--chatdock-fg-primary)]">
                  {selectedPoll.question}
                </h3>
                {selectedPoll.description && (
                  <p className="mt-1 text-sm text-[color:var(--chatdock-fg-muted)]">
                    {selectedPoll.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs text-[color:var(--chatdock-fg-muted)]">
                  <span>{selectedPoll.createdBy.username}</span>
                  <span>•</span>
                  <span>{new Date(selectedPoll.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="text-blue-500">{selectedPoll.createdBy.role}</span>
                  {selectedPoll.multipleChoice && (
                    <>
                      <span>•</span>
                      <span className="text-purple-500">복수선택</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedPoll(null)}
                className="w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-[color:var(--chatdock-bg-hover)] text-[color:var(--chatdock-fg-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 투표 선택지 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-[color:var(--chatdock-fg-primary)]">
                선택지
              </div>
              {selectedPoll.options.map((option) => {
                const result = pollResults?.options.find(r => r.id === option.id);
                const percentage = pollResults && pollResults.totalVotes > 0
                  ? ((result?.voteCount || 0) / pollResults.totalVotes) * 100
                  : 0;

                return (
                  <div key={option.id} className="space-y-1">
                    <label className="flex items-center gap-2 p-3 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] hover:bg-[color:var(--chatdock-bg-hover)] cursor-pointer">
                      <input
                        type={selectedPoll.multipleChoice ? "checkbox" : "radio"}
                        name="poll-option"
                        checked={selectedOptions.includes(option.id)}
                        onChange={() => handleOptionToggle(option.id)}
                        className="w-4 h-4"
                      />
                      <span className="flex-1 text-sm text-[color:var(--chatdock-fg-primary)]">
                        {option.text}
                      </span>
                      {pollResults && (
                        <span className="text-xs text-[color:var(--chatdock-fg-muted)]">
                          {result?.voteCount || 0}표 ({percentage.toFixed(1)}%)
                        </span>
                      )}
                    </label>
                    {pollResults && (
                      <div className="h-2 bg-[color:var(--chatdock-bg-elev-1)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {pollResults && (
              <div className="p-3 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)]">
                <div className="text-sm text-[color:var(--chatdock-fg-primary)]">
                  총 투표 수: <span className="font-bold">{pollResults.totalVotes}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleVote}
                disabled={voteMutation.isPending || selectedOptions.length === 0}
                className="flex-1 px-4 py-2 rounded-[var(--radius-md)] bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {voteMutation.isPending ? "투표 중..." : "투표하기"}
              </button>
              {hasPermission === true && (
                <button
                  onClick={() => handleDeletePoll(selectedPoll.id)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 rounded-[var(--radius-md)] bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 투표 목록 */}
      {!isCreating && !selectedPoll && (
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-[color:var(--chatdock-fg-muted)]">
              <p className="text-sm">로딩 중...</p>
            </div>
          ) : polls.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[color:var(--chatdock-fg-muted)]">
              <p className="text-sm">등록된 투표가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-[color:var(--chatdock-border-subtle)]">
                {polls.map((poll) => (
                  <button
                    key={poll.id}
                    onClick={() => {
                      setSelectedPoll(poll);
                      setSelectedOptions([]);
                    }}
                    className="w-full p-4 text-left hover:bg-[color:var(--chatdock-bg-hover)] transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <h4 className="text-sm font-medium text-[color:var(--chatdock-fg-primary)] truncate">
                            {poll.question}
                          </h4>
                        </div>
                        {poll.description && (
                          <p className="mt-1 text-xs text-[color:var(--chatdock-fg-muted)] line-clamp-2">
                            {poll.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-xs text-[color:var(--chatdock-fg-muted)]">
                          <span>{poll.createdBy.username}</span>
                          <span>•</span>
                          <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                          {poll.multipleChoice && (
                            <>
                              <span>•</span>
                              <span className="text-purple-500">복수선택</span>
                            </>
                          )}
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
