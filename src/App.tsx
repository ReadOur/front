import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import HeaderApp from "@/features/layout/Header/HeaderApp";
import ChatDock from "@/features/message/ChatDock";
import "@/style/tokens.css"
import "@/style/globals.css"

export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // DEBUG: 최신 버전 확인용
  console.log("🔥 App.tsx LOADED - Version: 2024-11-03-12:35");
  console.log("📋 NavItems count:", 5); // 채팅방 탭 제거됨

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
      key: "settings",
      label: "설정",
      onClick: () => navigate("/settings"),
      active: pathname.startsWith("/settings"),
    },
  ];

  return (
    <div className="min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-fg-primary)]">
      {/* DEBUG: App.tsx loaded at ${new Date().toISOString()} */}
      <HeaderApp
        onLogoClick={() => navigate("/boards")}
        navItems={navItems}
        unreadCount={2}
        onClickNotifications={() => {
          console.log("알림 버튼 클릭");
        }}
        user={{
          name: "user",
        }}
        onLogin={() => {
          console.log("로그인");
        }}
      />

      <main className="mx-auto px-4 py-8" style={{ maxWidth: "var(--layout-max)" }}>
        <Outlet />
      </main>
      <ChatDock />
    </div>
  );
}
