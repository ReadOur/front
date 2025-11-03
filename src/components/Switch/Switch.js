import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from "clsx";
export function Switch({ checked, onChange, disabled, label, className, id }) {
    const inputId = id || Math.random().toString(36).slice(2);
    return (_jsxs("label", { htmlFor: inputId, className: clsx("inline-flex items-center gap-2 cursor-pointer select-none", disabled && "opacity-60 cursor-not-allowed", className), children: [_jsx("span", { "aria-hidden": true, className: clsx("relative inline-flex h-6 w-10 items-center rounded-full transition-colors", checked ? "bg-[color:var(--color-primary)]" : "bg-[color:var(--color-border)]"), children: _jsx("span", { "aria-hidden": true, className: clsx("absolute left-0.5 h-5 w-5 rounded-full bg-[color:var(--color-bg)] shadow-[var(--shadow-sm)] transition-transform", checked ? "translate-x-4" : "translate-x-0") }) }), _jsx("input", { id: inputId, type: "checkbox", className: "sr-only", checked: checked, onChange: (e) => onChange(e.target.checked), disabled: disabled }), label && _jsx("span", { className: "text-[length:var(--text-sm)] text-[color:var(--color-text)]", children: label })] }));
}
