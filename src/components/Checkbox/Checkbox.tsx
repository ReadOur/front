// src/components/Checkbox/Checkbox.tsx
import type React from "react";
import clsx from "clsx";

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>; // ← 명시
};

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  const id = props.id || Math.random().toString(36).slice(2);
  return (
    <label
      htmlFor={id}
      className={clsx(
        "inline-flex items-center gap-2 select-none cursor-pointer",
        props.disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      {/* …체크 박스 비주얼… */}
      <input id={id} type="checkbox" className="sr-only" {...props} />
      {label && <span className="text-[length:var(--text-sm)] text-[color:var(--color-text)]">{label}</span>}
    </label>
  );
}
