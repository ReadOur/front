// src/features/layout/header/HeaderApp.tsx
import React from "react";
import logo from "@/assets/logo.png";

type NavItem = { key: string; label: string; active?: boolean; onClick: () => void };
type User = { name: string; } | null;

interface HeaderAppProps {
  navItems: NavItem[];
  unreadCount: number;
  onClickNotifications: () => void;
  user: User;
  onLogin?: () => void;
  onLogoClick: () => void;
}

export default function HeaderApp({
                                    navItems,
                                    unreadCount,
                                    onClickNotifications,
                                    user,
                                    onLogin,
                                    onLogoClick,
                                  }: HeaderAppProps) {
  return (
    <header className="fixed top-0 left-0 right-0 w-full border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] backdrop-blur-sm bg-opacity-100 text-[color:var(--color-fg-primary)] z-50" style={{ backgroundColor: 'var(--color-bg-elev-1)' }}>
      {/* 가운데 정렬 컨테이너 */}
      <div className="mx-auto px-4 h-20 md:h-24" style={{ maxWidth: "var(--layout-max)" }}>
        {/* 3열 그리드: [로고][탭 중앙][우측 유틸] */}
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4 h-full">
          {/* LEFT: 로고 */}
          <button onClick={onLogoClick} className="shrink-0 flex items-center">
            <div
              className="flex items-center"
              style={{ width: "calc(var(--brand-logo-w) * 2)", height: "calc(var(--brand-logo-h) * 2)", transform: "translateY(var(--brand-logo-offset-y)) scale(2)", transformOrigin: "left center" }}
            >
              <img src={logo} alt="ReadOur" className="block"
                   style = {{
                     height : "100%",
                     width : "auto",
                   }}
              />
            </div>
          </button>

          {/* CENTER: 탭 (정확히 중앙) */}
          <nav className="flex justify-center">
            <ul className="flex items-stretch h-full text-2xl md:text-3xl font-medium text-[color:var(--color-fg-muted)]">
              {navItems.map((item, idx) => (
                <li key={item.key} className="relative flex items-center px-4 md:px-6">
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

          {/* RIGHT: 알림 + 유저 */}
          <div className="shrink-0 flex items-center gap-[15px] justify-end">
            <button
              onClick={onClickNotifications}
              className="relative w-14 h-14 grid place-items-center rounded-[var(--radius-md)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] hover:bg-[color:var(--color-bg-hover)] text-2xl transition-colors cursor-pointer"
              aria-label="알림"
            >
              <span role="img" aria-hidden="true">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-6 h-6 px-1.5 grid place-items-center rounded-full text-xs font-bold bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {user ? (
              <span className="text-xl md:text-2xl font-medium text-[color:var(--color-fg-primary)]">
                {user.name}
              </span>
            ) : (
              <button
                onClick={onLogin}
                className="inline-flex items-center gap-2 h-12 px-5 rounded-full border border-[color:var(--btn-primary-border)] bg-[color:var(--btn-primary-bg)] text-[color:var(--btn-primary-fg)] hover:opacity-90 text-xl font-medium transition-opacity cursor-pointer"
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
