import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import Pill from './Pill';
import { type ThemeColor } from '../theme/Theme';
import type { TreeTone } from './TreeView/types';

const toneTokens: Record<ThemeColor, { triggerOpen: string; filterActive: string; optionSelectedBg: string; optionSelectedText: string; optionSelectedIcon: string }> = {
  parallels: {
    triggerOpen: 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-400',
    filterActive: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
    optionSelectedBg: 'bg-rose-50 dark:bg-rose-900/20',
    optionSelectedText: 'text-rose-700 dark:text-rose-300',
    optionSelectedIcon: 'text-rose-500 dark:text-rose-400',
  },
  brand: {
    triggerOpen: 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-400',
    filterActive: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
    optionSelectedBg: 'bg-rose-50 dark:bg-rose-900/20',
    optionSelectedText: 'text-rose-700 dark:text-rose-300',
    optionSelectedIcon: 'text-rose-500 dark:text-rose-400',
  },
  theme: {
    triggerOpen: 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-400',
    filterActive: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
    optionSelectedBg: 'bg-rose-50 dark:bg-rose-900/20',
    optionSelectedText: 'text-rose-700 dark:text-rose-300',
    optionSelectedIcon: 'text-rose-500 dark:text-rose-400',
  },
  red: {
    triggerOpen: 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-400',
    filterActive: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
    optionSelectedBg: 'bg-rose-50 dark:bg-rose-900/20',
    optionSelectedText: 'text-rose-700 dark:text-rose-300',
    optionSelectedIcon: 'text-rose-500 dark:text-rose-400',
  },
  orange: {
    triggerOpen: 'border-orange-500 ring-2 ring-orange-500/20 dark:border-orange-400',
    filterActive: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
    optionSelectedBg: 'bg-orange-50 dark:bg-orange-900/20',
    optionSelectedText: 'text-orange-700 dark:text-orange-300',
    optionSelectedIcon: 'text-orange-500 dark:text-orange-400',
  },
  amber: {
    triggerOpen: 'border-amber-500 ring-2 ring-amber-500/20 dark:border-amber-400',
    filterActive: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    optionSelectedBg: 'bg-amber-50 dark:bg-amber-900/20',
    optionSelectedText: 'text-amber-700 dark:text-amber-300',
    optionSelectedIcon: 'text-amber-500 dark:text-amber-400',
  },
  yellow: {
    triggerOpen: 'border-yellow-500 ring-2 ring-yellow-500/20 dark:border-yellow-400',
    filterActive: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400',
    optionSelectedBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    optionSelectedText: 'text-yellow-700 dark:text-yellow-300',
    optionSelectedIcon: 'text-yellow-500 dark:text-yellow-400',
  },
  lime: {
    triggerOpen: 'border-lime-500 ring-2 ring-lime-500/20 dark:border-lime-400',
    filterActive: 'bg-lime-100 text-lime-600 dark:bg-lime-900/40 dark:text-lime-400',
    optionSelectedBg: 'bg-lime-50 dark:bg-lime-900/20',
    optionSelectedText: 'text-lime-700 dark:text-lime-300',
    optionSelectedIcon: 'text-lime-500 dark:text-lime-400',
  },
  green: {
    triggerOpen: 'border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-400',
    filterActive: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    optionSelectedBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    optionSelectedText: 'text-emerald-700 dark:text-emerald-300',
    optionSelectedIcon: 'text-emerald-500 dark:text-emerald-400',
  },
  emerald: {
    triggerOpen: 'border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-400',
    filterActive: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    optionSelectedBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    optionSelectedText: 'text-emerald-700 dark:text-emerald-300',
    optionSelectedIcon: 'text-emerald-500 dark:text-emerald-400',
  },
  teal: {
    triggerOpen: 'border-teal-500 ring-2 ring-teal-500/20 dark:border-teal-400',
    filterActive: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400',
    optionSelectedBg: 'bg-teal-50 dark:bg-teal-900/20',
    optionSelectedText: 'text-teal-700 dark:text-teal-300',
    optionSelectedIcon: 'text-teal-500 dark:text-teal-400',
  },
  cyan: {
    triggerOpen: 'border-cyan-500 ring-2 ring-cyan-500/20 dark:border-cyan-400',
    filterActive: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400',
    optionSelectedBg: 'bg-cyan-50 dark:bg-cyan-900/20',
    optionSelectedText: 'text-cyan-700 dark:text-cyan-300',
    optionSelectedIcon: 'text-cyan-500 dark:text-cyan-400',
  },
  sky: {
    triggerOpen: 'border-sky-500 ring-2 ring-sky-500/20 dark:border-sky-400',
    filterActive: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
    optionSelectedBg: 'bg-sky-50 dark:bg-sky-900/20',
    optionSelectedText: 'text-sky-700 dark:text-sky-300',
    optionSelectedIcon: 'text-sky-500 dark:text-sky-400',
  },
  blue: {
    triggerOpen: 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400',
    filterActive: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    optionSelectedBg: 'bg-blue-50 dark:bg-blue-900/20',
    optionSelectedText: 'text-blue-700 dark:text-blue-300',
    optionSelectedIcon: 'text-blue-500 dark:text-blue-400',
  },
  indigo: {
    triggerOpen: 'border-indigo-500 ring-2 ring-indigo-500/20 dark:border-indigo-400',
    filterActive: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
    optionSelectedBg: 'bg-indigo-50 dark:bg-indigo-900/20',
    optionSelectedText: 'text-indigo-700 dark:text-indigo-300',
    optionSelectedIcon: 'text-indigo-500 dark:text-indigo-400',
  },
  violet: {
    triggerOpen: 'border-violet-500 ring-2 ring-violet-500/20 dark:border-violet-400',
    filterActive: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
    optionSelectedBg: 'bg-violet-50 dark:bg-violet-900/20',
    optionSelectedText: 'text-violet-700 dark:text-violet-300',
    optionSelectedIcon: 'text-violet-500 dark:text-violet-400',
  },
  purple: {
    triggerOpen: 'border-purple-500 ring-2 ring-purple-500/20 dark:border-purple-400',
    filterActive: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
    optionSelectedBg: 'bg-purple-50 dark:bg-purple-900/20',
    optionSelectedText: 'text-purple-700 dark:text-purple-300',
    optionSelectedIcon: 'text-purple-500 dark:text-purple-400',
  },
  fuchsia: {
    triggerOpen: 'border-fuchsia-500 ring-2 ring-fuchsia-500/20 dark:border-fuchsia-400',
    filterActive: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/40 dark:text-fuchsia-400',
    optionSelectedBg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
    optionSelectedText: 'text-fuchsia-700 dark:text-fuchsia-300',
    optionSelectedIcon: 'text-fuchsia-500 dark:text-fuchsia-400',
  },
  pink: {
    triggerOpen: 'border-pink-500 ring-2 ring-pink-500/20 dark:border-pink-400',
    filterActive: 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400',
    optionSelectedBg: 'bg-pink-50 dark:bg-pink-900/20',
    optionSelectedText: 'text-pink-700 dark:text-pink-300',
    optionSelectedIcon: 'text-pink-500 dark:text-pink-400',
  },
  rose: {
    triggerOpen: 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-400',
    filterActive: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
    optionSelectedBg: 'bg-rose-50 dark:bg-rose-900/20',
    optionSelectedText: 'text-rose-700 dark:text-rose-300',
    optionSelectedIcon: 'text-rose-500 dark:text-rose-400',
  },
  slate: {
    triggerOpen: 'border-slate-500 ring-2 ring-slate-500/20 dark:border-slate-400',
    filterActive: 'bg-slate-100 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400',
    optionSelectedBg: 'bg-slate-50 dark:bg-slate-900/20',
    optionSelectedText: 'text-slate-700 dark:text-slate-300',
    optionSelectedIcon: 'text-slate-500 dark:text-slate-400',
  },
  gray: {
    triggerOpen: 'border-gray-500 ring-2 ring-gray-500/20 dark:border-gray-400',
    filterActive: 'bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-400',
    optionSelectedBg: 'bg-gray-50 dark:bg-gray-900/20',
    optionSelectedText: 'text-gray-700 dark:text-gray-300',
    optionSelectedIcon: 'text-gray-500 dark:text-gray-400',
  },
  zinc: {
    triggerOpen: 'border-zinc-500 ring-2 ring-zinc-500/20 dark:border-zinc-400',
    filterActive: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400',
    optionSelectedBg: 'bg-zinc-50 dark:bg-zinc-900/20',
    optionSelectedText: 'text-zinc-700 dark:text-zinc-300',
    optionSelectedIcon: 'text-zinc-500 dark:text-zinc-400',
  },
  neutral: {
    triggerOpen: 'border-neutral-500 ring-2 ring-neutral-500/20 dark:border-neutral-400',
    filterActive: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-400',
    optionSelectedBg: 'bg-neutral-50 dark:bg-neutral-900/20',
    optionSelectedText: 'text-neutral-700 dark:text-neutral-300',
    optionSelectedIcon: 'text-neutral-500 dark:text-neutral-400',
  },
  stone: {
    triggerOpen: 'border-stone-500 ring-2 ring-stone-500/20 dark:border-stone-400',
    filterActive: 'bg-stone-100 text-stone-600 dark:bg-stone-900/40 dark:text-stone-400',
    optionSelectedBg: 'bg-stone-50 dark:bg-stone-900/20',
    optionSelectedText: 'text-stone-700 dark:text-stone-300',
    optionSelectedIcon: 'text-stone-500 dark:text-stone-400',
  },
  white: {
    triggerOpen: 'border-slate-500 ring-2 ring-slate-500/20 dark:border-slate-400',
    filterActive: 'bg-slate-100 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400',
    optionSelectedBg: 'bg-slate-50 dark:bg-slate-900/20',
    optionSelectedText: 'text-slate-700 dark:text-slate-300',
    optionSelectedIcon: 'text-slate-500 dark:text-slate-400',
  },
  info: {
    triggerOpen: 'border-sky-500 ring-2 ring-sky-500/20 dark:border-sky-400',
    filterActive: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
    optionSelectedBg: 'bg-sky-50 dark:bg-sky-900/20',
    optionSelectedText: 'text-sky-700 dark:text-sky-300',
    optionSelectedIcon: 'text-sky-500 dark:text-sky-400',
  },
  success: {
    triggerOpen: 'border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-400',
    filterActive: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    optionSelectedBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    optionSelectedText: 'text-emerald-700 dark:text-emerald-300',
    optionSelectedIcon: 'text-emerald-500 dark:text-emerald-400',
  },
  warning: {
    triggerOpen: 'border-yellow-500 ring-2 ring-yellow-500/20 dark:border-yellow-400',
    filterActive: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400',
    optionSelectedBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    optionSelectedText: 'text-yellow-700 dark:text-yellow-300',
    optionSelectedIcon: 'text-yellow-500 dark:text-yellow-400',
  },
  danger: {
    triggerOpen: 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-400',
    filterActive: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
    optionSelectedBg: 'bg-rose-50 dark:bg-rose-900/20',
    optionSelectedText: 'text-rose-700 dark:text-rose-300',
    optionSelectedIcon: 'text-rose-500 dark:text-rose-400',
  },
};

