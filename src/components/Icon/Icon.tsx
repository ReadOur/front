import type { ComponentType } from "react";
import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";

type IconName = keyof typeof Icons;

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 20, className, strokeWidth = 2 }: IconProps) {
  const Cmp = Icons[name] as ComponentType<LucideProps>;
  if (!Cmp) return null;
  return <Cmp size={size} className={className} strokeWidth={strokeWidth} aria-hidden />;
}

export default Icon;

// 사용하는 쪽에서 className="text-[color:var(--color-text)]"처럼 지정.