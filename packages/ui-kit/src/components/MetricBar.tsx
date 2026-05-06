import React from "react";
import classNames from "classnames";
import { Progress, SpinnerColor } from "./index";

export interface MetricBarProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  percentage: number;
  color?: SpinnerColor;
  showShimmer?: boolean;
}

export const MetricBar: React.FC<MetricBarProps> = ({
  label,
  value,
  percentage,
  color = "blue",
  showShimmer = false,
  className,
  ...rest
}) => {
  return (
    <div
      className={classNames("flex flex-col gap-1.5 w-full", className)}
      {...rest}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {label}
        </span>
        <span className="text-xs text-neutral-600 dark:text-neutral-300">
          {value}
        </span>
      </div>
      <Progress
        value={percentage}
        size="sm"
        color={color}
        showShimmer={showShimmer}
      />
    </div>
  );
};

MetricBar.displayName = "MetricBar";
export default MetricBar;
