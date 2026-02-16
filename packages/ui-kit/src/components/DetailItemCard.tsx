import React, { useState, type ReactNode } from "react";
import Button from "./Button";

export interface DetailItemCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  badges?: ReactNode;
  children?: ReactNode;
  defaultExpanded?: boolean;
  onClick?: () => void;
  className?: string;
  badgesAlignment?: "bottom" | "right" | "bottom-end";
}

const DetailItemCard: React.FC<DetailItemCardProps> = ({
  title,
  subtitle,
  description,
  badges,
  children,
  defaultExpanded = false,
  onClick,
  className = "",
  badgesAlignment = "right",
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const hasDetails = !!children;

  const handleToggleExpand = (e: React.MouseEvent) => {
    if (hasDetails) {
      e.stopPropagation();
      setExpanded((prev) => !prev);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div className={`flex w-full flex-col gap-2.5 ${expanded ? "expanded" : ""} ${className}`} onClick={handleClick}>
      <div className="flex flex-1 flex-row items-center justify-between gap-1.5">
        {hasDetails && (
          <div className="flex-shrink-0">
            <Button
              variant="icon"
              className="h-6 w-6"
              onClick={handleToggleExpand}
              aria-expanded={expanded}
              aria-label={expanded ? "Collapse details" : "Expand details"}
            >
              <span
                className={`flex items-center justify-center text-lg font-bold transition-transform duration-200 ${expanded ? "rotate-0" : "rotate-0"}`}
              >
                {expanded ? "−" : "+"}
              </span>
            </Button>
          </div>
        )}
        <div className="flex flex-1 flex-col leading-normal">
          <div className="text-base font-normal text-neutral-900 dark:text-neutral-100">{title}</div>
          {subtitle && <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{subtitle}</div>}
          {description && <div className="text-xs text-neutral-500 dark:text-neutral-400">{description}</div>}
          {badgesAlignment == "bottom" && <div className="flex flex-row justify-start gap-px">{badges}</div>}
          {badgesAlignment == "bottom-end" && <div className="flex flex-row justify-end gap-px">{badges}</div>}
        </div>

        {badgesAlignment == "right" && <div className="flex flex-col justify-end gap-px">{badges}</div>}
      </div>

      {hasDetails && expanded && (
        <div className="flex flex-col gap-2.5 px-[30px] text-sm text-neutral-500 dark:text-neutral-400">{children}</div>
      )}
    </div>
  );
};

DetailItemCard.displayName = "DetailItemCard";

export default DetailItemCard;
