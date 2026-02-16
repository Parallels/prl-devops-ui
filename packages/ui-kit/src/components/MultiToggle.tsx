import React, {
  type ButtonHTMLAttributes,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import classNames from "classnames";
import { useIconRenderer } from "../contexts/IconContext";
import { getMultiToggleColorTokens, type ThemeColor } from "../theme/Theme";
import type { IconSize } from "../types/Icon";

export type MultiToggleSize = "sm" | "md" | "lg";

type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>);

export type MultiToggleOptionWidth = number | LiteralUnion<"auto">;
export type MultiToggleActiveWidthStrategy = "auto" | "max";

export interface MultiToggleOption {
  value: string;
  label?: ReactNode;
  icon?: string | React.ReactElement;
  disabled?: boolean;
  width?: MultiToggleOptionWidth;
}

export interface MultiToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
  options: MultiToggleOption[];
  value: string;
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
}

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
    track: "h-9 text-xs",
    indicatorInset: "inset-y-[0px]",
    cell: "px-2 py-1.5",
    gap: "gap-1",
    label: "text-xs",
    icon: "h-5 w-5",
    paddingY: "py-1",
  },
  md: {
    track: "h-11 text-sm",
    indicatorInset: "inset-y-[0px]",
    cell: "px-3 py-2",
    gap: "gap-1.5",
    label: "text-sm",
    icon: "h-6 w-6",
    paddingY: "py-1",
  },
  lg: {
    track: "h-12 text-base",
    indicatorInset: "inset-y-[0px]",
    cell: "px-4 py-2.5",
    gap: "gap-2",
    label: "text-base",
    icon: "h-7 w-7",
    paddingY: "py-1",
  },
};

const CONTAINER_HORIZONTAL_PADDING = 4;
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

  if (typeof value === "number") {
    return `${value}px`;
  }

  return value;
};

