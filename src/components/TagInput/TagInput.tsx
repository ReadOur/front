import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  helperText?: string;
  maxTags?: number;
  suggestions?: string[];
  disabled?: boolean;
}

/**
 * TagInput 컴포넌트
 *
 * 태그를 추가/삭제할 수 있는 입력 컴포넌트
 *
 * 기능:
 * - Enter 키 또는 스페이스 키로 태그 추가
 * - Backspace 키로 마지막 태그 삭제 (입력 필드가 비어있을 때)
 * - X 버튼으로 개별 태그 삭제
 * - 태그 자동완성 기능 (suggestions prop 사용 시)
 * - 최대 태그 개수 제한 (maxTags prop 사용 시)
 */
export const TagInput: React.FC<TagInputProps> = ({
  value = [],
  onChange,
  placeholder = "#태그 입력 (Enter로 추가)",
  className,
  label,
  helperText,
  maxTags,
  suggestions = [],
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // 입력값 기반 필터링된 제안 목록
  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      inputValue &&
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion)
  );

  // 태그 추가
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().replace(/^#+/, ""); // # 제거

    if (!trimmedTag) return;
    if (value.includes(trimmedTag)) return;
    if (maxTags && value.length >= maxTags) return;

    onChange([...value, trimmedTag]);
    setInputValue("");
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  // 태그 삭제
  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter 키 또는 스페이스 키로 태그 추가
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();

      // 자동완성 목록이 열려있고 항목이 선택되어 있으면 해당 항목 추가
      if (showSuggestions && selectedSuggestionIndex >= 0 && filteredSuggestions[selectedSuggestionIndex]) {
        addTag(filteredSuggestions[selectedSuggestionIndex]);
      } else {
        addTag(inputValue);
      }
    }

    // Backspace 키로 마지막 태그 삭제 (입력 필드가 비어있을 때)
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }

    // 자동완성 네비게이션
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
    }

    // Escape 키로 자동완성 닫기
    if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // 입력값 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(newValue.length > 0 && filteredSuggestions.length > 0);
    setSelectedSuggestionIndex(-1);
  };

  // 제안 항목 클릭
  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
    inputRef.current?.focus();
  };

  // 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {label && (
        <label className="text-sm font-medium text-[color:var(--color-fg-primary)]">
          {label}
        </label>
      )}

      <div className="relative">
        {/* 태그 입력 영역 */}
        <div
          className={clsx(
            "min-h-[42px] rounded-[var(--radius-md)] border",
            "bg-[color:var(--color-bg-elev-1)] border-[color:var(--color-border-subtle)]",
            "px-2 py-1.5 flex flex-wrap gap-2 items-center",
            "focus-within:ring-2 focus-within:ring-[color:var(--color-accent)]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {/* 태그 목록 */}
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] text-sm font-medium"
            >
              #{tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="hover:bg-[color:var(--color-on-accent)]/20 rounded-full p-0.5 transition-colors"
                  aria-label={`${tag} 태그 제거`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </span>
          ))}

          {/* 입력 필드 */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (inputValue && filteredSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder={value.length === 0 ? placeholder : ""}
            disabled={disabled || (maxTags !== undefined && value.length >= maxTags)}
            className={clsx(
              "flex-1 min-w-[120px] bg-transparent outline-none",
              "text-[color:var(--color-fg-primary)] placeholder:text-[color:var(--color-fg-muted)]",
              "disabled:cursor-not-allowed"
            )}
          />
        </div>

        {/* 자동완성 제안 목록 */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] rounded-[var(--radius-md)] shadow-lg max-h-[200px] overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={clsx(
                  "w-full text-left px-3 py-2 hover:bg-[color:var(--color-bg-elev-1)] transition-colors text-sm",
                  selectedSuggestionIndex === index && "bg-[color:var(--color-bg-elev-1)]"
                )}
              >
                #{suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 도움말 텍스트 */}
      {helperText && (
        <p className="text-xs text-[color:var(--color-fg-muted)]">
          {helperText}
          {maxTags && ` (${value.length}/${maxTags})`}
        </p>
      )}
    </div>
  );
};

export default TagInput;
