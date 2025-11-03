import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import clsx from "clsx";

type ToastVariant = "default" | "success" | "warning" | "error";

interface Toast {
  id: number;
  title: string;
  variant?: ToastVariant;
}

interface ToastContextType {
  show: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 right-4 z-[var(--z-toast)] space-y-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              "rounded-[var(--radius-md)] shadow-[var(--shadow-md)] px-4 py-2 text-[length:var(--text-sm)] transition-all duration-300",
              "text-[color:var(--on-primary)]",
              t.variant === "success" && "bg-[color:var(--color-secondary)]",
              t.variant === "warning" && "bg-[color:var(--color-accent)]",
              t.variant === "error" && "bg-[color:var(--color-error)]",
              (!t.variant || t.variant === "default") && "bg-[color:var(--color-primary)]"
            )}
          >
            {t.title}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
