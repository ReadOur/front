import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback } from 'react';
import clsx from "clsx";
const ToastContext = createContext(undefined);
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const show = useCallback((toast) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { ...toast, id }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
    }, []);
    return (_jsxs(ToastContext.Provider, { value: { show }, children: [children, _jsx("div", { className: "fixed top-4 right-4 z-[var(--z-toast)] space-y-3", children: toasts.map((t) => (_jsx("div", { className: clsx("rounded-[var(--radius-md)] shadow-[var(--shadow-md)] px-4 py-2 text-[length:var(--text-sm)] transition-all duration-300", "text-[color:var(--on-primary)]", t.variant === "success" && "bg-[color:var(--color-secondary)]", t.variant === "warning" && "bg-[color:var(--color-accent)]", t.variant === "error" && "bg-[color:var(--color-error)]", (!t.variant || t.variant === "default") && "bg-[color:var(--color-primary)]"), children: t.title }, t.id))) })] }));
}
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx)
        throw new Error("useToast must be used within ToastProvider");
    return ctx;
}
