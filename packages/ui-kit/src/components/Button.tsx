import React, { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";
import classNames from "classnames";
import { type IconSize } from "../types/Icon";
import { useIconRenderer } from "../contexts/IconContext";
import { getButtonColorClasses, type ThemeColor } from "../theme/Theme";
import { iconAccentHover, iconAccentRing } from "../theme/ButtonTypes";

export type ButtonColor = ThemeColor;
export type ButtonVariant = "solid" | "soft" | "outline" | "ghost" | "link" | "clear" | "icon";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ButtonWeight = "normal" | "medium" | "semibold" | "bold";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  color?: ThemeColor;
  size?: ButtonSize;
  weight?: ButtonWeight;
  fullWidth?: boolean;
  leadingIcon?: string | React.ReactElement;
  trailingIcon?: string | React.ReactElement;
  loading?: boolean;
  iconOnly?: boolean;
  accent?: boolean;
  accentColor?: ThemeColor;
  className?: string;
  children?: ReactNode;
}

const baseClasses =
  "inline-flex items-center justify-center rounded-md transition-colors duration-150 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 select-none";

const sizeStyles: Record<ButtonSize, { base: string; iconOnly: string; gap: string; icon: string; spinner: string }> = {
  xs: {
    base: "px-2 py-1 text-xs",
    iconOnly: "p-1.5 text-xs",
    gap: "gap-1.5",
    icon: "h-4 w-4",
    spinner: "h-4 w-4",
  },
  sm: {
    base: "px-3 py-2 text-xs",
    iconOnly: "p-2 text-xs",
    gap: "gap-1.5",
    icon: "h-5 w-5",
    spinner: "h-4 w-4",
  },
  md: {
    base: "px-3.5 py-2.5 text-sm",
    iconOnly: "p-2.5 text-sm",
    gap: "gap-2",
    icon: "h-6 w-6",
    spinner: "h-6 w-6",
  },
  lg: {
    base: "px-4 py-2.5 text-base",
    iconOnly: "p-3 text-base",
    gap: "gap-2.5",
    icon: "h-7 w-7",
    spinner: "h-7 w-7",
  },
  xl: {
    base: "px-5 py-3 text-base",
    iconOnly: "p-3.5 text-base",
    gap: "gap-3",
    icon: "h-8 w-8",
    spinner: "h-8 w-8",
  },
};

const weightClasses: Record<ButtonWeight, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "solid",
      color = "brand",
      size = "md",
      weight = "normal",
      fullWidth = false,
      leadingIcon,
      trailingIcon,
      loading = false,
      iconOnly = false,
      accent = false,
      accentColor,
      className,
      children,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const renderIcon = useIconRenderer();
    const sizeConfig = sizeStyles[size] ?? sizeStyles.md;
    const colorClasses = getButtonColorClasses(variant, color);
    const isIconMode = iconOnly || variant === "icon";
    const accentTone = accentColor ?? color;
    const accentRingClass = iconAccentRing[accentTone] ?? iconAccentRing.indigo;
    const accentHoverClass = iconAccentHover[accentTone] ?? iconAccentHover.indigo;
    const accentClasses =
      isIconMode && accent
        ? classNames(
            "bg-transparent text-inherit hover:bg-transparent focus-visible:ring-2 focus-visible:ring-offset-2",
            accentRingClass,
            accentHoverClass
          )
        : null;

    const computedClassName = classNames(
      baseClasses,
      sizeConfig.gap,
      isIconMode ? sizeConfig.iconOnly : sizeConfig.base,
      accentClasses ?? colorClasses,
      weightClasses[weight],
      fullWidth && "w-full",
      className
    );

    const spinner = (
      <span
        className={classNames("inline-flex animate-spin rounded-full border-2 border-current border-t-transparent", sizeConfig.spinner)}
        aria-hidden="true"
      />
    );

    const isDisabled = disabled ?? false;
    const ariaLabel = (props as { "aria-label"?: string })["aria-label"];
    const srOnlyContent = typeof children === "string" ? children : ariaLabel ? ariaLabel : undefined;

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
    };

    return (
      <button
        ref={ref}
        className={computedClassName}
        disabled={isDisabled || loading}
        data-variant={variant}
        data-color={color}
        data-size={size}
        aria-busy={loading || undefined}
        onClick={handleClick}
        {...props}
      >
        {loading ? spinner : renderIcon(leadingIcon, size as IconSize, classNames(" flex-shrink-0", sizeConfig.icon))}
        {isIconMode ? <span className="sr-only">{srOnlyContent ?? "Button"}</span> : children}
        {!loading && renderIcon(trailingIcon, size as IconSize, classNames("flex-shrink-0", sizeConfig.icon))}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
