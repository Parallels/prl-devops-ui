import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import Pill from './Pill';
import { type ThemeColor } from '../theme/Theme';
import type { PickerTag } from './Picker';

// ── Tone tokens (mirrors Picker) ──────────────────────────────────────────────

const toneTokens: Record<
  ThemeColor,
  {
    triggerOpen: string;
    optionSelectedBg: string;
    optionSelectedText: string;
    optionSelectedIcon: string;
    focusedBg: string;
    createRowIcon: string;
    createRowLabel: string;
  }
> = {
  parallels: {
    triggerOpen: 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-400',
    optionSelectedBg: 'bg-rose-50 dark:bg-rose-900/20',
    optionSelectedText: 'text-rose-700 dark:text-rose-300',
    optionSelectedIcon: 'text-rose-500 dark:text-rose-400',
    focusedBg: 'bg-rose-50/60 dark:bg-rose-900/10',
    createRowIcon: 'text-rose-500 dark:text-rose-400',
    createRowLabel: 'text-rose-700 dark:text-rose-300',
  },
  brand: {
    triggerOpen: 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-400',
    optionSelectedBg: 'bg-rose-50 dark:bg-rose-900/20',
    optionSelectedText: 'text-rose-700 dark:text-rose-300',
    optionSelectedIcon: 'text-rose-500 dark:text-rose-400',
    focusedBg: 'bg-rose-50/60 dark:bg-rose-900/10',
    createRowIcon: 'text-rose-500 dark:text-rose-400',
    createRowLabel: 'text-rose-700 dark:text-rose-300',
  },
  theme: {
    triggerOpen: 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-400',
    optionSelectedBg: 'bg-rose-50 dark:bg-rose-900/20',
    optionSelectedText: 'text-rose-700 dark:text-rose-300',
    optionSelectedIcon: 'text-rose-500 dark:text-rose-400',
    focusedBg: 'bg-rose-50/60 dark:bg-rose-900/10',
    createRowIcon: 'text-rose-500 dark:text-rose-400',
    createRowLabel: 'text-rose-700 dark:text-rose-300',
  },
  red: {
    triggerOpen: 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-400',
    optionSelectedBg: 'bg-rose-50 dark:bg-rose-900/20',
    optionSelectedText: 'text-rose-700 dark:text-rose-300',
    optionSelectedIcon: 'text-rose-500 dark:text-rose-400',
    focusedBg: 'bg-rose-50/60 dark:bg-rose-900/10',
    createRowIcon: 'text-rose-500 dark:text-rose-400',
    createRowLabel: 'text-rose-700 dark:text-rose-300',
  },
  orange: {
    triggerOpen: 'border-orange-500 ring-2 ring-orange-500/20 dark:border-orange-400',
    optionSelectedBg: 'bg-orange-50 dark:bg-orange-900/20',
    optionSelectedText: 'text-orange-700 dark:text-orange-300',
    optionSelectedIcon: 'text-orange-500 dark:text-orange-400',
    focusedBg: 'bg-orange-50/60 dark:bg-orange-900/10',
    createRowIcon: 'text-orange-500 dark:text-orange-400',
    createRowLabel: 'text-orange-700 dark:text-orange-300',
  },
  amber: {
    triggerOpen: 'border-amber-500 ring-2 ring-amber-500/20 dark:border-amber-400',
    optionSelectedBg: 'bg-amber-50 dark:bg-amber-900/20',
    optionSelectedText: 'text-amber-700 dark:text-amber-300',
    optionSelectedIcon: 'text-amber-500 dark:text-amber-400',
    focusedBg: 'bg-amber-50/60 dark:bg-amber-900/10',
    createRowIcon: 'text-amber-500 dark:text-amber-400',
    createRowLabel: 'text-amber-700 dark:text-amber-300',
  },
  yellow: {
    triggerOpen: 'border-yellow-500 ring-2 ring-yellow-500/20 dark:border-yellow-400',
    optionSelectedBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    optionSelectedText: 'text-yellow-700 dark:text-yellow-300',
    optionSelectedIcon: 'text-yellow-500 dark:text-yellow-400',
    focusedBg: 'bg-yellow-50/60 dark:bg-yellow-900/10',
    createRowIcon: 'text-yellow-500 dark:text-yellow-400',
    createRowLabel: 'text-yellow-700 dark:text-yellow-300',
  },
  lime: {
    triggerOpen: 'border-lime-500 ring-2 ring-lime-500/20 dark:border-lime-400',
    optionSelectedBg: 'bg-lime-50 dark:bg-lime-900/20',
    optionSelectedText: 'text-lime-700 dark:text-lime-300',
    optionSelectedIcon: 'text-lime-500 dark:text-lime-400',
    focusedBg: 'bg-lime-50/60 dark:bg-lime-900/10',
    createRowIcon: 'text-lime-500 dark:text-lime-400',
    createRowLabel: 'text-lime-700 dark:text-lime-300',
  },
  green: {
    triggerOpen: 'border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-400',
    optionSelectedBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    optionSelectedText: 'text-emerald-700 dark:text-emerald-300',
    optionSelectedIcon: 'text-emerald-500 dark:text-emerald-400',
    focusedBg: 'bg-emerald-50/60 dark:bg-emerald-900/10',
    createRowIcon: 'text-emerald-500 dark:text-emerald-400',
    createRowLabel: 'text-emerald-700 dark:text-emerald-300',
  },
  emerald: {
    triggerOpen: 'border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-400',
    optionSelectedBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    optionSelectedText: 'text-emerald-700 dark:text-emerald-300',
    optionSelectedIcon: 'text-emerald-500 dark:text-emerald-400',
    focusedBg: 'bg-emerald-50/60 dark:bg-emerald-900/10',
    createRowIcon: 'text-emerald-500 dark:text-emerald-400',
    createRowLabel: 'text-emerald-700 dark:text-emerald-300',
  },
  teal: {
    triggerOpen: 'border-teal-500 ring-2 ring-teal-500/20 dark:border-teal-400',
    optionSelectedBg: 'bg-teal-50 dark:bg-teal-900/20',
    optionSelectedText: 'text-teal-700 dark:text-teal-300',
    optionSelectedIcon: 'text-teal-500 dark:text-teal-400',
    focusedBg: 'bg-teal-50/60 dark:bg-teal-900/10',
    createRowIcon: 'text-teal-500 dark:text-teal-400',
    createRowLabel: 'text-teal-700 dark:text-teal-300',
  },
  cyan: {
    triggerOpen: 'border-cyan-500 ring-2 ring-cyan-500/20 dark:border-cyan-400',
    optionSelectedBg: 'bg-cyan-50 dark:bg-cyan-900/20',
    optionSelectedText: 'text-cyan-700 dark:text-cyan-300',
    optionSelectedIcon: 'text-cyan-500 dark:text-cyan-400',
    focusedBg: 'bg-cyan-50/60 dark:bg-cyan-900/10',
    createRowIcon: 'text-cyan-500 dark:text-cyan-400',
    createRowLabel: 'text-cyan-700 dark:text-cyan-300',
  },
  sky: {
    triggerOpen: 'border-sky-500 ring-2 ring-sky-500/20 dark:border-sky-400',
    optionSelectedBg: 'bg-sky-50 dark:bg-sky-900/20',
    optionSelectedText: 'text-sky-700 dark:text-sky-300',
    optionSelectedIcon: 'text-sky-500 dark:text-sky-400',
    focusedBg: 'bg-sky-50/60 dark:bg-sky-900/10',
    createRowIcon: 'text-sky-500 dark:text-sky-400',
    createRowLabel: 'text-sky-700 dark:text-sky-300',
  },
  blue: {
    triggerOpen: 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400',
    optionSelectedBg: 'bg-blue-50 dark:bg-blue-900/20',
    optionSelectedText: 'text-blue-700 dark:text-blue-300',
    optionSelectedIcon: 'text-blue-500 dark:text-blue-400',
    focusedBg: 'bg-blue-50/60 dark:bg-blue-900/10',
    createRowIcon: 'text-blue-500 dark:text-blue-400',
    createRowLabel: 'text-blue-700 dark:text-blue-300',
  },
  indigo: {
    triggerOpen: 'border-indigo-500 ring-2 ring-indigo-500/20 dark:border-indigo-400',
    optionSelectedBg: 'bg-indigo-50 dark:bg-indigo-900/20',
    optionSelectedText: 'text-indigo-700 dark:text-indigo-300',
    optionSelectedIcon: 'text-indigo-500 dark:text-indigo-400',
    focusedBg: 'bg-indigo-50/60 dark:bg-indigo-900/10',
    createRowIcon: 'text-indigo-500 dark:text-indigo-400',
    createRowLabel: 'text-indigo-700 dark:text-indigo-300',
  },
  violet: {
    triggerOpen: 'border-violet-500 ring-2 ring-violet-500/20 dark:border-violet-400',
    optionSelectedBg: 'bg-violet-50 dark:bg-violet-900/20',
    optionSelectedText: 'text-violet-700 dark:text-violet-300',
    optionSelectedIcon: 'text-violet-500 dark:text-violet-400',
    focusedBg: 'bg-violet-50/60 dark:bg-violet-900/10',
    createRowIcon: 'text-violet-500 dark:text-violet-400',
    createRowLabel: 'text-violet-700 dark:text-violet-300',
  },
  purple: {
    triggerOpen: 'border-purple-500 ring-2 ring-purple-500/20 dark:border-purple-400',
    optionSelectedBg: 'bg-purple-50 dark:bg-purple-900/20',
    optionSelectedText: 'text-purple-700 dark:text-purple-300',
    optionSelectedIcon: 'text-purple-500 dark:text-purple-400',
    focusedBg: 'bg-purple-50/60 dark:bg-purple-900/10',
    createRowIcon: 'text-purple-500 dark:text-purple-400',
    createRowLabel: 'text-purple-700 dark:text-purple-300',
  },
  fuchsia: {
    triggerOpen: 'border-fuchsia-500 ring-2 ring-fuchsia-500/20 dark:border-fuchsia-400',
    optionSelectedBg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
    optionSelectedText: 'text-fuchsia-700 dark:text-fuchsia-300',
    optionSelectedIcon: 'text-fuchsia-500 dark:text-fuchsia-400',
    focusedBg: 'bg-fuchsia-50/60 dark:bg-fuchsia-900/10',
    createRowIcon: 'text-fuchsia-500 dark:text-fuchsia-400',
    createRowLabel: 'text-fuchsia-700 dark:text-fuchsia-300',
  },
  pink: {
    triggerOpen: 'border-pink-500 ring-2 ring-pink-500/20 dark:border-pink-400',
    optionSelectedBg: 'bg-pink-50 dark:bg-pink-900/20',
    optionSelectedText: 'text-pink-700 dark:text-pink-300',
    optionSelectedIcon: 'text-pink-500 dark:text-pink-400',
    focusedBg: 'bg-pink-50/60 dark:bg-pink-900/10',
    createRowIcon: 'text-pink-500 dark:text-pink-400',
    createRowLabel: 'text-pink-700 dark:text-pink-300',
  },
  rose: {
    triggerOpen: 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-400',
    optionSelectedBg: 'bg-rose-50 dark:bg-rose-900/20',
    optionSelectedText: 'text-rose-700 dark:text-rose-300',
    optionSelectedIcon: 'text-rose-500 dark:text-rose-400',
    focusedBg: 'bg-rose-50/60 dark:bg-rose-900/10',
    createRowIcon: 'text-rose-500 dark:text-rose-400',
    createRowLabel: 'text-rose-700 dark:text-rose-300',
  },
  slate: {
    triggerOpen: 'border-slate-500 ring-2 ring-slate-500/20 dark:border-slate-400',
    optionSelectedBg: 'bg-slate-50 dark:bg-slate-900/20',
    optionSelectedText: 'text-slate-700 dark:text-slate-300',
    optionSelectedIcon: 'text-slate-500 dark:text-slate-400',
    focusedBg: 'bg-slate-50/60 dark:bg-slate-900/10',
    createRowIcon: 'text-slate-500 dark:text-slate-400',
    createRowLabel: 'text-slate-700 dark:text-slate-300',
  },
  gray: {
    triggerOpen: 'border-gray-500 ring-2 ring-gray-500/20 dark:border-gray-400',
    optionSelectedBg: 'bg-gray-50 dark:bg-gray-900/20',
    optionSelectedText: 'text-gray-700 dark:text-gray-300',
    optionSelectedIcon: 'text-gray-500 dark:text-gray-400',
    focusedBg: 'bg-gray-50/60 dark:bg-gray-900/10',
    createRowIcon: 'text-gray-500 dark:text-gray-400',
    createRowLabel: 'text-gray-700 dark:text-gray-300',
  },
  zinc: {
    triggerOpen: 'border-zinc-500 ring-2 ring-zinc-500/20 dark:border-zinc-400',
    optionSelectedBg: 'bg-zinc-50 dark:bg-zinc-900/20',
    optionSelectedText: 'text-zinc-700 dark:text-zinc-300',
    optionSelectedIcon: 'text-zinc-500 dark:text-zinc-400',
    focusedBg: 'bg-zinc-50/60 dark:bg-zinc-900/10',
    createRowIcon: 'text-zinc-500 dark:text-zinc-400',
    createRowLabel: 'text-zinc-700 dark:text-zinc-300',
  },
  neutral: {
    triggerOpen: 'border-neutral-500 ring-2 ring-neutral-500/20 dark:border-neutral-400',
    optionSelectedBg: 'bg-neutral-100 dark:bg-neutral-800',
    optionSelectedText: 'text-neutral-700 dark:text-neutral-300',
    optionSelectedIcon: 'text-neutral-500 dark:text-neutral-400',
    focusedBg: 'bg-neutral-50 dark:bg-neutral-800/60',
    createRowIcon: 'text-neutral-500 dark:text-neutral-400',
    createRowLabel: 'text-neutral-700 dark:text-neutral-300',
  },
  stone: {
    triggerOpen: 'border-stone-500 ring-2 ring-stone-500/20 dark:border-stone-400',
    optionSelectedBg: 'bg-stone-50 dark:bg-stone-900/20',
    optionSelectedText: 'text-stone-700 dark:text-stone-300',
    optionSelectedIcon: 'text-stone-500 dark:text-stone-400',
    focusedBg: 'bg-stone-50/60 dark:bg-stone-900/10',
    createRowIcon: 'text-stone-500 dark:text-stone-400',
    createRowLabel: 'text-stone-700 dark:text-stone-300',
  },
  white: {
    triggerOpen: 'border-slate-500 ring-2 ring-slate-500/20 dark:border-slate-400',
    optionSelectedBg: 'bg-slate-50 dark:bg-slate-900/20',
    optionSelectedText: 'text-slate-700 dark:text-slate-300',
    optionSelectedIcon: 'text-slate-500 dark:text-slate-400',
    focusedBg: 'bg-slate-50/60 dark:bg-slate-900/10',
    createRowIcon: 'text-slate-500 dark:text-slate-400',
    createRowLabel: 'text-slate-700 dark:text-slate-300',
  },
  info: {
    triggerOpen: 'border-sky-500 ring-2 ring-sky-500/20 dark:border-sky-400',
    optionSelectedBg: 'bg-sky-50 dark:bg-sky-900/20',
    optionSelectedText: 'text-sky-700 dark:text-sky-300',
    optionSelectedIcon: 'text-sky-500 dark:text-sky-400',
    focusedBg: 'bg-sky-50/60 dark:bg-sky-900/10',
    createRowIcon: 'text-sky-500 dark:text-sky-400',
    createRowLabel: 'text-sky-700 dark:text-sky-300',
  },
  success: {
    triggerOpen: 'border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-400',
    optionSelectedBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    optionSelectedText: 'text-emerald-700 dark:text-emerald-300',
    optionSelectedIcon: 'text-emerald-500 dark:text-emerald-400',
    focusedBg: 'bg-emerald-50/60 dark:bg-emerald-900/10',
    createRowIcon: 'text-emerald-500 dark:text-emerald-400',
    createRowLabel: 'text-emerald-700 dark:text-emerald-300',
  },
  warning: {
    triggerOpen: 'border-yellow-500 ring-2 ring-yellow-500/20 dark:border-yellow-400',
    optionSelectedBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    optionSelectedText: 'text-yellow-700 dark:text-yellow-300',
    optionSelectedIcon: 'text-yellow-500 dark:text-yellow-400',
    focusedBg: 'bg-yellow-50/60 dark:bg-yellow-900/10',
    createRowIcon: 'text-yellow-500 dark:text-yellow-400',
    createRowLabel: 'text-yellow-700 dark:text-yellow-300',
  },
  danger: {
    triggerOpen: 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-400',
    optionSelectedBg: 'bg-rose-50 dark:bg-rose-900/20',
    optionSelectedText: 'text-rose-700 dark:text-rose-300',
    optionSelectedIcon: 'text-rose-500 dark:text-rose-400',
    focusedBg: 'bg-rose-50/60 dark:bg-rose-900/10',
    createRowIcon: 'text-rose-500 dark:text-rose-400',
    createRowLabel: 'text-rose-700 dark:text-rose-300',
  },
};

