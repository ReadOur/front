// PRF_10.tsx - 마이페이지
import React from "react";
import { useNavigate } from "react-router-dom";
import { useMyPage } from "@/hooks/api";

// 목업 데이터 - 채팅방 (백엔드 API 대기 중)
const mockChatRooms = [
  { id: 1, name: "채팅방 1", profileImage: null },
  { id: 2, name: "채팅방 2", profileImage: null },
  { id: 3, name: "채팅방 3", profileImage: null },
];

// 목업 데이터 - 알림 (백엔드 API 대기 중)
const mockNotifications = [
  { id: 1, message: "새로운 댓글이 달렸습니다", time: "10분 전" },
  { id: 2, message: "게시글에 좋아요가 추가되었습니다", time: "1시간 전" },
  { id: 3, message: "채팅방에 새 메시지가 있습니다", time: "2시간 전" },
];

export default function PRF_10() {
  const navigate = useNavigate();

  // API 호출: 마이페이지 (프로필 + 최근 글 5개씩)
  const { data: myPage, isLoading } = useMyPage();

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
        {/* 설정 버튼 */}
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

        {/* 프로필 정보 */}
        {isLoading ? (
          <div className="text-center py-8 text-xl" style={{ color: "#999" }}>
            로딩 중...
          </div>
        ) : myPage ? (
          <div className="mb-8 p-6 rounded-lg" style={{ background: "#E9E5DC" }}>
            <div className="flex items-center gap-6">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: "#90BE6D" }}
              >
                <span className="text-3xl" style={{ color: "white" }}>
                  {myPage.nickname.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2" style={{ color: "#6B4F3F" }}>
                  {myPage.nickname}
                </h2>
                <p className="text-lg" style={{ color: "#6B4F3F", opacity: 0.7 }}>
                  사용자 ID: {myPage.userId}
                </p>
                <div className="flex gap-6 mt-3 text-base" style={{ color: "#6B4F3F" }}>
                  <span>내 글 {myPage.myPosts.length}</span>
                  <span>댓글 단 글 {myPage.myComments.length}</span>
                  <span>좋아요 {myPage.likedPosts.length}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-xl" style={{ color: "#999" }}>
            프로필 정보를 불러올 수 없습니다.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 좌측: 채팅방 목록 */}
          <div className="space-y-4">
            <h2
              className="text-4xl font-normal mb-6"
              style={{ color: "#6B4F3F" }}
            >
              채팅방 목록
            </h2>
            {mockChatRooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center gap-4 p-4 rounded-lg cursor-pointer hover:opacity-90 transition"
                style={{ background: "#90BE6D" }}
              >
                {/* 프로필 이미지 */}
                <div
                  className="w-[70px] h-[70px] rounded-full flex items-center justify-center"
                  style={{ background: "#FDFDFD" }}
                >
                  <span className="text-sm" style={{ color: "black" }}>
                    프로필
                  </span>
                </div>
                {/* 채팅방 이름 */}
                <div className="flex-1">
                  <h3
                    className="text-[40px] font-normal"
                    style={{ color: "#6B4F3F" }}
                  >
                    {room.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* 우측: 좋아요 누른 글 & 알림 */}
          <div className="space-y-8">
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
                  {isLoading ? (
                    <div className="text-center py-8 text-lg" style={{ color: "#999" }}>
                      로딩 중...
                    </div>
                  ) : myPage && myPage.likedPosts.length > 0 ? (
                    myPage.likedPosts.map((post) => (
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
                  )}
                </div>
              </div>
            </div>

            {/* 알림 */}
            <div>
              <h2
                className="text-[55.2px] font-normal text-center mb-4"
                style={{ color: "black" }}
              >
                알림
              </h2>
              <div
                className="rounded-lg overflow-hidden"
                style={{ background: "#D9D9D9" }}
              >
                {/* 알림 목록 - 스크롤 가능 */}
                <div
                  className="relative overflow-y-auto"
                  style={{ maxHeight: "270px" }}
                >
                  <style>{`
                    .notification-scroll::-webkit-scrollbar {
                      width: 16px;
                      background: #FFF9F2;
                      border-radius: 45px;
                    }
                    .notification-scroll::-webkit-scrollbar-thumb {
                      background: #E9E5DC;
                      border-radius: 45px;
                    }
                  `}</style>
                  <div className="notification-scroll space-y-2 p-4">
                    {mockNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-4 rounded cursor-pointer hover:opacity-80 transition"
                        style={{ background: "#FFF9F2" }}
                      >
                        <p
                          className="font-normal"
                          style={{ color: "#6B4F3F", fontSize: "18px" }}
                        >
                          {notification.message}
                        </p>
                        <p
                          className="text-sm mt-1"
                          style={{ color: "black", opacity: 0.6 }}
                        >
                          {notification.time}
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
    </div>
  );
}
