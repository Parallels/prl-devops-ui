import React from "react";
import classNames from "classnames";
import { useIconRenderer } from "../contexts/IconContext";
import { type ThemeColor, getAlertColorClasses } from "../theme/Theme";

export type AlertVariant = "subtle" | "solid" | "outline";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: ThemeColor;
  variant?: AlertVariant;
  title?: string;
  description?: string;
  icon?: string | React.ReactElement | false;
  actions?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const defaultIcons: Partial<Record<ThemeColor, string>> = {
  neutral: "Info",
  info: "Info",
  success: "CheckCircle",
  warning: "Chat",
  danger: "Error",
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      tone = "neutral",
      variant = "subtle",
      title,
      description,
      icon,
      actions,
      dismissible = false,
      onDismiss,
      className,
      ...rest
    },
    ref
  ) => {
    const renderIcon = useIconRenderer();
    const tokens = getAlertColorClasses(tone);
    const base = classNames(
      "relative flex w-full gap-3 rounded-2xl border px-4 py-3 shadow-sm transition",
      variant === "subtle" && tokens.subtle,
      variant === "solid" && tokens.solid,
      variant === "outline" && [tokens.outline, tokens.border],
      className
    );

    const resolvedIcon = icon === false ? null : icon ?? defaultIcons[tone];

    return (
      <div ref={ref} className={base} role="alert" {...rest}>
        {resolvedIcon && (
          <div className={classNames("flex-shrink-0 pt-1", tokens.icon)}>{renderIcon(resolvedIcon, "md")}</div>
        )}
        <div className="flex flex-1 flex-col gap-1 text-sm">
          {title && <div className="text-sm font-semibold leading-tight text-current">{title}</div>}
          {description && <div className={classNames("leading-relaxed", tokens.text)}>{description}</div>}
          {actions && <div className="pt-2 text-sm">{actions}</div>}
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className={classNames(
              "ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              tokens.dismiss
            )}
            aria-label="Dismiss alert"
          >
            {renderIcon("Close", "sm")}
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = "Alert";

export default Alert;
