import clsx from "clsx";

type AvatarProps = {
  src?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "h-8 w-8 text-[length:var(--text-xs)]",
  md: "h-10 w-10 text-[length:var(--text-sm)]",
  lg: "h-12 w-12 text-[length:var(--text-md)]",
};

export function Avatar({ src, name = "", size = "md", className }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={clsx(
        "inline-flex items-center justify-center rounded-full overflow-hidden",
        "bg-[color:var(--color-surface)] text-[color:var(--color-text)]",
        sizeMap[size],
        className
      )}
      aria-label={name || "avatar"}
    >
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials || "?"}
    </div>
  );
}

export default Avatar;
