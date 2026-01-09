import classNames from 'classnames';
import React, { ForwardedRef, InputHTMLAttributes, forwardRef } from 'react';
import { IconName } from '@/types/Icon';
import { CustomIcon } from './CustomIcon';
import type { ButtonColor } from './Button';

type InputValidationStatus = 'none' | 'error' | 'success';
type InputSize = 'sm' | 'md' | 'lg';

const sizeStyles: Record<
  InputSize,
  {
    input: string;
    leadingPadding: string;
    trailingPadding: string;
    icon?: IconName | React.ElementType;
    iconLeft: string;
    iconRight: string;
    iconSize: string;
  }
> = {
  sm: {
    input: 'px-3 py-1.5 text-sm',
    leadingPadding: 'pl-9',
    trailingPadding: 'pr-9',
    iconSize: '',
    iconLeft: 'left-3',
    iconRight: 'right-3',
  },
  md: {
    input: 'px-3.5 py-2.5 text-sm',
    leadingPadding: 'pl-10',
    trailingPadding: 'pr-10',
    iconSize: '',
    iconLeft: 'left-3.5',
    iconRight: 'right-3.5',
  },
  lg: {
    input: 'px-4 py-3 text-base',
    leadingPadding: 'pl-11',
    trailingPadding: 'pr-11',
    iconSize: '',
    iconLeft: 'left-4',
    iconRight: 'right-4',
  },
};

type InputToneTokens = {
  focusRing: string;
  icon: string;
};

const toneTokens: Record<ButtonColor, InputToneTokens> = {
  indigo: {
    focusRing: 'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/60',
    icon: 'text-indigo-500 dark:text-indigo-300',
  },
  blue: {
    focusRing: 'focus:border-blue-400 focus:ring-2 focus:ring-blue-400/60',
    icon: 'text-blue-500 dark:text-blue-300',
  },
  emerald: {
    focusRing: 'focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/60',
    icon: 'text-emerald-500 dark:text-emerald-300',
  },
  amber: {
    focusRing: 'focus:border-amber-400 focus:ring-2 focus:ring-amber-400/60',
    icon: 'text-amber-500 dark:text-amber-300',
  },
  rose: {
    focusRing: 'focus:border-rose-400 focus:ring-2 focus:ring-rose-400/60',
    icon: 'text-rose-500 dark:text-rose-300',
  },
  slate: {
    focusRing: 'focus:border-slate-500 focus:ring-2 focus:ring-slate-500/60',
    icon: 'text-slate-500 dark:text-slate-200',
  },
  white: {
    focusRing: 'focus:border-slate-400 focus:ring-2 focus:ring-slate-400/60',
    icon: 'text-slate-400 dark:text-slate-200',
  },
  theme: {
    focusRing:
      'focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/60 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/60',
    icon: 'text-neutral-500 dark:text-neutral-300',
  },
};

const statusClasses: Record<Exclude<InputValidationStatus, 'none'>, string> = {
  error:
    'border-rose-500 focus:border-rose-500 focus:ring-rose-500/60 text-neutral-900 placeholder:text-neutral-400 dark:border-rose-400 dark:focus:border-rose-400 dark:focus:ring-rose-400/60 dark:text-neutral-100',
  success:
    'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/60 text-neutral-900 placeholder:text-neutral-400 dark:border-emerald-400 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/60 dark:text-neutral-100',
};

const unstyledStatusClasses: Record<Exclude<InputValidationStatus, 'none'>, string> = {
  error: 'text-neutral-900 dark:text-neutral-100',
  success: 'text-neutral-900 dark:text-neutral-100',
};

const disabledClasses =
  'disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 dark:disabled:border-neutral-700 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500';

type IconRenderer = IconName | React.ReactElement;

const renderVisual = (visual: IconRenderer, className: string) => {
  if (!visual) {
    return null;
  }
  if (typeof visual === 'string') {
    return <CustomIcon icon={visual} className={className} />;
  }
  if (React.isValidElement<{ className?: string }>(visual)) {
    return React.cloneElement(visual, {
      className: classNames(className, visual.props.className),
    });
  }
  return <span className={className}>{visual}</span>;
};

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'color'> {
  size?: InputSize;
  tone?: ButtonColor;
  validationStatus?: InputValidationStatus;
  leadingIcon?: IconRenderer;
  trailingIcon?: IconRenderer;
  wrapperClassName?: string;
  unstyled?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = 'md',
    tone = 'blue',
    validationStatus = 'none',
    leadingIcon,
    trailingIcon,
    className,
    wrapperClassName,
    disabled,
    unstyled = false,
    ...rest
  },
  ref: ForwardedRef<HTMLInputElement>
) {
  const sizeToken = sizeStyles[size] ?? sizeStyles.md;
  const tokens = toneTokens[tone] ?? toneTokens.theme;
  const hasLeadingIcon = Boolean(leadingIcon);
  const hasTrailingIcon = Boolean(trailingIcon);
  const isUnstyled = unstyled;

  const baseInputClasses = classNames(
    'block w-full text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500',
    sizeToken.input,
    !isUnstyled &&
    'rounded-lg border border-neutral-300 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900',
    disabledClasses,
    hasLeadingIcon && sizeToken.leadingPadding,
    hasTrailingIcon && sizeToken.trailingPadding,
    className
  );

  const unstyledClasses = isUnstyled
    ? classNames(
      'border-0 bg-transparent focus:border-transparent focus:ring-0 dark:bg-transparent',
      sizeToken.input,
      hasLeadingIcon && sizeToken.leadingPadding,
      hasTrailingIcon && sizeToken.trailingPadding
    )
    : '';

  const statusClass =
    validationStatus !== 'none'
      ? isUnstyled
        ? unstyledStatusClasses[validationStatus]
        : statusClasses[validationStatus]
      : undefined;

  const mergedInputClasses = classNames(
    isUnstyled ? unstyledClasses : baseInputClasses,
    !isUnstyled && tokens.focusRing
  );

  const renderIconWrapper = (
    visual: IconRenderer,
    position: 'left' | 'right',
    isInteractive = false
  ) => {
    if (!visual) {
      return null;
    }
    const iconClassName = classNames(
      'pointer-events-none absolute flex items-center justify-center text-neutral-400 dark:text-neutral-500',
      position === 'left' ? sizeToken.iconLeft : sizeToken.iconRight,
      sizeToken.iconSize,
      tokens.icon,
      validationStatus === 'error' && 'text-rose-500 dark:text-rose-400',
      validationStatus === 'success' && 'text-emerald-500 dark:text-emerald-400',
      isInteractive && 'pointer-events-auto'
    );
    return <span className={iconClassName}>{renderVisual(visual, sizeToken.iconSize)}</span>;
  };

  return (
    <span
      className={classNames(
        'relative flex w-full items-center',
        disabled && 'opacity-70',
        wrapperClassName
      )}
    >
      {leadingIcon && renderIconWrapper(leadingIcon, 'left')}
      <input
        ref={ref}
        className={classNames(mergedInputClasses, statusClass)}
        disabled={disabled}
        aria-invalid={validationStatus === 'error' ? 'true' : rest['aria-invalid']}
        {...rest}
      />
      {trailingIcon && renderIconWrapper(trailingIcon, 'right')}
    </span>
  );
});

Input.displayName = 'Input';

(Input as unknown as { __UI_INPUT?: boolean }).__UI_INPUT = true;

export type InputValidationStatusType = InputValidationStatus;

export default Input;
