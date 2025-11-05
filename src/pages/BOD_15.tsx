// BOD_15.tsx - 책 상세 페이지
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// 책 타입 정의
interface Book {
  id: number;
  title: string;
  author?: string;
  description?: string;
  rating?: number;
  coverImage?: string;
}

// 댓글 타입 정의
interface Comment {
  id: number;
  username: string;
  content: string;
  rating: number;
  createdAt: string;
}

// 목업 데이터 (나중에 API로 교체)
const mockBook: Book = {
  id: 1,
  title: "책 제목",
  author: "저자명",
  description: "설명문입니다. 이 책은 정말 흥미로운 내용을 담고 있습니다.",
  rating: 4.11,
};

const mockComments: Comment[] = [
  {
    id: 1,
    username: "(정말 지적인 유저)",
    content: "(정말 유익한 댓글)",
    rating: 4.0,
    createdAt: "2025.09.15 22:30",
  },
];

const mockRecommendations: Book[] = [
  { id: 2, title: "제목 2", rating: 3.6 },
  { id: 3, title: "제목 3", rating: 4.6 },
];

export default function BOD_15() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [commentText, setCommentText] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    navigate(`/library/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleSubmitComment = () => {
    if (!commentText.trim() || selectedRating === 0) {
      alert("댓글과 별점을 모두 입력해주세요");
      return;
    }
    console.log("댓글 등록:", { content: commentText, rating: selectedRating });
    // TODO: API 호출
    setCommentText("");
    setSelectedRating(0);
  };

  const handleBookClick = (book: Book) => {
    navigate(`/books/${book.id}`);
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

        {/* 책 정보 섹션 */}
        <div className="flex gap-8 mb-12">
          {/* 책 표지 */}
          <div
            className="flex-shrink-0 w-[200px] h-[288px] flex items-center justify-center"
            style={{ background: "#D9D9D9" }}
          >
            <span style={{ color: "black", fontSize: "24px" }}>책 표지</span>
          </div>

          {/* 책 정보 */}
          <div className="flex-1">
            <h1
              className="text-3xl font-bold mb-4"
              style={{ color: "black" }}
            >
              {mockBook.title}
            </h1>
            <p
              className="text-xl mb-6"
              style={{ color: "black" }}
            >
              {mockBook.description}
            </p>
            <div
              className="text-2xl"
              style={{ color: "black" }}
            >
              평점: {mockBook.rating}
            </div>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div
          className="p-6 rounded-lg mb-8"
          style={{ background: "#E9E5DC" }}
        >
          {/* 댓글 목록 */}
          <div className="space-y-4 mb-6">
            {mockComments.map((comment) => (
              <div
                key={comment.id}
                className="p-5 rounded"
                style={{ background: "#FFF9F2" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div
                      className="text-lg font-semibold mb-1"
                      style={{ color: "black" }}
                    >
                      {comment.username}
                    </div>
                    <div
                      className="text-xl mb-2"
                      style={{ color: "#6B4F3F" }}
                    >
                      {comment.content}
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: "black" }}
                    >
                      {comment.createdAt}
                    </div>
                  </div>
                  <div
                    className="text-xl font-semibold ml-4"
                    style={{ color: "black" }}
                  >
                    ⭐ {comment.rating}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 댓글 입력 */}
          <div
            className="p-6 rounded"
            style={{ background: "#FFF9F2" }}
          >
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요"
              className="w-full px-4 py-3 mb-4 rounded outline-none"
              style={{
                color: "#6B4F3F",
                fontSize: "24px",
                background: "white",
                border: "1px solid #E9E5DC",
              }}
            />

            <div className="flex items-center gap-4">
              {/* 별점 선택 */}
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setSelectedRating(star)}
                    className="text-3xl hover:scale-110 transition"
                  >
                    {star <= selectedRating ? "⭐" : "☆"}
                  </button>
                ))}
              </div>

              {/* 등록 버튼 */}
              <button
                onClick={handleSubmitComment}
                className="px-6 py-2 rounded hover:opacity-90 transition"
                style={{
                  background: "#90BE6D",
                  color: "black",
                  fontSize: "24px",
                  fontWeight: 600,
                }}
              >
                등록
              </button>
            </div>
          </div>
        </div>

        {/* 추천 책 섹션 */}
        <div>
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: "black" }}
          >
            이런 책은 어떤가요?
          </h2>
          <div className="flex gap-6">
            {mockRecommendations.map((book) => (
              <div
                key={book.id}
                onClick={() => handleBookClick(book)}
                className="cursor-pointer hover:opacity-80 transition"
              >
                <div
                  className="w-[147px] h-[243px] flex items-center justify-center mb-3"
                  style={{ background: "#D9D9D9" }}
                >
                  <span style={{ fontSize: "24px", color: "black" }}>표지</span>
                </div>
                <div
                  className="text-xl font-bold mb-2"
                  style={{ color: "black" }}
                >
                  {book.title}
                </div>
                <div
                  className="text-lg"
                  style={{ color: "black" }}
                >
                  ⭐ {book.rating}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