// ── Shared positioning helpers (mirrors Picker) ───────────────────────────────

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

/** A known option in the dropdown list */
export interface TagPickerItem {
  id: string;
  label: string;
  /** Optional leading icon */
  icon?: React.ReactNode;
  /** Optional Pills rendered at the trailing edge of each row */
  tags?: PickerTag[];
}

export interface TagPickerProps {
  /** Known options shown in the dropdown */
  items: TagPickerItem[];
  /**
   * Controlled array of selected values.
   * For known items this is the item's `id`.
   * For free-text entries created via `allowCreate`, this is the raw text itself.
   */
  value: string[];
  onChange: (values: string[]) => void;
  /**
   * Show a "Create '…'" row when the search query doesn't match any existing item.
   * Default: false
   */
  allowCreate?: boolean;
  /**
   * Called when the user confirms a new free-text value.
   * If omitted, the raw text is added to value[] directly via onChange.
   */
  onCreateItem?: (label: string) => void;
  /**
   * When false, behaves as single-select: picking a new item replaces the current value.
   * Default: true (multi-select with tag pills)
   */
  multi?: boolean;
  /** Placeholder shown in the trigger when nothing is selected */
  placeholder?: string;
  /** Placeholder inside the search input */
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  loadingMessage?: string;
  color?: ThemeColor;
  itemColor?: ThemeColor;
  /**
   * When true, the dropdown positions against the viewport instead of a clipping ancestor.
   * Useful when the component is inside a modal or constrained panel.
   * Default: false
   */
  escapeBoundary?: boolean;
  /**
   * Maximum number of tag pills shown before a "+N" overflow pill appears.
   * Set to 0 or undefined to show all tags. Default: 3
   */
  tagLimit?: number;
  /**
   * When true, items added during this session (not present in the initial value)
   * are highlighted with an emerald color cue — both in the trigger pills and in
   * the dropdown list. Default: true
   */
  highlightNew?: boolean;
  className?: string;
  disabled?: boolean;
}

