import React from "react";

export interface AppDividerProps {
  /** Height of the divider in pixels or as CSS value */
  height?: number | string;
  /** Width of the divider in pixels */
  width?: number;
  /** Margin around the divider */
  margin?: number | string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A vertical divider for separating header sections
 */
export const AppDivider: React.FC<AppDividerProps> = ({ className = "" }) => {
  return (
    <div className={`flex h-[75%] items-center ${className}`}>
      <div className={`h-6 w-[1.2px] bg-neutral-300 dark:bg-neutral-700 ${className}-line`}></div>
    </div>
  );
};

export default AppDivider;
