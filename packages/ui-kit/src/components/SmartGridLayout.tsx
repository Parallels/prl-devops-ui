import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, CustomIcon, IconButton, type ThemeColor } from "@prl/ui-kit";

export interface SmartGridItemDefinition {
  id: string;
  title: string;
  description?: string;
  screenshot?: string;
  defaultSpan?: number;
  defaultRowHeightSpan?: number;
  active: boolean;
  single: boolean;
  render: () => React.ReactNode;
  isSpacer?: boolean;
}

export interface SmartGridItem {
  definitionId: string;
  id: string;
  span: number;
  order: number;
  sectionId: string;
  rowId: string;
  isSpacer?: boolean;
}

export interface SmartGridRow {
  id: string;
  items: SmartGridItem[];
  order: number;
  height?: number;
  heightSpan?: number;
}

export interface SmartGridSection {
  id: string;
  title: string;
  rows: SmartGridRow[];
  order: number;
}

export interface SmartGridSectionDefinition {
  id?: string;
  title: string;
  rows: SmartGridRowDefinition[];
}

export interface SmartGridRowDefinition {
  id?: number;
  itemIds: string[];
  defaultHeightSpan?: number;
}

export interface SmartGridLayoutState {
  version: 3;
  sections: SmartGridSection[];
}

interface SmartGridLayoutProps {
  items: SmartGridItemDefinition[];
  defaultLayout: SmartGridSectionDefinition[];
  persistedLayout?: SmartGridLayoutState | null;
  onLayoutChange?: (layout: SmartGridLayoutState) => void;
  maxColumns?: number;
  className?: string;
  editThemeColor?: ThemeColor;
  isEditMode?: boolean;
  onEditModeChange?: (isEditMode: boolean) => void;
}

interface ResizeState {
  leftId: string;
  rightId: string;
  startX: number;
  startLeftSpan: number;
  pairTotal: number;
  colWidth: number;
}

interface RowResizeState {
  rowId: string;
  sectionId: string;
  startY: number;
  startHeight: number;
  startHeightSpan: number;
}

interface DragOverState {
  id: string;
  position: "before" | "after";
}

interface RowAddTargetState {
  sectionId: string;
  rowId: string;
}

interface RowPreviewState {
  sectionId: string;
  rowId: string;
  insertIndex: number;
}

const GRID_GAP_PX = 16;
const ROW_SPAN_SIZE = 100;
const MAX_ROW_SPANS = 12;
const SPACER_PREFIX = "spacer:";

const EDIT_THEME_COLORS: Record<
  string,
  { border: string; tint: string; solid: string; rgb: string }
> = {
  blue: {
    border: "border-blue-300 dark:border-blue-700",
    tint: "bg-blue-500/10",
    solid: "bg-blue-500 dark:bg-blue-400",
    rgb: "59,130,246",
  },
  sky: {
    border: "border-sky-300 dark:border-sky-700",
    tint: "bg-sky-500/10",
    solid: "bg-sky-500 dark:bg-sky-400",
    rgb: "14,165,233",
  },
  emerald: {
    border: "border-emerald-300 dark:border-emerald-700",
    tint: "bg-emerald-500/10",
    solid: "bg-emerald-500 dark:bg-emerald-400",
    rgb: "16,185,129",
  },
  lime: {
    border: "border-lime-300 dark:border-lime-700",
    tint: "bg-lime-500/10",
    solid: "bg-lime-500 dark:bg-lime-400",
    rgb: "132,204,22",
  },
  amber: {
    border: "border-amber-300 dark:border-amber-700",
    tint: "bg-amber-500/10",
    solid: "bg-amber-500 dark:bg-amber-400",
    rgb: "245,158,11",
  },
  orange: {
    border: "border-orange-300 dark:border-orange-700",
    tint: "bg-orange-500/10",
    solid: "bg-orange-500 dark:bg-orange-400",
    rgb: "249,115,22",
  },
  rose: {
    border: "border-rose-300 dark:border-rose-700",
    tint: "bg-rose-500/10",
    solid: "bg-rose-500 dark:bg-rose-400",
    rgb: "244,63,94",
  },
  violet: {
    border: "border-violet-300 dark:border-violet-700",
    tint: "bg-violet-500/10",
    solid: "bg-violet-500 dark:bg-violet-400",
    rgb: "139,92,246",
  },
  fuchsia: {
    border: "border-fuchsia-300 dark:border-fuchsia-700",
    tint: "bg-fuchsia-500/10",
    solid: "bg-fuchsia-500 dark:bg-fuchsia-400",
    rgb: "217,70,239",
  },
  neutral: {
    border: "border-neutral-300 dark:border-neutral-700",
    tint: "bg-neutral-500/10",
    solid: "bg-neutral-500 dark:bg-neutral-400",
    rgb: "115,115,115",
  },
};

function makeId(prefix: string): string {
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSectionId(title: string, existingIds: string[]): string {
  let normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!existingIds.includes(normalized)) {
    return normalized;
  }

  let counter = 1;
  let id = `${normalized}_${counter}`;
  while (existingIds.includes(id)) {
    counter++;
    id = `${normalized}_${counter}`;
  }
  return id;
}

function normalizeRowId(sectionId: string, rowIndex: number): string {
  return `${sectionId}-row-${rowIndex + 1}`;
}

function isSpacerId(id: string): boolean {
  return id.startsWith(SPACER_PREFIX);
}

function clampSpan(span: number | undefined, maxColumns: number): number {
  if (!Number.isFinite(span)) return Math.min(4, maxColumns);
  return Math.max(1, Math.min(maxColumns, Math.round(Number(span))));
}

