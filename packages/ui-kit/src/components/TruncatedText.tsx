import React, { useEffect, useRef, useState } from "react";
import type { TooltipPosition } from "./Tooltip";
import TooltipWrapper from "./TooltipWrapper";

export interface TruncatedTextProps {
  /** The text to display, truncated with an ellipsis when it overflows. */
  text: string;
  /** Extra classes applied to the text element. */
  className?: string;
  /** Delay in ms before the tooltip becomes visible. Defaults to 2000. */
  delay?: number;
  /** Render as a different element. Defaults to "div". */
  as?: "div" | "span" | "p";
  /** Where to place the tooltip. Defaults to 'top'. */
  tooltipPosition?: TooltipPosition;
  /**
   * When true, the outer `<div class="min-w-0">` wrapper is omitted and the
   * TooltipWrapper is returned directly. Use this when TruncatedText is a flex
   * child and you control sizing via `className` (e.g. `"min-w-0 flex-1"`).
   */
  noWrapper?: boolean;
}

const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  className,
  delay = 2000,
  as: Tag = "div",
  tooltipPosition = "top",
  noWrapper = false,
}) => {
  const ref = useRef<HTMLElement>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Guard against ResizeObserver firing for a detached node, which would
    // report scrollWidth=0 and incorrectly reset the truncated state.
    const check = () => {
      if (el.isConnected) setTruncated(el.scrollWidth > el.clientWidth);
    };
    const observer = new ResizeObserver(check);
    observer.observe(el);
    check();
    return () => observer.disconnect();
  }, [text]);

  // Always keep TooltipWrapper in the tree (pass text only when truncated).
  // This avoids React reconciliation switching between a bare Tag and a
  // TooltipWrapper>Tag tree, which would unmount/remount the Tag element and
  // detach the ref, causing a ResizeObserver feedback loop.
  const inner = (
    <TooltipWrapper
      text={truncated ? text : undefined}
      delay={delay}
      position={tooltipPosition}
    >
      <Tag
        ref={
          ref as React.Ref<
            HTMLDivElement & HTMLSpanElement & HTMLParagraphElement
          >
        }
        className={["truncate", className].filter(Boolean).join(" ")}
      >
        {text}
      </Tag>
    </TooltipWrapper>
  );

  if (noWrapper) return inner;

  return <div className="min-w-0">{inner}</div>;
};

export default TruncatedText;
