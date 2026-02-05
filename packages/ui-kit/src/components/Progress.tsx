import React from "react";
import classNames from "classnames";
import { type SpinnerColor } from "./Spinner";
import { getLoaderProgressColors } from "../theme/Theme";

export type ProgressSize = "xs" | "sm" | "md" | "lg";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  size?: ProgressSize;
  color?: SpinnerColor;
  showShimmer?: boolean;
}

const heightTokens: Record<ProgressSize, string> = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, size = "md", color = "blue", showShimmer = true, className, ...rest }, ref) => {
    const clamped = Math.min(100, Math.max(0, Math.round(value)));
    const palette = getLoaderProgressColors(color);
    const trackHeight = heightTokens[size] ?? heightTokens.md;

    return (
      <div
        ref={ref}
        className={classNames("relative w-full overflow-hidden rounded-full shadow-inner", trackHeight, palette.track, className)}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        {...rest}
      >
        <div
          className={classNames("relative h-full overflow-hidden rounded-full transition-all duration-300 ease-out", palette.bar)}
          style={{ width: `${clamped}%` }}
        >
          {showShimmer && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-70 mix-blend-screen animate-[loader-wipe_1.8s_linear_infinite]" />
          )}
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

export default Progress;
