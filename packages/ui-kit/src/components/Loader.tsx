import classNames from "classnames";
import React, { type ReactNode } from "react";
import Spinner, { type SpinnerColor, type SpinnerProps } from "./Spinner";
import Progress from "./Progress";

type LoaderVariant = "spinner" | "progress";
type LoaderSize = "sm" | "md" | "lg";
type GlassBlurIntensity = "none" | "low" | "medium" | "high";
type LoaderColor = SpinnerColor;

export interface LoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  color?: LoaderColor;
  spinnerVariant?: SpinnerProps["variant"];
  spinnerThickness?: SpinnerProps["thickness"];
  title?: ReactNode;
  label?: ReactNode;
  progress?: number;
  className?: string;
  overlay?: boolean;
  glass?: boolean;
  glassBlurIntensity?: GlassBlurIntensity;
}

const sizeMap: Record<
  LoaderSize,
  {
    spinner: SpinnerProps["size"];
    title: string;
    label: string;
  }
> = {
  sm: { spinner: "sm", title: "text-sm", label: "text-xs" },
  md: { spinner: "md", title: "text-base", label: "text-sm" },
  lg: { spinner: "lg", title: "text-lg", label: "text-sm" },
};

const Loader: React.FC<LoaderProps> = ({
  variant = "spinner",
  spinnerVariant = "segments",
  spinnerThickness = "normal",
  size = "md",
  color = "blue",
  title,
  label,
  progress = 0,
  className,
  overlay = false,
  glass = false,
  glassBlurIntensity = "medium",
}) => {
  const resolvedSize = sizeMap[size] ?? sizeMap.md;
  const blurIntensityMap: Record<GlassBlurIntensity, string> = {
    none: "backdrop-blur-none",
    low: "backdrop-blur-md",
    medium: "backdrop-blur-lg",
    high: "backdrop-blur-2xl",
  };
  const containerClass = classNames(
    "inline-flex flex-col items-center justify-center gap-3 text-center",
    overlay &&
      (glass
        ? `absolute inset-0 z-50 rounded-[inherit] bg-white/70 p-6 ${blurIntensityMap[glassBlurIntensity]} dark:bg-neutral-900/60`
        : `absolute inset-0 z-50 rounded-[inherit] bg-white/85 p-6 ${blurIntensityMap[glassBlurIntensity]} dark:bg-neutral-900/80`),
    className
  );

  const renderBody = () => {
    if (variant === "progress") {
      return (
        <div className="w-full min-w-[12rem] space-y-3">
          <Progress value={progress} size="md" color={color} />
        </div>
      );
    }

    return <Spinner size={resolvedSize.spinner} color={color} variant={spinnerVariant} thickness={spinnerThickness} />;
  };

  return (
    <div className={containerClass}>
      {title && <div className={classNames("font-semibold text-neutral-800 dark:text-neutral-100", resolvedSize.title)}>{title}</div>}
      {renderBody()}
      {label && <div className={classNames("text-neutral-600 dark:text-neutral-300", resolvedSize.label)}>{label}</div>}
    </div>
  );
};

export default Loader;
