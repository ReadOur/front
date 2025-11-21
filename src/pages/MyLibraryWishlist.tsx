// MyLibraryWishlist.tsx - 내 서재 위시리스트 전용 페이지
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMyLibraryWishlist } from "@/hooks/api";

export default function MyLibraryWishlist() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading } = useMyLibraryWishlist({
    page,
    size: pageSize,
    sort: "createdAt,ASC",
  });

  const wishlistPage = data?.wishlistPage;
  const wishlist = wishlistPage?.content || [];
  const totalPages = wishlistPage?.totalPages || 0;
  const totalElements = wishlistPage?.totalElements || 0;

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
            위시리스트
          </h1>
          <div className="w-[200px]"></div> {/* Spacer for centering */}
        </div>

        {/* 총 개수 표시 */}
        <div className="mb-6 text-xl" style={{ color: "#666" }}>
          총 <span style={{ color: "#90BE6D", fontWeight: "bold" }}>{totalElements}</span>권
        </div>

        {/* 책 목록 - 그리드 */}
        <div className="mb-8">
          {isLoading ? (
            <div className="text-center py-20 text-2xl" style={{ color: "#999" }}>
              로딩 중...
            </div>
          ) : wishlist.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {wishlist.map((book) => (
                <div
                  key={book.bookId}
                  onClick={() => navigate(`/books/${book.bookId}`)}
                  className="cursor-pointer hover:opacity-80 transition"
                >
                  {/* 책 이미지 */}
                  <div
                    className="w-full aspect-[3/4] rounded-lg overflow-hidden mb-3"
                    style={{ background: "#E9E5DC" }}
                  >
                    {book.bookImageUrl ? (
                      <img
                        src={book.bookImageUrl}
                        alt={book.bookname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <p
                          className="text-center"
                          style={{
                            color: "black",
                            fontSize: "16px",
                            lineHeight: "1.4",
                          }}
                        >
                          {book.bookname}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 책 정보 */}
                  <h3
                    className="text-lg font-semibold mb-1 line-clamp-2"
                    style={{ color: "#1E1E1E" }}
                  >
                    {book.bookname}
                  </h3>
                  <p className="text-sm" style={{ color: "#666" }}>
                    {book.authors}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-2xl" style={{ color: "#999" }}>
              위시리스트가 비어있습니다.
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
                // 현재 페이지 주변만 표시
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
                        background: page === pageNum ? "#90BE6D" : "#E9E5DC",
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
