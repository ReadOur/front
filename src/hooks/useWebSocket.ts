/**
 * WebSocket 연결 관리 훅
 * - 채팅방별 웹소켓 연결 관리
 * - 실시간 메시지 수신
 * - 자동 재연결
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { getAccessToken } from "@/utils/auth";
import type { RoomMessageType } from "@/types";

export type WebSocketStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

export interface WebSocketMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderNickname: string;
  senderRole?: string;
  type: RoomMessageType;
  body: {
    text?: string;
    imageUrl?: string;
    fileUrl?: string;
    fileName?: string;
    command?: string;
    payload?: unknown;
  };
  replyToMsgId: number | null;
  createdAt: string;
  deletedAt: string | null;
}

interface UseWebSocketOptions {
  roomId: number;
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  enabled?: boolean;
}

/**
 * 웹소켓 연결 훅
 */
export function useWebSocket({
  roomId,
  onMessage,
  onOpen,
  onClose,
  onError,
  autoReconnect = true,
  reconnectInterval = 3000,
  enabled = true,
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<WebSocketStatus>("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // 웹소켓 URL 생성
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const baseUrl = import.meta.env.VITE_WS_BASE_URL || "localhost:8080";
    const token = getAccessToken();

    // 토큰을 query string으로 전달
    const url = `${protocol}//${baseUrl}/ws/chat/${roomId}${token ? `?token=${token}` : ""}`;

    console.log("🔌 WebSocket URL:", url);
    return url;
  }, [roomId]);

  // 웹소켓 연결
  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      console.log(`🔌 Connecting to WebSocket for room ${roomId}...`);
      setStatus("connecting");

      const ws = new WebSocket(getWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`✅ WebSocket connected for room ${roomId}`);
        setStatus("connected");
        reconnectAttemptsRef.current = 0; // 연결 성공 시 재연결 카운트 리셋
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log(`📨 Message received in room ${roomId}:`, message);
          onMessage?.(message);
        } catch (error) {
          console.error("❌ Failed to parse WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error(`❌ WebSocket error in room ${roomId}:`, error);
        setStatus("error");
        onError?.(error);
      };

      ws.onclose = (event) => {
        console.log(`🔌 WebSocket closed for room ${roomId}:`, event.code, event.reason);
        setStatus("disconnected");
        wsRef.current = null;
        onClose?.();

        // 자동 재연결 (정상 종료가 아닌 경우)
        if (
          autoReconnect &&
          enabled &&
          !event.wasClean &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current += 1;
          console.log(
            `🔄 Reconnecting to room ${roomId} (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error(`❌ Failed to create WebSocket for room ${roomId}:`, error);
      setStatus("error");
    }
  }, [enabled, roomId, getWebSocketUrl, onMessage, onOpen, onClose, onError, autoReconnect, reconnectInterval]);

  // 웹소켓 연결 해제
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      console.log(`🔌 Disconnecting WebSocket for room ${roomId}...`);
      wsRef.current.close(1000, "Client closed connection");
      wsRef.current = null;
      setStatus("disconnected");
    }
  }, [roomId]);

  // 메시지 전송 (참고: 현재는 REST API 사용)
  const sendMessage = useCallback(
    (message: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ text: message }));
      } else {
        console.warn("⚠️ WebSocket is not connected. Cannot send message.");
      }
    },
    []
  );

  // enabled 상태에 따라 연결/해제
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    status,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
}
