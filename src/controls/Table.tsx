import React, { useMemo, useState } from 'react';
import classNames from 'classnames';
import Loader from './Loader';
import IconButton from './IconButton';
import type { PanelTone } from './Panel';
import { IconName } from '@/types/Icon';

type SortDirection = 'asc' | 'desc';

export interface TableSortState {
  columnId: string;
  direction: SortDirection;
}

type AccessorFn<T> = (row: T, index: number) => React.ReactNode;

export interface TableColumn<T> {
  id: string;
  header: React.ReactNode;
  accessor?: keyof T | AccessorFn<T>;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  tooltip?: string;
  className?: string;
  headerClassName?: string;
}

export type TableVariant = 'default' | 'compact' | 'minimal' | 'bordered';

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
  loaderType?: 'spinner' | 'progress';
  loaderProgress?: number;
  emptyState?: React.ReactNode;
  sortState?: TableSortState | null;
  defaultSort?: TableSortState | null;
  onSortChange?: (sort: TableSortState | null) => void;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: number | string;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
  className?: string;
  tableClassName?: string;
  bodyClassName?: string;
  style?: React.CSSProperties;
}

const toneHeaderMap: Record<PanelTone, string> = {
  neutral:
    'bg-neutral-50 text-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-100 border-sky-200 dark:border-sky-500/40',
  success:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-100 border-emerald-200 dark:border-emerald-500/30',
  warning:
    'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-100 border-amber-200 dark:border-amber-500/30',
  danger:
    'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-100 border-rose-200 dark:border-rose-500/30',
  brand:
    'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-100 border-indigo-200 dark:border-indigo-500/30',
};

const variantCellPadding: Record<TableVariant, string> = {
  default: 'px-6 py-5 text-sm',
  compact: 'px-4 py-3 text-sm',
  minimal: 'px-3 py-4 text-xs',
  bordered: 'px-5 py-5 text-sm',
};

const variantSidePadding: Record<
  TableVariant,
  { left: string; right: string; contentVertical: string }
> = {
  default: { left: 'pl-6', right: 'pr-6', contentVertical: 'py-1.5' },
  compact: { left: 'pl-4', right: 'pr-4', contentVertical: 'py-1' },
  minimal: { left: 'pl-3', right: 'pr-3', contentVertical: 'py-1.5' },
  bordered: { left: 'pl-5', right: 'pr-5', contentVertical: 'py-1.5' },
};

const variantTableBase: Record<TableVariant, string> = {
  default: 'min-w-full divide-y divide-neutral-200 dark:divide-neutral-700',
  compact: 'min-w-full divide-y divide-neutral-200 dark:divide-neutral-700',
  minimal: 'min-w-full divide-y divide-neutral-200 dark:divide-neutral-700',
  bordered: 'min-w-full border border-neutral-200 dark:border-neutral-700',
};

const variantWrapperBase: Record<TableVariant, string> = {
  default:
    'overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900/90',
  compact:
    'overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900/90',
  minimal:
    'overflow-hidden rounded-xl border border-neutral-200/60 bg-white/95 shadow-sm dark:border-neutral-700/60 dark:bg-neutral-900/90',
  bordered:
    'overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900',
};

const alignmentClass: Record<NonNullable<TableColumn<unknown>['align']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const getCellAlignment = (align?: TableColumn<unknown>['align']) =>
  align ? alignmentClass[align] : 'text-left';

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

function resolveRowKey<T>(
  row: T,
  index: number,
  rowKey?: (row: T, index: number) => string | number
): string | number {
  if (rowKey) {
    return rowKey(row, index);
  }

  if (typeof (row as Record<string, unknown>).id !== 'undefined') {
    return String((row as Record<string, unknown>).id);
  }

  return index;
}

function applyWidthStyle(width?: string | number, minWidth?: string | number) {
  if (!width && !minWidth) {
    return undefined;
  }

  return {
    width: typeof width === 'number' ? `${width} px` : width,
    minWidth: typeof minWidth === 'number' ? `${minWidth} px` : minWidth,
  } as React.CSSProperties;
}

function getNextSortDirection(current?: SortDirection): SortDirection | null {
  if (!current) {
    return 'asc';
  }

  if (current === 'asc') {
    return 'desc';
  }

  return null;
}

