// PRF_10.tsx - 마이페이지 / 특정 사용자 프로필
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useMyPage,
  useMyLikedPosts,
  useMyPosts,
  useMyComments,
  useUserMyPage,
  useUserMyPageLikedPosts,
  useUserMyPagePosts,
  useUserMyPageComments,
} from "@/hooks/api";

export default function PRF_10() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>(); // URL 파라미터에서 userId 추출

  // 조건부 API 호출: userId가 있으면 특정 사용자, 없으면 내 프로필
  const isViewingOtherUser = !!userId;

  // 내 프로필 API (userId 없을 때)
  const { data: myPageData, isLoading: isLoadingMyPage } = useMyPage();
  const { data: myLikedPostsData, isLoading: isLoadingMyLikedPosts } = useMyLikedPosts({
    page: 0,
    size: 20,
  });
  const { data: myPostsDataFull, isLoading: isLoadingMyPostsFull } = useMyPosts({
    page: 0,
    size: 20,
  });
  const { data: myCommentsDataFull, isLoading: isLoadingMyCommentsFull } = useMyComments({
    page: 0,
    size: 20,
  });

  // 특정 사용자 프로필 API (userId 있을 때)
  const { data: userPageData, isLoading: isLoadingUserPage } = useUserMyPage(
    userId || "",
  );
  const { data: userLikedPostsData, isLoading: isLoadingUserLikedPosts } = useUserMyPageLikedPosts(
    userId || "",
    { page: 0, size: 20 }
  );
  const { data: userPostsData, isLoading: isLoadingUserPosts } = useUserMyPagePosts(
    userId || "",
    { page: 0, size: 20 }
  );
  const { data: userCommentsData, isLoading: isLoadingUserComments } = useUserMyPageComments(
    userId || "",
    { page: 0, size: 20 }
  );

  // 조건에 따라 사용할 데이터 선택
  const profileData = isViewingOtherUser ? userPageData : myPageData;
  const isLoading = isViewingOtherUser ? isLoadingUserPage : isLoadingMyPage;

  // 전체 목록 데이터
  const likedPostsData = isViewingOtherUser
    ? userLikedPostsData?.likedPostsPage
    : myLikedPostsData;
  const myPostsData = isViewingOtherUser
    ? userPostsData?.postPage
    : myPostsDataFull;
  const myCommentsData = isViewingOtherUser
    ? userCommentsData?.commentPage
    : myCommentsDataFull;

  const isLoadingLikedPosts = isViewingOtherUser ? isLoadingUserLikedPosts : isLoadingMyLikedPosts;
  const isLoadingMyPosts = isViewingOtherUser ? isLoadingUserPosts : isLoadingMyPostsFull;
  const isLoadingMyComments = isViewingOtherUser ? isLoadingUserComments : isLoadingMyCommentsFull;

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  };

  const handlePostClick = (postId: number) => {
    navigate(`/boards/${postId}`);
  };

  return (
    <div
      className="w-full min-h-screen p-8"
      style={{ background: "#FFF9F2" }}
    >
      <div className="max-w-[1400px] mx-auto">
        {/* 설정 버튼 - 내 프로필일 때만 표시 */}
        {!isViewingOtherUser && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => navigate("/settings")}
              className="px-6 py-3 rounded-lg hover:opacity-80 transition flex items-center gap-2"
              style={{ background: "#90BE6D", color: "#6B4F3F" }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m0-18l-2 2m2-2l2 2m-2 16l-2-2m2 2l2-2m9-10h-6m-6 0H1m18 0l-2-2m2 2l-2 2M1 12l2-2m-2 2l2 2"></path>
              </svg>
              <span className="text-xl font-semibold">설정</span>
            </button>
          </div>
        )}

        {/* 프로필 정보 */}
        {isLoading ? (
          <div className="text-center py-8 text-xl" style={{ color: "#999" }}>
            로딩 중...
          </div>
        ) : profileData ? (
          <div className="mb-8 p-6 rounded-lg" style={{ background: "#E9E5DC" }}>
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: "#6B4F3F" }}>
                {profileData.nickname}
              </h2>
              <p className="text-lg" style={{ color: "#6B4F3F", opacity: 0.7 }}>
                사용자 ID: {profileData.userId}
              </p>
              <div className="flex gap-6 mt-3 text-base" style={{ color: "#6B4F3F" }}>
                <span>내 글 {profileData.myPosts.length}</span>
                <span>댓글 단 글 {profileData.myComments.length}</span>
                <span>좋아요 {profileData.likedPosts.length}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-xl" style={{ color: "#999" }}>
            프로필 정보를 불러올 수 없습니다.
          </div>
        )}

        <div className="space-y-8">
          {/* 3개 섹션: 좋아요 누른 글, 내가 작성한 글, 댓글 단 글 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 좋아요 누른 글 */}
            <div
              className="rounded-[30px] overflow-hidden"
              style={{ background: "#FFF9F2" }}
            >
              {/* 헤더 */}
              <div
                className="px-6 py-4 rounded-t-[30px]"
                style={{ background: "#90BE6D" }}
              >
                <h3
                  className="text-2xl font-normal text-center"
                  style={{ color: "#6B4F3F" }}
                >
                  좋아요 누른 글
                </h3>
              </div>

              {/* 게시글 목록 - 스크롤 가능 */}
              <div
                className="relative overflow-y-auto"
                style={{ maxHeight: "250px" }}
              >
                {/* 커스텀 스크롤바 스타일 */}
                <style>{`
                  .bookmark-scroll::-webkit-scrollbar {
                    width: 20px;
                    background: #E9E5DC;
                    border-radius: 45px;
                  }
                  .bookmark-scroll::-webkit-scrollbar-thumb {
                    background: #FFF9F2;
                    border-radius: 45px;
                    border: 1px solid #FFF9F2;
                  }
                `}</style>
                <div className="bookmark-scroll space-y-2 p-4">
                  {isLoadingLikedPosts ? (
                    <div className="text-center py-8 text-lg" style={{ color: "#999" }}>
                      로딩 중...
                    </div>
                  ) : (() => {
                    const posts = likedPostsData?.content?.slice(0, 5) || [];

                    return posts.length > 0 ? (
                      posts.map((post) => (
                        <div
                          key={post.postId}
                          onClick={() => handlePostClick(post.postId)}
                          className="p-4 rounded cursor-pointer hover:opacity-80 transition"
                          style={{ background: "#E9E5DC" }}
                        >
                          <p
                            className="font-normal line-clamp-1"
                            style={{ color: "#6B4F3F", fontSize: "18px" }}
                          >
                            {post.title}
                          </p>
                          <p
                            className="text-sm mt-1"
                            style={{ color: "#6B4F3F", opacity: 0.7 }}
                          >
                            {formatDate(post.createdAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-lg" style={{ color: "#999" }}>
                        좋아요 누른 글이 없습니다.
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* 내가 작성한 글 */}
            <div
              className="rounded-[30px] overflow-hidden"
              style={{ background: "#FFF9F2" }}
            >
              {/* 헤더 */}
              <div
                className="px-6 py-4 rounded-t-[30px]"
                style={{ background: "#90BE6D" }}
              >
                <h3
                  className="text-2xl font-normal text-center"
                  style={{ color: "#6B4F3F" }}
                >
                  내가 작성한 글
                </h3>
              </div>

              {/* 게시글 목록 - 스크롤 가능 */}
              <div
                className="relative overflow-y-auto"
                style={{ maxHeight: "250px" }}
              >
                <div className="bookmark-scroll space-y-2 p-4">
                  {isLoadingMyPosts ? (
                    <div className="text-center py-8 text-lg" style={{ color: "#999" }}>
                      로딩 중...
                    </div>
                  ) : (() => {
                    const posts = myPostsData?.content?.slice(0, 5) || [];

                    return posts.length > 0 ? (
                      posts.map((post) => (
                        <div
                          key={post.postId}
                          onClick={() => handlePostClick(post.postId)}
                          className="p-4 rounded cursor-pointer hover:opacity-80 transition"
                          style={{ background: "#E9E5DC" }}
                        >
                          <p
                            className="font-normal line-clamp-1"
                            style={{ color: "#6B4F3F", fontSize: "18px" }}
                          >
                            {post.title}
                          </p>
                          <p
                            className="text-sm mt-1"
                            style={{ color: "#6B4F3F", opacity: 0.7 }}
                          >
                            {formatDate(post.createdAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-lg" style={{ color: "#999" }}>
                        작성한 글이 없습니다.
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* 댓글 단 글 */}
            <div
              className="rounded-[30px] overflow-hidden"
              style={{ background: "#FFF9F2" }}
            >
              {/* 헤더 */}
              <div
                className="px-6 py-4 rounded-t-[30px]"
                style={{ background: "#90BE6D" }}
              >
                <h3
                  className="text-2xl font-normal text-center"
                  style={{ color: "#6B4F3F" }}
                >
                  댓글 단 글
                </h3>
              </div>

              {/* 게시글 목록 - 스크롤 가능 */}
              <div
                className="relative overflow-y-auto"
                style={{ maxHeight: "250px" }}
              >
                <div className="bookmark-scroll space-y-2 p-4">
                  {isLoadingMyComments ? (
                    <div className="text-center py-8 text-lg" style={{ color: "#999" }}>
                      로딩 중...
                    </div>
                  ) : (() => {
                    const posts = myCommentsData?.content?.slice(0, 5) || [];

                    return posts.length > 0 ? (
                      posts.map((post) => (
                        <div
                          key={post.postId}
                          onClick={() => handlePostClick(post.postId)}
                          className="p-4 rounded cursor-pointer hover:opacity-80 transition"
                          style={{ background: "#E9E5DC" }}
                        >
                          <p
                            className="font-normal line-clamp-1"
                            style={{ color: "#6B4F3F", fontSize: "18px" }}
                          >
                            {post.title}
                          </p>
                          <p
                            className="text-sm mt-1"
                            style={{ color: "#6B4F3F", opacity: 0.7 }}
                          >
                            {formatDate(post.createdAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-lg" style={{ color: "#999" }}>
                        댓글 단 글이 없습니다.
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
