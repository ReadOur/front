import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from "clsx";
export function Checkbox({ label, className, ...props }) {
    const id = props.id || Math.random().toString(36).slice(2);
    return (_jsxs("label", { htmlFor: id, className: clsx("inline-flex items-center gap-2 select-none cursor-pointer", props.disabled && "opacity-60 cursor-not-allowed", className), children: [_jsx("input", { id: id, type: "checkbox", className: "sr-only", ...props }), label && _jsx("span", { className: "text-[length:var(--text-sm)] text-[color:var(--color-text)]", children: label })] }));
}
