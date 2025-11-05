// MYB_14.tsx - 내 서재 페이지
import React, { useState } from "react";

// 책 타입 정의
interface Book {
  id: number;
  title: string;
  author?: string;
  coverImage?: string;
}

// 목업 데이터 (나중에 API로 교체)
const mockWishlist: Book[] = [
  { id: 1, title: "책 제목 1", author: "저자 1" },
  { id: 2, title: "책 제목 2", author: "저자 2" },
  { id: 3, title: "책 제목 3", author: "저자 3" },
  { id: 4, title: "책 제목 4", author: "저자 4" },
  { id: 5, title: "책 제목 5", author: "저자 5" },
];

const mockReviewedBooks: Book[] = [
  { id: 6, title: "책 제목 1", author: "저자 1" },
  { id: 7, title: "책 제목 2", author: "저자 2" },
  { id: 8, title: "책 제목 3", author: "저자 3" },
  { id: 9, title: "책 제목 4", author: "저자 4" },
  { id: 10, title: "책 제목 5", author: "저자 5" },
];

export default function MYB_14() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    console.log("검색:", searchQuery);
    // TODO: 검색 API 호출
  };

  const handleBookClick = (book: Book) => {
    console.log("책 클릭:", book);
    // TODO: 책 상세 페이지로 이동
  };

  return (
    <div
      className="w-full min-h-screen p-8"
      style={{ background: "#FFF9F2" }}
    >
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
                  {mockWishlist.map((book) => (
                    <div
                      key={book.id}
                      onClick={() => handleBookClick(book)}
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
                      onClick={() => handleBookClick(book)}
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
