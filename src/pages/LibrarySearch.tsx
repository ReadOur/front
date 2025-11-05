// LibrarySearch.tsx - 내 서재 검색 결과 페이지
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// 책 타입 정의
interface Book {
  id: number;
  title: string;
  author?: string;
  coverImage?: string;
  isbn?: string;
}

// 목업 검색 결과 데이터 (나중에 API로 교체)
const mockSearchResults: Book[] = [
  { id: 1, title: "검색된 책 1", author: "저자 1", isbn: "1234567890" },
  { id: 2, title: "검색된 책 2", author: "저자 2", isbn: "1234567891" },
  { id: 3, title: "검색된 책 3", author: "저자 3", isbn: "1234567892" },
  { id: 4, title: "검색된 책 4", author: "저자 4", isbn: "1234567893" },
  { id: 5, title: "검색된 책 5", author: "저자 5", isbn: "1234567894" },
  { id: 6, title: "검색된 책 6", author: "저자 6", isbn: "1234567895" },
  { id: 7, title: "검색된 책 7", author: "저자 7", isbn: "1234567896" },
  { id: 8, title: "검색된 책 8", author: "저자 8", isbn: "1234567897" },
];

export default function LibrarySearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const [searchResults, setSearchResults] = useState<Book[]>([]);

  // 검색 실행
  useEffect(() => {
    if (queryFromUrl) {
      // TODO: 실제 검색 API 호출
      console.log("검색어:", queryFromUrl);
      setSearchResults(mockSearchResults);
    }
  }, [queryFromUrl]);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    navigate(`/library/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleBookClick = (book: Book) => {
    // TODO: 책 상세 페이지(BOD_15)로 이동
    navigate(`/books/${book.id}`);
  };

  return (
    <div
      className="w-full min-h-screen p-8"
      style={{ background: "#FFF9F2" }}
    >
      <div className="max-w-[1400px] mx-auto">
        {/* 검색바 */}
        <div className="mb-8">
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

        {/* 검색 결과 정보 */}
        {queryFromUrl && (
          <div className="mb-6">
            <h2
              className="text-2xl mb-2"
              style={{ color: "#6B4F3F" }}
            >
              "{queryFromUrl}" 검색 결과
            </h2>
            <p
              className="text-lg"
              style={{ color: "#6B4F3F", opacity: 0.7 }}
            >
              총 {searchResults.length}권의 책을 찾았습니다
            </p>
          </div>
        )}

        {/* 검색 결과 목록 */}
        {searchResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {searchResults.map((book) => (
              <div
                key={book.id}
                onClick={() => handleBookClick(book)}
                className="rounded-lg cursor-pointer hover:opacity-80 transition overflow-hidden"
                style={{ background: "#E9E5DC" }}
              >
                {/* 책 표지 영역 (나중에 이미지로 교체) */}
                <div
                  className="w-full aspect-[3/4] flex items-center justify-center"
                  style={{ background: "#D9D9D9" }}
                >
                  <span
                    className="text-center text-sm px-2"
                    style={{ color: "#6B4F3F", opacity: 0.5 }}
                  >
                    책 표지
                  </span>
                </div>

                {/* 책 정보 */}
                <div className="p-4">
                  <h3
                    className="font-semibold mb-1 truncate"
                    style={{
                      color: "black",
                      fontSize: "18px",
                    }}
                  >
                    {book.title}
                  </h3>
                  {book.author && (
                    <p
                      className="text-sm truncate"
                      style={{
                        color: "black",
                        opacity: 0.6,
                      }}
                    >
                      {book.author}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="text-center py-20"
            style={{ color: "#6B4F3F", opacity: 0.5 }}
          >
            <p className="text-2xl mb-2">검색 결과가 없습니다</p>
            <p className="text-lg">다른 검색어로 시도해보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
