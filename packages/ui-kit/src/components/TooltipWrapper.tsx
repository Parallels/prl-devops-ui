import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import type { TooltipPosition } from './Tooltip';

export interface TooltipWrapperProps {
  /** Tooltip text. When omitted the child is rendered as-is. */
  text?: string;
  /** Delay in ms before the tooltip appears. Defaults to 500. */
  delay?: number;
  /** Where to place the tooltip relative to the child. Defaults to 'top'. */
  position?: TooltipPosition;
  /** The element to attach the tooltip to. Must accept onMouseEnter / onMouseLeave. */
  children: React.ReactElement<React.HTMLAttributes<Element>>;
}

const VIEWPORT_PADDING = 8; // px to keep away from viewport edges

/**
 * Attaches a styled tooltip to any child element without adding any wrapper
 * element to the DOM. The tooltip is rendered via a React portal directly into
 * document.body and positioned with `position: fixed`, so it has zero impact on
 * the child's layout or spacing.
 *
 * Includes edge collision detection: when the tooltip would overflow the
 * viewport, it is shifted inward and its caret is repositioned to still point
 * at the trigger element.
 */
const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
  text,
  delay = 500,
  position = 'top',
  children,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState(false);
  // Captured center point of the trigger (fixed coords)
  const [triggerCenter, setTriggerCenter] = useState({ top: 0, left: 0 });
  // Post-collision-detection final left for the tooltip (null = not yet measured)
  const [finalLeft, setFinalLeft] = useState<number | null>(null);
  // Caret left offset inside the tooltip box
  const [caretOffset, setCaretOffset] = useState('50%');

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // After the tooltip renders, measure it and clamp within the viewport.
  // The `finalLeft !== null` guard prevents re-running after we've already adjusted.
  useLayoutEffect(() => {
    if (!visible || !tooltipRef.current || finalLeft !== null) return;

    const el = tooltipRef.current;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;

    // Start from the ideal center-aligned position
    let left = triggerCenter.left;

    if (rect.right > vw - VIEWPORT_PADDING) {
      // Overflows right — shift left
      left = triggerCenter.left - (rect.right - (vw - VIEWPORT_PADDING));
    } else if (rect.left < VIEWPORT_PADDING) {
      // Overflows left — shift right
      left = triggerCenter.left + (VIEWPORT_PADDING - rect.left);
    }

    // Move the caret so it still points at the original trigger center.
    // rect.width is the tooltip width; caret is inside the tooltip box.
    const tooltipEdge = left - rect.width / 2;
    const caretPct = ((triggerCenter.left - tooltipEdge) / rect.width) * 100;
    setCaretOffset(`${Math.max(8, Math.min(92, caretPct))}%`);
    setFinalLeft(left);
  }, [visible, triggerCenter, finalLeft]);

  const show = useCallback(
    (e: React.MouseEvent) => {
      const rect = (e.currentTarget as Element).getBoundingClientRect();
      setTriggerCenter({
        top: position === 'top' ? rect.top : rect.bottom,
        left: rect.left + rect.width / 2,
      });
      // Reset collision state for this new show cycle
      setFinalLeft(null);
      setCaretOffset('50%');
      timerRef.current = setTimeout(() => setVisible(true), delay);
      children.props.onMouseEnter?.(e);
    },
    [delay, position, children.props],
  );

  const hide = useCallback(
    (e?: React.MouseEvent) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setVisible(false);
      setFinalLeft(null);
      setCaretOffset('50%');
      if (e) children.props.onMouseLeave?.(e);
    },
    [children.props],
  );

  if (!text) return children;

  const isTop = position === 'top';
  // Render at triggerCenter.left initially (invisible until collision check runs)
  const renderLeft = finalLeft ?? triggerCenter.left;

  const child = React.cloneElement(children, {
    onMouseEnter: show,
    onMouseLeave: hide,
  });

  return (
    <>
      {child}
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            style={{
              position: 'fixed',
              top: triggerCenter.top,
              left: renderLeft,
              transform: isTop
                ? 'translate(-50%, calc(-100% - 8px))'
                : 'translate(-50%, 8px)',
              // Hide until collision detection has run to avoid a 1-frame flash
              // at the wrong position when near the viewport edge
              visibility: finalLeft === null ? 'hidden' : 'visible',
              zIndex: 9999,
            }}
            className="pointer-events-none whitespace-nowrap rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs leading-snug text-white shadow-lg dark:bg-neutral-700"
          >
            {text}
            <span
              style={{ left: caretOffset }}
              className={classNames(
                'absolute -translate-x-1/2 border-4 border-transparent',
                isTop
                  ? 'top-full border-t-neutral-900 dark:border-t-neutral-700'
                  : 'bottom-full border-b-neutral-900 dark:border-b-neutral-700',
              )}
            />
          </div>,
          document.body,
        )}
    </>
  );
};

export default TooltipWrapper;
