import classNames from "classnames";
import React from "react";
import { getSpinnerColorTokens, type ThemeColor } from "../theme/Theme";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
export type SpinnerColor = ThemeColor;
export type SpinnerVariant = "solid" | "segments";
export type SpinnerThickness = "thin" | "normal" | "thick";

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  color?: SpinnerColor;
  variant?: SpinnerVariant;
  thickness?: SpinnerThickness;
  label?: string;
}

const sizeTokens: Record<SpinnerSize, { diameter: string; border: Record<SpinnerThickness, string> }> = {
  xs: {
    diameter: "h-4 w-4",
    border: { thin: "border", normal: "border-[2px]", thick: "border-[4px]" },
  },
  sm: {
    diameter: "h-5 w-5",
    border: { thin: "border-[1.5px]", normal: "border-2", thick: "border-[4px]" },
  },
  md: {
    diameter: "h-6 w-6",
    border: { thin: "border-3", normal: "border-[3.5px]", thick: "border-[4.5px]" },
  },
  lg: {
    diameter: "h-8 w-8",
    border: { thin: "border-[3.5px]", normal: "border-[4px]", thick: "border-[5px]" },
  },
  xl: {
    diameter: "h-10 w-10",
    border: { thin: "border-[4px]", normal: "border-[4.5px]", thick: "border-[5.5px]" },
  },
};

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ size = "md", color = "blue", variant = "solid", thickness = "normal", label, className, ...rest }, ref) => {
    const sizeStyles = sizeTokens[size] ?? sizeTokens.md;
    const borderThickness = sizeStyles.border[thickness] ?? sizeStyles.border.thin;
    const colorStyles = getSpinnerColorTokens(color);

    const spinnerBase = classNames(
      "inline-flex rounded-full border-solid border-transparent",
      sizeStyles.diameter,
      borderThickness,
      className
    );

    const spinnerClass = classNames(
      spinnerBase,
      "transition-all duration-150 ease-in-out",
      variant === "segments"
        ? ["animate-[spin_1s_linear_infinite]", ...colorStyles]
        : ["animate-spin", colorStyles[0]]
    );

    return (
      <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
        <span ref={ref} className={spinnerClass} {...rest} />
        {label && <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{label}</span>}
        <span className="sr-only">{label ?? "Loading"}</span>
      </span>
    );
  }
);

Spinner.displayName = "Spinner";

export default Spinner;
