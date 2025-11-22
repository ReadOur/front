// MYB_14.tsx - 내 서재 페이지
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useMyLibrary,
  useBookSearch,
} from "@/hooks/api";

export default function MYB_14() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // API 호출: 내 서재 메인 페이지 (위시리스트, 리뷰, 하이라이트 미리보기)
  const { data: myLibraryData, isLoading: isLoadingMyLibrary } = useMyLibrary();

  // 책 검색 API 호출
  const { data: searchResults, isLoading: isSearching } = useBookSearch({
    type: "TITLE",
    keyword: searchQuery,
    page: 0,
    size: 10,
  });

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBookClick = (isbn: string) => {
    // ISBN으로 책 상세 페이지로 이동
    navigate(`/books/isbn/${isbn}`);
    setShowResults(false);
    setSearchQuery("");
  };

  const wishlist = myLibraryData?.wishlist || [];
  const reviewedBooks = myLibraryData?.reviews || [];
  const highlights = myLibraryData?.highlights || [];

  return (
    <div
      className="w-full min-h-screen p-8"
      style={{ background: "#FFF9F2" }}
    >
      <div className="max-w-[1400px] mx-auto">
        {/* 검색바 */}
        <div className="mb-12 relative" ref={searchRef}>
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(e.target.value.length > 0);
              }}
              onFocus={() => {
                if (searchQuery.length > 0) setShowResults(true);
              }}
              placeholder="찾고싶은 제목, 저자명을 입력해주세요"
              className="flex-1 outline-none text-2xl"
              style={{ color: "#1E1E1E" }}
            />
            <button
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

          {/* 검색 결과 드롭다운 */}
          {showResults && searchQuery.length > 0 && (
            <div
              className="absolute top-full mt-4 w-full rounded-[30px] p-6 z-10 max-h-[500px] overflow-y-auto"
              style={{ background: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            >
              {isSearching ? (
                <div className="text-center py-8" style={{ color: "#999" }}>
                  검색 중...
                </div>
              ) : searchResults && searchResults.content.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.content.map((book, index) => (
                    <div
                      key={`${book.isbn13}-${index}`}
                      onClick={() => handleBookClick(book.isbn13)}
                      className="flex gap-4 p-4 cursor-pointer hover:bg-gray-50 rounded-lg transition"
                    >
                      {/* 책 이미지 */}
                      <div className="w-[80px] h-[110px] flex-shrink-0 rounded overflow-hidden bg-gray-200">
                        {book.bookImageURL ? (
                          <img
                            src={book.bookImageURL}
                            alt={book.bookname}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            📚
                          </div>
                        )}
                      </div>

                      {/* 책 정보 */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-lg font-semibold mb-1 line-clamp-2"
                          style={{ color: "#1E1E1E" }}
                        >
                          {book.bookname}
                        </h3>
                        <p className="text-sm mb-1" style={{ color: "#666" }}>
                          {book.authors}
                        </p>
                        <p className="text-xs" style={{ color: "#999" }}>
                          {book.publisher} · {book.publicationYear}
                        </p>
                        {book.averageRating != null && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-yellow-500 font-semibold">
                              ⭐ {book.averageRating.toFixed(1)}
                            </span>
                            <span className="text-xs" style={{ color: "#999" }}>
                              리뷰 {book.reviewCount}개
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8" style={{ color: "#999" }}>
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          )}
        </div>

        {/* 위시리스트 섹션 */}
        <div className="mb-6">
          <div
            className="rounded-[20px] overflow-hidden"
            style={{ background: "#FFF9F2" }}
          >
            {/* 헤더 with 버튼 */}
            <div
              className="px-6 py-3 rounded-[20px] flex items-center justify-between"
              style={{ background: "#90BE6D" }}
            >
              <h2
                className="text-xl font-semibold"
                style={{ color: "#6B4F3F" }}
              >
                위시리스트
              </h2>
              <button
                onClick={() => navigate("/my-library/wishlist")}
                className="px-4 py-1.5 rounded-full hover:opacity-80 transition text-sm"
                style={{ background: "#6B4F3F", color: "white" }}
              >
                전체보기
              </button>
            </div>

            {/* 책 목록 - 가로 스크롤 */}
            <div className="p-4">
              {isLoadingMyLibrary ? (
                <div className="text-center py-8 text-lg" style={{ color: "#999" }}>
                  로딩 중...
                </div>
              ) : wishlist.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  <style>{`
                    .book-scroll::-webkit-scrollbar {
                      height: 6px;
                    }
                    .book-scroll::-webkit-scrollbar-track {
                      background: #E9E5DC;
                      border-radius: 3px;
                    }
                    .book-scroll::-webkit-scrollbar-thumb {
                      background: #90BE6D;
                      border-radius: 3px;
                    }
                  `}</style>
                  <div className="book-scroll flex gap-4">
                    {wishlist.map((book) => (
                      <div
                        key={book.bookId}
                        onClick={() => navigate(`/books/${book.bookId}`)}
                        className="flex-shrink-0 w-[120px] h-[145px] rounded-lg cursor-pointer hover:opacity-80 transition overflow-hidden"
                        style={{ background: "#E9E5DC" }}
                      >
                        {book.bookImageUrl ? (
                          <img
                            src={book.bookImageUrl}
                            alt={book.bookname}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-3">
                            <p
                              className="text-center text-sm"
                              style={{
                                color: "black",
                                lineHeight: "1.3",
                              }}
                            >
                              {book.bookname}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-lg" style={{ color: "#999" }}>
                  위시리스트가 비어있습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 리뷰 남긴 책들 섹션 */}
        <div className="mb-6">
          <div
            className="rounded-[20px] overflow-hidden"
            style={{ background: "#FFF9F2" }}
          >
            {/* 헤더 with 버튼 */}
            <div
              className="px-6 py-3 rounded-[20px] flex items-center justify-between"
              style={{ background: "#F4A261" }}
            >
              <h2
                className="text-xl font-semibold"
                style={{ color: "#6B4F3F" }}
              >
                리뷰 남긴 책들
              </h2>
              <button
                onClick={() => navigate("/my-library/reviews")}
                className="px-4 py-1.5 rounded-full hover:opacity-80 transition text-sm"
                style={{ background: "#6B4F3F", color: "white" }}
              >
                전체보기
              </button>
            </div>

            {/* 책 목록 - 가로 스크롤 */}
            <div className="p-4">
              {isLoadingMyLibrary ? (
                <div className="text-center py-8 text-lg" style={{ color: "#999" }}>
                  로딩 중...
                </div>
              ) : reviewedBooks.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  <div className="book-scroll flex gap-4">
                    {reviewedBooks.map((review) => (
                      <div
                        key={review.reviewId}
                        onClick={() => navigate(`/books/${review.bookId}`)}
                        className="flex-shrink-0 w-[120px] h-[145px] rounded-lg cursor-pointer hover:opacity-80 transition overflow-hidden"
                        style={{ background: "#E9E5DC" }}
                      >
                        {review.bookImageUrl ? (
                          <img
                            src={review.bookImageUrl}
                            alt={review.bookname}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-3">
                            <p
                              className="text-center text-sm"
                              style={{
                                color: "black",
                                lineHeight: "1.3",
                              }}
                            >
                              {review.bookname}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-lg" style={{ color: "#999" }}>
                  리뷰 남긴 책이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하이라이트 남긴 책들 섹션 */}
        <div>
          <div
            className="rounded-[20px] overflow-hidden"
            style={{ background: "#FFF9F2" }}
          >
            {/* 헤더 with 버튼 */}
            <div
              className="px-6 py-3 rounded-[20px] flex items-center justify-between"
              style={{ background: "#E76F51" }}
            >
              <h2
                className="text-xl font-semibold"
                style={{ color: "white" }}
              >
                하이라이트 남긴 책들
              </h2>
              <button
                onClick={() => navigate("/my-library/highlights")}
                className="px-4 py-1.5 rounded-full hover:opacity-80 transition text-sm"
                style={{ background: "white", color: "#E76F51" }}
              >
                전체보기
              </button>
            </div>

            {/* 책 목록 - 가로 스크롤 */}
            <div className="p-4">
              {isLoadingMyLibrary ? (
                <div className="text-center py-8 text-lg" style={{ color: "#999" }}>
                  로딩 중...
                </div>
              ) : highlights.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  <div className="book-scroll flex gap-4">
                    {highlights.map((highlight) => (
                      <div
                        key={highlight.highlightId}
                        onClick={() => navigate(`/books/${highlight.bookId}`)}
                        className="flex-shrink-0 w-[120px] h-[145px] rounded-lg cursor-pointer hover:opacity-80 transition overflow-hidden"
                        style={{ background: "#E9E5DC" }}
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
                              style={{
                                color: "black",
                                lineHeight: "1.3",
                              }}
                            >
                              {highlight.bookname}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-lg" style={{ color: "#999" }}>
                  하이라이트 남긴 책이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