function TableComponent<T>({
  columns,
  data,
  rowKey,
  variant = 'default',
  tone = 'neutral',
  striped = false,
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
}: TableProps<T>) {
  const [internalSort, setInternalSort] = useState<TableSortState | null>(defaultSort ?? null);

  const resolvedSort = sortState ?? internalSort;

  const handleSortToggle = (column: TableColumn<T>) => {
    if (!column.sortable) {
      return;
    }

    const nextDirection = getNextSortDirection(
      resolvedSort?.columnId === column.id ? resolvedSort.direction : undefined
    );

    const nextSort = nextDirection ? { columnId: column.id, direction: nextDirection } : null;

    if (!sortState) {
      setInternalSort(nextSort);
    }

    if (onSortChange) {
      onSortChange(nextSort);
    }
  };

  const sortedData = useMemo(() => {
    if (!resolvedSort) {
      return data;
    }

    const column = columns.find((col) => col.id === resolvedSort.columnId);

    if (!column || (!column.accessor && !column.render)) {
      return data;
    }

    const accessor = column.render
      ? column.render
      : (row: T, index: number) => resolveValue(row, column, index);

    const sorted = [...data];
    sorted.sort((a, b) => {
      const aValue = accessor(a, data.indexOf(a));
      const bValue = accessor(b, data.indexOf(b));

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
  }, [resolvedSort, columns, data]);

  const wrapperClasses = classNames('w-full', variantWrapperBase[variant], className);
  const tableClasses = classNames(variantTableBase[variant], tableClassName);

  const cellPadding = variantCellPadding[variant];
  const sidePaddingTokens = variantSidePadding[variant];

  const headerToneClasses = toneHeaderMap[tone];
  const headerBaseClasses =
    'text-xs font-semibold uppercase tracking-wide text-left text-neutral-600 dark:text-neutral-200';

  const tbodyClasses = classNames(
    'bg-white dark:bg-neutral-900/40 divide-y divide-neutral-200 dark:divide-neutral-800',
    striped && 'divide-y-0',
    bodyClassName
  );

  const scrollContainerStyle = maxHeight
    ? {
      maxHeight: typeof maxHeight === 'number' ? `${maxHeight} px` : maxHeight,
    }
    : undefined;

  const hasRows = sortedData.length > 0;

  const renderEmptyState = () => (
    <tr>
      <td
        colSpan={columns.length}
        className={classNames(
          'px-6 py-16 text-center text-sm font-medium text-neutral-500 dark:text-neutral-300'
        )}
      >
        {emptyState ?? 'No data to display'}
      </td>
    </tr>
  );

  return (
    <div className={wrapperClasses} style={style}>
      <div className="relative flex flex-col">
        {headerActions && (
          <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-6 py-3 dark:border-neutral-700">
            <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              Table
            </div>
            <div className="flex items-center gap-2">{headerActions}</div>
          </div>
        )}
        <div className="relative">
          <div className="overflow-x-auto">
            <div
              className={classNames(
                'inline-block min-w-full align-middle',
                maxHeight && 'max-h-full'
              )}
            >
              <div
                className={classNames(
                  'overflow-hidden',
                  maxHeight && 'max-h-full',
                  maxHeight && 'relative'
                )}
                style={scrollContainerStyle}
              >
                <table className={tableClasses}>
                  <thead>
                    <tr
                      className={classNames(headerToneClasses, 'border-b dark:border-opacity-60')}
                    >
                      {columns.map((column) => {
                        const isSorted = resolvedSort?.columnId === column.id;
                        const sortDirection = isSorted ? resolvedSort?.direction : undefined;

                        return (
                          <th
                            key={column.id}
                            scope="col"
                            className={classNames(
                              headerBaseClasses,
                              cellPadding,
                              stickyHeader && 'sticky top-0 z-20 backdrop-blur-sm',
                              getCellAlignment(column.align),
                              column.headerClassName
                            )}
                            style={applyWidthStyle(column.width, column.minWidth)}
                            aria-sort={
                              sortDirection
                                ? sortDirection === 'asc'
                                  ? 'ascending'
                                  : 'descending'
                                : 'none'
                            }
                            title={column.tooltip}
                          >
                            <div
                              className={classNames(
                                'flex items-center gap-1',
                                column.align === 'right'
                                  ? 'justify-end'
                                  : column.align === 'center'
                                    ? 'justify-center'
                                    : 'justify-start'
                              )}
                            >
                              <span>{column.header}</span>
                              {column.sortable ? (
                                <IconButton
                                  icon={
                                    sortDirection ? sortIconMap[sortDirection] : sortIconMap.default
                                  }
                                  size="xs"
                                  variant="icon"
                                  color="slate"
                                  rounded="md"
                                  accent={false}
                                  className={classNames(
                                    'ml-1 text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-200',
                                    isSorted && '!text-neutral-700 dark:!text-neutral-100'
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
                          hoverable && 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40',
                          striped && rowIndex % 2 === 1 && 'bg-neutral-50 dark:bg-neutral-800/20',
                          'transition-colors duration-150 ease-out',
                          onRowClick && 'cursor-pointer',
                          rowClassName ? rowClassName(row, rowIndex) : undefined
                        );

                        return (
                          <tr
                            key={key}
                            className={rowClasses}
                            onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                          >
                            {columns.map((column, colIndex) => (
                              <td
                                key={column.id}
                                className={classNames(
                                  'whitespace-nowrap align-middle text-sm text-neutral-700 dark:text-neutral-200',
                                  getCellAlignment(column.align),
                                  colIndex === 0 && sidePaddingTokens.left,
                                  colIndex === columns.length - 1 && sidePaddingTokens.right,
                                  column.className
                                )}
                                style={applyWidthStyle(column.width, column.minWidth)}
                              >
                                <div
                                  className={classNames(
                                    'py-1',
                                    sidePaddingTokens.contentVertical
                                  )}
                                >
                                  {resolveValue(row, column, rowIndex)}
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })
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
          </div>
        </div>
        {footer && (
          <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-3 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300">
            {footer}
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
