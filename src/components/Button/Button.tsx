import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
  color?: "primary" | "secondary" | "destructive" | "neutral";
  size?: "sm" | "md" | "lg";
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
};

const base =
  "relative inline-flex items-center justify-center gap-2 font-medium " +
  "transition-[background,box-shadow,color,border] " +
  "focus:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-[color:var(--color-focus)] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--ring-offset)] " +
  "disabled:opacity-50 disabled:cursor-not-allowed " +
  "rounded-[var(--btn-radius)] shadow-[var(--shadow-sm)]";

const sizeMap = {
  sm: "h-9 px-3 text-[length:var(--text-sm)]",
  md: "h-10 px-[var(--btn-pad-x)] py-[var(--btn-pad-y)] text-[length:var(--text-md)]",
  lg: "h-12 px-5 text-[length:var(--text-md)]",
} as const;

const solidMap = {
  primary:
    "text-[color:var(--btn-primary-fg)] bg-[color:var(--btn-primary-bg)] hover:bg-[color:var(--btn-primary-bg-hover)] active:bg-[color:var(--btn-primary-bg-active)]",
  secondary:
    "text-[color:var(--btn-secondary-fg)] bg-[color:var(--btn-secondary-bg)] hover:bg-[color:var(--btn-secondary-bg-hover)] active:bg-[color:var(--btn-secondary-bg-active)]",
  destructive:
    "text-[color:var(--btn-danger-fg)] bg-[color:var(--btn-danger-bg)] hover:bg-[color:var(--btn-danger-bg-hover)]",
  neutral:
    "text-[color:var(--color-text)] bg-[color:var(--color-surface)] hover:bg-[color:var(--color-surface-2)]",
} as const;

const outlineMap = {
  primary:
    "text-[color:var(--btn-outline-fg)] border border-[color:var(--btn-outline-border)] bg-transparent hover:bg-[color:var(--color-bg)]/8",
  secondary:
    "text-[color:var(--color-secondary)] border border-[color:var(--color-secondary)] bg-transparent hover:bg-[color:var(--color-bg)]/8",
  destructive:
    "text-[color:var(--color-error)] border border-[color:var(--color-error)] bg-transparent hover:bg-[color:var(--color-bg)]/8",
  neutral:
    "text-[color:var(--color-text)] border border-[color:var(--color-border)] bg-transparent hover:bg-[color:var(--color-bg)]/8",
} as const;

const ghostMap = {
  primary:
    "text-[color:var(--btn-outline-fg)] bg-transparent hover:bg-[color:var(--color-bg)]/8",
  secondary:
    "text-[color:var(--color-secondary)] bg-transparent hover:bg-[color:var(--color-bg)]/8",
  destructive:
    "text-[color:var(--color-error)] bg-transparent hover:bg-[color:var(--color-bg)]/8",
  neutral: "text-[color:var(--color-text)] bg-transparent hover:bg-[color:var(--color-bg)]/8",
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "solid",
      color = "primary",
      size = "md",
      leftIcon,
      rightIcon,
      isLoading,
      fullWidth,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const variantMap =
      variant === "solid" ? solidMap : variant === "outline" ? outlineMap : ghostMap;

    return (
      <button
        ref={ref}
        data-slot="button.root"
        className={clsx(base, sizeMap[size], variantMap[color], fullWidth && "w-full", className)}
        aria-busy={isLoading || undefined}
        disabled={props.disabled || isLoading}
        {...props}
      >
        {leftIcon && <span aria-hidden data-slot="button.leftIcon">{leftIcon}</span>}
        <span data-slot="button.label" className={clsx(isLoading && "opacity-0")}>
          {children}
        </span>
        {rightIcon && <span aria-hidden data-slot="button.rightIcon">{rightIcon}</span>}
        {isLoading && (
          <span role="status" aria-live="polite" className="absolute inline-flex" data-slot="button.spinner">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
