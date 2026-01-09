import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import classNames from 'classnames';
import { StatusSpinner } from '../Controls';

type StatusIntent = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type PopoverAlign = 'left' | 'center' | 'right';
type SectionSize = 'sm' | 'md';
type SectionVariant = 'solid' | 'minimal';

const intentStyles: Record<
  StatusIntent,
  { indicator: string; badge: string; badgeText: string; text: string }
> = {
  neutral: {
    indicator: 'bg-neutral-400 dark:bg-neutral-400',
    badge: 'bg-white/70 border-neutral-300 text-neutral-700 dark:bg-white/5 dark:border-white/10',
    badgeText: 'text-neutral-700 dark:text-neutral-200',
    text: 'text-neutral-700 dark:text-neutral-100',
  },
  success: {
    indicator: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]',
    badge: 'bg-emerald-500/10 border-emerald-400/50',
    badgeText: 'text-emerald-600 dark:text-emerald-200',
    text: 'text-emerald-700 dark:text-emerald-100',
  },
  warning: {
    indicator: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.75)]',
    badge: 'bg-amber-500/10 border-amber-400/40',
    badgeText: 'text-amber-600 dark:text-amber-200',
    text: 'text-amber-700 dark:text-amber-100',
  },
  danger: {
    indicator: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.75)]',
    badge: 'bg-rose-500/10 border-rose-400/40',
    badgeText: 'text-rose-600 dark:text-rose-200',
    text: 'text-rose-700 dark:text-rose-100',
  },
  info: {
    indicator: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]',
    badge: 'bg-sky-500/10 border-sky-400/40',
    badgeText: 'text-sky-600 dark:text-sky-200',
    text: 'text-sky-700 dark:text-sky-100',
  },
};

const sizeTokens: Record<
  SectionSize,
  { padding: string; gap: string; label: string; value: string; indicator: string }
> = {
  sm: {
    padding: 'px-2.5 py-1.5',
    gap: 'gap-2',
    label: 'text-[9px]',
    value: 'text-[11px]',
    indicator: 'h-2 w-2',
  },
  md: {
    padding: 'px-3 py-2',
    gap: 'gap-3',
    label: 'text-[10px]',
    value: 'text-xs',
    indicator: 'h-2.5 w-2.5',
  },
};

const hoverToneClasses: Record<StatusIntent, { solid: string; minimal: string }> = {
  neutral: {
    solid:
      'hover:border-neutral-300 hover:bg-neutral-100/90 dark:hover:border-white/30 dark:hover:bg-white/10',
    minimal:
      'hover:bg-neutral-100/70 hover:text-neutral-800 dark:hover:bg-white/10 dark:hover:text-neutral-100',
  },
  success: {
    solid:
      'hover:border-emerald-300 hover:bg-emerald-50/80 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-500/10',
    minimal:
      'hover:bg-emerald-50/70 hover:text-emerald-700 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-100',
  },
  warning: {
    solid:
      'hover:border-amber-300 hover:bg-amber-50/80 dark:hover:border-amber-400/40 dark:hover:bg-amber-500/10',
    minimal:
      'hover:bg-amber-50/70 hover:text-amber-700 dark:hover:bg-amber-500/15 dark:hover:text-amber-100',
  },
  danger: {
    solid:
      'hover:border-rose-300 hover:bg-rose-50/80 dark:hover:border-rose-400/40 dark:hover:bg-rose-500/10',
    minimal:
      'hover:bg-rose-50/70 hover:text-rose-700 dark:hover:bg-rose-500/15 dark:hover:text-rose-100',
  },
  info: {
    solid:
      'hover:border-sky-300 hover:bg-sky-50/80 dark:hover:border-sky-400/40 dark:hover:bg-sky-500/10',
    minimal:
      'hover:bg-sky-50/70 hover:text-sky-700 dark:hover:bg-sky-500/15 dark:hover:text-sky-100',
  },
};

export interface StatusBarSectionProps {
  label: string;
  value?: ReactNode;
  description?: string;
  icon?: ReactNode;
  intent?: StatusIntent;
  size?: SectionSize;
  loading?: boolean;
  onClick?: () => void;
  popoverContent?: ReactNode;
  popoverTitle?: string;
  className?: string;
  showIndicator?: boolean;
  badge?: string;
  badgeIntent?: StatusIntent;
  disabled?: boolean;
  rounded?: boolean;
  variant?: SectionVariant;
}

