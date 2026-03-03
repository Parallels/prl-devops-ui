import React, { useEffect, useRef, useState } from 'react';

export interface TruncatedTextProps {
  /** The text to display, truncated with an ellipsis when it overflows. */
  text: string;
  /** Extra classes applied to the text element. */
  className?: string;
  /** Delay in ms before the tooltip becomes visible. Defaults to 600. */
  delay?: number;
  /** Render as a different element. Defaults to "div". */
  as?: 'div' | 'span' | 'p';
}

const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  className,
  delay = 600,
  as: Tag = 'div',
}) => {
  const ref = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setTruncated(el.scrollWidth > el.clientWidth);
    const observer = new ResizeObserver(check);
    observer.observe(el);
    check();
    return () => observer.disconnect();
  }, [text]);

  const handleMouseEnter = () => {
    if (!truncated) return;
    timerRef.current = setTimeout(() => setVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  };

  return (
    <div className="relative min-w-0">
      <Tag
        ref={ref as React.Ref<HTMLDivElement & HTMLSpanElement & HTMLParagraphElement>}
        className={['truncate', className].filter(Boolean).join(' ')}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {text}
      </Tag>
      {visible && truncated && (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 max-w-xs break-all rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs leading-snug text-white shadow-lg dark:bg-neutral-700"
        >
          {text}
          <span className="absolute bottom-full left-3 border-4 border-transparent border-b-neutral-900 dark:border-b-neutral-700" />
        </div>
      )}
    </div>
  );
};

export default TruncatedText;
