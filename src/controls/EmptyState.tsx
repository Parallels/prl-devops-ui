import classNames from 'classnames';
import React from 'react';
import Button, { type ButtonVariant, type ButtonSize } from './Button';
import type { ButtonColor } from './Button';
import type { IconName, IconSize } from '@/types/Icon';
import { renderIcon } from '@/utils/icon';

export type EmptyStateTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const toneClasses: Record<
  EmptyStateTone,
  { border: string; text: string; bg: string; icon: string }
> = {
  neutral: {
    border: 'border-slate-300/70 dark:border-slate-700/60',
    text: 'text-slate-600 dark:text-slate-300',
    bg: 'bg-white/80 dark:bg-slate-900/40',
    icon: 'text-slate-400 dark:text-slate-500',
  },
  info: {
    border: 'border-blue-300/60 dark:border-blue-500/40',
    text: 'text-blue-700 dark:text-blue-200',
    bg: 'bg-blue-50/60 dark:bg-blue-950/20',
    icon: 'text-blue-500 dark:text-blue-300',
  },
  success: {
    border: 'border-emerald-300/60 dark:border-emerald-500/40',
    text: 'text-emerald-700 dark:text-emerald-200',
    bg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    icon: 'text-emerald-500 dark:text-emerald-300',
  },
  warning: {
    border: 'border-amber-300/60 dark:border-amber-500/40',
    text: 'text-amber-700 dark:text-amber-200',
    bg: 'bg-amber-50/60 dark:bg-amber-950/20',
    icon: 'text-amber-500 dark:text-amber-300',
  },
  danger: {
    border: 'border-rose-300/60 dark:border-rose-500/40',
    text: 'text-rose-700 dark:text-rose-200',
    bg: 'bg-rose-50/60 dark:bg-rose-950/20',
    icon: 'text-rose-500 dark:text-rose-300',
  },
};

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  buttonText?: string;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
  actionColor?: ButtonColor;
  icon?: IconName | React.ReactElement;
  iconSize?: IconSize;
  showIcon?: boolean;
  tone?: EmptyStateTone;
  fullWidth?: boolean;
  actionSize?: ButtonSize;
  actionLeadingIcon?: IconName | React.ReactElement;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  buttonText,
  onAction,
  actionVariant = 'soft',
  actionColor = 'blue',
  icon = 'Plus',
  iconSize = 'xl',
  showIcon = true,
  tone = 'neutral',
  fullWidth = false,
  actionSize = 'sm',
  actionLeadingIcon,
  className,
  ...rest
}) => {
  const palette = toneClasses[tone] ?? toneClasses.neutral;

  return (
    <section
      className={classNames(
        'flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-6 py-10 text-center shadow-sm transition',
        palette.border,
        palette.bg,
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {showIcon && (
        <div className={classNames('p-2 text-4xl dark:bg-white/5', palette.icon)}>
          {React.isValidElement(icon)
            ? icon
            : renderIcon(icon, iconSize, 'h-12 w-12')}
        </div>
      )}
      <div className="space-y-2">
        <p className={classNames('text-lg font-semibold', palette.text)}>{title}</p>
        {subtitle && (
          <p className={classNames('text-sm leading-relaxed', palette.text)}>{subtitle}</p>
        )}
      </div>
      {buttonText && onAction && (
        <Button
          size={actionSize}
          variant={actionVariant}
          color={actionColor}
          onClick={onAction}
          leadingIcon={actionLeadingIcon}
        >
          {buttonText}
        </Button>
      )}
    </section>
  );
};

export default EmptyState;