// ── Shared positioning helpers (mirrors DropdownMenu) ─────────────────────────

type RectBounds = { top: number; right: number; bottom: number; left: number; width: number; height: number };

const viewportBounds = (): RectBounds => ({
  top: 0,
  left: 0,
  right: window.innerWidth,
  bottom: window.innerHeight,
  width: window.innerWidth,
  height: window.innerHeight,
});

const isClippingParent = (el: HTMLElement): boolean => /(auto|scroll|hidden|clip)/.test([getComputedStyle(el).overflow, getComputedStyle(el).overflowX, getComputedStyle(el).overflowY].join(' '));

const resolveBoundaryBounds = (anchor: HTMLElement): RectBounds => {
  let node: HTMLElement | null = anchor.parentElement;
  while (node && node !== document.body) {
    if (isClippingParent(node)) {
      const r = node.getBoundingClientRect();
      return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    }
    node = node.parentElement;
  }
  return viewportBounds();
};

const resolveZIndex = (anchor: HTMLElement): number => {
  let node: HTMLElement | null = anchor;
  let highest: number | null = null;
  while (node && node !== document.body) {
    const z = getComputedStyle(node).zIndex;
    if (z && z !== 'auto') {
      const n = Number(z);
      if (Number.isFinite(n)) highest = highest === null ? n : Math.max(highest, n);
    }
    node = node.parentElement;
  }
  return Math.max(1, (highest ?? 20) + 1);
};

