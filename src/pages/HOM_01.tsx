// src/pages/HOM_01.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMainPageData } from "@/api/mainPage";
import { Post } from "@/api/posts";
import { PostListSkeleton } from "@/components/Skeleton/Skeleton";
import { BookOpen, TrendingUp, Clock, ArrowRight, PenSquare } from "lucide-react";

// 날짜 포맷 함수
function formatDate(dateString: string): string {
  const d = new Date(dateString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// 카테고리 한글 변환
function getCategoryLabel(category: string): string {
  const categoryMap: Record<string, string> = {
    FREE: "자유",
    NOTICE: "공지",
    REVIEW: "리뷰",
    DISCUSSION: "토의",
    QUESTION: "질문",
    GROUP: "모임",
  };
  return categoryMap[category] || category;
}

// 카테고리 정의
const CATEGORIES = [
  { key: "REVIEW", label: "리뷰", icon: "📚", color: "bg-blue-500/10 text-blue-600" },
  { key: "DISCUSSION", label: "토의", icon: "💬", color: "bg-green-500/10 text-green-600" },
  { key: "QUESTION", label: "질문", icon: "❓", color: "bg-yellow-500/10 text-yellow-600" },
  { key: "FREE", label: "자유", icon: "✨", color: "bg-purple-500/10 text-purple-600" },
  { key: "GROUP", label: "모임", icon: "👥", color: "bg-pink-500/10 text-pink-600" },
] as const;

// 게시글 카드 컴포넌트
interface PostCardProps {
  post: Post;
  onClick: () => void;
  showStats?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick, showStats = true }) => {
  const isHot = post.likeCount >= 10;
  const isNew = (Date.now() - new Date(post.createdAt).getTime()) / 36e5 < 24;

  return (
    <div
      onClick={onClick}
      className="group p-4 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] hover:bg-[color:var(--color-bg-subtle)] hover:border-[color:var(--color-border-hover)] transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* 카테고리 배지 */}
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-[color:var(--color-accent-subtle)] text-[color:var(--color-accent-fg)] mb-2">
            {getCategoryLabel(post.category)}
          </span>

          {/* 제목 */}
          <h3 className="text-base font-semibold text-[color:var(--color-fg)] group-hover:text-[color:var(--color-accent-fg)] transition-colors line-clamp-2 mb-2">
            {post.title}
            {isHot && <span className="ml-2 text-red-500 text-sm">🔥</span>}
            {isNew && <span className="ml-1 text-xs text-blue-500 font-bold">NEW</span>}
            {post.commentCount && post.commentCount > 0 && (
              <span className="ml-2 text-sm text-[color:var(--color-accent-fg)]">
                [{post.commentCount}]
              </span>
            )}
          </h3>

          {/* 메타 정보 */}
          <div className="flex items-center gap-3 text-sm text-[color:var(--color-fg-muted)]">
            <span>{post.authorNickname}</span>
            <span>•</span>
            <span>{formatDate(post.createdAt)}</span>
            {showStats && (
              <>
                <span>•</span>
                <span>👍 {post.likeCount}</span>
                <span>•</span>
                <span>👁️ {post.hit}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HOM_01() {
  const navigate = useNavigate();

  // 메인 페이지 데이터 조회 (인기 게시글 + 최근 게시글)
  const { data: mainPageData, isLoading } = useQuery({
    queryKey: ["main-page"],
    queryFn: getMainPageData,
    staleTime: 1000 * 60 * 5,
  });

  const hotPosts = mainPageData?.hotPosts || [];
  const recentPosts = mainPageData?.recentPosts || [];

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Hero Section - 환영 배너 */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-8 md:p-12 border border-[color:var(--color-border)]">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-[color:var(--color-accent-fg)]" />
            <h1 className="text-3xl md:text-4xl font-bold text-[color:var(--color-fg)]">
              ReadOur
            </h1>
          </div>
          <p className="text-lg md:text-xl text-[color:var(--color-fg-muted)] mb-6 max-w-2xl">
            함께 읽고, 함께 나누는 독서 커뮤니티
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/boards")}
              className="px-6 py-3 rounded-lg bg-[color:var(--color-accent-bg)] text-[color:var(--color-accent-fg)] font-semibold hover:bg-[color:var(--color-accent-bg-hover)] transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              게시판 둘러보기
            </button>
            <button
              onClick={() => navigate("/boards/write")}
              className="px-6 py-3 rounded-lg border border-[color:var(--color-border)] text-[color:var(--color-fg)] font-semibold hover:bg-[color:var(--color-bg-subtle)] transition-colors flex items-center gap-2"
            >
              <PenSquare className="w-5 h-5" />
              게시글 작성하기
            </button>
          </div>
        </div>
      </section>

      {/* 카테고리 바로가기 */}
      <section>
        <h2 className="text-2xl font-bold text-[color:var(--color-fg)] mb-6">
          카테고리
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => navigate(`/boards?category=${cat.key}`)}
              className={`p-6 rounded-xl border border-[color:var(--color-border)] hover:border-[color:var(--color-accent-fg)] transition-all duration-200 hover:shadow-lg group ${cat.color}`}
            >
              <div className="text-4xl mb-3">{cat.icon}</div>
              <div className="text-base font-semibold">{cat.label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 인기 게시글 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold text-[color:var(--color-fg)]">인기 게시글</h2>
          </div>
          <button
            onClick={() => navigate("/boards?sort=likeCount,desc")}
            className="text-sm text-[color:var(--color-accent-fg)] hover:underline flex items-center gap-1"
          >
            더보기
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <PostListSkeleton count={5} />
        ) : hotPosts && hotPosts.length > 0 ? (
          <div className="space-y-3">
            {hotPosts.map((post) => (
              <PostCard
                key={post.postId}
                post={post}
                onClick={() => navigate(`/boards/${post.postId}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[color:var(--color-fg-muted)]">
            아직 인기 게시글이 없습니다.
          </div>
        )}
      </section>

      {/* 최근 게시글 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-[color:var(--color-fg)]">최근 게시글</h2>
          </div>
          <button
            onClick={() => navigate("/boards")}
            className="text-sm text-[color:var(--color-accent-fg)] hover:underline flex items-center gap-1"
          >
            더보기
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <PostListSkeleton count={6} />
        ) : recentPosts && recentPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentPosts.map((post) => (
              <PostCard
                key={post.postId}
                post={post}
                onClick={() => navigate(`/boards/${post.postId}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[color:var(--color-fg-muted)]">
            아직 게시글이 없습니다.
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="text-center py-12 px-6 rounded-2xl bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-border)]">
        <h2 className="text-2xl font-bold text-[color:var(--color-fg)] mb-3">
          지금 바로 시작하세요
        </h2>
        <p className="text-[color:var(--color-fg-muted)] mb-6 max-w-2xl mx-auto">
          독서 후기를 공유하고, 다른 사람들의 생각을 들어보세요.
        </p>
        <button
          onClick={() => navigate("/boards/write")}
          className="px-8 py-4 rounded-lg bg-[color:var(--color-accent-bg)] text-[color:var(--color-accent-fg)] font-bold hover:bg-[color:var(--color-accent-bg-hover)] transition-colors inline-flex items-center gap-2"
        >
          <PenSquare className="w-5 h-5" />
          첫 게시글 작성하기
        </button>
      </section>
    </div>
  );
}
