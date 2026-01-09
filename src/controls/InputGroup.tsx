import classNames from 'classnames';
import React, { ReactElement, ReactNode, isValidElement } from 'react';
import type { ButtonColor } from './Button';

type InputGroupSize = 'sm' | 'md' | 'lg';
type InputGroupValidationStatus = 'none' | 'error' | 'success';

const sizeTokens: Record<
  InputGroupSize,
  {
    text: string;
    padding: string;
  }
> = {
  sm: {
    text: 'text-sm',
    padding: 'px-3',
  },
  md: {
    text: 'text-sm',
    padding: 'px-3.5',
  },
  lg: {
    text: 'text-base',
    padding: 'px-4',
  },
};

type ToneTokens = {
  focusRing: string;
  ring: string;
  background: string;
  addonBackground: string;
  addonBorder: string;
  addonText: string;
  darkBackground: string;
  darkRing: string;
  darkAddonBackground: string;
  darkAddonBorder: string;
  darkAddonText: string;
};

const toneTokens: Record<ButtonColor, ToneTokens> = {
  indigo: {
    focusRing: 'focus-within:ring-indigo-400',
    ring: 'ring-indigo-200/70',
    background: 'bg-white',
    addonBackground: 'bg-indigo-50/80',
    addonBorder: 'border-indigo-200',
    addonText: 'text-indigo-600',
    darkBackground: 'dark:bg-neutral-900',
    darkRing: 'dark:ring-indigo-500/30',
    darkAddonBackground: 'dark:bg-indigo-500/15',
    darkAddonBorder: 'dark:border-indigo-500/40',
    darkAddonText: 'dark:text-indigo-200',
  },
  blue: {
    focusRing: 'focus-within:ring-blue-400',
    ring: 'ring-blue-200/70',
    background: 'bg-white',
    addonBackground: 'bg-blue-50/80',
    addonBorder: 'border-blue-200',
    addonText: 'text-blue-600',
    darkBackground: 'dark:bg-neutral-900',
    darkRing: 'dark:ring-blue-500/30',
    darkAddonBackground: 'dark:bg-blue-500/15',
    darkAddonBorder: 'dark:border-blue-500/40',
    darkAddonText: 'dark:text-blue-200',
  },
  emerald: {
    focusRing: 'focus-within:ring-emerald-400',
    ring: 'ring-emerald-200/70',
    background: 'bg-white',
    addonBackground: 'bg-emerald-50/80',
    addonBorder: 'border-emerald-200',
    addonText: 'text-emerald-600',
    darkBackground: 'dark:bg-neutral-900',
    darkRing: 'dark:ring-emerald-500/30',
    darkAddonBackground: 'dark:bg-emerald-500/15',
    darkAddonBorder: 'dark:border-emerald-500/40',
    darkAddonText: 'dark:text-emerald-200',
  },
  amber: {
    focusRing: 'focus-within:ring-amber-400',
    ring: 'ring-amber-200/70',
    background: 'bg-white',
    addonBackground: 'bg-amber-50/80',
    addonBorder: 'border-amber-200',
    addonText: 'text-amber-600',
    darkBackground: 'dark:bg-neutral-900',
    darkRing: 'dark:ring-amber-400/30',
    darkAddonBackground: 'dark:bg-amber-500/20',
    darkAddonBorder: 'dark:border-amber-500/40',
    darkAddonText: 'dark:text-amber-200',
  },
  rose: {
    focusRing: 'focus-within:ring-rose-400',
    ring: 'ring-rose-200/70',
    background: 'bg-white',
    addonBackground: 'bg-rose-50/80',
    addonBorder: 'border-rose-200',
    addonText: 'text-rose-600',
    darkBackground: 'dark:bg-neutral-900',
    darkRing: 'dark:ring-rose-500/30',
    darkAddonBackground: 'dark:bg-rose-500/15',
    darkAddonBorder: 'dark:border-rose-500/40',
    darkAddonText: 'dark:text-rose-200',
  },
  slate: {
    focusRing: 'focus-within:ring-slate-500',
    ring: 'ring-slate-200/70',
    background: 'bg-white',
    addonBackground: 'bg-slate-100',
    addonBorder: 'border-slate-200',
    addonText: 'text-slate-700',
    darkBackground: 'dark:bg-neutral-900',
    darkRing: 'dark:ring-slate-500/40',
    darkAddonBackground: 'dark:bg-slate-800/70',
    darkAddonBorder: 'dark:border-slate-700',
    darkAddonText: 'dark:text-slate-200',
  },
  white: {
    focusRing: 'focus-within:ring-slate-400',
    ring: 'ring-slate-200/70',
    background: 'bg-white',
    addonBackground: 'bg-slate-100',
    addonBorder: 'border-slate-200',
    addonText: 'text-slate-700',
    darkBackground: 'dark:bg-neutral-900',
    darkRing: 'dark:ring-slate-500/40',
    darkAddonBackground: 'dark:bg-slate-800/70',
    darkAddonBorder: 'dark:border-slate-700',
    darkAddonText: 'dark:text-slate-200',
  },
  theme: {
    focusRing:
      'focus-within:ring-neutral-400 dark:focus-within:ring-neutral-500 focus-within:ring-2',
    ring: 'ring-neutral-200/80',
    background: 'bg-white',
    addonBackground: 'bg-neutral-50',
    addonBorder: 'border-neutral-200',
    addonText: 'text-neutral-600',
    darkBackground: 'dark:bg-neutral-900',
    darkRing: 'dark:ring-neutral-700',
    darkAddonBackground: 'dark:bg-neutral-800/70',
    darkAddonBorder: 'dark:border-neutral-700',
    darkAddonText: 'dark:text-neutral-200',
  },
};