export const StatusBarSection: React.FC<StatusBarSectionProps> = ({
  label,
  value,
  description,
  icon,
  intent = 'neutral',
  size = 'sm',
  loading = false,
  onClick,
  popoverContent,
  popoverTitle,
  className,
  showIndicator = true,
  badge,
  badgeIntent,
  disabled = false,
  rounded = true,
  variant = 'solid',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [alignment, setAlignment] = useState<PopoverAlign>('center');
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (panelRef.current?.contains(targetNode) || triggerRef.current?.contains(targetNode)) {
        return;
      }
      setIsOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const viewportWidth = window.innerWidth;
    const padding = 160; // approx half popover width
    if (rect.left < padding) {
      setAlignment('left');
    } else if (viewportWidth - rect.right < padding) {
      setAlignment('right');
    } else {
      setAlignment('center');
    }
  }, [isOpen]);

  const intentToken = intentStyles[intent];
  const badgeToken = intentStyles[badgeIntent ?? intent];
  const sizeToken = sizeTokens[size];
  const interactive = Boolean(onClick || popoverContent);
  const hoverTone = hoverToneClasses[intent][variant];

  const baseButtonClasses = classNames(
    'group relative inline-flex select-none items-center border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-sky-400/50 disabled:opacity-50 disabled:hover:bg-transparent select-none cursor-default',
    variant === 'solid'
      ? 'bg-white/70 text-neutral-700 border-neutral-200 dark:bg-white/5 dark:text-neutral-100 dark:border-white/10'
      : 'bg-transparent text-neutral-600 border-transparent dark:text-neutral-200',
    interactive && hoverTone,
    interactive && 'cursor-pointer',
    rounded ? 'rounded-2xl' : 'rounded-lg',
    sizeToken.padding,
    sizeToken.gap,
    className
  );

  const valueClasses = classNames(
    'flex items-center gap-1 font-medium',
    sizeToken.value,
    intentToken.text
  );

  const content = (
    <>
      {showIndicator &&
        (loading ? (
          <StatusSpinner size="xs" intent={intent} />
        ) : (
          <span
            className={classNames(
              'rounded-full transition-all duration-300',
              intentToken.indicator,
              sizeToken.indicator
            )}
          />
        ))}
      <div className="flex flex-col leading-tight">
        <span
          className={classNames(
            'font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400',
            sizeToken.label
          )}
        >
          {label}
        </span>
        <div className={valueClasses}>
          {!loading && (
            <>
              {icon}
              {typeof value === 'string' ? <span>{value}</span> : value}
            </>
          )}
          {badge && (
            <span
              className={classNames(
                'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                badgeToken.badge,
                badgeToken.badgeText
              )}
            >
              {badge}
            </span>
          )}
        </div>
        {description && (
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{description}</span>
        )}
      </div>
    </>
  );

  const renderPopover = () => {
    if (!isOpen) {
      return null;
    }

    const alignmentClasses =
      alignment === 'center'
        ? 'left-1/2 -translate-x-1/2'
        : alignment === 'left'
          ? 'left-0'
          : 'right-0';

    const arrowJustify =
      alignment === 'center'
        ? 'justify-center'
        : alignment === 'left'
          ? 'justify-start pl-5'
          : 'justify-end pr-5';

    return (
      <div
        ref={panelRef}
        className={classNames(
          'absolute bottom-[calc(100%+0.65rem)] z-[100] w-64 rounded-2xl border border-neutral-200 bg-white/95 p-4 text-left text-sm text-neutral-800 shadow-xl backdrop-blur dark:border-white/15 dark:bg-neutral-950/95 dark:text-neutral-100',
          alignmentClasses
        )}
      >
        <div className={classNames('absolute inset-x-0 top-full flex', arrowJustify)}>
          <span className="h-3 w-3 rotate-45 border border-neutral-200 bg-white/95 dark:border-white/10 dark:bg-neutral-950/95" />
        </div>
        {popoverTitle && (
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {popoverTitle}
          </div>
        )}
        <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-200">
          {popoverContent}
        </div>
      </div>
    );
  };

  if (popoverContent) {
    return (
      <div className={classNames('relative', !rounded && 'pl-[0.5px]')}>
        <button
          type="button"
          ref={triggerRef}
          className={classNames(
            baseButtonClasses,
            isOpen &&
              (variant === 'solid'
                ? 'border-neutral-300 bg-white dark:border-white/30 dark:bg-white/10'
                : 'bg-neutral-100/80 text-neutral-800 dark:bg-white/10 dark:text-neutral-50')
          )}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          disabled={disabled}
        >
          {content}
        </button>
        {renderPopover()}
      </div>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={baseButtonClasses} onClick={onClick} disabled={disabled}>
        {content}
      </button>
    );
  }

  return <div className={baseButtonClasses}>{content}</div>;
};

export const StatusBarDivider: React.FC = () => (
  <span className="h-5 w-px rounded-full bg-neutral-300/60 dark:bg-white/10" aria-hidden="true" />
);
