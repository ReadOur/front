import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState, cloneElement, isValidElement } from 'react';
import clsx from "clsx";
export default function Tooltip({ content, children, side = "top", className, openDelay = 80, closeDelay = 80, }) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const [timer, setTimer] = useState(null);
    if (!isValidElement(children))
        return null;
    const show = () => {
        if (timer)
            window.clearTimeout(timer);
        setTimer(window.setTimeout(() => setOpen(true), openDelay));
    };
    const hide = () => {
        if (timer)
            window.clearTimeout(timer);
        setTimer(window.setTimeout(() => setOpen(false), closeDelay));
    };
    // children.props가 이제 TriggerProps로 안전하게 인식됨
    const trigger = cloneElement(children, {
        onMouseEnter: (e) => {
            children.props.onMouseEnter?.(e);
            show();
        },
        onMouseLeave: (e) => {
            children.props.onMouseLeave?.(e);
            hide();
        },
        onFocus: (e) => {
            children.props.onFocus?.(e);
            show();
        },
        onBlur: (e) => {
            children.props.onBlur?.(e);
            hide();
        },
        "aria-describedby": id,
    });
    const sideClass = side === "top"
        ? "bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2"
        : side === "bottom"
            ? "top-[calc(100%+6px)] left-1/2 -translate-x-1/2"
            : side === "left"
                ? "right-[calc(100%+6px)] top-1/2 -translate-y-1/2"
                : "left-[calc(100%+6px)] top-1/2 -translate-y-1/2";
    return (_jsxs("span", { className: "relative inline-block", children: [trigger, open && (_jsx("span", { id: id, role: "tooltip", className: clsx("absolute z-[var(--z-tooltip)] select-none whitespace-nowrap", "rounded-[var(--radius-sm)] px-2 py-1 text-[length:var(--text-xs)]", "bg-[color:var(--color-text)] text-[color:var(--on-error)] shadow-[var(--shadow-sm)]", sideClass, className), children: content }))] }));
}
