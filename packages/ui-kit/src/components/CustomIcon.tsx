import React, { useMemo } from "react";
import { type IconName, iconRegistry } from "../icons/registry";
import { mergeClassTokens, hasExplicitSize } from "../utils/iconUtils";
import type { IconSize } from "../types/Icon";

export interface CustomIconProps {
  /** Name of the icon to display */
  icon: IconName;
  /** Alternative text for accessibility */
  alt?: string;
  /** Size of the icon in pixels */
  customSize?: number | string;
  /** Size of the icon: xs, sm, md, lg, xl */
  size?: IconSize;

  /** Additional CSS class names */
  className?: string;
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  /** Whether the icon should use color or be monochrome */
  colored?: boolean;
  /** Primary color to use for the icon */
  color?: string;
  /** Hover color for the icon */
  hoverColor?: string;

  /** @deprecated No longer used with component-based icons */
  forceSvg?: boolean;
}

const SIZE_CLASS_MAP: Record<IconSize, string> = {
  xs: "h-4 w-4",
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
  xl: "h-8 w-8",
};

export const CustomIcon: React.FC<CustomIconProps> = ({
  icon,
  alt = "",
  customSize = undefined,
  size = "md",
  className = "",
  onClick,
  colored = false,
  color,
  hoverColor
}) => {
  const IconComponent = iconRegistry[icon];

  const dimension = useMemo(() => {
    if (!customSize) {
      return undefined;
    }
    if (typeof customSize === "number") {
      return `${customSize}px`;
    }
    return customSize;
  }, [customSize]);

  const baseStyle = useMemo(() => {
    const style: React.CSSProperties = {};
    if (dimension) {
      style.width = dimension;
      style.height = dimension;
    }
    if (color && !colored) {
      (style as Record<string, string>)["--icon-color"] = color;
    }
    if (hoverColor && !colored) {
      (style as Record<string, string>)["--icon-hover-color"] = hoverColor;
    }
    return style;
  }, [dimension, color, hoverColor, colored]);

  const fallbackSizeClass = !dimension && !hasExplicitSize(className) ? SIZE_CLASS_MAP[size] : undefined;

  const iconClass = mergeClassTokens(
    "inline-flex items-center justify-center flex-shrink-0 [&>svg]:h-full [&>svg]:w-full",
    !colored ? "fill-current" : "",
    fallbackSizeClass,
    className,
  );

  if (!IconComponent) {
    console.warn(`Icon not found in registry: ${icon}`);
    return (
      <span
        className={`flex items-center justify-center rounded bg-neutral-100 text-xs font-bold uppercase text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 ${className}`}
        style={baseStyle}
        title={alt || icon}
        onClick={onClick}
      >
        {icon?.charAt(0) || "?"}
      </span>
    );
  }

  return (
    <span className={iconClass} style={baseStyle} title={alt || icon} onClick={onClick}>
      <IconComponent className="w-full h-full" aria-label={alt} />
    </span>
  );
};

export default CustomIcon;

