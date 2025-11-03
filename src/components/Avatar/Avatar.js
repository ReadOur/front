import { jsx as _jsx } from "react/jsx-runtime";
import clsx from "clsx";
const sizeMap = {
    sm: "h-8 w-8 text-[length:var(--text-xs)]",
    md: "h-10 w-10 text-[length:var(--text-sm)]",
    lg: "h-12 w-12 text-[length:var(--text-md)]",
};
export function Avatar({ src, name = "", size = "md", className }) {
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    return (_jsx("div", { className: clsx("inline-flex items-center justify-center rounded-full overflow-hidden", "bg-[color:var(--color-surface)] text-[color:var(--color-text)]", sizeMap[size], className), "aria-label": name || "avatar", children: src ? _jsx("img", { src: src, alt: name, className: "h-full w-full object-cover" }) : initials || "?" }));
}
export default Avatar;
