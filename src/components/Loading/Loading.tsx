import React from 'react';

interface LoadingProps {
  /**
   * 로딩 메시지 (기본값: "Loading...")
   */
  message?: string;
  /**
   * 전체 화면 로딩 여부 (기본값: true)
   */
  fullScreen?: boolean;
}

/**
 * 로딩 인디케이터 컴포넌트
 * - 중앙 정렬
 * - 애니메이션 포함
 * - 배경색 유지
 */
export const Loading: React.FC<LoadingProps> = ({
  message = "Loading...",
  fullScreen = true
}) => {
  const containerClass = fullScreen
    ? "fixed inset-0 flex items-center justify-center bg-[color:var(--color-bg-canvas)]"
    : "flex items-center justify-center w-full h-full bg-[color:var(--color-bg-canvas)]";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-4">
        {/* 로딩 스피너 */}
        <div className="relative w-16 h-16">
          {/* 외부 원 (회전) */}
          <div className="absolute inset-0 border-4 border-[color:var(--color-border-subtle)] rounded-full"></div>

          {/* 내부 원 (회전 애니메이션) */}
          <div
            className="absolute inset-0 border-4 border-transparent border-t-[color:var(--color-accent)] rounded-full animate-spin"
            style={{ animationDuration: '1s' }}
          ></div>
        </div>

        {/* 로딩 텍스트 */}
        <div className="text-xl font-medium text-[color:var(--color-fg-primary)] animate-pulse">
          {message}
        </div>

        {/* 로딩 바 (선택사항) */}
        <div className="w-48 h-1 bg-[color:var(--color-bg-elev-2)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[color:var(--color-accent)] rounded-full animate-loading-bar"
            style={{
              animation: 'loading-bar 1.5s ease-in-out infinite',
            }}
          ></div>
        </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
};

export default Loading;