const MultiToggle: React.FC<MultiToggleProps> = ({
  options,
  value,
  onChange,
  size = "md",
  color = "blue",
  fullWidth = false,
  className,
  showOnlyActiveLabel = false,
  truncateOverflow,
  adaptiveWidth = false,
  optionMaxWidth,
  disabled,
  style: sharedButtonStyle,
  activeWidthStrategy = "auto",
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
  const shouldLockToMaxWidth = hasCustomWidths && activeWidthStrategy === "max";

  const optionCount = options.length ?? 0;
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const sizeStyles = sizeTokens[size] ?? sizeTokens.md;
  const colorStyles = getMultiToggleColorTokens(color);
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
    const paddingLeft = parseFloat(containerStyles?.paddingLeft ?? "0") || 0;
    const paddingRight = parseFloat(containerStyles?.paddingRight ?? "0") || 0;
    const containerInnerWidth = Math.max(0, container.clientWidth - paddingLeft - paddingRight);

    if (usesSegmentLayout) {
      const segmentWidth = containerInnerWidth / optionCount;
      const inset = computeInset(segmentWidth);
      const indicatorWidth = Math.max(0, segmentWidth - inset * 2);
      const offset = CONTAINER_HORIZONTAL_PADDING + activeIndex * segmentWidth + inset;
      setIndicatorInlineStyle({
        width: `${indicatorWidth}px`,
        transform: `translateX(${offset}px)`,
      });
      return;
    }

    const baseWidth = shouldLockToMaxWidth && maxOptionWidth ? maxOptionWidth : activeButton.offsetWidth;
    const inset = computeInset(baseWidth);
    const indicatorWidth = Math.max(0, Math.min(baseWidth, containerInnerWidth) - inset * 2);
    let offset = activeButton.offsetLeft - paddingLeft + inset;
    const maxOffset = Math.max(inset, containerInnerWidth - indicatorWidth - inset);
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
          const labelSignature =
            typeof option.label === "string" ? option.label : option.label !== undefined ? "node" : "";
          return `${option.value}:${option.width ?? ""}:${labelSignature}`;
        })
        .join("|"),
    [options]
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
    const paddingLeft = parseFloat(containerStyles?.paddingLeft ?? "0") || 0;
    const paddingRight = parseFloat(containerStyles?.paddingRight ?? "0") || 0;
    const containerInnerWidth = Math.max(0, container.clientWidth - paddingLeft - paddingRight);

    const widths = measurementRefs.current.map((node) => node?.offsetWidth ?? 0);
    const largestWidth = widths.reduce((currentMax, width) => (width > currentMax ? width : currentMax), 0);
    const constrainedWidth = Math.min(largestWidth, containerInnerWidth);

    setMaxOptionWidth(constrainedWidth || undefined);
  }, [shouldLockToMaxWidth, optionsSignature, size, optionMaxWidth]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    updateIndicatorPosition();

    const handleWindowResize = () => {
      updateIndicatorPosition();
    };

    let resizeObserver: ResizeObserver | undefined;

    if (typeof ResizeObserver !== "undefined") {
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

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      resizeObserver?.disconnect();
    };
  }, [optionsSignature, optionMaxWidth, updateIndicatorPosition, shouldLockToMaxWidth, maxOptionWidth]);

  const shouldTruncate = truncateOverflow ?? true;
  const computedIndicatorStyle = indicatorInlineStyle ?? indicatorStyle;

  return (
    <div
      ref={containerRef}
      className={classNames(
        "relative inline-flex select-none items-center  bg-neutral-200 rounded-full p-1 shadow-inner dark:bg-neutral-600",
        sizeStyles.track,
        fullWidth && "w-full",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
      role="radiogroup"
      aria-disabled={disabled}
    >
      <span
        className={classNames(
          "pointer-events-none absolute left-0 flex items-center justify-center transition-transform duration-200 ease-out",
          sizeStyles.indicatorInset,
          sizeStyles.paddingY
        )}
        style={computedIndicatorStyle ?? indicatorStyle}
      >
        <span className={classNames("h-full w-full rounded-full", colorStyles.indicator)} />
      </span>

      {shouldLockToMaxWidth && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            visibility: "hidden",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            height: 0,
            overflow: "hidden",
          }}
        >
          {options.map((option, index) => {
            const measurementStyle: React.CSSProperties = {};
            if (option.width && option.width !== "auto") {
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
                className={classNames(
                  "inline-flex min-w-0 items-center justify-center rounded-full",
                  sizeStyles.cell,
                  sizeStyles.gap
                )}
                style={measurementStyle}
              >
                <span className={classNames("flex min-w-0 items-center justify-center", sizeStyles.gap)}>
                  {option.icon && renderIcon(option.icon, size as IconSize, sizeStyles.icon)}
                  {option.label && <span className={classNames(sizeStyles.label, "min-w-0")}>{option.label}</span>}
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
        const customWidthValue =
          option.width !== undefined ? option.width : adaptiveWidth && applyCustomWidth ? "auto" : undefined;
        let buttonStyle: React.CSSProperties | undefined;

        if (applyCustomWidth) {
          buttonStyle = {
            flex: "0 1 auto",
            minWidth: 0,
          };

          if (customWidthValue && customWidthValue !== "auto") {
            const targetWidth = toCssDimension(customWidthValue);
            if (targetWidth) {
              buttonStyle.flex = "0 0 auto";
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
              flex: "0 0 auto",
              minWidth: 0,
            };
          } else {
            buttonStyle.flex = "0 0 auto";
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
              "relative z-[1] flex min-w-0 items-center justify-center rounded-full transition-colors duration-150",
              sizeStyles.cell,
              sizeStyles.gap,
              hasCustomWidths ? "flex-none" : "flex-1",
              optionDisabled
                ? "text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
                : classNames(
                    "cursor-pointer text-neutral-600 dark:text-neutral-300",
                    colorStyles.hover,
                    isActive && colorStyles.activeText
                  )
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
            <span className={classNames("flex min-w-0 items-center justify-center", sizeStyles.gap)}>
              {option.icon && renderIcon(option.icon, size as IconSize, sizeStyles.icon)}
              {option.label && (!showOnlyActiveLabel || isActive) && (
                <span
                  className={classNames(
                    sizeStyles.label,
                    "min-w-0 px-1 text-center leading-tight block",
                    shouldTruncate ? "truncate" : "whitespace-nowrap"
                  )}
                  title={shouldTruncate && typeof option.label === "string" ? option.label : undefined}
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

MultiToggle.displayName = "MultiToggle";

export default MultiToggle;
