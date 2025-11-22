// MyLibraryReviews.tsx - 내 서재 리뷰 전용 페이지
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMyLibraryReviews } from "@/hooks/api";

export default function MyLibraryReviews() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading } = useMyLibraryReviews({
    page,
    size: pageSize,
    sort: "createdAt,DESC",
  });

  const reviewPage = data?.reviewPage;
  const reviews = reviewPage?.content || [];
  const totalPages = reviewPage?.totalPages || 0;
  const totalElements = reviewPage?.totalElements || 0;

  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const toggleReviewExpand = (reviewId: string) => {
    const newSet = new Set(expandedReviews);
    if (newSet.has(reviewId)) {
      newSet.delete(reviewId);
    } else {
      newSet.add(reviewId);
    }
    setExpandedReviews(newSet);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full min-h-screen p-8" style={{ background: "#FFF9F2" }}>
      <div className="max-w-[1400px] mx-auto">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate("/my-library")}
            className="px-6 py-3 rounded-full hover:opacity-80 transition"
            style={{ background: "#6B4F3F", color: "white" }}
          >
            ← 내 서재로 돌아가기
          </button>
          <h1 className="text-4xl font-bold" style={{ color: "#6B4F3F" }}>
            리뷰 남긴 책들
          </h1>
          <div className="w-[200px]"></div> {/* Spacer for centering */}
        </div>

        {/* 총 개수 표시 */}
        <div className="mb-6 text-xl" style={{ color: "#666" }}>
          총 <span style={{ color: "#F4A261", fontWeight: "bold" }}>{totalElements}</span>개
        </div>

        {/* 리뷰 목록 */}
        <div className="mb-8">
          {isLoading ? (
            <div className="text-center py-20 text-2xl" style={{ color: "#999" }}>
              로딩 중...
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div
                  key={review.reviewId}
                  className="p-3 rounded-[20px]"
                  style={{ background: "white", border: "1px solid #E9E5DC" }}
                >
                  <div className="flex gap-3">
                    {/* 책 이미지 */}
                    <div
                      className="flex-shrink-0 w-[60px] h-[80px] rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition"
                      style={{ background: "#E9E5DC" }}
                      onClick={() => navigate(`/books/${review.bookId}`)}
                    >
                      {review.bookImageUrl ? (
                        <img
                          src={review.bookImageUrl}
                          alt={review.bookname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-1">
                          <p
                            className="text-center text-xs line-clamp-4"
                            style={{ color: "black", lineHeight: "1.2" }}
                          >
                            {review.bookname}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 리뷰 내용 */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-base font-semibold mb-1 cursor-pointer hover:underline line-clamp-1"
                        style={{ color: "#1E1E1E" }}
                        onClick={() => navigate(`/books/${review.bookId}`)}
                      >
                        {review.bookname}
                      </h3>

                      {/* 평점 */}
                      <div className="mb-1">
                        <span className="text-sm" style={{ color: "#F4A261" }}>
                          {"⭐".repeat(review.rating)}
                        </span>
                      </div>

                      {/* 리뷰 내용 */}
                      <div className="mb-1">
                        <p
                          className="text-sm whitespace-pre-wrap"
                          style={{ color: "#1E1E1E", lineHeight: "1.4" }}
                        >
                          {review.content.length > 100 && !expandedReviews.has(review.reviewId)
                            ? `${review.content.substring(0, 100)}...`
                            : review.content}
                        </p>
                        {review.content.length > 100 && (
                          <button
                            onClick={() => toggleReviewExpand(review.reviewId)}
                            className="mt-1 text-xs hover:underline"
                            style={{ color: "#6B4F3F" }}
                          >
                            {expandedReviews.has(review.reviewId) ? "접기" : "펼치기"}
                          </button>
                        )}
                      </div>

                      {/* 작성일 */}
                      <p className="text-xs" style={{ color: "#999" }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-2xl" style={{ color: "#999" }}>
              리뷰 남긴 책이 없습니다.
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition"
              style={{ background: "#6B4F3F", color: "white" }}
            >
              이전
            </button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => {
                if (
                  pageNum === 0 ||
                  pageNum === totalPages - 1 ||
                  (pageNum >= page - 2 && pageNum <= page + 2)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className="w-10 h-10 rounded-lg hover:opacity-80 transition"
                      style={{
                        background: page === pageNum ? "#F4A261" : "#E9E5DC",
                        color: page === pageNum ? "white" : "#1E1E1E",
                        fontWeight: page === pageNum ? "bold" : "normal",
                      }}
                    >
                      {pageNum + 1}
                    </button>
                  );
                } else if (pageNum === page - 3 || pageNum === page + 3) {
                  return (
                    <span key={pageNum} className="w-10 h-10 flex items-center justify-center">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition"
              style={{ background: "#6B4F3F", color: "white" }}
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