function createSlug(): string {
  return `item:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function sortByOrder<T extends { id: string; order: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.order === b.order) return a.id.localeCompare(b.id);
    return a.order - b.order;
  });
}

function heightToSpan(height: number | undefined): number {
  if (!height || height <= 0) return 0;
  const span = Math.round(height / ROW_SPAN_SIZE);
  return Math.max(1, Math.min(MAX_ROW_SPANS, span));
}

function spanToHeight(span: number | undefined): number {
  if (!span || span === 0) return 0;
  return span * ROW_SPAN_SIZE;
}

function normalizeRowHeight(row: SmartGridRow): SmartGridRow {
  if (row.heightSpan !== undefined) {
    return row;
  }
  return {
    ...row,
    heightSpan: row.height ? heightToSpan(row.height) : 0,
  };
}

function normalizeLayoutRowSpans(
  layout: SmartGridLayoutState,
): SmartGridLayoutState {
  const newSections = layout.sections.map((section) => ({
    ...section,
    rows: section.rows.map(normalizeRowHeight),
  }));
  return { ...layout, sections: newSections };
}

function normalizeRowSpans(
  desiredSpans: number[],
  maxColumns: number,
): number[] {
  if (desiredSpans.length === 0) return [];
  if (desiredSpans.length === 1) return [maxColumns];

  const safe = desiredSpans.map((span) =>
    Math.max(1, Math.min(maxColumns, Math.round(span))),
  );
  const total = safe.reduce((acc, span) => acc + span, 0);
  if (total === maxColumns) return safe;

  const scaled = safe.map((span) => (span / total) * maxColumns);
  const normalized = scaled.map((span) => Math.max(1, Math.floor(span)));
  let diff = maxColumns - normalized.reduce((acc, span) => acc + span, 0);

  if (diff > 0) {
    const byRemainder = scaled
      .map((raw, index) => ({ index, remainder: raw - Math.floor(raw) }))
      .sort((a, b) => b.remainder - a.remainder);

    let i = 0;
    while (diff > 0 && byRemainder.length > 0) {
      normalized[byRemainder[i % byRemainder.length].index] += 1;
      diff -= 1;
      i += 1;
    }
  }

  if (diff < 0) {
    let i = 0;
    while (diff < 0 && normalized.some((span) => span > 1)) {
      const idx = i % normalized.length;
      if (normalized[idx] > 1) {
        normalized[idx] -= 1;
        diff += 1;
      }
      i += 1;
    }
  }

  return normalized;
}

function normalizeLayout(
  items: SmartGridItemDefinition[],
  defaultLayout: SmartGridSectionDefinition[],
  persistedLayout: SmartGridLayoutState | null | undefined,
  maxColumns: number,
  onLayoutChange?: (layout: SmartGridLayoutState) => void,
): SmartGridLayoutState {
  const itemsMap = new Map(items.map((i) => [i.id, i]));

  // Step 1: Generate section IDs and build default layout structure
  // First pass: extract all section IDs that are already provided
  const providedSectionIds = defaultLayout
    .map((s) => s.id)
    .filter((id): id is string => id !== undefined);

  const sectionDefinitions: SmartGridSectionDefinition[] = defaultLayout.map(
    (sectionDef, index) => {
      const id = sectionDef.id
        ? normalizeSectionId(
            sectionDef.id,
            providedSectionIds.filter((_, i) => i !== index),
          )
        : normalizeSectionId(
            sectionDef.title,
            providedSectionIds.filter((_, i) => i !== index),
          );

      return {
        ...sectionDef,
        id: id as string,
        rows: sectionDef.rows.map((rowDef) => ({
          id: rowDef.id,
          itemIds: rowDef.itemIds,
        })),
      };
    },
  );

  // Step 2: Build initial layout from default layout
  const layout: SmartGridLayoutState = {
    version: 3,
    sections: [],
  };

  // Track single items already placed
  const placedSingleItems = new Map<string, SmartGridItem>();

  sectionDefinitions.forEach((sectionDef, sectionIndex) => {
    const section: SmartGridSection = {
      id: sectionDef.id as string,
      title: sectionDef.title,
      rows: [],
      order: sectionIndex,
    };

    sectionDef.rows.forEach((rowDef, rowIndex) => {
      const row: SmartGridRow = {
        id:
          rowDef.id !== undefined
            ? `${rowDef.id}`
            : normalizeRowId(sectionDef.id as string, rowIndex),
        items: [],
        order: rowIndex,
        heightSpan: rowDef.defaultHeightSpan !== undefined
          ? Math.min(12, Math.max(0, Math.round(rowDef.defaultHeightSpan)))
          : 0,
      };

      rowDef.itemIds.forEach((itemId, itemIndex) => {
        const itemDef = itemsMap.get(itemId);

        if (!itemDef) {
          console.warn(
            `[SmartGridLayout] Item "${itemId}" not found in available items`,
          );
          return;
        }

        if (!itemDef.active) {
          console.warn(
            `[SmartGridLayout] Item "${itemId}" is inactive and will be skipped`,
          );
          return;
        }

        // Handle single=true items - replace existing instance
        if (itemDef.single && placedSingleItems.has(itemId)) {
          const existing = placedSingleItems.get(itemId)!;
          removeLayoutItem(layout, existing.id);
        }

        const layoutItem: SmartGridItem = {
          definitionId: itemId,
          id: createSlug(),
          span: itemDef.defaultSpan ?? 4,
          order: itemIndex,
          sectionId: section.id,
          rowId: row.id,
          isSpacer: itemDef.isSpacer,
        };

        if (itemDef.single) {
          placedSingleItems.set(itemId, layoutItem);
        }

        row.items.push(layoutItem);
      });

      if (row.items.length > 0) {
        section.rows.push(row);
      }
    });

    if (section.rows.length > 0) {
      layout.sections.push(section);
    }
  });

  // Step 3: Use persisted layout if exists (no merging with default)
  if (persistedLayout && persistedLayout.version === 3) {
    // Use persisted layout directly - don't merge with default
    const wrappedLayout = ensureAutoRowWrapping(
      persistedLayout,
      items,
      maxColumns,
      onLayoutChange,
    );

    // Remove empty sections/rows
    const prunedLayout = pruneEmptySectionsAndRows(wrappedLayout);

    // Update orders
    updateSectionRowOrders(prunedLayout);

    // Normalize row spans from persisted layouts
    const normalizedSpansLayout = normalizeLayoutRowSpans(prunedLayout);

    return normalizedSpansLayout;
  }

  // Ensure auto-row-wrapping
  const wrappedLayout = ensureAutoRowWrapping(
    layout,
    items,
    maxColumns,
    onLayoutChange,
  );

  // Remove empty sections/rows
  const prunedLayout = pruneEmptySectionsAndRows(wrappedLayout);

  // Update orders
  updateSectionRowOrders(prunedLayout);

  // Normalize row spans from persisted layouts
  const normalizedSpansLayout = normalizeLayoutRowSpans(prunedLayout);

  return normalizedSpansLayout;
}

function updateSectionRowOrders(layout: SmartGridLayoutState): void {
  layout.sections.forEach((section, sectionIdx) => {
    section.order = sectionIdx;
    section.rows.forEach((row, rowIdx) => {
      row.order = rowIdx;
      row.items.forEach((item, itemIdx) => {
        item.order = itemIdx;
      });
    });
  });
}

function ensureAutoRowWrapping(
  layout: SmartGridLayoutState,
  items: SmartGridItemDefinition[],
  maxColumns: number,
  onLayoutChange?: (layout: SmartGridLayoutState) => void,
): SmartGridLayoutState {
  const itemsMap = new Map(items.map((i) => [i.id, i]));
  let hasChanges = false;

  // Wrap decisions must be based on the ACTUAL stored item.span (which reflects
  // user resizes), NOT the item definition's defaultSpan. Falling back to
  // defaultSpan only when item.span is unset (e.g. a freshly-seeded item from
  // the default layout that hasn't been persisted yet).
  const getSpan = (item: SmartGridItem): number => {
    const fallback = itemsMap.get(item.id)?.defaultSpan ?? 4;
    const raw = Number.isFinite(item.span) ? (item.span as number) : fallback;
    return Math.max(1, Math.min(maxColumns, Math.round(raw)));
  };

  const newSections = layout.sections.map((section) => {
    const newRows: SmartGridRow[] = [];

    section.rows.forEach((row) => {
      let currentRow: SmartGridRow | null = null;

      row.items.forEach((item) => {
        const span = getSpan(item);

        if (!currentRow) {
          currentRow = {
            id: row.id,
            items: [item],
            order: row.order,
          };
          newRows.push(currentRow);
        } else {
          const currentRowSpan = currentRow.items.reduce(
            (sum, i) => sum + getSpan(i),
            0,
          );

          if (currentRowSpan + span > maxColumns) {
            const newRow: SmartGridRow = {
              id: makeId(`row:${section.id}`),
              items: [item],
              order: currentRow.order + 1,
            };
            newRows.push(newRow);
            currentRow = newRow;
            hasChanges = true;
          } else {
            currentRow.items.push(item);
          }
        }
      });
    });

    return { ...section, rows: newRows };
  });

  const result = { ...layout, sections: newSections };

  if (hasChanges && onLayoutChange) {
    onLayoutChange(result);
  }

  return result;
}

function distributeSpans(
  itemIds: string[],
  maxColumns: number,
): Map<string, number> {
  if (itemIds.length === 0) return new Map();
  if (itemIds.length === 1) {
    return new Map([[itemIds[0], maxColumns]]);
  }

  // When deleting items, distribute the FULL maxColumns among remaining items
  const totalSpan = maxColumns;
  const baseSpan = Math.floor(totalSpan / itemIds.length);
  const remainder = totalSpan % itemIds.length;

  const newSpans = new Map<string, number>();
  itemIds.forEach((id, index) => {
    const span = baseSpan + (index < remainder ? 1 : 0);
    newSpans.set(id, span);
  });

  return newSpans;
}

// This function is no longer needed - deployed state is computed from layout

function findLayoutItem(
  layout: SmartGridLayoutState,
  itemId: string,
): SmartGridItem | null {
  for (const section of layout.sections) {
    for (const row of section.rows) {
      const item = row.items.find((i) => i.id === itemId);
      if (item) return item;
    }
  }
  return null;
}

function removeLayoutItem(layout: SmartGridLayoutState, itemId: string): void {
  layout.sections.forEach((section) => {
    section.rows.forEach((row) => {
      const idx = row.items.findIndex((i) => i.id === itemId);
      if (idx !== -1) {
        row.items.splice(idx, 1);
      }
    });
  });
}

function pruneEmptySectionsAndRows(
  layout: SmartGridLayoutState,
): SmartGridLayoutState {
  const sectionsWithNonEmptyRows = layout.sections.map((section) => {
    const nonEmptyRows = section.rows.filter((row) => row.items.length > 0);
    return { ...section, rows: nonEmptyRows };
  });

  const nonEmptySections = sectionsWithNonEmptyRows.filter(
    (section) => section.rows.length > 0,
  );

  return { ...layout, sections: nonEmptySections };
}

export const SmartGridLayout: React.FC<SmartGridLayoutProps> = ({
  items,
  defaultLayout,
  persistedLayout,
  onLayoutChange,
  maxColumns = 12,
  className,
  editThemeColor = "blue",
  isEditMode: isEditModeProp,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<DragOverState | null>(null);
  const [emptyRowDropTarget, setEmptyRowDropTarget] = useState<string | null>(
    null,
  );
  const [sectionBottomDropTarget, setSectionBottomDropTarget] = useState<
    string | null
  >(null);
  const [newSectionDropTarget, setNewSectionDropTarget] = useState(false);
  const [rowAddTarget, setRowAddTarget] = useState<RowAddTargetState | null>(
    null,
  );
  const [rowPreview, setRowPreview] = useState<RowPreviewState | null>(null);

  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [rowResizeState, setRowResizeState] = useState<RowResizeState | null>(
    null,
  );
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionDraftTitle, setSectionDraftTitle] = useState("");
  const isEditMode = Boolean(isEditModeProp);

  // Compute normalized layout only when defaultLayout or persistedLayout changes (not on every items change)
  const normalizedLayout = useMemo(() => {
    // Create a copy of items to avoid mutating props
    const itemsCopy = items.map((item) => ({ ...item }));
    return normalizeLayout(
      itemsCopy,
      defaultLayout,
      persistedLayout,
      maxColumns,
      onLayoutChange,
    );
  }, [defaultLayout, persistedLayout, maxColumns, onLayoutChange]);

  const [layout, setLayout] = useState<SmartGridLayoutState>(
    () => normalizedLayout,
  );
  const hasInitializedLayout = useRef(false);
  const layoutLoadCounter = useRef(0);

  const layoutRef = useRef<SmartGridLayoutState>(normalizedLayout);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const resizeChangedRef = useRef(false);

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  // Only update layout when persistedLayout or defaultLayout changes (not on every render)
  // AND only on first load - don't recalculate after initialization
  useEffect(() => {
    // Reset initialization flag when persistedLayout changes (user saved new layout)
    if (persistedLayout && layoutLoadCounter.current > 0) {
      hasInitializedLayout.current = false;
      layoutLoadCounter.current = 0;
    }

    if (hasInitializedLayout.current) return;

    // Compare the actual layout structure
    if (!layout || !normalizedLayout) return;

    const prevSections = layout.sections;
    const nextSections = normalizedLayout.sections;

    const sectionsEqual =
      prevSections.length === nextSections.length &&
      prevSections.every((s, i) => {
        const next = nextSections[i];
        return (
          s.id === next.id &&
          s.rows.length === next.rows.length &&
          s.rows.every((r, j) => {
            const nextRow = next.rows[j];
            return (
              r.id === nextRow.id && r.items.length === nextRow.items.length
            );
          })
        );
      });

    // Only update layout if sections are different AND we're not in the middle of drag operations
    if (!sectionsEqual && !isEditMode) {
      setLayout(normalizedLayout);
    }

    hasInitializedLayout.current = true;
    layoutLoadCounter.current += 1;
  }, [normalizedLayout, isEditMode, persistedLayout]);

  // Create items map once, only when items array reference changes
  const byId = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  // Compute deployed single item IDs from layout
  const deployedSingleItemIds = useMemo(() => {
    const deployedIds = new Set<string>();
    layout.sections.forEach((section) => {
      section.rows.forEach((row) => {
        row.items.forEach((item) => {
          const def = items.find((i) => i.id === item.definitionId);
          if (def?.single) {
            deployedIds.add(item.definitionId);
          }
        });
      });
    });
    return deployedIds;
  }, [layout, items]);

  // Items available to add: all active items minus deployed single items
  const addableItems = useMemo(() => {
    return items.filter((item) => {
      // Skip items already in layout if single
      if (item.single && deployedSingleItemIds.has(item.id)) {
        return false;
      }
      // Skip inactive items
      if (!item.active) {
        return false;
      }
      return true;
    });
  }, [items, deployedSingleItemIds]);

  const orderedSectionIds = useMemo(() => {
    return sortByOrder(
      layout.sections.map((section) => ({
        id: section.id,
        order: section.order,
      })),
    ).map((entry) => entry.id);
  }, [layout, isEditMode]);

  const updateLayout = useCallback(
    (updater: (prev: SmartGridLayoutState) => SmartGridLayoutState) => {
      setLayout((prev) => {
        const next = updater(prev);
        if (next !== prev) {
          onLayoutChange?.(next);
        }
        return next;
      });
    },
    [onLayoutChange],
  );

  // When leaving edit mode (save), prune empty managed rows from section rowOrder.
  const prevEditModeRef = useRef(isEditMode);
  useEffect(() => {
    const wasEditing = prevEditModeRef.current;
    prevEditModeRef.current = isEditMode;
    if (!wasEditing || isEditMode) return; // only fires on true → false transition

    updateLayout((prev) => {
      const populatedRowKeys = new Set(
        prev.sections
          .flatMap((section) => section.rows.flatMap((row) => row.items))
          .map((item) => item.rowId as string),
      );

      let changed = false;
      const nextSections = prev.sections.map((section) => {
        const filteredRows = section.rows.filter((row: SmartGridRow) =>
          populatedRowKeys.has(row.id),
        );
        if (filteredRows.length !== section.rows.length) {
          changed = true;
          return { ...section, rows: filteredRows };
        }
        return section;
      });

      return changed ? { ...prev, sections: nextSections } : prev;
    });
  }, [isEditMode, updateLayout]);

  const removeItem = useCallback(
    (itemId: string) => {
      updateLayout((prev) => {
        const newSections = prev.sections.map((section) => {
          const newRows = section.rows.map((row) => {
            const itemIndex = row.items.findIndex((i) => i.id === itemId);
            if (itemIndex === -1) return row;

            const remainingItems = row.items.filter(
              (_, idx) => idx !== itemIndex,
            );
            const hasSpacer = remainingItems.some((i) => i.isSpacer);

            if (!hasSpacer && remainingItems.length > 0) {
              const remainingIds = remainingItems.map((i) => i.id);
              const newSpans = distributeSpans(remainingIds, maxColumns);

              const itemsWithNewSpans = row.items.map((item) => {
                if (item.id === itemId) return item;
                const newSpan = newSpans.get(item.id);
                if (newSpan !== undefined && newSpan !== item.span) {
                  return { ...item, span: newSpan };
                }
                return item;
              });

              return {
                ...row,
                items: itemsWithNewSpans.filter((_, idx) => idx !== itemIndex),
              };
            }

            return {
              ...row,
              items: [
                ...row.items.slice(0, itemIndex),
                ...row.items.slice(itemIndex + 1),
              ],
            };
          });
          return { ...section, rows: newRows };
        });

        return { ...prev, sections: newSections };
      });
    },
    [updateLayout, maxColumns],
  );

  const addSpacerToRow = useCallback(
    (sectionId: string, rowId: string, span: number = 1) => {
      updateLayout((prev) => {
        const sectionIndex = prev.sections.findIndex((s) => s.id === sectionId);
        if (sectionIndex === -1) return prev;

        const rowIndex = prev.sections[sectionIndex].rows.findIndex(
          (r) => r.id === rowId,
        );
        if (rowIndex === -1) return prev;

        const section = prev.sections[sectionIndex];
        const row = section.rows[rowIndex];

        // If row has items, reduce the rightmost item's span to make room for the spacer
        const newItems = [...row.items];
        if (newItems.length > 0) {
          const lastItemIndex = newItems.length - 1;
          const lastItem = newItems[lastItemIndex];
          const newLastSpan = Math.max(1, lastItem.span - span);
          newItems[lastItemIndex] = { ...lastItem, span: newLastSpan };
        }

        // Calculate max order in the row
        const maxOrder =
          newItems.length > 0
            ? Math.max(...newItems.map((i) => i.order)) + 1
            : 0;

        const newItem: SmartGridItem = {
          definitionId: createSlug(),
          id: createSlug(),
          span,
          order: maxOrder,
          sectionId: sectionId,
          rowId: rowId,
          isSpacer: true,
        };

        newItems.push(newItem);

        const newSection = { ...section };
        const newRow = { ...row };
        newRow.items = newItems;
        newSection.rows[rowIndex] = newRow;

        const newSections = [...prev.sections];
        newSections[sectionIndex] = newSection;

        return { ...prev, sections: newSections };
      });
    },
    [updateLayout],
  );

  const addItemToRow = useCallback(
    (itemId: string, sectionId: string, rowId: string) => {
      console.log("[ADD ITEM] Called with:", { itemId, sectionId, rowId });

      if (isSpacerId(itemId)) {
        console.log("[ADD ITEM] Adding spacer");
        addSpacerToRow(sectionId, rowId);
        return;
      }

      updateLayout((prev) => {
        const itemDef = items.find((i) => i.id === itemId);
        if (!itemDef) {
          console.log("[ADD ITEM] Item definition not found");
          return prev;
        }

        console.log("[ADD ITEM] Item definition found:", itemDef);

        // Check if item already exists in the target row BEFORE making changes
        const targetSection = prev.sections.find((s) => s.id === sectionId);
        if (targetSection) {
          const targetRow = targetSection.rows.find((r) => r.id === rowId);
          if (targetRow) {
            const alreadyExists = targetRow.items.some(
              (item) => item.definitionId === itemId,
            );
            if (alreadyExists) {
              console.log(
                "[ADD ITEM] Item already exists in target row, ABORTING",
              );
              return prev;
            }
          }
        }

        let workingSections = prev.sections;

        // Handle single=true items - replace existing instance
        if (itemDef.single) {
          // Find and remove existing instance
          const existingItem = findLayoutItem(prev, itemId);
          console.log("[ADD ITEM] Existing single item:", existingItem);
          if (existingItem) {
            console.log(
              "[ADD ITEM] Removing existing item with slug:",
              existingItem.id,
            );
            workingSections = prev.sections.map((section) => ({
              ...section,
              rows: section.rows.map((row) => ({
                ...row,
                items: row.items.filter((i) => i.id !== existingItem.id),
              })),
            }));
          }
        }

        const sectionIndex = workingSections.findIndex(
          (s) => s.id === sectionId,
        );
        if (sectionIndex === -1) {
          console.log("[ADD ITEM] Section not found");
          return prev;
        }

        let section = workingSections[sectionIndex];
        let rowIndex = section.rows.findIndex((r) => r.id === rowId);
        const isEmptyRow = rowIndex !== -1 && section.rows[rowIndex].items.length === 0;
        
        if (rowIndex === -1) {
          console.log("[ADD ITEM] Row not found, creating it now");
          rowIndex = section.rows.length;
          const newItemHeightSpan = itemDef.defaultRowHeightSpan !== undefined 
            ? Math.min(12, Math.max(0, Math.round(itemDef.defaultRowHeightSpan))) 
            : 0;
          const newSections = [...workingSections];
          newSections[sectionIndex] = {
            ...section,
            rows: [
              ...section.rows,
              { id: rowId, items: [], order: rowIndex, heightSpan: newItemHeightSpan },
            ],
          };
          workingSections = newSections;
          section = workingSections[sectionIndex];
        } else if (isEmptyRow) {
          const existingRow = section.rows[rowIndex];
          const newItemHeightSpan = itemDef.defaultRowHeightSpan !== undefined 
            ? Math.min(12, Math.max(0, Math.round(itemDef.defaultRowHeightSpan))) 
            : 0;
          if (existingRow.heightSpan !== newItemHeightSpan) {
            const newSections = [...workingSections];
            const newSection = { ...section };
            const newRow = { ...existingRow, heightSpan: newItemHeightSpan };
            newSection.rows[rowIndex] = newRow;
            newSections[sectionIndex] = newSection;
            workingSections = newSections;
            section = workingSections[sectionIndex];
          }
        }

        const row = section.rows[rowIndex];

        console.log(
          "[ADD ITEM] Before adding, row has",
          row.items.length,
          "items",
        );

        // Calculate max order in the row
        const maxOrder =
          row.items.length > 0
            ? Math.max(...row.items.map((i) => i.order)) + 1
            : 0;

        const newSlug = createSlug();
        const newItem: SmartGridItem = {
          definitionId: itemId,
          id: newSlug,
          span: itemDef.defaultSpan ?? 4,
          order: maxOrder,
          sectionId: sectionId,
          rowId: rowId,
          isSpacer: itemDef.isSpacer,
        };

        console.log("[ADD ITEM] Creating new item with slug:", newSlug);

        const newSection = { ...section };
        const newRow = { ...row };
        newRow.items.push(newItem);
        newSection.rows[rowIndex] = newRow;

        const newSections = [...workingSections];
        newSections[sectionIndex] = newSection;

        console.log(
          "[ADD ITEM] After adding, row has",
          newRow.items.length,
          "items",
        );

        return { ...prev, sections: newSections };
      });
    },
    [updateLayout, addSpacerToRow, items],
  );

  const ensureSection = useCallback(
    (sectionId: string, title?: string) => {
      updateLayout((prev) => {
        if (prev.sections.find((s) => s.id === sectionId)) return prev;
        const maxOrder = Math.max(
          ...prev.sections.map((section) => section.order),
          -1,
        );
        return {
          ...prev,
          sections: [
            ...prev.sections,
            {
              id: sectionId,
              title: title ?? sectionId,
              rows: [],
              order: maxOrder + 1,
            },
          ],
        };
      });
    },
    [updateLayout],
  );

  const renameSection = useCallback(
    (sectionId: string, title: string) => {
      updateLayout((prev) => {
        const sectionIndex = prev.sections.findIndex((s) => s.id === sectionId);
        if (sectionIndex === -1) return prev;
        const newSections = [...prev.sections];
        newSections[sectionIndex] = { ...newSections[sectionIndex], title };
        return { ...prev, sections: newSections };
      });
    },
    [updateLayout],
  );

  const createRow = useCallback(
    (sectionId: string): string => {
      const rowId = makeId(`row:${sectionId}`);
      updateLayout((prev) => {
        const sectionIndex = prev.sections.findIndex((s) => s.id === sectionId);
        if (sectionIndex === -1) return prev;

        const section = prev.sections[sectionIndex];
        if (section.rows.some((r) => r.id === rowId)) return prev;

        const newSections = [...prev.sections];
        newSections[sectionIndex] = {
          ...section,
          rows: [
            ...section.rows,
            { id: rowId, items: [], order: section.rows.length, heightSpan: 0 },
          ],
        };

        return { ...prev, sections: newSections };
      });
      return rowId;
    },
    [updateLayout],
  );

  const removeRowItems = useCallback(
    (
      sectionId: string,
      rowId: string,
      itemIds: string[],
      isManagedRow: boolean,
    ) => {
      updateLayout((prev) => {
        const newSections = prev.sections.map((section) => {
          if (section.id !== sectionId) return section;

          const newRow = section.rows.find((r) => r.id === rowId);
          if (!newRow) return section;

          const remainingItems = newRow.items.filter(
            (i) => !itemIds.includes(i.id),
          );
          const hasSpacer = remainingItems.some((i) => i.isSpacer);

          let updatedItems: SmartGridItem[];
          if (!hasSpacer && remainingItems.length > 0) {
            const remainingIds = remainingItems.map((i) => i.id);
            const newSpans = distributeSpans(remainingIds, maxColumns);

            updatedItems = newRow.items
              .filter((i) => !itemIds.includes(i.id))
              .map((item) => {
                const newSpan = newSpans.get(item.id);
                if (newSpan !== undefined && newSpan !== item.span) {
                  return { ...item, span: newSpan };
                }
                return item;
              });
          } else {
            updatedItems = newRow.items.filter((i) => !itemIds.includes(i.id));
          }

          const newRows = section.rows.map((r) => {
            if (r.id === rowId) {
              return { ...r, items: updatedItems };
            }
            return r;
          });

          if (isManagedRow) {
            const filteredRows = newRows.filter((r) => r.id !== rowId);
            return { ...section, rows: filteredRows };
          }

          return { ...section, rows: newRows };
        });

        return { ...prev, sections: newSections };
      });
    },
    [updateLayout, maxColumns],
  );

  const createSection = useCallback((): string => {
    const sectionId = makeId("section");
    ensureSection(sectionId, "New Section");
    return sectionId;
  }, [ensureSection]);

  const removeSection = useCallback(
    (sectionId: string) => {
      updateLayout((prev) => {
        const sectionIndex = prev.sections.findIndex((s) => s.id === sectionId);
        if (sectionIndex === -1) return prev;

        const newSections = [...prev.sections];
        newSections.splice(sectionIndex, 1);

        // Reorder remaining sections
        newSections.forEach((section, idx) => {
          section.order = idx;
        });

        return { ...prev, sections: newSections };
      });
    },
    [updateLayout],
  );

  const setItemPlacement = useCallback(
    (itemId: string, sectionId: string, rowId?: string) => {
      updateLayout((prev) => {
        let found = false;
        const newSections = prev.sections.map((section) => {
          const newRows = section.rows.map((row) => {
            const itemIndex = row.items.findIndex((i) => i.id === itemId);
            if (itemIndex !== -1) {
              found = true;
              const item = row.items[itemIndex];
              return {
                ...row,
                items: [
                  ...row.items.slice(0, itemIndex),
                  { ...item, sectionId, rowId: rowId ?? item.rowId },
                  ...row.items.slice(itemIndex + 1),
                ],
              };
            }
            return row;
          });
          return { ...section, rows: newRows };
        });

        if (!found) return prev;
        return { ...prev, sections: newSections };
      });
    },
    [updateLayout],
  );

  const reorderItems = useCallback(
    (sourceId: string, targetId: string, position: "before" | "after") => {
      if (sourceId === targetId) return;
      updateLayout((prev) => {
        // Find source and target positions (read-only — do not mutate prev)
        let sourceSectionIndex = -1;
        let sourceRowIndex = -1;
        let sourceItemIndex = -1;
        let targetSectionIndex = -1;
        let targetRowIndex = -1;
        let targetItemIndex = -1;

        prev.sections.forEach((section, sIdx) => {
          section.rows.forEach((row, rIdx) => {
            const srcIdx = row.items.findIndex((i) => i.id === sourceId);
            if (srcIdx !== -1) {
              sourceSectionIndex = sIdx;
              sourceRowIndex = rIdx;
              sourceItemIndex = srcIdx;
            }
            const tgtIdx = row.items.findIndex((i) => i.id === targetId);
            if (tgtIdx !== -1) {
              targetSectionIndex = sIdx;
              targetRowIndex = rIdx;
              targetItemIndex = tgtIdx;
            }
          });
        });

        if (sourceSectionIndex === -1 || targetSectionIndex === -1) return prev;
        if (
          sourceSectionIndex === targetSectionIndex &&
          sourceRowIndex === targetRowIndex &&
          sourceItemIndex === targetItemIndex
        ) {
          return prev;
        }

        const sourceItem =
          prev.sections[sourceSectionIndex].rows[sourceRowIndex].items[
            sourceItemIndex
          ];
        if (!sourceItem) return prev;

        const sameRow =
          sourceSectionIndex === targetSectionIndex &&
          sourceRowIndex === targetRowIndex;

        // Build next state immutably. Only touch the sections that change.
        const newSections = prev.sections.map((section, sIdx) => {
          if (sIdx !== sourceSectionIndex && sIdx !== targetSectionIndex) {
            return section;
          }

          const newRows = section.rows.map((row, rIdx) => {
            // Same-row move: remove source and re-insert around target in one step
            if (
              sameRow &&
              sIdx === sourceSectionIndex &&
              rIdx === sourceRowIndex
            ) {
              const filtered = row.items.filter(
                (_, i) => i !== sourceItemIndex,
              );
              let insertAt =
                sourceItemIndex < targetItemIndex
                  ? targetItemIndex - 1
                  : targetItemIndex;
              if (position === "after") insertAt += 1;
              insertAt = Math.max(0, Math.min(filtered.length, insertAt));
              const movedItem = {
                ...sourceItem,
                sectionId: section.id,
                rowId: row.id,
              };
              const nextItems = [
                ...filtered.slice(0, insertAt),
                movedItem,
                ...filtered.slice(insertAt),
              ].map((item, i) => ({ ...item, order: i }));
              return { ...row, items: nextItems };
            }

            // Different row: remove source from its row
            if (sIdx === sourceSectionIndex && rIdx === sourceRowIndex) {
              const remainingItems = row.items.filter(
                (_, i) => i !== sourceItemIndex,
              );
              const hasSpacer = remainingItems.some((i) => i.isSpacer);

              let nextItems: SmartGridItem[];
              if (!hasSpacer && remainingItems.length > 0) {
                const remainingIds = remainingItems.map((i) => i.id);
                const newSpans = distributeSpans(remainingIds, maxColumns);

                nextItems = row.items
                  .filter((_, i) => i !== sourceItemIndex)
                  .map((item) => {
                    const newSpan = newSpans.get(item.id);
                    if (newSpan !== undefined && newSpan !== item.span) {
                      return { ...item, span: newSpan };
                    }
                    return item;
                  })
                  .map((item, i) => ({ ...item, order: i }));
              } else {
                nextItems = row.items
                  .filter((_, i) => i !== sourceItemIndex)
                  .map((item, i) => ({ ...item, order: i }));
              }

              return { ...row, items: nextItems };
            }

            // Different row: insert source into the target row
            if (sIdx === targetSectionIndex && rIdx === targetRowIndex) {
              let insertAt = targetItemIndex;
              if (position === "after") insertAt += 1;
              insertAt = Math.max(0, Math.min(row.items.length, insertAt));
              const movedItem = {
                ...sourceItem,
                sectionId: section.id,
                rowId: row.id,
              };
              const nextItems = [
                ...row.items.slice(0, insertAt),
                movedItem,
                ...row.items.slice(insertAt),
              ].map((item, i) => ({ ...item, order: i }));
              
              const itemDef = items.find(i => i.id === sourceItem.definitionId);
              const newHeightSpan = itemDef?.defaultRowHeightSpan !== undefined
                ? Math.min(12, Math.max(0, Math.round(itemDef.defaultRowHeightSpan)))
                : row.heightSpan;
              
              return { ...row, items: nextItems, heightSpan: newHeightSpan };
            }

            return row;
          });

          return { ...section, rows: newRows };
        });

        return { ...prev, sections: newSections };
      });
    },
    [updateLayout],
  );

  const moveItemToSectionEnd = useCallback(
    (itemId: string, sectionId: string) => {
      updateLayout((prev) => {
        // Locate source (read-only — do not mutate prev)
        let sourceSectionIndex = -1;
        let sourceRowIndex = -1;
        let sourceItemIndex = -1;

        prev.sections.forEach((section, sIdx) => {
          section.rows.forEach((row, rIdx) => {
            const itemIndex = row.items.findIndex((i) => i.id === itemId);
            if (itemIndex !== -1) {
              sourceSectionIndex = sIdx;
              sourceRowIndex = rIdx;
              sourceItemIndex = itemIndex;
            }
          });
        });

        if (sourceSectionIndex === -1) return prev;

        const targetSectionIndex = prev.sections.findIndex(
          (s) => s.id === sectionId,
        );
        if (targetSectionIndex === -1) return prev;

        const sourceItem =
          prev.sections[sourceSectionIndex].rows[sourceRowIndex].items[
            sourceItemIndex
          ];
        if (!sourceItem) return prev;

        const targetSection = prev.sections[targetSectionIndex];
        // Find last non-empty row in target section (may be -1 if none)
        let targetRowIndex = -1;
        for (let i = targetSection.rows.length - 1; i >= 0; i--) {
          if (targetSection.rows[i].items.length > 0) {
            targetRowIndex = i;
            break;
          }
        }

        const sameSection = sourceSectionIndex === targetSectionIndex;
        const sameRow = sameSection && sourceRowIndex === targetRowIndex;

        // If the item is already the last one in the last non-empty row of the target section,
        // nothing to do.
        if (
          sameRow &&
          sourceItemIndex ===
            targetSection.rows[targetRowIndex].items.length - 1
        ) {
          return prev;
        }

        // Prepare the moved item with updated parent refs.
        // The rowId may change below if we create a new row.
        const newRowIdForEmptyTarget =
          targetRowIndex === -1 ? makeId(`row:${sectionId}`) : null;

        const movedItem: SmartGridItem = {
          ...sourceItem,
          sectionId,
          rowId:
            newRowIdForEmptyTarget ?? targetSection.rows[targetRowIndex].id,
        };

        const itemDef = items.find(i => i.id === sourceItem.definitionId);
        const newItemHeightSpan = itemDef?.defaultRowHeightSpan !== undefined
          ? Math.min(12, Math.max(0, Math.round(itemDef.defaultRowHeightSpan)))
          : undefined;

        // Build next state immutably.
        const newSections = prev.sections.map((section, sIdx) => {
          if (sIdx !== sourceSectionIndex && sIdx !== targetSectionIndex) {
            return section;
          }

          // Same-section case: one map pass removes source and appends target
          if (sameSection && sIdx === sourceSectionIndex) {
            // Remove source from its row first
            const rowsWithSourceRemoved = section.rows.map((row, rIdx) => {
              if (rIdx !== sourceRowIndex) return row;
              const nextItems = row.items
                .filter((_, i) => i !== sourceItemIndex)
                .map((item, i) => ({ ...item, order: i }));
              return { ...row, items: nextItems };
            });

            // After removal, recompute target row index if we need to create a fresh row
            if (newRowIdForEmptyTarget) {
              return {
                ...section,
                rows: [
                  ...rowsWithSourceRemoved,
                  {
                    id: newRowIdForEmptyTarget,
                    items: [{ ...movedItem, order: 0 }],
                    order: rowsWithSourceRemoved.length,
                    heightSpan: newItemHeightSpan ?? 0,
                  },
                ],
              };
            }

            const targetRowId = targetSection.rows[targetRowIndex].id;
            const rowsWithTarget = rowsWithSourceRemoved.map((row) => {
              if (row.id !== targetRowId) return row;
              const appended = [
                ...row.items,
                { ...movedItem, order: row.items.length },
              ];
              const targetRowHeightSpan = newItemHeightSpan ?? row.heightSpan;
              return { ...row, items: appended, heightSpan: targetRowHeightSpan };
            });
            return { ...section, rows: rowsWithTarget };
          }

          // Different sections: source section just removes the item
          if (sIdx === sourceSectionIndex) {
            const newRows = section.rows.map((row, rIdx) => {
              if (rIdx !== sourceRowIndex) return row;
              const nextItems = row.items
                .filter((_, i) => i !== sourceItemIndex)
                .map((item, i) => ({ ...item, order: i }));
              return { ...row, items: nextItems };
            });
            return { ...section, rows: newRows };
          }

          // Different sections: target section appends the item
          if (sIdx === targetSectionIndex) {
            if (newRowIdForEmptyTarget) {
              return {
                ...section,
                rows: [
                  ...section.rows,
                  {
                    id: newRowIdForEmptyTarget,
                    items: [{ ...movedItem, order: 0 }],
                    order: section.rows.length,
                    heightSpan: newItemHeightSpan ?? 0,
                  },
                ],
              };
            }
            const targetRowId = targetSection.rows[targetRowIndex].id;
            const newRows = section.rows.map((row) => {
              if (row.id !== targetRowId) return row;
              const appended = [
                ...row.items,
                { ...movedItem, order: row.items.length },
              ];
              const targetRowHeightSpan = newItemHeightSpan ?? row.heightSpan;
              return { ...row, items: appended, heightSpan: targetRowHeightSpan };
            });
            return { ...section, rows: newRows };
          }

          return section;
        });

        return { ...prev, sections: newSections };
      });
    },
    [updateLayout],
  );

  // Atomically remove an item from its current row and place it in a newly-appended
  // row at the end of the target section. Used by the "drop here to add item to new
  // row" / "drop to create a new section" drop zones, where the user's intent is for
  // the dragged item to appear inside the freshly-created row — not to fall back into
  // an existing non-empty row the way moveItemToSectionEnd would.
  const moveItemToNewRow = useCallback(
    (itemId: string, sectionId: string) => {
      const newRowId = makeId(`row:${sectionId}`);
      updateLayout((prev) => {
        const targetSectionIndex = prev.sections.findIndex(
          (s) => s.id === sectionId,
        );
        if (targetSectionIndex === -1) return prev;

        let sourceSectionIndex = -1;
        let sourceRowIndex = -1;
        let sourceItemIndex = -1;

        prev.sections.forEach((section, sIdx) => {
          section.rows.forEach((row, rIdx) => {
            const idx = row.items.findIndex((i) => i.id === itemId);
            if (idx !== -1) {
              sourceSectionIndex = sIdx;
              sourceRowIndex = rIdx;
              sourceItemIndex = idx;
            }
          });
        });

        if (sourceSectionIndex === -1) return prev;

        const sourceSection = prev.sections[sourceSectionIndex];
        const sourceRow = sourceSection.rows[sourceRowIndex];
        const sourceItem = sourceRow.items[sourceItemIndex];
        if (!sourceItem) return prev;

        // Resize items in source row
        const remainingItems = sourceRow.items.filter(
          (_, i) => i !== sourceItemIndex,
        );
        const hasSpacer = remainingItems.some((i) => i.isSpacer);

        let nextItems: SmartGridItem[];
        if (!hasSpacer && remainingItems.length > 0) {
          const remainingIds = remainingItems.map((i) => i.id);
          const newSpans = distributeSpans(remainingIds, maxColumns);

          nextItems = sourceRow.items
            .filter((_, i) => i !== sourceItemIndex)
            .map((item) => {
              const newSpan = newSpans.get(item.id);
              if (newSpan !== undefined && newSpan !== item.span) {
                return { ...item, span: newSpan };
              }
              return item;
            })
            .map((item, i) => ({ ...item, order: i }));
        } else {
          nextItems = sourceRow.items
            .filter((_, i) => i !== sourceItemIndex)
            .map((item, i) => ({ ...item, order: i }));
        }

        const movedItem: SmartGridItem = {
          ...sourceItem,
          definitionId: sourceItem.definitionId,
          id: createSlug(),
          sectionId,
          rowId: newRowId,
          order: 0,
          span: maxColumns, // New row item takes full width
        };

        const itemDef = items.find(i => i.id === sourceItem.definitionId);
        const newHeightSpan = itemDef?.defaultRowHeightSpan !== undefined
          ? Math.min(12, Math.max(0, Math.round(itemDef.defaultRowHeightSpan)))
          : 0;

        const newSections = prev.sections.map((section, sIdx) => {
          if (sIdx !== sourceSectionIndex && sIdx !== targetSectionIndex)
            return section;

          let newRows = section.rows;

          if (sIdx === sourceSectionIndex) {
            newRows = newRows.map((row, rIdx) => {
              if (rIdx !== sourceRowIndex) return row;
              return { ...row, items: nextItems };
            });
          }

          if (sIdx === targetSectionIndex) {
            newRows = [
              ...newRows,
              {
                id: newRowId,
                items: [movedItem],
                order: newRows.length,
                heightSpan: newHeightSpan,
              },
            ];
          }

          return { ...section, rows: newRows };
        });

        return { ...prev, sections: newSections };
      });
    },
    [updateLayout, maxColumns],
  );

  const beginResize = useCallback(
    (
      event: React.MouseEvent,
      rowDomKey: string,
      leftId: string,
      rightId: string,
      leftSpan: number,
      rightSpan: number,
    ) => {
      if (!isEditMode) return;
      event.preventDefault();
      event.stopPropagation();

      const rowEl = rowRefs.current[rowDomKey];
      if (!rowEl) return;

      const rect = rowEl.getBoundingClientRect();
      const colWidth =
        (rect.width - (maxColumns - 1) * GRID_GAP_PX) / maxColumns;
      if (!Number.isFinite(colWidth) || colWidth <= 0) return;

      resizeChangedRef.current = false;
      setResizeState({
        leftId,
        rightId,
        startX: event.clientX,
        startLeftSpan: leftSpan,
        pairTotal: leftSpan + rightSpan,
        colWidth,
      });
    },
    [isEditMode, maxColumns],
  );

  const beginRowResize = useCallback(
    (
      event: React.MouseEvent,
      rowId: string,
      sectionId: string,
      startHeight: number,
      startHeightSpan: number,
    ) => {
      if (!isEditMode) return;
      event.preventDefault();
      event.stopPropagation();

      resizeChangedRef.current = false;
      setRowResizeState({
        rowId,
        sectionId,
        startY: event.clientY,
        startHeight,
        startHeightSpan,
      });
    },
    [isEditMode],
  );

  useEffect(() => {
    if (!resizeState) return;

    const onMouseMove = (event: MouseEvent) => {
      const deltaColumns = Math.round(
        (event.clientX - resizeState.startX) / resizeState.colWidth,
      );
      const nextLeft = Math.max(
        1,
        Math.min(
          resizeState.pairTotal - 1,
          resizeState.startLeftSpan + deltaColumns,
        ),
      );
      const nextRight = resizeState.pairTotal - nextLeft;

      setLayout((prev) => {
        let leftItem: SmartGridItem | undefined;
        let rightItem: SmartGridItem | undefined;

        prev.sections.forEach((section) => {
          section.rows.forEach((row) => {
            if (!leftItem) {
              leftItem = row.items.find((i) => i.id === resizeState.leftId);
            }
            if (!rightItem) {
              rightItem = row.items.find((i) => i.id === resizeState.rightId);
            }
          });
        });

        if (!leftItem || !rightItem) return prev;

        let shouldUpdate = false;

        if (resizeState.leftId === resizeState.rightId) {
          if (leftItem.span === nextLeft) return prev;
          shouldUpdate = true;
        } else {
          if (leftItem.span === nextLeft && rightItem.span === nextRight)
            return prev;
          shouldUpdate = true;
        }

        resizeChangedRef.current = true;

        if (shouldUpdate) {
          const newSections = prev.sections.map((section) => ({
            ...section,
            rows: section.rows.map((row) => ({
              ...row,
              items: row.items.map((item) => {
                if (item.id === resizeState.leftId) {
                  return { ...item, span: nextLeft };
                }
                if (
                  resizeState.leftId !== resizeState.rightId &&
                  item.id === resizeState.rightId
                ) {
                  return { ...item, span: nextRight };
                }
                return item;
              }),
            })),
          }));

          return { ...prev, sections: newSections };
        }

        return prev;
      });
    };

    const onMouseUp = () => {
      setResizeState(null);
      if (resizeChangedRef.current) {
        onLayoutChange?.(layoutRef.current);
      }
      resizeChangedRef.current = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onLayoutChange, resizeState]);

  useEffect(() => {
    if (!rowResizeState) return;

    const onMouseMove = (event: MouseEvent) => {
      const deltaHeight = event.clientY - rowResizeState.startY;
      const newHeight = rowResizeState.startHeight + deltaHeight;
      
      let newSpan = Math.round(newHeight / ROW_SPAN_SIZE);
      
      if (rowResizeState.startHeightSpan > 0) {
        newSpan = Math.max(1, Math.min(MAX_ROW_SPANS, newSpan));
      }
      
      const newHeightPx = newSpan * ROW_SPAN_SIZE;

      setLayout((prev) => {
        const targetSection = prev.sections.find(
          (s) => s.id === rowResizeState.sectionId,
        );
        if (!targetSection) return prev;

        const targetRow = targetSection.rows.find(
          (r) => r.id === rowResizeState.rowId,
        );
        if (!targetRow || (targetRow.height === newHeightPx && targetRow.heightSpan === newSpan)) return prev;

        resizeChangedRef.current = true;

        const newSections = prev.sections.map((section) => {
          if (section.id !== rowResizeState.sectionId) return section;
          return {
            ...section,
            rows: section.rows.map((row) => {
              if (row.id !== rowResizeState.rowId) return row;
              return { ...row, height: newHeightPx, heightSpan: newSpan };
            }),
          };
        });

        return { ...prev, sections: newSections };
      });
    };

    const onMouseUp = () => {
      setRowResizeState(null);
      if (resizeChangedRef.current) {
        onLayoutChange?.(layoutRef.current);
      }
      resizeChangedRef.current = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onLayoutChange, rowResizeState]);

  const editTheme = EDIT_THEME_COLORS[editThemeColor] ?? EDIT_THEME_COLORS.blue;

  const resetDragState = useCallback(() => {
    setDraggingId(null);
    setDragOver(null);
    setEmptyRowDropTarget(null);
    setSectionBottomDropTarget(null);
    setNewSectionDropTarget(false);
    setRowPreview(null);
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      resetDragState();
      setEditingSectionId(null);
      setSectionDraftTitle("");
      setRowAddTarget(null);
      setIsAddModalOpen(false);
    }
  }, [isEditMode, resetDragState]);

  const getDraggedId = useCallback(
    (event: React.DragEvent): string | null => {
      return draggingId ?? (event.dataTransfer.getData("text/plain") || null);
    },
    [draggingId],
  );

  return (
    <div className={`relative ${className ?? ""}`}>
      {isAddModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-xl rounded-xl border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Add Items To Row
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRowAddTarget(null);
                    setIsAddModalOpen(false);
                  }}
                  className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
                >
                  Close
                </button>
              </div>
            </div>
            {addableItems.length === 0 && !isEditMode ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No items available to add.
              </p>
            ) : (
              <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                {isEditMode &&
                  rowAddTarget &&
                  (() => {
                    const section = layout.sections.find(
                      (s) => s.id === rowAddTarget.sectionId,
                    );
                    const targetRow = section?.rows.find(
                      (r) => r.id === rowAddTarget.rowId,
                    );
                    const hasItems = targetRow && targetRow.items.length > 0;
                    if (!hasItems) return null;
                    return (
                      <div
                        className="flex items-center gap-3 rounded-md border border-neutral-200 p-2 dark:border-neutral-700"
                      >
                        {/* Thumbnail */}
                        <div
                          className="shrink-0 overflow-hidden rounded border border-neutral-200 dark:border-neutral-700"
                          style={{ width: 100, height: 100 }}
                        >
                          <div className="flex h-full w-full items-center justify-center bg-white dark:bg-neutral-900">
                            <CustomIcon
                              icon="Dashboard"
                              className="h-8 w-8 text-neutral-300 dark:text-neutral-600"
                            />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              Spacer
                            </span>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                              · Spacer
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                            Flexible spacing between items
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!rowAddTarget) return;
                            addSpacerToRow(
                              rowAddTarget.sectionId,
                              rowAddTarget.rowId,
                            );
                            setRowAddTarget(null);
                            setIsAddModalOpen(false);
                          }}
                          className="shrink-0 rounded border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                        >
                          Add Spacer
                        </button>
                      </div>
                    );
                  })()}
                {addableItems.map((item) => {
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-md border border-neutral-200 p-2 dark:border-neutral-700"
                    >
                      {/* Thumbnail */}
                      <div
                        className="shrink-0 overflow-hidden rounded border border-neutral-200 dark:border-neutral-700"
                        style={{ width: 100, height: 100 }}
                      >
                        {item.screenshot ? (
                          <img
                            src={item.screenshot}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white dark:bg-neutral-900">
                            <CustomIcon
                              icon="Dashboard"
                              className="h-8 w-8 text-neutral-300 dark:text-neutral-600"
                            />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                            · {item.title}
                          </span>
                        </div>
                        {item.description && (
                          <div className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                            {item.description}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!rowAddTarget) return;
                          if (isSpacerId(item.id)) {
                            addSpacerToRow(
                              rowAddTarget.sectionId,
                              rowAddTarget.rowId,
                            );
                          } else {
                            addItemToRow(
                              item.id,
                              rowAddTarget.sectionId,
                              rowAddTarget.rowId,
                            );
                          }
                          setRowAddTarget(null);
                          setIsAddModalOpen(false);
                        }}
                        className="shrink-0 rounded border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                      >
                        {isSpacerId(item.id) ? "Add Spacer" : "Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {orderedSectionIds.map((sectionId) => {
        const section = layout.sections.find((s) => s.id === sectionId);
        if (!section) return null;
        const rows = section.rows;

        return (
          <section key={sectionId} className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              {isEditMode && editingSectionId === sectionId ? (
                <div className="flex items-center gap-2">
                  <input
                    value={sectionDraftTitle}
                    onChange={(event) =>
                      setSectionDraftTitle(event.target.value)
                    }
                    onBlur={() => {
                      renameSection(
                        sectionId,
                        sectionDraftTitle.trim() || "Untitled Section",
                      );
                      setEditingSectionId(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        renameSection(
                          sectionId,
                          sectionDraftTitle.trim() || "Untitled Section",
                        );
                        setEditingSectionId(null);
                      }
                      if (event.key === "Escape") {
                        setEditingSectionId(null);
                      }
                    }}
                    className="rounded border border-neutral-300 px-2 py-1 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    autoFocus
                  />
                </div>
              ) : (
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
                  {section.title}
                </h2>
              )}

              {isEditMode && addableItems.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    color="slate"
                    size="xs"
                    leadingIcon="Add"
                    onClick={() => {
                      const newRowId = makeId(`row:${sectionId}`);
                      setRowAddTarget({ sectionId, rowId: newRowId });
                      setIsAddModalOpen(true);
                    }}
                  >
                    Add Item
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    color="slate"
                    size="xs"
                    leadingIcon="Edit"
                    onClick={() => {
                      setEditingSectionId(sectionId);
                      setSectionDraftTitle(section.title);
                    }}
                  >
                    Rename
                  </Button>
                  <IconButton
                    icon="Trash"
                    size="xs"
                    variant="ghost"
                    color="rose"
                    onClick={() => removeSection(sectionId)}
                    title="Remove section and all items"
                    aria-label="Remove section and all items"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              {rows.map((row, rowIndex) => {
                const rowDomKey = `${sectionId}-${row.id}-${rowIndex}`;
                const isManagedRow = section.rows.some(
                  (r: SmartGridRow) => r.id === row.id,
                );
                const rowContentSpan = maxColumns;
                const isRowPreviewActive = Boolean(
                  isEditMode &&
                    draggingId &&
                    rowPreview &&
                    rowPreview.sectionId === sectionId &&
                    rowPreview.rowId === row.id,
                );

                // Compute cells from row.items
                const cells = row.items
                  .map((item) => {
                    // Spacers don't have a definition in byId, they're special
                    if (item.isSpacer) {
                      return {
                        kind: "item" as const,
                        id: item.id,
                        entry: {
                          id: item.id,
                          item: {
                            id: item.id,
                            title: "Spacer",
                            active: true,
                            single: false,
                            render: () => null,
                            isSpacer: true,
                          } as SmartGridItemDefinition,
                          state: item,
                          order: item.order,
                          sectionId: section.id,
                          rowId: row.id,
                          isSpacer: true,
                        },
                        span: clampSpan(item.span, rowContentSpan),
                      };
                    }

                    const itemDef = byId.get(item.definitionId);
                    if (!itemDef) return null;
                    return {
                      kind: "item" as const,
                      id: item.id,
                      entry: {
                        id: item.id,
                        item: itemDef,
                        state: item,
                        order: item.order,
                        sectionId: section.id,
                        rowId: row.id,
                        isSpacer: item.isSpacer,
                      },
                      span: clampSpan(item.span, rowContentSpan),
                    };
                  })
                  .filter(
                    (cell): cell is NonNullable<typeof cell> => cell !== null,
                  );

                const isResizePreviewActive = false; // Resize preview not implemented for v3 yet

                const renderCells = (() => {
                  if (!isRowPreviewActive && !isResizePreviewActive) {
                    return cells.map((cell) => ({
                      kind: cell.kind,
                      id: cell.id,
                      span: cell.span,
                      cell,
                    }));
                  }

                  if (isRowPreviewActive && draggingId && rowPreview) {
                    const draggedItem = row.items.find(
                      (i) => i.id === draggingId,
                    );
                    const draggedSpan = clampSpan(
                      draggedItem?.span ?? 3,
                      rowContentSpan,
                    );

                    const withoutDragged = cells.filter(
                      (cell) => cell.id !== draggingId,
                    );
                    const insertIndex = Math.max(
                      0,
                      Math.min(rowPreview.insertIndex, withoutDragged.length),
                    );

                    const withGhost = [
                      ...withoutDragged
                        .slice(0, insertIndex)
                        .map((cell) => ({
                          kind: cell.kind,
                          id: cell.id,
                          desiredSpan: clampSpan(
                            cell.entry.state.span,
                            rowContentSpan,
                          ),
                          cell,
                        })),
                      {
                        kind: "ghost" as const,
                        id: "__ghost__",
                        desiredSpan: draggedSpan,
                      },
                      ...withoutDragged
                        .slice(insertIndex)
                        .map((cell) => ({
                          kind: cell.kind,
                          id: cell.id,
                          desiredSpan: clampSpan(
                            cell.entry.state.span,
                            rowContentSpan,
                          ),
                          cell,
                        })),
                    ];

                    const normalized = normalizeRowSpans(
                      withGhost.map((entry) => entry.desiredSpan),
                      rowContentSpan,
                    );

                    return withGhost.map((entry) => ({
                      kind: entry.kind,
                      id: entry.id,
                      span: normalized[withGhost.indexOf(entry)],
                      cell: entry.kind === "item" ? entry.cell : undefined,
                    }));
                  }

                  if (
                    isResizePreviewActive &&
                    resizeState &&
                    cells.length > 0
                  ) {
                    const itemId = resizeState.leftId;
                    const currentSpan = resizeState.startLeftSpan;
                    const resizedSpan = Math.max(
                      1,
                      Math.min(
                        resizeState.pairTotal - 1,
                        currentSpan +
                          Math.round(
                            (0 - resizeState.startX) / resizeState.colWidth,
                          ),
                      ),
                    );

                    const cell = cells[0];
                    const emptySpaceSpan = maxColumns - resizedSpan;

                    const withGhost = [
                      {
                        kind: "item" as const,
                        id: itemId,
                        desiredSpan: resizedSpan,
                        cell,
                      },
                      {
                        kind: "ghost" as const,
                        id: "__empty_space__",
                        desiredSpan: emptySpaceSpan,
                      },
                    ];

                    return withGhost.map((entry) => ({
                      kind: entry.kind,
                      id: entry.id,
                      span: entry.desiredSpan,
                      cell: entry.kind === "item" ? entry.cell : undefined,
                    }));
                  }

                  return cells.map((cell) => ({
                    kind: cell.kind,
                    id: cell.id,
                    span: cell.span,
                    cell,
                  }));
                })();

                const rowHeight = row.heightSpan === 0 ? undefined : spanToHeight(row.heightSpan);
                const rowBorderClass = isEditMode
                  ? `${editTheme.border} border border-dashed rounded-lg`
                  : "";

                return (
                  <div className="flex w-full relative gap-1 flex-col items-center">
                  <div
                    key={row.id}
                    className={`relative w-full ${rowBorderClass}`}
                    style={rowHeight ? { height: rowHeight } : {}}
                  >
                      <div className="flex h-full gap-2 p-2">
                        {isEditMode && cells.length > 0 && (
                          <div className="z-20 flex w-7 shrink-0 items-start justify-center pt-1">
                            <IconButton
                              icon="Trash"
                              size="xs"
                              variant="ghost"
                              color="rose"
                              onClick={() =>
                                removeRowItems(
                                  sectionId,
                                  row.id,
                                  cells.map((cell) => cell.id),
                                  isManagedRow,
                                )
                              }
                              aria-label="Remove row"
                              title="Remove row"
                            />
                          </div>
                        )}
                        <div
                          ref={(element) => {
                            rowRefs.current[rowDomKey] = element;
                          }}
                          className="relative grid flex-1 gap-4 rounded-lg overflow-hidden"
                          style={{
                            gridTemplateColumns: `repeat(${maxColumns}, minmax(0, 1fr))`,
                            height: "100%",
                          }}
                          onDragOver={(event) => {
                            if (!isEditMode) return;
                            const sourceId = getDraggedId(event);
                            if (!sourceId) return;
                            event.preventDefault();

                            if (cells.length === 0) {
                              if (emptyRowDropTarget !== rowDomKey)
                                setEmptyRowDropTarget(rowDomKey);
                              if (
                                !rowPreview ||
                                rowPreview.sectionId !== sectionId ||
                                rowPreview.rowId !== row.id ||
                                rowPreview.insertIndex !== 0
                              ) {
                                setRowPreview({
                                  sectionId,
                                  rowId: row.id,
                                  insertIndex: 0,
                                });
                              }
                              return;
                            }

                            if (emptyRowDropTarget === rowDomKey)
                              setEmptyRowDropTarget(null);

                            const rowEl = rowRefs.current[rowDomKey];
                            const rowCellsWithoutDragged = cells.filter(
                              (cell) => cell.id !== sourceId,
                            );
                            let nextIndex = rowCellsWithoutDragged.length;

                            for (
                              let i = 0;
                              i < rowCellsWithoutDragged.length;
                              i += 1
                            ) {
                              const candidate = rowCellsWithoutDragged[i];
                              const candidateEl = rowEl?.querySelector(
                                `[data-sg-item-id="${candidate.id}"]`,
                              ) as HTMLElement | null;
                              if (!candidateEl) continue;
                              const rect = candidateEl.getBoundingClientRect();
                              if (event.clientX < rect.left + rect.width / 2) {
                                nextIndex = i;
                                break;
                              }
                            }

                            if (
                              !rowPreview ||
                              rowPreview.sectionId !== sectionId ||
                              rowPreview.rowId !== row.id ||
                              rowPreview.insertIndex !== nextIndex
                            ) {
                              setRowPreview({
                                sectionId,
                                rowId: row.id,
                                insertIndex: nextIndex,
                              });
                            }
                          }}
                          onDragLeave={(event) => {
                            if (!isEditMode) return;
                            const nextTarget =
                              event.relatedTarget as Node | null;
                            if (
                              nextTarget &&
                              event.currentTarget.contains(nextTarget)
                            )
                              return;
                            if (emptyRowDropTarget === rowDomKey)
                              setEmptyRowDropTarget(null);
                            if (
                              rowPreview?.sectionId === sectionId &&
                              rowPreview.rowId === row.id
                            ) {
                              setRowPreview(null);
                            }
                          }}
                          onDrop={(event) => {
                            if (!isEditMode) return;
                            event.preventDefault();
                            const sourceId = getDraggedId(event);
                            if (!sourceId) return;

                            // Clear any active row preview
                            if (rowPreview) {
                              setRowPreview(null);
                            }

                            if (cells.length > 0) {
                              const targetRowId = row.id;
                              const previewIndex =
                                rowPreview?.sectionId === sectionId &&
                                rowPreview.rowId === targetRowId
                                  ? rowPreview.insertIndex
                                  : cells.length;

                              const withoutDragged = cells.filter(
                                (cell) => cell.id !== sourceId,
                              );
                              const safeIndex = Math.max(
                                0,
                                Math.min(previewIndex, withoutDragged.length),
                              );

                              if (withoutDragged.length === 0) {
                                moveItemToSectionEnd(sourceId, sectionId);
                                resetDragState();
                                return;
                              }

                              if (safeIndex <= 0) {
                                reorderItems(
                                  sourceId,
                                  withoutDragged[0].id,
                                  "before",
                                );
                              } else {
                                reorderItems(
                                  sourceId,
                                  withoutDragged[safeIndex - 1].id,
                                  "after",
                                );
                              }
                              setItemPlacement(
                                sourceId,
                                sectionId,
                                targetRowId,
                              );

                              // After reorder, re-balance the spans of ALL items now in the
                              // target row (including the one we just moved) so the row sums to
                              // maxColumns — matching the drag-preview behavior. Without this,
                              // the pre-existing items would get normalized without the moved
                              // item and grow to fill the row, pushing the moved item to wrap.
                              updateLayout((prev) => {
                                const targetSection = prev.sections.find(
                                  (s) => s.id === sectionId,
                                );
                                const targetRow = targetSection?.rows.find(
                                  (r) => r.id === targetRowId,
                                );
                                if (!targetRow || targetRow.items.length === 0)
                                  return prev;

                                const currentSpans = targetRow.items.map((i) =>
                                  clampSpan(i.span, maxColumns),
                                );
                                const newSpans = normalizeRowSpans(
                                  currentSpans,
                                  maxColumns,
                                );

                                // Skip update if nothing would actually change
                                if (
                                  currentSpans.every(
                                    (s, i) => s === newSpans[i],
                                  )
                                )
                                  return prev;

                                const newSections = prev.sections.map(
                                  (section) => {
                                    if (section.id !== sectionId)
                                      return section;
                                    return {
                                      ...section,
                                      rows: section.rows.map((r) => {
                                        if (r.id !== targetRowId) return r;
                                        return {
                                          ...r,
                                          items: r.items.map((item, idx) => ({
                                            ...item,
                                            span: newSpans[idx],
                                          })),
                                        };
                                      }),
                                    };
                                  },
                                );

                                return { ...prev, sections: newSections };
                              });

                              resetDragState();
                              return;
                            }

                            moveItemToSectionEnd(sourceId, sectionId);
                            resetDragState();
                          }}
                        >
                          {cells.length === 0 && (
                            <div
                              className={`flex h-full flex-col items-center justify-center rounded-md border border-dashed p-4 text-center transition ${emptyRowDropTarget === rowDomKey ? `${editTheme.border} ${editTheme.tint} text-neutral-900 dark:text-neutral-100` : "border-neutral-300 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"}`}
                              style={{
                                gridColumn: `span ${rowContentSpan} / span ${rowContentSpan}`,
                              }}
                            >
                              {isEditMode && isManagedRow && (
                                <div className="mb-2">
                                  <IconButton
                                    icon="Trash"
                                    size="xs"
                                    variant="ghost"
                                    color="rose"
                                    onClick={() =>
                                      removeRowItems(
                                        sectionId,
                                        row.id,
                                        row.items.map((item) => item.id),
                                        isManagedRow,
                                      )
                                    }
                                    aria-label="Remove row"
                                    title="Remove row"
                                  />
                                </div>
                              )}
                              <p className="text-xs">Empty row. Drag a card here.</p>
                            </div>
                          )}

                          {renderCells.map((renderCell, cellIndex) => {
                            if (renderCell.kind === "ghost") {
                              return (
                                <div
                                  key="__ghost__"
                                  className={`relative z-10 min-h-28 rounded-xl border-2 border-dashed ${editTheme.border} ${editTheme.tint}`}
                                  style={{
                                    gridColumn: `span ${renderCell.span} / span ${renderCell.span}`,
                                  }}
                                />
                              );
                            }

                            const cell = renderCell.cell;
                            if (!cell) return null;

                            const nextItemIndex = renderCells
                              .slice(cellIndex + 1)
                              .findIndex((c) => c.kind === "item");
                            const neighbor =
                              nextItemIndex >= 0
                                ? renderCells[cellIndex + 1 + nextItemIndex]
                                : undefined;
                            const neighborCell =
                              neighbor?.kind === "item"
                                ? neighbor.cell
                                : undefined;

                            const def = byId.get(cell.entry.item.id);
                            if (!def && !cell.entry.isSpacer) return null;

                            if (cell.entry.isSpacer) {
                              return (
                                <div
                                  key={cell.entry.id}
                                  data-sg-item-id={cell.entry.id}
                                  className={`relative z-10 min-h-0 rounded-xl ${isEditMode ? `border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-500/10 cursor-grab active:cursor-grabbing` : "bg-transparent"} ${draggingId === cell.entry.id ? "opacity-50 scale-[0.99]" : ""}`}
                                  style={{
                                    gridColumn: `span ${renderCell.span} / span ${renderCell.span}`,
                                  }}
                                  draggable={isEditMode}
                                  onDragStart={(event) => {
                                    event.dataTransfer.effectAllowed = "move";
                                    event.dataTransfer.setData(
                                      "text/plain",
                                      cell.entry.id,
                                    );
                                    setDraggingId(cell.entry.id);
                                    setDragOver(null);
                                  }}
                                  onDragEnd={resetDragState}
                                  onDragOver={(event) => {
                                    if (!isEditMode || !draggingId) return;
                                    event.preventDefault();
                                    event.stopPropagation();
                                    if (draggingId === cell.entry.id) return;
                                    const rect =
                                      event.currentTarget.getBoundingClientRect();
                                    const position =
                                      event.clientX < rect.left + rect.width / 2
                                        ? "before"
                                        : "after";
                                    if (
                                      !dragOver ||
                                      dragOver.id !== cell.entry.id ||
                                      dragOver.position !== position
                                    ) {
                                      setDragOver({
                                        id: cell.entry.id,
                                        position,
                                      });
                                    }
                                    const previewIndex =
                                      position === "before"
                                        ? cells
                                            .filter(
                                              (entry) =>
                                                entry.id !== draggingId,
                                            )
                                            .findIndex(
                                              (entry) =>
                                                entry.id === cell.entry.id,
                                            )
                                        : cells
                                            .filter(
                                              (entry) =>
                                                entry.id !== draggingId,
                                            )
                                            .findIndex(
                                              (entry) =>
                                                entry.id === cell.entry.id,
                                            ) + 1;
                                    if (
                                      previewIndex >= 0 &&
                                      (!rowPreview ||
                                        rowPreview.sectionId !== sectionId ||
                                        rowPreview.rowId !== row.id ||
                                        rowPreview.insertIndex !== previewIndex)
                                    ) {
                                      setRowPreview({
                                        sectionId,
                                        rowId: row.id,
                                        insertIndex: previewIndex,
                                      });
                                    }
                                  }}
                                  onDragLeave={(event) => {
                                    if (!isEditMode || !draggingId) return;
                                    const nextTarget =
                                      event.relatedTarget as Node | null;
                                    if (
                                      nextTarget &&
                                      event.currentTarget.contains(nextTarget)
                                    )
                                      return;
                                    if (dragOver?.id === cell.entry.id)
                                      setDragOver(null);
                                  }}
                                  onDrop={(event) => {
                                    if (!isEditMode) return;
                                    event.preventDefault();
                                    event.stopPropagation();
                                    const sourceId = getDraggedId(event);
                                    if (!sourceId || sourceId === cell.entry.id)
                                      return;
                                    const rect =
                                      event.currentTarget.getBoundingClientRect();
                                    const position =
                                      event.clientX < rect.left + rect.width / 2
                                        ? "before"
                                        : "after";
                                    reorderItems(
                                      sourceId,
                                      cell.entry.id,
                                      position,
                                    );
                                    resetDragState();
                                  }}
                                >
                                  {isEditMode && (
                                    <>
                                      <div className="absolute right-2 top-2 z-30">
                                        <IconButton
                                          icon="Trash"
                                          size="xs"
                                          variant="ghost"
                                          color="rose"
                                          onClick={() =>
                                            removeItem(cell.entry.id)
                                          }
                                          aria-label="Remove spacer"
                                          title="Remove spacer"
                                        />
                                      </div>
                                      {neighborCell && neighbor && (
                                        <button
                                          type="button"
                                          onMouseDown={(event) => {
                                            beginResize(
                                              event,
                                              rowDomKey,
                                              cell.entry.id,
                                              neighborCell.entry.id,
                                              renderCell.span,
                                              neighbor.span,
                                            );
                                          }}
                                          className="group absolute left-full top-2 bottom-2 z-10 w-4 cursor-col-resize bg-transparent"
                                          aria-label="Resize spacer"
                                        >
                                          <span
                                            className={`absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 rounded-full opacity-0 transition-opacity duration-150 group-hover:opacity-80 group-focus-visible:opacity-80 ${editTheme.solid} ${resizeState?.leftId === cell.entry.id ? "opacity-90" : ""}`}
                                          />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <article
                                key={cell.entry.id}
                                data-sg-item-id={cell.entry.id}
                                className={`relative z-0 min-w-0 min-h-0 transition-[grid-column,transform,box-shadow] duration-150 ease-out ${isEditMode ? "cursor-grab active:cursor-grabbing" : ""} ${draggingId === cell.entry.id ? "opacity-50 scale-[0.99]" : ""}`}
                                style={{
                                  gridColumn: `span ${renderCell.span} / span ${renderCell.span}`,
                                }}
                                draggable={isEditMode}
                                onDragStart={(event) => {
                                  event.dataTransfer.effectAllowed = "move";
                                  event.dataTransfer.setData(
                                    "text/plain",
                                    cell.entry.id,
                                  );
                                  setDraggingId(cell.entry.id);
                                  setDragOver(null);
                                }}
                                onDragEnd={resetDragState}
                                onDragOver={(event) => {
                                  if (!isEditMode || !draggingId) return;
                                  event.preventDefault();
                                  event.stopPropagation();
                                  if (draggingId === cell.entry.id) return;
                                  const rect =
                                    event.currentTarget.getBoundingClientRect();
                                  const position =
                                    event.clientX < rect.left + rect.width / 2
                                      ? "before"
                                      : "after";
                                  if (
                                    !dragOver ||
                                    dragOver.id !== cell.entry.id ||
                                    dragOver.position !== position
                                  ) {
                                    setDragOver({
                                      id: cell.entry.id,
                                      position,
                                    });
                                  }

                                  const previewIndex =
                                    position === "before"
                                      ? cells
                                          .filter(
                                            (entry) => entry.id !== draggingId,
                                          )
                                          .findIndex(
                                            (entry) =>
                                              entry.id === cell.entry.id,
                                          )
                                      : cells
                                          .filter(
                                            (entry) => entry.id !== draggingId,
                                          )
                                          .findIndex(
                                            (entry) =>
                                              entry.id === cell.entry.id,
                                          ) + 1;

                                  if (
                                    previewIndex >= 0 &&
                                    (!rowPreview ||
                                      rowPreview.sectionId !== sectionId ||
                                      rowPreview.rowId !== row.id ||
                                      rowPreview.insertIndex !== previewIndex)
                                  ) {
                                    setRowPreview({
                                      sectionId,
                                      rowId: row.id,
                                      insertIndex: previewIndex,
                                    });
                                  }
                                }}
                                onDragLeave={(event) => {
                                  if (!isEditMode || !draggingId) return;
                                  const nextTarget =
                                    event.relatedTarget as Node | null;
                                  if (
                                    nextTarget &&
                                    event.currentTarget.contains(nextTarget)
                                  )
                                    return;
                                  if (dragOver?.id === cell.entry.id)
                                    setDragOver(null);
                                }}
                                onDrop={(event) => {
                                  if (!isEditMode) return;
                                  event.preventDefault();
                                  event.stopPropagation();
                                  const sourceId = getDraggedId(event);
                                  if (!sourceId || sourceId === cell.entry.id)
                                    return;

                                  const rect =
                                    event.currentTarget.getBoundingClientRect();
                                  const position =
                                    event.clientX < rect.left + rect.width / 2
                                      ? "before"
                                      : "after";

                                  reorderItems(
                                    sourceId,
                                    cell.entry.id,
                                    position,
                                  );
                                  resetDragState();
                                }}
                              >
                                {def!.render()}

                                {isEditMode && (
                                  <div className="absolute right-2 top-2 z-30">
                                    <IconButton
                                      icon="Trash"
                                      size="xs"
                                      variant="ghost"
                                      color="rose"
                                      onClick={() => removeItem(cell.entry.id)}
                                      aria-label={`Remove ${cell.entry.item.title}`}
                                      title={`Remove ${cell.entry.item.title}`}
                                    />
                                  </div>
                                )}

                                {isEditMode && neighborCell && neighbor && (
                                  <button
                                    type="button"
                                    onMouseDown={(event) => {
                                      beginResize(
                                        event,
                                        rowDomKey,
                                        cell.entry.id,
                                        neighborCell.entry.id,
                                        renderCell.span,
                                        neighbor.span,
                                      );
                                    }}
                                    className="group absolute left-full top-2 bottom-2 z-10 w-4 cursor-col-resize bg-transparent"
                                    aria-label={`Resize ${cell.entry.item.title}`}
                                  >
                                    <span
                                      className={`absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 rounded-full opacity-0 transition-opacity duration-150 group-hover:opacity-80 group-focus-visible:opacity-80 ${editTheme.solid} ${resizeState?.leftId === cell.entry.id ? "opacity-90" : ""}`}
                                    />
                                  </button>
                                )}
                              </article>
                            );
                          })}
                        </div>

                        {isEditMode && maxColumns > 1 && (
                          <div className="z-20 flex w-7 shrink-0 items-center justify-center">
                            <IconButton
                              icon="Add"
                              variant="ghost"
                              size="xs"
                              color={editThemeColor}
                              onClick={() => {
                                setRowAddTarget({ sectionId, rowId: row.id });
                                setIsAddModalOpen(true);
                              }}
                              aria-label={`Add item to ${section.title} row`}
                              title="Add item to row"
                            />
                          </div>
                        )}

                        {isRowPreviewActive && (
                          <div
                            className={`absolute inset-0 z-10 rounded-lg ${editTheme.border} ${editTheme.tint} pointer-events-none`}
                          />
                        )}
                      </div>
                    </div>
                    {isEditMode && (
                      <div
                        onMouseDown={(event) => {
                          beginRowResize(event, row.id, sectionId, row.height ?? 120, row.heightSpan ?? 0);
                        }}
                        className={`flex flex-col items-center rounded-full group bottom-0 h-1 cursor-ns-resize opacity-0 hover:opacity-80 ${editTheme.solid} transition-opacity ${rowResizeState?.rowId === row.id ? "opacity-100" : "group-hover:opacity-50"}`}
                        style={{ top: "auto", bottom: 0, width: "95%" }}
                        title="Drag to resize row height"
                      />
                    )}
                  </div>
                );
              })}

              {isEditMode && addableItems.length > 0 && (
                <div
                  className={`rounded-md border border-dashed px-3 py-2 text-center text-xs transition ${sectionBottomDropTarget === sectionId ? `${editTheme.border} ${editTheme.tint} text-neutral-900 dark:text-neutral-100` : "border-neutral-300 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"}`}
                  onDragOver={(event) => {
                    if (!draggingId) return;
                    event.preventDefault();
                    if (sectionBottomDropTarget !== sectionId)
                      setSectionBottomDropTarget(sectionId);
                  }}
                  onDragLeave={(event) => {
                    const nextTarget = event.relatedTarget as Node | null;
                    if (nextTarget && event.currentTarget.contains(nextTarget))
                      return;
                    if (sectionBottomDropTarget === sectionId)
                      setSectionBottomDropTarget(null);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const sourceId = getDraggedId(event);
                    if (!sourceId) return;
                    moveItemToNewRow(sourceId, sectionId);
                    resetDragState();
                  }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    color="slate"
                    size="xs"
                    leadingIcon="Add"
                    onClick={() => {
                      setRowAddTarget({ sectionId, rowId: "" });
                      setIsAddModalOpen(true);
                    }}
                  >
                    Add New Item
                  </Button>
                  <p className="mt-1">Or drop here to add item to new row</p>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {isEditMode && (
        <div
          className={`rounded-xl border border-dashed p-4 text-center text-sm transition ${newSectionDropTarget ? `${editTheme.border} ${editTheme.tint} text-neutral-900 dark:text-neutral-100` : "border-neutral-300 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"}`}
          onDragOver={(event) => {
            if (!draggingId) return;
            event.preventDefault();
            if (!newSectionDropTarget) setNewSectionDropTarget(true);
          }}
          onDragLeave={(event) => {
            const nextTarget = event.relatedTarget as Node | null;
            if (nextTarget && event.currentTarget.contains(nextTarget)) return;
            if (newSectionDropTarget) setNewSectionDropTarget(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            const sourceId = getDraggedId(event);
            if (!sourceId) return;
            const sectionId = createSection();
            moveItemToNewRow(sourceId, sectionId);
            resetDragState();
          }}
        >
          <Button
            type="button"
            variant="outline"
            color="slate"
            size="sm"
            leadingIcon="Add"
            onClick={() => {
              const sectionId = createSection();
              const rowId = createRow(sectionId);
              setRowAddTarget({ sectionId, rowId });
              setIsAddModalOpen(true);
            }}
          >
            Add item to create new section
          </Button>
          <p className="mt-2 text-xs">
            Or drop a card here to create a section and place it there
          </p>
        </div>
      )}
    </div>
  );
};
