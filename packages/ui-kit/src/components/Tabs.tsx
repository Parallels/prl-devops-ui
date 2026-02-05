import React, { type ReactNode, useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import { useIconRenderer } from "../contexts/IconContext";
import { getTabsColorTokens, type ThemeColor } from "../theme/Theme";
import IconButton from "./IconButton";
import { iconAccentActive } from "../theme/ButtonTypes";

export type TabsVariant = "underline" | "soft" | "pill" | "segmented" | "minimal";
export type TabsSize = "sm" | "md" | "lg";
export type TabsOrientation = "horizontal" | "vertical";
export type TabsJustify = "start" | "center" | "end" | "between";

export interface TabItemAction {
  id?: string;
  label?: ReactNode;
  icon: string | React.ReactElement;
  onClick: () => void;
  color?: ThemeColor;
  active?: boolean;
}

export interface TabItem {
  id: string;
  label: ReactNode;
  icon?: string | React.ReactElement;
  description?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
  panel?: ReactNode;
  actions?: TabItemAction[];
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string, item: TabItem) => void;
  variant?: TabsVariant;
  size?: TabsSize;
  color?: ThemeColor;
  orientation?: TabsOrientation;
  justify?: TabsJustify;
  fullWidth?: boolean;
  className?: string;
  listClassName?: string;
  allowReselect?: boolean;
  panelIdPrefix?: string;
  showDividers?: boolean;
  hideUnderlineContainer?: boolean;
  panelClassName?: string;
}

const joinClasses = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

const baseTabClasses =
  "group relative inline-flex items-center transition-all duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60";

const focusOffset = "focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-0";

const focusRing = (color: ThemeColor) => getTabsColorTokens(color).focusRing;

const sizeStyles: Record<TabsSize, { padding: string; text: string; gap: string; icon: string }> = {
  sm: {
    padding: "px-3 py-1.5",
    text: "text-sm font-medium",
    gap: "gap-1.5",
    icon: "h-4 w-4",
  },
  md: {
    padding: "px-4 py-2",
    text: "text-md",
    gap: "gap-2",
    icon: "h-5 w-5",
  },
  lg: {
    padding: "px-5 py-2.5",
    text: "text-base",
    gap: "gap-2.5",
    icon: "h-5 w-5",
  },
};

type VariantConfig = {
  container?: string;
  list?: string;
  base: string;
  active: string;
  inactive: string;
  disabled: string;
  badge?: string;
  badgeActive?: string;
  badgeInactive?: string;
};

const neutralTextInactive = "text-neutral-600 dark:text-neutral-300";

