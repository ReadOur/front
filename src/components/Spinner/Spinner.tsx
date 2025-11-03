import type { CSSProperties } from "react";
import clsx from "clsx";

type SpinnerProps = {
  size?: number; // px
  className?: string;
  label?: string;
};

export function Spinner({ size = 20, className, label }: SpinnerProps) {
  const style: CSSProperties = { width: size, height: size };
  return (
    <div role="status" aria-live="polite" className="inline-flex items-center gap-2">
      <span
        className={clsx(
          "inline-block animate-spin rounded-full border-2 border-current border-r-transparent",
          "text-[color:var(--color-primary)]",
          className
        )}
        style={style}
      />
      {label && <span className="text-[length:var(--text-sm)] text-[color:var(--color-text-muted)]">{label}</span>}
    </div>
  );
}

export default Spinner;
