import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from "clsx";
export function Spinner({ size = 20, className, label }) {
    const style = { width: size, height: size };
    return (_jsxs("div", { role: "status", "aria-live": "polite", className: "inline-flex items-center gap-2", children: [_jsx("span", { className: clsx("inline-block animate-spin rounded-full border-2 border-current border-r-transparent", "text-[color:var(--color-primary)]", className), style: style }), label && _jsx("span", { className: "text-[length:var(--text-sm)] text-[color:var(--color-text-muted)]", children: label })] }));
}
export default Spinner;