const buildVariantConfig = (
  variant: TabsVariant,
  color: ThemeColor,
  orientation: TabsOrientation,
  hideUnderlineContainer?: boolean
): VariantConfig => {
  const tokens = getTabsColorTokens(color);
  const hoverAccentText = tokens.hoverText;
  const activeAccentText = tokens.activeText;
  const activeOnAccent = tokens.onAccentText;
  const accentBgStrong = tokens.accentBg;
  const subtleBg = tokens.subtleBg;
  const subtleHoverBg = tokens.subtleHoverBg;
  const badgeSubtle = tokens.badgeSubtle;
  const badgeStrong = tokens.badgeStrong;
  const badgeOnAccent = tokens.badgeOnAccent;
  const underlineActive = tokens.underlineActive;
  const segmentedContainer = tokens.segmentedContainer;

  switch (variant) {
    case "soft":
      return {
        container: joinClasses("rounded-full", subtleBg, orientation === "vertical" ? "p-1.5" : "p-1"),
        list: "gap-1",
        base: joinClasses(
          "rounded-full font-medium",
          neutralTextInactive,
          hoverAccentText,
          "hover:bg-white/70 dark:hover:bg-white/10"
        ),
        active: joinClasses("shadow-sm", accentBgStrong, activeOnAccent),
        inactive: "",
        disabled: "text-slate-300 dark:text-slate-600",
        badge: badgeSubtle,
        badgeActive: badgeOnAccent,
        badgeInactive: badgeSubtle,
      };
    case "pill":
      return {
        container: "gap-2",
        list: "gap-2",
        base: joinClasses(
          "rounded-full border border-transparent font-medium",
          neutralTextInactive,
          hoverAccentText,
          "hover:border-current"
        ),
        active: joinClasses(accentBgStrong, activeOnAccent, "shadow-sm border-transparent"),
        inactive: "border-slate-200 dark:border-slate-700",
        disabled: "text-slate-300 dark:text-slate-600 border-transparent",
        badge: badgeSubtle,
        badgeActive: badgeOnAccent,
        badgeInactive: badgeSubtle,
      };
    case "segmented":
      return {
        container: joinClasses("rounded-lg border", segmentedContainer),
        list: classNames("gap-0 overflow-hidden", orientation === "vertical" ? "flex-col" : "flex-row"),
        base: joinClasses(
          "font-medium border border-transparent first:rounded-l-lg last:rounded-r-lg first:rounded-t-lg last:rounded-b-lg",
          neutralTextInactive,
          hoverAccentText,
          orientation === "horizontal" ? "-ml-px first:ml-0" : "-mt-px first:mt-0"
        ),
        active: joinClasses(accentBgStrong, activeOnAccent, "shadow-sm border-transparent dark:shadow-none"),
        inactive: joinClasses("bg-transparent", subtleHoverBg),
        disabled: "text-slate-300 dark:text-slate-600 border-transparent",
        badge: badgeSubtle,
        badgeActive: badgeOnAccent,
        badgeInactive: badgeSubtle,
      };
    case "minimal":
      return {
        container: "gap-2",
        list: "gap-0",
        base: joinClasses(
          "font-medium rounded-lg",
          neutralTextInactive,
          hoverAccentText,
          "hover:bg-neutral-900/5 dark:hover:bg-neutral-100/10",
          "px-2 py-1"
        ),
        active: joinClasses(activeAccentText, "font-medium "),
        inactive: "text-neutral-900/20 dark:text-neutral-500",
        disabled: "text-slate-300 dark:text-slate-600",
        badge: badgeSubtle,
        badgeActive: badgeStrong,
        badgeInactive: badgeSubtle,
      };
    case "underline":
    default:
      return {
        container: hideUnderlineContainer ? undefined : "border-b border-neutral-500 dark:border-neutral-700",
        list: classNames("gap-3", orientation === "vertical" && "gap-3"),
        base: joinClasses(
          "rounded-none font-medium",
          "pb-3 pt-2",
          "border-b-2 border-transparent",
          "after:absolute after:inset-x-1.5 after:bottom-0 after:h-[3px] after:rounded-full after:opacity-0 after:transition-all after:duration-200",
          tokens.underlineActive,
          "group-hover:after:opacity-100",
          neutralTextInactive,
          hoverAccentText
        ),
        active: joinClasses(activeAccentText, underlineActive),
        inactive: "",
        disabled: "text-slate-300 dark:text-slate-600 border-transparent",
        badge: badgeSubtle,
        badgeActive: badgeStrong,
        badgeInactive: badgeSubtle,
      };
  }
};

