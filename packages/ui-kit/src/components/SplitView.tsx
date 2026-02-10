import React, { useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import { type ThemeColor, getPillColorClasses } from "../theme/Theme";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SplitViewSize = "sm" | "md" | "lg";

export interface SplitViewItemBadge {
  label: React.ReactNode;
  tone?: ThemeColor;
  variant?: "solid" | "soft" | "outline";
}

export interface SplitViewItem {
  id: string;
  /** Primary label */
  label: React.ReactNode;
  /** Secondary line shown below the label */
  subtitle?: React.ReactNode;
  /** Badges/pills rendered after the subtitle */
  badges?: SplitViewItemBadge[];
  /** Content to render in the detail pane when this item is selected */
  panel: React.ReactNode;
  /** Disable selection */
  disabled?: boolean;
  /** Hide the item entirely */
  hidden?: boolean;
}

export interface SplitViewProps {
  items: SplitViewItem[];
  /** Controlled selected id */
  value?: string;
  /** Uncontrolled default */
  defaultValue?: string;
  onChange?: (id: string, item: SplitViewItem) => void;

  /** Title shown above the item list (e.g. "LIBRARIES (3)") */
  listTitle?: React.ReactNode;
  /** Placeholder for the search input */
  searchPlaceholder?: string;
  /** Width of the list panel – Tailwind class or px value */
  listWidth?: string;
  /** Accent color used for active item highlight */
  color?: ThemeColor;
  size?: SplitViewSize;

  /** Extra class for the root container */
  className?: string;
  /** Extra class for the list panel */
  listClassName?: string;
  /** Extra class for the detail panel */
  panelClassName?: string;
  /** Content rendered above the detail panel (header area) */
  panelHeader?: React.ReactNode | ((activeItem: SplitViewItem) => React.ReactNode);
  /** Rendered when no items match the filter */
  emptyState?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Style tokens                                                       */
/* ------------------------------------------------------------------ */

const sizeTokens: Record<SplitViewSize, { item: string; label: string; subtitle: string; badge: string; search: string }> = {
  sm: { item: "px-4 py-2.5", label: "text-sm", subtitle: "text-xs", badge: "text-[10px] px-1.5 py-0", search: "text-sm h-8" },
  md: { item: "px-4 py-3", label: "text-sm", subtitle: "text-xs", badge: "text-[11px] px-2 py-0.5", search: "text-sm h-9" },
  lg: { item: "px-5 py-4", label: "text-base", subtitle: "text-sm", badge: "text-xs px-2.5 py-0.5", search: "text-sm h-10" },
};

const activeColors: Partial<Record<ThemeColor, { bg: string; border: string; text: string; subtitle: string }>> = {
  blue: { bg: "bg-blue-50", border: "border-l-blue-600", text: "text-blue-900", subtitle: "text-blue-600" },
  red: { bg: "bg-red-50", border: "border-l-red-600", text: "text-red-900", subtitle: "text-red-500" },
  green: { bg: "bg-green-50", border: "border-l-green-600", text: "text-green-900", subtitle: "text-green-600" },
  indigo: { bg: "bg-indigo-50", border: "border-l-indigo-600", text: "text-indigo-900", subtitle: "text-indigo-600" },
  violet: { bg: "bg-violet-50", border: "border-l-violet-600", text: "text-violet-900", subtitle: "text-violet-600" },
  amber: { bg: "bg-amber-50", border: "border-l-amber-600", text: "text-amber-900", subtitle: "text-amber-600" },
  teal: { bg: "bg-teal-50", border: "border-l-teal-600", text: "text-teal-900", subtitle: "text-teal-600" },
  theme: { bg: "bg-red-50", border: "border-l-red-600", text: "text-red-900", subtitle: "text-red-500" },
};

const defaultActive = { bg: "bg-blue-50", border: "border-l-blue-600", text: "text-blue-900", subtitle: "text-blue-600" };

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const SplitView: React.FC<SplitViewProps> = ({
  items,
  value,
  defaultValue,
  onChange,
  listTitle,
  searchPlaceholder = "Search...",
  listWidth,
  color = "blue",
  size = "md",
  className,
  listClassName,
  panelClassName,
  panelHeader,
  emptyState,
}) => {
  const visibleItems = useMemo(() => items.filter((i) => !i.hidden), [items]);
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue ?? visibleItems[0]?.id);
  const activeId = value ?? internalValue;

  const [filter, setFilter] = useState("");

  // Keep selection in sync when items change
  useEffect(() => {
    if (value !== undefined) return;
    if (!visibleItems.some((i) => i.id === internalValue)) {
      setInternalValue(visibleItems[0]?.id);
    }
  }, [visibleItems, value, internalValue]);

  const filteredItems = useMemo(() => {
    if (!filter) return visibleItems;
    const lower = filter.toLowerCase();
    return visibleItems.filter((item) => {
      const labelText = typeof item.label === "string" ? item.label : "";
      const subtitleText = typeof item.subtitle === "string" ? item.subtitle : "";
      return labelText.toLowerCase().includes(lower) || subtitleText.toLowerCase().includes(lower);
    });
  }, [visibleItems, filter]);

  const activeItem = visibleItems.find((i) => i.id === activeId);

  const tokens = sizeTokens[size];
  const accent = activeColors[color] ?? defaultActive;

  const handleSelect = (item: SplitViewItem) => {
    if (item.disabled) return;
    if (value === undefined) {
      setInternalValue(item.id);
    }
    onChange?.(item.id, item);
  };

  const listWidthClass = listWidth ?? "w-72";

  const renderBadge = (badge: SplitViewItemBadge, idx: number) => {
    const pillTokens = getPillColorClasses(badge.tone ?? "info", badge.variant ?? "soft");
    return (
      <span
        key={idx}
        className={classNames(
          "inline-flex items-center rounded-full font-medium leading-none",
          tokens.badge,
          pillTokens.base,
          pillTokens.border,
        )}
      >
        {badge.label}
      </span>
    );
  };

  return (
    <div className={classNames("flex h-full min-h-0 overflow-hidden", className)}>
      {/* ---- List Panel ---- */}
      <div
        className={classNames(
          "flex flex-col flex-shrink-0 border-r border-gray-200 bg-gray-50/80 h-full overflow-hidden",
          listWidthClass,
          listClassName,
        )}
      >
        {/* Title */}
        {listTitle && (
          <div className="flex-shrink-0 px-4 pt-4 pb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {listTitle}
            </h3>
          </div>
        )}

        {/* Search */}
        <div className="flex-shrink-0 px-3 pb-2 pt-1">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={searchPlaceholder}
              className={classNames(
                "w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-gray-700 placeholder-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400",
                "transition-colors duration-150",
                tokens.search,
              )}
            />
            {filter && (
              <button
                onClick={() => setFilter("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              {emptyState ?? "No items found"}
            </div>
          ) : (
            filteredItems.map((item) => {
              const isActive = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => handleSelect(item)}
                  className={classNames(
                    "w-full text-left border-l-3 transition-all duration-150 outline-none",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    tokens.item,
                    isActive
                      ? classNames(accent.bg, accent.border, "border-l-[3px]")
                      : "border-l-[3px] border-l-transparent hover:bg-gray-100/80",
                  )}
                >
                  <div className={classNames("font-semibold leading-tight", tokens.label, isActive ? accent.text : "text-gray-900")}>
                    {item.label}
                  </div>
                  {item.subtitle && (
                    <div className={classNames("mt-0.5 leading-tight", tokens.subtitle, isActive ? accent.subtitle : "text-gray-500")}>
                      {item.subtitle}
                    </div>
                  )}
                  {item.badges && item.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {item.badges.map((badge, idx) => renderBadge(badge, idx))}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ---- Detail Panel ---- */}
      <div className={classNames("flex flex-1 flex-col min-w-0 h-full overflow-hidden", panelClassName)}>
        {activeItem && (
          <>
            {/* Panel Header */}
            {panelHeader && (
              <div className="flex-shrink-0">
                {typeof panelHeader === "function" ? panelHeader(activeItem) : panelHeader}
              </div>
            )}
            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto">
              {activeItem.panel}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

SplitView.displayName = "SplitView";

export default SplitView;
