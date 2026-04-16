import React, { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";
import { getColorPalette } from "../theme";

export interface MultiProgressBarSeries {
  key: string;
  label: string;
  labelClassName?: string;
  value: number;
  /** Tailwind bg color class e.g., 'bg-rose-500'. Omit to auto-assign from the theme palette. */
  color?: string;
  /** Custom formatted value to display in legend, if omitted `value` is used */
  displayValue?: React.ReactNode;
}

export interface MultiProgressBarProps {
  label: string;
  labelClassName?: string;
  secondaryLabel?: React.ReactNode;
  secondaryLabelClassName?: string;
  totalLabel?: React.ReactNode;
  total: number;
  series: MultiProgressBarSeries[];
  className?: string;
}

interface TooltipState {
  key: string;
  x: number;
  y: number;
}

const MultiProgressBar: React.FC<MultiProgressBarProps> = ({
  label,
  labelClassName,
  secondaryLabel,
  secondaryLabelClassName,
  totalLabel,
  total,
  className,
  series,
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const resolvedSeries = useMemo(() => {
    const palette = getColorPalette(series.length, "bg");
    return series.map((s, i) => ({ ...s, color: s.color ?? palette[i] }));
  }, [series]);

  const defaultTotal = total || 1;
  const totalValue = resolvedSeries.reduce(
    (acc, curr) => acc + (curr.value > 0 ? curr.value : 0),
    0,
  );
  const normalizationFactor =
    totalValue > defaultTotal ? defaultTotal / totalValue : 1;

  const labelClasses =
    labelClassName ||
    "text-sm font-semibold text-neutral-800 dark:text-neutral-200";
  const secondaryLabelClasses =
    secondaryLabelClassName ||
    "text-xs text-neutral-500 dark:text-neutral-400 mt-0.5";

  let cumulativePct = 0;
  const segments = resolvedSeries
    .filter((s) => s.value > 0)
    .map((s) => {
      const pct = Math.min(
        100,
        ((s.value * normalizationFactor) / defaultTotal) * 100,
      );
      const centerPct = cumulativePct + pct / 2;
      cumulativePct += pct;
      return { ...s, pct, centerPct };
    });

  const handleSegmentEnter = (key: string, e: React.MouseEvent) => {
    setHoveredKey(key);
    setTooltip({ key, x: e.clientX, y: e.clientY });
  };

  const handleSegmentMove = (key: string, e: React.MouseEvent) => {
    setTooltip({ key, x: e.clientX, y: e.clientY });
  };

  const handleSegmentLeave = () => {
    setHoveredKey(null);
    setTooltip(null);
  };

  const tooltipSegment = tooltip
    ? segments.find((s) => s.key === tooltip.key)
    : null;

  return (
    <div className={classNames(className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col">
          <span className={classNames(labelClasses)}>{label}</span>
          {secondaryLabel && (
            <span className={classNames(secondaryLabelClasses)}>
              {secondaryLabel}
            </span>
          )}
        </div>
        {totalLabel && (
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {totalLabel}
          </span>
        )}
      </div>

      {/* Bar */}
      <div ref={barRef} className="relative py-2">
        <div className="h-2.5 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 shadow-inner">
          <div className="flex h-full w-full">
            {segments.map((s) => {
              const isActive = hoveredKey === s.key;
              const isDimmed = hoveredKey !== null && !isActive;
              return (
                <div
                  key={s.key}
                  className={classNames(
                    "h-full cursor-pointer transition-all duration-200 ease-out",
                    s.color,
                    isActive && "brightness-110",
                    isDimmed && "opacity-25",
                  )}
                  style={{ width: `${s.pct}%` }}
                  onMouseEnter={(e) => handleSegmentEnter(s.key, e)}
                  onMouseMove={(e) => handleSegmentMove(s.key, e)}
                  onMouseLeave={handleSegmentLeave}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Tooltip — rendered in a portal so no ancestor overflow:hidden can clip it */}
      {tooltip &&
        tooltipSegment &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, calc(-100% - 12px))",
            }}
          >
            <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl ring-1 ring-black/10 dark:ring-black/5">
              <p className="font-semibold leading-tight">
                {tooltipSegment.label}
              </p>
              <p className="text-neutral-400 dark:text-neutral-500 mt-0.5">
                {tooltipSegment.displayValue ?? tooltipSegment.value}
                <span className="mx-1 opacity-40">·</span>
                {tooltipSegment.pct.toFixed(1)}%
              </p>
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-neutral-900 dark:border-t-white" />
          </div>,
          document.body,
        )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1">
        {resolvedSeries.map((s) => {
          const isActive = hoveredKey === s.key;
          const isDimmed = hoveredKey !== null && !isActive;

          return (
            <span
              key={s.key}
              className={classNames(
                "flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none",
                "text-xs transition-all duration-200",
                isActive
                  ? "text-neutral-800 dark:text-neutral-100"
                  : isDimmed
                    ? "text-neutral-300 dark:text-neutral-600"
                    : "text-neutral-500 dark:text-neutral-400",
              )}
              onMouseEnter={() => setHoveredKey(s.key)}
              onMouseLeave={() => setHoveredKey(null)}
            >
              {/* Dot — grows and glows on hover */}
              <span
                className={classNames(
                  "inline-block rounded-full transition-all duration-200",
                  s.color,
                  isActive ? "w-3 h-3 shadow-md brightness-110" : "w-2 h-2",
                  isDimmed && "opacity-30",
                )}
              />
              {/* Value */}
              <span
                className={classNames(
                  "font-semibold transition-colors duration-200",
                  isActive
                    ? "text-neutral-900 dark:text-neutral-50"
                    : isDimmed
                      ? "text-neutral-300 dark:text-neutral-600"
                      : "text-neutral-700 dark:text-neutral-300",
                )}
              >
                {s.displayValue ?? s.value}
              </span>
              {s.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default MultiProgressBar;
