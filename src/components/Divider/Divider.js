import { jsx as _jsx } from "react/jsx-runtime";
import clsx from "clsx";
export function Divider({ inset = false, className, ...props }) {
    return (_jsx("hr", { "data-slot": "divider.root", className: clsx("border-t border-[color:var(--color-border)]", inset && "mx-4", className), ...props }));
}
export default Divider;
