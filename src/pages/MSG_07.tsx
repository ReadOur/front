import React from "react";

/**
 * 채팅 페이지
 * - 실제 채팅 기능은 우측 하단 ChatDock 컴포넌트에 구현되어 있음
 * - 이 페이지는 ChatDock을 중심으로 보여주는 역할
 */

export default function MSG_07() {
  return (
    <section>
      <h1 className="text-2xl font-bold">채팅방</h1>
      <p className="mt-2 text-[color:var(--color-fg-muted)]">
        이 화면은 전체 채팅 페이지 버전입니다. 오른쪽 하단의 ChatDock은 계속 따로 살아있어요.
      </p>
      <p className="mt-4 text-[color:var(--color-fg-muted)] text-sm">
        💡 ChatDock에서 채팅 기능을 확인하세요! (우측 하단 채팅 버튼)
      </p>
    </section>
  );
}
