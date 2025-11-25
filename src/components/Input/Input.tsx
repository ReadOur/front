import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, fullWidth, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined;

    return (
      <div className={clsx("flex flex-col gap-1", fullWidth && "w-full")}>
        {label && (
          <label htmlFor={inputId} className="text-[length:var(--text-sm)] font-medium text-[color:var(--color-text)]">
            {label}
          </label>
        )}
        <div
          className={clsx(
            "relative flex items-center rounded-[var(--input-radius)]",
            "border bg-[color:var(--input-bg)]",
            error
              ? "border-[color:var(--color-error)] ring-1 ring-[color:var(--color-error)]"
              : "border-[color:var(--input-border)] focus-within:ring-2 focus-within:ring-[color:var(--color-focus)] focus-within:ring-offset-2 focus-within:ring-offset-[color:var(--ring-offset)]"
          )}
        >
          {leftIcon && <span className="pl-3 text-[color:var(--color-text-muted)]" aria-hidden>{leftIcon}</span>}
          <input
            id={inputId}
            ref={ref}
            aria-describedby={describedBy}
            className={clsx(
              "w-full rounded-[var(--input-radius)] bg-transparent px-3 py-2",
              "text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-muted)] focus:outline-none",
              leftIcon && "pl-2",
              rightIcon && "pr-2",
              className
            )}
            {...props}
          />
          {rightIcon && <span className="pr-3 text-[color:var(--color-text-muted)]" aria-hidden>{rightIcon}</span>}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="text-[length:var(--text-xs)] text-[color:var(--color-error)]">{error}</p>
        ) : helperText ? (
          <p id={`${inputId}-help`} className="text-[length:var(--text-xs)] text-[color:var(--color-text-muted)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
