import React from 'react';
import { HelpButton, HelpButtonProps } from '@prl/ui-kit';

// ── Icon color tokens ────────────────────────────────────────────────────────

const iconColorMap = {
  rose: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
  amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
  sky: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
  violet: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
  neutral: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
  parallels: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
  red: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
  blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  green: 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
  cyan: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400',
  orange: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
} as const;

// ── PageHeaderIcon helper ────────────────────────────────────────────────────

export interface PageHeaderIconProps {
  children: React.ReactNode;
  color?: keyof typeof iconColorMap | (string & {});
}

export const PageHeaderIcon: React.FC<PageHeaderIconProps> = ({ children, color = 'neutral' }) => (
  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${iconColorMap[color as keyof typeof iconColorMap] ?? iconColorMap.neutral}`}>{children}</div>
);

// ── PageHeader ───────────────────────────────────────────────────────────────

export interface PageHeaderProps {
  /** Full icon node — use PageHeaderIcon helper or UserAvatar */
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Right side of identity row (small icon-buttons, status indicators, refresh) */
  actions?: React.ReactNode;
  /** Second row, right-aligned (primary buttons: Save, New, Disable, Remove…) */
  bottomActions?: React.ReactNode;
  /** Optional search bar inserted between identity and actions */
  search?: React.ReactNode;
  searchWidth?: string;
  /** Bottom separator — default true */
  border?: boolean;
  className?: string;
  /** Optional help button inserted between identity and actions */
  helper?: HelpButtonProps;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ icon, title, subtitle, actions, bottomActions, search, searchWidth, border = true, className = '', helper }) => {
  const borderClass = border ? 'border-b border-neutral-200 dark:border-neutral-700' : '';

  return (
    <div className={`flex-none ${borderClass} ${className}`}>
      {/* Row 1: identity + optional search + optional actions */}
      <div className="flex items-center gap-3 px-4 py-3">
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="flex-1 min-w-0">
          <h2 className="flex items-center gap-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
            <span>{title}</span>
            {helper && <HelpButton {...helper} />}
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 truncate">{subtitle}</p>}
        </div>
        {search && <div className={`shrink-0 ${searchWidth}`}>{search}</div>}
        {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
      </div>

      {/* Row 2: bottom actions (only when provided) */}
      {bottomActions && <div className="flex items-center justify-end gap-2 px-4 pb-3">{bottomActions}</div>}
    </div>
  );
};
