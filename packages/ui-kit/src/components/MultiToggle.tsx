import React, { type ButtonHTMLAttributes, type ReactNode, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { useIconRenderer } from '../contexts/IconContext';
import { getMultiToggleVariantTokens, type ThemeColor } from '../theme/Theme';
import type { IconSize } from '../types/Icon';

export type MultiToggleSize = 'sm' | 'md' | 'lg';
export type MultiToggleShape = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type MultiToggleVariant = 'theme' | 'solid' | 'soft';

type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>);

export type MultiToggleOptionWidth = number | LiteralUnion<'auto'>;
export type MultiToggleActiveWidthStrategy = 'auto' | 'max';

export interface MultiToggleOption {
  value: string;
  label?: ReactNode;
  icon?: string | React.ReactElement;
  disabled?: boolean;
  width?: MultiToggleOptionWidth;
}

export interface MultiToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'> {
  options: MultiToggleOption[];
  value: string;
  rounded?: MultiToggleShape;

  onChange: (value: string) => void;
  size?: MultiToggleSize;
  color?: ThemeColor;
  fullWidth?: boolean;
  className?: string;
  showOnlyActiveLabel?: boolean;
  truncateOverflow?: boolean;
  adaptiveWidth?: boolean;
  optionMaxWidth?: number | string;
  activeWidthStrategy?: MultiToggleActiveWidthStrategy;
  variant?: MultiToggleVariant;
  /** When set, overrides the active option's text color with this color's active-text token. */
  accentColor?: ThemeColor;
}

