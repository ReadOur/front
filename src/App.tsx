import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import HeaderApp from "@/features/layout/Header/HeaderApp";
import ChatDock from "@/features/message/ChatDock";
// import { useUnreadCount } from "@/hooks/api/useChat"; // TODO: 백엔드 API 준비되면 활성화
import "@/style/tokens.css"
import "@/style/globals.css"

export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // 채팅 읽지 않은 메시지 수 조회
  // const { data: chatUnreadData } = useUnreadCount(); // TODO: 백엔드 API 준비되면 활성화
  const chatUnreadCount = 0; // 임시로 0 설정

  // 중앙 탭 라우팅 (SPA로 이동)
  const navItems = [
    {
      key: "board",
      label: "게시판",
      onClick: () => navigate("/boards"),
      active: pathname === "/" || pathname.startsWith("/boards"),
    },
    {
      key: "calendar",
      label: "캘린더",
      onClick: () => navigate("/calendar"),
      active: pathname.startsWith("/calendar"),
    },
    {
      key: "mypage",
      label: "마이페이지",
      onClick: () => navigate("/mypage"),
      active: pathname.startsWith("/mypage"),
    },
    {
      key: "library",
      label: "내서재",
      onClick: () => navigate("/library"),
      active: pathname.startsWith("/library"),
    },
    {
      key: "chat",
      label: "채팅",
      onClick: () => navigate("/chat"),
      active: pathname.startsWith("/chat"),
    },
    {
      key: "settings",
      label: "설정",
      onClick: () => navigate("/settings"),
      active: pathname.startsWith("/settings"),
    },
  ];

  console.log("[App] rendered:", window.location.pathname);

  return (
    <div className="min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-fg-primary)]">
      <HeaderApp
        onLogoClick={() => navigate("/boards")}
        navItems={navItems}
        unreadCount={0}
        chatUnreadCount={chatUnreadCount}
        onClickNotifications={() => {
          console.log("알림 버튼 클릭");
        }}
        onClickChat={() => navigate("/chat")}
        user={{
          name: "user",
        }}
        onLogin={() => {
          console.log("로그인");
        }}
      />

      <main className="mx-auto px-4 py-8 mt-[140px] md:mt-[128px]" style={{ maxWidth: "var(--layout-max)" }}>
        <Outlet />
      </main>
      <ChatDock />
    </div>
  );
}
