import React from "react";
import classNames from "classnames";
import { type SpinnerColor } from "./Spinner";
import { getLoaderProgressColors } from "../theme/Theme";
import "./progress-animations.css";

export type ProgressSize = "xs" | "sm" | "md" | "lg";
export type ProgressMotion = "none" | "shimmer" | "pulse" | "shimmer-pulse" | "stripes" | "stripes-shimmer";
export type ProgressMotionSpeed = "slow" | "normal" | "fast";
export type ProgressMotionDirection = "forward" | "reverse";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  size?: ProgressSize;
  color?: SpinnerColor;
  motion?: ProgressMotion;
  motionSpeed?: ProgressMotionSpeed;
  motionDirection?: ProgressMotionDirection;
  /**
   * @deprecated Use `motion="shimmer"` or `motion="none"` instead.
   */
  showShimmer?: boolean;
}

const heightTokens: Record<ProgressSize, string> = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

const speedSeconds: Record<ProgressMotionSpeed, string> = {
  slow:   "2.4s",
  normal: "1.8s",
  fast:   "1.2s",
};

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({
    value = 0,
    size = "md",
    color = "blue",
    motion,
    motionSpeed = "normal",
    motionDirection = "forward",
    showShimmer = true,
    className,
    ...rest
  }, ref) => {
    const clamped = Math.min(100, Math.max(0, Math.round(value)));
    const palette = getLoaderProgressColors(color);
    const trackHeight = heightTokens[size] ?? heightTokens.md;
    const resolvedMotion: ProgressMotion = motion ?? (showShimmer ? "shimmer" : "none");
    const showShimmerOverlay = resolvedMotion === "shimmer" || resolvedMotion === "shimmer-pulse" || resolvedMotion === "stripes-shimmer";
    const showStripesOverlay = resolvedMotion === "stripes" || resolvedMotion === "stripes-shimmer";
    const pulseBar = resolvedMotion === "pulse" || resolvedMotion === "shimmer-pulse";

    const duration = speedSeconds[motionSpeed] ?? speedSeconds.normal;
    const direction = motionDirection === "reverse" ? "reverse" : "normal";

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
          className={classNames(
            "relative h-full overflow-hidden rounded-full transition-[width] duration-300 ease-out",
            pulseBar && "animate-pulse",
            palette.bar
          )}
          style={{ width: `${clamped}%` }}
        >
          {showShimmerOverlay && (
            <span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              style={{
                animation: `progress-shimmer ${duration} linear infinite`,
                animationDirection: direction,
              }}
            />
          )}
          {showStripesOverlay && (
            <span
              className="absolute inset-0"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 12px, transparent 12px, transparent 24px)",
                backgroundSize: "34px 34px",
                animation: `progress-stripes ${duration} linear infinite`,
                animationDirection: direction,
              }}
            />
          )}
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

export default Progress;
