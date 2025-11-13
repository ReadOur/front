// BOD_15.tsx - 책 상세 페이지
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useBookDetail,
  useToggleWishlist,
  useRelatedPosts,
  useLibraryAvailability,
  useBookHighlights,
  useCreateBookHighlight,
  useDeleteBookHighlight,
} from "@/hooks/api";

export default function BOD_15() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [newHighlightContent, setNewHighlightContent] = useState("");
  const [newHighlightPage, setNewHighlightPage] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState<"summary" | "reviews" | "highlights">("summary");

  // API 호출
  const { data: book, isLoading: isLoadingBook } = useBookDetail(bookId || "");
  const { data: relatedPostsData, isLoading: isLoadingPosts } = useRelatedPosts(bookId || "", {
    page: 0,
    size: 6,
  });
  const { data: availability, isLoading: isLoadingAvailability } = useLibraryAvailability(
    book?.isbn13 || ""
  );
  const { data: highlightsData, isLoading: isLoadingHighlights } = useBookHighlights(
    bookId || "",
    { page: 0, size: 20 }
  );

  // 위시리스트 mutation
  const wishlistMutation = useToggleWishlist();

  // 하이라이트 mutation
  const createHighlightMutation = useCreateBookHighlight();
  const deleteHighlightMutation = useDeleteBookHighlight();

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    navigate(`/library/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleToggleWishlist = () => {
    if (!bookId || !book) return;

    wishlistMutation.mutate(
      {
        bookId,
        isWishlisted: book.isWishlisted,
      },
      {
        onError: () => {
          alert("위시리스트 추가/제거에 실패했습니다.");
        },
      }
    );
  };

  const handleAddHighlight = () => {
    if (!bookId || !newHighlightContent.trim()) {
      alert("하이라이트 내용을 입력해주세요.");
      return;
    }

    createHighlightMutation.mutate(
      {
        bookId,
        content: newHighlightContent.trim(),
        pageNumber: newHighlightPage,
      },
      {
        onSuccess: () => {
          setNewHighlightContent("");
          setNewHighlightPage(undefined);
        },
        onError: () => {
          alert("하이라이트 추가에 실패했습니다.");
        },
      }
    );
  };

  const handleDeleteHighlight = (highlightId: number) => {
    if (!bookId) return;
    if (!confirm("하이라이트를 삭제하시겠습니까?")) return;

    deleteHighlightMutation.mutate(
      {
        bookId,
        highlightId: highlightId.toString(),
      },
      {
        onError: () => {
          alert("하이라이트 삭제에 실패했습니다.");
        },
      }
    );
  };

  const handlePostClick = (postId: number) => {
    navigate(`/boards/${postId}`);
  };

  if (isLoadingBook) {
    return (
      <div
        className="w-full min-h-screen p-8 flex items-center justify-center"
        style={{ background: "#FFF9F2" }}
      >
        <div className="text-2xl" style={{ color: "black" }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div
        className="w-full min-h-screen p-8 flex items-center justify-center"
        style={{ background: "#FFF9F2" }}
      >
        <div className="text-2xl" style={{ color: "black" }}>
          책 정보를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const highlights = highlightsData?.content || [];
  const relatedPosts = relatedPostsData?.content || [];

  return (
    <div className="w-full min-h-screen p-8" style={{ background: "#FFF9F2" }}>
      <div className="max-w-[1400px] mx-auto">
        {/* 검색바 */}
        <div className="mb-12">
          <div
            className="flex items-center gap-4 px-6 py-6 rounded-full"
            style={{
              background: "white",
              border: "1px solid #D9D9D9",
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="찾고싶은 제목, 저자명을 입력해주세요"
              className="flex-1 outline-none text-2xl"
              style={{ color: "#1E1E1E" }}
            />
            <button
              onClick={handleSearch}
              className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1E1E1E"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* 책 정보 섹션 */}
        <div className="flex gap-8 mb-12">
          {/* 책 표지 */}
          <div className="flex-shrink-0 w-[200px] h-[288px]">
            {book.bookImageUrl ? (
              <img
                src={book.bookImageUrl}
                alt={book.bookname}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "#D9D9D9" }}
              >
                <span style={{ color: "black", fontSize: "24px" }}>No Image</span>
              </div>
            )}
          </div>

          {/* 책 정보 */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold" style={{ color: "black" }}>
                {book.bookname}
              </h1>
              {/* 위시리스트 하트 버튼 */}
              <button
                onClick={handleToggleWishlist}
                disabled={wishlistMutation.isPending}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                aria-label={book.isWishlisted ? "위시리스트에서 제거" : "위시리스트에 추가"}
              >
                <span className="text-3xl">{book.isWishlisted ? "❤️" : "🤍"}</span>
              </button>
            </div>

            {/* 작가 및 출판사 */}
            <div className="text-xl mb-4" style={{ color: "#6B4F3F" }}>
              {book.authors && <span>{book.authors}</span>}
              {book.authors && book.publisher && <span className="mx-2">|</span>}
              {book.publisher && <span>{book.publisher}</span>}
              {book.publicationYear && <span className="mx-2">({book.publicationYear})</span>}
            </div>

            {/* 평점 */}
            <div className="text-2xl mb-4" style={{ color: "black" }}>
              평점: {book.averageRating ? book.averageRating.toFixed(2) : "평가 없음"}{" "}
              {book.reviewCount > 0 && <span className="text-lg">({book.reviewCount}개 리뷰)</span>}
            </div>

            {/* 도서관 대출 가능 여부 */}
            {!isLoadingAvailability && availability && availability.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-2" style={{ color: "#6B4F3F" }}>
                  선호 도서관 대출 가능 여부
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availability.map((lib, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-base"
                      style={{
                        background: lib.available ? "#90BE6D" : "#E9E5DC",
                        color: lib.available ? "white" : "#6B4F3F",
                      }}
                    >
                      {lib.libraryName}: {lib.available ? "대출 가능" : "대출 중"}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-4 mb-8 border-b-2" style={{ borderColor: "#E9E5DC" }}>
          <button
            onClick={() => setActiveTab("summary")}
            className="px-6 py-3 text-xl font-semibold transition"
            style={{
              color: activeTab === "summary" ? "#6B4F3F" : "#999",
              borderBottom: activeTab === "summary" ? "3px solid #6B4F3F" : "none",
              marginBottom: "-2px",
            }}
          >
            요약
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className="px-6 py-3 text-xl font-semibold transition"
            style={{
              color: activeTab === "reviews" ? "#6B4F3F" : "#999",
              borderBottom: activeTab === "reviews" ? "3px solid #6B4F3F" : "none",
              marginBottom: "-2px",
            }}
          >
            리뷰
          </button>
          <button
            onClick={() => setActiveTab("highlights")}
            className="px-6 py-3 text-xl font-semibold transition"
            style={{
              color: activeTab === "highlights" ? "#6B4F3F" : "#999",
              borderBottom: activeTab === "highlights" ? "3px solid #6B4F3F" : "none",
              marginBottom: "-2px",
            }}
          >
            하이라이트
          </button>
        </div>

        {/* 요약 탭 */}
        {activeTab === "summary" && (
          <div>
            {/* 책 설명 */}
            <p className="text-xl mb-8 whitespace-pre-wrap" style={{ color: "black" }}>
              {book.description}
            </p>

            {/* 연관 게시글 섹션 */}
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ color: "black" }}>
                이 책과 관련된 게시글
              </h2>
              {isLoadingPosts ? (
                <div className="text-xl" style={{ color: "#999" }}>
                  로딩 중...
                </div>
              ) : relatedPosts.length > 0 ? (
                <div className="space-y-4">
                  {relatedPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => handlePostClick(post.id)}
                      className="p-5 rounded cursor-pointer hover:opacity-80 transition"
                      style={{ background: "#E9E5DC" }}
                    >
                      <h3 className="text-xl font-bold mb-2" style={{ color: "black" }}>
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-4 text-base" style={{ color: "#6B4F3F" }}>
                        <span>{post.authorNickname}</span>
                        <span>조회 {post.viewCount}</span>
                        <span>좋아요 {post.likeCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xl text-center py-12" style={{ color: "#999" }}>
                  관련 게시글이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 리뷰 탭 */}
        {activeTab === "reviews" && (
          <div className="p-6 rounded-lg" style={{ background: "#E9E5DC" }}>
            <div className="text-center py-12 text-xl" style={{ color: "#999" }}>
              리뷰 기능은 추후 구현 예정입니다.
            </div>
          </div>
        )}

        {/* 하이라이트 탭 */}
        {activeTab === "highlights" && (
          <div>
            {/* 하이라이트 목록 */}
            {isLoadingHighlights ? (
              <div className="text-xl mb-6" style={{ color: "#999" }}>
                로딩 중...
              </div>
            ) : highlights.length > 0 ? (
              <div className="space-y-4 mb-6">
                {highlights.map((highlight) => (
                  <div
                    key={highlight.highlightId}
                    className="p-5 rounded"
                    style={{ background: "#E9E5DC" }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-xl mb-2" style={{ color: "#1E1E1E" }}>
                          "{highlight.content}"
                        </p>
                        <div className="flex items-center gap-4 text-base" style={{ color: "#6B4F3F" }}>
                          {highlight.pageNumber && <span>p.{highlight.pageNumber}</span>}
                          <span>{highlight.userNickname}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteHighlight(highlight.highlightId)}
                        className="ml-4 px-3 py-1 rounded hover:opacity-70 transition text-base"
                        style={{ background: "#F4A261", color: "white" }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xl mb-6" style={{ color: "#999" }}>
                아직 추가된 하이라이트가 없습니다.
              </div>
            )}

            {/* 하이라이트 입력 */}
            <div className="p-6 rounded" style={{ background: "#E9E5DC" }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: "black" }}>
                하이라이트 추가
              </h3>
              <textarea
                value={newHighlightContent}
                onChange={(e) => setNewHighlightContent(e.target.value)}
                placeholder="기억하고 싶은 문구를 입력하세요"
                className="w-full px-4 py-3 mb-3 rounded outline-none resize-none"
                rows={3}
                style={{
                  color: "#6B4F3F",
                  fontSize: "18px",
                  background: "white",
                  border: "1px solid #E9E5DC",
                }}
              />
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  value={newHighlightPage || ""}
                  onChange={(e) =>
                    setNewHighlightPage(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="페이지 번호 (선택)"
                  className="px-4 py-2 rounded text-lg outline-none"
                  style={{
                    width: "200px",
                    background: "white",
                    border: "1px solid #E9E5DC",
                    color: "#6B4F3F",
                  }}
                />
                <button
                  onClick={handleAddHighlight}
                  disabled={createHighlightMutation.isPending}
                  className="px-6 py-2 rounded text-lg hover:opacity-90 transition"
                  style={{
                    background: "#90BE6D",
                    color: "white",
                    fontWeight: 600,
                  }}
                >
                  {createHighlightMutation.isPending ? "추가 중..." : "추가"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
