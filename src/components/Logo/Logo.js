import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import logoSrc from "@/assets/logo.png";
import clsx from "clsx";
const sizeMap = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
};
export default function Logo({ src = logoSrc, alt = "Logo", size = "md", label, align = "left", labelClassName, className, }) {
    return (_jsxs("div", { className: clsx("inline-flex items-center gap-2 select-none", align === "center" && "justify-center", className), children: [_jsx("img", { src: src, alt: alt, className: clsx(sizeMap[size], "w-auto"), draggable: false }), label && (_jsx("span", { className: clsx("font-semibold text-gray-800", size === "sm" && "text-sm", size === "md" && "text-base", size === "lg" && "text-lg", labelClassName), children: label }))] }));
}
