import React, { useRef, useState } from 'react';
import classNames from 'classnames';

export type TooltipPosition = 'top' | 'bottom';

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
  position = 'top',
  wrapperClassName,
  children,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(false);

  if (!text) return <>{children}</>;

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  };

  const isTop = position === 'top';

  return (
    <div
      className={classNames('relative inline-flex', wrapperClassName)}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={classNames(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs leading-snug text-white shadow-lg dark:bg-neutral-700',
            'left-1/2 -translate-x-1/2',
            isTop ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          )}
        >
          {text}
          {/* caret */}
          <span
            className={classNames(
              'absolute left-1/2 -translate-x-1/2 border-4 border-transparent',
              isTop
                ? 'top-full border-t-neutral-900 dark:border-t-neutral-700'
                : 'bottom-full border-b-neutral-900 dark:border-b-neutral-700',
            )}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
