import clsx from "clsx";

type DividerProps = React.HTMLAttributes<HTMLHRElement> & {
  inset?: boolean;
};

export function Divider({ inset = false, className, ...props }: DividerProps) {
  return (
    <hr
      data-slot="divider.root"
      className={clsx("border-t border-[color:var(--color-border)]", inset && "mx-4", className)}
      {...props}
    />
  );
}

export default Divider;
