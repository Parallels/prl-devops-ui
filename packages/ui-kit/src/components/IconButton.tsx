import classNames from "classnames";
import React, { type ButtonHTMLAttributes, forwardRef } from "react";
import { type ButtonColor, type ButtonSize, type ButtonVariant } from "./Button";
import Spinner, { type SpinnerColor, type SpinnerSize } from "./Spinner";
import { useIconRenderer } from "../contexts/IconContext";
import { getButtonColorClasses } from "../theme/Theme";
import { iconAccentHover, iconAccentRing } from "../theme/ButtonTypes";
import type { IconSize } from "../types/Icon";

type IconButtonRounded = "md" | "lg" | "xl" | "full";

const sizeTokens: Record<
  ButtonSize,
  {
    button: string;
    icon: string;
    spinner: SpinnerSize;
  }
> = {
  xs: { button: "h-7 w-7 leading-none", icon: "h-4 w-4", spinner: "xs" },
  sm: { button: "h-8 w-8 leading-none", icon: "h-5 w-5", spinner: "xs" },
  md: { button: "h-10 w-10 leading-none", icon: "h-6 w-6", spinner: "sm" },
  lg: { button: "h-12 w-12 leading-none", icon: "h-7 w-7", spinner: "md" },
  xl: { button: "h-14 w-14 leading-none", icon: "h-8 w-8", spinner: "lg" },
};

const roundedMap: Record<IconButtonRounded, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

const baseClasses =
  "inline-flex items-center justify-center select-none transition-colors duration-150 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "color"> {
  icon: string | React.ReactElement;
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  rounded?: IconButtonRounded;
  customSizeClass?: string;
  iconClassName?: string;
  loading?: boolean;
  spinnerVariant?: "solid" | "segments";
  spinnerColor?: SpinnerColor;
  srLabel?: string;
  accent?: boolean;
  accentColor?: ButtonColor;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = "icon",
      color = "blue",
      size = "md",
      rounded = "full",
      customSizeClass,
      iconClassName,
      loading = false,
      spinnerVariant = "segments",
      spinnerColor,
      srLabel,
      accent = false,
      accentColor,
      className,
      disabled,
      ...rest
    },
    ref
  ) => {
    const renderIcon = useIconRenderer();
    const sizeConfig = sizeTokens[size] ?? sizeTokens.md;
    const baseColorClasses = getButtonColorClasses(variant, color);
    const accentTone = accentColor ?? color;
    const accentRing = iconAccentRing[accentTone] ?? iconAccentRing.blue;
    const accentHover = iconAccentHover[accentTone] ?? iconAccentHover.blue;
    const accentClasses = accent
      ? classNames("bg-transparent text-inherit hover:bg-transparent focus-visible:ring-2 focus-visible:ring-offset-2", accentRing, accentHover)
      : null;

    // When accent is off but accentColor is explicitly provided,
    // apply hover text color for non-solid variants (ghost, soft, outline, icon)
    const nonAccentHover = !accent && accentColor && variant !== "solid"
      ? iconAccentHover[accentColor] ?? null
      : null;

    const dimensionClass = customSizeClass ?? sizeConfig.button;
    const spinnerColorToken: SpinnerColor = spinnerColor ?? (color as SpinnerColor);

    const computedClassName = classNames(
      baseClasses,
      dimensionClass,
      roundedMap[rounded] ?? roundedMap.full,
      accentClasses ?? baseColorClasses,
      nonAccentHover,
      className
    );

    const iconContent = renderIcon(icon, size as IconSize, classNames("flex-shrink-0", sizeConfig.icon, iconClassName));

    // Pull aria-label and title out of rest so we can set them explicitly.
    // title falls back to aria-label → srLabel so the native browser tooltip
    // always shows the accessible label rather than the icon's own SVG title.
    const { "aria-label": ariaLabel, title, ...restProps } = rest;
    const computedAriaLabel = ariaLabel ?? srLabel;
    const computedTitle = title ?? computedAriaLabel;

    return (
      <button
        ref={ref}
        className={computedClassName}
        data-variant={variant}
        data-color={color}
        data-size={size}
        disabled={disabled || loading}
        aria-label={computedAriaLabel}
        title={computedTitle}
        {...restProps}
      >
        {loading ? <Spinner size={sizeConfig.spinner} color={spinnerColorToken} variant={spinnerVariant} aria-hidden="true" /> : iconContent}
        <span className="sr-only">{srLabel ?? rest["aria-label"] ?? "Icon button"}</span>
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export default IconButton;
