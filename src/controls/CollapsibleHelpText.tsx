import React, { useMemo, useState } from 'react';
import classNames from 'classnames';
import Markdown from 'react-markdown';
import { CustomIcon } from './CustomIcon';
import type { IconName } from '@/types/Icon';
import type { ThemeColor } from './Theme';

export interface CollapsibleHelpTextProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  text: string;
  maxLength?: number;
  children?: React.ReactNode;
  showIcon?: boolean;
  icon?: IconName;
  tone?: ThemeColor;
  variant?: 'card' | 'plain';
}

const toneTokens: Record<
  ThemeColor,
  { border: string; accent: string; iconBg: string; text: string; focusRing: string; hover: string }
> = {
  blue: {
    border: 'border-blue-100 dark:border-blue-500/40',
    accent: 'text-blue-600 dark:text-blue-300',
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-200',
    focusRing: 'focus-visible:ring-blue-200 dark:focus-visible:ring-blue-500/40',
    hover: 'hover:bg-blue-50/60 dark:hover:bg-blue-500/5',
  },
  indigo: {
    border: 'border-indigo-100 dark:border-indigo-500/40',
    accent: 'text-indigo-600 dark:text-indigo-300',
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
    text: 'text-indigo-700 dark:text-indigo-200',
    focusRing: 'focus-visible:ring-indigo-200 dark:focus-visible:ring-indigo-500/40',
    hover: 'hover:bg-indigo-50/60 dark:hover:bg-indigo-500/5',
  },
  emerald: {
    border: 'border-emerald-100 dark:border-emerald-500/40',
    accent: 'text-emerald-600 dark:text-emerald-300',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-200',
    focusRing: 'focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-500/40',
    hover: 'hover:bg-emerald-50/60 dark:hover:bg-emerald-500/5',
  },
  amber: {
    border: 'border-amber-100 dark:border-amber-500/40',
    accent: 'text-amber-600 dark:text-amber-300',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-200',
    focusRing: 'focus-visible:ring-amber-200 dark:focus-visible:ring-amber-500/40',
    hover: 'hover:bg-amber-50/60 dark:hover:bg-amber-500/5',
  },
  rose: {
    border: 'border-rose-100 dark:border-rose-500/40',
    accent: 'text-rose-600 dark:text-rose-300',
    iconBg: 'bg-rose-50 dark:bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-200',
    focusRing: 'focus-visible:ring-rose-200 dark:focus-visible:ring-rose-500/40',
    hover: 'hover:bg-rose-50/60 dark:hover:bg-rose-500/5',
  },
  slate: {
    border: 'border-slate-200 dark:border-slate-700',
    accent: 'text-slate-600 dark:text-slate-300',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-200',
    focusRing: 'focus-visible:ring-slate-200 dark:focus-visible:ring-slate-600',
    hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/80',
  },
  white: {
    border: 'border-slate-200 dark:border-slate-700',
    accent: 'text-slate-600 dark:text-slate-300',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-200',
    focusRing: 'focus-visible:ring-slate-200 dark:focus-visible:ring-slate-600',
    hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/80',
  },
  theme: {
    border: 'border-slate-200 dark:border-slate-700',
    accent: 'text-slate-600 dark:text-slate-300',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-200',
    focusRing: 'focus-visible:ring-slate-200 dark:focus-visible:ring-slate-600',
    hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/80',
  },
};

const truncate = (value: string, limit: number) => {
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, limit).trim()}...`;
};

export const CollapsibleHelpText: React.FC<CollapsibleHelpTextProps> = ({
  title,
  text,
  maxLength = 160,
  showIcon = false,
  icon = 'Help',
  children,
  className,
  tone = 'blue',
  variant = 'card',
  ...rest
}) => {
  const sanitized = text?.trim() ?? '';
  const needsTruncation = sanitized.length > maxLength;
  const [expanded, setExpanded] = useState(false);

  const colorTokens = toneTokens[tone] ?? toneTokens.theme;
  const displayText = expanded || !needsTruncation ? sanitized : truncate(sanitized, maxLength);

  const markdownContent = useMemo(
    () => (
      <div className="prose prose-sm max-w-none text-slate-600 prose-p:my-1 prose-ul:my-1 dark:text-slate-200">
        <Markdown>{displayText}</Markdown>
      </div>
    ),
    [displayText]
  );

  const headerContent = (
    <>
      {showIcon && (
        <span
          className={classNames(
            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
            colorTokens.iconBg,
            colorTokens.accent
          )}
        >
          <CustomIcon icon={icon} size="sm" className="text-inherit" />
        </span>
      )}
      <div className="flex flex-1 flex-col gap-1 text-left">
        {title && (
          <p className={classNames('text-sm font-semibold', colorTokens.text)}>{title}</p>
        )}
        {markdownContent}
      </div>
      {needsTruncation && (
        <span
          className={classNames(
            'ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition dark:border-slate-700 dark:text-slate-200',
            colorTokens.accent
          )}
          aria-hidden="true"
        >
          <CustomIcon
            icon="ArrowDown"
            size="sm"
            className={classNames('transition-transform duration-200', expanded && 'rotate-180')}
          />
        </span>
      )}
    </>
  );

  const containerClasses = classNames(
    'w-full transition',
    variant === 'card'
      ? classNames('rounded-2xl border bg-white/90 p-4 shadow-sm dark:bg-slate-900/80', colorTokens.border)
      : 'rounded-xl border border-transparent bg-transparent p-0 shadow-none',
    className
  );

  const triggerClasses = classNames(
    'flex w-full items-start gap-3 rounded-2xl px-1 py-1 text-left transition',
    variant === 'plain' && 'rounded-xl px-0 py-0',
    colorTokens.hover,
    colorTokens.focusRing
  );

  return (
    <div className={containerClasses} {...rest}>
      {needsTruncation ? (
        <button
          type="button"
          className={triggerClasses}
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {headerContent}
        </button>
      ) : (
        <div className="flex items-start gap-3">{headerContent}</div>
      )}
      {children && <div className="mt-3 text-sm text-slate-500 dark:text-slate-300">{children}</div>}
    </div>
  );
};

export default CollapsibleHelpText;