const toneTokens: Record<ThemeColor, { activeText: string; indicator: string; hover: string }> = {
  parallels: {
    activeText: 'text-rose-700 dark:text-rose-200',
    indicator: 'bg-rose-500/15 dark:bg-rose-400/20 border border-rose-400/40 dark:border-rose-300/20',
    hover: 'hover:text-rose-600 dark:hover:text-rose-300',
  },
  brand: {
    activeText: 'text-rose-700 dark:text-rose-200',
    indicator: 'bg-rose-500/15 dark:bg-rose-400/20 border border-rose-400/40 dark:border-rose-300/20',
    hover: 'hover:text-rose-600 dark:hover:text-rose-300',
  },
  theme: {
    activeText: 'text-rose-700 dark:text-rose-200',
    indicator: 'bg-rose-500/15 dark:bg-rose-400/20 border border-rose-400/40 dark:border-rose-300/20',
    hover: 'hover:text-rose-600 dark:hover:text-rose-300',
  },
  red: {
    activeText: 'text-rose-700 dark:text-rose-200',
    indicator: 'bg-rose-500/15 dark:bg-rose-400/20 border border-rose-400/40 dark:border-rose-300/20',
    hover: 'hover:text-rose-600 dark:hover:text-rose-300',
  },
  orange: {
    activeText: 'text-orange-700 dark:text-orange-200',
    indicator: 'bg-orange-500/15 dark:bg-orange-400/20 border border-orange-400/40 dark:border-orange-300/20',
    hover: 'hover:text-orange-600 dark:hover:text-orange-300',
  },
  amber: {
    activeText: 'text-amber-700 dark:text-amber-200',
    indicator: 'bg-amber-500/15 dark:bg-amber-400/20 border border-amber-400/40 dark:border-amber-300/20',
    hover: 'hover:text-amber-600 dark:hover:text-amber-300',
  },
  yellow: {
    activeText: 'text-yellow-700 dark:text-yellow-200',
    indicator: 'bg-yellow-500/15 dark:bg-yellow-400/20 border border-yellow-400/40 dark:border-yellow-300/20',
    hover: 'hover:text-yellow-600 dark:hover:text-yellow-300',
  },
  lime: {
    activeText: 'text-lime-700 dark:text-lime-200',
    indicator: 'bg-lime-500/15 dark:bg-lime-400/20 border border-lime-400/40 dark:border-lime-300/20',
    hover: 'hover:text-lime-600 dark:hover:text-lime-300',
  },
  green: {
    activeText: 'text-emerald-700 dark:text-emerald-200',
    indicator: 'bg-emerald-500/15 dark:bg-emerald-400/20 border border-emerald-400/40 dark:border-emerald-300/20',
    hover: 'hover:text-emerald-600 dark:hover:text-emerald-300',
  },
  emerald: {
    activeText: 'text-emerald-700 dark:text-emerald-200',
    indicator: 'bg-emerald-500/15 dark:bg-emerald-400/20 border border-emerald-400/40 dark:border-emerald-300/20',
    hover: 'hover:text-emerald-600 dark:hover:text-emerald-300',
  },
  teal: {
    activeText: 'text-teal-700 dark:text-teal-200',
    indicator: 'bg-teal-500/15 dark:bg-teal-400/20 border border-teal-400/40 dark:border-teal-300/20',
    hover: 'hover:text-teal-600 dark:hover:text-teal-300',
  },
  cyan: {
    activeText: 'text-cyan-700 dark:text-cyan-200',
    indicator: 'bg-cyan-500/15 dark:bg-cyan-400/20 border border-cyan-400/40 dark:border-cyan-300/20',
    hover: 'hover:text-cyan-600 dark:hover:text-cyan-300',
  },
  sky: {
    activeText: 'text-sky-700 dark:text-sky-200',
    indicator: 'bg-sky-500/15 dark:bg-sky-400/20 border border-sky-400/40 dark:border-sky-300/20',
    hover: 'hover:text-sky-600 dark:hover:text-sky-300',
  },
  blue: {
    activeText: 'text-blue-700 dark:text-blue-200',
    indicator: 'bg-blue-500/15 dark:bg-blue-400/20 border border-blue-400/40 dark:border-blue-300/20',
    hover: 'hover:text-blue-600 dark:hover:text-blue-300',
  },
  indigo: {
    activeText: 'text-indigo-700 dark:text-indigo-200',
    indicator: 'bg-indigo-500/15 dark:bg-indigo-400/20 border border-indigo-400/40 dark:border-indigo-300/20',
    hover: 'hover:text-indigo-600 dark:hover:text-indigo-300',
  },
  violet: {
    activeText: 'text-violet-700 dark:text-violet-200',
    indicator: 'bg-violet-500/15 dark:bg-violet-400/20 border border-violet-400/40 dark:border-violet-300/20',
    hover: 'hover:text-violet-600 dark:hover:text-violet-300',
  },
  purple: {
    activeText: 'text-purple-700 dark:text-purple-200',
    indicator: 'bg-purple-500/15 dark:bg-purple-400/20 border border-purple-400/40 dark:border-purple-300/20',
    hover: 'hover:text-purple-600 dark:hover:text-purple-300',
  },
  fuchsia: {
    activeText: 'text-fuchsia-700 dark:text-fuchsia-200',
    indicator: 'bg-fuchsia-500/15 dark:bg-fuchsia-400/20 border border-fuchsia-400/40 dark:border-fuchsia-300/20',
    hover: 'hover:text-fuchsia-600 dark:hover:text-fuchsia-300',
  },
  pink: {
    activeText: 'text-pink-700 dark:text-pink-200',
    indicator: 'bg-pink-500/15 dark:bg-pink-400/20 border border-pink-400/40 dark:border-pink-300/20',
    hover: 'hover:text-pink-600 dark:hover:text-pink-300',
  },
  rose: {
    activeText: 'text-rose-700 dark:text-rose-200',
    indicator: 'bg-rose-500/15 dark:bg-rose-400/20 border border-rose-400/40 dark:border-rose-300/20',
    hover: 'hover:text-rose-600 dark:hover:text-rose-300',
  },
  slate: {
    activeText: 'text-slate-700 dark:text-slate-200',
    indicator: 'bg-slate-500/15 dark:bg-slate-400/20 border border-slate-400/40 dark:border-slate-300/20',
    hover: 'hover:text-slate-600 dark:hover:text-slate-300',
  },
  gray: {
    activeText: 'text-gray-700 dark:text-gray-200',
    indicator: 'bg-gray-500/15 dark:bg-gray-400/20 border border-gray-400/40 dark:border-gray-300/20',
    hover: 'hover:text-gray-600 dark:hover:text-gray-300',
  },
  zinc: {
    activeText: 'text-zinc-700 dark:text-zinc-200',
    indicator: 'bg-zinc-500/15 dark:bg-zinc-400/20 border border-zinc-400/40 dark:border-zinc-300/20',
    hover: 'hover:text-zinc-600 dark:hover:text-zinc-300',
  },
  neutral: {
    activeText: 'text-neutral-700 dark:text-neutral-200',
    indicator: 'bg-neutral-500/15 dark:bg-neutral-400/20 border border-neutral-400/40 dark:border-neutral-300/20',
    hover: 'hover:text-neutral-600 dark:hover:text-neutral-300',
  },
  stone: {
    activeText: 'text-stone-700 dark:text-stone-200',
    indicator: 'bg-stone-500/15 dark:bg-stone-400/20 border border-stone-400/40 dark:border-stone-300/20',
    hover: 'hover:text-stone-600 dark:hover:text-stone-300',
  },
  white: {
    activeText: 'text-slate-700 dark:text-slate-200',
    indicator: 'bg-slate-400/15 dark:bg-slate-300/20 border border-slate-300/40 dark:border-slate-200/20',
    hover: 'hover:text-slate-600 dark:hover:text-slate-300',
  },
  info: {
    activeText: 'text-sky-700 dark:text-sky-200',
    indicator: 'bg-sky-500/15 dark:bg-sky-400/20 border border-sky-400/40 dark:border-sky-300/20',
    hover: 'hover:text-sky-600 dark:hover:text-sky-300',
  },
  success: {
    activeText: 'text-emerald-700 dark:text-emerald-200',
    indicator: 'bg-emerald-500/15 dark:bg-emerald-400/20 border border-emerald-400/40 dark:border-emerald-300/20',
    hover: 'hover:text-emerald-600 dark:hover:text-emerald-300',
  },
  warning: {
    activeText: 'text-yellow-700 dark:text-yellow-200',
    indicator: 'bg-yellow-500/15 dark:bg-yellow-400/20 border border-yellow-400/40 dark:border-yellow-300/20',
    hover: 'hover:text-yellow-600 dark:hover:text-yellow-300',
  },
  danger: {
    activeText: 'text-rose-700 dark:text-rose-200',
    indicator: 'bg-rose-500/15 dark:bg-rose-400/20 border border-rose-400/40 dark:border-rose-300/20',
    hover: 'hover:text-rose-600 dark:hover:text-rose-300',
  },
};

