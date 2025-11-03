import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
// Optional: npm i socket.io-client (when backend ready)
// import { io, Socket } from "socket.io-client";
import { X, Minus, Send, Circle, Loader2, MessageCircle } from "lucide-react";
/**
 * ChatDock — Facebook DM 스타일의 우측 고정 채팅 도크
 * - 페이지 우측에 항상 떠 있는 채팅 버튼/도크
 * - 스레드(대화방) 목록에서 클릭하면 작은 채팅 윈도우가 우측에 뜸 (동시 여러 개)
 * - 토큰 기반 색/테두리/라운드만 사용 (tokens.css)
 * - 소켓은 훅 분리 (useMockSocket / useSocket) — 백 준비 전에는 모킹으로 동작
 */
const cls = (...xs) => xs.filter(Boolean).join(" ");
function useMockSocket() {
    const listeners = useRef({ message: [], typing: [] });
    function emit(event, payload) {
        if (event === "message") {
            const fns = listeners.current.message;
            for (const fn of fns)
                fn(payload);
        }
        else {
            const fns = listeners.current.typing;
            for (const fn of fns)
                fn(payload);
        }
    }
    function on(event, fn) {
        if (event === "message") {
            const typed = fn;
            listeners.current.message.push(typed);
            return () => {
                listeners.current.message = listeners.current.message.filter((x) => x !== typed);
            };
        }
        else {
            const typed = fn;
            listeners.current.typing.push(typed);
            return () => {
                listeners.current.typing = listeners.current.typing.filter((x) => x !== typed);
            };
        }
    }
    return {
        on,
        sendMessage: (m) => {
            setTimeout(() => emit("message", m), 200); // echo
        },
        setTyping: (threadId, userId, typing) => {
            emit("typing", { threadId, userId, typing });
        },
    };
}
// ===== Chat window =====
function Avatar({ user, size = 24 }) {
    if (user.avatarUrl) {
        return (_jsx("img", { src: user.avatarUrl, alt: user.name, style: { width: size, height: size }, className: "rounded-full object-cover border border-[color:var(--color-border-subtle)]" }));
    }
    return (_jsx("div", { style: { width: size, height: size }, className: "rounded-full bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] grid place-items-center text-[10px] text-[color:var(--color-fg-muted)]", "aria-label": user.name, children: user.name?.[0] ?? "U" }));
}
function ThreadChip({ thread, onOpen }) {
    const title = thread.users.map((u) => u.name).join(", ");
    const unread = Math.min(99, thread.unreadCount || 0);
    return (_jsxs("button", { onClick: () => onOpen(thread), className: "relative w-full flex items-center gap-2 p-2 rounded-[var(--radius-md)] hover:bg-[color:var(--color-bg-hover)] text-left", title: title, children: [_jsxs("div", { className: "relative", children: [_jsx(Avatar, { user: thread.users[0] }), thread.users[0]?.online && (_jsx(Circle, { className: "absolute -right-1 -bottom-1 w-3 h-3" }))] }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "text-sm font-medium truncate text-[color:var(--color-fg-primary)]", children: title }), thread.lastMessage && (_jsx("div", { className: "text-xs text-[color:var(--color-fg-muted)] truncate", children: thread.lastMessage.text }))] }), unread > 0 && (_jsx("span", { className: "ml-auto min-w-5 h-5 px-1 grid place-items-center rounded-full text-[10px] font-bold bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]", children: unread }))] }));
}
function ChatWindow({ me, thread, messages, typingUserIds = [], onClose, onMinimize, onSend, __onDragStart, }) {
    const [text, setText] = useState("");
    const boxRef = useRef(null);
    useEffect(() => {
        boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
    }, [messages]);
    const title = thread.users.map((u) => u.name).join(", ");
    return (_jsxs("div", { className: "w-[320px] h-[420px] flex flex-col overflow-hidden\r\n             rounded-[var(--radius-lg)]\r\n             bg-[color:var(--color-bg-elev-2)]\r\n             border border-[color:var(--color-border-strong)]\r\n             shadow-xl", children: [_jsxs("div", { className: "h-11 flex items-center gap-2 px-2 border-b border-[color:var(--color-border-subtle)] cursor-move select-none", onPointerDown: __onDragStart, children: [" // \u2728 \uCD94\uAC00", _jsx(Avatar, { user: thread.users[0] }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "text-sm font-semibold truncate", children: title }), _jsx("div", { className: "text-[10px] text-[color:var(--color-fg-muted)] truncate", children: typingUserIds.length > 0 ? "입력 중…" : "대화 중" })] }), _jsx("button", { onClick: onMinimize, className: "w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-[color:var(--color-bg-hover)]", title: "\uCD5C\uC18C\uD654", children: _jsx(Minus, { className: "w-4 h-4" }) }), _jsx("button", { onClick: onClose, className: "w-8 h-8 grid place-items-center rounded-[var(--radius-md)] hover:bg-[color:var(--color-bg-hover)]", title: "\uB2EB\uAE30", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("div", { ref: boxRef, className: "flex-1 overflow-auto p-3 space-y-2", children: [messages.map((m) => {
                        const mine = m.fromId === me.id;
                        return (_jsxs("div", { className: cls("max-w-[75%] px-3 py-2 rounded-[var(--radius-lg)]", mine ? "ml-auto bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]" : "bg-[color:var(--color-bg-elev-2)] text-[color:var(--color-fg-primary)]"), children: [_jsx("div", { className: "text-sm leading-snug whitespace-pre-wrap break-words", children: m.text }), _jsx("div", { className: cls("mt-1 text-[10px]", mine ? "opacity-80" : "text-[color:var(--color-fg-muted)]"), children: new Date(m.createdAt).toLocaleTimeString() })] }, m.id));
                    }), typingUserIds.length > 0 && (_jsxs("div", { className: "inline-flex items-center gap-2 text-[color:var(--color-fg-muted)] text-xs", children: [_jsx(Loader2, { className: "w-3 h-3 animate-spin" }), " \uC785\uB825 \uC911\u2026"] }))] }), _jsx("form", { onSubmit: (e) => {
                    e.preventDefault();
                    const v = text.trim();
                    if (!v)
                        return;
                    onSend(v);
                    setText("");
                }, className: "p-2 border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)]", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { value: text, onChange: (e) => setText(e.target.value), placeholder: "\uBA54\uC2DC\uC9C0\uB97C \uC785\uB825\uD558\uC138\uC694", className: "flex-1 h-9 px-3 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/40" }), _jsxs("button", { type: "submit", className: "h-9 px-3 rounded-[var(--radius-md)] border border-[color:var(--btn-primary-border)] bg-[color:var(--btn-primary-bg)] text-[color:var(--btn-primary-fg)] inline-flex items-center gap-1", children: [_jsx(Send, { className: "w-4 h-4" }), "\uBCF4\uB0B4\uAE30"] })] }) })] }));
}
// ===== Dock (collapsed icon that expands on hover/click) =====
export default function ChatDock() {
    const [zMap, setZMap] = useState({});
    const zSeed = useRef(100); // 창 기본 z-index 기준보다 크게
    const bringToFront = (id) => {
        zSeed.current += 1;
        setZMap(prev => ({ ...prev, [id]: zSeed.current }));
    };
    // Mock data
    const me = { id: "me", name: "두구다", avatarUrl: "" };
    const [threads, setThreads] = useState([
        { id: "t1", users: [{ id: "u1", name: "콩콩" }], unreadCount: 2, lastMessage: { id: "m0", threadId: "t1", fromId: "u1", text: "오늘 저녁?", createdAt: Date.now() - 600000 } },
        { id: "t2", users: [{ id: "u2", name: "쭈꾸미" }], lastMessage: { id: "m1", threadId: "t2", fromId: "u2", text: "파일 확인했어!", createdAt: Date.now() - 3600000 } },
        { id: "t3", users: [{ id: "u3", name: "자몽" }], lastMessage: { id: "m2", threadId: "t3", fromId: "u3", text: "굿굿", createdAt: Date.now() - 7200000 } },
    ]);
    // ===== 추가 =====
    // 채팅창 위치 상태 (픽셀 단위)
    const [positions, setPositions] = useState({});
    // 드래그 중인 창 정보
    const dragInfo = useRef({
        id: null,
        offsetX: 0,
        offsetY: 0,
    });
    const onDragStart = (id, e) => {
        const p = positions[id] || { x: 0, y: 0 };
        dragInfo.current = { id, offsetX: e.clientX - p.x, offsetY: e.clientY - p.y };
        e.target.setPointerCapture(e.pointerId);
    };
    const onDragMove = (e) => {
        const id = dragInfo.current.id;
        if (!id)
            return;
        const x = e.clientX - dragInfo.current.offsetX;
        const y = e.clientY - dragInfo.current.offsetY;
        const W = 320, H = 420, margin = 8;
        const maxX = window.innerWidth - W - margin;
        const maxY = window.innerHeight - H - margin;
        setPositions((prev) => ({
            ...prev,
            [id]: {
                x: Math.min(Math.max(margin, x), maxX),
                y: Math.min(Math.max(margin, y), maxY),
            },
        }));
    };
    const onDragEnd = (e) => {
        dragInfo.current.id = null;
        try {
            e.target.releasePointerCapture(e.pointerId);
        }
        catch {
            // ignore safely: pointer capture may already be released
        }
    };
    const [openIds, setOpenIds] = useState([]); // opened window threadIds (order matters)
    const [messages, setMessages] = useState({
        t1: [
            { id: "a", threadId: "t1", fromId: "u1", text: "안녕!", createdAt: Date.now() - 86400000 },
        ],
    });
    const [typing, setTyping] = useState({});
    const [panelOpen, setPanelOpen] = useState(false); // for mobile/tap
    // ===== 패널 자동 닫힘 타이머 관련 =====
    const closeTimer = useRef(null);
    const openPanel = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
        setPanelOpen(true);
    };
    const scheduleClose = (delay = 1000) => {
        if (closeTimer.current)
            clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => {
            setPanelOpen(false);
            closeTimer.current = null;
        }, delay);
    };
    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            if (closeTimer.current)
                clearTimeout(closeTimer.current);
        };
    }, []);
    const socket = useMockSocket();
    useEffect(() => {
        const offMsg = socket.on("message", (m) => {
            setMessages((prev) => ({ ...prev, [m.threadId]: [...(prev[m.threadId] || []), m] }));
            setThreads((prev) => prev.map((t) => (t.id === m.threadId ? { ...t, lastMessage: m, unreadCount: (t.unreadCount || 0) + (m.fromId === me.id ? 0 : 1) } : t)));
        });
        const offTyping = socket.on("typing", ({ threadId, userId, typing }) => {
            setTyping((prev) => {
                const list = new Set(prev[threadId] || []);
                if (typing)
                    list.add(userId);
                else
                    list.delete(userId);
                return { ...prev, [threadId]: [...list] };
            });
        });
        return () => {
            offMsg?.();
            offTyping?.();
        };
    }, []);
    const unreadTotal = Math.min(99, threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0));
    const openThread = (t) => {
        setOpenIds((ids) => (ids.includes(t.id) ? ids : [...ids, t.id].slice(-3)));
        setThreads((prev) => prev.map((x) => (x.id === t.id ? { ...x, unreadCount: 0 } : x)));
        // ✨ 기본 위치 설정 (창이 처음 열릴 때만)
        setPositions((prev) => {
            if (prev[t.id])
                return prev;
            const W = 320;
            const H = 420;
            const m = 16;
            const x = Math.max(8, window.innerWidth - (88 + W) - m);
            const y = Math.max(8, window.innerHeight - (H + m));
            return { ...prev, [t.id]: { x, y } };
        });
        bringToFront(t.id);
    };
    const closeThread = (id) => setOpenIds((ids) => ids.filter((x) => x !== id));
    const minimizeThread = (id) => setOpenIds((ids) => [id, ...ids.filter((x) => x !== id)]); // move to leftmost
    const sendMessage = (threadId, text) => {
        const msg = { id: Math.random().toString(36).slice(2), threadId, fromId: me.id, text, createdAt: Date.now() };
        setMessages((prev) => ({ ...prev, [threadId]: [...(prev[threadId] || []), msg] }));
        setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, lastMessage: msg } : t)));
        socket.sendMessage(msg);
    };
    // 변경 2: 반환부 전체 교체 (return ...)
    return (_jsxs("div", { id: "chatdock-root", style: { position: "fixed", right: 16, bottom: 16, zIndex: 60 }, children: [_jsxs("div", { onMouseEnter: openPanel, onMouseLeave: () => scheduleClose(1000), children: [_jsxs("button", { onClick: () => (panelOpen ? setPanelOpen(false) : openPanel()), className: "relative w-12 h-12 rounded-full border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] shadow-md grid place-items-center", "aria-label": "\uCC44\uD305 \uC5F4\uAE30", children: [_jsx(MessageCircle, { className: "w-6 h-6 text-[color:var(--color-fg-primary)]" }), unreadTotal > 0 && (_jsx("span", { className: "absolute -top-1 -right-1 min-w-5 h-5 px-1 grid place-items-center rounded-full text-[10px] font-bold bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]", children: unreadTotal }))] }), _jsx("div", { className: cls("absolute w-[280px] max-h-[60vh] transition-all duration-200", panelOpen
                            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                            : "opacity-0 translate-y-2 scale-95 pointer-events-none"), style: { right: "calc(100% + 8px)", bottom: "calc(100% + 8px)" }, children: _jsxs("div", { className: "rounded-[var(--radius-lg)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] shadow-xl overflow-hidden", children: [_jsxs("div", { className: "h-10 flex items-center justify-between px-2 border-b border-[color:var(--color-border-subtle)]", children: [_jsx("div", { className: "text-sm font-semibold", children: "\uCC44\uD305" }), _jsx("button", { onClick: () => setPanelOpen(false), className: "text-xs text-[color:var(--color-fg-muted)] hover:underline", children: "\uB2EB\uAE30" })] }), _jsx("div", { className: "max-h-[60vh] overflow-auto p-1", children: threads.map((t) => (_jsx(ThreadChip, { thread: t, onOpen: (thr) => {
                                            openThread(thr);
                                            setPanelOpen(false); // 항목 클릭하면 패널 닫기 (원하면 유지로 바꿔도 됨)
                                        } }, t.id))) })] }) })] }), openIds.map((id) => {
                const t = threads.find((x) => x.id === id);
                if (!t)
                    return null;
                const msgs = messages[id] || [];
                const typingIds = typing[id] || [];
                const pos = positions[id] || { x: 0, y: 0 };
                const z = zMap[id] ?? 61; // 기본값(다른 전역 UI 위)
                return (_jsx("div", { style: { position: "fixed", left: pos.x, top: pos.y, zIndex: z }, onPointerMove: onDragMove, onPointerUp: onDragEnd, onPointerCancel: onDragEnd, onMouseDown: () => bringToFront(id), children: _jsx(ChatWindow, { me: me, thread: t, messages: msgs, typingUserIds: typingIds, onClose: () => closeThread(id), onMinimize: () => minimizeThread(id), onSend: (text) => sendMessage(id, text), __onDragStart: (e) => onDragStart(id, e) }) }, id));
            })] }));
}
