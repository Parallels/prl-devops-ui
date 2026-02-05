import classNames from "classnames";
import React, { forwardRef } from "react";
import Badge, { type BadgeProps } from "./Badge";
import IconButton, { type IconButtonProps } from "./IconButton";

type BadgePosition = "top-start" | "top-end" | "bottom-start" | "bottom-end";

const POSITION_CLASSES: Record<BadgePosition, string> = {
  "top-start": "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
  "top-end": "top-0 right-0 translate-x-1/2 -translate-y-1/2",
  "bottom-start": "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
  "bottom-end": "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
};

export interface BadgeIconProps extends IconButtonProps {
  /**
   * Optional custom badge node. When provided, overrides count/dot rendering.
   */
  badgeContent?: React.ReactNode;
  /**
   * Numeric badge count. Ignored when `badgeContent` is supplied.
   */
  badgeCount?: number;
  /**
   * Show a small dot indicator instead of a number. Ignored when `badgeContent` is supplied.
   */
  badgeDot?: boolean;
  /**
   * Tailwind position for the badge relative to the button.
   */
  badgePosition?: BadgePosition;
  /**
   * Additional props forwarded to the underlying `Badge`.
   */
  badgeProps?: Omit<BadgeProps, "count" | "dot">;
  /**
   * Extra class applied to the outer wrapper span.
   */
  wrapperClassName?: string;
  /**
   * Expands the control to fill the available width.
   */
  fullWidth?: boolean;
}

const shouldRenderBadge = ({
  badgeContent,
  badgeCount,
  badgeDot,
}: Pick<BadgeIconProps, "badgeContent" | "badgeCount" | "badgeDot">) => {
  if (badgeContent) {
    return true;
  }
  if (badgeDot) {
    return true;
  }
  if (typeof badgeCount === "number" && badgeCount !== 0) {
    return true;
  }
  return false;
};

const BadgeIcon = forwardRef<HTMLButtonElement, BadgeIconProps>(
  (
    {
      badgeContent,
      badgeCount,
      badgeDot = false,
      badgePosition = "top-end",
      badgeProps,
      wrapperClassName,
      className,
      fullWidth = false,
      ...iconButtonProps
    },
    ref
  ) => {
    const showBadge = shouldRenderBadge({ badgeContent, badgeCount, badgeDot });
    const badgeNode = badgeContent ?? (showBadge ? <Badge count={badgeCount} dot={badgeDot} {...badgeProps} /> : null);

    return (
      <span className={classNames("relative inline-flex", fullWidth && "w-full", wrapperClassName)}>
        <IconButton ref={ref} accent={true} className={classNames(fullWidth && "w-full", className)} {...iconButtonProps} />
        {showBadge && badgeNode && (
          <span className={classNames("pointer-events-none absolute", POSITION_CLASSES[badgePosition])}>{badgeNode}</span>
        )}
      </span>
    );
  }
);

BadgeIcon.displayName = "BadgeIcon";

export default BadgeIcon;
