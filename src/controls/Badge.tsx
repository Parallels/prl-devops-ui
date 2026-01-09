import React from 'react';
import classNames from 'classnames';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

export interface BadgeProps {
  /**
   * Content to display inside the badge
   */
  count?: number;

  /**
   * Show only a dot indicator (no count)
   */
  dot?: boolean;

  /**
   * Max count to display before showing "+"
   * @default 99
   */
  maxCount?: number;

  /**
   * Badge color variant
   * @default "danger"
   */
  variant?: BadgeVariant;

  /**
   * Additional class names
   */
  className?: string;

  /**
   * Additional styles
   */
  style?: React.CSSProperties;
}

/**
 * Badge component for displaying notification counts or indicators
 */
export const Badge: React.FC<BadgeProps> = ({
  count,
  dot = false,
  maxCount = 99,
  variant = 'danger',
  className = '',
  style,
}) => {
  if (count === 0 && !dot) {
    return null;
  }

  const toneClasses: Record<BadgeVariant, string> = {
    primary: 'bg-blue-500 text-white dark:bg-blue-400',
    secondary: 'bg-slate-600 text-white dark:bg-slate-500',
    success: 'bg-emerald-500 text-white dark:bg-emerald-400',
    danger: 'bg-rose-500 text-white dark:bg-rose-400',
    warning: 'bg-amber-500 text-white dark:bg-amber-400',
    info: 'bg-sky-500 text-white dark:bg-sky-400',
  };

  let content: React.ReactNode;

  if (dot) {
    content = (
      <span
        className={classNames('h-2 w-2 rounded-full', toneClasses[variant])}
        aria-hidden="true"
      />
    );
  } else {
    const displayValue = count !== undefined ? (count > maxCount ? `${maxCount}+` : count) : '';
    content = displayValue;
  }

  const badgeClasses = classNames(
    'inline-flex items-center justify-center rounded-full text-[10px] font-semibold leading-4',
    'min-h-[1.125rem] min-w-[1.125rem] border border-white/80 dark:border-neutral-900/60',
    dot ? 'px-1 py-1 bg-transparent text-transparent' : 'px-1.5',
    !dot && toneClasses[variant],
    className
  );

  const badgeStyle = { ...style };

  if (dot) {
    return (
      <span className={badgeClasses} style={badgeStyle} aria-hidden="true">
        <span
          className={classNames('block h-2 w-2 rounded-full', toneClasses[variant])}
          aria-hidden="true"
        />
      </span>
    );
  }

  return (
    <span className={badgeClasses} style={badgeStyle} aria-hidden="true">
      {content}
    </span>
  );
};

export default Badge;
