import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";

export type TooltipPosition = "top" | "bottom";

export interface TooltipProps {
  /** Text shown in the tooltip. When omitted the component renders children as-is. */
  text?: string;
  /** How long to wait (ms) before showing the tooltip. Defaults to 500. */
  delay?: number;
  /** Where to place the tooltip relative to the trigger. Defaults to 'top'. */
  position?: TooltipPosition;
  /** Extra classes applied to the outer wrapper element. */
  wrapperClassName?: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({
  text,
  delay = 500,
  position = "top",
  wrapperClassName,
  children,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  if (!text) return <>{children}</>;

  const show = () => {
    timerRef.current = setTimeout(() => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setCoords({
          x: rect.left + rect.width / 2,
          y: position === "top" ? rect.top : rect.bottom,
        });
      }
      setVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
    setCoords(null);
  };

  const isTop = position === "top";

  return (
    <div
      ref={wrapperRef}
      className={classNames("relative inline-flex", wrapperClassName)}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible &&
        coords &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[9999] whitespace-nowrap rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs leading-snug text-white shadow-lg dark:bg-neutral-700"
            style={{
              left: coords.x,
              top: coords.y,
              transform: isTop
                ? "translate(-50%, calc(-100% - 6px))"
                : "translate(-50%, 6px)",
            }}
          >
            {text}
            {/* caret */}
            <span
              className={classNames(
                "absolute left-1/2 -translate-x-1/2 border-4 border-transparent",
                isTop
                  ? "top-full border-t-neutral-900 dark:border-t-neutral-700"
                  : "bottom-full border-b-neutral-900 dark:border-b-neutral-700",
              )}
            />
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Tooltip;
