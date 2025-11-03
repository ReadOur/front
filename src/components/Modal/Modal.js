import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import clsx from "clsx";
const sizeMap = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
};
export function Modal({ open, onClose, children, size = "md", closeOnBackdrop = true, labelledBy, }) {
    useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape")
                onClose();
        }
        if (open)
            document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);
    if (!open)
        return null;
    return (_jsxs("div", { role: "dialog", "aria-modal": "true", "aria-labelledby": labelledBy, className: "fixed inset-0 z-[var(--z-modal)] flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 bg-black/40", onClick: () => closeOnBackdrop && onClose(), "aria-hidden": true }), _jsx("div", { className: clsx("relative m-4 w-full rounded-[var(--radius-lg)] bg-[color:var(--color-bg)] p-4 shadow-[var(--shadow-lg)]", sizeMap[size]), children: children })] }));
}
export default Modal;
