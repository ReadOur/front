// src/features/layout/header/HeaderApp.tsx
import React, { useState } from "react";
import logo from "@/assets/logo.png";
import { MessageCircle, Menu, X } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 w-full border-b border-[color:var(--color-border-subtle)] text-[color:var(--color-fg-primary)] z-50 backdrop-blur-sm" style={{ backgroundColor: '#F5EFE9' }}>
      {/* 가운데 정렬 컨테이너 */}
      <div className="mx-auto px-4 h-16 sm:h-20 md:h-28 lg:h-32" style={{ maxWidth: "var(--layout-max)" }}>
        {/* Desktop: 3열 그리드 / Mobile: 2열 그리드 */}
        <div className="grid grid-cols-[auto,1fr] md:grid-cols-[auto,1fr,auto] items-center gap-2 sm:gap-4 h-full">
          {/* LEFT: 로고 */}
          <button onClick={onLogoClick} className="shrink-0 flex items-center">
            <div
              className="flex items-center scale-75 sm:scale-90 md:scale-110 lg:scale-[1.32]"
              style={{ width: "calc(var(--brand-logo-w) * 1.32)", height: "calc(var(--brand-logo-h) * 1.32)", transform: "translateY(var(--brand-logo-offset-y))", transformOrigin: "left center" }}
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

          {/* CENTER: 탭 (데스크톱에서만 표시) */}
          <nav className="hidden md:flex justify-center">
            <ul className="flex items-stretch h-full font-medium text-[color:var(--color-fg-muted)] text-base lg:text-lg xl:text-xl">
              {navItems.map((item, idx) => (
                <li key={item.key} className="relative flex items-center px-3 lg:px-8 xl:px-16">
                  <button
                    onClick={item.onClick}
                    className={[
                      "relative h-full flex items-center pb-4 cursor-pointer transition-all duration-200",
                      item.active
                        ? "text-[color:var(--color-fg-primary)] font-semibold"
                        : "hover:text-[color:var(--color-fg-primary)] hover:scale-105",
                    ].join(" ")}
                  >
                    {item.label}
                    {item.active && (
                      <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-[color:var(--color-fg-primary)]" />
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
          <div className="shrink-0 flex items-center gap-2 sm:gap-3 md:gap-[15px] justify-end md:pb-4" style={{ position: 'relative', top: '0', marginTop: '-0.5rem' }}>
            {/* 모바일 햄버거 메뉴 (md 미만에서만 표시) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden relative w-10 h-10 sm:w-12 sm:h-12 grid place-items-center rounded-[var(--radius-md)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] hover:bg-[color:var(--color-bg-hover)] transition-colors cursor-pointer"
              aria-label="메뉴"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            {/* 채팅 버튼 */}
            <button
              onClick={onClickChat}
              className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 grid place-items-center rounded-[var(--radius-md)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] hover:bg-[color:var(--color-bg-hover)] transition-colors cursor-pointer"
              aria-label="채팅"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[color:var(--color-fg-primary)]" />
              {chatUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 sm:min-w-6 sm:h-6 px-1 grid place-items-center rounded-full text-xs font-bold bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]">
                  {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                </span>
              )}
            </button>

            {/* 알림 버튼 */}
            <button
              onClick={onClickNotifications}
              className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 grid place-items-center rounded-[var(--radius-md)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] hover:bg-[color:var(--color-bg-hover)] transition-colors cursor-pointer"
              aria-label="알림"
            >
              <span role="img" aria-hidden="true" className="text-lg sm:text-xl md:text-2xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 sm:min-w-6 sm:h-6 px-1 grid place-items-center rounded-full text-xs font-bold bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* 유저 드롭다운 또는 로그인 버튼 */}
            {user ? (
              <div className="hidden sm:block">
                <UserDropdown
                  userName={user.name}
                  onLogout={onLogout || (() => console.log("로그아웃"))}
                  onProfile={onProfile || (() => console.log("프로필"))}
                />
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="hidden sm:inline-flex items-center gap-2 h-10 px-3 sm:h-12 sm:px-5 rounded-full border border-[color:var(--btn-primary-border)] bg-[color:var(--btn-primary-bg)] text-[color:var(--btn-primary-fg)] hover:opacity-90 text-sm sm:text-base md:text-lg lg:text-xl font-medium transition-opacity cursor-pointer"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 (md 미만에서만 표시) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[color:var(--color-border-subtle)]" style={{ backgroundColor: '#F5EFE9' }}>
          <nav className="px-4 py-2">
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => (
                <li key={item.key}>
                  <button
                    onClick={() => {
                      item.onClick();
                      setMobileMenuOpen(false);
                    }}
                    className={[
                      "w-full text-left px-4 py-3 rounded-lg transition-all duration-200",
                      item.active
                        ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] font-semibold"
                        : "hover:bg-[color:var(--color-bg-elev-1)] text-[color:var(--color-fg-muted)]",
                    ].join(" ")}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* 모바일에서 로그인 버튼 또는 유저 정보 */}
            <div className="mt-3 pt-3 border-t border-[color:var(--color-border-subtle)]">
              {user ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      onProfile?.();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-[color:var(--color-bg-elev-1)] text-[color:var(--color-fg-primary)]"
                  >
                    👤 {user.name}
                  </button>
                  <button
                    onClick={() => {
                      onLogout?.();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-[color:var(--color-error)] hover:text-white text-[color:var(--color-fg-muted)] transition-colors"
                  >
                    🚪 로그아웃
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onLogin?.();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 rounded-lg bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] font-semibold hover:opacity-90 transition-opacity"
                >
                  로그인
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
