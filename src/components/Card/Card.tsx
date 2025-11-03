import type { HTMLAttributes} from "react";
import clsx from "clsx";

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="card.root"
    className={clsx(
      "rounded-[var(--card-radius)] border border-[color:var(--card-border)]",
      "bg-[color:var(--card-bg)] shadow-[var(--card-shadow)]",
      "transition-shadow hover:shadow-[var(--shadow-md)]",
      className
    )}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div data-slot="card.header" className={clsx("p-4 border-b border-[color:var(--card-border)]", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 data-slot="card.title" className={clsx("text-[length:var(--text-lg)] font-semibold text-[color:var(--color-text)]", className)} {...props} />
);

export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div data-slot="card.content" className={clsx("p-4 text-[color:var(--color-text)]", className)} {...props} />
);

export const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div data-slot="card.footer" className={clsx("p-4 border-t border-[color:var(--card-border)]", className)} {...props} />
);
