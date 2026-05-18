import React, { useMemo, useState } from "react";
import classNames from "classnames";
import Table, { TableColumn } from "./Table";
import Button from "./Button";
import Badge from "./Badge";
import type { TableVariant } from "./Table";
import type { PanelTone } from "./Panel";

export interface AccessMatrixPermission {
  group: string;
  resource: string;
  action: string;
  enabled: boolean;
}

export interface AccessMatrixProps {
  permissions: AccessMatrixPermission[];
  /** Number of groups visible before the "Show more" button appears. Defaults to 5. */
  limit?: number;
  variant?: TableVariant;
  tone?: PanelTone;
  striped?: boolean;
  /** Forwards to Table: remove inner row borders/dividers. */
  noBorders?: boolean;
  /** Forwards to Table: make the table fill parent height and scroll internally. */
  fullHeight?: boolean;
  className?: string;
  hoverable?: boolean;
  /**
   * Background Tailwind class(es) applied to the sticky Resource column cells so they remain
   * opaque over scrolled action columns. Defaults to `'bg-white dark:bg-neutral-900'`.
   * Pass `'bg-transparent'` when the table sits inside a container whose background should
   * show through (e.g. a tinted panel or card).
   */
  stickyBackground?: string;
}

interface MatrixRow {
  _key: string;
  _group: string;
  _resource: string;
  _isGroupHeader?: boolean;
  _groupCount?: number;
  [actionKey: string]: boolean | string | number | undefined;
}

function ChevronSvg({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      width="14"
      height="14"
      className={`flex-shrink-0 text-current transition-transform duration-200${expanded ? " rotate-90" : ""}`}
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

const EnabledCell: React.FC = () => (
  <span className="flex items-center justify-center" aria-label="Enabled">
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-emerald-500">
      <circle cx="10" cy="10" r="9" fill="currentColor" fillOpacity="0.12" />
      <path
        d="M6.5 10.5l2.5 2.5 4.5-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

const DisabledCell: React.FC = () => (
  <span className="flex items-center justify-center" aria-label="Disabled">
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-5 w-5 text-slate-300 dark:text-slate-600"
    >
      <path
        d="M6 10h8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  </span>
);

const AccessMatrix: React.FC<AccessMatrixProps> = ({
  permissions,
  limit = 5,
  variant = "default",
  tone = "neutral",
  striped = false,
  noBorders = false,
  fullHeight = false,
  className,
  stickyBackground,
  hoverable = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  // Unique actions in insertion order → become the action columns
  const actions = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const p of permissions) {
      if (!seen.has(p.action)) {
        seen.add(p.action);
        result.push(p.action);
      }
    }
    return result;
  }, [permissions]);

  // Unique groups in insertion order → used for slicing (limit)
  const allGroups = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const p of permissions) {
      if (!seen.has(p.group)) {
        seen.add(p.group);
        result.push(p.group);
      }
    }
    return result;
  }, [permissions]);

  const visibleGroups = expanded ? allGroups : allGroups.slice(0, limit);
  const hiddenCount = allGroups.length - limit;

  // Build rows: group header pseudo-rows + data rows, with collapsed groups omitted
  const rows = useMemo((): MatrixRow[] => {
    const lookup = new Map<string, boolean>();
    for (const p of permissions) {
      lookup.set(`${p.group}::${p.resource}::${p.action}`, p.enabled);
    }

    const groupResources = new Map<string, string[]>();
    for (const p of permissions) {
      if (!groupResources.has(p.group)) groupResources.set(p.group, []);
      const res = groupResources.get(p.group)!;
      if (!res.includes(p.resource)) res.push(p.resource);
    }

    const result: MatrixRow[] = [];
    for (const group of visibleGroups) {
      const resources = groupResources.get(group) ?? [];

      // Group header pseudo-row
      result.push({
        _key: `__group__${group}`,
        _group: group,
        _resource: group,
        _isGroupHeader: true,
        _groupCount: resources.length,
      });

      // Data rows — omitted when the group is collapsed
      if (!collapsedGroups.has(group)) {
        for (const resource of resources) {
          const row: MatrixRow = {
            _key: `${group}::${resource}`,
            _group: group,
            _resource: resource,
          };
          for (const action of actions) {
            row[action] =
              lookup.get(`${group}::${resource}::${action}`) ?? false;
          }
          result.push(row);
        }
      }
    }
    return result;
  }, [permissions, visibleGroups, actions, collapsedGroups]);

  // Pre-compute per-group alternating stripe index (resets per group, skips headers)
  const stripeMap = useMemo(() => {
    const map = new Map<string, boolean>();
    let idx = 0;
    for (const row of rows) {
      if (row._isGroupHeader) {
        idx = 0;
      } else {
        map.set(row._key, idx % 2 === 1);
        idx++;
      }
    }
    return map;
  }, [rows]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const columns = useMemo((): TableColumn<MatrixRow>[] => {
    // Resource column — sticky left, no expand-spacer sibling so it lands at left-0
    const resourceCol: TableColumn<MatrixRow> = {
      id: "_resource",
      header: "Resource",
      minWidth: 140,
      sticky: "left",
      sortable: false,
      resizable: false,
      hideable: false,
      stickyBackgroundFn: (row) =>
        row._isGroupHeader ? "bg-neutral-50 dark:bg-neutral-800/40" : undefined,
      render: (row) => {
        if (row._isGroupHeader) {
          return (
            <span className="inline-flex items-center gap-2">
              <ChevronSvg expanded={!collapsedGroups.has(row._group)} />
              <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                {row._resource}
              </span>
              <Badge count={row._groupCount as number} tone={tone} />
            </span>
          );
        }
        return (
          <span className="pl-2 text-sm text-neutral-700 dark:text-neutral-200">
            {row._resource}
          </span>
        );
      },
    };

    // One column per unique action
    const actionCols: TableColumn<MatrixRow>[] = actions.map((action) => ({
      id: action,
      header: action,
      align: "center" as const,
      sortable: false,
      resizable: false,
      hideable: false,
      render: (row: MatrixRow) => {
        if (row._isGroupHeader) return null;
        return row[action] === true ? <EnabledCell /> : <DisabledCell />;
      },
    }));

    return [resourceCol, ...actionCols];
    // collapsedGroups is needed so the chevron direction re-renders on toggle
  }, [actions, stickyBackground, tone, collapsedGroups]);

  return (
    <div
      className={classNames(fullHeight && "h-full flex flex-col", className)}
    >
      <Table<MatrixRow>
        columns={columns}
        data={rows}
        variant={variant}
        tone={tone}
        rowKey={(row) => row._key}
        striped={striped}
        noBorders={noBorders}
        hoverable={hoverable}
        fullHeight={fullHeight}
        className={fullHeight ? "flex-1 min-h-0" : undefined}
        stickyHeader
        onRowClick={(row) => {
          if (row._isGroupHeader) toggleGroup(row._group);
        }}
        rowClassName={(row) => {
          if (row._isGroupHeader) {
            return "cursor-pointer select-none border-b border-neutral-100 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/40 dark:hover:bg-neutral-700/50";
          }
          return striped && stripeMap.get(row._key)
            ? "bg-neutral-100 dark:bg-neutral-800/40"
            : "";
        }}
      />
      {hiddenCount > 0 && (
        <div className="mt-3 flex justify-center">
          <Button
            variant="ghost"
            color="brand"
            size="sm"
            trailingIcon={expanded ? "ArrowUp" : "ArrowDown"}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded
              ? "Show less"
              : `Show ${hiddenCount} more ${hiddenCount === 1 ? "group" : "groups"}`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AccessMatrix;