const sizeTokens: Record<
  MultiToggleSize,
  {
    track: string;
    indicatorInset: string;
    cell: string;
    gap: string;
    label: string;
    icon: string;
    paddingY: string;
  }
> = {
  sm: {
    track: 'h-8 text-xs',
    indicatorInset: 'inset-y-[0px]',
    cell: 'px-2 py-1',
    gap: 'gap-1',
    label: 'text-xs',
    icon: 'h-4 w-4',
    paddingY: 'py-0.5',
  },
  md: {
    track: 'h-9 text-sm',
    indicatorInset: 'inset-y-[0px]',
    cell: 'px-2.5 py-1.5',
    gap: 'gap-1.5',
    label: 'text-sm',
    icon: 'h-5 w-5',
    paddingY: 'py-1',
  },
  lg: {
    track: 'h-11 text-base',
    indicatorInset: 'inset-y-[0px]',
    cell: 'px-3.5 py-2',
    gap: 'gap-2',
    label: 'text-base',
    icon: 'h-6 w-6',
    paddingY: 'py-1',
  },
};

const CONTAINER_HORIZONTAL_PADDING = 2;
const INDICATOR_MARGIN = 1;

const computeInset = (segmentWidth: number) => {
  if (segmentWidth <= 0) {
    return 0;
  }
  const proportional = segmentWidth / 16;
  return Math.min(INDICATOR_MARGIN, proportional);
};

const toCssDimension = (value?: number | string | null): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return `${value}px`;
  }

  return value;
};

