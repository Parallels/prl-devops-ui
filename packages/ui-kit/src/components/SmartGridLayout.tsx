import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, CustomIcon, IconButton, type ThemeColor } from '@prl/ui-kit';

export interface SmartGridItemDefinition {
  id: string;
  title: string;
  group?: string;
  description?: string;
  screenshot?: string;
  defaultSpan?: number;
  defaultHidden?: boolean;
  defaultRemoved?: boolean;
  render: () => React.ReactNode;
  isSpacer?: boolean;
}

export interface SmartGridItemState {
  order: number;
  span: number;
  hidden: boolean;
  removed: boolean;
  group?: string;
  rowKey?: string;
}

interface SmartGridSectionState {
  title: string;
  order: number;
  rowOrder: string[];
}

export interface SmartGridLayoutState {
  version: 1;
  items: Record<string, SmartGridItemState>;
  sections: Record<string, SmartGridSectionState>;
}

interface SmartGridLayoutProps {
  items: SmartGridItemDefinition[];
  persistedLayout?: SmartGridLayoutState | null;
  onLayoutChange?: (layout: SmartGridLayoutState) => void;
  maxColumns?: number;
  className?: string;
  editThemeColor?: ThemeColor;
  isEditMode?: boolean;
  onEditModeChange?: (isEditMode: boolean) => void;
}

type SmartGridSeedItem = Pick<SmartGridItemDefinition, 'id' | 'group' | 'defaultSpan' | 'defaultHidden' | 'defaultRemoved'>;

interface VisibleEntry {
  id: string;
  item: SmartGridItemDefinition;
  state: SmartGridItemState;
  order: number;
  isSpacer?: boolean;
}

interface PackedCell {
  entry: VisibleEntry;
  span: number;
}

interface DisplayRow {
  id: string;
  cells: PackedCell[];
  isEmpty?: boolean;
}

interface ResizeState {
  leftId: string;
  rightId: string;
  startX: number;
  startLeftSpan: number;
  pairTotal: number;
  colWidth: number;
}

