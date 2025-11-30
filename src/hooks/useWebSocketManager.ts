/**
 * 여러 채팅방의 웹소켓 연결을 관리하는 훅
 * - 채팅방이 열릴 때 웹소켓 연결
 * - 채팅방이 닫힐 때 웹소켓 해제
 * - 실시간 메시지 수신
 */

import { useEffect, useRef, useCallback } from "react";
import { getAccessToken } from "@/utils/auth";
import { WebSocketMessage } from "./useWebSocket";

interface UseWebSocketManagerOptions {
  roomIds: number[];
  onMessage?: (roomId: number, message: WebSocketMessage) => void;
  enabled?: boolean;
  maxReconnectAttempts?: number;
  reconnectBackoff?: "linear" | "exponential";
  reconnectBaseDelay?: number;
}

/**
 * 여러 웹소켓 연결 관리 훅
 */
export function useWebSocketManager({
  roomIds,
  onMessage,
  enabled = true,
  maxReconnectAttempts = 5,
  reconnectBackoff = "exponential",
  reconnectBaseDelay = 3000,
}: UseWebSocketManagerOptions) {
  // roomId -> WebSocket 맵핑
  const websocketsRef = useRef<Map<number, WebSocket>>(new Map());
  const reconnectTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const reconnectAttemptsRef = useRef<Map<number, number>>(new Map());

  const getReconnectDelay = useCallback(
    (attempt: number) => {
      if (reconnectBackoff === "linear") {
        return reconnectBaseDelay * attempt;
      }
      return reconnectBaseDelay * 2 ** (attempt - 1);
    },
    [reconnectBackoff, reconnectBaseDelay]
  );

  const clearReconnectTimer = useCallback((roomId: number) => {
    const timeoutId = reconnectTimeoutsRef.current.get(roomId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      reconnectTimeoutsRef.current.delete(roomId);
    }
  }, []);

  const resetReconnectState = useCallback(
    (roomId: number) => {
      clearReconnectTimer(roomId);
      reconnectAttemptsRef.current.delete(roomId);
    },
    [clearReconnectTimer]
  );

  // 웹소켓 URL 생성
  const getWebSocketUrl = useCallback((roomId: number) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const baseUrl = import.meta.env.VITE_WS_BASE_URL || "localhost:8080";
    const token = getAccessToken();

    const url = `${protocol}//${baseUrl}/ws/chat/${roomId}${token ? `?token=${token}` : ""}`;
    return url;
  }, []);

  // 특정 채팅방 웹소켓 연결
  const connectRoom = useCallback(
    (roomId: number) => {
      clearReconnectTimer(roomId);

      // 이미 연결되어 있으면 스킵
      if (websocketsRef.current.has(roomId)) {
        const ws = websocketsRef.current.get(roomId);
        if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
          console.log(`⏭️  Room ${roomId} already connected or connecting`);
          return;
        }
      }

      try {
        console.log(`🔌 Connecting to WebSocket for room ${roomId}...`);
        const ws = new WebSocket(getWebSocketUrl(roomId));

        ws.onopen = () => {
          console.log(`✅ WebSocket connected for room ${roomId}`);
          resetReconnectState(roomId);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            console.log(`📨 Message received in room ${roomId}:`, message);
            onMessage?.(roomId, message);
          } catch (error) {
            console.error(`❌ Failed to parse message in room ${roomId}:`, error);
          }
        };

        ws.onerror = (error) => {
          console.error(`❌ WebSocket error in room ${roomId}:`, error);
        };

        ws.onclose = (event) => {
          console.log(`🔌 WebSocket closed for room ${roomId}:`, event.code, event.reason);
          websocketsRef.current.delete(roomId);

          // 비정상 종료 시 재연결 시도
          if (!event.wasClean && enabled && roomIds.includes(roomId)) {
            const currentAttempt = reconnectAttemptsRef.current.get(roomId) ?? 0;

            if (currentAttempt >= maxReconnectAttempts) {
              console.log(
                `⛔️ Reconnect limit reached for room ${roomId} (attempts: ${currentAttempt}/${maxReconnectAttempts})`
              );
              resetReconnectState(roomId);
              return;
            }

            const nextAttempt = currentAttempt + 1;
            reconnectAttemptsRef.current.set(roomId, nextAttempt);

            const delay = getReconnectDelay(nextAttempt);
            console.log(
              `🔄 Will reconnect to room ${roomId} in ${delay}ms (attempt ${nextAttempt}/${maxReconnectAttempts})...`
            );

            const timeoutId = setTimeout(() => {
              connectRoom(roomId);
            }, delay);

            clearReconnectTimer(roomId);
            reconnectTimeoutsRef.current.set(roomId, timeoutId);
          }
        };

        websocketsRef.current.set(roomId, ws);
      } catch (error) {
        console.error(`❌ Failed to create WebSocket for room ${roomId}:`, error);
      }
    },
    [
      clearReconnectTimer,
      enabled,
      getReconnectDelay,
      getWebSocketUrl,
      maxReconnectAttempts,
      onMessage,
      roomIds,
      resetReconnectState,
    ]
  );

  // 특정 채팅방 웹소켓 해제
  const disconnectRoom = useCallback(
    (roomId: number) => {
      resetReconnectState(roomId);

      // 웹소켓 연결 종료
      const ws = websocketsRef.current.get(roomId);
      if (ws) {
        console.log(`🔌 Disconnecting WebSocket for room ${roomId}...`);
        ws.close(1000, "Client closed connection");
        websocketsRef.current.delete(roomId);
      }
    },
    [resetReconnectState]
  );

  // roomIds 변경 시 웹소켓 연결/해제
  useEffect(() => {
    if (!enabled) {
      reconnectTimeoutsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      reconnectTimeoutsRef.current.clear();
      reconnectAttemptsRef.current.clear();

      // enabled=false면 모든 연결 해제
      websocketsRef.current.forEach((_, roomId) => {
        disconnectRoom(roomId);
      });
      return;
    }

    // 현재 연결된 roomId 목록
    const connectedRoomIds = Array.from(websocketsRef.current.keys());

    // 새로 추가된 방 연결
    roomIds.forEach((roomId) => {
      if (!connectedRoomIds.includes(roomId)) {
        connectRoom(roomId);
      }
    });

    // 제거된 방 연결 해제
    connectedRoomIds.forEach((roomId) => {
      if (!roomIds.includes(roomId)) {
        disconnectRoom(roomId);
      }
    });

    reconnectTimeoutsRef.current.forEach((_, roomId) => {
      if (!roomIds.includes(roomId)) {
        resetReconnectState(roomId);
      }
    });
  }, [roomIds, enabled, connectRoom, disconnectRoom, resetReconnectState]);

  // 컴포넌트 언마운트 시 모든 연결 해제
  useEffect(() => {
    const reconnectTimeouts = reconnectTimeoutsRef.current;
    const websockets = websocketsRef.current;
    const reconnectAttempts = reconnectAttemptsRef.current;

    return () => {
      console.log("🔌 Cleaning up all WebSocket connections...");
      // 재연결 타이머 모두 취소
      reconnectTimeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      reconnectTimeouts.clear();
      reconnectAttempts.clear();

      // 모든 웹소켓 연결 종료
      websockets.forEach((ws, roomId) => {
        console.log(`🔌 Closing WebSocket for room ${roomId}...`);
        ws.close(1000, "Component unmounted");
      });
      websockets.clear();
    };
  }, []);

  return {
    connectRoom,
    disconnectRoom,
  };
}
