// MYB_14.tsx - 내 서재 페이지
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useWishlist,
  useMyReviews,
  useBookmarks,
  useSavedPosts,
  useFavoriteLibraries,
  useBookSearch,
} from "@/hooks/api";

export default function MYB_14() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // API 호출: 위시리스트, 리뷰, 북마크, 저장한 게시글, 관심 도서관
  const { data: wishlistData, isLoading: isLoadingWishlist } = useWishlist();
  const { data: myReviewsData, isLoading: isLoadingReviews } = useMyReviews({
    page: 0,
    size: 10,
    sort: "createdAt,DESC",
  });
  const { data: bookmarksData, isLoading: isLoadingBookmarks } = useBookmarks();
  const { data: savedPostsData, isLoading: isLoadingSavedPosts } = useSavedPosts();
  const { data: favoriteLibrariesData, isLoading: isLoadingFavoriteLibraries } =
    useFavoriteLibraries();

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

  const wishlist = wishlistData || [];
  const reviewedBooks = myReviewsData?.reviewPage.content || [];
  const bookmarks = bookmarksData || [];
  const savedPosts = savedPostsData || [];
  const favoriteLibraries = favoriteLibrariesData || [];

  const handlePostClick = (postId: number) => {
    navigate(`/boards/${postId}`);
  };

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
                        onClick={() => navigate(`/books/${book.bookId}`)}
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
                리뷰 남긴 책들
              </h2>
            </div>

            {/* 책 목록 - 가로 스크롤 */}
            <div className="p-8">
              {isLoadingReviews ? (
                <div className="text-center py-12 text-xl" style={{ color: "#999" }}>
                  로딩 중...
                </div>
              ) : reviewedBooks.length > 0 ? (
                <div className="flex gap-6 overflow-x-auto pb-4">
                  <div className="book-scroll flex gap-6">
                    {reviewedBooks.map((review) => (
                      <div
                        key={review.reviewId}
                        onClick={() => navigate(`/books/${review.bookId}`)}
                        className="flex-shrink-0 w-[162px] h-[196px] rounded-lg cursor-pointer hover:opacity-80 transition overflow-hidden"
                        style={{ background: "#E9E5DC" }}
                      >
                        {review.bookImageUrl ? (
                          <img
                            src={review.bookImageUrl}
                            alt={review.bookname}
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
                              {review.bookname}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-xl" style={{ color: "#999" }}>
                  리뷰 남긴 책이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 북마크 (책갈피) 섹션 */}
        <div className="mb-12">
          <div
            className="rounded-[30px] overflow-hidden"
            style={{ background: "#FFF9F2" }}
          >
            {/* 헤더 */}
            <div
              className="px-6 py-4 rounded-[30px]"
              style={{ background: "#F4A261" }}
            >
              <h2
                className="text-2xl text-center"
                style={{ color: "#6B4F3F" }}
              >
                📑 북마크한 게시글
              </h2>
            </div>

            {/* 게시글 목록 */}
            <div className="p-8">
              {isLoadingBookmarks ? (
                <div className="text-center py-12 text-xl" style={{ color: "#999" }}>
                  로딩 중...
                </div>
              ) : bookmarks.length > 0 ? (
                <div className="space-y-4">
                  {bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.bookmarkId}
                      onClick={() => handlePostClick(bookmark.postId)}
                      className="p-6 rounded-[20px] cursor-pointer hover:opacity-80 transition"
                      style={{ background: "#E9E5DC" }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className="px-3 py-1 rounded-full text-sm"
                              style={{ background: "#90BE6D", color: "white" }}
                            >
                              {bookmark.postCategory}
                            </span>
                            <span style={{ color: "#999", fontSize: "14px" }}>
                              {bookmark.authorNickname}
                            </span>
                          </div>
                          <h3
                            className="text-xl mb-2"
                            style={{ color: "#1E1E1E", fontWeight: "600" }}
                          >
                            {bookmark.postTitle}
                          </h3>
                          <p style={{ color: "#999", fontSize: "14px" }}>
                            {new Date(bookmark.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-xl" style={{ color: "#999" }}>
                  북마크한 게시글이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 저장한 게시글 섹션 */}
        <div className="mb-12">
          <div
            className="rounded-[30px] overflow-hidden"
            style={{ background: "#FFF9F2" }}
          >
            {/* 헤더 */}
            <div
              className="px-6 py-4 rounded-[30px]"
              style={{ background: "#E76F51" }}
            >
              <h2
                className="text-2xl text-center"
                style={{ color: "white" }}
              >
                💾 저장한 게시글
              </h2>
            </div>

            {/* 게시글 목록 */}
            <div className="p-8">
              {isLoadingSavedPosts ? (
                <div className="text-center py-12 text-xl" style={{ color: "#999" }}>
                  로딩 중...
                </div>
              ) : savedPosts.length > 0 ? (
                <div className="space-y-4">
                  {savedPosts.map((savedPost) => (
                    <div
                      key={savedPost.savedPostId}
                      onClick={() => handlePostClick(savedPost.postId)}
                      className="p-6 rounded-[20px] cursor-pointer hover:opacity-80 transition"
                      style={{ background: "#E9E5DC" }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className="px-3 py-1 rounded-full text-sm"
                              style={{ background: "#E76F51", color: "white" }}
                            >
                              {savedPost.postCategory}
                            </span>
                            <span style={{ color: "#999", fontSize: "14px" }}>
                              {savedPost.authorNickname}
                            </span>
                          </div>
                          <h3
                            className="text-xl mb-2"
                            style={{ color: "#1E1E1E", fontWeight: "600" }}
                          >
                            {savedPost.postTitle}
                          </h3>
                          <p style={{ color: "#999", fontSize: "14px" }}>
                            {new Date(savedPost.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-xl" style={{ color: "#999" }}>
                  저장한 게시글이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 관심 도서관 섹션 */}
        <div>
          <div
            className="rounded-[30px] overflow-hidden"
            style={{ background: "#FFF9F2" }}
          >
            {/* 헤더 */}
            <div
              className="px-6 py-4 rounded-[30px]"
              style={{ background: "#2A9D8F" }}
            >
              <h2
                className="text-2xl text-center"
                style={{ color: "white" }}
              >
                📍 관심 도서관
              </h2>
            </div>

            {/* 도서관 목록 */}
            <div className="p-8">
              {isLoadingFavoriteLibraries ? (
                <div className="text-center py-12 text-xl" style={{ color: "#999" }}>
                  로딩 중...
                </div>
              ) : favoriteLibraries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favoriteLibraries.map((library, index) => (
                    <div
                      key={index}
                      className="p-6 rounded-[20px]"
                      style={{ background: "#E9E5DC" }}
                    >
                      <h3
                        className="text-xl mb-3"
                        style={{ color: "#1E1E1E", fontWeight: "600" }}
                      >
                        {library.libraryName}
                      </h3>
                      <p
                        className="mb-2"
                        style={{ color: "#666", fontSize: "16px" }}
                      >
                        📍 {library.address}
                      </p>
                      {library.tel && (
                        <p
                          className="mb-2"
                          style={{ color: "#666", fontSize: "14px" }}
                        >
                          📞 {library.tel}
                        </p>
                      )}
                      {library.homepage && (
                        <a
                          href={library.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-sm hover:underline"
                          style={{ color: "#2A9D8F" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          🔗 홈페이지 방문
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-xl" style={{ color: "#999" }}>
                  관심 도서관이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