const Tabs: React.FC<TabsProps> = ({
  items,
  value,
  defaultValue,
  onChange,
  variant = "underline",
  size = "md",
  color = "blue",
  orientation = "horizontal",
  justify = "start",
  fullWidth = false,
  className,
  listClassName,
  allowReselect = false,
  panelIdPrefix = "tab-panel",
  showDividers = false,
  hideUnderlineContainer = false,
  panelClassName,
}) => {
  const renderIcon = useIconRenderer();
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue ?? items[0]?.id);
  const activeId = value ?? internalValue;

  useEffect(() => {
    if (value !== undefined) {
      return;
    }
    if (!items.some((item) => item.id === internalValue)) {
      setInternalValue(items[0]?.id);
    }
  }, [items, value, internalValue]);

  const config = useMemo(
    () => buildVariantConfig(variant, color, orientation, hideUnderlineContainer),
    [variant, color, orientation, hideUnderlineContainer]
  );

  const sizeConfig = sizeStyles[size] ?? sizeStyles.md;
  const iconClasses = classNames("flex-shrink-0", sizeConfig.icon);

  const shouldShowDividers = showDividers && (variant === "underline" || variant === "minimal");
  const baseList = classNames(
    "relative flex",
    orientation === "vertical" ? "flex-col" : "items-center",
    justify === "center" && orientation === "horizontal" && "justify-center",
    justify === "end" && orientation === "horizontal" && "justify-end",
    justify === "between" && orientation === "horizontal" && "justify-between w-full",
    fullWidth && "w-full",
    config.list,
    shouldShowDividers && "gap-0",
    listClassName
  );

  const rootClass = classNames(
    "tabs",
    "flex",
    orientation === "vertical" ? "flex-row h-full" : "flex-col h-full",
    "overflow-hidden min-h-0",
    config.container,
    className
  );

  const badgeBase = config.badge ?? "bg-slate-100 text-slate-600";
  const badgeActive = config.badgeActive ?? badgeBase;
  const badgeInactive = config.badgeInactive ?? badgeBase;

  const renderTabIcon = (icon: string | React.ReactElement | undefined) => {
    if (!icon) {
      return null;
    }

    if (typeof icon === "string") {
      return renderIcon(icon, undefined, iconClasses);
    }

    if (React.isValidElement<{ className?: string }>(icon)) {
      return React.cloneElement(icon, {
        className: classNames(iconClasses, icon.props.className),
      });
    }

    return <span className={iconClasses}>{icon}</span>;
  };

  return (
    <div className={rootClass}>
      <div role="tablist" aria-orientation={orientation} className={classNames(baseList, "flex-shrink-0 z-10")}>
        {items.map((item, index) => {
          const isActive = item.id === activeId;
          const isDisabled = item.disabled;
          const controlsId = `${panelIdPrefix}-${item.id}`;
          const baseClassesForItem = classNames(
            baseTabClasses,
            sizeConfig.padding,
            sizeConfig.text,
            sizeConfig.gap,
            focusRing(color),
            focusOffset,
            config.base,
            isActive ? config.active : config.inactive,
            isDisabled && config.disabled,
            fullWidth && "flex-1 justify-center"
          );
          const showDividerAfter = shouldShowDividers && index < items.length - 1;

          return (
            <React.Fragment key={item.id}>
              <button
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={isActive}
                aria-controls={controlsId}
                disabled={isDisabled}
                className={baseClassesForItem}
                onClick={() => {
                  if (isDisabled) {
                    return;
                  }
                  if (!allowReselect && item.id === activeId) {
                    return;
                  }
                  if (value === undefined) {
                    setInternalValue(item.id);
                  }
                  onChange?.(item.id, item);
                }}
                tabIndex={isActive ? 0 : -1}
              >
                {renderTabIcon(item.icon)}
                <span className="flex min-w-0 flex-col text-left">
                  <span className="truncate">{item.label}</span>
                  {item.description ? (
                    <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.description}</span>
                  ) : null}
                </span>
                {item.badge ? (
                  <span
                    className={classNames(
                      "ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      isActive ? badgeActive : badgeInactive
                    )}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
              {showDividerAfter ? (
                <span
                  aria-hidden="true"
                  className={classNames(
                    "pointer-events-none",
                    orientation === "vertical"
                      ? "mx-0 my-2 h-[2px] rounded-full w-full bg-slate-200 dark:bg-neutral-100/2"
                      : "mx-2 h-5 rounded-full w-[2px] bg-slate-300 dark:bg-neutral-400"
                  )}
                />
              ) : null}
            </React.Fragment>
          );
        })}
        <div className="flex-grow" />
        <div id="tab-item-actions-end" className="flex items-center text-neutral-400 dark:text-neutral-500">
          {items
            .find((item) => item.id === activeId)
            ?.actions?.map((action, idx) => (
              <IconButton
                key={`tab-action-${idx}`}
                accent={true}
                color={action.color ?? color}
                accentColor={action.color ?? color}
                icon={action.icon}
                size={size}
                aria-pressed={action.active || undefined}
                aria-label={typeof action.label === "string" ? action.label : `Action ${idx + 1}`}
                onClick={action.onClick}
                className={classNames(`${action.active && iconAccentActive[action.color ?? color]}`)}
              />
            ))}
        </div>
      </div>
      {items.map((item) => {
        if (item.panel === undefined) {
          return null;
        }
        const controlsId = `${panelIdPrefix}-${item.id}`;
        const isActive = item.id === activeId;
        return (
          <div
            key={controlsId}
            role="tabpanel"
            id={controlsId}
            aria-labelledby={`tab-${item.id}`}
            hidden={!isActive}
            aria-hidden={!isActive}
            className={classNames(
              "focus:outline-none flex-1 overflow-auto min-h-0 scrollbar-thin",
              isActive ? panelClassName : "hidden"
            )}
          >
            {item.panel}
          </div>
        );
      })}
    </div>
  );
};

Tabs.displayName = "Tabs";

export default Tabs;
