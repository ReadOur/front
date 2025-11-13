// BOD_15.tsx - 책 상세 페이지
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToggleWishlist } from "@/hooks/api";

// 책 타입 정의
interface Book {
  id: number;
  title: string;
  author?: string;
  publisher?: string;
  description?: string;
  highlights?: string[];
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
  publisher: "출판사명",
  description: "설명문입니다. 이 책은 정말 흥미로운 내용을 담고 있습니다.",
  highlights: ["판타지", "모험", "베스트셀러"],
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
  const [highlights, setHighlights] = useState<string[]>(mockBook.highlights || []);
  const [newHighlight, setNewHighlight] = useState("");
  const [activeTab, setActiveTab] = useState<"summary" | "reviews" | "highlights">("summary");

  // 위시리스트 상태 (나중에 API에서 받아오기)
  const [isWishlisted, setIsWishlisted] = useState(false);

  // 위시리스트 토글 mutation
  const wishlistMutation = useToggleWishlist();

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

  const handleAddHighlight = () => {
    if (!newHighlight.trim()) return;
    if (highlights.includes(newHighlight.trim())) {
      alert("이미 추가된 하이라이트입니다");
      return;
    }
    setHighlights([...highlights, newHighlight.trim()]);
    setNewHighlight("");
    // TODO: API 호출하여 서버에 저장
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
    // TODO: API 호출하여 서버에서 삭제
  };

  // 위시리스트 토글 핸들러
  const handleToggleWishlist = () => {
    if (!bookId) return;

    // 낙관적 업데이트
    setIsWishlisted((prev) => !prev);

    wishlistMutation.mutate(
      {
        bookId,
        isWishlisted,
      },
      {
        onSuccess: (data) => {
          // 서버 응답으로 최종 상태 업데이트
          setIsWishlisted(data.isWishlisted);
        },
        onError: () => {
          // 에러 시 롤백
          setIsWishlisted((prev) => !prev);
          alert("위시리스트 추가/제거에 실패했습니다.");
        },
      }
    );
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
            <div className="flex items-center gap-4 mb-4">
              <h1
                className="text-3xl font-bold"
                style={{ color: "black" }}
              >
                {mockBook.title}
              </h1>
              {/* 위시리스트 하트 버튼 */}
              <button
                onClick={handleToggleWishlist}
                disabled={wishlistMutation.isPending}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                aria-label={isWishlisted ? "위시리스트에서 제거" : "위시리스트에 추가"}
              >
                <span className="text-3xl">
                  {isWishlisted ? "❤️" : "🤍"}
                </span>
              </button>
            </div>

            {/* 작가 및 출판사 */}
            <div
              className="text-xl mb-4"
              style={{ color: "#6B4F3F" }}
            >
              {mockBook.author && <span>{mockBook.author}</span>}
              {mockBook.author && mockBook.publisher && <span className="mx-2">|</span>}
              {mockBook.publisher && <span>{mockBook.publisher}</span>}
            </div>

            {/* 하이라이트 태그 (읽기 전용 미리보기) */}
            {highlights.length > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {highlights.slice(0, 3).map((highlight, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-base"
                    style={{
                      background: "#E9E5DC",
                      color: "#6B4F3F",
                    }}
                  >
                    #{highlight}
                  </span>
                ))}
                {highlights.length > 3 && (
                  <span
                    className="px-3 py-1 rounded-full text-base"
                    style={{
                      background: "#E9E5DC",
                      color: "#6B4F3F",
                    }}
                  >
                    +{highlights.length - 3}
                  </span>
                )}
              </div>
            )}

            <div
              className="text-2xl mb-2"
              style={{ color: "black" }}
            >
              평점: {mockBook.rating}
            </div>
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
            <p
              className="text-xl mb-8"
              style={{ color: "black" }}
            >
              {mockBook.description}
            </p>

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
        )}

        {/* 리뷰 탭 */}
        {activeTab === "reviews" && (
          <div
            className="p-6 rounded-lg"
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
        )}

        {/* 하이라이트 탭 */}
        {activeTab === "highlights" && (
          <div>
            {highlights.length > 0 && (
              <div className="flex gap-2 mb-6 flex-wrap">
                {highlights.map((highlight, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full text-lg flex items-center gap-2"
                    style={{
                      background: "#E9E5DC",
                      color: "#6B4F3F",
                    }}
                  >
                    #{highlight}
                    <button
                      onClick={() => handleRemoveHighlight(index)}
                      className="ml-1 hover:opacity-70 transition text-xl"
                      style={{ color: "#6B4F3F" }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* 하이라이트 입력 */}
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddHighlight();
                }}
                placeholder="하이라이트 태그 추가"
                className="px-4 py-2 rounded-full text-lg outline-none flex-1"
                style={{
                  background: "white",
                  border: "2px solid #E9E5DC",
                  color: "#6B4F3F",
                }}
              />
              <button
                onClick={handleAddHighlight}
                className="px-6 py-2 rounded-full text-lg hover:opacity-90 transition"
                style={{
                  background: "#90BE6D",
                  color: "white",
                  fontWeight: 600,
                }}
              >
                추가
              </button>
            </div>

            {highlights.length === 0 && (
              <div
                className="text-center py-12 text-xl"
                style={{ color: "#999" }}
              >
                아직 추가된 하이라이트가 없습니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
