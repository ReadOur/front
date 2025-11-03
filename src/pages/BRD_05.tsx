import React, { useState } from "react";

/**
 * 토큰 규칙:
 *  - 절대 하드코딩 금지(색/그림자/경계/텍스트 등)
 *  - 색상은 반드시 var(--color-*)로 참조
 *  - 다크테마는 data-theme="dark"에서 토큰 전환
 */

export default function PostShow() {
  const [commentText, setCommentText] = useState("");
  const [likes, setLikes] = useState(24);
  const [isLiked, setIsLiked] = useState(false);

  // 데모용 더미 데이터 (추후 API로 교체)
  const postData = {
    title: "게시글 1",
    date: "2025.09.15 19:16",
    views: 123,
    author: "닉네임",
    content: "(굉장히 의미 깊고 누구나 봐서 박수를 참지 못할 글)",
    attachments: 3,
  };

  const [comments, setComments] = useState([
    {
      id: 1,
      author: "(정말 지적인 유저)",
      content: "(정말 유익한 댓글)",
      date: "2025.09.15 22:30",
      avatar: "https://c.animaapp.com/eGtOkC23/img/------.png",
    },
  ]);

  function handleLike() {
    setIsLiked((v) => !v);
    setLikes((n) => (isLiked ? n - 1 : n + 1));
  }

  function handleCommentSubmit() {
    const t = commentText.trim();
    if (!t) return;
    const newItem = {
      id: Date.now(),
      author: "나",
      content: t,
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      avatar: "https://c.animaapp.com/eGtOkC23/img/------.png",
    };
    setComments((arr) => [newItem, ...arr]);
    setCommentText("");
  }

  return (
    <main
      className="w-full min-w-[1100px] min-h-[800px] mx-auto px-6 py-8 bg-[color:var(--color-bg-elev-1)]"
      data-model-id="post:show"
    >
      {/* 헤더 바 */}
      <section className="rounded-xl overflow-hidden border border-[color:var(--color-border-subtle)] shadow-sm mb-4">
        <div className="h-[68px] bg-[color:var(--color-accent)] flex items-center justify-between px-5">
          <h2 className="text-[color:var(--color-fg-secondary)] text-xl font-semibold">게시글</h2>
          <div className="flex items-center gap-4 text-[color:var(--color-fg-secondary)] text-sm">
            <span>작성: {postData.date}</span>
            <span>조회: {postData.views.toLocaleString()}</span>
            <span>작성자: {postData.author}</span>
          </div>
        </div>
      </section>

      {/* 본문 카드 */}
      <article
        aria-labelledby="title"
        className="bg-[color:var(--color-bg-elev-1)] border border-[color:var(--color-border-subtle)] rounded-xl p-5 shadow-sm"
      >
        <header className="flex items-center justify-between gap-4">
          <h1 id="title" className="text-2xl font-extrabold text-[color:var(--color-fg-primary)]">
            {postData.title}
          </h1>

          {/* 좋아요 버튼 */}
          <button
            onClick={handleLike}
            aria-pressed={isLiked}
            aria-label={`좋아요 ${likes}개`}
            className="inline-flex items-center gap-2 bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] rounded-lg px-3 py-2 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
            data-active={isLiked}
          >
            <span>❤</span>
            <strong className="text-[color:var(--color-fg-primary)]">{likes}</strong>
          </button>
        </header>

        {/* 첨부파일 영역 */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`첨부파일 ${postData.attachments}개`}
          className="mt-3 bg-[color:var(--color-bg-elev-2)] border border-dashed border-[color:var(--color-border-subtle)] rounded-lg px-3 py-2 flex items-center justify-between"
        >
          <span className="text-[color:var(--color-fg-primary)] font-medium">
            첨부파일 ({postData.attachments})
          </span>
          <span className="text-[color:var(--color-fg-secondary)]">▼</span>
        </div>

        {/* 본문 내용 */}
        <div className="mt-4 text-[color:var(--color-fg-primary)] leading-relaxed">
          {postData.content}
        </div>
      </article>

      {/* 댓글 섹션 */}
      <section className="mt-5 bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] rounded-xl p-4">
        <h2 className="text-lg font-semibold text-[color:var(--color-fg-primary)] flex items-baseline gap-2">
          댓글 <span className="text-[color:#b45309]">[{comments.length}]</span>
        </h2>

        {/* 입력 */}
        <div className="grid grid-cols-[1fr_auto] gap-2 mt-3">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글을 입력하세요"
            aria-label="댓글 입력"
            className="px-3 py-2 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] text-[color:var(--color-fg-primary)] outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
          />
          <button
            onClick={handleCommentSubmit}
            className="px-4 py-2 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-accent)] font-semibold hover:opacity-90"
          >
            등록
          </button>
        </div>

        {/* 목록 */}
        <div className="mt-3" aria-live="polite">
          {comments.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[40px_1fr] gap-3 py-3 border-t first:border-t-0 border-[color:var(--color-border-subtle)]"
            >
              <img
                src={c.avatar}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)]"
              />
              <div>
                <div className="text-[color:var(--color-fg-primary)]">{c.content}</div>
                <div className="text-xs text-[color:var(--color-fg-secondary)] mt-1">
                  {c.author} · {c.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
