// MyLibraryHighlights.tsx - 내 서재 하이라이트 전용 페이지
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMyLibraryHighlights } from "@/hooks/api";

export default function MyLibraryHighlights() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading } = useMyLibraryHighlights({
    page,
    size: pageSize,
    sort: "createdAt,DESC",
  });

  const highlightPage = data?.highlightPage;
  const highlights = highlightPage?.content || [];
  const totalPages = highlightPage?.totalPages || 0;
  const totalElements = highlightPage?.totalElements || 0;

  const [expandedHighlights, setExpandedHighlights] = useState<Set<number>>(new Set());

  const toggleHighlightExpand = (highlightId: number) => {
    const newSet = new Set(expandedHighlights);
    if (newSet.has(highlightId)) {
      newSet.delete(highlightId);
    } else {
      newSet.add(highlightId);
    }
    setExpandedHighlights(newSet);
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
            하이라이트 남긴 책들
          </h1>
          <div className="w-[200px]"></div> {/* Spacer for centering */}
        </div>

        {/* 총 개수 표시 */}
        <div className="mb-6 text-xl" style={{ color: "#666" }}>
          총 <span style={{ color: "#E76F51", fontWeight: "bold" }}>{totalElements}</span>개
        </div>

        {/* 하이라이트 목록 */}
        <div className="mb-8">
          {isLoading ? (
            <div className="text-center py-20 text-2xl" style={{ color: "#999" }}>
              로딩 중...
            </div>
          ) : highlights.length > 0 ? (
            <div className="space-y-6">
              {highlights.map((highlight) => (
                <div
                  key={highlight.highlightId}
                  className="p-6 rounded-[20px]"
                  style={{ background: "white", border: "1px solid #E9E5DC" }}
                >
                  <div className="flex gap-6">
                    {/* 책 이미지 */}
                    <div
                      className="flex-shrink-0 w-[120px] h-[160px] rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition"
                      style={{ background: "#E9E5DC" }}
                      onClick={() => navigate(`/books/${highlight.bookId}`)}
                    >
                      {highlight.bookImageUrl ? (
                        <img
                          src={highlight.bookImageUrl}
                          alt={highlight.bookname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-3">
                          <p
                            className="text-center text-sm"
                            style={{ color: "black", lineHeight: "1.4" }}
                          >
                            {highlight.bookname}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 하이라이트 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3
                          className="text-2xl font-semibold cursor-pointer hover:underline"
                          style={{ color: "#1E1E1E" }}
                          onClick={() => navigate(`/books/${highlight.bookId}`)}
                        >
                          {highlight.bookname}
                        </h3>
                        {highlight.pageNumber && (
                          <span
                            className="flex-shrink-0 text-lg font-semibold"
                            style={{ color: "#E76F51" }}
                          >
                            p.{highlight.pageNumber}
                          </span>
                        )}
                      </div>

                      {/* 하이라이트 내용 */}
                      <div
                        className="mb-3 p-4 rounded-lg"
                        style={{ background: "#FFF9F2", borderLeft: "4px solid #E76F51" }}
                      >
                        <p
                          className="text-lg whitespace-pre-wrap"
                          style={{ color: "#1E1E1E", lineHeight: "1.6" }}
                        >
                          {highlight.content.length > 200 &&
                          !expandedHighlights.has(highlight.highlightId)
                            ? `${highlight.content.substring(0, 200)}...`
                            : highlight.content}
                        </p>
                        {highlight.content.length > 200 && (
                          <button
                            onClick={() => toggleHighlightExpand(highlight.highlightId)}
                            className="mt-2 text-sm hover:underline"
                            style={{ color: "#6B4F3F" }}
                          >
                            {expandedHighlights.has(highlight.highlightId) ? "접기" : "펼치기"}
                          </button>
                        )}
                      </div>

                      {/* 작성일 */}
                      <p className="text-sm" style={{ color: "#999" }}>
                        {new Date(highlight.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-2xl" style={{ color: "#999" }}>
              하이라이트 남긴 책이 없습니다.
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
                        background: page === pageNum ? "#E76F51" : "#E9E5DC",
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
