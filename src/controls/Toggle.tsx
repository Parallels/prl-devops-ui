import { forwardRef, InputHTMLAttributes, ReactNode, useCallback, useId, useRef } from 'react';
import classNames from 'classnames';
import { ThemeColor, getToggleColorClasses } from './Theme';
import { IconName } from '@/types/Icon';
import { renderIcon } from '@/utils/icon';

export type ToggleSize = 'sm' | 'md' | 'lg';
export type ToggleAlign = 'left' | 'right';
export type ToggleDescriptionPlacement = 'inline' | 'stacked';

export interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'color' | 'children'> {
  label?: ReactNode;
  description?: ReactNode;
  descriptionPlacement?: ToggleDescriptionPlacement;
  size?: ToggleSize;
  color?: ThemeColor;
  alignLabel?: ToggleAlign;
  iconOn?: IconName | React.ReactElement;
  iconOff?: IconName | React.ReactElement;
  fullWidth?: boolean;
  className?: string;
}

const sizeTokens: Record<
  ToggleSize,
  {
    track: string;
    thumb: string;
    thumbOffset: string;
    thumbTranslate: string;
    gap: string;
    font: string;
    description: string;
  }
> = {
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-4 w-4',
    thumbOffset: 'top-0.5 left-0.5',
    thumbTranslate: 'peer-checked:translate-x-4',
    gap: 'gap-2',
    font: 'text-sm',
    description: 'text-xs',
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5',
    thumbOffset: 'top-0.5 left-0.5',
    thumbTranslate: 'peer-checked:translate-x-5',
    gap: 'gap-3',
    font: 'text-sm',
    description: 'text-xs',
  },
  lg: {
    track: 'h-7 w-14',
    thumb: 'h-6 w-6',
    thumbOffset: 'top-1 left-1',
    thumbTranslate: 'peer-checked:translate-x-6',
    gap: 'gap-3.5',
    font: 'text-base',
    description: 'text-sm',
  },
};

const iconWrapSize: Record<ToggleSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      id,
      label,
      description,
      descriptionPlacement = 'stacked',
      size = 'md',
      color = 'blue',
      alignLabel = 'right',
      iconOn,
      iconOff,
      fullWidth = false,
      className,
      disabled,
      onChange,
      ...inputProps
    },
    forwardedRef
  ) => {
    const generatedId = useId();
    const toggleId = id ?? generatedId;
    const descriptionId = description ? `${toggleId}-description` : undefined;
    const inputRef = useRef<HTMLInputElement>(null);

    const mergeRefs = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef]
    );

    const sizeStyles = sizeTokens[size] ?? sizeTokens.md;
    const colorStyles = getToggleColorClasses(color);

    const labelBlock =
      label || description ? (
        <span
          className={classNames(
            'min-w-0',
            descriptionPlacement === 'inline'
              ? 'flex flex-wrap items-center gap-2 text-neutral-900 dark:text-neutral-100'
              : 'flex flex-col',
            descriptionPlacement === 'inline' && !label && 'text-neutral-400 dark:text-neutral-300'
          )}
        >
          {label && (
            <span
              className={classNames(
                sizeStyles.font,
                'font-medium text-neutral-900 dark:text-neutral-100',
                disabled && 'text-neutral-400 dark:text-neutral-300'
              )}
            >
              {label}
            </span>
          )}
          {description && (
            <span
              id={descriptionId}
              className={classNames(
                sizeStyles.description,
                'text-neutral-400 dark:text-neutral-300',
                descriptionPlacement === 'stacked' && 'mt-1',
                disabled && 'text-neutral-300 dark:text-neutral-400'
              )}
            >
              {description}
            </span>
          )}
        </span>
      ) : null;

    return (
      <label
        className={classNames(
          'group flex select-none items-center',
          alignLabel === 'left' ? 'flex-row-reverse' : 'flex-row',
          sizeStyles.gap,
          fullWidth && 'w-full',
          disabled && 'cursor-not-allowed opacity-60',
          !disabled && 'cursor-pointer',
          className
        )}
      >
        <span className="relative inline-flex shrink-0">
          <input
            id={toggleId}
            ref={mergeRefs}
            type="checkbox"
            role="switch"
            className={classNames(
              'peer sr-only',
              disabled ? 'cursor-not-allowed' : 'cursor-pointer'
            )}
            aria-describedby={descriptionId}
            disabled={disabled}
            onChange={onChange}
            {...inputProps}
          />

          <span
            aria-hidden="true"
            className={classNames(
              'block rounded-full border border-transparent bg-neutral-200 transition-colors duration-200 ease-in-out peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 dark:bg-neutral-600',
              sizeStyles.track,
              colorStyles,
              disabled && 'opacity-70 peer-checked:opacity-70 dark:opacity-50'
            )}
          />

          {iconOff && (
            <span
              className={classNames(
                'pointer-events-none absolute inset-y-0 left-1 flex items-center text-neutral-400 transition-opacity duration-200 ease-in-out',
                iconWrapSize[size],
                'peer-checked:opacity-0'
              )}
            >
              {renderIcon(iconOff, 'sm')}
            </span>
          )}

          {iconOn && (
            <span
              className={classNames(
                'pointer-events-none text-black absolute inset-y-0 right-1 flex items-center text-black opacity-0 transition-opacity duration-200 ease-in-out',
                iconWrapSize[size],
                'peer-checked:opacity-100'
              )}
            >
              {renderIcon(iconOn, 'sm')}
            </span>
          )}

          <span
            className={classNames(
              'pointer-events-none absolute transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out dark:bg-neutral-200',
              'translate-x-0',
              sizeStyles.thumb,
              sizeStyles.thumbOffset,
              sizeStyles.thumbTranslate
            )}
          />
        </span>
        {labelBlock}
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';

export default Toggle;
