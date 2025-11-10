import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';

interface UserDropdownProps {
  userName: string;
  onLogout: () => void;
  onProfile: () => void;
}

export default function UserDropdown({ userName, onLogout, onProfile }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 유저 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-2 h-10 sm:h-12 px-3 sm:px-4 rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] hover:bg-[color:var(--color-bg-hover)] transition-colors cursor-pointer pointer-events-auto"
      >
        <span className="font-medium text-[color:var(--color-fg-primary)] text-sm sm:text-base md:text-lg lg:text-xl">
          {userName}
        </span>
        <ChevronDown
          className={`w-3 h-3 sm:w-4 sm:h-4 text-[color:var(--color-fg-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 sm:w-48 rounded-lg sm:rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] shadow-lg overflow-hidden z-50">
          <div className="py-1">
            <button
              onClick={() => {
                onProfile();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left text-[color:var(--color-fg-primary)] hover:bg-[color:var(--color-bg-hover)] transition-colors text-sm sm:text-base"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>내 정보</span>
            </button>
            <div className="h-px bg-[color:var(--color-border-subtle)] mx-2" />
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left text-[color:var(--color-fg-primary)] hover:bg-[color:var(--color-bg-hover)] transition-colors text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
