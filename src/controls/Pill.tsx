import React from 'react';
import classNames from 'classnames';

export type PillTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand';
export type PillVariant = 'solid' | 'soft' | 'outline';
export type PillSize = 'xs' | 'sm' | 'md' | 'lg';

const toneVariantStyles: Record<
  PillTone,
  Record<PillVariant, { base: string; border?: string }>
> = {
  neutral: {
    solid: { base: 'bg-neutral-800 text-white' },
    soft: { base: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-100' },
    outline: {
      base: 'text-neutral-700 dark:text-neutral-100',
      border: 'border border-neutral-300 dark:border-neutral-600',
    },
  },
  info: {
    solid: { base: 'bg-sky-500 text-white' },
    soft: { base: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200' },
    outline: {
      base: 'text-sky-600 dark:text-sky-300',
      border: 'border border-sky-200 dark:border-sky-500/40',
    },
  },
  success: {
    solid: { base: 'bg-emerald-500 text-white' },
    soft: { base: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-100' },
    outline: {
      base: 'text-emerald-600 dark:text-emerald-200',
      border: 'border border-emerald-200 dark:border-emerald-500/40',
    },
  },
  warning: {
    solid: { base: 'bg-amber-500 text-neutral-900' },
    soft: { base: 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100' },
    outline: {
      base: 'text-amber-600 dark:text-amber-200',
      border: 'border border-amber-200 dark:border-amber-500/40',
    },
  },
  danger: {
    solid: { base: 'bg-rose-500 text-white' },
    soft: { base: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-100' },
    outline: {
      base: 'text-rose-600 dark:text-rose-200',
      border: 'border border-rose-200 dark:border-rose-500/50',
    },
  },
  brand: {
    solid: { base: 'bg-blue-500 text-white' },
    soft: { base: 'bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-100' },
    outline: {
      base: 'text-blue-600 dark:text-blue-200',
      border: 'border border-blue-200 dark:border-blue-500/40',
    },
  },
};

const sizeStyles: Record<PillSize, string> = {
  xs: 'text-[11px] h-4 px-2',
  sm: 'text-[12px] h-5 px-2.5',
  md: 'text-xs h-6 px-3',
  lg: 'text-sm h-7 px-4',
};

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  variant?: PillVariant;
  size?: PillSize;
  uppercase?: boolean;
  icon?: React.ReactNode;
  dot?: boolean;
}

export const Pill: React.FC<PillProps> = ({
  tone = 'info',
  variant = 'soft',
  size = 'md',
  uppercase = false,
  icon,
  dot = false,
  className,
  children,
  ...rest
}) => {
  const toneTokens = toneVariantStyles[tone][variant];
  const sizeToken = sizeStyles[size];

  const pillClasses = classNames(
    'inline-flex items-center justify-center rounded-full  leading-none',
    sizeToken,
    toneTokens.base,
    toneTokens.border,
    uppercase && 'uppercase tracking-wide',
    dot && 'px-0 h-2 w-2 min-w-[0.5rem]',
    dot && 'rounded-full',
    className
  );

  return (
    <span className={pillClasses} {...rest}>
      {icon && !dot ? <span className="mr-1.5 flex items-center text-inherit">{icon}</span> : null}
      {!dot ? children : null}
    </span>
  );
};

export default Pill;