const PORTAL_ROOT = typeof document !== 'undefined' ? document.body : null;
const MAX_DROPDOWN_HEIGHT = 280;

// ── Public types ──────────────────────────────────────────────────────────────

export interface PickerTag {
  label: string;
  tone?: TreeTone;
}

export interface PickerItem {
  id: string;
  /** Optional leading icon element */
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  description?: string;
  /** Tags rendered as Pills at the trailing edge of each row */
  tags?: PickerTag[];
}

export interface PickerFilter {
  /** Label shown on the filter toggle when active (e.g. "Stopped") */
  label: string;
  /** Predicate that returns true for items included in the filtered view */
  predicate: (item: PickerItem) => boolean;
}

export interface PickerProps {
  items: PickerItem[];
  loading?: boolean;
  /** Single-select: the currently selected item id */
  selectedId?: string;
  /** Called when an item is clicked (single mode: closes dropdown; multi mode: toggles) */
  onSelect?: (item: PickerItem) => void;
  /** Placeholder shown on the trigger button when nothing is selected */
  placeholder?: string;
  /** Placeholder text inside the search input */
  searchPlaceholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  /**
   * When provided, a filter toggle is shown that restricts the list to items
   * matching the predicate. The user can toggle it off to see all items.
   */
  defaultFilter?: PickerFilter;
  /**
   * When true, the dropdown ignores any clipping ancestor (e.g. a modal's
   * overflow container) and positions itself against the viewport instead.
   * Useful when the picker is inside a constrained modal or panel.
   * Default: false
   */
  escapeBoundary?: boolean;
  className?: string;
  color?: ThemeColor;

