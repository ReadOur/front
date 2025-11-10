// src/features/layout/header/HeaderApp.tsx
import React from "react";
import logo from "@/assets/logo.png";
import { MessageCircle } from "lucide-react";
import UserDropdown from "./UserDropdown";

type NavItem = { key: string; label: string; active?: boolean; onClick: () => void };
type User = { name: string; } | null;

interface HeaderAppProps {
  navItems: NavItem[];
  unreadCount: number;
  chatUnreadCount?: number;
  onClickNotifications: () => void;
  onClickChat?: () => void;
  user: User;
  onLogin?: () => void;
  onLogout?: () => void;
  onProfile?: () => void;
  onLogoClick: () => void;
}

export default function HeaderApp({
                                    navItems,
                                    unreadCount,
                                    chatUnreadCount = 0,
                                    onClickNotifications,
                                    onClickChat,
                                    user,
                                    onLogin,
                                    onLogout,
                                    onProfile,
                                    onLogoClick,
                                  }: HeaderAppProps) {
  return (
    <header className="fixed top-0 left-0 right-0 w-full border-b border-[color:var(--color-border-subtle)] text-[color:var(--color-fg-primary)] z-50 backdrop-blur-sm" style={{ backgroundColor: '#F5EFE9' }}>
      {/* 가운데 정렬 컨테이너 */}
      <div className="mx-auto px-4 h-24" style={{ maxWidth: "var(--layout-max)" }}>
        {/* 3열 그리드 */}
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4 h-full">
          {/* LEFT: 로고 */}
          <button onClick={onLogoClick} className="shrink-0 flex items-center">
            <div
              className="flex items-center"
              style={{ width: "var(--brand-logo-w)", height: "var(--brand-logo-h)", transform: "translateY(var(--brand-logo-offset-y))", transformOrigin: "left center" }}
            >
              <img
                src={logo}
                alt="ReadOur"
                className="block"
                loading="lazy"
                style={{
                  height: "100%",
                  width: "auto",
                }}
              />
            </div>
          </button>

          {/* CENTER: 네비게이션 (모든 화면 크기에서 표시) */}
          <nav className="flex justify-center overflow-x-auto scrollbar-hide">
            <ul className="flex items-stretch h-full font-medium text-[color:var(--color-fg-muted)] text-base">
              {navItems.map((item, idx) => (
                <li key={item.key} className="relative flex items-center px-6">
                  <button
                    onClick={item.onClick}
                    className={[
                      "relative h-full flex items-center cursor-pointer transition-all duration-200 whitespace-nowrap",
                      item.active
                        ? "text-[color:var(--color-fg-primary)] font-semibold"
                        : "hover:text-[color:var(--color-fg-primary)] hover:scale-105",
                    ].join(" ")}
                  >
                    {item.label}
                    {item.active && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[color:var(--color-fg-primary)]" />
                    )}
                  </button>
                  {idx < navItems.length - 1 && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-px bg-[color:var(--color-border-subtle)]" />
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* RIGHT: 유틸리티 버튼 */}
          <div className="shrink-0 flex items-center gap-3 justify-end">
            {/* 채팅 버튼 */}
            <button
              onClick={onClickChat}
              className="relative w-12 h-12 grid place-items-center rounded-[var(--radius-md)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] hover:bg-[color:var(--color-bg-hover)] transition-colors cursor-pointer"
              aria-label="채팅"
            >
              <MessageCircle className="w-5 h-5 text-[color:var(--color-fg-primary)]" />
              {chatUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 grid place-items-center rounded-full text-xs font-bold bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]">
                  {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                </span>
              )}
            </button>

            {/* 알림 버튼 */}
            <button
              onClick={onClickNotifications}
              className="relative w-12 h-12 grid place-items-center rounded-[var(--radius-md)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] hover:bg-[color:var(--color-bg-hover)] transition-colors cursor-pointer"
              aria-label="알림"
            >
              <span role="img" aria-hidden="true" className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 grid place-items-center rounded-full text-xs font-bold bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* 유저 드롭다운 또는 로그인 버튼 */}
            {user ? (
              <div>
                <UserDropdown
                  userName={user.name}
                  onLogout={onLogout || (() => console.log("로그아웃"))}
                  onProfile={onProfile || (() => console.log("프로필"))}
                />
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="inline-flex items-center gap-2 h-12 px-5 rounded-full border border-[color:var(--btn-primary-border)] bg-[color:var(--btn-primary-bg)] text-[color:var(--btn-primary-fg)] hover:opacity-90 text-base font-medium transition-opacity cursor-pointer"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </div>

    </header>
  );
}
