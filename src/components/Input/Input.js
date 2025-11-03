import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useId } from "react";
import clsx from "clsx";
export const Input = forwardRef(({ label, helperText, error, leftIcon, rightIcon, fullWidth, className, id, ...props }, ref) => {
    const inputId = id || useId();
    const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined;
    return (_jsxs("div", { className: clsx("flex flex-col gap-1", fullWidth && "w-full"), children: [label && (_jsx("label", { htmlFor: inputId, className: "text-[length:var(--text-sm)] font-medium text-[color:var(--color-text)]", children: label })), _jsxs("div", { className: clsx("relative flex items-center rounded-[var(--input-radius)]", "border bg-[color:var(--input-bg)]", error
                    ? "border-[color:var(--color-error)] ring-1 ring-[color:var(--color-error)]"
                    : "border-[color:var(--input-border)] focus-within:ring-2 focus-within:ring-[color:var(--color-focus)] focus-within:ring-offset-2 focus-within:ring-offset-[color:var(--ring-offset)]"), children: [leftIcon && _jsx("span", { className: "pl-3 text-[color:var(--color-text-muted)]", "aria-hidden": true, children: leftIcon }), _jsx("input", { id: inputId, ref: ref, "aria-describedby": describedBy, className: clsx("w-full rounded-[var(--input-radius)] bg-transparent px-3 py-2", "text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-muted)] focus:outline-none", leftIcon && "pl-2", rightIcon && "pr-2", className), ...props }), rightIcon && _jsx("span", { className: "pr-3 text-[color:var(--color-text-muted)]", "aria-hidden": true, children: rightIcon })] }), error ? (_jsx("p", { id: `${inputId}-error`, className: "text-[length:var(--text-xs)] text-[color:var(--color-error)]", children: error })) : helperText ? (_jsx("p", { id: `${inputId}-help`, className: "text-[length:var(--text-xs)] text-[color:var(--color-text-muted)]", children: helperText })) : null] }));
});
Input.displayName = "Input";
export default Input;
