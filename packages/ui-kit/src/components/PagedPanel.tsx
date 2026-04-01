import React, { useState } from 'react';
import classNames from 'classnames';
import Panel, { PanelProps } from './Panel';
import { CustomIcon } from './CustomIcon';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PagedPanelProps extends PanelProps {
  /** One entry per page — rendered one at a time. */
  pages: React.ReactNode[];
  /**
   * Static title shown in the header, OR an array of per-page titles.
   * When an array is supplied its length should match `pages`.
   */
  title?: React.ReactNode | React.ReactNode[];
  /** Optional subtitle shown below the title (static). */
  subtitle?: React.ReactNode;
  /** Show a loading overlay over the whole panel. */
  error?: string | null;
  /**
   * When true, renders without the Panel wrapper (no border, background or
   * shadow). Use this when embedding PagedPanel inside an existing Panel.
   */
  bare?: boolean;
}

// ── Nav button ───────────────────────────────────────────────────────────────

const NavBtn: React.FC<{
  direction: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}> = ({ direction, disabled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={direction === 'left' ? 'Previous page' : 'Next page'}
    className={classNames(
      'flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-150',
      'text-neutral-400 dark:text-neutral-500',
      'hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200',
      'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-neutral-400 dark:disabled:hover:text-neutral-500',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
    )}
  >
    <CustomIcon icon={direction === 'left' ? 'ArrowChevronLeft' : 'ArrowChevronRight'} size="sm" />
  </button>
);

// ── Component ────────────────────────────────────────────────────────────────

const PagedPanel: React.FC<PagedPanelProps> = ({
  pages,
  title,
  subtitle,
  error,
  bare = false,
  ...rest
}) => {
  const [current, setCurrent] = useState(0);
  const total = pages.length;
  const showNav = total > 1;

  // Guard: if pages shrinks (e.g. after a data reload) clamp to last valid page
  const safeCurrent = total > 0 ? Math.min(current, total - 1) : 0;
  if (safeCurrent !== current) setCurrent(safeCurrent);

  // Resolve the title for the current page
  const resolvedTitle = Array.isArray(title) ? title[safeCurrent] : title;
  const showHeader = resolvedTitle != null || subtitle != null || showNav;

  const header = showHeader && (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
      {/* Left nav slot — always same width so title stays centred */}
      <div className="shrink-0 w-7">
        {showNav && (
          <NavBtn
            direction="left"
            disabled={current === 0}
            onClick={() => setCurrent((p) => Math.max(0, p - 1))}
          />
        )}
      </div>

      {/* Centre: title + subtitle + page indicator */}
      <div className="flex-1 text-center min-w-0">
        {resolvedTitle != null && (
          <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 leading-snug truncate">
            {resolvedTitle}
          </div>
        )}
        {subtitle != null && (
          <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">
            {subtitle}
          </div>
        )}
        {showNav && (
          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 tabular-nums">
            {safeCurrent + 1} / {total}
          </div>
        )}
      </div>

      {/* Right nav slot */}
      <div className="shrink-0 w-7">
        {showNav && (
          <NavBtn
            direction="right"
            disabled={current === total - 1}
            onClick={() => setCurrent((p) => Math.min(total - 1, p + 1))}
          />
        )}
      </div>
    </div>
  );

  const content = (
    <div className="h-full w-full p-4 flex items-center justify-center">
      {error ? (
        <p className="text-sm text-rose-500 dark:text-rose-400">{error}</p>
      ) : total === 0 && !rest.loading ? (
        <p className="text-sm text-neutral-400 dark:text-neutral-500">No data available.</p>
      ) : (
        pages[safeCurrent]
      )}
    </div>
  );

  if (bare) {
    return (
      <div className={classNames('relative overflow-hidden', rest.className)}>
        {header}
        {content}
      </div>
    );
  }

  return (
    <Panel
      {...rest}
      bodyClassName={total === 0 && !rest.loading ? 'h-full' : ''}
      className={classNames('relative overflow-hidden', rest.className)}
    >
      {header}
      {content}
    </Panel>
  );
};

export default PagedPanel;