const statusRing: Record<Exclude<InputGroupValidationStatus, 'none'>, string> = {
  error:
    'focus-within:ring-rose-500 ring-rose-400/70 dark:ring-rose-400/40 dark:focus-within:ring-rose-400',
  success:
    'focus-within:ring-emerald-500 ring-emerald-400/70 dark:ring-emerald-400/40 dark:focus-within:ring-emerald-400',
};

const isAttachableChild = (child: ReactNode) => {
  if (!isValidElement(child)) {
    return false;
  }
  const type = child.type as { __UI_INPUT?: boolean; __UI_SELECT?: boolean };
  return Boolean(type && (type.__UI_INPUT || type.__UI_SELECT));
};

const attachChildProps = (
  child: ReactNode,
  tone: ButtonColor,
  size: InputGroupSize
): ReactNode => {
  if (!isValidElement(child) || !isAttachableChild(child)) {
    return child;
  }

  const props: Record<string, unknown> = {
    tone,
    size,
    unstyled: true,
  };

  return React.cloneElement(child as ReactElement, props);
};

export interface InputGroupProps {
  leadingAddon?: ReactNode;
  trailingAddon?: ReactNode;
  children: ReactNode;
  tone?: ButtonColor;
  size?: InputGroupSize;
  className?: string;
  validationStatus?: InputGroupValidationStatus;
  disabled?: boolean;
}

const addonBaseClasses =
  'inline-flex min-w-0 items-center whitespace-nowrap border border-transparent text-sm font-medium';

const InputGroup: React.FC<InputGroupProps> = ({
  leadingAddon,
  trailingAddon,
  children,
  tone = 'blue',
  size = 'md',
  className,
  validationStatus = 'none',
  disabled = false,
}) => {
  const toneToken = toneTokens[tone] ?? toneTokens.theme;
  const sizeToken = sizeTokens[size] ?? sizeTokens.md;

  const ringClasses =
    validationStatus === 'none'
      ? classNames(
        'ring-1 ring-inset transition focus-within:ring-2',
        toneToken.ring,
        toneToken.darkRing,
        toneToken.focusRing
      )
      : statusRing[validationStatus];

  const groupClasses = classNames(
    'flex w-full items-stretch overflow-hidden rounded-lg shadow-sm',
    ringClasses,
    toneToken.background,
    toneToken.darkBackground,
    disabled && 'opacity-60 cursor-not-allowed',
    className
  );

  const leading =
    leadingAddon !== undefined ? (
      <span
        className={classNames(
          addonBaseClasses,
          sizeToken.text,
          sizeToken.padding,
          toneToken.addonBackground,
          toneToken.addonBorder,
          toneToken.addonText,
          toneToken.darkAddonBackground,
          toneToken.darkAddonBorder,
          toneToken.darkAddonText,
          'border-r sm:min-w-max'
        )}
      >
        {leadingAddon}
      </span>
    ) : null;

  const trailing =
    trailingAddon !== undefined ? (
      <span
        className={classNames(
          addonBaseClasses,
          sizeToken.text,
          sizeToken.padding,
          toneToken.addonBackground,
          toneToken.addonBorder,
          toneToken.addonText,
          toneToken.darkAddonBackground,
          toneToken.darkAddonBorder,
          toneToken.darkAddonText,
          'border-l sm:min-w-max'
        )}
      >
        {trailingAddon}
      </span>
    ) : null;

  const enhancedChildren = React.Children.map(children, (child) =>
    attachChildProps(child, tone, size)
  );

  return (
    <div className={groupClasses} data-disabled={disabled} data-status={validationStatus}>
      {leading}
      <div className="flex min-w-0 flex-1 items-center">{enhancedChildren}</div>
      {trailing}
    </div>
  );
};

export default InputGroup;
