import React from "react";
import classNames from "classnames";
import StatTile from "./StatTile";
import type { StatTileProps } from "./StatTile";
import { CustomIcon } from "./CustomIcon";
import { type IconName } from "../icons/registry";
import type { ThemeColor } from "../theme";

export interface StatGoalItem {
  value: number;
  label: string;
  icon: IconName;
  color: ThemeColor;
  tooltip?: string;
}

export interface StatGoalTileProps extends Omit<StatTileProps, "body" | "value" | "subtitle"> {
  goals: StatGoalItem[];
}

const CircularProgress: React.FC<{
  value: number;
  color: ThemeColor;
  icon: IconName;
  size?: number;
  strokeWidth?: number;
}> = ({ value, color, icon, size = 56, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2 - 1;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  // Map theme colors to hex or specific tailwind classes for stroke
  // Since we can't easily adhere to "stroke-current" with dynamic colors in SVG stroke attribute without complex mapping or specific classes
  // We will use standard tailwind text classes on the SVG and use `stroke="currentColor"`

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full overflow-visible">
        {/* Background Circle */}
        <circle className="text-neutral-100 dark:text-neutral-800" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
        {/* Progress Circle */}
        <circle
          className={classNames(`text-${color}-500 transition-all duration-1000 ease-out`)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className={classNames(`absolute text-${color}-500`)}>
        <CustomIcon icon={icon} size="md" />
      </div>
    </div>
  );
};

const StatGoalTile: React.FC<StatGoalTileProps> = ({ goals, ...props }) => {
  return (
    <StatTile
      {...props}
      body={
        <div className="flex flex-col h-full justify-center">
          {goals.map((goal, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-4 py-3 first:pt-0 last:pb-0" title={goal.tooltip}>
                <CircularProgress value={goal.value} color={goal.color} icon={goal.icon} />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-white leading-none">{goal.value}%</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1">{goal.label}</span>
                </div>
              </div>
              {idx < goals.length - 1 && <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1 w-full" />}
            </React.Fragment>
          ))}
        </div>
      }
    />
  );
};

export default StatGoalTile;
