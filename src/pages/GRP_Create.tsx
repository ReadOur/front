import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePost } from "@/hooks/api";
import { useToast } from "@/components/Toast/ToastProvider";
import { useQueryClient } from "@tanstack/react-query";

/**
 * 모임 생성 전용 페이지 (GRP_Create)
 *
 * 일반 게시글 작성과 별개로 모임만의 특화된 생성 페이지
 */
export const GRP_Create = (): React.JSX.Element => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState<string>("");
  const [recruitmentLimit, setRecruitmentLimit] = useState<number>(10);
  const [description, setDescription] = useState<string>("");
  const [chatRoomName, setChatRoomName] = useState<string>("");
  const [chatRoomDescription, setChatRoomDescription] = useState<string>("");

  // 모임 게시글 생성 mutation (백엔드에서 채팅방도 자동 생성)
  const createGroupMutation = useCreatePost({
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["posts"], refetchType: "all" });
      toast.show({ title: "모임이 생성되었습니다!", variant: "success" });
      navigate(`/boards/${data.postId}`);
    },
    onError: (error) => {
      toast.show({ title: `모임 생성 실패: ${error.message}`, variant: "error" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    // 제목 검증
    if (!title.trim()) {
      toast.show({ title: "모임 제목을 입력해주세요.", variant: "warning" });
      return;
    }

    // 모집 인원 검증
    if (!recruitmentLimit || recruitmentLimit < 2) {
      toast.show({ title: "모집 인원은 최소 2명 이상이어야 합니다.", variant: "warning" });
      return;
    }

    if (recruitmentLimit > 100) {
      toast.show({ title: "모집 인원은 최대 100명까지 가능합니다.", variant: "warning" });
      return;
    }

    createGroupMutation.mutate({
      title: title.trim(),
      content: description.trim() || "모임에 참여해보세요!",
      category: "GROUP",
      recruitmentLimit: recruitmentLimit,
      chatRoomName: chatRoomName.trim() || title.trim(),
      chatRoomDescription: chatRoomDescription.trim() || description.trim() || "모임 채팅방입니다.",
    });
  };

  const isPending = createGroupMutation.isPending;

  return (
    <div
      className="w-full min-h-screen bg-[color:var(--color-bg-canvas)] text-[color:var(--color-fg-primary)]"
      style={{ fontFamily: "var(--font-sans, ui-sans-serif, system-ui)" }}
    >
      {/* 전체를 50px 내림 */}
      <div className="mx-auto max-w-[var(--layout-max)] px-6 py-8 mt-[50px]">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[color:var(--color-fg-primary)] mb-2">
              모임 만들기
            </h1>
            <p className="text-[color:var(--color-fg-muted)] text-sm">
              함께 책을 읽고 이야기를 나눌 모임을 만들어보세요
            </p>
          </div>

          {/* 작성부 카드 */}
          <div className="rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-1)] overflow-hidden border border-[color:var(--color-border-subtle)]">

            {/* 제목 영역 */}
            <div className="px-6 pt-8 pb-6">
              <label htmlFor="title-input" className="block mb-3 text-sm font-medium text-[color:var(--color-fg-primary)]">
                모임 제목 <span className="text-red-500">*</span>
              </label>
              <input
                id="title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 함께 읽는 독서 모임"
                maxLength={100}
                className="
                  w-full bg-[color:var(--color-bg-elev-2)] outline-none
                  text-2xl leading-[1.3] font-semibold
                  placeholder:text-[color:var(--color-fg-muted)]
                  border border-[color:var(--color-border-subtle)]
                  rounded-[var(--radius-md)]
                  px-4 py-3
                  focus:ring-2 focus:ring-[color:var(--color-accent)]
                "
                aria-label="모임 제목 입력"
              />
            </div>

            {/* 모집 인원 */}
            <div className="px-6 pb-6">
              <label htmlFor="limit-input" className="block mb-3 text-sm font-medium text-[color:var(--color-fg-primary)]">
                모집 인원 <span className="text-red-500">*</span>
              </label>
              <input
                id="limit-input"
                type="number"
                value={recruitmentLimit}
                onChange={(e) => setRecruitmentLimit(Number(e.target.value))}
                placeholder="예: 10"
                min={2}
                max={100}
                className="
                  w-full max-w-[300px] bg-[color:var(--color-bg-elev-2)] outline-none
                  text-lg
                  border border-[color:var(--color-border-subtle)]
                  rounded-[var(--radius-md)]
                  px-4 py-3
                  focus:ring-2 focus:ring-[color:var(--color-accent)]
                "
                aria-label="모집 인원 입력"
              />
              <p className="text-xs text-[color:var(--color-fg-muted)] mt-2">최소 2명 ~ 최대 100명</p>
            </div>

            {/* 채팅방 이름 */}
            <div className="px-6 pb-6">
              <label htmlFor="chatroom-name-input" className="block mb-3 text-sm font-medium text-[color:var(--color-fg-primary)]">
                채팅방 이름
              </label>
              <input
                id="chatroom-name-input"
                type="text"
                value={chatRoomName}
                onChange={(e) => setChatRoomName(e.target.value)}
                placeholder="비워두면 모임 제목과 동일하게 설정됩니다"
                maxLength={100}
                className="
                  w-full bg-[color:var(--color-bg-elev-2)] outline-none
                  text-lg
                  border border-[color:var(--color-border-subtle)]
                  rounded-[var(--radius-md)]
                  px-4 py-3
                  focus:ring-2 focus:ring-[color:var(--color-accent)]
                "
                aria-label="채팅방 이름 입력"
              />
            </div>

            {/* 구분선 */}
            <div className="mx-6 h-px bg-[color:var(--color-border-subtle)]" />

            {/* 설명 영역 */}
            <div className="px-6 pt-6 pb-6">
              <label htmlFor="description-input" className="block mb-3 text-sm font-medium text-[color:var(--color-fg-primary)]">
                모임 설명
              </label>
              <textarea
                id="description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="모임에 대한 간단한 설명을 입력해주세요"
                maxLength={1000}
                rows={6}
                className="
                  w-full bg-[color:var(--color-bg-elev-2)] outline-none
                  text-base leading-relaxed
                  placeholder:text-[color:var(--color-fg-muted)]
                  border border-[color:var(--color-border-subtle)]
                  rounded-[var(--radius-md)]
                  px-4 py-3
                  focus:ring-2 focus:ring-[color:var(--color-accent)]
                  resize-none
                "
                aria-label="모임 설명 입력"
              />
              <p className="text-xs text-[color:var(--color-fg-muted)] mt-2">
                {description.length} / 1000자
              </p>
            </div>

            {/* 채팅방 설명 */}
            <div className="px-6 pb-8">
              <label htmlFor="chatroom-description-input" className="block mb-3 text-sm font-medium text-[color:var(--color-fg-primary)]">
                채팅방 설명
              </label>
              <textarea
                id="chatroom-description-input"
                value={chatRoomDescription}
                onChange={(e) => setChatRoomDescription(e.target.value)}
                placeholder="비워두면 모임 설명과 동일하게 설정됩니다"
                maxLength={500}
                rows={4}
                className="
                  w-full bg-[color:var(--color-bg-elev-2)] outline-none
                  text-base leading-relaxed
                  placeholder:text-[color:var(--color-fg-muted)]
                  border border-[color:var(--color-border-subtle)]
                  rounded-[var(--radius-md)]
                  px-4 py-3
                  focus:ring-2 focus:ring-[color:var(--color-accent)]
                  resize-none
                "
                aria-label="채팅방 설명 입력"
              />
              <p className="text-xs text-[color:var(--color-fg-muted)] mt-2">
                {chatRoomDescription.length} / 500자
              </p>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/boards?category=GROUP")}
              disabled={isPending}
              className="
                px-8 py-3 text-base
                rounded-[var(--radius-md)]
                bg-[color:var(--color-bg-elev-2)]
                text-[color:var(--color-fg-primary)]
                border border-[color:var(--color-border-subtle)]
                hover:bg-[color:var(--color-bg-elev-1)]
                transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="
                px-8 py-3 text-base font-semibold
                rounded-[var(--radius-md)]
                bg-[color:var(--color-accent)]
                text-[color:var(--color-on-accent)]
                hover:opacity-90
                transition-opacity
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              aria-label="모임 생성"
            >
              {isPending ? "생성 중..." : "모임 만들기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
