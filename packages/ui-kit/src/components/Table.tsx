import React, { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { Loader, IconButton, Button, Select, Badge, type PanelTone } from '.';
import type { ThemeColor } from '../theme';
import type { IconName } from '../icons/registry';

type SortDirection = 'asc' | 'desc';

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
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  tooltip?: string;
  className?: string;
  headerClassName?: string;
  sticky?: 'left' | 'right';
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
}

export type Column<T> = TableColumn<T>;

export type TableVariant = 'default' | 'compact' | 'minimal' | 'bordered' | 'flat';

/** Internal type for a single group entry when grouping is active. */
type GroupEntry<T> = {
  key: string;
  display: string;
  rows: { row: T; originalIndex: number }[];
};

export interface TableProps<T> {
  columns?: TableColumn<T>[];
  data: T[];
  rowKey?: (row: T, index: number) => string | number;
  variant?: TableVariant;
  tone?: PanelTone;
  /** Theme color applied to action buttons, sort indicators, group dot, badges, and pagination. */
  color?: ThemeColor;
  striped?: boolean;
  noBorders?: boolean;
  hoverable?: boolean;
  stickyHeader?: boolean;
  loading?: boolean;
  loadingMessage?: string;
  loaderType?: 'spinner' | 'progress';
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
  defaultView?: 'table' | 'panel';
  /** Called whenever the user switches between table and panel view. */
  onViewChange?: (view: 'table' | 'panel') => void;
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
}

const resolveColor = (color: ThemeColor): string => {
  switch (color) {
    case 'brand':
      return 'indigo';
    case 'info':
      return 'sky';
    case 'success':
      return 'emerald';
    case 'warning':
      return 'amber';
    case 'danger':
      return 'rose';
    case 'theme':
      return 'neutral';
    case 'parallels':
      return 'red';
    default:
      return color;
  }
};

const getToneHeaderClasses = (tone: ThemeColor): string => {
  const c = resolveColor(tone);

  if (tone === 'neutral' || tone === 'theme' || tone === 'white') {
    return 'bg-neutral-50 text-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700';
  }

  return `bg-${c}-50 text-${c}-700 dark:bg-${c}-500/15 dark:text-${c}-100 border-${c}-200 dark:border-${c}-500/30`;
};

/** Returns a static `bg-*-500` class for the active-group indicator dot. */
function getDotColorClass(color: ThemeColor): string {
  switch (resolveColor(color)) {
    case 'blue':    return 'bg-blue-500';
    case 'green':   return 'bg-green-500';
    case 'teal':    return 'bg-teal-500';
    case 'cyan':    return 'bg-cyan-500';
    case 'indigo':  return 'bg-indigo-500';
    case 'purple':  return 'bg-purple-500';
    case 'violet':  return 'bg-violet-500';
    case 'red':     return 'bg-red-500';
    case 'orange':  return 'bg-orange-500';
    case 'amber':   return 'bg-amber-500';
    case 'yellow':  return 'bg-yellow-500';
    case 'lime':    return 'bg-lime-500';
    case 'emerald': return 'bg-emerald-500';
    case 'sky':     return 'bg-sky-500';
    case 'fuchsia': return 'bg-fuchsia-500';
    case 'pink':    return 'bg-pink-500';
    case 'rose':    return 'bg-rose-500';
    case 'slate':   return 'bg-slate-500';
    case 'gray':    return 'bg-gray-500';
    case 'zinc':    return 'bg-zinc-500';
    case 'neutral': return 'bg-neutral-500';
    case 'stone':   return 'bg-stone-500';
    default:        return 'bg-blue-500';
  }
}

/** Returns static `accent-*` classes for native checkbox/radio inputs. */
function getAccentClass(color: ThemeColor): string {
  switch (resolveColor(color)) {
    case 'blue':    return 'accent-blue-600 dark:accent-blue-400';
    case 'green':   return 'accent-green-600 dark:accent-green-400';
    case 'teal':    return 'accent-teal-600 dark:accent-teal-400';
    case 'cyan':    return 'accent-cyan-600 dark:accent-cyan-400';
    case 'indigo':  return 'accent-indigo-600 dark:accent-indigo-400';
    case 'purple':  return 'accent-purple-600 dark:accent-purple-400';
    case 'violet':  return 'accent-violet-600 dark:accent-violet-400';
    case 'red':     return 'accent-red-600 dark:accent-red-400';
    case 'orange':  return 'accent-orange-600 dark:accent-orange-400';
    case 'amber':   return 'accent-amber-600 dark:accent-amber-400';
    case 'yellow':  return 'accent-yellow-600 dark:accent-yellow-400';
    case 'lime':    return 'accent-lime-600 dark:accent-lime-400';
    case 'emerald': return 'accent-emerald-600 dark:accent-emerald-400';
    case 'sky':     return 'accent-sky-600 dark:accent-sky-400';
    case 'fuchsia': return 'accent-fuchsia-600 dark:accent-fuchsia-400';
    case 'pink':    return 'accent-pink-600 dark:accent-pink-400';
    case 'rose':    return 'accent-rose-600 dark:accent-rose-400';
    case 'slate':   return 'accent-slate-600 dark:accent-slate-400';
    case 'gray':    return 'accent-gray-600 dark:accent-gray-400';
    case 'zinc':    return 'accent-zinc-600 dark:accent-zinc-400';
    case 'neutral': return 'accent-neutral-700 dark:accent-neutral-300';
    case 'stone':   return 'accent-stone-600 dark:accent-stone-400';
    default:        return 'accent-blue-600 dark:accent-blue-400';
  }
}

