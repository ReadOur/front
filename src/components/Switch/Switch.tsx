import clsx from "clsx";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  id?: string;
};

export function Switch({ checked, onChange, disabled, label, className, id }: SwitchProps) {
  const inputId = id || Math.random().toString(36).slice(2);
  return (
    <label htmlFor={inputId} className={clsx("inline-flex items-center gap-2 cursor-pointer select-none", disabled && "opacity-60 cursor-not-allowed", className)}>
      <span
        aria-hidden
        className={clsx(
          "relative inline-flex h-6 w-10 items-center rounded-full transition-colors",
          checked ? "bg-[color:var(--color-primary)]" : "bg-[color:var(--color-border)]"
        )}
      >
        <span
          aria-hidden
          className={clsx(
            "absolute left-0.5 h-5 w-5 rounded-full bg-[color:var(--color-bg)] shadow-[var(--shadow-sm)] transition-transform",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </span>
      <input
        id={inputId}
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      {label && <span className="text-[length:var(--text-sm)] text-[color:var(--color-text)]">{label}</span>}
    </label>
  );
}
