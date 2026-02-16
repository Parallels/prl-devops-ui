import React from "react";
import classNames from "classnames";

import { type ThemeColor, getPillColorClasses } from "../theme/Theme";

export type PillVariant = "solid" | "soft" | "outline";
export type PillSize = "xs" | "sm" | "md" | "lg";
export type PillTone = ThemeColor;

const sizeStyles: Record<PillSize, string> = {
  xs: "text-[11px] h-4 px-2",
  sm: "text-[12px] h-5 px-2.5",
  md: "text-xs h-6 px-3",
  lg: "text-sm h-7 px-4",
};

export interface PillProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: PillTone;
  variant?: PillVariant;
  size?: PillSize;
  uppercase?: boolean;
  icon?: React.ReactNode;
  dot?: boolean;
}

export const Pill: React.FC<PillProps> = ({
  tone = "info",
  variant = "soft",
  size = "md",
  uppercase = false,
  icon,
  dot = false,
  className,
  children,
  ...rest
}) => {
  const toneTokens = getPillColorClasses(tone, variant);
  const sizeToken = sizeStyles[size];

  const pillClasses = classNames(
    "inline-flex items-center justify-center rounded-full  leading-none",
    sizeToken,
    toneTokens.base,
    toneTokens.border,
    uppercase && "uppercase tracking-wide",
    dot && "px-0 h-2 w-2 min-w-[0.5rem]",
    dot && "rounded-full",
    className
  );

  return (
    <span className={pillClasses} {...rest}>
      {icon && !dot ? <span className="mr-1.5 flex items-center text-inherit">{icon}</span> : null}
      {!dot ? children : null}
    </span>
  );
};

export default Pill;
