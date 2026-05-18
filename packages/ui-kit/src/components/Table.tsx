import React, { useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import { Loader, IconButton, Button, Select, Badge, type PanelTone } from ".";
import type { ThemeColor } from "../theme";
import type { IconName } from "../icons/registry";
import TruncatedText from "./TruncatedText";

type SortDirection = "asc" | "desc";

export interface TableSortState {
  columnId: string;
  direction: SortDirection;
}

export interface TablePaginationState {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

/** Unified snapshot of all user-configurable table preferences. */
export interface TableSettings {
  columnVisibility?: Record<string, boolean>;
  columnWidths?: Record<string, number>;
  activeView?: "table" | "panel";
  groupBy?: string | null;
  showGroupHeader?: boolean;
  stickyColumns?: Record<string, "left" | "right">;
}

type AccessorFn<T> = (row: T, index: number) => React.ReactNode;

export interface TableColumn<T> {
  id: string;
  header: React.ReactNode;
  accessor?: keyof T | AccessorFn<T>;
  render?: (row: T, index: number) => React.ReactNode;
  /** Override the value used for sorting when render returns a non-primitive (e.g. an icon). */
  sortValue?: (row: T) => string | number;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  tooltip?: string;
  className?: string;
  headerClassName?: string;
  sticky?: "left" | "right";
  /** When true, this column is excluded from user preference menus (hide/show, group-by, sticky). */
  isActionsColumn?: boolean;
  /** When true, the column starts hidden by default but can still be enabled from the Columns menu. */
  defaultHidden?: boolean;
  /** When false, this column cannot be hidden via the column visibility toggle. Defaults to true. */
  hideable?: boolean;
  /** When false, this column will not appear in the group-by picker. Defaults to true. */
  groupable?: boolean;
  /** When false, this column cannot be resized even when `resizableColumns` is set on the table. Defaults to true. */
  resizable?: boolean;
  /**
   * Returns a plain string used as the group key and header label when this column is the active
   * group-by. Use this when `render` returns JSX (which would otherwise give "[object Object]").
   * Falls back to: accessor result → sortValue → render result (only if a primitive string/number).
   */
  groupValue?: (row: T) => string;
  /**
   * Background Tailwind class(es) applied to sticky cells so they remain opaque over scrolled
   * content. Defaults to `'bg-white dark:bg-neutral-900'`. Pass `'bg-transparent'` to let the
   * row/table background show through instead.
   */
  stickyBackground?: string;
  /**
   * Per-row variant of `stickyBackground`. When provided, takes precedence over `stickyBackground`
   * for the matching row. Return `undefined` to fall back to the static `stickyBackground`.
   */
  stickyBackgroundFn?: (row: T, index: number) => string | undefined;
}

export type Column<T> = TableColumn<T>;

export type TableVariant =
  | "default"
  | "compact"
  | "minimal"
  | "bordered"
  | "flat";

/** Internal type for a single group entry when grouping is active. */
type GroupEntry<T> = {
  key: string;
  display: string;
  rows: { row: T; originalIndex: number }[];
};

export interface TableProps<T> {
  columns?: TableColumn<T>[];
  data: T[];
  selectedItems?: T[];
  rowKey?: (row: T, index: number) => string | number;
  variant?: TableVariant;
  tone?: PanelTone;
  /** Theme color applied to action buttons, sort indicators, group dot, badges, and pagination. */
  color?: ThemeColor;
  striped?: boolean;
  noBorders?: boolean;
  hoverable?: boolean;
  stickyHeader?: boolean;
  /**
   * When true, the last column is pinned to the right edge and stays visible
   * while the other columns scroll horizontally. A left border separator is
   * added automatically to distinguish it from the scrolling content.
   */
  stickyActions?: boolean;
  loading?: boolean;
  loadingMessage?: string;
  loaderType?: "spinner" | "progress";
  loaderProgress?: number;
  emptyState?: React.ReactNode;
  sortState?: TableSortState;
  defaultSort?: TableSortState;
  onSortChange?: (sort: TableSortState | null) => void;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  pagination?: TablePaginationState;
  maxHeight?: string | number;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
  /** When provided and returns true for a row, that row is rendered with an intense accent background and a pulsing left-border indicator to signal new/updated content. */
  rowHighlight?: (row: T, index: number) => boolean;
  className?: string;
  tableClassName?: string;
  bodyClassName?: string;
  style?: React.CSSProperties;
  fullHeight?: boolean;
  manualSorting?: boolean;
  /** When true, wraps the table in a rounded border regardless of the variant. */
  rounded?: boolean;
  /** Title shown in the header bar alongside headerActions / view toggle. Defaults to empty. */
  headerTitle?: string;
  /**
   * Initial column visibility map (`columnId → visible`).
   * Serialise with `JSON.stringify` to save; parse and pass back to restore.
   */
  columnVisibility?: Record<string, boolean>;
  /** Called whenever the user changes column visibility. Receives the full current config. */
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  /**
   * When true, shows the column visibility toggle button in the header bar.
   * Defaults to false — the icon is hidden unless this prop is explicitly set.
   */
  showColumnSelector?: boolean;
  /**
   * Enables drag-to-resize column headers. Each column can opt out via `column.resizable = false`.
   */
  resizableColumns?: boolean;
  /**
   * Initial column width map (`columnId → pixels`).
   * Serialise with `JSON.stringify` to save; parse and pass back to restore.
   */
  columnWidths?: Record<string, number>;
  /** Called when the user finishes resizing a column. Receives the full updated widths map. */
  onColumnWidthChange?: (widths: Record<string, number>) => void;
  /** Renders each row as a panel card. When provided alongside columns, a view toggle appears in the header. */
  panelItem?: (row: T, index: number) => React.ReactNode;
  /** Initial view when both columns and panelItem are provided. Defaults to "table". */
  defaultView?: "table" | "panel";
  /** Called whenever the user switches between table and panel view. */
  onViewChange?: (view: "table" | "panel") => void;
  /** CSS class(es) for the panel grid container. Defaults to a 1–3 column responsive grid. */
  panelGridClassName?: string;
  /**
   * Minimum width of each panel card. The grid uses CSS `auto-fill` to place
   * as many columns as fit the container — adapts to the parent width with no
   * hard breakpoints. Accepts a CSS length string ("280px", "20rem") or a
   * number treated as px. When set, takes precedence over the column layout in
   * `panelGridClassName` (extra classes from `panelGridClassName` still apply).
   */
  panelMinItemWidth?: string | number;
  /**
   * Gap between panel cards when `panelMinItemWidth` is set. Accepts a CSS
   * length string ("1rem", "16px") or a number treated as px. Defaults to
   * "1rem" (= `gap-4`). The value is applied via inline style so it cannot be
   * accidentally overridden by a conflicting Tailwind class.
   */
  panelGap?: string | number;
  /**
   * Maximum width of each panel card when `panelMinItemWidth` is set. Prevents cards from
   * growing too wide on large containers. Accepts a CSS length string ("480px", "30rem") or
   * a number treated as px. When omitted, cards stretch to fill available space (`1fr`).
   */
  panelMaxItemWidth?: string | number;
  /**
   * When provided, the panel view only renders the first row for each unique key value.
   * Use this when `data` is a flattened list but panels should show one card per logical entity.
   * Example: `panelDeduplicateBy={(row) => row.manifest.id}`
   */
  panelDeduplicateBy?: (row: T) => string | number;
  // ── Grouping ────────────────────────────────────────────────────────────────
  /**
   * Column id to group rows by (code-defined).
   * Always applied; the user cannot override this via the UI.
   */
  groupBy?: string;
  /**
   * When true, a grouping control is shown in the header letting the user
   * configure grouping at runtime. Only effective when `groupBy` is not set.
   */
  groupable?: boolean;
  /**
   * Initial user-configured group column id (uncontrolled).
   * Pass the persisted value here on mount to restore previous state.
   * Only used when `groupable` is true and `groupBy` is not set.
   */
  defaultGroupBy?: string;
  /** Whether to show a header row for each group value. Defaults to true. */
  showGroupHeader?: boolean;
  /** Whether groups start expanded. Defaults to true. */
  defaultGroupExpanded?: boolean;
  /** Called when the user changes the group column (null = no grouping). Use for persistence. */
  onGroupByChange?: (columnId: string | null) => void;
  // ── User sticky columns ──────────────────────────────────────────────────────
  /**
   * When true, a sticky-column picker is shown in the header bar letting the
   * user pin individual columns to the left or right at runtime.
   */
  userStickyColumns?: boolean;
  /**
   * Initial user-configured sticky map (`columnId → 'left' | 'right'`).
   * Pass the persisted value here on mount to restore previous state.
   */
  defaultStickyColumns?: Record<string, "left" | "right">;
  /** Called when the user changes column stickiness. Use for persistence. */
  onStickyColumnsChange?: (config: Record<string, "left" | "right">) => void;
  /**
   * Unified table settings snapshot. Fields here take precedence over the
   * individual initial-value props (`columnVisibility`, `columnWidths`,
   * `defaultView`, `defaultGroupBy`, `defaultStickyColumns`).
   * Pass a previously persisted value to restore all settings on mount.
   */
  tableSettings?: TableSettings;
  /**
   * Called whenever any user-configurable table setting changes (visibility,
   * widths, view, group-by, sticky columns). Use a single handler to persist
   * the full settings object instead of wiring up all individual callbacks.
   */
  onTableSettingsChange?: (settings: TableSettings) => void;
}

const resolveColor = (color: ThemeColor): string => {
  switch (color) {
    case "brand":
      return "indigo";
    case "info":
      return "sky";
    case "success":
      return "emerald";
    case "warning":
      return "amber";
    case "danger":
      return "rose";
    case "theme":
      return "neutral";
    case "parallels":
      return "red";
    default:
      return color;
  }
};

const getToneHeaderClasses = (tone: ThemeColor): string => {
  const c = resolveColor(tone);

  if (tone === "neutral" || tone === "theme" || tone === "white") {
    return "bg-neutral-50 text-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700";
  }

  return `bg-${c}-50 text-${c}-700 dark:bg-${c}-500/15 dark:text-${c}-100 border-${c}-200 dark:border-${c}-500/30`;
};

/** Returns a static `bg-*-500` class for the active-group indicator dot. */
function getDotColorClass(color: ThemeColor): string {
  switch (resolveColor(color)) {
    case "blue":
      return "bg-blue-500";
    case "green":
      return "bg-green-500";
    case "teal":
      return "bg-teal-500";
    case "cyan":
      return "bg-cyan-500";
    case "indigo":
      return "bg-indigo-500";
    case "purple":
      return "bg-purple-500";
    case "violet":
      return "bg-violet-500";
    case "red":
      return "bg-red-500";
    case "orange":
      return "bg-orange-500";
    case "amber":
      return "bg-amber-500";
    case "yellow":
      return "bg-yellow-500";
    case "lime":
      return "bg-lime-500";
    case "emerald":
      return "bg-emerald-500";
    case "sky":
      return "bg-sky-500";
    case "fuchsia":
      return "bg-fuchsia-500";
    case "pink":
      return "bg-pink-500";
    case "rose":
      return "bg-rose-500";
    case "slate":
      return "bg-slate-500";
    case "gray":
      return "bg-gray-500";
    case "zinc":
      return "bg-zinc-500";
    case "neutral":
      return "bg-neutral-500";
    case "stone":
      return "bg-stone-500";
    default:
      return "bg-blue-500";
  }
}

/** Returns static `accent-*` classes for native checkbox/radio inputs. */
function getAccentClass(color: ThemeColor): string {
  switch (resolveColor(color)) {
    case "blue":
      return "accent-blue-600 dark:accent-blue-400";
    case "green":
      return "accent-green-600 dark:accent-green-400";
    case "teal":
      return "accent-teal-600 dark:accent-teal-400";
    case "cyan":
      return "accent-cyan-600 dark:accent-cyan-400";
    case "indigo":
      return "accent-indigo-600 dark:accent-indigo-400";
    case "purple":
      return "accent-purple-600 dark:accent-purple-400";
    case "violet":
      return "accent-violet-600 dark:accent-violet-400";
    case "red":
      return "accent-red-600 dark:accent-red-400";
    case "orange":
      return "accent-orange-600 dark:accent-orange-400";
    case "amber":
      return "accent-amber-600 dark:accent-amber-400";
    case "yellow":
      return "accent-yellow-600 dark:accent-yellow-400";
    case "lime":
      return "accent-lime-600 dark:accent-lime-400";
    case "emerald":
      return "accent-emerald-600 dark:accent-emerald-400";
    case "sky":
      return "accent-sky-600 dark:accent-sky-400";
    case "fuchsia":
      return "accent-fuchsia-600 dark:accent-fuchsia-400";
    case "pink":
      return "accent-pink-600 dark:accent-pink-400";
    case "rose":
      return "accent-rose-600 dark:accent-rose-400";
    case "slate":
      return "accent-slate-600 dark:accent-slate-400";
    case "gray":
      return "accent-gray-600 dark:accent-gray-400";
    case "zinc":
      return "accent-zinc-600 dark:accent-zinc-400";
    case "neutral":
      return "accent-neutral-700 dark:accent-neutral-300";
    case "stone":
      return "accent-stone-600 dark:accent-stone-400";
    default:
      return "accent-blue-600 dark:accent-blue-400";
  }
}

/** Returns a static `bg-*-50` class for the selected row background. */
function getSelectedRowClass(color: ThemeColor): string {
  switch (resolveColor(color)) {
    case "blue":
      return "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800";
    case "green":
      return "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-800";
    case "teal":
      return "bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-800";
    case "cyan":
      return "bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-800";
    case "indigo":
      return "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-800";
    case "purple":
      return "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-800";
    case "violet":
      return "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-800";
    case "red":
      return "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800";
    case "orange":
      return "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-800";
    case "amber":
      return "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800";
    case "yellow":
      return "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-800";
    case "lime":
      return "bg-lime-50 dark:bg-lime-500/10 border-lime-200 dark:border-lime-800";
    case "emerald":
      return "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800";
    case "sky":
      return "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-800";
    case "fuchsia":
      return "bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-200 dark:border-fuchsia-800";
    case "pink":
      return "bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-800";
    case "rose":
      return "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-800";
    case "slate":
      return "bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-800";
    case "gray":
      return "bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-800";
    case "zinc":
      return "bg-zinc-50 dark:bg-zinc-500/10 border-zinc-200 dark:border-zinc-800";
    case "neutral":
      return "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700";
    case "stone":
      return "bg-stone-50 dark:bg-stone-500/10 border-stone-200 dark:border-stone-800";
    default:
      return "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800";
  }
}

function getHighlightRowClass(color: ThemeColor): string {
  switch (resolveColor(color)) {
    case "blue":
      return "bg-blue-100 dark:bg-blue-500/20";
    case "green":
      return "bg-green-100 dark:bg-green-500/20";
    case "teal":
      return "bg-teal-100 dark:bg-teal-500/20";
    case "cyan":
      return "bg-cyan-100 dark:bg-cyan-500/20";
    case "indigo":
      return "bg-indigo-100 dark:bg-indigo-500/20";
    case "purple":
      return "bg-purple-100 dark:bg-purple-500/20";
    case "violet":
      return "bg-violet-100 dark:bg-violet-500/20";
    case "red":
      return "bg-red-100 dark:bg-red-500/20";
    case "orange":
      return "bg-orange-100 dark:bg-orange-500/20";
    case "amber":
      return "bg-amber-100 dark:bg-amber-500/20";
    case "yellow":
      return "bg-yellow-100 dark:bg-yellow-500/20";
    case "lime":
      return "bg-lime-100 dark:bg-lime-500/20";
    case "emerald":
      return "bg-emerald-100 dark:bg-emerald-500/20";
    case "sky":
      return "bg-sky-100 dark:bg-sky-500/20";
    case "fuchsia":
      return "bg-fuchsia-100 dark:bg-fuchsia-500/20";
    case "pink":
      return "bg-pink-100 dark:bg-pink-500/20";
    case "rose":
      return "bg-rose-100 dark:bg-rose-500/20";
    case "slate":
      return "bg-slate-100 dark:bg-slate-500/20";
    case "gray":
      return "bg-gray-100 dark:bg-gray-500/20";
    case "zinc":
      return "bg-zinc-100 dark:bg-zinc-500/20";
    case "neutral":
      return "bg-neutral-100 dark:bg-neutral-700/50";
    case "stone":
      return "bg-stone-100 dark:bg-stone-500/20";
    default:
      return "bg-blue-100 dark:bg-blue-500/20";
  }
}

function getHighlightBorderClass(color: ThemeColor): string {
  switch (resolveColor(color)) {
    case "blue":
      return "border-l-blue-500";
    case "green":
      return "border-l-green-500";
    case "teal":
      return "border-l-teal-500";
    case "cyan":
      return "border-l-cyan-500";
    case "indigo":
      return "border-l-indigo-500";
    case "purple":
      return "border-l-purple-500";
    case "violet":
      return "border-l-violet-500";
    case "red":
      return "border-l-red-500";
    case "orange":
      return "border-l-orange-500";
    case "amber":
      return "border-l-amber-500";
    case "yellow":
      return "border-l-yellow-500";
    case "lime":
      return "border-l-lime-500";
    case "emerald":
      return "border-l-emerald-500";
    case "sky":
      return "border-l-sky-500";
    case "fuchsia":
      return "border-l-fuchsia-500";
    case "pink":
      return "border-l-pink-500";
    case "rose":
      return "border-l-rose-500";
    case "slate":
      return "border-l-slate-500";
    case "gray":
      return "border-l-gray-500";
    case "zinc":
      return "border-l-zinc-500";
    case "neutral":
      return "border-l-neutral-500";
    case "stone":
      return "border-l-stone-500";
    default:
      return "border-l-blue-500";
  }
}

/** Returns static Tailwind hover class for the column resize handle track. */
function getResizeHandleHoverClass(color: ThemeColor): string {
  switch (resolveColor(color)) {
    case "blue":
      return "group-hover/rh:bg-blue-500    dark:group-hover/rh:bg-blue-400";
    case "green":
      return "group-hover/rh:bg-green-500   dark:group-hover/rh:bg-green-400";
    case "teal":
      return "group-hover/rh:bg-teal-500    dark:group-hover/rh:bg-teal-400";
    case "cyan":
      return "group-hover/rh:bg-cyan-500    dark:group-hover/rh:bg-cyan-400";
    case "indigo":
      return "group-hover/rh:bg-indigo-500  dark:group-hover/rh:bg-indigo-400";
    case "purple":
      return "group-hover/rh:bg-purple-500  dark:group-hover/rh:bg-purple-400";
    case "violet":
      return "group-hover/rh:bg-violet-500  dark:group-hover/rh:bg-violet-400";
    case "red":
      return "group-hover/rh:bg-red-500     dark:group-hover/rh:bg-red-400";
    case "orange":
      return "group-hover/rh:bg-orange-500  dark:group-hover/rh:bg-orange-400";
    case "amber":
      return "group-hover/rh:bg-amber-500   dark:group-hover/rh:bg-amber-400";
    case "yellow":
      return "group-hover/rh:bg-yellow-500  dark:group-hover/rh:bg-yellow-400";
    case "lime":
      return "group-hover/rh:bg-lime-500    dark:group-hover/rh:bg-lime-400";
    case "emerald":
      return "group-hover/rh:bg-emerald-500 dark:group-hover/rh:bg-emerald-400";
    case "sky":
      return "group-hover/rh:bg-sky-500     dark:group-hover/rh:bg-sky-400";
    case "fuchsia":
      return "group-hover/rh:bg-fuchsia-500 dark:group-hover/rh:bg-fuchsia-400";
    case "pink":
      return "group-hover/rh:bg-pink-500    dark:group-hover/rh:bg-pink-400";
    case "rose":
      return "group-hover/rh:bg-rose-500    dark:group-hover/rh:bg-rose-400";
    case "slate":
      return "group-hover/rh:bg-slate-500   dark:group-hover/rh:bg-slate-400";
    case "gray":
      return "group-hover/rh:bg-gray-500    dark:group-hover/rh:bg-gray-400";
    case "zinc":
      return "group-hover/rh:bg-zinc-500    dark:group-hover/rh:bg-zinc-400";
    case "neutral":
      return "group-hover/rh:bg-neutral-500 dark:group-hover/rh:bg-neutral-400";
    case "stone":
      return "group-hover/rh:bg-stone-500   dark:group-hover/rh:bg-stone-400";
    default:
      return "group-hover/rh:bg-blue-500    dark:group-hover/rh:bg-blue-400";
  }
}

const variantCellPadding: Record<TableVariant, string> = {
  default: "px-6 py-5 text-sm",
  compact: "px-4 py-3 text-sm",
  minimal: "px-3 py-4 text-xs",
  bordered: "px-5 py-5 text-sm",
  flat: "px-4 py-3 text-sm",
};

const variantSidePadding: Record<
  TableVariant,
  { left: string; right: string; contentVertical: string }
> = {
  default: { left: "pl-6", right: "pr-6", contentVertical: "py-1.5" },
  compact: { left: "pl-4", right: "pr-4", contentVertical: "py-1" },
  minimal: { left: "pl-3", right: "pr-3", contentVertical: "py-1.5" },
  bordered: { left: "pl-5", right: "pr-5", contentVertical: "py-1.5" },
  flat: { left: "pl-4", right: "pr-4", contentVertical: "py-1.5" },
};

const variantTableBase: Record<TableVariant, string> = {
  default: "min-w-full divide-y divide-neutral-200 dark:divide-neutral-700",
  compact: "min-w-full divide-y divide-neutral-200 dark:divide-neutral-700",
  minimal: "min-w-full divide-y divide-neutral-200 dark:divide-neutral-700",
  bordered: "min-w-full border border-neutral-200 dark:border-neutral-700",
  flat: "min-w-full divide-y divide-neutral-100 dark:divide-neutral-800",
};

const variantWrapperBase: Record<TableVariant, string> = {
  default:
    "overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900/90",
  compact:
    "overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900/90",
  minimal:
    "overflow-hidden rounded-xl border border-neutral-200/60 bg-white/95 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900/90",
  bordered:
    "overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900",
  flat: "overflow-hidden bg-transparent dark:bg-transparent",
};

const alignmentClass: Record<
  NonNullable<TableColumn<unknown>["align"]>,
  string
> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const alignmentFlexClass: Record<
  NonNullable<TableColumn<unknown>["align"]>,
  string
> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

const getCellAlignment = (align?: TableColumn<unknown>["align"]) =>
  align ? alignmentClass[align] : "text-left";
const getCellFlexAlignment = (align?: TableColumn<unknown>["align"]) =>
  align ? alignmentFlexClass[align] : "justify-start";

const sortIconMap: Record<"asc" | "desc" | "default", IconName> = {
  asc: "ArrowUp",
  desc: "ArrowDown",
  default: "Dots",
};

function resolveValue<T>(
  row: T,
  column: TableColumn<T>,
  index: number,
): React.ReactNode {
  if (column.render) {
    return column.render(row, index);
  }

  if (column.accessor) {
    if (typeof column.accessor === "function") {
      return column.accessor(row, index);
    }

    return (row as Record<string, unknown>)[
      column.accessor as string
    ] as React.ReactNode;
  }

  return null;
}

function resolveRowKey<T>(
  row: T,
  index: number,
  rowKey?: (row: T, index: number) => string | number,
): string | number {
  if (rowKey) {
    return rowKey(row, index);
  }

  if (typeof (row as Record<string, unknown>).id !== "undefined") {
    return String((row as Record<string, unknown>).id);
  }

  return index;
}

function applyWidthStyle(
  width?: string | number,
  minWidth?: string | number,
  maxWidth?: string | number,
) {
  if (!width && !minWidth && !maxWidth) {
    return undefined;
  }

  const style: React.CSSProperties = {};
  if (width !== undefined)
    style.width = typeof width === "number" ? `${width}px` : width;
  if (minWidth !== undefined)
    style.minWidth = typeof minWidth === "number" ? `${minWidth}px` : minWidth;
  if (maxWidth !== undefined) {
    style.maxWidth = typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;
    // If maxWidth is set, prevent the column from expanding beyond it
    if (!width) {
      style.width = style.maxWidth;
    }
  }

  return style;
}

function getNextSortDirection(current?: SortDirection): SortDirection {
  if (current === "asc") {
    return "desc";
  }

  return "asc";
}

// ── Inline chevron SVG (avoids importing icon components directly) ─────────────
function ChevronSvg({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      width="14"
      height="14"
      className={classNames(
        "flex-shrink-0 text-current transition-transform duration-200",
        expanded && "rotate-90",
      )}
      aria-hidden="true"
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TableComponent<T>({
  columns,
  data,
  selectedItems,
  rowKey,
  variant = "default",
  tone = "neutral",
  striped = false,
  noBorders = false,
  hoverable = true,
  stickyHeader = false,
  stickyActions = false,
  loading = false,
  loadingMessage,
  loaderType = "spinner",
  loaderProgress,
  emptyState,
  sortState,
  defaultSort,
  onSortChange,
  headerActions,
  footer,
  maxHeight,
  onRowClick,
  rowClassName,
  rowHighlight,
  className,
  tableClassName,
  bodyClassName,
  style,
  fullHeight,
  pagination,
  manualSorting = false,
  rounded = false,
  panelItem,
  defaultView,
  onViewChange,
  panelGridClassName,
  panelMinItemWidth,
  panelMaxItemWidth,
  panelGap,
  panelDeduplicateBy,
  headerTitle = "",
  columnVisibility: columnVisibilityProp,
  onColumnVisibilityChange,
  showColumnSelector = false,
  resizableColumns = false,
  columnWidths: columnWidthsProp,
  onColumnWidthChange,
  // Grouping props
  groupBy,
  groupable,
  defaultGroupBy,
  showGroupHeader,
  defaultGroupExpanded,
  onGroupByChange,
  userStickyColumns,
  defaultStickyColumns,
  onStickyColumnsChange,
  tableSettings,
  onTableSettingsChange,
  color = "blue",
}: TableProps<T>) {
  const getDefaultColumnVisibility = (column: TableColumn<T>) => {
    if (column.hideable === false) {
      return true;
    }

    return column.defaultHidden !== true;
  };

  const showViewToggle = !!columns?.length && !!panelItem;
  const defaultViewResolved: "table" | "panel" =
    tableSettings?.activeView ??
    defaultView ??
    (showViewToggle ? "table" : panelItem ? "panel" : "table");
  const [activeView, setActiveView] = useState<"table" | "panel">(
    defaultViewResolved,
  );

  const [internalSort, setInternalSort] = useState<TableSortState | null>(
    defaultSort ?? null,
  );

  const resolvedSort = sortState ?? internalSort;

  // ── Column visibility ────────────────────────────────────────────────────────
  const [colVisibility, setColVisibility] = useState<Record<string, boolean>>(
    () => {
      const init: Record<string, boolean> = {};
      const source = tableSettings?.columnVisibility ?? columnVisibilityProp;
      for (const col of columns ?? []) {
        init[col.id] = source?.[col.id] ?? getDefaultColumnVisibility(col);
      }
      return init;
    },
  );

  // Sync when the columnVisibility prop changes (e.g. after loading saved config)
  useEffect(() => {
    const source = tableSettings?.columnVisibility ?? columnVisibilityProp;
    if (!source) return;
    setColVisibility((prev) => {
      const next = { ...prev };
      for (const col of columns ?? []) {
        next[col.id] =
          source[col.id] ?? prev[col.id] ?? getDefaultColumnVisibility(col);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibilityProp, tableSettings?.columnVisibility]);

  const [colPanelOpen, setColPanelOpen] = useState(false);
  const colPanelRef = useRef<HTMLDivElement>(null);

  // ── Column resize ─────────────────────────────────────────────────────────────
  const [internalColWidths, setInternalColWidths] = useState<
    Record<string, number>
  >(() => {
    const init: Record<string, number> = {};
    const widthSource = tableSettings?.columnWidths ?? columnWidthsProp;
    if (widthSource) {
      Object.assign(init, widthSource);
    } else {
      for (const col of columns ?? []) {
        if (typeof col.width === "number") {
          init[col.id] = col.width;
        } else if (
          typeof col.width === "string" &&
          /^\d+(\.\d+)?px$/.test(col.width)
        ) {
          init[col.id] = parseFloat(col.width);
        }
      }
    }
    return init;
  });

  // Sync when columnWidths prop changes (e.g. after loading saved config)
  useEffect(() => {
    const widthSource = tableSettings?.columnWidths ?? columnWidthsProp;
    if (!widthSource) return;
    setInternalColWidths((prev) => ({ ...prev, ...widthSource }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnWidthsProp, tableSettings?.columnWidths]);

  // refs: one per <th> for DOM measurement, plus transient resize state
  const thRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  const resizingRef = useRef<{
    colId: string;
    startX: number;
    startWidth: number;
  } | null>(null);
  const widthsDuringResizeRef = useRef<Record<string, number>>({});

  // Clean up any lingering body styles if the component unmounts mid-drag
  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const handleResizeStart = (
    e: React.MouseEvent,
    colId: string,
    minColWidth: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // On the very first resize, seed ALL visible column widths from the DOM so
    // switching to table-layout:fixed doesn't cause a layout jump.
    let currentWidths = { ...internalColWidths };
    if (Object.keys(currentWidths).length === 0) {
      for (const col of visibleColumns) {
        const el = thRefs.current[col.id];
        if (el) currentWidths[col.id] = el.offsetWidth;
      }
      setInternalColWidths(currentWidths);
    }

    const startWidth =
      currentWidths[colId] ?? thRefs.current[colId]?.offsetWidth ?? 100;
    resizingRef.current = { colId, startX: e.clientX, startWidth };
    widthsDuringResizeRef.current = { ...currentWidths };

    const onMouseMove = (moveEvt: MouseEvent) => {
      if (!resizingRef.current) return;
      const newWidth = Math.max(
        minColWidth,
        resizingRef.current.startWidth +
          (moveEvt.clientX - resizingRef.current.startX),
      );
      widthsDuringResizeRef.current = {
        ...widthsDuringResizeRef.current,
        [resizingRef.current.colId]: newWidth,
      };
      setInternalColWidths({ ...widthsDuringResizeRef.current });
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      onColumnWidthChange?.(widthsDuringResizeRef.current);
      onTableSettingsChange?.({
        ...settingsSnapshotRef.current,
        columnWidths: widthsDuringResizeRef.current,
      });
      resizingRef.current = null;
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // When resizable and any width is stored, switch the table to fixed layout
  // so column widths are honoured precisely.
  const useFixedLayout =
    resizableColumns && Object.keys(internalColWidths).length > 0;

  // ── User sticky columns state ────────────────────────────────────────────────
  const [internalStickyColumns, setInternalStickyColumns] = useState<
    Record<string, "left" | "right">
  >(tableSettings?.stickyColumns ?? defaultStickyColumns ?? {});
  const [stickyPanelOpen, setStickyPanelOpen] = useState(false);
  const stickyPanelRef = useRef<HTMLDivElement>(null);

  // ── Unified settings snapshot ref (declared early so all handlers can use it) ─
  // The .current assignment is done after all state is declared below.
  const settingsSnapshotRef = useRef<TableSettings>({});

  const handleStickyChange = (colId: string, pin: "left" | "right" | null) => {
    setInternalStickyColumns((prev) => {
      const next = { ...prev };
      if (pin === null) delete next[colId];
      else next[colId] = pin;
      onStickyColumnsChange?.(next);
      onTableSettingsChange?.({
        ...settingsSnapshotRef.current,
        stickyColumns: next,
      });
      return next;
    });
  };

  const hasStickyColumns = Object.keys(internalStickyColumns).length > 0;

  // ── Grouping state ───────────────────────────────────────────────────────────
  const [internalGroupBy, setInternalGroupBy] = useState<string | null>(
    tableSettings?.groupBy ?? defaultGroupBy ?? null,
  );
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [groupPanelOpen, setGroupPanelOpen] = useState(false);
  const [showGroupHeaderLocal, setShowGroupHeaderLocal] = useState(
    tableSettings?.showGroupHeader ?? showGroupHeader ?? true,
  );
  const groupPanelRef = useRef<HTMLDivElement>(null);

  const resolvedGroupBy = groupBy ?? internalGroupBy;
  const resolvedShowGroupHeader = showGroupHeader ?? showGroupHeaderLocal;

  // ── Unified settings snapshot — update after all state is declared ───────────
  // Handlers close over the ref (declared above); this assignment runs
  // synchronously on every render before any user interaction can fire.
  settingsSnapshotRef.current = {
    columnVisibility: colVisibility,
    columnWidths: internalColWidths,
    activeView,
    groupBy: internalGroupBy,
    showGroupHeader: showGroupHeaderLocal,
    stickyColumns: internalStickyColumns,
  };

  // ── Selection Lookup ─────────────────────────────────────────────────────────
  const selectionLookup = useMemo(() => {
    if (!selectedItems || selectedItems.length === 0) return null;

    const lookup = new Set<unknown>();
    selectedItems.forEach((item) => {
      // Support reference equality
      lookup.add(item);

      // Support ID equality
      if (rowKey) {
        // We pass -1 as index since we don't have it for selected items,
        // expecting rowKey to rely on intrinsic properties.
        lookup.add(rowKey(item, -1));
      } else if (typeof (item as Record<string, unknown>).id !== "undefined") {
        const idVal = (item as Record<string, unknown>).id;
        lookup.add(String(idVal));
      }
    });
    return lookup;
  }, [selectedItems, rowKey]);

  // ── Outside-click handlers ───────────────────────────────────────────────────
  useEffect(() => {
    if (!colPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        colPanelRef.current &&
        !colPanelRef.current.contains(e.target as Node)
      ) {
        setColPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colPanelOpen]);

  useEffect(() => {
    if (!groupPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        groupPanelRef.current &&
        !groupPanelRef.current.contains(e.target as Node)
      ) {
        setGroupPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [groupPanelOpen]);

  useEffect(() => {
    if (!stickyPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        stickyPanelRef.current &&
        !stickyPanelRef.current.contains(e.target as Node)
      ) {
        setStickyPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [stickyPanelOpen]);

  // ── Sort handler ─────────────────────────────────────────────────────────────
  const handleSortToggle = (column: TableColumn<T>) => {
    if (!column.sortable) {
      return;
    }

    const nextDirection = getNextSortDirection(
      resolvedSort?.columnId === column.id ? resolvedSort.direction : undefined,
    );

    const nextSort = nextDirection
      ? { columnId: column.id, direction: nextDirection }
      : null;

    if (!sortState) {
      setInternalSort(nextSort);
    }

    if (onSortChange) {
      onSortChange(nextSort);
    }
  };

  // ── Group handler ────────────────────────────────────────────────────────────
  const handleGroupChange = (columnId: string | null) => {
    setInternalGroupBy(columnId);
    setExpandedGroups({}); // reset expansion state when group changes
    onGroupByChange?.(columnId);
    onTableSettingsChange?.({
      ...settingsSnapshotRef.current,
      groupBy: columnId,
    });
  };

  // ── Sorted data ──────────────────────────────────────────────────────────────
  const sortedData = useMemo(() => {
    if (manualSorting) {
      return data;
    }

    if (!resolvedSort) {
      return data;
    }

    const column = columns?.find((col) => col.id === resolvedSort.columnId);

    if (!column || (!column.accessor && !column.render && !column.sortValue)) {
      return data;
    }

    // sortValue takes priority; fall back to the raw accessor value, then render.
    // Accessor is preferred over render because render typically returns JSX which
    // cannot be meaningfully compared as a string.
    const getValue = column.sortValue
      ? (row: T) => column.sortValue!(row)
      : column.accessor
        ? (row: T, index: number) => {
            if (typeof column.accessor === "function")
              return column.accessor(row, index);
            return (row as Record<string, unknown>)[column.accessor as string];
          }
        : (row: T, index: number) =>
            column.render ? column.render(row, index) : null;

    const sorted = [...data];
    sorted.sort((a, b) => {
      const aValue = getValue(a, data.indexOf(a));
      const bValue = getValue(b, data.indexOf(b));

      if (aValue === bValue) {
        return 0;
      }

      const safeString = (val: React.ReactNode): string => {
        if (typeof val === "string") return val;
        if (typeof val === "number") return String(val);
        if (typeof val === "boolean") return String(val);
        return "";
      };

      const aComparable =
        typeof aValue === "number"
          ? aValue
          : safeString(aValue as React.ReactNode).toLowerCase();
      const bComparable =
        typeof bValue === "number"
          ? bValue
          : safeString(bValue as React.ReactNode).toLowerCase();

      if (aComparable < bComparable) {
        return resolvedSort.direction === "asc" ? -1 : 1;
      }

      return resolvedSort.direction === "asc" ? 1 : -1;
    });

    return sorted;
  }, [resolvedSort, columns, data, manualSorting]);

  // ── Column helpers ───────────────────────────────────────────────────────────
  const effectiveColumns = columns ?? [];
  const menuColumns = effectiveColumns.filter((col) => !col.isActionsColumn);

  // User-configurable grouping is only shown when groupable=true and no code-defined groupBy
  const isUserGroupable =
    groupable === true &&
    !groupBy &&
    menuColumns.some((col) => col.groupable !== false);

  // The grouped column is always hidden from the rendered table
  const visibleColumns = effectiveColumns.filter(
    (col) => colVisibility[col.id] !== false && col.id !== resolvedGroupBy,
  );
  const hasHideableColumns = menuColumns.some((col) => col.hideable !== false);

  // ── Ordered visible columns ──────────────────────────────────────────────────
  // When columns are pinned (user-configured or code-defined), they are moved to
  // the appropriate edge while preserving relative order within each group:
  //   [ left-pinned | normal | right-pinned ]
  // The stickyActions column (original last col) is always last within the right group.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const orderedVisibleColumns = useMemo((): TableColumn<T>[] => {
    const left: TableColumn<T>[] = [];
    const middle: TableColumn<T>[] = [];
    const right: TableColumn<T>[] = [];
    visibleColumns.forEach((col, i) => {
      const effective = internalStickyColumns[col.id] ?? col.sticky;
      if (effective === "left") {
        left.push(col);
      } else if (
        effective === "right" ||
        (stickyActions && i === visibleColumns.length - 1)
      ) {
        right.push(col);
      } else {
        middle.push(col);
      }
    });
    return [...left, ...middle, ...right];
  }, [visibleColumns, internalStickyColumns, stickyActions]);

  // ── Grouped data ─────────────────────────────────────────────────────────────
  const groupedData = useMemo((): GroupEntry<T>[] | null => {
    if (!resolvedGroupBy) return null;
    const column = effectiveColumns.find((c) => c.id === resolvedGroupBy);
    if (!column) return null;

    const groups: GroupEntry<T>[] = [];
    const groupMap = new Map<string, number>();

    sortedData.forEach((row, idx) => {
      // Resolution priority: groupValue → accessor primitive → sortValue → render primitive → ""
      let display = "";
      if (column.groupValue) {
        display = column.groupValue(row);
      } else if (column.accessor) {
        const accVal =
          typeof column.accessor === "function"
            ? column.accessor(row, idx)
            : (row as Record<string, unknown>)[column.accessor as string];
        if (typeof accVal === "string") display = accVal;
        else if (typeof accVal === "number") display = String(accVal);
      } else if (column.sortValue) {
        const sv = column.sortValue(row);
        display = String(sv);
      } else {
        const rendered = resolveValue(row, column, idx);
        if (typeof rendered === "string") display = rendered;
        else if (typeof rendered === "number") display = String(rendered);
        // React elements → display stays "" (avoids [object Object])
      }
      const key = display.toLowerCase(); // case-insensitive grouping

      if (!groupMap.has(key)) {
        groupMap.set(key, groups.length);
        groups.push({ key, display, rows: [] });
      }
      groups[groupMap.get(key)!].rows.push({ row, originalIndex: idx });
    });

    return groups;
  }, [resolvedGroupBy, effectiveColumns, sortedData]);

  // Auto-initialize expansion state for newly seen groups
  useEffect(() => {
    if (!groupedData) return;
    setExpandedGroups((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const g of groupedData) {
        if (!(g.key in next)) {
          next[g.key] = defaultGroupExpanded !== false; // default: expanded
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [groupedData, defaultGroupExpanded]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // When panelDeduplicateBy is set, only the first row for each key is shown in panel view
  const panelRows = useMemo(() => {
    if (!panelDeduplicateBy) return sortedData;
    const seen = new Set<string | number>();
    return sortedData.filter((row) => {
      const key = panelDeduplicateBy(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [sortedData, panelDeduplicateBy]);

  // When grouping is active AND showing group headers, we render an extra
  // leading column for the expand/collapse chevron.
  const showGroupExpandCol = !!(resolvedGroupBy && resolvedShowGroupHeader);

  // ── Effective per-column stickiness (column-defined + user-configured) ───────
  // User config takes precedence over the column-defined sticky value, so users
  // can override or clear a code-defined pin at runtime.
  const getEffectiveSticky = (
    col: TableColumn<T>,
  ): "left" | "right" | undefined =>
    internalStickyColumns[col.id] ?? col.sticky ?? undefined;

  // True when at least one visible column is pinned to the left (code-defined or user-configured).
  // Used to decide whether the grouped-row spacer td needs an opaque background.
  const hasLeftStickyColumn = orderedVisibleColumns.some(
    (col) => getEffectiveSticky(col) === "left",
  );

  // ── Sticky-right column offsets ──────────────────────────────────────────────
  // When multiple columns are pinned to the right (via sticky:'right',
  // stickyActions, or user config), each one needs a `right` offset equal to
  // the total width of all right-sticky columns further to the right. We
  // calculate this from internalColWidths → column.width → column.minWidth.
  const rightStickyOffsets = useMemo((): Record<string, number | undefined> => {
    const offsets: Record<string, number | undefined> = {};
    let cumulative = 0;
    for (let i = orderedVisibleColumns.length - 1; i >= 0; i--) {
      const col = orderedVisibleColumns[i];
      const effective = internalStickyColumns[col.id] ?? col.sticky;
      const isSticky =
        effective === "right" ||
        (stickyActions && i === orderedVisibleColumns.length - 1);
      if (!isSticky) continue;
      offsets[col.id] = cumulative;
      const w =
        internalColWidths[col.id] ??
        (typeof col.width === "number" ? col.width : undefined) ??
        (typeof col.minWidth === "number" ? col.minWidth : undefined);
      if (w !== undefined) cumulative += w;
    }
    return offsets;
  }, [
    orderedVisibleColumns,
    stickyActions,
    internalColWidths,
    internalStickyColumns,
  ]);

  // ── Visual class helpers ─────────────────────────────────────────────────────
  const wrapperClasses = classNames(
    "w-full",
    variantWrapperBase[variant],
    rounded &&
      "overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60",
    fullHeight && "h-full flex flex-col",
    className,
  );
  const tableClasses = classNames(variantTableBase[variant], tableClassName);

  const cellPadding = variantCellPadding[variant];
  const sidePaddingTokens = variantSidePadding[variant];

  const headerToneClasses =
    variant === "flat"
      ? "bg-white text-neutral-500 dark:bg-transparent dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
      : getToneHeaderClasses(tone);
  const headerBaseClasses =
    "text-xs font-semibold uppercase tracking-wide text-left text-neutral-600 dark:text-neutral-200";

  const tbodyClasses = classNames(
    "bg-white dark:bg-neutral-900/40 divide-y divide-neutral-200 dark:divide-neutral-800",
    (striped || noBorders) && "divide-y-0",
    bodyClassName,
  );

  const scrollContainerStyle = maxHeight
    ? {
        maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
      }
    : undefined;

  const hasRows = sortedData.length > 0;

  // ── Empty state renderers ────────────────────────────────────────────────────
  const emptyColSpan =
    (showGroupExpandCol ? visibleColumns.length + 1 : visibleColumns.length) ||
    1;

  const renderEmptyState = () => (
    <tr>
      <td
        colSpan={emptyColSpan}
        className={classNames(
          "px-6 py-16 text-center text-sm font-medium text-neutral-500 dark:text-neutral-300",
        )}
      >
        {emptyState ?? "No data to display"}
      </td>
    </tr>
  );

  const renderPanelEmptyState = () => (
    <div className="px-6 py-16 text-center text-sm font-medium text-neutral-500 dark:text-neutral-300">
      {emptyState ?? "No data to display"}
    </div>
  );

  // ── Row renderer (shared between grouped and flat modes) ──────────────────────
  const renderRow = (
    row: T,
    originalIndex: number,
    isGroupedSubRow = false,
  ) => {
    const key = resolveRowKey(row, originalIndex, rowKey);

    // Check reference or ID match
    const isSelected = selectionLookup?.has(row) || selectionLookup?.has(key);
    const isHighlighted =
      !isSelected && (rowHighlight?.(row, originalIndex) ?? false);

    const selectedClass = isSelected ? getSelectedRowClass(color) : "";
    const highlightRowClass = isHighlighted ? getHighlightRowClass(color) : "";
    const baseRowBgClass =
      striped && originalIndex % 2 === 1
        ? "bg-neutral-100 dark:bg-neutral-800/40"
        : "bg-white dark:bg-neutral-900";
    // Use fully-opaque hover for all cells so the whole row shifts uniformly.
    // Sticky cells need !important to override their explicit base background class.
    const rowCellHoverClass =
      !isSelected && !isHighlighted && hoverable
        ? striped && originalIndex % 2 === 1
          ? "group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700"
          : "group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700"
        : undefined;
    const stickyCellHoverClass =
      !isSelected && !isHighlighted && hoverable
        ? striped && originalIndex % 2 === 1
          ? "group-hover:!bg-neutral-200 dark:group-hover:!bg-neutral-700"
          : "group-hover:!bg-neutral-200 dark:group-hover:!bg-neutral-700"
        : undefined;
    const rowClasses = classNames(
      cellPadding,
      "group",
      isSelected
        ? selectedClass
        : isHighlighted
          ? highlightRowClass
          : striped &&
            originalIndex % 2 === 1 &&
            "bg-neutral-100 dark:bg-neutral-800/40",
      isHighlighted && hoverable && "hover:brightness-95",
      "transition-colors duration-150 ease-out",
      onRowClick ? "cursor-pointer" : "cursor-default",
      rowClassName ? rowClassName(row, originalIndex) : undefined,
    );

    return (
      <tr
        key={key}
        className={rowClasses}
        onClick={onRowClick ? () => onRowClick(row, originalIndex) : undefined}
      >
        {/* Expand spacer column — only in grouped mode with visible group headers */}
        {showGroupExpandCol && (
          <td
            className={classNames(
              "w-10 sticky left-0 z-20",
              // Only apply an opaque background when there is a left-sticky data column;
              // otherwise the spacer can remain transparent.
              hasLeftStickyColumn &&
                (isSelected
                  ? getSelectedRowClass(color)
                  : isHighlighted
                    ? getHighlightRowClass(color)
                    : baseRowBgClass),
              // When there are sticky columns use the opaque hover; otherwise use the normal semi-transparent hover.
              hasLeftStickyColumn ? stickyCellHoverClass : rowCellHoverClass,
            )}
            aria-hidden="true"
          >
            <div className="w-full h-full" />
          </td>
        )}
        {/* Indent spacer — only in grouped mode without group headers */}
        {resolvedGroupBy && !showGroupExpandCol && (
          <td className="w-4" aria-hidden="true" />
        )}
        {orderedVisibleColumns.map((column, colIndex) => {
          const cellValue = resolveValue(row, column, originalIndex);
          // Text cells (string/number) get TruncatedText with a tooltip on actual overflow.
          // JSX cells fall back to the old maxWidth-based truncate class.
          const isTextCell =
            typeof cellValue === "string" || typeof cellValue === "number";

          const tdResizeWidth = internalColWidths[column.id];
          const effectiveSticky = getEffectiveSticky(column);
          const isStickyLeft = effectiveSticky === "left";
          const isStickyRight =
            effectiveSticky === "right" ||
            (stickyActions && colIndex === orderedVisibleColumns.length - 1);
          const rightOffset = isStickyRight
            ? rightStickyOffsets[column.id]
            : undefined;
          return (
            <td
              key={column.id}
              className={classNames(
                "whitespace-nowrap align-middle text-sm text-neutral-700 dark:text-neutral-200",
                (isStickyLeft || isStickyRight) && "sticky",
                isStickyLeft && (showGroupExpandCol ? "left-10" : "left-0"),
                // right position is set via inline style when offset > 0
                isStickyRight && !rightOffset && "right-0",
                (isStickyLeft || isStickyRight) && "z-10",
                (isStickyLeft || isStickyRight) &&
                  (isSelected
                    ? getSelectedRowClass(color)
                    : isHighlighted
                      ? getHighlightRowClass(color)
                      : striped && originalIndex % 2 === 1
                        ? "bg-neutral-100 dark:bg-neutral-800/40"
                        : (column.stickyBackgroundFn?.(row, originalIndex) ??
                          column.stickyBackground ??
                          "bg-white dark:bg-neutral-900")),
                // Sticky cells must keep an opaque background on hover to avoid scrolled content
                // bleeding through — use the fully-opaque sticky hover class instead of the semi-transparent hover.
                isStickyLeft || isStickyRight
                  ? stickyCellHoverClass
                  : rowCellHoverClass,
                (isStickyLeft || isStickyRight) &&
                  isHighlighted &&
                  hoverable &&
                  "group-hover:brightness-95",
                getCellAlignment(column.align),
                colIndex === 0 && sidePaddingTokens.left,
                colIndex === orderedVisibleColumns.length - 1 &&
                  sidePaddingTokens.right,
                // Pulsing left border indicator on the first visible cell for highlighted rows
                colIndex === 0 &&
                  isHighlighted &&
                  classNames(
                    "border-l-4 animate-pulse",
                    getHighlightBorderClass(color),
                  ),
                isStickyRight &&
                  effectiveSticky === "right" &&
                  !noBorders &&
                  "border-l border-neutral-300 dark:border-neutral-700",
                column.className,
              )}
              style={{
                ...(tdResizeWidth
                  ? {
                      width: tdResizeWidth,
                      minWidth: tdResizeWidth,
                      maxWidth: tdResizeWidth,
                    }
                  : applyWidthStyle(
                      column.width,
                      column.minWidth,
                      column.maxWidth,
                    )),
                ...(isStickyRight && rightOffset !== undefined
                  ? { right: rightOffset }
                  : {}),
              }}
            >
              <div
                className={classNames(
                  "flex items-center min-w-0",
                  "py-1",
                  sidePaddingTokens.contentVertical,
                  getCellFlexAlignment(column.align),
                  // For JSX cells with a declared maxWidth, still clip via truncate
                  !isTextCell && column.maxWidth && "truncate",
                  // Add extra left indent to the first data column in grouped sub-rows
                  isGroupedSubRow && colIndex === 0 && "pl-2",
                )}
              >
                {isTextCell ? (
                  <TruncatedText
                    text={String(cellValue)}
                    as="span"
                    delay={2000}
                    noWrapper
                    className="min-w-0 flex-1"
                  />
                ) : (
                  cellValue
                )}
              </div>
            </td>
          );
        })}
      </tr>
    );
  };

  // ── Group label for the config panel ─────────────────────────────────────────
  const getColumnLabel = (col: TableColumn<T>) =>
    typeof col.header === "string" ? col.header : col.id;

  return (
    <div className={wrapperClasses} style={style}>
      <div
        className={classNames(
          "relative flex flex-col",
          fullHeight && "flex-1 overflow-hidden h-full",
        )}
      >
        {/* ── Header bar ────────────────────────────────────────────────────── */}
        {(headerActions ||
          showViewToggle ||
          (showColumnSelector && hasHideableColumns) ||
          isUserGroupable ||
          userStickyColumns) && (
          <div className="flex-none flex items-center gap-3 border-b border-neutral-200 px-6 py-3 dark:border-neutral-700">
            {headerTitle && (
              <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                {headerTitle}
              </div>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {/* View toggle */}
              {showViewToggle && (
                <>
                  <IconButton
                    icon="ViewRows"
                    size="xs"
                    variant="ghost"
                    color={color}
                    tooltip="Table view"
                    tooltipPosition="bottom"
                    disabled={activeView === "table"}
                    aria-pressed={activeView === "table"}
                    onClick={() => {
                      setActiveView("table");
                      onViewChange?.("table");
                      onTableSettingsChange?.({
                        ...settingsSnapshotRef.current,
                        activeView: "table",
                      });
                    }}
                    aria-label="Switch to table view"
                  />
                  <IconButton
                    icon="ViewGrid"
                    size="xs"
                    variant="ghost"
                    color={color}
                    tooltip="Panel view"
                    tooltipPosition="bottom"
                    disabled={activeView === "panel"}
                    aria-pressed={activeView === "panel"}
                    onClick={() => {
                      setActiveView("panel");
                      onViewChange?.("panel");
                      onTableSettingsChange?.({
                        ...settingsSnapshotRef.current,
                        activeView: "panel",
                      });
                    }}
                    aria-label="Switch to panel view"
                  />
                </>
              )}

              {/* Column visibility toggle — table view only */}
              {showColumnSelector &&
                hasHideableColumns &&
                activeView === "table" && (
                  <div className="relative" ref={colPanelRef}>
                    <IconButton
                      icon="EyeOpen"
                      size="xs"
                      variant="ghost"
                      color={color}
                      tooltip="Columns"
                      tooltipPosition="bottom"
                      aria-pressed={colPanelOpen}
                      onClick={() => setColPanelOpen((o) => !o)}
                      aria-label="Toggle column visibility"
                    />
                    {colPanelOpen && (
                      <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-800">
                          Columns
                        </div>
                        <div className="py-1 max-h-64 overflow-y-auto">
                          {menuColumns.map((col) => {
                            const hideable = col.hideable !== false;
                            const visible = colVisibility[col.id] !== false;
                            const label =
                              typeof col.header === "string"
                                ? col.header
                                : col.id;
                            return (
                              <label
                                key={col.id}
                                className={classNames(
                                  "flex items-center gap-2.5 px-3 py-1.5 text-sm select-none",
                                  hideable
                                    ? "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                                    : "cursor-not-allowed opacity-40",
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={visible}
                                  disabled={!hideable}
                                  onChange={() => {
                                    const next = {
                                      ...colVisibility,
                                      [col.id]: !visible,
                                    };
                                    setColVisibility(next);
                                    onColumnVisibilityChange?.(next);
                                    onTableSettingsChange?.({
                                      ...settingsSnapshotRef.current,
                                      columnVisibility: next,
                                    });
                                  }}
                                  className={classNames(
                                    "h-3.5 w-3.5 rounded border-neutral-300",
                                    getAccentClass(color),
                                  )}
                                />
                                <span className="text-neutral-700 dark:text-neutral-200">
                                  {label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        <div className="border-t border-neutral-100 px-3 py-2 dark:border-neutral-800">
                          <Button
                            variant="ghost"
                            color={color}
                            size="xs"
                            onClick={() => {
                              const reset: Record<string, boolean> = {};
                              for (const col of effectiveColumns) {
                                reset[col.id] = getDefaultColumnVisibility(col);
                              }
                              setColVisibility(reset);
                              onColumnVisibilityChange?.(reset);
                              onTableSettingsChange?.({
                                ...settingsSnapshotRef.current,
                                columnVisibility: reset,
                              });
                            }}
                          >
                            Reset to default
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* Group-by config button — table view only */}
              {isUserGroupable && activeView === "table" && (
                <div className="relative" ref={groupPanelRef}>
                  {/* Wrapper to position the active indicator dot */}
                  <div className="relative inline-flex">
                    <IconButton
                      icon="Group"
                      size="xs"
                      variant="ghost"
                      color={color}
                      tooltip="Group by"
                      tooltipPosition="bottom"
                      aria-pressed={groupPanelOpen || !!resolvedGroupBy}
                      onClick={() => setGroupPanelOpen((o) => !o)}
                      aria-label="Configure row grouping"
                    />
                    {/* Active indicator dot */}
                    {resolvedGroupBy && (
                      <span
                        className={classNames(
                          "pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-neutral-900",
                          getDotColorClass(color),
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {groupPanelOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 min-w-[220px] rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                      {/* Panel header */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                          Group by
                        </span>
                        {internalGroupBy && (
                          <button
                            type="button"
                            onClick={() => handleGroupChange(null)}
                            className="text-xs text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Column radio list — shows ALL columns (even hidden), excludes groupable:false */}
                      <div className="py-1 max-h-64 overflow-y-auto">
                        <label className="flex items-center gap-2.5 px-3 py-1.5 text-sm select-none cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
                          <input
                            type="radio"
                            name="table-group-by"
                            checked={!internalGroupBy}
                            onChange={() => handleGroupChange(null)}
                            className={classNames(
                              "h-3.5 w-3.5 border-neutral-300",
                              getAccentClass(color),
                            )}
                          />
                          <span className="italic text-neutral-400 dark:text-neutral-500">
                            None
                          </span>
                        </label>
                        {menuColumns
                          .filter((col) => col.groupable !== false)
                          .map((col) => (
                            <label
                              key={col.id}
                              className="flex items-center gap-2.5 px-3 py-1.5 text-sm select-none cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                            >
                              <input
                                type="radio"
                                name="table-group-by"
                                checked={internalGroupBy === col.id}
                                onChange={() => handleGroupChange(col.id)}
                                className={classNames(
                                  "h-3.5 w-3.5 border-neutral-300",
                                  getAccentClass(color),
                                )}
                              />
                              <span className="text-neutral-700 dark:text-neutral-200">
                                {getColumnLabel(col)}
                              </span>
                              {/* Show "(hidden)" hint when the column is currently not visible */}
                              {colVisibility[col.id] === false && (
                                <span className="ml-auto text-xs text-neutral-400 dark:text-neutral-500">
                                  hidden
                                </span>
                              )}
                            </label>
                          ))}
                      </div>

                      {/* Show group header toggle */}
                      <div className="border-t border-neutral-100 px-3 py-2.5 dark:border-neutral-800">
                        <label className="flex items-center gap-2.5 text-sm select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={resolvedShowGroupHeader}
                            onChange={() => {
                              setShowGroupHeaderLocal((v) => {
                                const next = !v;
                                onTableSettingsChange?.({
                                  ...settingsSnapshotRef.current,
                                  showGroupHeader: next,
                                });
                                return next;
                              });
                            }}
                            className={classNames(
                              "h-3.5 w-3.5 rounded border-neutral-300",
                              getAccentClass(color),
                            )}
                          />
                          <span className="text-neutral-700 dark:text-neutral-200">
                            Show group header
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sticky column picker — table view only */}
              {userStickyColumns && activeView === "table" && (
                <div className="relative" ref={stickyPanelRef}>
                  <div className="relative inline-flex">
                    <IconButton
                      icon="Pin"
                      size="xs"
                      variant="ghost"
                      color={color}
                      tooltip="Sticky columns"
                      tooltipPosition="bottom"
                      aria-pressed={stickyPanelOpen || hasStickyColumns}
                      onClick={() => setStickyPanelOpen((o) => !o)}
                      aria-label="Configure sticky columns"
                    />
                    {hasStickyColumns && (
                      <span
                        className={classNames(
                          "pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-neutral-900",
                          getDotColorClass(color),
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {stickyPanelOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 min-w-[240px] rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                      {/* Panel header */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                          Sticky columns
                        </span>
                        {hasStickyColumns && (
                          <button
                            type="button"
                            onClick={() => {
                              setInternalStickyColumns({});
                              onStickyColumnsChange?.({});
                            }}
                            className="text-xs text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* Column list */}
                      <div className="py-1 max-h-64 overflow-y-auto">
                        {menuColumns.map((col) => {
                          const label = getColumnLabel(col);
                          const current = internalStickyColumns[col.id] ?? null;
                          return (
                            <div
                              key={col.id}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                            >
                              <span className="flex-1 truncate text-neutral-700 dark:text-neutral-200">
                                {label}
                              </span>
                              {/* Left / None / Right toggle */}
                              <div className="flex items-center rounded-md border border-neutral-200 dark:border-neutral-700 overflow-hidden text-xs">
                                {(["left", null, "right"] as const).map(
                                  (side) => (
                                    <button
                                      key={String(side)}
                                      type="button"
                                      onClick={() =>
                                        handleStickyChange(col.id, side)
                                      }
                                      className={classNames(
                                        "px-2 py-0.5 transition-colors select-none",
                                        current === side
                                          ? "bg-neutral-200 dark:bg-neutral-700 font-semibold text-neutral-900 dark:text-neutral-100"
                                          : "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-neutral-500",
                                      )}
                                    >
                                      {side === "left"
                                        ? "←"
                                        : side === "right"
                                          ? "→"
                                          : "·"}
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="border-t border-neutral-100 px-3 py-2 dark:border-neutral-800">
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">
                          ← pin left &nbsp;·&nbsp; · unpin &nbsp;·&nbsp; → pin
                          right
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {headerActions}
            </div>
          </div>
        )}

        {/* ── Table view ────────────────────────────────────────────────────── */}
        {activeView === "table" && visibleColumns.length > 0 && (
          <div
            className={classNames("relative", fullHeight && "flex-1 min-h-0")}
          >
            <div
              className={classNames(
                "overflow-x-auto relative",
                fullHeight ? "h-full overflow-y-auto" : "",
                !fullHeight && maxHeight && "overflow-y-auto",
              )}
              style={!fullHeight ? scrollContainerStyle : undefined}
            >
              <table
                className={tableClasses}
                style={
                  useFixedLayout
                    ? { tableLayout: "fixed", width: "100%" }
                    : undefined
                }
              >
                {/* Colgroup drives precise column widths in fixed layout */}
                {useFixedLayout && (
                  <colgroup>
                    {showGroupExpandCol && <col style={{ width: "2.5rem" }} />}
                    {resolvedGroupBy && !showGroupExpandCol && (
                      <col style={{ width: "1rem" }} />
                    )}
                    {orderedVisibleColumns.map((col) => {
                      const resizedW = internalColWidths[col.id];
                      if (resizedW)
                        return (
                          <col
                            key={col.id}
                            style={{
                              width: `${resizedW}px`,
                              minWidth: `${resizedW}px`,
                            }}
                          />
                        );
                      // For non-resized columns, honour width/minWidth so fixed layout can't squeeze them below their declared minimum
                      const declaredW =
                        col.width !== undefined
                          ? typeof col.width === "number"
                            ? col.width
                            : col.width
                          : undefined;
                      const declaredMin =
                        col.minWidth !== undefined
                          ? typeof col.minWidth === "number"
                            ? col.minWidth
                            : col.minWidth
                          : undefined;
                      const colW = declaredW ?? declaredMin;
                      return (
                        <col
                          key={col.id}
                          style={
                            colW !== undefined
                              ? {
                                  width:
                                    typeof colW === "number"
                                      ? `${colW}px`
                                      : colW,
                                  minWidth:
                                    typeof colW === "number"
                                      ? `${colW}px`
                                      : colW,
                                }
                              : undefined
                          }
                        />
                      );
                    })}
                  </colgroup>
                )}
                <thead>
                  <tr
                    className={classNames(
                      headerToneClasses,
                      "border-b dark:border-opacity-60",
                    )}
                  >
                    {/* Extra leading th for expand/collapse when grouping with group headers */}
                    {showGroupExpandCol && (
                      <th
                        scope="col"
                        className={classNames(
                          headerToneClasses,
                          "sticky left-0",
                          stickyHeader && "top-0",
                          stickyHeader ? "z-30" : "z-10",
                          "w-10 pl-3 pr-1",
                        )}
                        aria-hidden="true"
                      >
                        <div className="w-full h-full" />
                      </th>
                    )}
                    {/* Indent spacer th for grouped mode without group headers */}
                    {resolvedGroupBy && !showGroupExpandCol && (
                      <th scope="col" className="w-4" aria-hidden="true" />
                    )}
                    {orderedVisibleColumns.map((column, colIndex) => {
                      const isSorted = resolvedSort?.columnId === column.id;
                      const sortDirection = isSorted
                        ? resolvedSort?.direction
                        : undefined;

                      const isResizable =
                        resizableColumns && column.resizable !== false;
                      const resizeWidth = internalColWidths[column.id];
                      const thEffectiveSticky = getEffectiveSticky(column);
                      const isStickyLeft = thEffectiveSticky === "left";
                      const isStickyRight =
                        thEffectiveSticky === "right" ||
                        (stickyActions &&
                          colIndex === orderedVisibleColumns.length - 1);
                      const rightOffset = isStickyRight
                        ? rightStickyOffsets[column.id]
                        : undefined;

                      return (
                        <th
                          key={column.id}
                          ref={(el) => {
                            thRefs.current[column.id] = el;
                          }}
                          scope="col"
                          className={classNames(
                            headerBaseClasses,
                            headerToneClasses,
                            cellPadding,
                            stickyHeader && "sticky top-0",
                            (isStickyLeft || isStickyRight) && "sticky",
                            isStickyLeft &&
                              (showGroupExpandCol ? "left-10" : "left-0"),
                            // right position is set via inline style when offset > 0
                            isStickyRight && !rightOffset && "right-0",
                            stickyHeader && (isStickyLeft || isStickyRight)
                              ? "z-30"
                              : stickyHeader
                                ? "z-20"
                                : isStickyLeft || isStickyRight
                                  ? "z-10"
                                  : "",
                            getCellAlignment(column.align),
                            "overflow-hidden",
                            isResizable && "relative",
                            isStickyRight &&
                              thEffectiveSticky === "right" &&
                              !noBorders &&
                              "border-l border-neutral-200 dark:border-neutral-700",
                            column.headerClassName,
                          )}
                          style={{
                            ...(resizeWidth
                              ? {
                                  width: resizeWidth,
                                  minWidth: resizeWidth,
                                  maxWidth: resizeWidth,
                                }
                              : applyWidthStyle(
                                  column.width,
                                  column.minWidth,
                                  column.maxWidth,
                                )),
                            ...(isStickyRight && rightOffset !== undefined
                              ? { right: rightOffset }
                              : {}),
                          }}
                          aria-sort={
                            sortDirection
                              ? sortDirection === "asc"
                                ? "ascending"
                                : "descending"
                              : "none"
                          }
                          title={column.tooltip}
                        >
                          <div
                            className={classNames(
                              "flex items-center gap-1 min-w-0",
                              column.align === "right"
                                ? "justify-end"
                                : column.align === "center"
                                  ? "justify-center"
                                  : "justify-start",
                            )}
                          >
                            <span className="truncate min-w-0 flex-1">
                              {column.header}
                            </span>
                            {column.sortable ? (
                              <IconButton
                                icon={
                                  sortDirection
                                    ? sortIconMap[sortDirection]
                                    : sortIconMap.default
                                }
                                size="xs"
                                variant="icon"
                                color={isSorted ? color : "slate"}
                                rounded="md"
                                accent={false}
                                tooltip={
                                  sortDirection === "asc"
                                    ? "Sort descending"
                                    : sortDirection === "desc"
                                      ? "Clear sort"
                                      : "Sort ascending"
                                }
                                tooltipPosition="bottom"
                                className={classNames(
                                  "ml-1 flex-shrink-0",
                                  !isSorted &&
                                    "text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-200",
                                )}
                                onClick={() => handleSortToggle(column)}
                                aria-label="Toggle sort"
                              />
                            ) : null}
                          </div>
                          {/* Resize handle */}
                          {isResizable && (
                            <div
                              role="separator"
                              aria-hidden="true"
                              className="group/rh absolute inset-y-0 right-0 z-10 flex w-2 cursor-col-resize select-none items-center justify-center"
                              onMouseDown={(e) => {
                                const minW =
                                  column.minWidth !== undefined
                                    ? typeof column.minWidth === "number"
                                      ? column.minWidth
                                      : parseInt(column.minWidth, 10)
                                    : 48;
                                handleResizeStart(
                                  e,
                                  column.id,
                                  Math.max(48, isNaN(minW) ? 48 : minW),
                                );
                              }}
                            >
                              <div
                                className={classNames(
                                  "h-1/2 w-px bg-neutral-300 dark:bg-neutral-600 transition-colors",
                                  getResizeHandleHoverClass(color),
                                )}
                              />
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className={tbodyClasses}>
                  {/* ── Grouped rendering ─────────────────────────────── */}
                  {groupedData
                    ? hasRows
                      ? groupedData.map((group) => {
                          const isExpanded =
                            expandedGroups[group.key] !== false;
                          return (
                            <React.Fragment key={`group-${group.key}`}>
                              {/* Group header row */}
                              {resolvedShowGroupHeader && (
                                <tr
                                  className="cursor-pointer select-none border-b border-neutral-100 bg-neutral-50 transition-colors duration-150 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/40 dark:hover:bg-neutral-700/50"
                                  onClick={() => toggleGroup(group.key)}
                                >
                                  <td
                                    colSpan={visibleColumns.length + 1}
                                    className="py-2 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/40 dark:hover:bg-neutral-700/50"
                                  >
                                    <div
                                      className={classNames(
                                        "sticky left-0 flex w-fit items-center gap-2 bg-inherit",
                                        sidePaddingTokens.left,
                                      )}
                                    >
                                      <span
                                        className={classNames(
                                          "inline-flex text-neutral-400 dark:text-neutral-500",
                                        )}
                                      >
                                        <ChevronSvg expanded={isExpanded} />
                                      </span>
                                      <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                                        {group.display || (
                                          <span className="italic text-neutral-400 dark:text-neutral-500">
                                            empty
                                          </span>
                                        )}
                                      </span>
                                      <Badge
                                        count={group.rows.length}
                                        tone={color as PanelTone}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              )}
                              {/* Sub-rows — hidden when collapsed */}
                              {(isExpanded || !resolvedShowGroupHeader) &&
                                group.rows.map(({ row, originalIndex }) =>
                                  renderRow(row, originalIndex, true),
                                )}
                            </React.Fragment>
                          );
                        })
                      : renderEmptyState()
                    : /* ── Flat (ungrouped) rendering ──────────────────── */
                      hasRows
                      ? sortedData.map((row, rowIndex) =>
                          renderRow(row, rowIndex, false),
                        )
                      : renderEmptyState()}
                </tbody>
              </table>
              {loading && (
                <Loader
                  overlay
                  variant={loaderType}
                  label={loadingMessage}
                  progress={loaderProgress}
                  className="rounded-none"
                />
              )}
            </div>
          </div>
        )}

        {/* ── Panel view ────────────────────────────────────────────────────── */}
        {activeView === "panel" && panelItem && (
          <div
            className={classNames(
              "relative",
              fullHeight ? "flex-1 min-h-0 overflow-auto" : undefined,
            )}
            style={!fullHeight ? scrollContainerStyle : undefined}
          >
            {loading && (
              <Loader
                overlay
                variant={loaderType}
                label={loadingMessage}
                progress={loaderProgress}
                className="rounded-none"
              />
            )}
            {hasRows ? (
              <div
                className={classNames(
                  "p-4",
                  panelMinItemWidth != null
                    ? // auto-fill mode: grid base + any extra non-layout classes from consumer
                      // gap is intentionally excluded here — it lives in the inline style below
                      classNames("grid", panelGridClassName)
                    : // legacy / explicit class mode (gap lives in the class string as before)
                      (panelGridClassName ??
                        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"),
                )}
                style={
                  panelMinItemWidth != null
                    ? (() => {
                        const minW =
                          typeof panelMinItemWidth === "number"
                            ? `${panelMinItemWidth}px`
                            : panelMinItemWidth;
                        const maxW =
                          panelMaxItemWidth != null
                            ? `min(${typeof panelMaxItemWidth === "number" ? `${panelMaxItemWidth}px` : panelMaxItemWidth}, 1fr)`
                            : "1fr";
                        return {
                          gridTemplateColumns: `repeat(auto-fill, minmax(min(${minW}, 100%), ${maxW}))`,
                          gap:
                            panelGap != null
                              ? typeof panelGap === "number"
                                ? `${panelGap}px`
                                : panelGap
                              : "1rem",
                        };
                      })()
                    : undefined
                }
              >
                {panelRows.map((row, rowIndex) => (
                  <React.Fragment key={resolveRowKey(row, rowIndex, rowKey)}>
                    {panelItem(row, rowIndex)}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              renderPanelEmptyState()
            )}
          </div>
        )}

        {/* ── Footer / pagination ───────────────────────────────────────────── */}
        {(footer || (pagination && pagination.total > 0)) && (
          <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-3 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300">
            {footer
              ? footer
              : pagination && (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        Showing{" "}
                        {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
                        {Math.min(
                          pagination.page * pagination.pageSize,
                          pagination.total,
                        )}{" "}
                        of {pagination.total} results
                      </span>
                      <div className="w-32 ml-4">
                        <Select
                          value={pagination.pageSize}
                          onChange={(e) => {
                            pagination.onPageSizeChange(Number(e.target.value));
                          }}
                          size="sm"
                        >
                          <option value={20}>20 per page</option>
                          <option value={50}>50 per page</option>
                          <option value={100}>100 per page</option>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="soft"
                        color={color}
                        size="sm"
                        disabled={pagination.page === 1 || loading}
                        onClick={() =>
                          pagination.onPageChange(
                            Math.max(1, pagination.page - 1),
                          )
                        }
                        leadingIcon="ArrowLeft"
                      >
                        Previous
                      </Button>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Page {pagination.page} of{" "}
                        {Math.ceil(pagination.total / pagination.pageSize)}
                      </span>
                      <Button
                        variant="soft"
                        color={color}
                        size="sm"
                        disabled={
                          pagination.page >=
                            Math.ceil(pagination.total / pagination.pageSize) ||
                          loading
                        }
                        onClick={() =>
                          pagination.onPageChange(
                            Math.min(
                              Math.ceil(pagination.total / pagination.pageSize),
                              pagination.page + 1,
                            ),
                          )
                        }
                        trailingIcon="ArrowRight"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Table<T>(props: TableProps<T>): React.ReactElement {
  return <TableComponent {...props} />;
}

export default Table;
