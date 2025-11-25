import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useToast } from "@/components/Toast/ToastProvider";

/**
 * ChatContext
 * - Floating Dock와 Chat 페이지 간 상태 공유
 * - 열려있는 채팅창, 최소화된 채팅창 관리
 */

interface ChatContextType {
  // 상태
  openThreadIds: string[];       // Dock에 열려있는 스레드 ID
  minimizedThreadIds: string[];  // 최소화된 스레드 ID

  // 액션
  openThread: (threadId: string) => void;
  closeThread: (threadId: string) => void;
  minimizeThread: (threadId: string) => void;
  restoreThread: (threadId: string) => void;
  isThreadOpen: (threadId: string) => boolean;
  isThreadMinimized: (threadId: string) => boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [openThreadIds, setOpenThreadIds] = useState<string[]>([]);
  const [minimizedThreadIds, setMinimizedThreadIds] = useState<string[]>([]);
  const toast = useToast();

  const openThread = useCallback((threadId: string) => {
    setOpenThreadIds((prev) => {
      if (prev.includes(threadId)) return prev;
      // 최대 5개까지만 열기 (제한)
      if (prev.length >= 5) {
        toast.show({ title: "최대 5개의 채팅창만 열 수 있습니다.", variant: "warning" });
        return prev;
      }
      return [...prev, threadId];
    });
    // 열면 최소화 해제
    setMinimizedThreadIds((prev) => prev.filter((id) => id !== threadId));
  }, [toast]);

  const closeThread = useCallback((threadId: string) => {
    setOpenThreadIds((prev) => prev.filter((id) => id !== threadId));
    setMinimizedThreadIds((prev) => prev.filter((id) => id !== threadId));
  }, []);

  const minimizeThread = useCallback((threadId: string) => {
    setMinimizedThreadIds((prev) => {
      if (prev.includes(threadId)) return prev;
      return [...prev, threadId];
    });
  }, []);

  const restoreThread = useCallback((threadId: string) => {
    setMinimizedThreadIds((prev) => prev.filter((id) => id !== threadId));
  }, []);

  const isThreadOpen = useCallback(
    (threadId: string) => openThreadIds.includes(threadId),
    [openThreadIds]
  );

  const isThreadMinimized = useCallback(
    (threadId: string) => minimizedThreadIds.includes(threadId),
    [minimizedThreadIds]
  );

  return (
    <ChatContext.Provider
      value={{
        openThreadIds,
        minimizedThreadIds,
        openThread,
        closeThread,
        minimizeThread,
        restoreThread,
        isThreadOpen,
        isThreadMinimized,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}
