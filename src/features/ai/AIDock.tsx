import React, { useState, useRef, useEffect } from "react";
import { X, Minimize2, Send, Sparkles } from "lucide-react";

/**
 * AIDock - AI 기능창 (우측 도크)
 * - 페이지 우측에 떠 있는 AI 채팅 윈도우
 * - ChatDock과 유사한 UI 패턴
 * - 추후 AI API 연동 예정
 */

interface AIMessage {
  id: string;
  type: "user" | "ai";
  text: string;
  timestamp: number;
}

interface AIDockProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
}

export default function AIDock({ isOpen, onClose, onMinimize }: AIDockProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "welcome",
      type: "ai",
      text: "안녕하세요! AI 어시스턴트입니다. 무엇을 도와드릴까요?",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => {
    const width = 384; // w-96
    const height = 600;
    const margin = 16;
    return {
      x: Math.max(margin, window.innerWidth - width - margin),
      y: Math.max(margin, window.innerHeight - height - margin),
    };
  });
  const dragInfo = useRef<{ isDragging: boolean; offsetX: number; offsetY: number }>({
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
  });

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleDragStart = (e: React.PointerEvent) => {
    dragInfo.current = {
      isDragging: true,
      offsetX: e.clientX - position.x,
      offsetY: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!dragInfo.current.isDragging) return;

    const x = e.clientX - dragInfo.current.offsetX;
    const y = e.clientY - dragInfo.current.offsetY;

    const width = 384; // w-96
    const height = 600;
    const margin = 16;
    const maxX = window.innerWidth - width - margin;
    const maxY = window.innerHeight - height - margin;

    setPosition({
      x: Math.min(Math.max(margin, x), maxX),
      y: Math.min(Math.max(margin, y), maxY),
    });
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    dragInfo.current.isDragging = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // 이미 해제된 경우 무시
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: inputText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // TODO: AI API 연동
    // 임시: 2초 후 응답
    setTimeout(() => {
      const aiMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        type: "ai",
        text: "AI 응답 기능은 추후 구현 예정입니다.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed right-4 bottom-4 w-96 h-[600px] flex flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[color:var(--chatdock-bg-elev-2)] border border-[color:var(--chatdock-border-strong)] shadow-2xl z-50"
      style={{
        maxHeight: "calc(100vh - 2rem)",
        left: position.x,
        top: position.y,
        right: "auto",
        bottom: "auto",
      }}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerCancel={handleDragEnd}
    >
      <button
        className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-[color:var(--chatdock-bg-elev-3)] border border-[color:var(--chatdock-border-subtle)] cursor-grab active:cursor-grabbing"
        onPointerDown={handleDragStart}
        aria-label="창 위치 이동"
      />
      <button
        className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[color:var(--chatdock-bg-elev-3)] border border-[color:var(--chatdock-border-subtle)] cursor-grab active:cursor-grabbing"
        onPointerDown={handleDragStart}
        aria-label="창 위치 이동"
      />
      <button
        className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-[color:var(--chatdock-bg-elev-3)] border border-[color:var(--chatdock-border-subtle)] cursor-grab active:cursor-grabbing"
        onPointerDown={handleDragStart}
        aria-label="창 위치 이동"
      />
      <button
        className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-[color:var(--chatdock-bg-elev-3)] border border-[color:var(--chatdock-border-subtle)] cursor-grab active:cursor-grabbing"
        onPointerDown={handleDragStart}
        aria-label="창 위치 이동"
      />
      {/* 헤더 */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-[color:var(--chatdock-border-subtle)] bg-gradient-to-r from-purple-500 to-blue-500">
        <Sparkles className="w-5 h-5 text-white" />
        <div className="flex-1">
          <div className="text-sm font-bold text-white">AI 어시스턴트</div>
          <div className="text-xs text-white/80">무엇을 도와드릴까요?</div>
        </div>
        {onMinimize && (
          <button
            onClick={onMinimize}
            className="w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-white/20 text-white"
            title="최소화"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onClose}
          className="w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-white/20 text-white"
          title="닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                msg.type === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-[color:var(--chatdock-bg-elev-1)] text-[color:var(--chatdock-fg-primary)] border border-[color:var(--chatdock-border-subtle)]"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap break-words">{msg.text}</div>
              <div
                className={`mt-1 text-xs ${
                  msg.type === "user" ? "text-white/70" : "text-[color:var(--chatdock-fg-muted)]"
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[color:var(--chatdock-bg-elev-1)] border border-[color:var(--chatdock-border-subtle)] px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2 text-[color:var(--chatdock-fg-muted)]">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
                <span className="text-sm">AI가 생각 중...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 border-t border-[color:var(--chatdock-border-subtle)] bg-[color:var(--chatdock-bg-elev-1)]"
      >
        <div className="flex items-center gap-2">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-3 py-2 rounded-[var(--radius-md)] bg-[color:var(--chatdock-bg-elev-2)] border border-[color:var(--chatdock-border-subtle)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-[color:var(--chatdock-fg-primary)]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2 rounded-[var(--radius-md)] bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            전송
          </button>
        </div>
      </form>
    </div>
  );
}
