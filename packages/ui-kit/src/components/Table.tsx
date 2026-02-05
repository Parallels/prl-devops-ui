import React, { useMemo, useState } from "react";
import classNames from "classnames";
import { Loader, IconButton, Button, Select, type PanelTone } from ".";
import type { ThemeColor } from "../theme";
import type { IconName } from "../icons/registry";

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

type AccessorFn<T> = (row: T, index: number) => React.ReactNode;

export interface TableColumn<T> {
  id: string;
  header: React.ReactNode;
  accessor?: keyof T | AccessorFn<T>;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  tooltip?: string;
  className?: string;
  headerClassName?: string;
  sticky?: "left" | "right";
}

export type Column<T> = TableColumn<T>;

export type TableVariant = "default" | "compact" | "minimal" | "bordered";

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey?: (row: T, index: number) => string | number;
  variant?: TableVariant;
  tone?: PanelTone;
  striped?: boolean;
  hoverable?: boolean;
  stickyHeader?: boolean;
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
  className?: string;
  tableClassName?: string;
  bodyClassName?: string;
  style?: React.CSSProperties;
  fullHeight?: boolean;
  manualSorting?: boolean;
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

const variantCellPadding: Record<TableVariant, string> = {
  default: "px-6 py-5 text-sm",
  compact: "px-4 py-3 text-sm",
  minimal: "px-3 py-4 text-xs",
  bordered: "px-5 py-5 text-sm",
};

const variantSidePadding: Record<TableVariant, { left: string; right: string; contentVertical: string }> = {
  default: { left: "pl-6", right: "pr-6", contentVertical: "py-1.5" },
  compact: { left: "pl-4", right: "pr-4", contentVertical: "py-1" },
  minimal: { left: "pl-3", right: "pr-3", contentVertical: "py-1.5" },
  bordered: { left: "pl-5", right: "pr-5", contentVertical: "py-1.5" },
};

const variantTableBase: Record<TableVariant, string> = {
  default: "min-w-full divide-y divide-neutral-200 dark:divide-neutral-700",
  compact: "min-w-full divide-y divide-neutral-200 dark:divide-neutral-700",
  minimal: "min-w-full divide-y divide-neutral-200 dark:divide-neutral-700",
  bordered: "min-w-full border border-neutral-200 dark:border-neutral-700",
};

const variantWrapperBase: Record<TableVariant, string> = {
  default: "overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900/90",
  compact: "overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900/90",
  minimal: "overflow-hidden rounded-xl border border-neutral-200/60 bg-white/95 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900/90",
  bordered: "overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900",
};

