// PRF_10.tsx - 마이페이지
import React from "react";
import { useNavigate } from "react-router-dom";
import { useMyPage } from "@/hooks/api";
import { Loading } from "@/components/Loading";
import { User, FileText, MessageSquare, Heart, Settings } from "lucide-react";

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
    NOTI: "모임",
  };
  return categoryMap[category] || category;
}

export default function PRF_10() {
  const navigate = useNavigate();
  const { data: myPage, isLoading, error } = useMyPage();

  // 로딩 중
  if (isLoading) {
    return <Loading message="마이페이지를 불러오는 중..." />;
  }

  // 에러 또는 데이터 없음
  if (error || !myPage) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: "#FFF9F2" }}>
        <div className="text-center">
          <p className="text-red-600 mb-4">마이페이지를 불러오는 데 실패했습니다.</p>
          <button
            onClick={() => navigate("/boards")}
            className="px-6 py-3 rounded-lg hover:opacity-80 transition"
            style={{ background: "#90BE6D", color: "#6B4F3F" }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-4 sm:p-8" style={{ background: "#FFF9F2" }}>
      <div className="max-w-[1400px] mx-auto">
        {/* 설정 버튼 */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => navigate("/settings")}
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:opacity-80 transition flex items-center gap-2"
            style={{ background: "#90BE6D", color: "#6B4F3F" }}
          >
            <Settings className="w-5 h-5" />
            <span className="text-base sm:text-xl font-semibold">설정</span>
          </button>
        </div>

        {/* 사용자 정보 & 통계 */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 mb-8 shadow-sm border border-[#E9E5DC]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
            {/* 프로필 이미지 */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#90BE6D" }}>
              {myPage.user.avatarUrl ? (
                <img src={myPage.user.avatarUrl} alt="프로필" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-10 h-10" style={{ color: "#6B4F3F" }} />
              )}
            </div>

            {/* 사용자 정보 */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: "#6B4F3F" }}>
                {myPage.user.nickname}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">{myPage.user.email}</p>
              {myPage.user.bio && (
                <p className="text-sm text-gray-500 mt-2">{myPage.user.bio}</p>
              )}
            </div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg" style={{ background: "#FFF9F2" }}>
              <FileText className="w-6 h-6 mx-auto mb-2" style={{ color: "#90BE6D" }} />
              <p className="text-2xl font-bold mb-1" style={{ color: "#6B4F3F" }}>
                {myPage.stats.postsCount}
              </p>
              <p className="text-sm text-gray-600">게시글</p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ background: "#FFF9F2" }}>
              <MessageSquare className="w-6 h-6 mx-auto mb-2" style={{ color: "#90BE6D" }} />
              <p className="text-2xl font-bold mb-1" style={{ color: "#6B4F3F" }}>
                {myPage.stats.commentsCount}
              </p>
              <p className="text-sm text-gray-600">댓글</p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ background: "#FFF9F2" }}>
              <Heart className="w-6 h-6 mx-auto mb-2" style={{ color: "#90BE6D" }} />
              <p className="text-2xl font-bold mb-1" style={{ color: "#6B4F3F" }}>
                {myPage.stats.likedPostsCount}
              </p>
              <p className="text-sm text-gray-600">좋아요</p>
            </div>
          </div>
        </div>

        {/* 컨텐츠 섹션들 */}
        <div className="space-y-8">
          {/* 내가 작성한 게시글 */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#FFF9F2" }}>
            <div className="px-6 py-4" style={{ background: "#90BE6D" }}>
              <h2 className="text-xl sm:text-2xl font-semibold text-center" style={{ color: "#6B4F3F" }}>
                내가 작성한 게시글
              </h2>
            </div>
            <div className="p-4">
              {myPage.recentPosts.length > 0 ? (
                <div className="space-y-3">
                  {myPage.recentPosts.map((post) => (
                    <div
                      key={post.postId}
                      onClick={() => navigate(`/boards/${post.postId}`)}
                      className="p-4 rounded-lg cursor-pointer hover:opacity-80 transition"
                      style={{ background: "#E9E5DC" }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-block px-2 py-0.5 text-xs font-medium rounded" style={{ background: "#90BE6D", color: "#6B4F3F" }}>
                              {getCategoryLabel(post.category)}
                            </span>
                            <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                          </div>
                          <h3 className="font-semibold text-base sm:text-lg truncate" style={{ color: "#6B4F3F" }}>
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                            <span>👁️ {post.hit}</span>
                            <span>👍 {post.likeCount}</span>
                            <span>💬 {post.commentCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">작성한 게시글이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 내가 작성한 댓글 */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#FFF9F2" }}>
            <div className="px-6 py-4" style={{ background: "#90BE6D" }}>
              <h2 className="text-xl sm:text-2xl font-semibold text-center" style={{ color: "#6B4F3F" }}>
                내가 작성한 댓글
              </h2>
            </div>
            <div className="p-4">
              {myPage.recentComments.length > 0 ? (
                <div className="space-y-3">
                  {myPage.recentComments.map((comment) => (
                    <div
                      key={comment.commentId}
                      onClick={() => navigate(`/boards/${comment.postId}`)}
                      className="p-4 rounded-lg cursor-pointer hover:opacity-80 transition"
                      style={{ background: "#E9E5DC" }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-500 mb-1">
                            게시글: <span className="font-medium" style={{ color: "#6B4F3F" }}>{comment.postTitle}</span>
                          </p>
                          <p className="text-base mb-2" style={{ color: "#6B4F3F" }}>
                            {comment.content}
                          </p>
                          <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">작성한 댓글이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 좋아요 누른 글 */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#FFF9F2" }}>
            <div className="px-6 py-4" style={{ background: "#90BE6D" }}>
              <h2 className="text-xl sm:text-2xl font-semibold text-center" style={{ color: "#6B4F3F" }}>
                좋아요 누른 글
              </h2>
            </div>
            <div className="p-4">
              {myPage.likedPosts.length > 0 ? (
                <div className="space-y-3">
                  {myPage.likedPosts.map((post) => (
                    <div
                      key={post.postId}
                      onClick={() => navigate(`/boards/${post.postId}`)}
                      className="p-4 rounded-lg cursor-pointer hover:opacity-80 transition"
                      style={{ background: "#E9E5DC" }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-block px-2 py-0.5 text-xs font-medium rounded" style={{ background: "#90BE6D", color: "#6B4F3F" }}>
                              {getCategoryLabel(post.category)}
                            </span>
                            <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                          </div>
                          <h3 className="font-semibold text-base sm:text-lg truncate" style={{ color: "#6B4F3F" }}>
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                            <span>👁️ {post.hit}</span>
                            <span>👍 {post.likeCount}</span>
                            <span>💬 {post.commentCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">좋아요 누른 글이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
