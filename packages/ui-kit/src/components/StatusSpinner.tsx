import classNames from "classnames";
import React from "react";

export type StatusSpinnerIntent = "neutral" | "info" | "success" | "warning" | "danger";
export type StatusSpinnerSize = "xs" | "sm" | "md" | "lg";

const SIZE_TOKENS: Record<StatusSpinnerSize, { wrapper: string; dot: string; border: string }> = {
  xs: { wrapper: "h-4 w-4", dot: "h-1.5 w-1.5", border: "border-[1.5px]" },
  sm: { wrapper: "h-5 w-5", dot: "h-2 w-2", border: "border-[2px]" },
  md: { wrapper: "h-6 w-6", dot: "h-2.5 w-2.5", border: "border-[2.5px]" },
  lg: { wrapper: "h-8 w-8", dot: "h-3 w-3", border: "border-[3px]" },
};

const INTENT_TOKENS: Record<StatusSpinnerIntent, { dot: string; accent: string; track: string }> = {
  neutral: {
    dot: "bg-slate-400 shadow-[0_0_6px_rgba(148,163,184,0.55)] dark:bg-slate-300",
    accent: "rgb(148,163,184)",
    track: "rgba(148,163,184,0.25)",
  },
  info: {
    dot: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.65)]",
    accent: "rgb(56,189,248)",
    track: "rgba(56,189,248,0.25)",
  },
  success: {
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.65)]",
    accent: "rgb(16,185,129)",
    track: "rgba(16,185,129,0.23)",
  },
  warning: {
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
    accent: "rgb(251,191,36)",
    track: "rgba(251,191,36,0.3)",
  },
  danger: {
    dot: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]",
    accent: "rgb(251,113,133)",
    track: "rgba(251,113,133,0.28)",
  },
};

export interface StatusSpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  intent?: StatusSpinnerIntent;
  size?: StatusSpinnerSize;
  animated?: boolean;
  label?: string;
}

const StatusSpinner = React.forwardRef<HTMLSpanElement, StatusSpinnerProps>(
  ({ intent = "info", size = "md", animated = true, label, className, ...rest }, ref) => {
    const palette = INTENT_TOKENS[intent] ?? INTENT_TOKENS.info;
    const sizeToken = SIZE_TOKENS[size] ?? SIZE_TOKENS.md;

    const spinnerStyle: React.CSSProperties = animated
      ? {
          borderTopColor: palette.accent,
          borderRightColor: palette.track,
          borderBottomColor: palette.track,
          borderLeftColor: palette.track,
        }
      : {
          borderColor: palette.track,
        };

    return (
      <span ref={ref} className={classNames("inline-flex items-center gap-2", className)} {...rest}>
        <span
          className={classNames("relative inline-flex shrink-0 items-center justify-center", sizeToken.wrapper)}
          role="status"
          aria-live="polite"
        >
          <span
            className={classNames(
              "absolute inset-0 rounded-full border-solid border-transparent transition-all duration-200 ease-out",
              sizeToken.border,
              animated && "animate-spin motion-reduce:animate-none"
            )}
            style={spinnerStyle}
          />
          <span
            className={classNames(
              "relative rounded-full ring-1 ring-white/40 transition-shadow duration-200 dark:ring-black/40",
              sizeToken.dot,
              palette.dot
            )}
          />
        </span>
        {label && <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">{label}</span>}
        <span className="sr-only">{label ?? "Loading status"}</span>
      </span>
    );
  }
);

StatusSpinner.displayName = "StatusSpinner";

export default StatusSpinner;
