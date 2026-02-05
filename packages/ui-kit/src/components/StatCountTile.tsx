import React from "react";
import classNames from "classnames";
import { getStatTileColorClasses, type ThemeColor } from "../theme";
import { Panel, Loader } from ".";
import { CustomIcon } from "./CustomIcon";
import { type IconName } from "../icons/registry";

export interface StatCountTileBreakdown {
  label: string;
  value: string | number;
  color?: ThemeColor;
}

export interface StatCountTileProps {
  title?: React.ReactNode;
  count?: React.ReactNode;
  breakdown?: StatCountTileBreakdown[];
  icon?: IconName;
  color?: ThemeColor;
  className?: string;
  onClick?: () => void;
  withDecoration?: boolean;
  withHoverEffect?: boolean;
  textColor?: ThemeColor;
  loading?: boolean;
  spinnerVariant?: "solid" | "segments";
  spinnerThickness?: "thin" | "normal" | "thick";
  spinnerColor?: ThemeColor;
  error?: {
    icon?: IconName;
    message?: string;
    onRetry?: () => void;
    variant?: "text" | "badge";
  } | null;
}

export const StatCountTile: React.FC<StatCountTileProps> = ({
  title,
  count,
  breakdown,
  icon,
  color = "blue",
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
        {/* Header */}
        <div
          className={classNames(
            "flex justify-between items-start min-h-[28px]",
            !showDecoration ? `mb-3 pb-2 border-b-2 border-${effectiveTextColor}-100 dark:border-${effectiveTextColor}-800` : "mb-4",
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
        </div>

        {/* Main Body */}
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
        ) : (
          <>
            <div className={classNames("mt-1 mb-6 transition-all duration-500 ease-out delay-75", loading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0")}>
              <span
                className={classNames(
                  "text-5xl font-black tracking-tight",
                  textColor
                    ? `text-${textColor}-700 dark:text-${textColor}-100`
                    : "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent",
                )}
              >
                {count}
              </span>
            </div>

            {/* Breakdown */}
            {breakdown && breakdown.length > 0 && (
              <div className="mt-auto space-y-3">
                {breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={classNames("font-semibold", item.color ? `text-${item.color}-600 dark:text-${item.color}-400` : "text-neutral-700 dark:text-neutral-200")}>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  );
};

export default StatCountTile;