const MultiToggle: React.FC<MultiToggleProps> = ({
  options,
  value,
  onChange,
  size = 'md',
  color = 'blue',
  fullWidth = false,
  className,
  showOnlyActiveLabel = false,
  truncateOverflow,
  adaptiveWidth = false,
  optionMaxWidth,
  disabled,
  rounded = 'lg',
  style: sharedButtonStyle,
  activeWidthStrategy = 'auto',
  variant = 'theme',
  accentColor,
  ...buttonProps
}) => {
  const renderIcon = useIconRenderer();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const measurementRefs = useRef<Array<HTMLDivElement | null>>([]);
  const hasCustomWidths = adaptiveWidth || options.some((option) => option.width !== undefined);
  const [indicatorInlineStyle, setIndicatorInlineStyle] = useState<React.CSSProperties>();
  const [maxOptionWidth, setMaxOptionWidth] = useState<number>();
  const parsedOptionMaxWidth = toCssDimension(optionMaxWidth);
  const shouldLockToMaxWidth = hasCustomWidths && activeWidthStrategy === 'max';
  const controlRounded =
    rounded === 'none'
      ? ''
      : rounded === 'xs'
        ? 'rounded-xs'
        : rounded === 'sm'
          ? 'rounded-sm'
          : rounded === 'md'
            ? 'rounded-md'
            : rounded === 'lg'
              ? 'rounded-lg'
              : rounded === 'xl'
                ? 'rounded-xl'
                : 'rounded-full';

  const optionCount = options.length ?? 0;
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const sizeStyles = sizeTokens[size] ?? sizeTokens.md;
  const colorStyles = toneTokens[color] ?? toneTokens.theme;
  const variantTokens = getMultiToggleVariantTokens(color);
  const isVariantMode = variant === 'solid' || variant === 'soft';
  const activeTextClass = accentColor
    ? isVariantMode
      ? getMultiToggleVariantTokens(accentColor).activeText
      : (toneTokens[accentColor] ?? toneTokens.theme).activeText
    : isVariantMode
      ? variantTokens.activeText
      : colorStyles.activeText;
  const usesSegmentLayout = !hasCustomWidths && !shouldLockToMaxWidth;
  optionRefs.current.length = optionCount;
  measurementRefs.current.length = optionCount;

  const indicatorStyle = useMemo(() => {
    const segmentExpression = `(100% - ${CONTAINER_HORIZONTAL_PADDING * 2}px) / ${optionCount}`;
    const margin = INDICATOR_MARGIN;

    if (usesSegmentLayout) {
      return {
        width: `calc(${segmentExpression} - ${margin * 2}px)`,
        transform: `translateX(calc(${CONTAINER_HORIZONTAL_PADDING}px + ${activeIndex} * (${segmentExpression}) + ${margin}px))`,
      };
    }

    const widthPercent = 100 / optionCount;
    return {
      width: `calc(${widthPercent}% - ${margin * 2}px)`,
      transform: `translateX(calc(${activeIndex} * (100% / ${optionCount}) + ${margin}px))`,
    };
  }, [activeIndex, optionCount, usesSegmentLayout]);

  const updateIndicatorPosition = useCallback(() => {
    const container = containerRef.current;
    const activeButton = optionRefs.current[activeIndex];

    if (!container || !activeButton) {
      return;
    }

    const containerStyles = window.getComputedStyle(container);
    const paddingLeft = parseFloat(containerStyles?.paddingLeft ?? '0') || 0;
    const paddingRight = parseFloat(containerStyles?.paddingRight ?? '0') || 0;
    const containerInnerWidth = Math.max(0, container.clientWidth - paddingLeft - paddingRight);

    if (usesSegmentLayout) {
      const segmentWidth = containerInnerWidth / optionCount;
      const inset = computeInset(segmentWidth);
      const indicatorWidth = Math.max(0, segmentWidth - inset * 2);
      const offset = paddingLeft + activeIndex * segmentWidth + inset;
      setIndicatorInlineStyle({
        width: `${indicatorWidth}px`,
        transform: `translateX(${offset}px)`,
      });
      return;
    }

    const baseWidth = shouldLockToMaxWidth && maxOptionWidth ? maxOptionWidth : activeButton.offsetWidth;
    const inset = computeInset(baseWidth);
    const indicatorWidth = Math.max(0, Math.min(baseWidth, containerInnerWidth) - inset * 2);
    // offsetLeft is relative to the container's border-box edge (same as `absolute left-0`),
    // so do NOT subtract paddingLeft — that would shift the pill left and create unequal gutters.
    let offset = activeButton.offsetLeft + inset;
    const maxOffset = Math.max(inset, container.clientWidth - indicatorWidth - inset);
    offset = Math.min(Math.max(offset, inset), maxOffset);

    setIndicatorInlineStyle({
      width: `${indicatorWidth}px`,
      transform: `translateX(${offset}px)`,
    });
  }, [activeIndex, shouldLockToMaxWidth, maxOptionWidth, optionCount, usesSegmentLayout]);

  const optionsSignature = useMemo(
    () =>
      options
        .map((option) => {
          const labelSignature = typeof option.label === 'string' ? option.label : option.label !== undefined ? 'node' : '';
          return `${option.value}:${option.width ?? ''}:${labelSignature}`;
        })
        .join('|'),
    [options],
  );

  useLayoutEffect(() => {
    if (!shouldLockToMaxWidth) {
      setMaxOptionWidth(undefined);
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const containerStyles = window.getComputedStyle(container);
    const paddingLeft = parseFloat(containerStyles?.paddingLeft ?? '0') || 0;
    const paddingRight = parseFloat(containerStyles?.paddingRight ?? '0') || 0;
    const containerInnerWidth = Math.max(0, container.clientWidth - paddingLeft - paddingRight);

    const widths = measurementRefs.current.map((node) => node?.offsetWidth ?? 0);
    const largestWidth = widths.reduce((currentMax, width) => (width > currentMax ? width : currentMax), 0);
    const constrainedWidth = Math.min(largestWidth, containerInnerWidth);

    setMaxOptionWidth(constrainedWidth || undefined);
  }, [shouldLockToMaxWidth, optionsSignature, size, optionMaxWidth]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    updateIndicatorPosition();

    const handleWindowResize = () => {
      updateIndicatorPosition();
    };

    let resizeObserver: ResizeObserver | undefined;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateIndicatorPosition();
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      optionRefs.current.forEach((button) => {
        if (button) {
          resizeObserver?.observe(button);
        }
      });
    }

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      resizeObserver?.disconnect();
    };
  }, [optionsSignature, optionMaxWidth, updateIndicatorPosition, shouldLockToMaxWidth, maxOptionWidth]);

  const shouldTruncate = truncateOverflow ?? true;
  const computedIndicatorStyle = indicatorInlineStyle ?? indicatorStyle;

  return (
    <div
      ref={containerRef}
      className={classNames(
        'relative inline-flex select-none items-center p-0.5',
        isVariantMode ? 'bg-neutral-100 dark:bg-neutral-700' : 'bg-neutral-100 shadow-inner dark:bg-neutral-600',
        controlRounded,
        sizeStyles.track,
        fullWidth && 'w-full',
        disabled && 'opacity-60 cursor-not-allowed',
        className,
      )}
      role="radiogroup"
      aria-disabled={disabled}
    >
      <span
        className={classNames('pointer-events-none absolute left-0 flex items-center justify-center transition-transform duration-200 ease-out', sizeStyles.indicatorInset, sizeStyles.paddingY)}
        style={computedIndicatorStyle ?? indicatorStyle}
      >
        <span
          className={classNames(
            'h-full w-full',
            controlRounded,
            variant === 'solid' && 'bg-white dark:bg-neutral-800 shadow-sm',
            variant === 'soft' && variantTokens.softIndicator,
            variant === 'theme' && colorStyles.indicator,
          )}
        />
      </span>

      {shouldLockToMaxWidth && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            visibility: 'hidden',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            height: 0,
            overflow: 'hidden',
          }}
        >
          {options.map((option, index) => {
            const measurementStyle: React.CSSProperties = {};
            if (option.width && option.width !== 'auto') {
              const targetWidth = toCssDimension(option.width);
              if (targetWidth) {
                measurementStyle.width = targetWidth;
              }
            }
            if (parsedOptionMaxWidth) {
              measurementStyle.maxWidth = parsedOptionMaxWidth;
            }

            return (
              <div
                key={`measure-${option.value}`}
                ref={(node) => {
                  measurementRefs.current[index] = node;
                }}
                className={classNames('inline-flex min-w-0 items-center justify-center rounded-full', sizeStyles.cell, sizeStyles.gap)}
                style={measurementStyle}
              >
                <span className={classNames('flex min-w-0 items-center justify-center', sizeStyles.gap)}>
                  {option.icon && renderIcon(option.icon, size as IconSize, sizeStyles.icon)}
                  {option.label && <span className={classNames(sizeStyles.label, 'min-w-0')}>{option.label}</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {options.map((option, index) => {
        const isActive = option.value == value;
        const optionDisabled = disabled || option.disabled;
        const applyCustomWidth = hasCustomWidths && (!showOnlyActiveLabel || isActive);
        const customWidthValue = option.width !== undefined ? option.width : adaptiveWidth && applyCustomWidth ? 'auto' : undefined;
        let buttonStyle: React.CSSProperties | undefined;

        if (applyCustomWidth) {
          buttonStyle = {
            flex: '0 1 auto',
            minWidth: 0,
          };

          if (customWidthValue && customWidthValue !== 'auto') {
            const targetWidth = toCssDimension(customWidthValue);
            if (targetWidth) {
              buttonStyle.flex = '0 0 auto';
              buttonStyle.width = targetWidth;
            }
          }

          if (parsedOptionMaxWidth) {
            buttonStyle.maxWidth = parsedOptionMaxWidth;
          }
        }

        if (shouldLockToMaxWidth && isActive && maxOptionWidth) {
          if (!buttonStyle) {
            buttonStyle = {
              flex: '0 0 auto',
              minWidth: 0,
            };
          } else {
            buttonStyle.flex = '0 0 auto';
          }
          buttonStyle.width = `${maxOptionWidth}px`;
          if (parsedOptionMaxWidth) {
            buttonStyle.maxWidth = parsedOptionMaxWidth;
          }
        }

        const mergedStyle =
          sharedButtonStyle || buttonStyle
            ? {
                ...(sharedButtonStyle ?? {}),
                ...(buttonStyle ?? {}),
              }
            : undefined;

        return (
          <button
            ref={(node) => {
              optionRefs.current[index] = node;
            }}
            key={option.value}
            type="button"
            className={classNames(
              'relative z-[1] flex min-w-0 items-center justify-center transition-colors duration-150',
              controlRounded,
              sizeStyles.cell,
              sizeStyles.gap,
              hasCustomWidths ? 'flex-none' : 'flex-1',
              optionDisabled
                ? 'text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                : classNames('cursor-pointer', isActive ? activeTextClass : 'text-neutral-600 dark:text-neutral-300', isVariantMode ? variantTokens.hover : colorStyles.hover),
            )}
            onClick={() => {
              if (optionDisabled || option.value === value) {
                return;
              }
              onChange(option.value);
            }}
            disabled={optionDisabled}
            aria-pressed={isActive}
            role="radio"
            aria-checked={isActive}
            tabIndex={optionDisabled ? -1 : isActive ? 0 : -1}
            style={mergedStyle}
            {...buttonProps}
          >
            <span className={classNames('flex min-w-0 items-center justify-center', sizeStyles.gap)}>
              {option.icon && renderIcon(option.icon, size as IconSize, sizeStyles.icon)}
              {option.label && (!showOnlyActiveLabel || isActive) && (
                <span
                  className={classNames(sizeStyles.label, 'min-w-0 px-1 text-center leading-tight block', shouldTruncate ? 'truncate' : 'whitespace-nowrap')}
                  title={shouldTruncate && typeof option.label === 'string' ? option.label : undefined}
                >
                  {option.label}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

MultiToggle.displayName = 'MultiToggle';

export default MultiToggle;
