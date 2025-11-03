import React, { useState } from "react";
import { useThreads } from "@/hooks/api";

/**
 * 채팅방 목록 페이지 (API 연동 버전)
 * - React Query로 채팅 스레드 목록 fetching
 * - 스레드 카드 클릭 시 상세 채팅으로 이동 (추후 구현)
 */

export default function MSG_07() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // ===== API 훅 =====
  const {
    data: threadsData,
    isLoading,
    error,
  } = useThreads({ page, pageSize });

  // ===== 이벤트 핸들러 =====
  const handleThreadClick = (threadId: string) => {
    // 추후 구현: 채팅 상세 페이지로 이동 또는 모달 오픈
    console.log("스레드 클릭:", threadId);
    alert(`스레드 ${threadId} - 채팅 상세 페이지는 준비 중입니다.`);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (threadsData?.meta.hasNext) setPage(page + 1);
  };

  // ===== 로딩 및 에러 처리 =====
  if (isLoading) {
    return (
      <section className="w-full min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-[color:var(--color-accent)] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-[color:var(--color-fg-muted)]">채팅방을 불러오는 중...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[color:var(--color-error)] text-lg mb-4">
            채팅방을 불러오는 데 실패했습니다.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[color:var(--color-accent)] rounded-lg hover:opacity-90"
          >
            다시 시도
          </button>
        </div>
      </section>
    );
  }

  const threads = threadsData?.items || [];
  const meta = threadsData?.meta;

  return (
    <section className="w-full max-w-5xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[color:var(--color-fg-primary)]">채팅방</h1>
          <p className="mt-2 text-[color:var(--color-fg-muted)]">
            {meta ? `전체 ${meta.totalItems.toLocaleString()}개의 대화` : "대화 목록"}
          </p>
          <p className="text-xs text-[color:var(--color-fg-muted)] mt-1">
            💡 오른쪽 하단의 ChatDock은 계속 따로 작동합니다
          </p>
        </div>

        {/* 새 채팅 시작 버튼 (추후 구현) */}
        <button
          onClick={() => alert("새 채팅 시작 기능은 준비 중입니다.")}
          className="px-4 py-2 bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] rounded-lg font-semibold hover:opacity-90"
        >
          💬 새 채팅
        </button>
      </div>

      {/* 채팅방 목록 */}
      {threads.length === 0 ? (
        <div className="text-center py-16 bg-[color:var(--color-bg-elev-1)] rounded-xl border border-[color:var(--color-border-subtle)]">
          <p className="text-[color:var(--color-fg-muted)] text-lg">
            아직 채팅방이 없습니다.
          </p>
          <p className="text-[color:var(--color-fg-muted)] text-sm mt-2">
            새 채팅을 시작해보세요!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => {
            const otherParticipants = thread.participants.slice(0, 3);
            const moreCount = Math.max(0, thread.participants.length - 3);
            const threadTitle = thread.title || otherParticipants.map(u => u.nickname).join(", ");

            return (
              <article
                key={thread.id}
                onClick={() => handleThreadClick(thread.id)}
                className="bg-[color:var(--color-bg-elev-1)] border border-[color:var(--color-border-subtle)] rounded-xl p-5 hover:border-[color:var(--color-accent)] hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* 아바타 영역 */}
                  <div className="shrink-0 relative">
                    {otherParticipants.length === 1 ? (
                      // 1:1 채팅
                      <div className="w-14 h-14 rounded-full bg-[color:var(--color-bg-elev-2)] border-2 border-[color:var(--color-border-subtle)] flex items-center justify-center text-[color:var(--color-fg-muted)] font-bold text-lg">
                        {otherParticipants[0].nickname[0]?.toUpperCase() || "?"}
                      </div>
                    ) : (
                      // 그룹 채팅 (여러 아바타 겹치기)
                      <div className="relative w-14 h-14">
                        {otherParticipants.slice(0, 2).map((user, idx) => (
                          <div
                            key={user.id}
                            className="absolute w-10 h-10 rounded-full bg-[color:var(--color-bg-elev-2)] border-2 border-[color:var(--color-bg-elev-1)] flex items-center justify-center text-[color:var(--color-fg-muted)] font-semibold text-sm"
                            style={{
                              left: idx * 16,
                              top: idx * 8,
                              zIndex: 2 - idx,
                            }}
                          >
                            {user.nickname[0]?.toUpperCase() || "?"}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 온라인 표시 (1:1 채팅만) */}
                    {otherParticipants.length === 1 && otherParticipants[0].online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[color:var(--color-secondary)] border-2 border-[color:var(--color-bg-elev-1)] rounded-full"></div>
                    )}
                  </div>

                  {/* 채팅 정보 */}
                  <div className="flex-1 min-w-0">
                    {/* 제목 및 타입 */}
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-[color:var(--color-fg-primary)] truncate">
                        {threadTitle}
                        {moreCount > 0 && (
                          <span className="text-[color:var(--color-fg-muted)] text-sm font-normal ml-1">
                            외 {moreCount}명
                          </span>
                        )}
                      </h2>
                      {thread.type === "GROUP" && (
                        <span className="px-2 py-0.5 bg-[color:var(--color-bg-elev-2)] text-[color:var(--color-fg-muted)] rounded text-xs">
                          그룹
                        </span>
                      )}
                    </div>

                    {/* 마지막 메시지 */}
                    {thread.lastMessage && (
                      <p className="text-sm text-[color:var(--color-fg-muted)] truncate mb-1">
                        {thread.lastMessage.sender.nickname}: {thread.lastMessage.content}
                      </p>
                    )}

                    {/* 시간 */}
                    {thread.lastMessage && (
                      <p className="text-xs text-[color:var(--color-fg-muted)]">
                        {new Date(thread.lastMessage.createdAt).toLocaleString("ko-KR")}
                      </p>
                    )}
                  </div>

                  {/* 우측: 읽지 않은 메시지 수 */}
                  {thread.unreadCount > 0 && (
                    <div className="shrink-0">
                      <div className="min-w-6 h-6 px-2 bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] rounded-full flex items-center justify-center text-xs font-bold">
                        {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={!meta.hasPrevious}
            className="px-4 py-2 border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] rounded-lg hover:bg-[color:var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← 이전
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[color:var(--color-fg-muted)]">
              {page} / {meta.totalPages}
            </span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={!meta.hasNext}
            className="px-4 py-2 border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] rounded-lg hover:bg-[color:var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음 →
          </button>
        </div>
      )}
    </section>
  );
}