  // ── Multi-select ────────────────────────────────────────────────────────
  /** Enable multi-select mode. Use selectedIds + onMultiChange instead of selectedId + onSelect. */
  multi?: boolean;
  /** Multi-select: the currently selected item ids */
  selectedIds?: string[];
  /** Called with the new selection array whenever the user toggles an item */
  onMultiChange?: (ids: string[]) => void;
  /** Max individual pills shown in the trigger before collapsing to "N selected". Default: 3 */
  maxPillsShown?: number;

  // ── Size ────────────────────────────────────────────────────────────────
  /** 'sm' renders a compact trigger suitable for toolbars. Default: 'md' */
  size?: 'sm' | 'md';

  /** When true, the picker fills all available horizontal space. Default: true */
  fullWidth?: boolean;
  /** When true, the picker fills all available vertical space. Default: false */
  fullHeight?: boolean;
}

// ── Picker ────────────────────────────────────────────────────────────────────

const Picker: React.FC<PickerProps> = ({
  items,
  loading = false,
  selectedId,
  onSelect,
  placeholder = 'Select an item…',
  searchPlaceholder,
  emptyMessage = 'No items found.',
  loadingMessage = 'Loading…',
  defaultFilter,
  escapeBoundary = false,
  className,
  color = 'blue',
  multi = false,
  selectedIds: selectedIdsProp,
  onMultiChange,
  maxPillsShown = 3,
  size = 'md',
  fullWidth = true,
  fullHeight = false,
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filterActive, setFilterActive] = useState(true);
  const [style, setStyle] = useState<React.CSSProperties>();
  const [computedMaxHeight, setComputedMaxHeight] = useState(MAX_DROPDOWN_HEIGHT);
  const colorTokens = toneTokens[color] ?? toneTokens.theme;

  // Normalised selection for both modes
  const effectiveSelectedIds = useMemo<string[]>(
    () => (multi ? (selectedIdsProp ?? []) : selectedId ? [selectedId] : []),
    [multi, selectedIdsProp, selectedId],
  );

  const selectedItem = useMemo(() => items.find((o) => o.id === selectedId), [items, selectedId]);

  const baseItems = useMemo(() => (filterActive && defaultFilter ? items.filter(defaultFilter.predicate) : items), [items, filterActive, defaultFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return baseItems;
    return baseItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle ?? '').toLowerCase().includes(q) ||
        (item.description ?? '').toLowerCase().includes(q) ||
        (item.tags ?? []).some((t) => t.label.toLowerCase().includes(q)),
    );
  }, [baseItems, query]);

  // ── Portal positioning ────────────────────────────────────────────────────

  const updatePosition = useCallback(() => {
    if (!open || !triggerRef.current || !dropdownRef.current) return;

    const anchorRect = triggerRef.current.getBoundingClientRect();
    const menuRect = dropdownRef.current.getBoundingClientRect();
    const boundary = escapeBoundary ? viewportBounds() : resolveBoundaryBounds(triggerRef.current);
    const zIndex = resolveZIndex(triggerRef.current);
    const offset = 4;
    const minMargin = 8;

    const computedWidth = Math.min(Math.max(anchorRect.width, menuRect.width), boundary.width - minMargin * 2);
    const computedHeight = menuRect.height;

    const belowTop = anchorRect.bottom + offset;
    const aboveTop = anchorRect.top - offset - computedHeight;

    const overflowFor = (top: number) => Math.max(0, boundary.top + minMargin - top) + Math.max(0, top + computedHeight - (boundary.bottom - minMargin));

    const isTopSide = overflowFor(aboveTop) < overflowFor(belowTop);
    const rawTop = isTopSide ? aboveTop : belowTop;
    const clampedTop = Math.min(Math.max(rawTop, boundary.top + minMargin), Math.max(boundary.top + minMargin, boundary.bottom - computedHeight - minMargin));

    const availableSpace = isTopSide ? Math.max(120, anchorRect.top - offset - (boundary.top + minMargin)) : Math.max(120, boundary.bottom - minMargin - belowTop);
    const nextMaxHeight = Math.min(MAX_DROPDOWN_HEIGHT, availableSpace);

    const startLeft = anchorRect.left;
    const clampedLeft = Math.min(Math.max(startLeft, boundary.left + minMargin), Math.max(boundary.left + minMargin, boundary.right - computedWidth - minMargin));

    setComputedMaxHeight(Math.max(120, nextMaxHeight));
    setStyle({ position: 'fixed', top: clampedTop, left: clampedLeft, width: computedWidth, zIndex });
  }, [open]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useEffect(() => {
    if (!open) {
      setStyle(undefined);
      return;
    }

    let frame = 0;
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        updatePosition();
        frame = 0;
      });
    };

    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : undefined;
    if (ro) {
      if (triggerRef.current) ro.observe(triggerRef.current);
      if (dropdownRef.current) ro.observe(dropdownRef.current);
    }
    schedule();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      ro?.disconnect();
    };
  }, [open, updatePosition]);

  // ── Click-outside & Escape ────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: MouseEvent) => {
      if (dropdownRef.current?.contains(e.target as Node) || triggerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
      setQuery('');
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  const handleSelect = (item: PickerItem) => {
    if (multi) {
      const next = effectiveSelectedIds.includes(item.id)
        ? effectiveSelectedIds.filter((id) => id !== item.id)
        : [...effectiveSelectedIds, item.id];
      onMultiChange?.(next);
      // Keep dropdown open in multi mode
    } else {
      onSelect?.(item);
      setOpen(false);
      setQuery('');
    }
  };

  const handleClearMulti = () => {
    onMultiChange?.([]);
  };

  // ── Derived search placeholder ────────────────────────────────────────────

  const resolvedSearchPlaceholder = searchPlaceholder ?? (defaultFilter ? (filterActive ? `Search ${defaultFilter.label.toLowerCase()} items…` : 'Search all items…') : 'Search…');

  // ── Dropdown portal ───────────────────────────────────────────────────────

  const dropdown =
    open && PORTAL_ROOT
      ? createPortal(
          <div
            ref={dropdownRef}
            style={style ?? { visibility: 'hidden' }}
            className={classNames(
              'fixed overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-neutral-700 dark:bg-neutral-900',
              !style && 'invisible opacity-0',
            )}
          >
            {/* Search + filter row */}
            <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
              <svg className="h-4 w-4 shrink-0 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && (setOpen(false), setQuery(''))}
                placeholder={resolvedSearchPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-200 dark:placeholder:text-neutral-500"
              />
              {query && (
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setQuery('')} className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
              {defaultFilter && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setFilterActive((v) => !v)}
                  className={classNames(
                    'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                    filterActive ? colorTokens.filterActive : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400',
                  )}
                >
                  {filterActive ? defaultFilter.label : 'All'}
                </button>
              )}
            </div>

            {/* Option list */}
            <ul className="divide-y divide-neutral-50 overflow-y-auto dark:divide-neutral-800/60" style={{ maxHeight: computedMaxHeight }}>
              {/* Multi-select clear row */}
              {multi && effectiveSelectedIds.length > 0 && (
                <li
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleClearMulti}
                  className="flex cursor-pointer select-none items-center justify-between px-4 py-1.5 text-xs text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-800"
                >
                  <span>{effectiveSelectedIds.length} selected</span>
                  <span className="text-rose-500 dark:text-rose-400 hover:underline">Clear</span>
                </li>
              )}
              {filtered.length === 0 ? (
                <li className="px-4 py-5 text-center text-sm text-neutral-400 dark:text-neutral-500">{baseItems.length === 0 ? emptyMessage : 'No items match your search.'}</li>
              ) : (
                filtered.map((item) => {
                  const isSelected = effectiveSelectedIds.includes(item.id);
                  return (
                    <li
                      key={item.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(item)}
                      className={classNames(
                        'flex cursor-pointer select-none items-center gap-3 px-4 py-2.5 transition-colors',
                        isSelected ? colorTokens.optionSelectedBg : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60',
                      )}
                    >
                      {/* Multi: always show checkbox. Single: only show checkmark for selected item. */}
                      {multi ? (
                        <span className={classNames(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                          isSelected
                            ? classNames(colorTokens.optionSelectedBg, 'border-current', colorTokens.optionSelectedIcon)
                            : 'border-neutral-300 dark:border-neutral-600',
                        )}>
                          {isSelected && (
                            <svg className={classNames('h-3.5 w-3.5', colorTokens.optionSelectedIcon)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                            </svg>
                          )}
                        </span>
                      ) : isSelected ? (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                          <svg className={classNames('h-3.5 w-3.5', colorTokens.optionSelectedIcon)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                          </svg>
                        </span>
                      ) : null}

                      {/* Icon */}
                      {item.icon && <span className={classNames('shrink-0', isSelected ? colorTokens.optionSelectedIcon : 'text-neutral-400 dark:text-neutral-500')}>{item.icon}</span>}

                      {/* Title + subtitle + description */}
                      <div className="min-w-0 flex-1">
                        <p className={classNames('truncate text-sm font-medium', isSelected ? colorTokens.optionSelectedText : 'text-neutral-800 dark:text-neutral-200')}>{item.title}</p>
                        {item.subtitle && <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">{item.subtitle}</p>}
                        {item.description && <p className="truncate text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{item.description}</p>}
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex shrink-0 flex-wrap gap-1">
                          {item.tags.map((tag, ti) => (
                            <Pill key={ti} size="sm" tone={tag.tone ?? 'neutral'} variant="soft">
                              {tag.label}
                            </Pill>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          PORTAL_ROOT,
        )
      : null;

  // ── Size tokens ───────────────────────────────────────────────────────────

  const sm = size === 'sm';
  const triggerPadding = sm ? 'px-2 py-1' : 'px-3 py-2.5';
  const triggerText = sm ? 'text-xs' : 'text-sm';
  const triggerGap = sm ? 'gap-1.5' : 'gap-3';
  const triggerRadius = 'rounded-lg';
  const chevronSize = sm ? 'h-3 w-3' : 'h-4 w-4';

  // ── Multi trigger content ─────────────────────────────────────────────────

  const multiTriggerContent = multi ? (() => {
    if (effectiveSelectedIds.length === 0) {
      return <span className={classNames('flex-1', triggerText, 'text-neutral-400 dark:text-neutral-500')}>{placeholder}</span>;
    }
    const visibleIds = effectiveSelectedIds.slice(0, maxPillsShown);
    const overflow = effectiveSelectedIds.length - visibleIds.length;
    return (
      <div className="flex flex-1 min-w-0 flex-wrap gap-1">
        {visibleIds.map((id) => {
          const it = items.find((o) => o.id === id);
          if (!it) return null;
          return (
            <span
              key={id}
              className={classNames(
                'inline-flex items-center rounded px-1.5 py-0.5 font-medium leading-none',
                sm ? 'text-[10px]' : 'text-xs',
                colorTokens.filterActive,
              )}
            >
              {it.title}
            </span>
          );
        })}
        {overflow > 0 && (
          <span className={classNames(
            'inline-flex items-center rounded px-1.5 py-0.5 font-medium leading-none',
            sm ? 'text-[10px]' : 'text-xs',
            'bg-neutral-100 text-neutral-500 dark:bg-neutral-700/50 dark:text-neutral-400',
          )}>
            +{overflow}
          </span>
        )}
      </div>
    );
  })() : null;

  // ── Trigger button ────────────────────────────────────────────────────────

  return (
    <div className={classNames(fullWidth ? 'w-full' : 'w-fit', fullHeight && 'h-full')}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={classNames(
          'flex w-full items-center border text-left transition-colors bg-white dark:bg-neutral-900',
          fullHeight && 'h-full',
          triggerPadding, triggerText, triggerGap, triggerRadius,
          open ? colorTokens.triggerOpen : 'border-neutral-300 hover:border-neutral-400 dark:border-neutral-600 dark:hover:border-neutral-500',
          className,
        )}
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin shrink-0 text-neutral-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className={classNames(triggerText, 'text-neutral-400')}>{loadingMessage}</span>
          </>
        ) : multi ? (
          multiTriggerContent
        ) : selectedItem ? (
          <>
            {selectedItem.icon && <span className="shrink-0 text-neutral-500 dark:text-neutral-400">{selectedItem.icon}</span>}
            <div className="min-w-0 flex-1">
              <span className={classNames('block truncate font-medium text-neutral-800 dark:text-neutral-100', triggerText)}>{selectedItem.title}</span>
              {selectedItem.subtitle && <span className="block truncate text-xs text-neutral-400 dark:text-neutral-500">{selectedItem.subtitle}</span>}
            </div>
            {selectedItem.tags && selectedItem.tags.length > 0 && (
              <div className="flex shrink-0 flex-wrap gap-1">
                {selectedItem.tags.map((tag, ti) => (
                  <Pill key={ti} size="sm" tone={tag.tone ?? 'neutral'} variant="soft">
                    {tag.label}
                  </Pill>
                ))}
              </div>
            )}
          </>
        ) : (
          <span className={classNames('flex-1', triggerText, 'text-neutral-400 dark:text-neutral-500')}>{placeholder}</span>
        )}

        {/* Chevron */}
        <svg className={classNames(chevronSize, 'shrink-0 text-neutral-400 transition-transform', open && 'rotate-180')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {dropdown}
    </div>
  );
};

Picker.displayName = 'Picker';

export { Picker };
export default Picker;
