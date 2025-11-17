// MYB_14.tsx - 내 서재 페이지
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/hooks/api";

// 목업 데이터 - 리뷰 남긴 책들 (백엔드 API 대기 중)
const mockReviewedBooks = [
  { id: 6, title: "책 제목 1", author: "저자 1" },
  { id: 7, title: "책 제목 2", author: "저자 2" },
  { id: 8, title: "책 제목 3", author: "저자 3" },
  { id: 9, title: "책 제목 4", author: "저자 4" },
  { id: 10, title: "책 제목 5", author: "저자 5" },
];

// 목업 연관 검색어 (나중에 API로 교체)
const mockSuggestions = [
  "연관 검색 1",
  "연관 검색 2",
  "연관 검색 3",
  "연관 검색 4",
];

export default function MYB_14() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // API 호출: 위시리스트
  const { data: wishlistData, isLoading: isLoadingWishlist } = useWishlist();

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    console.log("검색:", searchTerm);
    navigate(`/library/search?q=${encodeURIComponent(searchTerm)}`);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleBookClick = (bookId: string) => {
    navigate(`/books/${bookId}`);
  };

  const wishlist = wishlistData || [];

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
                setShowSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => {
                if (searchQuery.length > 0) setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="찾고싶은 제목, 저자명을 입력해주세요"
              className="flex-1 outline-none text-2xl"
              style={{ color: "#1E1E1E" }}
            />
            <button
              onClick={() => handleSearch()}
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

          {/* 연관 검색어 드롭다운 */}
          {showSuggestions && searchQuery.length > 0 && (
            <div
              className="absolute top-full mt-4 w-full rounded-[30px] p-6 z-10"
              style={{ background: "#E9E5DC" }}
            >
              {mockSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="py-3 px-4 cursor-pointer hover:bg-black/5 transition rounded"
                  style={{
                    opacity: 0.4,
                    color: "black",
                    fontSize: "24px",
                    lineHeight: "24px",
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 위시리스트 섹션 */}
        <div className="mb-12">
          <div
            className="rounded-[30px] overflow-hidden"
            style={{ background: "#FFF9F2" }}
          >
            {/* 헤더 */}
            <div
              className="px-6 py-4 rounded-[30px]"
              style={{ background: "#90BE6D" }}
            >
              <h2
                className="text-2xl text-center"
                style={{ color: "#6B4F3F" }}
              >
                위시리스트
              </h2>
            </div>

            {/* 책 목록 - 가로 스크롤 */}
            <div className="p-8">
              {isLoadingWishlist ? (
                <div className="text-center py-12 text-xl" style={{ color: "#999" }}>
                  로딩 중...
                </div>
              ) : wishlist.length > 0 ? (
                <div className="flex gap-6 overflow-x-auto pb-4">
                  <style>{`
                    .book-scroll::-webkit-scrollbar {
                      height: 8px;
                    }
                    .book-scroll::-webkit-scrollbar-track {
                      background: #E9E5DC;
                      border-radius: 4px;
                    }
                    .book-scroll::-webkit-scrollbar-thumb {
                      background: #90BE6D;
                      border-radius: 4px;
                    }
                  `}</style>
                  <div className="book-scroll flex gap-6">
                    {wishlist.map((book) => (
                      <div
                        key={book.bookId}
                        onClick={() => handleBookClick(book.bookId)}
                        className="flex-shrink-0 w-[162px] h-[196px] rounded-lg cursor-pointer hover:opacity-80 transition overflow-hidden"
                        style={{ background: "#E9E5DC" }}
                      >
                        {book.thumbnail ? (
                          <img
                            src={book.thumbnail}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4">
                            <p
                              className="text-center"
                              style={{
                                color: "black",
                                fontSize: "18px",
                                lineHeight: "1.4",
                              }}
                            >
                              {book.title}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-xl" style={{ color: "#999" }}>
                  위시리스트가 비어있습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 리뷰 남긴 책들 섹션 */}
        <div>
          <div
            className="rounded-[30px] overflow-hidden"
            style={{ background: "#FFF9F2" }}
          >
            {/* 헤더 */}
            <div
              className="px-6 py-4 rounded-[30px]"
              style={{ background: "#90BE6D" }}
            >
              <h2
                className="text-2xl text-center"
                style={{ color: "#6B4F3F" }}
              >
                리뷰 남긴 책들
              </h2>
            </div>

            {/* 책 목록 - 가로 스크롤 */}
            <div className="p-8">
              <div className="flex gap-6 overflow-x-auto pb-4">
                <div className="book-scroll flex gap-6">
                  {mockReviewedBooks.map((book) => (
                    <div
                      key={book.id}
                      onClick={() => handleBookClick(book.id.toString())}
                      className="flex-shrink-0 w-[162px] h-[196px] rounded-lg cursor-pointer hover:opacity-80 transition flex items-center justify-center"
                      style={{ background: "#E9E5DC" }}
                    >
                      <p
                        className="text-center px-4"
                        style={{
                          color: "black",
                          fontSize: "24px",
                        }}
                      >
                        {book.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
