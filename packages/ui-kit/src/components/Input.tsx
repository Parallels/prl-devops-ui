import classNames from 'classnames';
import React, { type ForwardedRef, type InputHTMLAttributes, forwardRef } from 'react';
import { useIconRenderer } from '../contexts/IconContext';
import type { ButtonColor } from './Button';
import { ThemeColor } from '@/theme';

type InputValidationStatus = 'none' | 'error' | 'success';
type InputSize = 'sm' | 'md' | 'lg';

const sizeStyles: Record<
  InputSize,
  {
    input: string;
    leadingPadding: string;
    trailingPadding: string;
    icon?: string | React.ElementType;
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

const toneTokens: Partial<Record<ThemeColor, InputToneTokens>> = {
  parallels: {
    focusRing: 'focus:border-rose-400 focus:ring-2 focus:ring-rose-400/60',
    icon: 'text-rose-500 dark:text-rose-300',
  },
  brand: {
    focusRing: 'focus:border-rose-400 focus:ring-2 focus:ring-rose-400/60',
    icon: 'text-rose-500 dark:text-rose-300',
  },
  theme: {
    focusRing: 'focus:border-rose-400 focus:ring-2 focus:ring-rose-400/60',
    icon: 'text-rose-500 dark:text-rose-300',
  },
  red: {
    focusRing: 'focus:border-rose-400 focus:ring-2 focus:ring-rose-400/60',
    icon: 'text-rose-500 dark:text-rose-300',
  },
  orange: {
    focusRing: 'focus:border-orange-400 focus:ring-2 focus:ring-orange-400/60',
    icon: 'text-orange-500 dark:text-orange-300',
  },
  amber: {
    focusRing: 'focus:border-amber-400 focus:ring-2 focus:ring-amber-400/60',
    icon: 'text-amber-500 dark:text-amber-300',
  },
  yellow: {
    focusRing: 'focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/60',
    icon: 'text-yellow-500 dark:text-yellow-300',
  },
  lime: {
    focusRing: 'focus:border-lime-400 focus:ring-2 focus:ring-lime-400/60',
    icon: 'text-lime-500 dark:text-lime-300',
  },
  green: {
    focusRing: 'focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/60',
    icon: 'text-emerald-500 dark:text-emerald-300',
  },
  emerald: {
    focusRing: 'focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/60',
    icon: 'text-emerald-500 dark:text-emerald-300',
  },
  teal: {
    focusRing: 'focus:border-teal-400 focus:ring-2 focus:ring-teal-400/60',
    icon: 'text-teal-500 dark:text-teal-300',
  },
  cyan: {
    focusRing: 'focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/60',
    icon: 'text-cyan-500 dark:text-cyan-300',
  },
  sky: {
    focusRing: 'focus:border-sky-400 focus:ring-2 focus:ring-sky-400/60',
    icon: 'text-sky-500 dark:text-sky-300',
  },
  blue: {
    focusRing: 'focus:border-blue-400 focus:ring-2 focus:ring-blue-400/60',
    icon: 'text-blue-500 dark:text-blue-300',
  },
  indigo: {
    focusRing: 'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/60',
    icon: 'text-indigo-500 dark:text-indigo-300',
  },
  violet: {
    focusRing: 'focus:border-violet-400 focus:ring-2 focus:ring-violet-400/60',
    icon: 'text-violet-500 dark:text-violet-300',
  },
  purple: {
    focusRing: 'focus:border-purple-400 focus:ring-2 focus:ring-purple-400/60',
    icon: 'text-purple-500 dark:text-purple-300',
  },
  fuchsia: {
    focusRing: 'focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/60',
    icon: 'text-fuchsia-500 dark:text-fuchsia-300',
  },
  pink: {
    focusRing: 'focus:border-pink-400 focus:ring-2 focus:ring-pink-400/60',
    icon: 'text-pink-500 dark:text-pink-300',
  },
  rose: {
    focusRing: 'focus:border-rose-400 focus:ring-2 focus:ring-rose-400/60',
    icon: 'text-rose-500 dark:text-rose-300',
  },
  slate: {
    focusRing: 'focus:border-slate-500 focus:ring-2 focus:ring-slate-500/60',
    icon: 'text-slate-500 dark:text-slate-200',
  },
  gray: {
    focusRing: 'focus:border-gray-400 focus:ring-2 focus:ring-gray-400/60',
    icon: 'text-gray-500 dark:text-gray-300',
  },
  zinc: {
    focusRing: 'focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/60',
    icon: 'text-zinc-500 dark:text-zinc-300',
  },
  neutral: {
    focusRing: 'focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/60 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/60',
    icon: 'text-neutral-500 dark:text-neutral-300',
  },
  stone: {
    focusRing: 'focus:border-stone-400 focus:ring-2 focus:ring-stone-400/60',
    icon: 'text-stone-500 dark:text-stone-300',
  },
  white: {
    focusRing: 'focus:border-slate-400 focus:ring-2 focus:ring-slate-400/60',
    icon: 'text-slate-400 dark:text-slate-200',
  },
  info: {
    focusRing: 'focus:border-sky-400 focus:ring-2 focus:ring-sky-400/60',
    icon: 'text-sky-500 dark:text-sky-300',
  },
  success: {
    focusRing: 'focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/60',
    icon: 'text-emerald-500 dark:text-emerald-300',
  },
  warning: {
    focusRing: 'focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/60',
    icon: 'text-yellow-500 dark:text-yellow-300',
  },
  danger: {
    focusRing: 'focus:border-rose-400 focus:ring-2 focus:ring-rose-400/60',
    icon: 'text-rose-500 dark:text-rose-300',
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

type IconRenderer = string | React.ReactElement;

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'color'> {
  size?: InputSize;
  tone?: ButtonColor;
  validationStatus?: InputValidationStatus;
  leadingIcon?: IconRenderer;
  trailingIcon?: IconRenderer;
  /** When provided, the trailing icon renders as an interactive button instead of a static decoration. */
  onTrailingIconClick?: React.MouseEventHandler<HTMLButtonElement>;
  wrapperClassName?: string;
  unstyled?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', tone = 'blue', validationStatus = 'none', leadingIcon, trailingIcon, onTrailingIconClick, className, wrapperClassName, disabled, unstyled = false, ...rest },
  ref: ForwardedRef<HTMLInputElement>,
) {
  const renderIcon = useIconRenderer();
  const sizeToken = sizeStyles[size] ?? sizeStyles.md;
  const tokens = (toneTokens[tone] ?? toneTokens.theme) as InputToneTokens;
  const hasLeadingIcon = Boolean(leadingIcon);
  const hasTrailingIcon = Boolean(trailingIcon);
  const isUnstyled = unstyled;

  const renderVisual = (visual: IconRenderer, iconClassName: string) => {
    if (!visual) {
      return null;
    }
    if (typeof visual === 'string') {
      return renderIcon(visual, undefined, iconClassName);
    }
    if (React.isValidElement<{ className?: string }>(visual)) {
      return React.cloneElement(visual, {
        className: classNames(iconClassName, visual.props.className),
      });
    }
    return <span className={iconClassName}>{visual}</span>;
  };

  const baseInputClasses = classNames(
    'block w-full text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500',
    sizeToken.input,
    !isUnstyled && 'rounded-lg border border-neutral-300 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900',
    disabledClasses,
    hasLeadingIcon && sizeToken.leadingPadding,
    hasTrailingIcon && sizeToken.trailingPadding,
    className,
  );

  const unstyledClasses = isUnstyled
    ? classNames(
        'border-0 bg-transparent focus:border-transparent focus:ring-0 dark:bg-transparent',
        sizeToken.input,
        hasLeadingIcon && sizeToken.leadingPadding,
        hasTrailingIcon && sizeToken.trailingPadding,
      )
    : '';

  const statusClass = validationStatus !== 'none' ? (isUnstyled ? unstyledStatusClasses[validationStatus] : statusClasses[validationStatus]) : undefined;

  const mergedInputClasses = classNames(isUnstyled ? unstyledClasses : baseInputClasses, !isUnstyled && tokens.focusRing);

  const renderIconWrapper = (visual: IconRenderer, position: 'left' | 'right', onClick?: React.MouseEventHandler<HTMLButtonElement>) => {
    if (!visual) {
      return null;
    }
    const positionClass = position === 'left' ? sizeToken.iconLeft : sizeToken.iconRight;
    if (onClick) {
      return (
        <button
          type="button"
          tabIndex={-1}
          onClick={onClick}
          className={classNames(
            'absolute flex items-center justify-center rounded',
            positionClass,
            sizeToken.iconSize,
            tokens.icon,
            validationStatus === 'error' && 'text-rose-500 dark:text-rose-400',
            validationStatus === 'success' && 'text-emerald-500 dark:text-emerald-400',
            'cursor-pointer p-0.5 transition-colors duration-150 hover:text-neutral-700 dark:hover:text-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-current',
          )}
        >
          {renderVisual(visual, sizeToken.iconSize)}
        </button>
      );
    }
    const iconClassName = classNames(
      'pointer-events-none absolute flex items-center justify-center text-neutral-400 dark:text-neutral-500',
      positionClass,
      sizeToken.iconSize,
      tokens.icon,
      validationStatus === 'error' && 'text-rose-500 dark:text-rose-400',
      validationStatus === 'success' && 'text-emerald-500 dark:text-emerald-400',
    );
    return <span className={iconClassName}>{renderVisual(visual, sizeToken.iconSize)}</span>;
  };

  return (
    <span className={classNames('relative flex w-full items-center', disabled && 'opacity-70', wrapperClassName)}>
      {leadingIcon && renderIconWrapper(leadingIcon, 'left')}
      <input ref={ref} className={classNames(mergedInputClasses, statusClass)} disabled={disabled} aria-invalid={validationStatus === 'error' ? 'true' : rest['aria-invalid']} {...rest} />
      {trailingIcon && renderIconWrapper(trailingIcon, 'right', onTrailingIconClick)}
    </span>
  );
});

Input.displayName = 'Input';

(Input as unknown as { __UI_INPUT?: boolean }).__UI_INPUT = true;

export type InputValidationStatusType = InputValidationStatus;

export default Input;