// ── TagPicker ─────────────────────────────────────────────────────────────────

const TagPicker: React.FC<TagPickerProps> = ({
  items,
  value,
  onChange,
  allowCreate = false,
  onCreateItem,
  multi = true,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No items found.',
  loading = false,
  loadingMessage = 'Loading…',
  color = 'blue',
  itemColor = null,
  escapeBoundary = false,
  tagLimit = 3,
  highlightNew = true,
  className,
  disabled = false,
}) => {
  const uid = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [style, setStyle] = useState<React.CSSProperties>();
  const [computedMaxHeight, setComputedMaxHeight] = useState(MAX_DROPDOWN_HEIGHT);
  const [showAllTags, setShowAllTags] = useState(false);

  const colorTokens = toneTokens[color] ?? toneTokens.blue;
  if (!itemColor) {
    itemColor = color;
  }

  // ── Session-new tracking ───────────────────────────────────────────────────

  const initialValueRef = useRef<Set<string>>(new Set(value));

  const sessionAddedSet = useMemo(
    () => (highlightNew ? new Set(value.filter((v) => !initialValueRef.current.has(v))) : new Set<string>()),
    [value, highlightNew],
  );

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedSet = useMemo(() => new Set(value), [value]);

  const labelFor = useCallback((v: string): string => items.find((i) => i.id === v)?.label ?? v, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q) || (item.tags ?? []).some((t) => t.label.toLowerCase().includes(q)));
  }, [items, query]);

  const showCreate = useMemo(() => {
    if (!allowCreate || !query.trim()) return false;
    const q = query.trim().toLowerCase();
    return !items.some((item) => item.label.toLowerCase() === q) && !value.includes(query.trim());
  }, [allowCreate, query, items, value]);

  const maxFocusIndex = filtered.length - 1 + (showCreate ? 1 : 0);

  // ── Portal positioning (mirrors Picker) ────────────────────────────────────

  const updatePosition = useCallback(() => {
    if (!open || !triggerRef.current || !dropdownRef.current) return;

    const anchorRect = triggerRef.current.getBoundingClientRect();
    const menuRect = dropdownRef.current.getBoundingClientRect();
    const boundary = escapeBoundary ? viewportBounds() : resolveBoundaryBounds(triggerRef.current);
    const zIndex = resolveZIndex(triggerRef.current);
    const offset = 4;
    const minMargin = 8;

    // The dropdown is portaled to document.body, so it is never clipped by an
    // intermediate scroll ancestor. Use the viewport for all vertical decisions
    // (flip direction + clamping). Use the boundary only for horizontal alignment.
    const vp = viewportBounds();

    const computedWidth = Math.min(Math.max(anchorRect.width, menuRect.width), Math.min(boundary.width, vp.width) - minMargin * 2);
    // When the menu hasn't rendered yet its height is 0; assume max height so the
    // flip decision is made conservatively (prefers opening above when space is tight).
    const computedHeight = menuRect.height || MAX_DROPDOWN_HEIGHT;

    const belowTop = anchorRect.bottom + offset;
    const aboveTop = anchorRect.top - offset - computedHeight;

    const overflowFor = (top: number) => Math.max(0, vp.top + minMargin - top) + Math.max(0, top + computedHeight - (vp.bottom - minMargin));

    const isTopSide = overflowFor(aboveTop) < overflowFor(belowTop);
    const rawTop = isTopSide ? aboveTop : belowTop;
    const clampedTop = Math.min(Math.max(rawTop, vp.top + minMargin), Math.max(vp.top + minMargin, vp.bottom - computedHeight - minMargin));

    const availableSpace = isTopSide ? Math.max(120, anchorRect.top - offset - (vp.top + minMargin)) : Math.max(120, vp.bottom - minMargin - belowTop);

    const startLeft = anchorRect.left;
    const clampedLeft = Math.min(Math.max(startLeft, boundary.left + minMargin), Math.max(boundary.left + minMargin, boundary.right - computedWidth - minMargin));

    setComputedMaxHeight(Math.max(120, Math.min(MAX_DROPDOWN_HEIGHT, availableSpace)));
    setStyle({ position: 'fixed', top: clampedTop, left: clampedLeft, width: computedWidth, zIndex });
  }, [open, escapeBoundary]);

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

  // ── Click-outside & Escape ─────────────────────────────────────────────────

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

  useEffect(() => {
    setFocusedIndex(-1);
  }, [query]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleToggle = useCallback(
    (item: TagPickerItem) => {
      if (!multi) {
        onChange([item.id]);
        setOpen(false);
        setQuery('');
        return;
      }
      if (selectedSet.has(item.id)) {
        onChange(value.filter((v) => v !== item.id));
      } else {
        onChange([...value, item.id]);
      }
    },
    [multi, onChange, selectedSet, value],
  );

  const handleRemove = useCallback((v: string) => onChange(value.filter((x) => x !== v)), [onChange, value]);

  const handleCreate = useCallback(() => {
    const label = query.trim();
    if (!label) return;
    if (onCreateItem) {
      onCreateItem(label);
    } else if (!multi) {
      onChange([label]);
      setOpen(false);
    } else {
      onChange([...value, label]);
    }
    setQuery('');
  }, [query, onCreateItem, multi, onChange, value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, maxFocusIndex));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filtered.length) {
        handleToggle(filtered[focusedIndex]);
      } else if (showCreate && focusedIndex === filtered.length) {
        handleCreate();
      } else if (query.trim()) {
        if (filtered.length > 0) handleToggle(filtered[0]);
        else if (showCreate) handleCreate();
      }
    } else if (e.key === 'Backspace' && !query && value.length > 0 && multi) {
      onChange(value.slice(0, -1));
    }
  };

  // ── Dropdown portal ────────────────────────────────────────────────────────

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
            {/* Search row */}
            <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
              <svg className="h-4 w-4 shrink-0 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={searchRef}
                id={`${uid}-search`}
                role="combobox"
                aria-expanded={open}
                aria-controls={`${uid}-listbox`}
                aria-autocomplete="list"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-200 dark:placeholder:text-neutral-500"
              />
              {query && (
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setQuery('')} className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Option list */}
            <ul
              id={`${uid}-listbox`}
              role="listbox"
              aria-multiselectable={multi}
              className="overflow-y-auto divide-y divide-neutral-50 dark:divide-neutral-800/60"
              style={{ maxHeight: computedMaxHeight }}
            >
              {loading ? (
                <li className="flex items-center justify-center gap-2 px-4 py-5 text-sm text-neutral-400 dark:text-neutral-500">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {loadingMessage}
                </li>
              ) : filtered.length === 0 && !showCreate ? (
                <li className="px-4 py-5 text-center text-sm text-neutral-400 dark:text-neutral-500">{items.length === 0 ? emptyMessage : 'No items match your search.'}</li>
              ) : (
                filtered.map((item, index) => {
                  const isSelected = selectedSet.has(item.id);
                  const isFocused = index === focusedIndex;
                  const isNew = sessionAddedSet.has(item.id);
                  return (
                    <li
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setFocusedIndex(index)}
                      onClick={() => handleToggle(item)}
                      className={classNames(
                        'flex cursor-pointer select-none items-center gap-3 px-4 py-2.5 transition-colors',
                        isSelected ? (isNew ? 'bg-emerald-50 dark:bg-emerald-900/20' : colorTokens.optionSelectedBg) : isFocused ? colorTokens.focusedBg : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60',
                      )}
                    >
                      {/* Checkmark slot */}
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {isSelected && (
                          <svg className={classNames('h-3.5 w-3.5', isNew ? 'text-emerald-500 dark:text-emerald-400' : colorTokens.optionSelectedIcon)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                          </svg>
                        )}
                      </span>

                      {/* Icon */}
                      {item.icon && <span className={classNames('shrink-0', isSelected ? (isNew ? 'text-emerald-500 dark:text-emerald-400' : colorTokens.optionSelectedIcon) : 'text-neutral-400 dark:text-neutral-500')}>{item.icon}</span>}

                      {/* Label */}
                      <span className={classNames('min-w-0 flex-1 truncate text-sm font-medium', isSelected ? (isNew ? 'text-emerald-700 dark:text-emerald-300' : colorTokens.optionSelectedText) : 'text-neutral-800 dark:text-neutral-200')}>
                        {item.label}
                      </span>

                      {/* New badge */}
                      {isNew && (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                          new
                        </span>
                      )}

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

              {/* Create row */}
              {showCreate && (
                <li
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setFocusedIndex(filtered.length)}
                  onClick={handleCreate}
                  className={classNames(
                    'flex cursor-pointer select-none items-center gap-2 border-t border-neutral-100 px-4 py-2.5 text-sm transition-colors dark:border-neutral-700/60',
                    focusedIndex === filtered.length ? colorTokens.focusedBg : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60',
                  )}
                >
                  <svg className={classNames('h-3.5 w-3.5 shrink-0', colorTokens.createRowIcon)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Create{' '}
                    <span className={classNames('font-medium', colorTokens.createRowLabel)} title={query.trim()}>
                      &ldquo;{query.trim()}&rdquo;
                    </span>
                  </span>
                </li>
              )}
            </ul>
          </div>,
          PORTAL_ROOT,
        )
      : null;

  // ── Trigger ────────────────────────────────────────────────────────────────

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${uid}-listbox` : undefined}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        className={classNames(
          'flex w-full min-h-10.5 flex-wrap items-start gap-1.5 rounded-lg border px-3 py-2 text-left transition-colors',
          'bg-white dark:bg-neutral-900',
          open ? colorTokens.triggerOpen : 'border-neutral-300 hover:border-neutral-400 dark:border-neutral-600 dark:hover:border-neutral-500',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin shrink-0 text-neutral-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-neutral-400">{loadingMessage}</span>
          </>
        ) : value.length > 0 ? (
          <span className="flex flex-1 flex-wrap items-center gap-1.5">
            {(multi && tagLimit > 0 && !showAllTags ? value.slice(0, tagLimit) : value).map((v) => (
              <span key={v} className="inline-flex items-center">
                <Pill size="sm" tone={sessionAddedSet.has(v) ? 'emerald' : (itemColor ?? color)} variant="soft">
                  {labelFor(v)}
                </Pill>
                {multi && (
                  <button
                    type="button"
                    aria-label={`Remove ${labelFor(v)}`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(v);
                    }}
                    className="-ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-2.5 w-2.5">
                      <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </span>
            ))}
            {multi && tagLimit > 0 && value.length > tagLimit && !showAllTags && (
              <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e) => { e.stopPropagation(); setShowAllTags(true); }}
                className="inline-flex"
                aria-label={`Show ${value.length - tagLimit} more tags`}
              >
                <Pill size="sm" tone="neutral" variant="soft">
                  +{value.length - tagLimit}
                </Pill>
              </button>
            )}
            {multi && tagLimit > 0 && showAllTags && value.length > tagLimit && (
              <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e) => { e.stopPropagation(); setShowAllTags(false); }}
                className="text-xs text-neutral-400 underline-offset-2 hover:underline dark:text-neutral-500"
              >
                Show less
              </button>
            )}
          </span>
        ) : (
          <span className="flex-1 text-sm text-neutral-400 dark:text-neutral-500">{placeholder}</span>
        )}

        {/* Chevron */}
        <svg className={classNames('ml-auto mt-1 h-4 w-4 shrink-0 self-start text-neutral-400 transition-transform', open && 'rotate-180')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {dropdown}
    </>
  );
};

TagPicker.displayName = 'TagPicker';

export { TagPicker };
export default TagPicker;
