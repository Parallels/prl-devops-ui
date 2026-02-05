import classNames from "classnames";
import React, { type ForwardedRef, type ReactNode, type SelectHTMLAttributes, forwardRef, useMemo } from "react";
import { useIconRenderer } from "../contexts/IconContext";
import type { ThemeColor } from "../theme/Theme";

type SelectSize = "sm" | "md" | "lg";
type SelectValidationStatus = "none" | "error" | "success";

const sizeStyles: Record<
  SelectSize,
  {
    select: string;
    iconSize: string;
    iconRight: string;
  }
> = {
  sm: {
    select: "px-3 py-1.5 text-sm pr-9",
    iconSize: "h-4 w-4",
    iconRight: "right-3",
  },
  md: {
    select: "px-3.5 py-2.5 text-sm pr-10",
    iconSize: "h-5 w-5",
    iconRight: "right-3.5",
  },
  lg: {
    select: "px-4 py-3 text-base pr-11",
    iconSize: "h-5 w-5",
    iconRight: "right-4",
  },
};

type SelectToneTokens = {
  focusRing: string;
  icon: string;
};

const toneTokens: Partial<Record<ThemeColor, SelectToneTokens>> = {
  indigo: {
    focusRing: "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/60",
    icon: "text-indigo-500 dark:text-indigo-300",
  },
  blue: {
    focusRing: "focus:border-blue-400 focus:ring-2 focus:ring-blue-400/60",
    icon: "text-blue-500 dark:text-blue-300",
  },
  emerald: {
    focusRing: "focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/60",
    icon: "text-emerald-500 dark:text-emerald-300",
  },
  amber: {
    focusRing: "focus:border-amber-400 focus:ring-2 focus:ring-amber-400/60",
    icon: "text-amber-500 dark:text-amber-300",
  },
  rose: {
    focusRing: "focus:border-rose-400 focus:ring-2 focus:ring-rose-400/60",
    icon: "text-rose-500 dark:text-rose-300",
  },
  slate: {
    focusRing: "focus:border-slate-500 focus:ring-2 focus:ring-slate-500/60",
    icon: "text-slate-500 dark:text-slate-200",
  },
  white: {
    focusRing: "focus:border-slate-400 focus:ring-2 focus:ring-slate-400/60",
    icon: "text-slate-400 dark:text-slate-200",
  },
  theme: {
    focusRing: "focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/60 dark:focus:border-neutral-500 dark:focus:ring-neutral-500/60",
    icon: "text-neutral-500 dark:text-neutral-300",
  },
  brand: {
    focusRing: "focus:border-blue-400 focus:ring-2 focus:ring-blue-400/60",
    icon: "text-blue-500 dark:text-blue-300",
  },
  success: {
    focusRing: "focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/60",
    icon: "text-emerald-500 dark:text-emerald-300",
  },
  warning: {
    focusRing: "focus:border-amber-400 focus:ring-2 focus:ring-amber-400/60",
    icon: "text-amber-500 dark:text-amber-300",
  },
  danger: {
    focusRing: "focus:border-rose-400 focus:ring-2 focus:ring-rose-400/60",
    icon: "text-rose-500 dark:text-rose-300",
  },
  info: {
    focusRing: "focus:border-sky-400 focus:ring-2 focus:ring-sky-400/60",
    icon: "text-sky-500 dark:text-sky-300",
  },
  neutral: {
    focusRing: "focus:border-slate-500 focus:ring-2 focus:ring-slate-500/60",
    icon: "text-slate-500 dark:text-slate-200",
  },
};

const statusClasses: Record<Exclude<SelectValidationStatus, "none">, string> = {
  error: "border-rose-500 focus:border-rose-500 focus:ring-rose-500/60 text-neutral-900 dark:border-rose-400 dark:focus:border-rose-400 dark:focus:ring-rose-400/60 dark:text-neutral-100",
  success:
    "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/60 text-neutral-900 dark:border-emerald-400 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/60 dark:text-neutral-100",
};

const disabledClasses =
  "disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:shadow-none dark:disabled:border-neutral-700 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500";

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size" | "color"> {
  size?: SelectSize;
  tone?: ThemeColor;
  validationStatus?: SelectValidationStatus;
  placeholder?: ReactNode;
  leadingIcon?: string | React.ReactElement;
  hideCaret?: boolean;
  unstyled?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { size = "md", tone = "blue", validationStatus = "none", className, placeholder, leadingIcon, hideCaret = false, disabled, children, unstyled = false, multiple, ...rest },
  ref: ForwardedRef<HTMLSelectElement>,
) {
  const renderIcon = useIconRenderer();
  const sizeToken = sizeStyles[size] ?? sizeStyles.md;
  const tokens = (toneTokens[tone] ?? toneTokens.theme) as SelectToneTokens;
  const hasLeadingIcon = Boolean(leadingIcon);
  const showCaret = !hideCaret && !multiple;

  const renderVisual = (visual: string | React.ReactElement | undefined, iconClassName: string) => {
    if (!visual) {
      return null;
    }
    if (typeof visual === "string") {
      return renderIcon(visual, undefined, iconClassName);
    }
    if (React.isValidElement<{ className?: string }>(visual)) {
      return React.cloneElement(visual, {
        className: classNames(iconClassName, visual.props.className),
      });
    }
    return <span className={iconClassName}>{visual}</span>;
  };

  const baseClasses = classNames(
    "block w-full appearance-none text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500",
    multiple ? "py-2 pr-3" : sizeToken.select,
    !unstyled && "rounded-lg border border-neutral-300 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900",
    disabledClasses,
    className,
  );

  const statusClass = validationStatus !== "none" && !unstyled ? statusClasses[validationStatus] : undefined;

  const focusClass = !unstyled ? tokens.focusRing : "focus:ring-0 focus:border-transparent";

  const computed = classNames(baseClasses, focusClass, statusClass, multiple && "min-h-[3.25rem]");

  const caret = useMemo(
    () =>
      showCaret ? (
        <span className={classNames("pointer-events-none absolute inset-y-0 flex items-center", sizeToken.iconRight, tokens.icon)}>
          {renderIcon("ArrowDown", undefined, sizeToken.iconSize)}
        </span>
      ) : null,
    [showCaret, sizeToken.iconRight, sizeToken.iconSize, tokens.icon, renderIcon],
  );

  const leading = hasLeadingIcon ? (
    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400 dark:text-neutral-500">{renderVisual(leadingIcon, sizeToken.iconSize)}</span>
  ) : null;

  return (
    <span className="relative flex w-full items-center">
      {leading}
      <select
        ref={ref}
        className={classNames(computed, hasLeadingIcon && !multiple && "pl-9", showCaret && !multiple && "pr-10")}
        disabled={disabled}
        aria-invalid={validationStatus === "error" ? "true" : rest["aria-invalid"]}
        {...rest}
      >
        {placeholder !== undefined && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      {caret}
    </span>
  );
});

Select.displayName = "Select";

(Select as unknown as { __UI_SELECT?: boolean }).__UI_SELECT = true;

export default Select;
