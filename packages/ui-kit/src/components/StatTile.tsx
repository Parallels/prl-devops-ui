import React from "react";
import classNames from "classnames";
import { Panel, Loader } from ".";
import { getStatTileColorClasses, type ThemeColor } from "../theme";
import { CustomIcon } from "./CustomIcon";
import { type IconName } from "../icons/registry";

export interface StatTileTrend {
  value: string | number;
  direction: "up" | "down" | "neutral";
  label?: string;
}

export interface StatTileMeta {
  text: React.ReactNode;
  icon?: IconName;
  variant?: "text" | "badge";
  color?: ThemeColor;
}

export interface StatTileError {
  icon?: IconName;
  message?: string;
  onRetry?: () => void;
}

export interface StatTileProgress {
  value: number;
  label?: string;
  color?: ThemeColor;
}

export interface StatTileProps {
  title?: React.ReactNode;
  value?: React.ReactNode;
  subtitle?: React.ReactNode;
  body?: React.ReactNode;
  icon?: IconName;
  color?: ThemeColor;
  trend?: StatTileTrend;
  progress?: StatTileProgress;
  meta?: StatTileMeta[];
  footer?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  withDecoration?: boolean;
  withHoverEffect?: boolean;
  textColor?: ThemeColor;
  loading?: boolean;
  spinnerVariant?: "solid" | "segments";
  spinnerThickness?: "thin" | "normal" | "thick";
  spinnerColor?: ThemeColor;
  error?: StatTileError | null;
}

const StatTile: React.FC<StatTileProps> = ({
  title,
  value,
  subtitle,
  body,
  icon,
  color = "blue",
  trend,
  progress,
  meta,
  footer,
  actions,
  className,
  onClick,
  withDecoration = false,
  withHoverEffect = false,
  textColor,
  loading = false,
  spinnerVariant,
  spinnerThickness,
  spinnerColor,
  error,
}) => {
  const styles = getStatTileColorClasses(color);
  const showDecoration = withDecoration || !!icon;
  const effectiveTextColor = textColor || "neutral";

  // Determine value text color: use trend color if no textColor is set and trend exists
  const getValueTextColor = () => {
    if (textColor) {
      return `text-${textColor}-700 dark:text-${textColor}-100`;
    }
    if (trend) {
      if (trend.direction === "up") {
        return "text-emerald-700 dark:text-emerald-400";
      } else if (trend.direction === "down") {
        return "text-rose-700 dark:text-rose-400";
      }
    }
    return "text-neutral-600 dark:text-neutral-400";
  };

  return (
    <Panel
      variant="default"
      corner="rounded"
      padding="none"
      flexBody={true}
      className={classNames("relative overflow-hidden transition-all duration-200", className, {
        "cursor-pointer": !!onClick,
        "hover:shadow-md": !!onClick && !withHoverEffect,
        "hover:-translate-y-1 hover:shadow-lg": withHoverEffect,
      })}
      onClick={onClick}
    >
      {/* Loading Overlay */}
      {loading && (
        <Loader overlay={true} glass={true} size="md" color={spinnerColor || "blue"} spinnerVariant={spinnerVariant || "segments"} spinnerThickness={spinnerThickness || "normal"} variant="spinner" />
      )}

      {/* Decorative Corner & Icon */}
      {showDecoration && (
        <div
          className={classNames("absolute -top-px -right-px w-24 h-24 rounded-bl-[100px] pointer-events-none transition-colors duration-200 z-0 flex items-start justify-end p-5", styles.decorationBg)}
        >
          {icon && (
            <div className={classNames("z-10 mt-px mr-px", styles.iconColor)}>
              <CustomIcon icon={icon} size="lg" />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex flex-col h-full relative z-10">
        {(!body || title || actions) && (
          <div
            className={classNames(
              "flex justify-between items-start min-h-[28px]",
              !showDecoration ? `mb-3 pb-2 border-b-2 border-${effectiveTextColor}-100 dark:border-${effectiveTextColor}-800` : "mb-2",
            )}
          >
            <div className={classNames("flex-1 min-w-0", showDecoration ? "pr-12" : "")}>
              <h3
                className={classNames(
                  "text-sm font-medium uppercase tracking-wide line-clamp-2",
                  textColor ? `text-${textColor}-500 dark:text-${textColor}-400` : "text-neutral-500 dark:text-neutral-400",
                )}
              >
                {title}
              </h3>
            </div>
            {actions && <div className="flex-none -mr-1">{actions}</div>}
          </div>
        )}

        {/* Error State */}
        {error ? (
          <div className="flex flex-col items-center justify-center flex-grow py-2 text-center">
            {error.icon && (
              <div className="text-rose-500 mb-2">
                <CustomIcon icon={error.icon} size="md" />
              </div>
            )}
            <p className={classNames("text-sm text-neutral-600 dark:text-neutral-400", error.onRetry ? "mb-3" : "")}>{error.message || "Failed to load data"}</p>
            {error.onRetry && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  error.onRetry?.();
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline focus:outline-none"
              >
                Try Again
              </button>
            )}
          </div>
        ) : body ? (
          body
        ) : (
          <>
            <div className={classNames("mt-1 mb-4 transition-all duration-500 ease-out delay-75", loading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0")}>
              <div className="flex items-baseline gap-3">
                <span className={classNames("text-3xl font-bold tracking-tight translate-y-[3px]", getValueTextColor())}>{value}</span>
                {trend && (
                  <div
                    className={classNames(
                      "flex items-center justify-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full",
                      trend.direction === "up"
                        ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10"
                        : trend.direction === "down"
                          ? "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10"
                          : "text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-800",
                    )}
                  >
                    <CustomIcon icon={(trend.direction === "up" ? "ArrowUp" : trend.direction === "down" ? "ArrowDown" : "Equal") as IconName} size="xs" />
                    <span className="translate-y-[0.5px]">{trend.value}</span>
                  </div>
                )}
              </div>
              {trend?.label && <div className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">{trend.label}</div>}
              {subtitle && <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</div>}
            </div>

            {/* Progress Bar */}
            {progress !== undefined && (
              <div className="mt-auto pt-2">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-neutral-600 dark:text-neutral-300">{progress.label || "Progress"}</span>
                  <span className="text-neutral-500">{progress.value}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className={classNames(
                      "h-full rounded-full transition-all duration-500",
                      // Let's use simpler map:
                      progress.color === "brand" ? "bg-blue-500" : progress.color ? `bg-${progress.color}-500` : `bg-${color}-500`,
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, progress.value))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Meta Items or Footer */}
            {(meta || footer) && (
              <div className={classNames("mt-4 pt-4 border-t", styles.divider)}>
                {meta && (
                  <div className="flex flex-wrap gap-3">
                    {meta.map((item, idx) => (
                      <div key={idx} className="flex items-center text-sm text-neutral-600 dark:text-neutral-300">
                        {item.icon && <CustomIcon icon={item.icon} size="sm" className="mr-1.5 text-neutral-400" />}
                        {item.text}
                      </div>
                    ))}
                  </div>
                )}
                {footer && <div className="mt-2">{footer}</div>}
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  );
};

export default StatTile;
