import React, { useId, useState, cloneElement, isValidElement, type ReactElement } from 'react';
import clsx from "clsx";

// 트리거 요소가 가질 수 있는 이벤트/속성의 타입을 명시
type TriggerProps = {
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
  onFocus?: React.FocusEventHandler;
  onBlur?: React.FocusEventHandler;
  "aria-describedby"?: string;
};

type TooltipProps = {
  content: string;
  // 핵심: unknown이 아니라 TriggerProps를 가진 ReactElement 로 지정
  children: ReactElement<TriggerProps>;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  openDelay?: number;
  closeDelay?: number;
};

export default function Tooltip({
                                  content,
                                  children,
                                  side = "top",
                                  className,
                                  openDelay = 80,
                                  closeDelay = 80,
                                }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);

  if (!isValidElement(children)) return null;

  const show = () => {
    if (timer) window.clearTimeout(timer);
    setTimer(window.setTimeout(() => setOpen(true), openDelay));
  };

  const hide = () => {
    if (timer) window.clearTimeout(timer);
    setTimer(window.setTimeout(() => setOpen(false), closeDelay));
  };

  // children.props가 이제 TriggerProps로 안전하게 인식됨
  const trigger = cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e);
      show();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e);
      show();
    },
    onBlur: (e: React.FocusEvent) => {
      children.props.onBlur?.(e);
      hide();
    },
    "aria-describedby": id,
  });

  const sideClass =
    side === "top"
      ? "bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2"
      : side === "bottom"
        ? "top-[calc(100%+6px)] left-1/2 -translate-x-1/2"
        : side === "left"
          ? "right-[calc(100%+6px)] top-1/2 -translate-y-1/2"
          : "left-[calc(100%+6px)] top-1/2 -translate-y-1/2";

  return (
    <span className="relative inline-block">
      {trigger}
      {open && (
        <span
          id={id}
          role="tooltip"
          className={clsx(
            "absolute z-[var(--z-tooltip)] select-none whitespace-nowrap",
            "rounded-[var(--radius-sm)] px-2 py-1 text-[length:var(--text-xs)]",
            "bg-[color:var(--color-text)] text-[color:var(--on-error)] shadow-[var(--shadow-sm)]",
            sideClass,
            className
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