interface DragOverState {
  id: string;
  position: 'before' | 'after';
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

const DEFAULT_SECTION = 'General';
const GRID_GAP_PX = 16;
const SPACER_PREFIX = 'spacer:';

const EDIT_THEME_COLORS: Record<string, { border: string; tint: string; solid: string; rgb: string }> = {
  blue: { border: 'border-blue-300 dark:border-blue-700', tint: 'bg-blue-500/10', solid: 'bg-blue-500 dark:bg-blue-400', rgb: '59,130,246' },
  sky: { border: 'border-sky-300 dark:border-sky-700', tint: 'bg-sky-500/10', solid: 'bg-sky-500 dark:bg-sky-400', rgb: '14,165,233' },
  emerald: { border: 'border-emerald-300 dark:border-emerald-700', tint: 'bg-emerald-500/10', solid: 'bg-emerald-500 dark:bg-emerald-400', rgb: '16,185,129' },
  lime: { border: 'border-lime-300 dark:border-lime-700', tint: 'bg-lime-500/10', solid: 'bg-lime-500 dark:bg-lime-400', rgb: '132,204,22' },
  amber: { border: 'border-amber-300 dark:border-amber-700', tint: 'bg-amber-500/10', solid: 'bg-amber-500 dark:bg-amber-400', rgb: '245,158,11' },
  orange: { border: 'border-orange-300 dark:border-orange-700', tint: 'bg-orange-500/10', solid: 'bg-orange-500 dark:bg-orange-400', rgb: '249,115,22' },
  rose: { border: 'border-rose-300 dark:border-rose-700', tint: 'bg-rose-500/10', solid: 'bg-rose-500 dark:bg-rose-400', rgb: '244,63,94' },
  violet: { border: 'border-violet-300 dark:border-violet-700', tint: 'bg-violet-500/10', solid: 'bg-violet-500 dark:bg-violet-400', rgb: '139,92,246' },
  fuchsia: { border: 'border-fuchsia-300 dark:border-fuchsia-700', tint: 'bg-fuchsia-500/10', solid: 'bg-fuchsia-500 dark:bg-fuchsia-400', rgb: '217,70,239' },
  neutral: { border: 'border-neutral-300 dark:border-neutral-700', tint: 'bg-neutral-500/10', solid: 'bg-neutral-500 dark:bg-neutral-400', rgb: '115,115,115' },
};

function makeId(prefix: string): string {
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function isSpacerId(id: string): boolean {
  return id.startsWith(SPACER_PREFIX);
}

function createSpacerId(): string {
  return `${SPACER_PREFIX}${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function clampSpan(span: number | undefined, maxColumns: number): number {
  if (!Number.isFinite(span)) return Math.min(4, maxColumns);
  return Math.max(1, Math.min(maxColumns, Math.round(Number(span))));
}

function sortByOrder<T extends { id: string; order: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.order === b.order) return a.id.localeCompare(b.id);
    return a.order - b.order;
  });
}

function normalizeRowSpans(desiredSpans: number[], maxColumns: number): number[] {
  if (desiredSpans.length === 0) return [];
  if (desiredSpans.length === 1) return [maxColumns];

  const safe = desiredSpans.map((span) => Math.max(1, Math.min(maxColumns, Math.round(span))));
  const total = safe.reduce((acc, span) => acc + span, 0);
  if (total === maxColumns) return safe;

  const scaled = safe.map((span) => (span / total) * maxColumns);
  const normalized = scaled.map((span) => Math.max(1, Math.floor(span)));
  let diff = maxColumns - normalized.reduce((acc, span) => acc + span, 0);

  if (diff > 0) {
    const byRemainder = scaled.map((raw, index) => ({ index, remainder: raw - Math.floor(raw) })).sort((a, b) => b.remainder - a.remainder);

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

function packUnassignedRows(entries: VisibleEntry[], maxColumns: number): DisplayRow[] {
  const packed: DisplayRow[] = [];
  let bucket: VisibleEntry[] = [];
  let bucketTotal = 0;

  for (const entry of sortByOrder(entries.map((x) => ({ ...x, order: x.order })))) {
    const desired = clampSpan(entry.state.span, maxColumns);
    if (bucket.length > 0 && bucketTotal + desired > maxColumns) {
      const spans = normalizeRowSpans(
        bucket.map((x) => clampSpan(x.state.span, maxColumns)),
        maxColumns,
      );
      packed.push({
        id: makeId('auto-row'),
        cells: bucket.map((row, index) => ({ entry: row, span: spans[index] })),
      });
      bucket = [];
      bucketTotal = 0;
    }

    bucket.push(entry);
    bucketTotal += desired;
  }

  if (bucket.length > 0) {
    const spans = normalizeRowSpans(
      bucket.map((x) => clampSpan(x.state.span, maxColumns)),
      maxColumns,
    );
    packed.push({
      id: makeId('auto-row'),
      cells: bucket.map((row, index) => ({ entry: row, span: spans[index] })),
    });
  }

  return packed;
}

function normalizeLayout(items: SmartGridSeedItem[], persistedLayout: SmartGridLayoutState | null | undefined, maxColumns: number): SmartGridLayoutState {
  const persistedItems = persistedLayout?.items ?? {};
  const persistedSections = persistedLayout?.sections ?? {};

  const next: SmartGridLayoutState = {
    version: 1,
    items: {},
    sections: {},
  };

  const ensureSection = (sectionId: string, fallbackTitle: string, fallbackOrder: number) => {
    const existing = next.sections[sectionId];
    const persisted = persistedSections[sectionId];
    if (existing) return existing;

    next.sections[sectionId] = {
      title: typeof persisted?.title === 'string' && persisted.title.trim().length > 0 ? persisted.title : fallbackTitle,
      order: Number.isFinite(persisted?.order) ? Number(persisted.order) : fallbackOrder,
      rowOrder: Array.isArray(persisted?.rowOrder) ? [...persisted.rowOrder] : [],
    };
    return next.sections[sectionId];
  };

  items.forEach((item, index) => {
    if (isSpacerId(item.id)) {
      return;
    }
    const persisted = persistedItems[item.id];
    // Hidden items with no persisted placement don't pre-create their group's section.
    // Their group is left undefined until the user explicitly adds them to a row.
    const isUnplacedHidden = !persisted && Boolean(item.defaultHidden) && !Boolean(item.defaultRemoved);
    const sectionId: string | undefined = isUnplacedHidden
      ? undefined
      : typeof persisted?.group === 'string' && persisted.group.trim().length > 0
        ? persisted.group
        : (item.group ?? DEFAULT_SECTION);
    const section = sectionId ? ensureSection(sectionId, sectionId, index) : undefined;
    const rowKey = typeof persisted?.rowKey === 'string' && persisted.rowKey.trim().length > 0 ? persisted.rowKey : undefined;

    next.items[item.id] = {
      order: Number.isFinite(persisted?.order) ? Number(persisted.order) : index,
      span: clampSpan(persisted?.span ?? item.defaultSpan ?? 12, maxColumns),
      hidden: typeof persisted?.hidden === 'boolean' ? persisted.hidden : Boolean(item.defaultHidden),
      removed: typeof persisted?.removed === 'boolean' ? persisted.removed : Boolean(item.defaultRemoved),
      group: sectionId,
      rowKey,
    };

    if (rowKey && section && !section.rowOrder.includes(rowKey)) {
      section.rowOrder.push(rowKey);
    }
  });

  // Preserve spacers from persisted layout
  Object.entries(persistedItems).forEach(([id, itemState]) => {
    if (isSpacerId(id)) {
      next.items[id] = {
        order: itemState.order ?? 0,
        span: clampSpan(itemState.span, maxColumns),
        hidden: typeof itemState.hidden === 'boolean' ? itemState.hidden : false,
        removed: typeof itemState.removed === 'boolean' ? itemState.removed : false,
        group: itemState.group,
        rowKey: itemState.rowKey,
      };
      // Add spacer's rowKey to section if it exists
      if (itemState.rowKey && itemState.group) {
        const section = ensureSection(itemState.group, itemState.group, 0);
        if (!section.rowOrder.includes(itemState.rowKey)) {
          section.rowOrder.push(itemState.rowKey);
        }
      }
    }
  });

  if (Object.keys(next.sections).length === 0) {
    next.sections[DEFAULT_SECTION] = {
      title: DEFAULT_SECTION,
      order: 0,
      rowOrder: [],
    };
  }

  const orderedSections = sortByOrder(Object.entries(next.sections).map(([id, section]) => ({ id, order: section.order })));

  orderedSections.forEach((entry, index) => {
    next.sections[entry.id] = {
      ...next.sections[entry.id],
      order: index,
    };
  });

  return next;
}

export const SmartGridLayout: React.FC<SmartGridLayoutProps> = ({ items, persistedLayout, onLayoutChange, maxColumns = 12, className, editThemeColor = 'blue', isEditMode: isEditModeProp }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<DragOverState | null>(null);
  const [emptyRowDropTarget, setEmptyRowDropTarget] = useState<string | null>(null);
  const [sectionBottomDropTarget, setSectionBottomDropTarget] = useState<string | null>(null);
  const [newSectionDropTarget, setNewSectionDropTarget] = useState(false);
  const [rowAddTarget, setRowAddTarget] = useState<RowAddTargetState | null>(null);
  const [rowPreview, setRowPreview] = useState<RowPreviewState | null>(null);

  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [resizePreview, setResizePreview] = useState<{ sectionId: string; rowId: string; insertIndex: number } | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionDraftTitle, setSectionDraftTitle] = useState('');
  const isEditMode = Boolean(isEditModeProp);

  const layoutIdentity = useMemo(() => items.map((item) => `${item.id}:${item.defaultSpan ?? ''}:${item.defaultHidden ? 1 : 0}:${item.defaultRemoved ? 1 : 0}:${item.group ?? ''}`).join('|'), [items]);

  const layoutSeedItems = useMemo<SmartGridSeedItem[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        group: item.group,
        defaultSpan: item.defaultSpan,
        defaultHidden: item.defaultHidden,
        defaultRemoved: item.defaultRemoved,
      })),
    [layoutIdentity],
  );

  const normalizedLayout = useMemo(() => normalizeLayout(layoutSeedItems, persistedLayout, maxColumns), [layoutSeedItems, persistedLayout, maxColumns]);
  const [layout, setLayout] = useState<SmartGridLayoutState>(() => normalizedLayout);

  const layoutRef = useRef<SmartGridLayoutState>(normalizedLayout);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const resizeChangedRef = useRef(false);

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  useEffect(() => {
    const prevItems = Object.keys(layout.items);
    const prevSections = Object.keys(layout.sections);
    const nextItems = Object.keys(normalizedLayout.items);
    const nextSections = Object.keys(normalizedLayout.sections);
    
    const itemsEqual = prevItems.length === nextItems.length && prevItems.every((id) => nextItems.includes(id));
    const sectionsEqual = prevSections.length === nextSections.length && prevSections.every((id) => nextSections.includes(id));
    
    if (!itemsEqual || !sectionsEqual) {
      setLayout(normalizedLayout);
    }
  }, [normalizedLayout]);

  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const orderedItems = useMemo(() => {
    return sortByOrder(
      items.map((item) => ({
        id: item.id,
        item,
        state: layout.items[item.id],
        order: layout.items[item.id]?.order ?? 0,
        isSpacer: isSpacerId(item.id),
      })),
    );
  }, [items, layout]);

  const orderedSpacers = useMemo(() => {
    return sortByOrder(
      Object.entries(layout.items)
        .filter(([id]) => isSpacerId(id))
        .map(([id, state]) => ({
          id,
          item: {
            id,
            title: '',
            render: () => null,
            isSpacer: true,
          } as SmartGridItemDefinition,
          state,
          order: state.order ?? 0,
          isSpacer: true,
        })),
    );
  }, [layout]);

  const activeItems = useMemo(() => {
    const fromProps = orderedItems.filter((row) => !row.state?.removed);
    const fromLayout = orderedSpacers.filter((row) => !row.state?.removed);
    return [...fromProps, ...fromLayout];
  }, [orderedItems, orderedSpacers]);
  
  const visibleItems = useMemo(() => {
    const fromProps = activeItems.filter((row) => !row.state?.hidden);
    return fromProps;
  }, [activeItems]);
  
  // Items available to add via the modal: anything not currently rendered (hidden or removed)
  // Spacers can only be added via the dedicated "Add Spacer" button, not from the list
  const addableItems = useMemo(() => {
    return orderedItems.filter((row) => row.state?.removed || row.state?.hidden);
  }, [orderedItems]);

  const orderedSectionIds = useMemo(() => {
    const sectionIdsWithContent = new Set(visibleItems.map((e) => e.state.group).filter(Boolean));
    return sortByOrder(
      Object.entries(layout.sections)
        .filter(([id]) => sectionIdsWithContent.has(id))
        .map(([id, section]) => ({ id, order: section.order })),
    ).map((entry) => entry.id);
  }, [layout, isEditMode, visibleItems]);

  const entriesBySection = useMemo(() => {
    const map = new Map<string, VisibleEntry[]>();
    for (const entry of visibleItems) {
      const sectionId = entry.state.group ?? entry.item.group ?? DEFAULT_SECTION;
      const prev = map.get(sectionId);
      const entryWithFlag = { ...entry, isSpacer: isSpacerId(entry.id) };
      if (prev) prev.push(entryWithFlag);
      else map.set(sectionId, [entryWithFlag]);
    }
    return map;
  }, [visibleItems, layout]);

  const sectionRows = useMemo(() => {
    const result = new Map<string, DisplayRow[]>();
    const rowColumns = maxColumns;

    for (const sectionId of orderedSectionIds) {
      const section = layout.sections[sectionId];
      const entries = sortByOrder((entriesBySection.get(sectionId) ?? []).map((e) => ({ ...e, order: e.order })));

      const byRow = new Map<string, VisibleEntry[]>();
      const unassigned: VisibleEntry[] = [];

      for (const entry of entries) {
        const rowKey = entry.state.rowKey;
        if (rowKey && section.rowOrder.includes(rowKey)) {
          const prev = byRow.get(rowKey);
          if (prev) prev.push(entry);
          else byRow.set(rowKey, [entry]);
        } else {
          unassigned.push(entry);
        }
      }

      const rows: DisplayRow[] = [];
      section.rowOrder.forEach((rowId) => {
        const rowEntries = sortByOrder((byRow.get(rowId) ?? []).map((e) => ({ ...e, order: e.order })))
          .filter((e) => !e.state.removed);
        if (rowEntries.length === 0) {
          // Skip empty managed rows — they're pruned on save and should not render
          return;
        }
        const spans = normalizeRowSpans(
          rowEntries.map((e) => clampSpan(e.state.span, rowColumns)),
          rowColumns,
        );
        rows.push({
          id: rowId,
          cells: rowEntries.map((entry, index) => ({ entry, span: spans[index] })),
        });
      });

      const packedUnassigned = packUnassignedRows(unassigned, maxColumns).map((packedRow) => {
        const spans = normalizeRowSpans(
          packedRow.cells.map((cell) => clampSpan(cell.entry.state.span, rowColumns)),
          rowColumns,
        );

        return {
          ...packedRow,
          cells: packedRow.cells.map((cell, index) => ({ ...cell, span: spans[index] })),
        };
      });

      rows.push(...packedUnassigned);
      result.set(sectionId, rows);
    }

    return result;
  }, [entriesBySection, layout.sections, maxColumns, orderedSectionIds]);

  const updateLayout = useCallback(
    (updater: (prev: SmartGridLayoutState) => SmartGridLayoutState) => {
      setLayout((prev) => {
        const next = updater(prev);
        onLayoutChange?.(next);
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
        Object.values(prev.items)
          .filter((item) => !item.removed && item.rowKey)
          .map((item) => item.rowKey as string),
      );

      let changed = false;
      const nextSections = { ...prev.sections };

      Object.entries(prev.sections).forEach(([sectionId, section]) => {
        const filteredRowOrder = section.rowOrder.filter((rowId) => populatedRowKeys.has(rowId));
        if (filteredRowOrder.length !== section.rowOrder.length) {
          nextSections[sectionId] = { ...section, rowOrder: filteredRowOrder };
          changed = true;
        }
      });

      return changed ? { ...prev, sections: nextSections } : prev;
    });
  }, [isEditMode, updateLayout]);

  const updateItem = useCallback(
    (itemId: string, updater: (prev: SmartGridItemState) => SmartGridItemState) => {
      updateLayout((prev) => {
        const current = prev.items[itemId];
        if (!current) return prev;
        return {
          ...prev,
          items: {
            ...prev.items,
            [itemId]: updater(current),
          },
        };
      });
    },
    [updateLayout],
  );

  const removeItem = useCallback(
    (itemId: string) => {
      updateItem(itemId, (prev) => ({ ...prev, removed: true, hidden: false }));
    },
    [updateItem],
  );

  const addSpacerToRow = useCallback(
    (sectionId: string, rowId: string, span: number = 1) => {
      const spacerId = createSpacerId();
      updateLayout((prev) => {
        const maxOrder = Math.max(...Object.values(prev.items).map((item) => item.order), 0);
        
        // Check if adding this spacer would overflow the row
        // Get current items in the row
        const rowItems = Object.entries(prev.items).filter(([, item]) => 
          item.rowKey === rowId && item.group === sectionId && !item.removed
        );
        
        const currentRowSpan = rowItems.reduce((sum, [, item]) => sum + item.span, 0);
        const wouldOverflow = currentRowSpan + span > maxColumns;
        
        // If would overflow, reduce the largest item by the overflow amount
        let items = { ...prev.items };
        if (wouldOverflow) {
          const overflow = currentRowSpan + span - maxColumns;
          // Find the largest item to reduce
          const largestItem = rowItems.reduce((largest, [, item]) => 
            item.span > largest.span ? item : largest
          , rowItems[0][1]);
          
          if (largestItem.span > overflow) {
            items = {
              ...items,
              [rowItems.find(([, item]) => item === largestItem)?.[0] as string]: { ...largestItem, span: largestItem.span - overflow }
            };
          }
        }
        
        return {
          ...prev,
          items: {
            ...items,
            [spacerId]: {
              order: maxOrder + 1,
              span,
              hidden: false,
              removed: false,
              group: sectionId,
              rowKey: rowId,
            },
          },
        };
      });
    },
    [updateLayout],
  );

  const addItemToRow = useCallback(
    (itemId: string, sectionId: string, rowId: string) => {
      if (isSpacerId(itemId)) {
        addSpacerToRow(sectionId, rowId);
        return;
      }
      updateLayout((prev) => {
        const current = prev.items[itemId];
        if (!current) return prev;
        const maxOrder = Math.max(...Object.values(prev.items).map((row) => row.order), 0);
        return {
          ...prev,
          items: {
            ...prev.items,
            [itemId]: {
              ...current,
              removed: false,
              hidden: false,
              order: maxOrder + 1,
              group: sectionId,
              rowKey: rowId,
            },
          },
        };
      });
    },
    [updateLayout, addSpacerToRow],
  );

  const ensureSection = useCallback(
    (sectionId: string, title?: string) => {
      updateLayout((prev) => {
        if (prev.sections[sectionId]) return prev;
        const maxOrder = Math.max(...Object.values(prev.sections).map((section) => section.order), -1);
        return {
          ...prev,
          sections: {
            ...prev.sections,
            [sectionId]: {
              title: title ?? sectionId,
              order: maxOrder + 1,
              rowOrder: [],
            },
          },
        };
      });
    },
    [updateLayout],
  );

  const renameSection = useCallback(
    (sectionId: string, title: string) => {
      updateLayout((prev) => {
        const section = prev.sections[sectionId];
        if (!section) return prev;
        return {
          ...prev,
          sections: {
            ...prev.sections,
            [sectionId]: {
              ...section,
              title,
            },
          },
        };
      });
    },
    [updateLayout],
  );

  const createRow = useCallback(
    (sectionId: string): string => {
      const rowId = makeId(`row:${sectionId}`);
      updateLayout((prev) => {
        const section = prev.sections[sectionId];
        if (!section) return prev;
        if (section.rowOrder.includes(rowId)) return prev;
        return {
          ...prev,
          sections: {
            ...prev.sections,
            [sectionId]: {
              ...section,
              rowOrder: [...section.rowOrder, rowId],
            },
          },
        };
      });
      return rowId;
    },
    [updateLayout],
  );

  const removeRowItems = useCallback(
    (sectionId: string, rowId: string, itemIds: string[], isManagedRow: boolean) => {
      updateLayout((prev) => {
        const nextItems = { ...prev.items };
        let changed = false;

        itemIds.forEach((itemId) => {
          const itemState = nextItems[itemId];
          if (!itemState || itemState.removed) return;
          nextItems[itemId] = {
            ...itemState,
            removed: true,
            hidden: false,
          };
          changed = true;
        });

        let nextSections = prev.sections;
        if (isManagedRow) {
          const section = prev.sections[sectionId];
          if (section && section.rowOrder.includes(rowId)) {
            nextSections = {
              ...prev.sections,
              [sectionId]: {
                ...section,
                rowOrder: section.rowOrder.filter((id) => id !== rowId),
              },
            };
            changed = true;
          }
        }

        if (!changed) return prev;
        return {
          ...prev,
          items: nextItems,
          sections: nextSections,
        };
      });
    },
    [updateLayout],
  );

  const createSection = useCallback((): string => {
    const sectionId = makeId('section');
    ensureSection(sectionId, 'New Section');
    return sectionId;
  }, [ensureSection]);

  const removeSection = useCallback(
    (sectionId: string) => {
      updateLayout((prev) => {
        const nextSections = { ...prev.sections };
        delete nextSections[sectionId];
        // Clear group for any items that belonged to this section so they reappear in the add modal cleanly
        const nextItems = { ...prev.items };
        Object.entries(nextItems).forEach(([itemId, item]) => {
          if (item.group === sectionId) {
            nextItems[itemId] = { ...item, group: undefined, rowKey: undefined };
          }
        });
        return { ...prev, sections: nextSections, items: nextItems };
      });
    },
    [updateLayout],
  );

  const setItemPlacement = useCallback(
    (itemId: string, sectionId: string, rowKey?: string) => {
      updateLayout((prev) => {
        const current = prev.items[itemId];
        if (!current) return prev;
        return {
          ...prev,
          items: {
            ...prev.items,
            [itemId]: {
              ...current,
              group: sectionId,
              rowKey,
            },
          },
        };
      });
    },
    [updateLayout],
  );

  const reorderItems = useCallback(
    (sourceId: string, targetId: string, position: 'before' | 'after') => {
      if (sourceId === targetId) return;
      updateLayout((prev) => {
        const activeIds = sortByOrder(
          Object.entries(prev.items)
            .filter(([, row]) => !row.removed)
            .map(([id, row]) => ({ id, order: row.order })),
        ).map((row) => row.id);

        if (!activeIds.includes(sourceId) || !activeIds.includes(targetId)) return prev;

        const nextOrder = activeIds.filter((id) => id !== sourceId);
        const targetIndex = nextOrder.indexOf(targetId);
        if (targetIndex < 0) return prev;

        const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
        nextOrder.splice(insertIndex, 0, sourceId);

        const nextItems = { ...prev.items };
        nextOrder.forEach((id, index) => {
          nextItems[id] = {
            ...nextItems[id],
            order: index,
          };
        });

        return {
          ...prev,
          items: nextItems,
        };
      });
    },
    [updateLayout],
  );

  const moveItemToSectionEnd = useCallback(
    (itemId: string, sectionId: string, rowKey: string) => {
      updateLayout((prev) => {
        const current = prev.items[itemId];
        if (!current) return prev;
        const maxOrder = Math.max(...Object.values(prev.items).map((row) => row.order), 0);
        return {
          ...prev,
          items: {
            ...prev.items,
            [itemId]: {
              ...current,
              order: maxOrder + 1,
              group: sectionId,
              rowKey,
            },
          },
        };
      });
    },
    [updateLayout],
  );

  const beginResize = useCallback(
    (event: React.MouseEvent, rowDomKey: string, leftId: string, rightId: string, leftSpan: number, rightSpan: number) => {
      if (!isEditMode) return;
      event.preventDefault();
      event.stopPropagation();

      const rowEl = rowRefs.current[rowDomKey];
      if (!rowEl) return;

      const rect = rowEl.getBoundingClientRect();
      const colWidth = (rect.width - (maxColumns - 1) * GRID_GAP_PX) / maxColumns;
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

  useEffect(() => {
    if (!resizeState) return;

    const onMouseMove = (event: MouseEvent) => {
      const deltaColumns = Math.round((event.clientX - resizeState.startX) / resizeState.colWidth);
      const nextLeft = Math.max(1, Math.min(resizeState.pairTotal - 1, resizeState.startLeftSpan + deltaColumns));
      const nextRight = resizeState.pairTotal - nextLeft;

      setLayout((prev) => {
        const left = prev.items[resizeState.leftId];
        const right = prev.items[resizeState.rightId];
        if (!left || !right) return prev;

        let shouldUpdate = false;

        if (resizeState.leftId === resizeState.rightId) {
          if (left.span === nextLeft) return prev;
          shouldUpdate = true;
        } else {
          if (left.span === nextLeft && right.span === nextRight) return prev;
          shouldUpdate = true;
        }

        resizeChangedRef.current = true;

        if (shouldUpdate) {
          const newLayout = {
            ...prev,
            items: {
              ...prev.items,
              [resizeState.leftId]: {
                ...left,
                span: nextLeft,
              },
            },
          };

          if (resizeState.leftId !== resizeState.rightId) {
            newLayout.items[resizeState.rightId] = {
              ...right,
              span: nextRight,
            };
          }

          return newLayout;
        }

        return prev;
      });
    };

    const onMouseUp = () => {
      setResizeState(null);
      setResizePreview(null);
      if (resizeChangedRef.current) {
        onLayoutChange?.(layoutRef.current);
      }
      resizeChangedRef.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onLayoutChange, resizeState]);

  const editTheme = EDIT_THEME_COLORS[editThemeColor] ?? EDIT_THEME_COLORS.blue;

  const resetDragState = useCallback(() => {
    setDraggingId(null);
    setDragOver(null);
    setEmptyRowDropTarget(null);
    setSectionBottomDropTarget(null);
    setNewSectionDropTarget(false);
    setRowPreview(null);
    setResizePreview(null);
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      resetDragState();
      setEditingSectionId(null);
      setSectionDraftTitle('');
      setRowAddTarget(null);
      setIsAddModalOpen(false);
    }
  }, [isEditMode, resetDragState]);

  const getDraggedId = useCallback(
    (event: React.DragEvent): string | null => {
      return draggingId ?? (event.dataTransfer.getData('text/plain') || null);
    },
    [draggingId],
  );

  return (
    <div className={`relative ${className ?? ''}`}>
      {isAddModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-neutral-900/50 p-4">
          <div className="w-full max-w-xl rounded-xl border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
             <div className="mb-3 flex items-center justify-between">
               <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Add Items To Row</h3>
               <div className="flex items-center gap-2">
                 {isEditMode && rowAddTarget && (() => {
                   const sectionRowsList = sectionRows.get(rowAddTarget.sectionId) ?? [];
                   const targetRow = sectionRowsList.find((r) => r.id === rowAddTarget.rowId);
                   const hasItems = targetRow && targetRow.cells.length > 0;
                   return hasItems ? (
                     <Button
                       type="button"
                       variant="outline"
                       color="slate"
                       size="xs"
                       leadingIcon="Add"
                       onClick={() => {
                         addSpacerToRow(rowAddTarget.sectionId, rowAddTarget.rowId);
                         setIsAddModalOpen(false);
                       }}
                     >
                       Add Spacer
                     </Button>
                   ) : null;
                 })()}
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
            {addableItems.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">No items available to add.</p>
            ) : (
              <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                {addableItems.map((row) => {
                  const categoryLabel = row.item.group ?? layout.sections[row.state.group ?? '']?.title ?? row.state.group ?? DEFAULT_SECTION;
                  return (
                    <div key={row.id} className="flex items-center gap-3 rounded-md border border-neutral-200 p-2 dark:border-neutral-700">
                      {/* Thumbnail */}
                      <div className="shrink-0 overflow-hidden rounded border border-neutral-200 dark:border-neutral-700" style={{ width: 100, height: 100 }}>
                        {row.item.screenshot ? (
                          <img src={row.item.screenshot} alt={row.item.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white dark:bg-neutral-900">
                            <CustomIcon icon="Dashboard" className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{row.item.title}</span>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">· {categoryLabel}</span>
                        </div>
                        {row.item.description && (
                          <div className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">{row.item.description}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!rowAddTarget) return;
                          if (isSpacerId(row.id)) {
                            addSpacerToRow(rowAddTarget.sectionId, rowAddTarget.rowId);
                          } else {
                            addItemToRow(row.id, rowAddTarget.sectionId, rowAddTarget.rowId);
                          }
                          setRowAddTarget(null);
                          setIsAddModalOpen(false);
                        }}
                        className="shrink-0 rounded border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                      >
                        {isSpacerId(row.id) ? 'Add Spacer' : 'Add'}
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
        const section = layout.sections[sectionId];
        const rows = sectionRows.get(sectionId) ?? [];

        return (
          <section key={sectionId} className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              {isEditMode && editingSectionId === sectionId ? (
                <div className="flex items-center gap-2">
                  <input
                    value={sectionDraftTitle}
                    onChange={(event) => setSectionDraftTitle(event.target.value)}
                    onBlur={() => {
                      renameSection(sectionId, sectionDraftTitle.trim() || 'Untitled Section');
                      setEditingSectionId(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        renameSection(sectionId, sectionDraftTitle.trim() || 'Untitled Section');
                        setEditingSectionId(null);
                      }
                      if (event.key === 'Escape') {
                        setEditingSectionId(null);
                      }
                    }}
                    className="rounded border border-neutral-300 px-2 py-1 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    autoFocus
                  />
                </div>
              ) : (
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">{section.title}</h2>
              )}

              {isEditMode && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    color="slate"
                    size="xs"
                    leadingIcon="Add"
                    onClick={() => {
                      const newRowId = createRow(sectionId);
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

            <div className="space-y-4">
              {rows.map((row, rowIndex) => {
                const rowDomKey = `${sectionId}-${row.id}-${rowIndex}`;
                const isManagedRow = section.rowOrder.includes(row.id);
                const rowContentSpan = maxColumns;
                const isRowPreviewActive = Boolean(isEditMode && draggingId && rowPreview && rowPreview.sectionId === sectionId && rowPreview.rowId === row.id);

                const isResizePreviewActive = Boolean(resizeState && resizePreview && resizePreview.sectionId === sectionId && resizePreview.rowId === row.id && row.cells.length === 1);

                const renderCells = (() => {
                  if (!isRowPreviewActive && !isResizePreviewActive) {
                    return row.cells.map((cell) => ({ kind: 'item' as const, id: cell.entry.id, span: cell.span, cell }));
                  }

                  if (isRowPreviewActive && draggingId && rowPreview) {
                    const draggedState = layout.items[draggingId];
                    const draggedSpan = clampSpan(draggedState?.span ?? 3, rowContentSpan);

                    const withoutDragged = row.cells.filter((cell) => cell.entry.id !== draggingId);
                    const insertIndex = Math.max(0, Math.min(rowPreview.insertIndex, withoutDragged.length));

                    const withGhost = [
                      ...withoutDragged.slice(0, insertIndex).map((cell) => ({ kind: 'item' as const, id: cell.entry.id, desiredSpan: clampSpan(cell.entry.state.span, rowContentSpan), cell })),
                      { kind: 'ghost' as const, id: '__ghost__', desiredSpan: draggedSpan },
                      ...withoutDragged.slice(insertIndex).map((cell) => ({ kind: 'item' as const, id: cell.entry.id, desiredSpan: clampSpan(cell.entry.state.span, rowContentSpan), cell })),
                    ];

                    const normalized = normalizeRowSpans(
                      withGhost.map((entry) => entry.desiredSpan),
                      rowContentSpan,
                    );

                    return withGhost.map((entry) => ({
                      kind: entry.kind,
                      id: entry.id,
                      span: normalized[withGhost.indexOf(entry)],
                      cell: entry.kind === 'item' ? entry.cell : undefined,
                    }));
                  }

                  if (isResizePreviewActive && resizeState) {
                    const itemId = resizeState.leftId;
                    const currentSpan = resizeState.startLeftSpan;
                    const resizedSpan = Math.max(1, Math.min(resizeState.pairTotal - 1, currentSpan + Math.round((0 - resizeState.startX) / resizeState.colWidth)));

                    const cell = row.cells[0];
                    const emptySpaceSpan = maxColumns - resizedSpan;

                    const withGhost = [
                      { kind: 'item' as const, id: itemId, desiredSpan: resizedSpan, cell },
                      { kind: 'ghost' as const, id: '__empty_space__', desiredSpan: emptySpaceSpan },
                    ];

                    return withGhost.map((entry) => ({
                      kind: entry.kind,
                      id: entry.id,
                      span: entry.desiredSpan,
                      cell: entry.kind === 'item' ? entry.cell : undefined,
                    }));
                  }

                  return row.cells.map((cell) => ({ kind: 'item' as const, id: cell.entry.id, span: cell.span, cell }));
                })();

                return (
                  <div key={row.id} className={`relative flex items-stretch gap-2 rounded-lg ${isEditMode ? `${editTheme.border} border border-dashed p-2` : ''}`}>
                    {isEditMode && row.cells.length > 0 && (
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
                              row.cells.map((cell) => cell.entry.id),
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
                      className="relative grid flex-1 gap-4 rounded-lg"
                      style={{ gridTemplateColumns: `repeat(${maxColumns}, minmax(0, 1fr))` }}
                      onDragOver={(event) => {
                        if (!isEditMode) return;
                        const sourceId = getDraggedId(event);
                        if (!sourceId) return;
                        event.preventDefault();

                        if (row.isEmpty) {
                          if (emptyRowDropTarget !== rowDomKey) setEmptyRowDropTarget(rowDomKey);
                          if (!rowPreview || rowPreview.sectionId !== sectionId || rowPreview.rowId !== row.id || rowPreview.insertIndex !== 0) {
                            setRowPreview({ sectionId, rowId: row.id, insertIndex: 0 });
                          }
                          return;
                        }

                        if (emptyRowDropTarget === rowDomKey) setEmptyRowDropTarget(null);

                        const rowEl = rowRefs.current[rowDomKey];
                        const rowCellsWithoutDragged = row.cells.filter((cell) => cell.entry.id !== sourceId);
                        let nextIndex = rowCellsWithoutDragged.length;

                        for (let i = 0; i < rowCellsWithoutDragged.length; i += 1) {
                          const candidate = rowCellsWithoutDragged[i];
                          const candidateEl = rowEl?.querySelector(`[data-sg-item-id="${candidate.entry.id}"]`) as HTMLElement | null;
                          if (!candidateEl) continue;
                          const rect = candidateEl.getBoundingClientRect();
                          if (event.clientX < rect.left + rect.width / 2) {
                            nextIndex = i;
                            break;
                          }
                        }

                        if (!rowPreview || rowPreview.sectionId !== sectionId || rowPreview.rowId !== row.id || rowPreview.insertIndex !== nextIndex) {
                          setRowPreview({ sectionId, rowId: row.id, insertIndex: nextIndex });
                        }
                      }}
                      onDragLeave={(event) => {
                        if (!isEditMode) return;
                        const nextTarget = event.relatedTarget as Node | null;
                        if (nextTarget && event.currentTarget.contains(nextTarget)) return;
                        if (emptyRowDropTarget === rowDomKey) setEmptyRowDropTarget(null);
                        if (rowPreview?.sectionId === sectionId && rowPreview.rowId === row.id) {
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

                          if (!row.isEmpty && row.cells.length > 0) {
                            const targetRowId = row.id;
                            const previewIndex = rowPreview?.sectionId === sectionId && rowPreview.rowId === targetRowId ? rowPreview.insertIndex : row.cells.length;

                            const withoutDragged = row.cells.filter((cell) => cell.entry.id !== sourceId);
                            const safeIndex = Math.max(0, Math.min(previewIndex, withoutDragged.length));

                            if (withoutDragged.length === 0) {
                              moveItemToSectionEnd(sourceId, sectionId, targetRowId);
                              resetDragState();
                              return;
                            }

                            if (safeIndex <= 0) {
                              reorderItems(sourceId, withoutDragged[0].entry.id, 'before');
                            } else {
                              reorderItems(sourceId, withoutDragged[safeIndex - 1].entry.id, 'after');
                            }
                            setItemPlacement(sourceId, sectionId, targetRowId);

                            updateLayout((prev) => {
                              const currentRow = prev.sections[sectionId];
                              if (!currentRow || !currentRow.rowOrder.includes(targetRowId)) return prev;

                               const rowItemIds = withoutDragged.map((cell) => cell.entry.id);
                               const newSpans = normalizeRowSpans(
                                 rowItemIds.map((id) => {
                                   const item = prev.items[id];
                                   return clampSpan(item?.span, maxColumns);
                                 }),
                                 maxColumns,
                               );

                               const nextItems = { ...prev.items };
                               rowItemIds.forEach((id, index) => {
                                 nextItems[id] = {
                                   ...nextItems[id],
                                   span: newSpans[index],
                                 };
                               });

                               return {
                                 ...prev,
                                 items: nextItems,
                               };
                             });

                            resetDragState();
                            return;
                          }

                          moveItemToSectionEnd(sourceId, sectionId, row.id);
                          resetDragState();
                        }}
                    >
                      {row.isEmpty && (
                        <div
                          className={`rounded-md border border-dashed p-4 text-center text-xs transition ${emptyRowDropTarget === rowDomKey ? `${editTheme.border} ${editTheme.tint} text-neutral-900 dark:text-neutral-100` : 'border-neutral-300 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400'}`}
                          style={{ gridColumn: `span ${rowContentSpan} / span ${rowContentSpan}` }}
                        >
                          Empty row. Drag a card here.
                        </div>
                      )}

                       {renderCells.map((renderCell, cellIndex) => {
                         if (renderCell.kind === 'ghost') {
                           return (
                             <div
                               key="__ghost__"
                               className={`relative z-10 min-h-28 rounded-xl border-2 border-dashed ${editTheme.border} ${editTheme.tint}`}
                               style={{ gridColumn: `span ${renderCell.span} / span ${renderCell.span}` }}
                             />
                           );
                         }

                         const cell = renderCell.cell;
                         if (!cell) return null;

                          const nextItemIndex = renderCells.slice(cellIndex + 1).findIndex((c) => c.kind === 'item');
                          const neighbor = nextItemIndex >= 0 ? renderCells[cellIndex + 1 + nextItemIndex] : undefined;
                          const neighborCell = neighbor?.kind === 'item' ? neighbor.cell : undefined;

                          const def = byId.get(cell.entry.id);
                          if (!def && !cell.entry.isSpacer) return null;

                           if (cell.entry.isSpacer) {
                             return (
                               <div
                                 key={cell.entry.id}
                                 data-sg-item-id={cell.entry.id}
                                 className={`relative z-10 min-h-28 rounded-xl ${isEditMode ? `border-2 border-dashed ${editTheme.border} ${editTheme.tint} cursor-grab active:cursor-grabbing` : ''} ${draggingId === cell.entry.id ? 'opacity-50 scale-[0.99]' : ''}`}
                                 style={{ gridColumn: `span ${renderCell.span} / span ${renderCell.span}` }}
                                draggable={isEditMode}
                                onDragStart={(event) => {
                                  event.dataTransfer.effectAllowed = 'move';
                                  event.dataTransfer.setData('text/plain', cell.entry.id);
                                  setDraggingId(cell.entry.id);
                                  setDragOver(null);
                                }}
                                onDragEnd={resetDragState}
                                onDragOver={(event) => {
                                  if (!isEditMode || !draggingId) return;
                                  event.preventDefault();
                                  event.stopPropagation();
                                  if (draggingId === cell.entry.id) return;
                                  const rect = event.currentTarget.getBoundingClientRect();
                                  const position = event.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
                                  if (!dragOver || dragOver.id !== cell.entry.id || dragOver.position !== position) {
                                    setDragOver({ id: cell.entry.id, position });
                                  }
                                  const previewIndex =
                                    position === 'before'
                                      ? row.cells.filter((entry) => entry.entry.id !== draggingId).findIndex((entry) => entry.entry.id === cell.entry.id)
                                      : row.cells.filter((entry) => entry.entry.id !== draggingId).findIndex((entry) => entry.entry.id === cell.entry.id) + 1;
                                  if (previewIndex >= 0 && (!rowPreview || rowPreview.sectionId !== sectionId || rowPreview.rowId !== row.id || rowPreview.insertIndex !== previewIndex)) {
                                    setRowPreview({ sectionId, rowId: row.id, insertIndex: previewIndex });
                                  }
                                }}
                                onDragLeave={(event) => {
                                  if (!isEditMode || !draggingId) return;
                                  const nextTarget = event.relatedTarget as Node | null;
                                  if (nextTarget && event.currentTarget.contains(nextTarget)) return;
                                  if (dragOver?.id === cell.entry.id) setDragOver(null);
                                }}
                                onDrop={(event) => {
                                  if (!isEditMode) return;
                                  event.preventDefault();
                                  event.stopPropagation();
                                  const sourceId = getDraggedId(event);
                                  if (!sourceId || sourceId === cell.entry.id) return;
                                  const rect = event.currentTarget.getBoundingClientRect();
                                  const position = event.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
                                  reorderItems(sourceId, cell.entry.id, position);
                                  setItemPlacement(sourceId, sectionId, row.id);
                                  resetDragState();
                                }}
                              >
                                {isEditMode && (
                                  <div className="absolute right-2 top-2 z-30">
                                    <IconButton
                                      icon="Trash"
                                      size="xs"
                                      variant="ghost"
                                      color="rose"
                                      onClick={() => removeItem(cell.entry.id)}
                                      aria-label="Remove spacer"
                                      title="Remove spacer"
                                    />
                                  </div>
                                 )}
                                 {isEditMode && cell.entry.item.isSpacer && neighborCell && neighbor && (
                                   <button
                                     type="button"
                                     onMouseDown={(event) => {
                                       beginResize(event, rowDomKey, cell.entry.id, neighborCell.entry.id, renderCell.span, neighbor.span);
                                     }}
                                     className="group absolute left-full top-2 bottom-2 z-10 w-4 cursor-col-resize bg-transparent"
                                     aria-label="Resize spacer"
                                   >
                                     <span
                                       className={`absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 rounded-full opacity-0 transition-opacity duration-150 group-hover:opacity-80 group-focus-visible:opacity-80 ${editTheme.solid} ${resizeState?.leftId === cell.entry.id ? 'opacity-90' : ''}`}
                                     />
                                   </button>
                                 )}
                               </div>
                               );
                             }
                            return (
                              <article
                             key={cell.entry.id}
                             data-sg-item-id={cell.entry.id}
                             className={`relative z-0 min-w-0 transition-[grid-column,transform,box-shadow] duration-150 ease-out ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''} ${draggingId === cell.entry.id ? 'opacity-50 scale-[0.99]' : ''}`}
                             style={{ gridColumn: `span ${renderCell.span} / span ${renderCell.span}` }}
                            draggable={isEditMode}
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = 'move';
                              event.dataTransfer.setData('text/plain', cell.entry.id);
                              setDraggingId(cell.entry.id);
                              setDragOver(null);
                            }}
                            onDragEnd={resetDragState}
                            onDragOver={(event) => {
                              if (!isEditMode || !draggingId) return;
                              event.preventDefault();
                              event.stopPropagation();
                              if (draggingId === cell.entry.id) return;
                              const rect = event.currentTarget.getBoundingClientRect();
                              const position = event.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
                              if (!dragOver || dragOver.id !== cell.entry.id || dragOver.position !== position) {
                                setDragOver({ id: cell.entry.id, position });
                              }

                              const previewIndex =
                                position === 'before'
                                  ? row.cells.filter((entry) => entry.entry.id !== draggingId).findIndex((entry) => entry.entry.id === cell.entry.id)
                                  : row.cells.filter((entry) => entry.entry.id !== draggingId).findIndex((entry) => entry.entry.id === cell.entry.id) + 1;

                              if (previewIndex >= 0 && (!rowPreview || rowPreview.sectionId !== sectionId || rowPreview.rowId !== row.id || rowPreview.insertIndex !== previewIndex)) {
                                setRowPreview({ sectionId, rowId: row.id, insertIndex: previewIndex });
                              }
                            }}
                            onDragLeave={(event) => {
                              if (!isEditMode || !draggingId) return;
                              const nextTarget = event.relatedTarget as Node | null;
                              if (nextTarget && event.currentTarget.contains(nextTarget)) return;
                              if (dragOver?.id === cell.entry.id) setDragOver(null);
                            }}
                            onDrop={(event) => {
                              if (!isEditMode) return;
                              event.preventDefault();
                              event.stopPropagation();
                              const sourceId = getDraggedId(event);
                              if (!sourceId || sourceId === cell.entry.id) return;

                              const rect = event.currentTarget.getBoundingClientRect();
                              const position = event.clientX < rect.left + rect.width / 2 ? 'before' : 'after';

                              reorderItems(sourceId, cell.entry.id, position);
                              setItemPlacement(sourceId, sectionId, row.id);
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
                                   beginResize(event, rowDomKey, cell.entry.id, neighborCell.entry.id, renderCell.span, neighbor.span);
                                 }}
                                 className="group absolute left-full top-2 bottom-2 z-10 w-4 cursor-col-resize bg-transparent"
                                 aria-label={`Resize ${cell.entry.item.title}`}
                               >
                                 <span
                                   className={`absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 rounded-full opacity-0 transition-opacity duration-150 group-hover:opacity-80 group-focus-visible:opacity-80 ${editTheme.solid} ${resizeState?.leftId === cell.entry.id ? 'opacity-90' : ''}`}
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
                  </div>
                );
              })}

              {isEditMode && (
                <div
                  className={`rounded-md border border-dashed px-3 py-2 text-center text-xs transition ${sectionBottomDropTarget === sectionId ? `${editTheme.border} ${editTheme.tint} text-neutral-900 dark:text-neutral-100` : 'border-neutral-300 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400'}`}
                  onDragOver={(event) => {
                    if (!draggingId) return;
                    event.preventDefault();
                    if (sectionBottomDropTarget !== sectionId) setSectionBottomDropTarget(sectionId);
                  }}
                  onDragLeave={(event) => {
                    const nextTarget = event.relatedTarget as Node | null;
                    if (nextTarget && event.currentTarget.contains(nextTarget)) return;
                    if (sectionBottomDropTarget === sectionId) setSectionBottomDropTarget(null);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const sourceId = getDraggedId(event);
                    if (!sourceId) return;
                    const rowId = createRow(sectionId);
                    moveItemToSectionEnd(sourceId, sectionId, rowId);
                    resetDragState();
                  }}
                 >
                   <Button type="button" variant="outline" color="slate" size="xs" leadingIcon="Add" onClick={() => {
                     setRowAddTarget({ sectionId, rowId: '' });
                     setIsAddModalOpen(true);
                   }}>
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
          className={`rounded-xl border border-dashed p-4 text-center text-sm transition ${newSectionDropTarget ? `${editTheme.border} ${editTheme.tint} text-neutral-900 dark:text-neutral-100` : 'border-neutral-300 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400'}`}
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
            const rowId = createRow(sectionId);
            moveItemToSectionEnd(sourceId, sectionId, rowId);
            resetDragState();
          }}
         >
           <Button type="button" variant="outline" color="slate" size="sm" leadingIcon="Add" onClick={() => {
             const sectionId = createSection();
             const rowId = createRow(sectionId);
             setRowAddTarget({ sectionId, rowId });
             setIsAddModalOpen(true);
           }}>
             Add item to create new section
           </Button>
          <p className="mt-2 text-xs">Or drop a card here to create a section and place it there</p>
        </div>
      )}
    </div>
  );
};