const alignmentClass: Record<NonNullable<TableColumn<unknown>["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const getCellAlignment = (align?: TableColumn<unknown>["align"]) => (align ? alignmentClass[align] : "text-left");

const sortIconMap: Record<"asc" | "desc" | "default", IconName> = {
  asc: "ArrowUp",
  desc: "ArrowDown",
  default: "Dots",
};

function resolveValue<T>(row: T, column: TableColumn<T>, index: number): React.ReactNode {
  if (column.render) {
    return column.render(row, index);
  }

  if (column.accessor) {
    if (typeof column.accessor === "function") {
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

  if (typeof (row as Record<string, unknown>).id !== "undefined") {
    return String((row as Record<string, unknown>).id);
  }

  return index;
}

function applyWidthStyle(width?: string | number, minWidth?: string | number, maxWidth?: string | number) {
  if (!width && !minWidth && !maxWidth) {
    return undefined;
  }

  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = typeof width === "number" ? `${width}px` : width;
  if (minWidth !== undefined) style.minWidth = typeof minWidth === "number" ? `${minWidth}px` : minWidth;
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

function TableComponent<T>({
  columns,
  data,
  rowKey,
  variant = "default",
  tone = "neutral",
  striped = false,
  hoverable = true,
  stickyHeader = false,
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
  className,
  tableClassName,
  bodyClassName,
  style,
  fullHeight,
  pagination,
  manualSorting = false,
}: TableProps<T>) {
  const [internalSort, setInternalSort] = useState<TableSortState | null>(defaultSort ?? null);

  const resolvedSort = sortState ?? internalSort;

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

  const sortedData = useMemo(() => {
    if (manualSorting) {
      return data;
    }

    if (!resolvedSort) {
      return data;
    }

    const column = columns.find((col) => col.id === resolvedSort.columnId);

    if (!column || (!column.accessor && !column.render)) {
      return data;
    }

    const accessor = column.render ? column.render : (row: T, index: number) => resolveValue(row, column, index);

    const sorted = [...data];
    sorted.sort((a, b) => {
      const aValue = accessor(a, data.indexOf(a));
      const bValue = accessor(b, data.indexOf(b));

      if (aValue === bValue) {
        return 0;
      }

      const safeString = (val: React.ReactNode): string => {
        if (typeof val === "string") return val;
        if (typeof val === "number") return String(val);
        if (typeof val === "boolean") return String(val);
        return "";
      };

      const aComparable = typeof aValue === "number" ? aValue : safeString(aValue).toLowerCase();
      const bComparable = typeof bValue === "number" ? bValue : safeString(bValue).toLowerCase();

      if (aComparable < bComparable) {
        return resolvedSort.direction === "asc" ? -1 : 1;
      }

      return resolvedSort.direction === "asc" ? 1 : -1;
    });

    return sorted;
  }, [resolvedSort, columns, data]);

  const wrapperClasses = classNames("w-full", variantWrapperBase[variant], fullHeight && "h-full flex flex-col", className);
  const tableClasses = classNames(variantTableBase[variant], tableClassName);

  const cellPadding = variantCellPadding[variant];
  const sidePaddingTokens = variantSidePadding[variant];

  const headerToneClasses = getToneHeaderClasses(tone);
  const headerBaseClasses = "text-xs font-semibold uppercase tracking-wide text-left text-neutral-600 dark:text-neutral-200";

  const tbodyClasses = classNames("bg-white dark:bg-neutral-900/40 divide-y divide-neutral-200 dark:divide-neutral-800", striped && "divide-y-0", bodyClassName);

  const scrollContainerStyle = maxHeight
    ? {
      maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
    }
    : undefined;

  const hasRows = sortedData.length > 0;

  const renderEmptyState = () => (
    <tr>
      <td colSpan={columns.length} className={classNames("px-6 py-16 text-center text-sm font-medium text-neutral-500 dark:text-neutral-300")}>
        {emptyState ?? "No data to display"}
      </td>
    </tr>
  );

  return (
    <div className={wrapperClasses} style={style}>
      <div className={classNames("relative flex flex-col", fullHeight && "flex-1 overflow-hidden h-full")}>
        {headerActions && (
          <div className="flex-none flex items-center justify-between gap-3 border-b border-neutral-200 px-6 py-3 dark:border-neutral-700">
            <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Table</div>
            <div className="flex items-center gap-2">{headerActions}</div>
          </div>
        )}
        <div className={classNames("relative", fullHeight && "flex-1 min-h-0")}>
          <div className={classNames(fullHeight ? "h-full overflow-hidden" : "overflow-x-auto")}>
            <div className={classNames(fullHeight ? "block min-w-full h-full" : "inline-block min-w-full align-middle", !fullHeight && maxHeight && "max-h-full")}>
              <div
                className={classNames(!fullHeight && "overflow-hidden", !fullHeight && maxHeight && "max-h-full relative", fullHeight && "h-full overflow-auto relative")}
                style={!fullHeight ? scrollContainerStyle : undefined}
              >
                <table className={tableClasses}>
                  <thead>
                    <tr className={classNames(headerToneClasses, "border-b dark:border-opacity-60")}>
                      {columns.map((column) => {
                        const isSorted = resolvedSort?.columnId === column.id;
                        const sortDirection = isSorted ? resolvedSort?.direction : undefined;

                        return (
                          <th
                            key={column.id}
                            scope="col"
                            className={classNames(
                              headerBaseClasses,
                              headerToneClasses,
                              cellPadding,
                              stickyHeader && "sticky top-0",
                              column.sticky && "sticky",
                              column.sticky === "left" && "left-0",
                              column.sticky === "right" && "right-0",
                              stickyHeader && column.sticky ? "z-30" : stickyHeader ? "z-20" : column.sticky ? "z-10" : "",
                              getCellAlignment(column.align),
                              column.headerClassName,
                            )}
                            style={applyWidthStyle(column.width, column.minWidth, column.maxWidth)}
                            aria-sort={sortDirection ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                            title={column.tooltip}
                          >
                            <div className={classNames("flex items-center gap-1", column.align === "right" ? "justify-end" : column.align === "center" ? "justify-center" : "justify-start")}>
                              <span className={classNames(column.maxWidth && "truncate min-w-0 flex-1")}>{column.header}</span>
                              {column.sortable ? (
                                <IconButton
                                  icon={sortDirection ? sortIconMap[sortDirection] : sortIconMap.default}
                                  size="xs"
                                  variant="icon"
                                  color="slate"
                                  rounded="md"
                                  accent={false}
                                  className={classNames(
                                    "ml-1 text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-200 flex-shrink-0", // Added flex-shrink-0
                                    isSorted && "!text-neutral-700 dark:!text-neutral-100",
                                  )}
                                  onClick={() => handleSortToggle(column)}
                                  aria-label="Toggle sort"
                                />
                              ) : null}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className={tbodyClasses}>
                    {hasRows
                      ? sortedData.map((row, rowIndex) => {
                        const key = resolveRowKey(row, rowIndex, rowKey);
                        const rowClasses = classNames(
                          cellPadding,
                          "group", // Add group for child hover targeting
                          hoverable && "hover:bg-neutral-50 dark:hover:bg-neutral-800/40",
                          striped && rowIndex % 2 === 1 && "bg-neutral-50 dark:bg-neutral-800/20",
                          "transition-colors duration-150 ease-out",
                          onRowClick && "cursor-pointer",
                          rowClassName ? rowClassName(row, rowIndex) : undefined,
                        );

                        return (
                          <tr key={key} className={rowClasses} onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}>
                            {columns.map((column, colIndex) => {
                              const cellValue = resolveValue(row, column, rowIndex);
                              const isTruncated = !!column.maxWidth;
                              // If truncated and value is simpler string/number, use it as title
                              const cellTitle = isTruncated && (typeof cellValue === "string" || typeof cellValue === "number") ? String(cellValue) : undefined;

                              return (
                                <td
                                  key={column.id}
                                  className={classNames(
                                    "whitespace-nowrap align-middle text-sm text-neutral-700 dark:text-neutral-200",
                                    column.sticky && "sticky",
                                    column.sticky === "left" && "left-0",
                                    column.sticky === "right" && "right-0",
                                    column.sticky && "z-10",
                                    column.sticky && (striped && rowIndex % 2 === 1 ? "bg-neutral-50 dark:bg-neutral-800/20" : "bg-white dark:bg-neutral-900"),
                                    // Apply hover background to sticky cells when row is hovered
                                    column.sticky && hoverable && "group-hover:bg-neutral-50 dark:group-hover:bg-neutral-800/40",
                                    getCellAlignment(column.align),
                                    colIndex === 0 && sidePaddingTokens.left,
                                    colIndex === columns.length - 1 && sidePaddingTokens.right,
                                    column.className,
                                  )}
                                  style={applyWidthStyle(column.width, column.minWidth, column.maxWidth)}
                                  title={cellTitle} // Added title
                                >
                                  <div
                                    className={classNames(
                                      "py-1",
                                      sidePaddingTokens.contentVertical,
                                      isTruncated && "truncate", // Added truncate class to wrapper div
                                    )}
                                  >
                                    {cellValue}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                      : renderEmptyState()}
                  </tbody>
                </table>
                {loading && <Loader overlay variant={loaderType} label={loadingMessage} progress={loaderProgress} className="rounded-none" />}
              </div>
            </div>
          </div>
        </div>
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
                      color="slate"
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
                      color="slate"
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