const variantCellPadding: Record<TableVariant, string> = {
  default: 'px-6 py-5 text-sm',
  compact: 'px-4 py-3 text-sm',
  minimal: 'px-3 py-4 text-xs',
  bordered: 'px-5 py-5 text-sm',
  flat: 'px-4 py-3 text-sm',
};

const variantSidePadding: Record<TableVariant, { left: string; right: string; contentVertical: string }> = {
  default: { left: 'pl-6', right: 'pr-6', contentVertical: 'py-1.5' },
  compact: { left: 'pl-4', right: 'pr-4', contentVertical: 'py-1' },
  minimal: { left: 'pl-3', right: 'pr-3', contentVertical: 'py-1.5' },
  bordered: { left: 'pl-5', right: 'pr-5', contentVertical: 'py-1.5' },
  flat: { left: 'pl-4', right: 'pr-4', contentVertical: 'py-1.5' },
};

const variantTableBase: Record<TableVariant, string> = {
  default: 'min-w-full divide-y divide-neutral-200 dark:divide-neutral-700',
  compact: 'min-w-full divide-y divide-neutral-200 dark:divide-neutral-700',
  minimal: 'min-w-full divide-y divide-neutral-200 dark:divide-neutral-700',
  bordered: 'min-w-full border border-neutral-200 dark:border-neutral-700',
  flat: 'min-w-full divide-y divide-neutral-100 dark:divide-neutral-800',
};

const variantWrapperBase: Record<TableVariant, string> = {
  default: 'overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900/90',
  compact: 'overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900/90',
  minimal: 'overflow-hidden rounded-xl border border-neutral-200/60 bg-white/95 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900/90',
  bordered: 'overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900',
  flat: 'overflow-hidden bg-transparent dark:bg-transparent',
};

const alignmentClass: Record<NonNullable<TableColumn<unknown>['align']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const alignmentFlexClass: Record<NonNullable<TableColumn<unknown>['align']>, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
};

const getCellAlignment = (align?: TableColumn<unknown>['align']) => (align ? alignmentClass[align] : 'text-left');
const getCellFlexAlignment = (align?: TableColumn<unknown>['align']) => (align ? alignmentFlexClass[align] : 'justify-start');

const sortIconMap: Record<'asc' | 'desc' | 'default', IconName> = {
  asc: 'ArrowUp',
  desc: 'ArrowDown',
  default: 'Dots',
};

function resolveValue<T>(row: T, column: TableColumn<T>, index: number): React.ReactNode {
  if (column.render) {
    return column.render(row, index);
  }

  if (column.accessor) {
    if (typeof column.accessor === 'function') {
      return column.accessor(row, index);
    }

    return (row as Record<string, unknown>)[column.accessor as string] as React.ReactNode;
  }

  return null;
}

function resolveRowKey<T>(row: T, index: number, rowKey?: (row: T, index: number) => string | number): string | number {
  if (rowKey) {
    return rowKey(row, index);
  }

  if (typeof (row as Record<string, unknown>).id !== 'undefined') {
    return String((row as Record<string, unknown>).id);
  }

  return index;
}

function applyWidthStyle(width?: string | number, minWidth?: string | number, maxWidth?: string | number) {
  if (!width && !minWidth && !maxWidth) {
    return undefined;
  }

  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (minWidth !== undefined) style.minWidth = typeof minWidth === 'number' ? `${minWidth}px` : minWidth;
  if (maxWidth !== undefined) {
    style.maxWidth = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;
    // If maxWidth is set, prevent the column from expanding beyond it
    if (!width) {
      style.width = style.maxWidth;
    }
  }

  return style;
}

function getNextSortDirection(current?: SortDirection): SortDirection {
  if (current === 'asc') {
    return 'desc';
  }

  return 'asc';
}

