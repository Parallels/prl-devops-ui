import React from 'react';
import classNames from 'classnames';
import { IconName } from '@/types/Icon';
import { renderIcon } from '@/utils/icon';

export type AlertTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type AlertVariant = 'subtle' | 'solid' | 'outline';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
  variant?: AlertVariant;
  title?: string;
  description?: string;
  icon?: IconName | React.ReactElement | false;
  actions?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const toneTokens: Record<
  AlertTone,
  {
    subtle: string;
    solid: string;
    outline: string;
    icon: string;
    text: string;
    border: string;
    dismiss: string;
  }
> = {
  neutral: {
    subtle: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-100',
    solid: 'bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-800',
    outline: 'bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100',
    icon: 'text-neutral-500 dark:text-neutral-300',
    text: 'text-neutral-700 dark:text-neutral-200',
    border: 'border-neutral-200 dark:border-neutral-700',
    dismiss: 'hover:text-neutral-900 dark:hover:text-white',
  },
  info: {
    subtle: 'bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100',
    solid: 'bg-sky-600 text-white dark:bg-sky-500 dark:text-white',
    outline: 'bg-white text-sky-700 dark:bg-sky-900/60 dark:text-sky-100',
    icon: 'text-sky-500 dark:text-sky-300',
    text: 'text-sky-700 dark:text-sky-100',
    border: 'border-sky-200 dark:border-sky-700',
    dismiss: 'hover:text-sky-700 dark:hover:text-sky-100',
  },
  success: {
    subtle: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100',
    solid: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white',
    outline: 'bg-white text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-100',
    icon: 'text-emerald-500 dark:text-emerald-300',
    text: 'text-emerald-700 dark:text-emerald-100',
    border: 'border-emerald-200 dark:border-emerald-700',
    dismiss: 'hover:text-emerald-700 dark:hover:text-emerald-100',
  },
  warning: {
    subtle: 'bg-amber-50 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
    solid: 'bg-amber-500 text-slate-900 dark:bg-amber-400 dark:text-slate-900',
    outline: 'bg-white text-amber-800 dark:bg-amber-900/60 dark:text-amber-100',
    icon: 'text-amber-500 dark:text-amber-300',
    text: 'text-amber-800 dark:text-amber-100',
    border: 'border-amber-200 dark:border-amber-700',
    dismiss: 'hover:text-amber-700 dark:hover:text-amber-100',
  },
  danger: {
    subtle: 'bg-rose-50 text-rose-800 dark:bg-rose-900/40 dark:text-rose-100',
    solid: 'bg-rose-600 text-white dark:bg-rose-500 dark:text-white',
    outline: 'bg-white text-rose-700 dark:bg-rose-900/60 dark:text-rose-100',
    icon: 'text-rose-500 dark:text-rose-300',
    text: 'text-rose-700 dark:text-rose-100',
    border: 'border-rose-200 dark:border-rose-700',
    dismiss: 'hover:text-rose-700 dark:hover:text-rose-100',
  },
};

const defaultIcons: Record<AlertTone, IconName> = {
  neutral: 'Info',
  info: 'Info',
  success: 'CheckCircle',
  warning: 'Chat',
  danger: 'Error',
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      tone = 'neutral',
      variant = 'subtle',
      title,
      description,
      icon,
      actions,
      dismissible = false,
      onDismiss,
      className,
      ...rest
    },
    ref
  ) => {
    const tokens = toneTokens[tone];
    const base = classNames(
      'relative flex w-full gap-3 rounded-2xl border px-4 py-3 shadow-sm transition',
      variant === 'subtle' && tokens.subtle,
      variant === 'solid' && tokens.solid,
      variant === 'outline' && [tokens.outline, tokens.border],
      className
    );

    const resolvedIcon = icon === false ? null : (icon ?? defaultIcons[tone]);

    return (
      <div ref={ref} className={base} role="alert" {...rest}>
        {resolvedIcon && (
          <div className={classNames('flex-shrink-0 pt-1', tokens.icon)}>
            {renderIcon(resolvedIcon, 'md')}
          </div>
        )}
        <div className="flex flex-1 flex-col gap-1 text-sm">
          {title && <div className="text-sm font-semibold leading-tight text-current">{title}</div>}
          {description && (
            <div className={classNames('leading-relaxed', tokens.text)}>{description}</div>
          )}
          {actions && <div className="pt-2 text-sm">{actions}</div>}
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className={classNames(
              'ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              tokens.dismiss
            )}
            aria-label="Dismiss alert"
          >
            {renderIcon('Close', 'sm')}
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;
