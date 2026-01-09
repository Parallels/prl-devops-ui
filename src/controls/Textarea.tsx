import classNames from 'classnames';
import {
  ForwardedRef,
  ReactNode,
  TextareaHTMLAttributes,
  forwardRef,
  useMemo,
} from 'react';
import type { ButtonColor } from './Button';

type TextareaSize = 'sm' | 'md' | 'lg';
type TextareaValidationStatus = 'none' | 'error' | 'success';
type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

const sizeTokens: Record<TextareaSize, { padding: string; text: string; minHeight: string }> = {
  sm: { padding: 'px-3 py-2', text: 'text-sm', minHeight: 'min-h-[6rem]' },
  md: { padding: 'px-3.5 py-2.5', text: 'text-sm', minHeight: 'min-h-[7rem]' },
  lg: { padding: 'px-4 py-3', text: 'text-base', minHeight: 'min-h-[8rem]' },
};

type ToneTokens = {
  focusRing: string;
  border: string;
  darkBorder: string;
  background: string;
  darkBackground: string;
};

const toneTokens: Record<ButtonColor, ToneTokens> = {
  indigo: {
    focusRing: 'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/60',
    border: 'border-neutral-300',
    darkBorder: 'dark:border-neutral-700',
    background: 'bg-white',
    darkBackground: 'dark:bg-neutral-900',
  },
  blue: {
    focusRing: 'focus:border-blue-400 focus:ring-2 focus:ring-blue-400/60',
    border: 'border-neutral-300',
    darkBorder: 'dark:border-neutral-700',
    background: 'bg-white',
    darkBackground: 'dark:bg-neutral-900',
  },
  emerald: {
    focusRing: 'focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/60',
    border: 'border-neutral-300',
    darkBorder: 'dark:border-neutral-700',
    background: 'bg-white',
    darkBackground: 'dark:bg-neutral-900',
  },
  amber: {
    focusRing: 'focus:border-amber-400 focus:ring-2 focus:ring-amber-400/60',
    border: 'border-neutral-300',
    darkBorder: 'dark:border-neutral-700',
    background: 'bg-white',
    darkBackground: 'dark:bg-neutral-900',
  },
  rose: {
    focusRing: 'focus:border-rose-400 focus:ring-2 focus:ring-rose-400/60',
    border: 'border-neutral-300',
    darkBorder: 'dark:border-neutral-700',
    background: 'bg-white',
    darkBackground: 'dark:bg-neutral-900',
  },
  slate: {
    focusRing: 'focus:border-slate-500 focus:ring-2 focus:ring-slate-500/60',
    border: 'border-neutral-300',
    darkBorder: 'dark:border-neutral-700',
    background: 'bg-white',
    darkBackground: 'dark:bg-neutral-900',
  },
  white: {
    focusRing: 'focus:border-slate-400 focus:ring-2 focus:ring-slate-400/60',
    border: 'border-neutral-300',
    darkBorder: 'dark:border-neutral-700',
    background: 'bg-white',
    darkBackground: 'dark:bg-neutral-900',
  },
  theme: {
    focusRing:
      'focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/60 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/60',
    border: 'border-neutral-300',
    darkBorder: 'dark:border-neutral-700',
    background: 'bg-white',
    darkBackground: 'dark:bg-neutral-900',
  },
};

const statusClasses: Record<Exclude<TextareaValidationStatus, 'none'>, string> = {
  error:
    'border-rose-500 focus:border-rose-500 focus:ring-rose-500/60 text-neutral-900 dark:border-rose-400 dark:focus:border-rose-400 dark:focus:ring-rose-400/60 dark:text-neutral-100',
  success:
    'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/60 text-neutral-900 dark:border-emerald-400 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/60 dark:text-neutral-100',
};

const disabledClasses =
  'disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 dark:disabled:border-neutral-700 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500';

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size' | 'color'> {
  size?: TextareaSize;
  tone?: ButtonColor;
  validationStatus?: TextareaValidationStatus;
  resize?: TextareaResize;
  helpText?: ReactNode;
}

const resizeClasses: Record<TextareaResize, string> = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    size = 'md',
    tone = 'blue',
    validationStatus = 'none',
    className,
    resize = 'vertical',
    disabled,
    ...rest
  },
  ref: ForwardedRef<HTMLTextAreaElement>
) {
  const sizeToken = sizeTokens[size] ?? sizeTokens.md;
  const tokens = toneTokens[tone] ?? toneTokens.theme;
  const resizeClass = resizeClasses[resize] ?? resizeClasses.vertical;

  const classes = useMemo(
    () =>
      classNames(
        'block w-full rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 shadow-sm focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500',
        sizeToken.padding,
        sizeToken.text,
        sizeToken.minHeight,
        tokens.border,
        tokens.darkBorder,
        tokens.background,
        tokens.darkBackground,
        tokens.focusRing,
        disabledClasses,
        resizeClass,
        validationStatus !== 'none' ? statusClasses[validationStatus] : null,
        className
      ),
    [
      className,
      resizeClass,
      sizeToken.minHeight,
      sizeToken.padding,
      sizeToken.text,
      tokens.background,
      tokens.border,
      tokens.darkBackground,
      tokens.darkBorder,
      tokens.focusRing,
      validationStatus,
    ]
  );

  return <textarea ref={ref} className={classes} disabled={disabled} {...rest} />;
});

Textarea.displayName = 'Textarea';

(Textarea as unknown as { __UI_INPUT?: boolean }).__UI_INPUT = true;

export default Textarea;
