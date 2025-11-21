// BOD_15.tsx - 책 상세 페이지
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useBookDetail,
  useBookDetailByISBN,
  useToggleWishlist,
  useRelatedPosts,
  useLibraryAvailability,
  useBookHighlights,
  useCreateBookHighlight,
  useUpdateBookHighlight,
  useDeleteBookHighlight,
  useBookReviews,
  useCreateBookReview,
  useUpdateBookReview,
  useDeleteBookReview,
} from "@/hooks/api";
import { useAuth } from "@/contexts/AuthContext";

export default function BOD_15() {
  const { bookId, isbn } = useParams<{ bookId?: string; isbn?: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [newHighlightContent, setNewHighlightContent] = useState("");
  const [newHighlightPage, setNewHighlightPage] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState<"summary" | "reviews" | "highlights">("summary");

  // 리뷰 관련 상태
  const [newReviewContent, setNewReviewContent] = useState("");
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewContent, setEditReviewContent] = useState("");
  const [editReviewRating, setEditReviewRating] = useState<number>(5);

  // 하이라이트 수정 관련 상태
  const [editingHighlightId, setEditingHighlightId] = useState<number | null>(null);
  const [editHighlightContent, setEditHighlightContent] = useState("");
  const [editHighlightPage, setEditHighlightPage] = useState<number | undefined>();

  // API 호출 - ISBN 또는 bookId 중 하나를 사용
  const { data: bookByISBN, isLoading: isLoadingBookByISBN } = useBookDetailByISBN(isbn || "");
  const { data: bookById, isLoading: isLoadingBookById } = useBookDetail(bookId || "");

  // ISBN 또는 bookId 중 하나로 가져온 책 정보 사용
  const book = isbn ? bookByISBN : bookById;
  const isLoadingBook = isbn ? isLoadingBookByISBN : isLoadingBookById;

  // book.bookId를 문자열로 변환하여 사용
  const actualBookId = book?.bookId ? book.bookId.toString() : bookId || "";

  console.log("BOD_15 debug:", {
    isbn,
    bookId,
    "book?.bookId": book?.bookId,
    actualBookId,
    "bookByISBN": bookByISBN,
    "bookById": bookById,
  });

  const { data: relatedPostsData, isLoading: isLoadingPosts } = useRelatedPosts(actualBookId, {
    page: 0,
    size: 6,
  });
  const { data: availability, isLoading: isLoadingAvailability } = useLibraryAvailability(
    book?.isbn13 || ""
  );
  const { data: highlightsData, isLoading: isLoadingHighlights } = useBookHighlights(
    actualBookId,
    { page: 0, size: 20 }
  );
  const { data: reviews, isLoading: isLoadingReviews } = useBookReviews(actualBookId);

  console.log("BOD_15 data:", {
    actualBookId,
    "highlightsData": highlightsData,
    "highlightsData?.items": highlightsData?.items,
    "highlightsData?.items?.length": highlightsData?.items?.length,
    "reviews": reviews,
    "reviews?.length": reviews?.length,
    "Array.isArray(reviews)": Array.isArray(reviews),
    "isLoadingHighlights": isLoadingHighlights,
    "isLoadingReviews": isLoadingReviews,
  });

  // 위시리스트 mutation
  const wishlistMutation = useToggleWishlist();

  // 하이라이트 mutation
  const createHighlightMutation = useCreateBookHighlight();
  const updateHighlightMutation = useUpdateBookHighlight();
  const deleteHighlightMutation = useDeleteBookHighlight();

  // 리뷰 mutation
  const createReviewMutation = useCreateBookReview();
  const updateReviewMutation = useUpdateBookReview();
  const deleteReviewMutation = useDeleteBookReview();

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    navigate(`/library/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleToggleWishlist = () => {
    if (!actualBookId || !book) return;

    wishlistMutation.mutate(
      {
        bookId: actualBookId,
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
    if (!isAuthenticated) {
      alert("로그인이 필요한 기능입니다.");
      navigate("/login");
      return;
    }

    if (!actualBookId || !newHighlightContent.trim()) {
      alert("하이라이트 내용을 입력해주세요.");
      return;
    }

    createHighlightMutation.mutate(
      {
        bookId: actualBookId,
        content: newHighlightContent.trim(),
        pageNumber: newHighlightPage,
      },
      {
        onSuccess: () => {
          setNewHighlightContent("");
          setNewHighlightPage(undefined);
        },
        onError: (error: any) => {
          const errorMessage = error.response?.data?.message || error.message || "하이라이트 추가에 실패했습니다.";
          alert(errorMessage);
        },
      }
    );
  };

  const handleStartEditHighlight = (highlightId: number, content: string, pageNumber?: number) => {
    setEditingHighlightId(highlightId);
    setEditHighlightContent(content);
    setEditHighlightPage(pageNumber);
  };

  const handleCancelEditHighlight = () => {
    setEditingHighlightId(null);
    setEditHighlightContent("");
    setEditHighlightPage(undefined);
  };

  const handleUpdateHighlight = (highlightId: number) => {
    if (!actualBookId || !editHighlightContent.trim()) {
      alert("하이라이트 내용을 입력해주세요.");
      return;
    }

    updateHighlightMutation.mutate(
      {
        bookId: actualBookId,
        highlightId: highlightId.toString(),
        content: editHighlightContent.trim(),
        pageNumber: editHighlightPage,
      },
      {
        onSuccess: () => {
          setEditingHighlightId(null);
          setEditHighlightContent("");
          setEditHighlightPage(undefined);
        },
        onError: (error: any) => {
          const errorMessage = error.response?.data?.message || error.message || "하이라이트 수정에 실패했습니다.";
          alert(errorMessage);
        },
      }
    );
  };

  const handleDeleteHighlight = (highlightId: number) => {
    if (!actualBookId) return;
    if (!confirm("하이라이트를 삭제하시겠습니까?")) return;

    console.log("하이라이트 삭제 요청:", { bookId: actualBookId, highlightId });

    deleteHighlightMutation.mutate(
      {
        bookId: actualBookId,
        highlightId: highlightId.toString(),
      },
      {
        onSuccess: () => {
          console.log("하이라이트 삭제 성공");
        },
        onError: (error: any) => {
          console.error("하이라이트 삭제 실패:", error);
          console.error("에러 응답:", error.response);
          const errorMessage = error.response?.data?.message || error.message || "하이라이트 삭제에 실패했습니다.";
          alert(errorMessage);
        },
      }
    );
  };

  const handleAddReview = () => {
    if (!isAuthenticated) {
      alert("로그인이 필요한 기능입니다.");
      navigate("/login");
      return;
    }

    if (!actualBookId || !newReviewContent.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    if (newReviewRating < 1 || newReviewRating > 5) {
      alert("평점은 1~5 사이로 선택해주세요.");
      return;
    }

    createReviewMutation.mutate(
      {
        bookId: actualBookId,
        content: newReviewContent.trim(),
        rating: newReviewRating,
      },
      {
        onSuccess: () => {
          setNewReviewContent("");
          setNewReviewRating(5);
        },
        onError: (error: any) => {
          const errorMessage = error.response?.data?.message || error.message || "리뷰 작성에 실패했습니다.";
          alert(errorMessage);
        },
      }
    );
  };

  const handleStartEditReview = (reviewId: string, content: string, rating: number) => {
    setEditingReviewId(reviewId);
    setEditReviewContent(content);
    setEditReviewRating(rating);
  };

  const handleCancelEditReview = () => {
    setEditingReviewId(null);
    setEditReviewContent("");
    setEditReviewRating(5);
  };

  const handleUpdateReview = (reviewId: string) => {
    if (!actualBookId || !editReviewContent.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    updateReviewMutation.mutate(
      {
        bookId: actualBookId,
        reviewId,
        content: editReviewContent.trim(),
        rating: editReviewRating,
      },
      {
        onSuccess: () => {
          setEditingReviewId(null);
          setEditReviewContent("");
          setEditReviewRating(5);
        },
        onError: () => {
          alert("리뷰 수정에 실패했습니다.");
        },
      }
    );
  };

  const handleDeleteReview = (reviewId: string) => {
    if (!actualBookId) return;
    if (!confirm("리뷰를 삭제하시겠습니까?")) return;

    deleteReviewMutation.mutate(
      {
        bookId: actualBookId,
        reviewId,
      },
      {
        onError: () => {
          alert("리뷰 삭제에 실패했습니다.");
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

  const highlights = highlightsData?.items || [];
  const relatedPosts = relatedPostsData?.items || [];

  console.log("BOD_15 render data:", {
    "highlights": highlights,
    "highlights.length": highlights.length,
    "reviews": reviews,
    "reviews?.length": reviews?.length,
  });

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
                  {availability.map((lib, index) => {
                    // hasBook에 따른 배경색 및 텍스트 결정
                    let background: string;
                    let color: string;
                    let statusText: string;

                    if (!lib.hasBook) {
                      // 책이 해당 도서관에 없음
                      background = "#D9D9D9";
                      color = "#6B4F3F";
                      statusText = "책이 해당 도서관에 없습니다";
                    } else if (lib.loanAvailable) {
                      // 대출 가능
                      background = "#90BE6D";
                      color = "white";
                      statusText = "대출 가능";
                    } else {
                      // 대출 불가능
                      background = "#F4A261";
                      color = "white";
                      statusText = "대출 불가능";
                    }

                    return (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-base"
                        style={{
                          background,
                          color,
                        }}
                      >
                        {lib.libraryName}: {statusText}
                      </span>
                    );
                  })}
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
          <div>
            {/* 리뷰 목록 */}
            {isLoadingReviews ? (
              <div className="text-xl mb-6" style={{ color: "#999" }}>
                로딩 중...
              </div>
            ) : Array.isArray(reviews) && reviews.length > 0 ? (
              <div className="space-y-4 mb-6">
                {reviews.map((review) => (
                  <div
                    key={review.reviewId}
                    className="p-5 rounded"
                    style={{ background: "#E9E5DC" }}
                  >
                    {editingReviewId === review.reviewId ? (
                      // 수정 모드
                      <div>
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base font-semibold" style={{ color: "#6B4F3F" }}>
                              평점:
                            </span>
                            <select
                              value={editReviewRating}
                              onChange={(e) => setEditReviewRating(parseInt(e.target.value))}
                              className="px-3 py-1 rounded outline-none text-base"
                              style={{
                                background: "white",
                                border: "1px solid #E9E5DC",
                                color: "#6B4F3F",
                              }}
                            >
                              {[5, 4, 3, 2, 1].map((rating) => (
                                <option key={rating} value={rating}>
                                  {"⭐".repeat(rating)} ({rating}점)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <textarea
                          value={editReviewContent}
                          onChange={(e) => setEditReviewContent(e.target.value)}
                          placeholder="리뷰 내용을 입력하세요"
                          className="w-full px-4 py-3 mb-3 rounded outline-none resize-none"
                          rows={4}
                          style={{
                            color: "#6B4F3F",
                            fontSize: "18px",
                            background: "white",
                            border: "1px solid #E9E5DC",
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateReview(review.reviewId)}
                            disabled={updateReviewMutation.isPending}
                            className="px-4 py-2 rounded text-base hover:opacity-90 transition"
                            style={{ background: "#90BE6D", color: "white", fontWeight: 600 }}
                          >
                            {updateReviewMutation.isPending ? "수정 중..." : "수정 완료"}
                          </button>
                          <button
                            onClick={handleCancelEditReview}
                            className="px-4 py-2 rounded text-base hover:opacity-90 transition"
                            style={{ background: "#999", color: "white" }}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 보기 모드
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xl" style={{ color: "#F4A261" }}>
                                {"⭐".repeat(review.rating)}
                              </span>
                              <span className="text-base font-semibold" style={{ color: "#6B4F3F" }}>
                                {review.userNickname}
                              </span>
                              <span className="text-sm" style={{ color: "#999" }}>
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-lg whitespace-pre-wrap" style={{ color: "#1E1E1E" }}>
                              {review.content}
                            </p>
                          </div>
                          {isAuthenticated && (
                            <div className="ml-4 flex gap-2">
                              <button
                                onClick={() =>
                                  handleStartEditReview(review.reviewId, review.content, review.rating)
                                }
                                className="px-3 py-1 rounded hover:opacity-70 transition text-base"
                                style={{ background: "#90BE6D", color: "white" }}
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDeleteReview(review.reviewId)}
                                className="px-3 py-1 rounded hover:opacity-70 transition text-base"
                                style={{ background: "#F4A261", color: "white" }}
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xl mb-6" style={{ color: "#999" }}>
                아직 작성된 리뷰가 없습니다.
              </div>
            )}

            {/* 리뷰 작성 폼 */}
            {isAuthenticated ? (
              <div className="p-6 rounded" style={{ background: "#E9E5DC" }}>
                <h3 className="text-xl font-semibold mb-4" style={{ color: "black" }}>
                  리뷰 작성
                </h3>
                <div className="mb-3">
                  <label className="text-base font-semibold mb-2 block" style={{ color: "#6B4F3F" }}>
                    평점
                  </label>
                  <select
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(parseInt(e.target.value))}
                    className="px-4 py-2 rounded text-lg outline-none"
                    style={{
                      background: "white",
                      border: "1px solid #E9E5DC",
                      color: "#6B4F3F",
                    }}
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>
                        {"⭐".repeat(rating)} ({rating}점)
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={newReviewContent}
                  onChange={(e) => setNewReviewContent(e.target.value)}
                  placeholder="이 책에 대한 리뷰를 작성해주세요"
                  className="w-full px-4 py-3 mb-3 rounded outline-none resize-none"
                  rows={4}
                  style={{
                    color: "#6B4F3F",
                    fontSize: "18px",
                    background: "white",
                    border: "1px solid #E9E5DC",
                  }}
                />
                <button
                  onClick={handleAddReview}
                  disabled={createReviewMutation.isPending}
                  className="px-6 py-2 rounded text-lg hover:opacity-90 transition"
                  style={{
                    background: "#90BE6D",
                    color: "white",
                    fontWeight: 600,
                  }}
                >
                  {createReviewMutation.isPending ? "작성 중..." : "리뷰 작성"}
                </button>
              </div>
            ) : (
              <div className="p-6 rounded text-center" style={{ background: "#E9E5DC" }}>
                <p className="text-lg mb-4" style={{ color: "#6B4F3F" }}>
                  리뷰를 작성하려면 로그인이 필요합니다.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="px-6 py-2 rounded text-lg hover:opacity-90 transition"
                  style={{
                    background: "#90BE6D",
                    color: "white",
                    fontWeight: 600,
                  }}
                >
                  로그인하기
                </button>
              </div>
            )}
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
                    {editingHighlightId === highlight.highlightId ? (
                      // 수정 모드
                      <div>
                        <textarea
                          value={editHighlightContent}
                          onChange={(e) => setEditHighlightContent(e.target.value)}
                          placeholder="하이라이트 내용을 입력하세요"
                          className="w-full px-4 py-3 mb-3 rounded outline-none resize-none"
                          rows={3}
                          style={{
                            color: "#6B4F3F",
                            fontSize: "18px",
                            background: "white",
                            border: "1px solid #E9E5DC",
                          }}
                        />
                        <div className="flex items-center gap-3 mb-3">
                          <label className="text-base font-semibold" style={{ color: "#6B4F3F" }}>
                            페이지 번호 (선택):
                          </label>
                          <input
                            type="number"
                            value={editHighlightPage || ""}
                            onChange={(e) =>
                              setEditHighlightPage(e.target.value ? parseInt(e.target.value) : undefined)
                            }
                            placeholder="예: 123"
                            className="px-3 py-2 rounded outline-none"
                            style={{
                              width: "120px",
                              color: "#6B4F3F",
                              fontSize: "16px",
                              background: "white",
                              border: "1px solid #E9E5DC",
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateHighlight(highlight.highlightId)}
                            disabled={updateHighlightMutation.isPending}
                            className="px-4 py-2 rounded text-base hover:opacity-90 transition"
                            style={{ background: "#90BE6D", color: "white", fontWeight: 600 }}
                          >
                            {updateHighlightMutation.isPending ? "수정 중..." : "수정 완료"}
                          </button>
                          <button
                            onClick={handleCancelEditHighlight}
                            className="px-4 py-2 rounded text-base hover:opacity-90 transition"
                            style={{ background: "#999", color: "white" }}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 보기 모드
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-xl mb-2" style={{ color: "#1E1E1E" }}>
                            "{highlight.content}"
                          </p>
                          <div className="flex items-center gap-4 text-base" style={{ color: "#6B4F3F" }}>
                            <span>{highlight.userNickname}</span>
                            {highlight.pageNumber && <span>p.{highlight.pageNumber}</span>}
                          </div>
                        </div>
                        {isAuthenticated && (
                          <div className="ml-4 flex gap-2">
                            <button
                              onClick={() =>
                                handleStartEditHighlight(
                                  highlight.highlightId,
                                  highlight.content,
                                  highlight.pageNumber
                                )
                              }
                              className="px-3 py-1 rounded hover:opacity-70 transition text-base"
                              style={{ background: "#90BE6D", color: "white" }}
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteHighlight(highlight.highlightId)}
                              className="px-3 py-1 rounded hover:opacity-70 transition text-base"
                              style={{ background: "#F4A261", color: "white" }}
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xl mb-6" style={{ color: "#999" }}>
                아직 추가된 하이라이트가 없습니다.
              </div>
            )}

            {/* 하이라이트 입력 */}
            {isAuthenticated ? (
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
            ) : (
              <div className="p-6 rounded text-center" style={{ background: "#E9E5DC" }}>
                <p className="text-lg mb-4" style={{ color: "#6B4F3F" }}>
                  하이라이트를 추가하려면 로그인이 필요합니다.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="px-6 py-2 rounded text-lg hover:opacity-90 transition"
                  style={{
                    background: "#90BE6D",
                    color: "white",
                    fontWeight: 600,
                  }}
                >
                  로그인하기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