// ── Inline chevron SVG (avoids importing icon components directly) ─────────────
function ChevronSvg({ expanded }: { expanded: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="14" height="14" className={classNames('flex-shrink-0 text-current transition-transform duration-200', expanded && 'rotate-90')} aria-hidden="true">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TableComponent<T>({
  columns,
  data,
  rowKey,
  variant = 'default',
  tone = 'neutral',
  striped = false,
  noBorders = false,
  hoverable = true,
  stickyHeader = false,
  loading = false,
  loadingMessage,
  loaderType = 'spinner',
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
  panelGap,
  panelDeduplicateBy,
  headerTitle = '',
  columnVisibility: columnVisibilityProp,
  onColumnVisibilityChange,
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
  color = 'blue',
}: TableProps<T>) {
  const showViewToggle = !!columns?.length && !!panelItem;
  const defaultViewResolved: 'table' | 'panel' = defaultView ?? (showViewToggle ? 'table' : panelItem ? 'panel' : 'table');
  const [activeView, setActiveView] = useState<'table' | 'panel'>(defaultViewResolved);

  const [internalSort, setInternalSort] = useState<TableSortState | null>(defaultSort ?? null);

  const resolvedSort = sortState ?? internalSort;

  // ── Column visibility ────────────────────────────────────────────────────────
  const [colVisibility, setColVisibility] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const col of columns ?? []) init[col.id] = columnVisibilityProp?.[col.id] ?? true;
    return init;
  });

  // Sync when the columnVisibility prop changes (e.g. after loading saved config)
  useEffect(() => {
    if (!columnVisibilityProp) return;
    setColVisibility((prev) => {
      const next = { ...prev };
      for (const col of columns ?? []) next[col.id] = columnVisibilityProp[col.id] ?? prev[col.id] ?? true;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibilityProp]);

  const [colPanelOpen, setColPanelOpen] = useState(false);
  const colPanelRef = useRef<HTMLDivElement>(null);

  // ── Column resize ─────────────────────────────────────────────────────────────
  const [internalColWidths, setInternalColWidths] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    if (columnWidthsProp) {
      Object.assign(init, columnWidthsProp);
    } else {
      for (const col of columns ?? []) {
        if (typeof col.width === 'number') {
          init[col.id] = col.width;
        } else if (typeof col.width === 'string' && /^\d+(\.\d+)?px$/.test(col.width)) {
          init[col.id] = parseFloat(col.width);
        }
      }
    }
    return init;
  });

  // Sync when columnWidths prop changes (e.g. after loading saved config)
  useEffect(() => {
    if (!columnWidthsProp) return;
    setInternalColWidths((prev) => ({ ...prev, ...columnWidthsProp }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnWidthsProp]);

  // refs: one per <th> for DOM measurement, plus transient resize state
  const thRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  const resizingRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);
  const widthsDuringResizeRef = useRef<Record<string, number>>({});

  // Clean up any lingering body styles if the component unmounts mid-drag
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  const handleResizeStart = (e: React.MouseEvent, colId: string, minColWidth: number) => {
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

    const startWidth = currentWidths[colId] ?? thRefs.current[colId]?.offsetWidth ?? 100;
    resizingRef.current = { colId, startX: e.clientX, startWidth };
    widthsDuringResizeRef.current = { ...currentWidths };

    const onMouseMove = (moveEvt: MouseEvent) => {
      if (!resizingRef.current) return;
      const newWidth = Math.max(minColWidth, resizingRef.current.startWidth + (moveEvt.clientX - resizingRef.current.startX));
      widthsDuringResizeRef.current = { ...widthsDuringResizeRef.current, [resizingRef.current.colId]: newWidth };
      setInternalColWidths({ ...widthsDuringResizeRef.current });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      onColumnWidthChange?.(widthsDuringResizeRef.current);
      resizingRef.current = null;
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // When resizable and any width is stored, switch the table to fixed layout
  // so column widths are honoured precisely.
  const useFixedLayout = resizableColumns && Object.keys(internalColWidths).length > 0;

  // ── Grouping state ───────────────────────────────────────────────────────────
  const [internalGroupBy, setInternalGroupBy] = useState<string | null>(defaultGroupBy ?? null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [groupPanelOpen, setGroupPanelOpen] = useState(false);
  const [showGroupHeaderLocal, setShowGroupHeaderLocal] = useState(showGroupHeader ?? true);
  const groupPanelRef = useRef<HTMLDivElement>(null);

  const resolvedGroupBy = groupBy ?? internalGroupBy;
  const resolvedShowGroupHeader = showGroupHeader ?? showGroupHeaderLocal;

  // ── Outside-click handlers ───────────────────────────────────────────────────
  useEffect(() => {
    if (!colPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (colPanelRef.current && !colPanelRef.current.contains(e.target as Node)) {
        setColPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [colPanelOpen]);

  useEffect(() => {
    if (!groupPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (groupPanelRef.current && !groupPanelRef.current.contains(e.target as Node)) {
        setGroupPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [groupPanelOpen]);

  // ── Sort handler ─────────────────────────────────────────────────────────────
  const handleSortToggle = (column: TableColumn<T>) => {
    if (!column.sortable) {
      return;
    }

    const nextDirection = getNextSortDirection(resolvedSort?.columnId === column.id ? resolvedSort.direction : undefined);

    const nextSort = nextDirection ? { columnId: column.id, direction: nextDirection } : null;

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

    // sortValue takes priority; fall back to accessor, then render
    const getValue = column.sortValue
      ? (row: T) => column.sortValue!(row)
      : column.render
        ? (row: T, index: number) => column.render!(row, index)
        : (row: T, index: number) => resolveValue(row, column, index);

    const sorted = [...data];
    sorted.sort((a, b) => {
      const aValue = getValue(a, data.indexOf(a));
      const bValue = getValue(b, data.indexOf(b));

      if (aValue === bValue) {
        return 0;
      }

      const safeString = (val: React.ReactNode): string => {
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return String(val);
        if (typeof val === 'boolean') return String(val);
        return '';
      };

      const aComparable = typeof aValue === 'number' ? aValue : safeString(aValue).toLowerCase();
      const bComparable = typeof bValue === 'number' ? bValue : safeString(bValue).toLowerCase();

      if (aComparable < bComparable) {
        return resolvedSort.direction === 'asc' ? -1 : 1;
      }

      return resolvedSort.direction === 'asc' ? 1 : -1;
    });

    return sorted;
  }, [resolvedSort, columns, data, manualSorting]);

  // ── Column helpers ───────────────────────────────────────────────────────────
  const effectiveColumns = columns ?? [];

  // User-configurable grouping is only shown when groupable=true and no code-defined groupBy
  const isUserGroupable = groupable === true && !groupBy && effectiveColumns.length > 0;

  // The grouped column is always hidden from the rendered table
  const visibleColumns = effectiveColumns.filter((col) => colVisibility[col.id] !== false && col.id !== resolvedGroupBy);
  const hasHideableColumns = effectiveColumns.some((col) => col.hideable !== false);

  // ── Grouped data ─────────────────────────────────────────────────────────────
  const groupedData = useMemo((): GroupEntry<T>[] | null => {
    if (!resolvedGroupBy) return null;
    const column = effectiveColumns.find((c) => c.id === resolvedGroupBy);
    if (!column) return null;

    const groups: GroupEntry<T>[] = [];
    const groupMap = new Map<string, number>();

    sortedData.forEach((row, idx) => {
      // Resolution priority: groupValue → accessor primitive → sortValue → render primitive → ""
      let display = '';
      if (column.groupValue) {
        display = column.groupValue(row);
      } else if (column.accessor) {
        const accVal = typeof column.accessor === 'function' ? column.accessor(row, idx) : (row as Record<string, unknown>)[column.accessor as string];
        if (typeof accVal === 'string') display = accVal;
        else if (typeof accVal === 'number') display = String(accVal);
      } else if (column.sortValue) {
        const sv = column.sortValue(row);
        display = String(sv);
      } else {
        const rendered = resolveValue(row, column, idx);
        if (typeof rendered === 'string') display = rendered;
        else if (typeof rendered === 'number') display = String(rendered);
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

  // ── Visual class helpers ─────────────────────────────────────────────────────
  const wrapperClasses = classNames(
    'w-full',
    variantWrapperBase[variant],
    rounded && 'overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60',
    fullHeight && 'h-full flex flex-col',
    className,
  );
  const tableClasses = classNames(variantTableBase[variant], tableClassName);

  const cellPadding = variantCellPadding[variant];
  const sidePaddingTokens = variantSidePadding[variant];

  const headerToneClasses = variant === 'flat' ? 'bg-white text-neutral-500 dark:bg-transparent dark:text-neutral-400 border-neutral-200 dark:border-neutral-700' : getToneHeaderClasses(tone);
  const headerBaseClasses = 'text-xs font-semibold uppercase tracking-wide text-left text-neutral-600 dark:text-neutral-200';

  const tbodyClasses = classNames('bg-white dark:bg-neutral-900/40 divide-y divide-neutral-200 dark:divide-neutral-800', (striped || noBorders) && 'divide-y-0', bodyClassName);

  const scrollContainerStyle = maxHeight
    ? {
        maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
      }
    : undefined;

  const hasRows = sortedData.length > 0;

  // ── Empty state renderers ────────────────────────────────────────────────────
  const emptyColSpan = (showGroupExpandCol ? visibleColumns.length + 1 : visibleColumns.length) || 1;

  const renderEmptyState = () => (
    <tr>
      <td colSpan={emptyColSpan} className={classNames('px-6 py-16 text-center text-sm font-medium text-neutral-500 dark:text-neutral-300')}>
        {emptyState ?? 'No data to display'}
      </td>
    </tr>
  );

  const renderPanelEmptyState = () => <div className="px-6 py-16 text-center text-sm font-medium text-neutral-500 dark:text-neutral-300">{emptyState ?? 'No data to display'}</div>;

  // ── Row renderer (shared between grouped and flat modes) ──────────────────────
  const renderRow = (row: T, originalIndex: number, isGroupedSubRow = false) => {
    const key = resolveRowKey(row, originalIndex, rowKey);
    const rowClasses = classNames(
      cellPadding,
      'group',
      hoverable && 'hover:bg-neutral-200/60 dark:hover:bg-neutral-700/40',
      striped && originalIndex % 2 === 1 && 'bg-neutral-100 dark:bg-neutral-800/40',
      'transition-colors duration-150 ease-out',
      onRowClick ? 'cursor-pointer' : 'cursor-default',
      rowClassName ? rowClassName(row, originalIndex) : undefined,
    );

    return (
      <tr key={key} className={rowClasses} onClick={onRowClick ? () => onRowClick(row, originalIndex) : undefined}>
        {/* Expand spacer column — only in grouped mode with visible group headers */}
        {showGroupExpandCol && <td className="w-10" aria-hidden="true" />}
        {/* Indent spacer — only in grouped mode without group headers */}
        {resolvedGroupBy && !showGroupExpandCol && <td className="w-4" aria-hidden="true" />}
        {visibleColumns.map((column, colIndex) => {
          const cellValue = resolveValue(row, column, originalIndex);
          const isTruncated = !!column.maxWidth;
          const cellTitle = isTruncated && (typeof cellValue === 'string' || typeof cellValue === 'number') ? String(cellValue) : undefined;

          const tdResizeWidth = internalColWidths[column.id];
          return (
            <td
              key={column.id}
              className={classNames(
                'whitespace-nowrap align-middle text-sm text-neutral-700 dark:text-neutral-200',
                column.sticky && 'sticky',
                column.sticky === 'left' && 'left-0',
                column.sticky === 'right' && 'right-0',
                column.sticky && 'z-10',
                column.sticky && (striped && originalIndex % 2 === 1 ? 'bg-neutral-100 dark:bg-neutral-800/40' : 'bg-white dark:bg-neutral-900'),
                // Apply hover background to sticky cells when row is hovered
                column.sticky && hoverable && 'group-hover:bg-neutral-200/60 dark:group-hover:bg-neutral-700/40',
                getCellAlignment(column.align),
                colIndex === 0 && sidePaddingTokens.left,
                colIndex === visibleColumns.length - 1 && sidePaddingTokens.right,
                tdResizeWidth && 'overflow-hidden',
                column.className,
              )}
              style={
                tdResizeWidth
                  ? { width: tdResizeWidth, minWidth: tdResizeWidth, maxWidth: tdResizeWidth }
                  : applyWidthStyle(column.width, column.minWidth, column.maxWidth)
              }
              title={cellTitle}
            >
              <div
                className={classNames(
                  'flex items-center',
                  'py-1',
                  sidePaddingTokens.contentVertical,
                  getCellFlexAlignment(column.align),
                  isTruncated && 'truncate',
                  // Add extra left indent to the first data column in grouped sub-rows
                  isGroupedSubRow && colIndex === 0 && 'pl-2',
                )}
              >
                {cellValue}
              </div>
            </td>
          );
        })}
      </tr>
    );
  };

  // ── Group label for the config panel ─────────────────────────────────────────
  const getColumnLabel = (col: TableColumn<T>) => (typeof col.header === 'string' ? col.header : col.id);

  return (
    <div className={wrapperClasses} style={style}>
      <div className={classNames('relative flex flex-col', fullHeight && 'flex-1 overflow-hidden h-full')}>
        {/* ── Header bar ────────────────────────────────────────────────────── */}
        {(headerActions || showViewToggle || hasHideableColumns || isUserGroupable) && (
          <div className="flex-none flex items-center gap-3 border-b border-neutral-200 px-6 py-3 dark:border-neutral-700">
            {headerTitle && <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{headerTitle}</div>}
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {/* View toggle */}
              {showViewToggle && (
                <>
                  <IconButton
                    icon="ViewRows"
                    size="xs"
                    variant="icon"
                    color={activeView === 'table' ? color : 'slate'}
                    rounded="md"
                    accent={false}
                    tooltip="Table view"
                    tooltipPosition="bottom"
                    className={classNames(
                      activeView !== 'table' && 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-200',
                    )}
                    onClick={() => { setActiveView('table'); onViewChange?.('table'); }}
                    aria-label="Switch to table view"
                  />
                  <IconButton
                    icon="ViewGrid"
                    size="xs"
                    variant="icon"
                    color={activeView === 'panel' ? color : 'slate'}
                    rounded="md"
                    accent={false}
                    tooltip="Panel view"
                    tooltipPosition="bottom"
                    className={classNames(
                      activeView !== 'panel' && 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-200',
                    )}
                    onClick={() => { setActiveView('panel'); onViewChange?.('panel'); }}
                    aria-label="Switch to panel view"
                  />
                </>
              )}

              {/* Column visibility toggle — table view only */}
              {hasHideableColumns && activeView === 'table' && (
                <div className="relative" ref={colPanelRef}>
                  <IconButton
                    icon="EyeOpen"
                    size="xs"
                    variant="icon"
                    color={colPanelOpen ? color : 'slate'}
                    rounded="md"
                    accent={false}
                    tooltip="Columns"
                    tooltipPosition="bottom"
                    className={classNames(!colPanelOpen && 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-200')}
                    onClick={() => setColPanelOpen((o) => !o)}
                    aria-label="Toggle column visibility"
                  />
                  {colPanelOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-800">Columns</div>
                      <div className="py-1 max-h-64 overflow-y-auto">
                        {effectiveColumns.map((col) => {
                          const hideable = col.hideable !== false;
                          const visible = colVisibility[col.id] !== false;
                          const label = typeof col.header === 'string' ? col.header : col.id;
                          return (
                            <label
                              key={col.id}
                              className={classNames(
                                'flex items-center gap-2.5 px-3 py-1.5 text-sm select-none',
                                hideable ? 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/60' : 'cursor-not-allowed opacity-40',
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={visible}
                                disabled={!hideable}
                                onChange={() => {
                                  const next = { ...colVisibility, [col.id]: !visible };
                                  setColVisibility(next);
                                  onColumnVisibilityChange?.(next);
                                }}
                                className={classNames('h-3.5 w-3.5 rounded border-neutral-300', getAccentClass(color))}
                              />
                              <span className="text-neutral-700 dark:text-neutral-200">{label}</span>
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
                            for (const col of effectiveColumns) reset[col.id] = true;
                            setColVisibility(reset);
                            onColumnVisibilityChange?.(reset);
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
              {isUserGroupable && activeView === 'table' && (
                <div className="relative" ref={groupPanelRef}>
                  {/* Wrapper to position the active indicator dot */}
                  <div className="relative inline-flex">
                    <IconButton
                      icon="Group"
                      size="xs"
                      variant="icon"
                      color={groupPanelOpen || resolvedGroupBy ? color : 'slate'}
                      rounded="md"
                      accent={false}
                      tooltip="Group by"
                      tooltipPosition="bottom"
                      className={classNames(
                        !(groupPanelOpen || resolvedGroupBy) && 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-200',
                      )}
                      onClick={() => setGroupPanelOpen((o) => !o)}
                      aria-label="Configure row grouping"
                    />
                    {/* Active indicator dot */}
                    {resolvedGroupBy && (
                      <span className={classNames('pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-neutral-900', getDotColorClass(color))} aria-hidden="true" />
                    )}
                  </div>

                  {groupPanelOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 min-w-[220px] rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                      {/* Panel header */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Group by</span>
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
                            className={classNames('h-3.5 w-3.5 border-neutral-300', getAccentClass(color))}
                          />
                          <span className="italic text-neutral-400 dark:text-neutral-500">None</span>
                        </label>
                        {effectiveColumns
                          .filter((col) => col.groupable !== false)
                          .map((col) => (
                            <label key={col.id} className="flex items-center gap-2.5 px-3 py-1.5 text-sm select-none cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
                              <input
                                type="radio"
                                name="table-group-by"
                                checked={internalGroupBy === col.id}
                                onChange={() => handleGroupChange(col.id)}
                                className={classNames('h-3.5 w-3.5 border-neutral-300', getAccentClass(color))}
                              />
                              <span className="text-neutral-700 dark:text-neutral-200">{getColumnLabel(col)}</span>
                              {/* Show "(hidden)" hint when the column is currently not visible */}
                              {colVisibility[col.id] === false && <span className="ml-auto text-xs text-neutral-400 dark:text-neutral-500">hidden</span>}
                            </label>
                          ))}
                      </div>

                      {/* Show group header toggle */}
                      <div className="border-t border-neutral-100 px-3 py-2.5 dark:border-neutral-800">
                        <label className="flex items-center gap-2.5 text-sm select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={resolvedShowGroupHeader}
                            onChange={() => setShowGroupHeaderLocal((v) => !v)}
                            className={classNames('h-3.5 w-3.5 rounded border-neutral-300', getAccentClass(color))}
                          />
                          <span className="text-neutral-700 dark:text-neutral-200">Show group header</span>
                        </label>
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
        {activeView === 'table' && visibleColumns.length > 0 && (
          <div className={classNames('relative', fullHeight && 'flex-1 min-h-0')}>
            <div className={classNames(fullHeight ? 'h-full overflow-hidden' : 'overflow-x-auto')}>
              <div className={classNames(fullHeight ? 'block min-w-full h-full' : 'inline-block min-w-full align-middle', !fullHeight && maxHeight && 'max-h-full')}>
                <div
                  className={classNames(!fullHeight && 'overflow-hidden', !fullHeight && maxHeight && 'max-h-full relative', fullHeight && 'h-full overflow-auto relative')}
                  style={!fullHeight ? scrollContainerStyle : undefined}
                >
                  <table
                    className={tableClasses}
                    style={useFixedLayout ? { tableLayout: 'fixed', width: '100%' } : undefined}
                  >
                    {/* Colgroup drives precise column widths in fixed layout */}
                    {useFixedLayout && (
                      <colgroup>
                        {showGroupExpandCol && <col style={{ width: '2.5rem' }} />}
                        {resolvedGroupBy && !showGroupExpandCol && <col style={{ width: '1rem' }} />}
                        {visibleColumns.map((col) => {
                          const resizedW = internalColWidths[col.id];
                          if (resizedW) return <col key={col.id} style={{ width: `${resizedW}px`, minWidth: `${resizedW}px` }} />;
                          // For non-resized columns, honour width/minWidth so fixed layout can't squeeze them below their declared minimum
                          const declaredW = col.width !== undefined ? (typeof col.width === 'number' ? col.width : col.width) : undefined;
                          const declaredMin = col.minWidth !== undefined ? (typeof col.minWidth === 'number' ? col.minWidth : col.minWidth) : undefined;
                          const colW = declaredW ?? declaredMin;
                          return <col key={col.id} style={colW !== undefined ? { width: typeof colW === 'number' ? `${colW}px` : colW, minWidth: typeof colW === 'number' ? `${colW}px` : colW } : undefined} />;
                        })}
                      </colgroup>
                    )}
                    <thead>
                      <tr className={classNames(headerToneClasses, 'border-b dark:border-opacity-60')}>
                        {/* Extra leading th for expand/collapse when grouping with group headers */}
                        {showGroupExpandCol && (
                          <th scope="col" className={classNames(headerToneClasses, stickyHeader && 'sticky top-0', stickyHeader ? 'z-20' : '', 'w-10 pl-3 pr-1')} aria-hidden="true" />
                        )}
                        {/* Indent spacer th for grouped mode without group headers */}
                        {resolvedGroupBy && !showGroupExpandCol && <th scope="col" className="w-4" aria-hidden="true" />}
                        {visibleColumns.map((column) => {
                          const isSorted = resolvedSort?.columnId === column.id;
                          const sortDirection = isSorted ? resolvedSort?.direction : undefined;

                          const isResizable = resizableColumns && column.resizable !== false;
                          const resizeWidth = internalColWidths[column.id];

                          return (
                            <th
                              key={column.id}
                              ref={(el) => { thRefs.current[column.id] = el; }}
                              scope="col"
                              className={classNames(
                                headerBaseClasses,
                                headerToneClasses,
                                cellPadding,
                                stickyHeader && 'sticky top-0',
                                column.sticky && 'sticky',
                                column.sticky === 'left' && 'left-0',
                                column.sticky === 'right' && 'right-0',
                                stickyHeader && column.sticky ? 'z-30' : stickyHeader ? 'z-20' : column.sticky ? 'z-10' : '',
                                getCellAlignment(column.align),
                                isResizable && 'relative overflow-hidden',
                                column.headerClassName,
                              )}
                              style={
                                resizeWidth
                                  ? { width: resizeWidth, minWidth: resizeWidth, maxWidth: resizeWidth }
                                  : applyWidthStyle(column.width, column.minWidth, column.maxWidth)
                              }
                              aria-sort={sortDirection ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                              title={column.tooltip}
                            >
                              <div className={classNames('flex items-center gap-1', column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : 'justify-start')}>
                                <span className={classNames((column.maxWidth || resizeWidth) && 'truncate min-w-0 flex-1')}>{column.header}</span>
                                {column.sortable ? (
                                  <IconButton
                                    icon={sortDirection ? sortIconMap[sortDirection] : sortIconMap.default}
                                    size="xs"
                                    variant="icon"
                                    color={isSorted ? color : 'slate'}
                                    rounded="md"
                                    accent={false}
                                    tooltip={sortDirection === 'asc' ? 'Sort descending' : sortDirection === 'desc' ? 'Clear sort' : 'Sort ascending'}
                                    tooltipPosition="bottom"
                                    className={classNames(
                                      'ml-1 flex-shrink-0',
                                      !isSorted && 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-200',
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
                                    const minW = column.minWidth !== undefined ? (typeof column.minWidth === 'number' ? column.minWidth : parseInt(column.minWidth, 10)) : 48;
                                    handleResizeStart(e, column.id, Math.max(48, isNaN(minW) ? 48 : minW));
                                  }}
                                >
                                  <div className="h-1/2 w-px bg-neutral-300 transition-colors group-hover/rh:bg-neutral-500 dark:bg-neutral-600 dark:group-hover/rh:bg-neutral-400" />
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
                              const isExpanded = expandedGroups[group.key] !== false;
                              return (
                                <React.Fragment key={`group-${group.key}`}>
                                  {/* Group header row */}
                                  {resolvedShowGroupHeader && (
                                    <tr
                                      className="cursor-pointer select-none border-b border-neutral-100 bg-neutral-50 transition-colors duration-150 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/40 dark:hover:bg-neutral-700/50"
                                      onClick={() => toggleGroup(group.key)}
                                    >
                                      <td colSpan={visibleColumns.length + 1} className={classNames('py-2', sidePaddingTokens.left)}>
                                        <div className="flex items-center gap-2">
                                          <span className={classNames('inline-flex text-neutral-400 dark:text-neutral-500')}>
                                            <ChevronSvg expanded={isExpanded} />
                                          </span>
                                          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                                            {group.display || <span className="italic text-neutral-400 dark:text-neutral-500">empty</span>}
                                          </span>
                                          <Badge count={group.rows.length} tone={color as PanelTone} />
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                  {/* Sub-rows — hidden when collapsed */}
                                  {(isExpanded || !resolvedShowGroupHeader) && group.rows.map(({ row, originalIndex }) => renderRow(row, originalIndex, true))}
                                </React.Fragment>
                              );
                            })
                          : renderEmptyState()
                        : /* ── Flat (ungrouped) rendering ──────────────────── */
                          hasRows
                          ? sortedData.map((row, rowIndex) => renderRow(row, rowIndex, false))
                          : renderEmptyState()}
                    </tbody>
                  </table>
                  {loading && <Loader overlay variant={loaderType} label={loadingMessage} progress={loaderProgress} className="rounded-none" />}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Panel view ────────────────────────────────────────────────────── */}
        {activeView === 'panel' && panelItem && (
          <div className={classNames('relative', fullHeight ? 'flex-1 min-h-0 overflow-auto' : undefined)} style={!fullHeight ? scrollContainerStyle : undefined}>
            {loading && <Loader overlay variant={loaderType} label={loadingMessage} progress={loaderProgress} className="rounded-none" />}
            {hasRows ? (
              <div
                className={classNames(
                  'p-4',
                  panelMinItemWidth != null
                    // auto-fill mode: grid base + any extra non-layout classes from consumer
                    // gap is intentionally excluded here — it lives in the inline style below
                    ? classNames('grid', panelGridClassName)
                    // legacy / explicit class mode (gap lives in the class string as before)
                    : (panelGridClassName ?? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'),
                )}
                style={panelMinItemWidth != null ? {
                  gridTemplateColumns: `repeat(auto-fill, minmax(min(${
                    typeof panelMinItemWidth === 'number' ? `${panelMinItemWidth}px` : panelMinItemWidth
                  }, 100%), 1fr))`,
                  // inline style wins over any class — gap is always consistent
                  gap: panelGap != null
                    ? (typeof panelGap === 'number' ? `${panelGap}px` : panelGap)
                    : '1rem',
                } : undefined}
              >
                {panelRows.map((row, rowIndex) => (
                  <React.Fragment key={resolveRowKey(row, rowIndex, rowKey)}>{panelItem(row, rowIndex)}</React.Fragment>
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
                        Showing {(pagination.page - 1) * pagination.pageSize + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} results
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
                        onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                        leadingIcon="ArrowLeft"
                      >
                        Previous
                      </Button>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
                      </span>
                      <Button
                        variant="soft"
                        color={color}
                        size="sm"
                        disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize) || loading}
                        onClick={() => pagination.onPageChange(Math.min(Math.ceil(pagination.total / pagination.pageSize), pagination.page + 1))}
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
