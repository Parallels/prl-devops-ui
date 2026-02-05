import type { ReactElement, ReactNode } from "react";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Base icon name type - apps can extend this with their own icon names
 */
export type BaseIconName = string;

/**
 * Icon renderer function type
 */
export type IconRenderer = (
  icon: BaseIconName | ReactElement | undefined,
  size: IconSize | undefined,
  className?: string
) => ReactNode;

/**
 * Default no-op icon renderer - returns null for string icons
 */
export const defaultIconRenderer: IconRenderer = (icon, _size, _className) => {
  if (!icon) return null;
  if (typeof icon === "string") {
    // Return a placeholder span for string icons when no renderer is configured
    return null;
  }
  // For React elements, return as-is
  return icon;
};
