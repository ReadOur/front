import { jsx as _jsx } from "react/jsx-runtime";
import * as Icons from "lucide-react";
export function Icon({ name, size = 20, className, strokeWidth = 2 }) {
    const Cmp = Icons[name];
    if (!Cmp)
        return null;
    return _jsx(Cmp, { size: size, className: className, strokeWidth: strokeWidth, "aria-hidden": true });
}
export default Icon;
