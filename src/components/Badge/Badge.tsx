import clsx from "clsx";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  color?: "primary" | "secondary" | "neutral" | "success" | "warning" | "danger";
  soft?: boolean; // soft: 배경 연함
};

const solid = {
  primary: "bg-[color:var(--color-primary)] text-[color:var(--on-primary)]",
  secondary: "bg-[color:var(--color-secondary)] text-[color:var(--on-secondary)]",
  neutral: "bg-[color:var(--color-surface)] text-[color:var(--color-text)]",
  success: "bg-green-500 text-white",
  warning: "bg-amber-500 text-white",
  danger: "bg-[color:var(--color-error)] text-[color:var(--on-error)]",
};

const softMap = {
  primary: "bg-[color:var(--color-primary)]/12 text-[color:var(--color-primary)]",
  secondary: "bg-[color:var(--color-secondary)]/14 text-[color:var(--color-secondary)]",
  neutral: "bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-[color:var(--color-error)]/12 text-[color:var(--color-error)]",
};

export const Badge = ({ color = "neutral", soft = true, className, ...props }: BadgeProps) => (
  <span
    data-slot="badge.root"
    className={clsx(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[length:var(--text-xs)] font-medium",
      soft ? softMap[color] : solid[color],
      className
    )}
    {...props}
  />
);

export default Badge;
