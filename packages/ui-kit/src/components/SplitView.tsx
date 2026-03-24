import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { type ThemeColor, getPillColorClasses } from '../theme/Theme';
import CustomIcon from './CustomIcon';
import EmptyState from './EmptyState';
import { type IconName } from '../icons/registry';
import { useResizable } from '../hooks/useResizable';
import Loader from './Loader';
import IconButton from './IconButton';
import SearchBar from './SearchBar';
import HelpButton, { type HelpButtonProps } from './HelpButton';
import Panel, { type PanelDecoration, type PanelVariant } from './Panel';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SplitViewSize = 'sm' | 'md' | 'lg';

export interface SplitViewItemBadge {
  label: React.ReactNode;
  tone?: ThemeColor;
  variant?: 'solid' | 'soft' | 'outline';
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
  /** Optional icon rendered before the label */
  icon?: IconName;
  /** Action buttons shown on the right side of the item row (visible on hover) */
  actions?: React.ReactNode;
  /** Extra content rendered below the item row when it is the active selection */
  subContent?: React.ReactNode;
  tags?: string[];
  /** When true, renders the item with an intense accent background and a pulsing dot to signal new content */
  highlight?: boolean;
}

export type SplitViewHeaderSlot<T> = T | ((activeItem: SplitViewItem) => T);

export interface SplitViewHeaderDetails {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned tag/badge area. Accepts any React node(s). */
  tags?: React.ReactNode;
  /**
   * Custom body content rendered as the Panel children.
   * When provided, it overrides title/subtitle/description/tags content.
   */
  headerBody?: React.ReactNode;
  tone?: ThemeColor;
  variant?: PanelVariant;
  /** Alias for `variant` */
  variants?: PanelVariant;
  decoration?: PanelDecoration;
  /** Alias for `decoration` */
  decorations?: PanelDecoration;
  /** Optional divider between header row and details block (default: true). */
  bordered?: boolean;
  className?: string;
}

export interface SplitViewPanelHeaderProps {
  /** Full icon node (left side) */
  icon?: SplitViewHeaderSlot<React.ReactNode>;
  /** Defaults to the active item's label when omitted */
  title?: SplitViewHeaderSlot<React.ReactNode>;
  subtitle?: SplitViewHeaderSlot<React.ReactNode>;
  /** Right side actions in the main row */
  actions?: SplitViewHeaderSlot<React.ReactNode>;
  /** Extra customizable content rendered between identity and search */
  body?: SplitViewHeaderSlot<React.ReactNode>;
  search?: SplitViewHeaderSlot<React.ReactNode>;
  searchWidth?: string;
  /** Second row, right-aligned actions */
  bottomActions?: SplitViewHeaderSlot<React.ReactNode>;
  /** Optional details block rendered below the header row and styled like a Panel. */
  headerDetails?: SplitViewHeaderSlot<SplitViewHeaderDetails | null | undefined>;
  /** Optional help button inserted after title */
  helper?: SplitViewHeaderSlot<HelpButtonProps | undefined>;
  border?: boolean;
  className?: string;
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
  /** Width of the list panel – Tailwind class (when not resizable) or initial px value for resizable */
  listWidth?: string;
  /** Accent color used for active item highlight */
  color?: ThemeColor;
  size?: SplitViewSize;

  /** Deprecated: one visible item is now always shown as detail-only (list hidden). */
  autoHideList?: boolean;

  /** Allow collapsing the list panel */
  collapsible?: boolean;
  /** Controlled collapsed state */
  collapsed?: boolean;
  /** Uncontrolled initial collapsed state */
  defaultCollapsed?: boolean;
  /** Callback when collapsed state changes */
  onCollapsedChange?: (collapsed: boolean) => void;

  /** Allow drag-to-resize the list panel */
  resizable?: boolean;
  /** Minimum list width in px when resizable (default: 180) */
  minListWidth?: number;
  /** Maximum list width in px when resizable (default: 50% of container) */
  maxListWidth?: number;

  /** Extra class for the root container */
  className?: string;
  /** Extra class for the list panel */
  listClassName?: string;
  /** Extra class for the detail panel */
  panelClassName?: string;
  /** Content rendered above the detail panel (header area) */
  panelHeader?: React.ReactNode | ((activeItem: SplitViewItem) => React.ReactNode);
  /**
   * Built-in SplitView header renderer (PageHeader-like) with support for dynamic slots.
   * When provided, this takes precedence over `panelHeader`.
   */
  panelHeaderProps?: SplitViewPanelHeaderProps | ((activeItem: SplitViewItem) => SplitViewPanelHeaderProps | null | undefined);
  /** Rendered when no items match the search filter in the list */
  emptyState?: React.ReactNode;
  /** Action buttons rendered in the list header row (e.g. an "Add" button) */
  listActions?: React.ReactNode;
  /** Content shown in the detail panel when no item is selected. Defaults to a generic EmptyState. Pass `null` to render nothing. */
  panelEmptyState?: React.ReactNode | null;

  /** When true, shows a loading state instead of the normal content */
  loading?: boolean;
  /** Custom loading content. Defaults to a centered Spinner with "Loading..." label. */
  loadingState?: React.ReactNode;

  /** When truthy, shows an error state instead of the normal content. Pass a string to use as the error subtitle. */
  error?: React.ReactNode;
  /** Custom error content. Defaults to a danger-toned EmptyState. */
  errorState?: React.ReactNode;
  /** Callback for the default error state's retry button */
  onRetry?: () => void;

  /** When true, renders a left border on the SplitView container to visually separate it from adjacent content (e.g. a side menu) */
  borderLeft?: boolean;

  /**
   * When true (default), the detail panel body scrolls automatically — panels can render
   * content of any height and the wrapper handles overflow.
   * When false, the panel body uses `overflow-hidden` so that panels which manage their
   * own internal scroll (e.g. a sticky-header + scrollable table layout) fill the space
   * correctly without a double-scroll or broken `h-full` percentage height.
   */
  panelScrollable?: boolean;

  /**
   * When true (default), clicking a list item immediately opens its detail panel —
   * the current behaviour.
   * When false, clicking a row only highlights it; the detail panel only opens when
   * the user explicitly clicks the expand (→) button on that row.
   */
  autoExpand?: boolean;
  /** Controlled expanded id (only meaningful when autoExpand=false) */
  expandedValue?: string;
  /** Callback fired when the expanded item changes (only when autoExpand=false) */
  onExpand?: (id: string, item: SplitViewItem) => void;
}

/* ------------------------------------------------------------------ */
/*  Style tokens                                                       */
/* ------------------------------------------------------------------ */

const sizeTokens: Record<SplitViewSize, { item: string; label: string; subtitle: string; badge: string }> = {
  sm: { item: 'px-4 py-2.5', label: 'text-sm', subtitle: 'text-xs', badge: 'text-[10px] px-1.5 py-0' },
  md: { item: 'px-4 py-3', label: 'text-sm', subtitle: 'text-xs', badge: 'text-[11px] px-2 py-0.5' },
  lg: { item: 'px-5 py-4', label: 'text-base', subtitle: 'text-sm', badge: 'text-xs px-2.5 py-0.5' },
};

const iconSizeClasses: Record<SplitViewSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

type ActiveColorTokens = { bg: string; border: string; text: string; subtitle: string; resizer: string };

// All class names must be written out as full strings so Tailwind's JIT scanner can detect them.
const neutralActive: ActiveColorTokens = {
  bg: 'bg-neutral-100 dark:bg-neutral-800/40',
  border: 'border-l-neutral-500',
  text: 'text-neutral-900 dark:text-neutral-100',
  subtitle: 'text-neutral-600 dark:text-neutral-400',
  resizer: 'bg-neutral-400/40',
};

const activeColors: Record<ThemeColor, ActiveColorTokens> = {
  red: { bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-l-red-600', text: 'text-red-900 dark:text-red-100', subtitle: 'text-red-600 dark:text-red-400', resizer: 'bg-red-400' },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    border: 'border-l-orange-600',
    text: 'text-orange-900 dark:text-orange-100',
    subtitle: 'text-orange-600 dark:text-orange-400',
    resizer: 'bg-orange-400',
  },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-l-amber-600', text: 'text-amber-900 dark:text-amber-100', subtitle: 'text-amber-600 dark:text-amber-400', resizer: 'bg-amber-400' },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    border: 'border-l-yellow-600',
    text: 'text-yellow-900 dark:text-yellow-100',
    subtitle: 'text-yellow-600 dark:text-yellow-400',
    resizer: 'bg-yellow-400',
  },
  lime: { bg: 'bg-lime-50 dark:bg-lime-900/30', border: 'border-l-lime-600', text: 'text-lime-900 dark:text-lime-100', subtitle: 'text-lime-600 dark:text-lime-400', resizer: 'bg-lime-400' },
  green: { bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-l-green-600', text: 'text-green-900 dark:text-green-100', subtitle: 'text-green-600 dark:text-green-400', resizer: 'bg-green-400' },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    border: 'border-l-emerald-600',
    text: 'text-emerald-900 dark:text-emerald-100',
    subtitle: 'text-emerald-600 dark:text-emerald-400',
    resizer: 'bg-emerald-400',
  },
  teal: { bg: 'bg-teal-50 dark:bg-teal-900/30', border: 'border-l-teal-600', text: 'text-teal-900 dark:text-teal-100', subtitle: 'text-teal-600 dark:text-teal-400', resizer: 'bg-teal-400' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/30', border: 'border-l-cyan-600', text: 'text-cyan-900 dark:text-cyan-100', subtitle: 'text-cyan-600 dark:text-cyan-400', resizer: 'bg-cyan-400' },
  sky: { bg: 'bg-sky-50 dark:bg-sky-900/30', border: 'border-l-sky-600', text: 'text-sky-900 dark:text-sky-100', subtitle: 'text-sky-600 dark:text-sky-400', resizer: 'bg-sky-400' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-l-blue-600', text: 'text-blue-900 dark:text-blue-100', subtitle: 'text-blue-600 dark:text-blue-400', resizer: 'bg-blue-400' },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    border: 'border-l-indigo-600',
    text: 'text-indigo-900 dark:text-indigo-100',
    subtitle: 'text-indigo-600 dark:text-indigo-400',
    resizer: 'bg-indigo-400',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-900/30',
    border: 'border-l-violet-600',
    text: 'text-violet-900 dark:text-violet-100',
    subtitle: 'text-violet-600 dark:text-violet-400',
    resizer: 'bg-violet-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    border: 'border-l-purple-600',
    text: 'text-purple-900 dark:text-purple-100',
    subtitle: 'text-purple-600 dark:text-purple-400',
    resizer: 'bg-purple-400',
  },
  fuchsia: {
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/30',
    border: 'border-l-fuchsia-600',
    text: 'text-fuchsia-900 dark:text-fuchsia-100',
    subtitle: 'text-fuchsia-600 dark:text-fuchsia-400',
    resizer: 'bg-fuchsia-400',
  },
  pink: { bg: 'bg-pink-50 dark:bg-pink-900/30', border: 'border-l-pink-600', text: 'text-pink-900 dark:text-pink-100', subtitle: 'text-pink-600 dark:text-pink-400', resizer: 'bg-pink-400' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-900/30', border: 'border-l-rose-600', text: 'text-rose-900 dark:text-rose-100', subtitle: 'text-rose-600 dark:text-rose-400', resizer: 'bg-rose-400' },
  slate: { bg: 'bg-slate-50 dark:bg-slate-900/30', border: 'border-l-slate-600', text: 'text-slate-900 dark:text-slate-100', subtitle: 'text-slate-600 dark:text-slate-400', resizer: 'bg-slate-400' },
  gray: { bg: 'bg-gray-50 dark:bg-gray-900/30', border: 'border-l-gray-600', text: 'text-gray-900 dark:text-gray-100', subtitle: 'text-gray-600 dark:text-gray-400', resizer: 'bg-gray-400' },
  zinc: { bg: 'bg-zinc-50 dark:bg-zinc-900/30', border: 'border-l-zinc-600', text: 'text-zinc-900 dark:text-zinc-100', subtitle: 'text-zinc-600 dark:text-zinc-400', resizer: 'bg-zinc-400' },
  neutral: neutralActive,
  stone: neutralActive,
  white: neutralActive,
  // Semantic aliases
  brand: { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-l-blue-600', text: 'text-blue-900 dark:text-blue-100', subtitle: 'text-blue-600 dark:text-blue-400', resizer: 'bg-blue-400' },
  info: { bg: 'bg-sky-50 dark:bg-sky-900/30', border: 'border-l-sky-600', text: 'text-sky-900 dark:text-sky-100', subtitle: 'text-sky-600 dark:text-sky-400', resizer: 'bg-sky-400' },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    border: 'border-l-emerald-600',
    text: 'text-emerald-900 dark:text-emerald-100',
    subtitle: 'text-emerald-600 dark:text-emerald-400',
    resizer: 'bg-emerald-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-l-amber-600',
    text: 'text-amber-900 dark:text-amber-100',
    subtitle: 'text-amber-600 dark:text-amber-400',
    resizer: 'bg-amber-400',
  },
  danger: { bg: 'bg-rose-50 dark:bg-rose-900/30', border: 'border-l-rose-600', text: 'text-rose-900 dark:text-rose-100', subtitle: 'text-rose-600 dark:text-rose-400', resizer: 'bg-rose-400' },
  theme: neutralActive,
  parallels: { bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-l-red-600', text: 'text-red-900 dark:text-red-100', subtitle: 'text-red-600 dark:text-red-400', resizer: 'bg-red-400' },
};

type HighlightTokens = { bg: string; dot: string };

const neutralHighlight: HighlightTokens = { bg: 'bg-neutral-100 dark:bg-neutral-700/50', dot: 'bg-neutral-500' };

// All class names are written as full strings so Tailwind's JIT scanner can detect them.
const highlightColors: Record<ThemeColor, HighlightTokens> = {
  red: { bg: 'bg-red-100 dark:bg-red-900/50', dot: 'bg-red-500' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/50', dot: 'bg-orange-500' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/50', dot: 'bg-amber-500' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', dot: 'bg-yellow-500' },
  lime: { bg: 'bg-lime-100 dark:bg-lime-900/50', dot: 'bg-lime-500' },
  green: { bg: 'bg-green-100 dark:bg-green-900/50', dot: 'bg-green-500' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/50', dot: 'bg-emerald-500' },
  teal: { bg: 'bg-teal-100 dark:bg-teal-900/50', dot: 'bg-teal-500' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/50', dot: 'bg-cyan-500' },
  sky: { bg: 'bg-sky-100 dark:bg-sky-900/50', dot: 'bg-sky-500' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/50', dot: 'bg-blue-500' },
  indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/50', dot: 'bg-indigo-500' },
  violet: { bg: 'bg-violet-100 dark:bg-violet-900/50', dot: 'bg-violet-500' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/50', dot: 'bg-purple-500' },
  fuchsia: { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/50', dot: 'bg-fuchsia-500' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/50', dot: 'bg-pink-500' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/50', dot: 'bg-rose-500' },
  slate: { bg: 'bg-slate-100 dark:bg-slate-800/50', dot: 'bg-slate-500' },
  gray: { bg: 'bg-gray-100 dark:bg-gray-800/50', dot: 'bg-gray-500' },
  zinc: { bg: 'bg-zinc-100 dark:bg-zinc-800/50', dot: 'bg-zinc-500' },
  neutral: neutralHighlight,
  stone: neutralHighlight,
  white: neutralHighlight,
  brand: { bg: 'bg-blue-100 dark:bg-blue-900/50', dot: 'bg-blue-500' },
  info: { bg: 'bg-sky-100 dark:bg-sky-900/50', dot: 'bg-sky-500' },
  success: { bg: 'bg-emerald-100 dark:bg-emerald-900/50', dot: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-100 dark:bg-amber-900/50', dot: 'bg-amber-500' },
  danger: { bg: 'bg-rose-100 dark:bg-rose-900/50', dot: 'bg-rose-500' },
  theme: neutralHighlight,
  parallels: { bg: 'bg-red-100 dark:bg-red-900/50', dot: 'bg-red-500' },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const SplitView: React.FC<SplitViewProps> = ({
  items,
  value,
  defaultValue,
  onChange,
  listTitle,
  searchPlaceholder = 'Search...',
  listWidth,
  color = 'blue',
  size = 'md',
  autoHideList = true,
  collapsible = false,
  collapsed: controlledCollapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  resizable = false,
  minListWidth = 180,
  maxListWidth: maxListWidthProp,
  className,
  listClassName,
  panelClassName,
  panelHeader,
  panelHeaderProps,
  emptyState,
  listActions,
  panelEmptyState,
  loading = false,
  loadingState,
  error,
  errorState,
  onRetry,
  borderLeft = false,
  autoExpand = true,
  expandedValue,
  onExpand,
  panelScrollable = true,
}) => {
  const visibleItems = useMemo(() => items.filter((i) => !i.hidden), [items]);
  const isSingleVisibleItem = visibleItems.length === 1;
  const isNoVisibleItems = visibleItems.length === 0;
  // Single-item mode is now always detail-only; keep autoHideList reference for backward compatibility.
  const shouldHideList = isSingleVisibleItem || (autoHideList && visibleItems.length === 1) || isNoVisibleItems;
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue ?? visibleItems[0]?.id);
  const activeId = value ?? internalValue;

  // When autoExpand=false, the detail panel is driven by a separate "expanded" id.
  // When autoExpand=true it always mirrors activeId.
  const [internalExpandedId, setInternalExpandedId] = useState<string | undefined>(autoExpand ? (defaultValue ?? visibleItems[0]?.id) : undefined);
  const expandedId = autoExpand ? activeId : (expandedValue ?? internalExpandedId);

  const [filter, setFilter] = useState('');

  /* ---- Collapse state (controlled / uncontrolled) ---- */
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isCollapsedControlled = typeof controlledCollapsed === 'boolean';
  const isCollapsed = collapsible && !shouldHideList && (isCollapsedControlled ? controlledCollapsed : internalCollapsed);

  const toggleCollapsed = useCallback(() => {
    const next = !isCollapsed;
    if (!isCollapsedControlled) setInternalCollapsed(next);
    onCollapsedChange?.(next);
  }, [isCollapsed, isCollapsedControlled, onCollapsedChange]);

  /* ---- Resizable ---- */
  const containerRef = useRef<HTMLDivElement>(null);

  const getMaxWidth = useCallback(() => {
    if (maxListWidthProp) return maxListWidthProp;
    if (containerRef.current) return Math.floor(containerRef.current.offsetWidth * 0.5);
    return 600;
  }, [maxListWidthProp]);

  const initialPxWidth = listWidth ? parseInt(listWidth, 10) : 288; // 288px = w-72
  const validInitialWidth = isNaN(initialPxWidth) ? 288 : initialPxWidth;

  const {
    width: resizableWidth,
    isDragging,
    handleProps,
  } = useResizable({
    initialWidth: validInitialWidth,
    minWidth: minListWidth,
    maxWidth: getMaxWidth,
    enabled: resizable && !isCollapsed && !shouldHideList,
  });

  // Keep selection in sync when items change
  useEffect(() => {
    if (value !== undefined) return;
    if (!visibleItems.some((i) => i.id === internalValue)) {
      setInternalValue(visibleItems[0]?.id);
    }
  }, [visibleItems, value, internalValue]);

  useEffect(() => {
    if (shouldHideList && visibleItems[0] && activeId !== visibleItems[0].id) {
      if (value === undefined) {
        setInternalValue(visibleItems[0].id);
      }
    }
  }, [shouldHideList, visibleItems, activeId, value]);

  const filteredItems = useMemo(() => {
    if (!filter) return visibleItems;
    const lower = filter.toLowerCase();
    return visibleItems.filter((item) => {
      const labelText = typeof item.label === 'string' ? item.label : '';
      const subtitleText = typeof item.subtitle === 'string' ? item.subtitle : '';
      return labelText.toLowerCase().includes(lower) || subtitleText.toLowerCase().includes(lower);
    });
  }, [visibleItems, filter]);

  // The right-hand detail panel always follows the selected row (activeId), in both modes.
  // expandedId is only used to control subContent (inline expansion) when autoExpand=false.
  const activeItem = visibleItems.find((i) => i.id === activeId);

  const tokens = sizeTokens[size];
  const accent = activeColors[color];
  const highlightAccent = highlightColors[color];
  const resizerColor = accent.resizer;

  const handleSelect = (item: SplitViewItem) => {
    if (item.disabled) return;
    if (value === undefined) {
      setInternalValue(item.id);
    }
    onChange?.(item.id, item);
  };

  const handleExpand = (item: SplitViewItem) => {
    if (item.disabled) return;
    const isAlreadyExpanded = expandedId === item.id;
    if (isAlreadyExpanded) {
      // Collapse
      if (expandedValue === undefined) setInternalExpandedId(undefined);
      onExpand?.(item.id, item);
      return;
    }
    // Expand — also select the item
    if (value === undefined) setInternalValue(item.id);
    onChange?.(item.id, item);
    if (expandedValue === undefined) setInternalExpandedId(item.id);
    onExpand?.(item.id, item);
  };

  const listWidthClass = listWidth ?? 'w-72';

  const renderBadge = (badge: SplitViewItemBadge, idx: number) => {
    const pillTokens = getPillColorClasses(badge.tone ?? 'info', badge.variant ?? 'soft');
    return (
      <span key={idx} className={classNames('inline-flex items-center rounded-full font-medium leading-none', tokens.badge, pillTokens.base, pillTokens.border)}>
        {badge.label}
      </span>
    );
  };

  const resolveHeaderSlot = <T,>(slot: SplitViewHeaderSlot<T> | undefined, item: SplitViewItem): T | undefined => {
    if (typeof slot === 'function') {
      return (slot as (activeItem: SplitViewItem) => T)(item);
    }
    return slot;
  };

  const renderBuiltInHeader = (item: SplitViewItem, options?: { promoteItemActions?: boolean }) => {
    if (panelHeaderProps === undefined) return null;

    const headerProps = typeof panelHeaderProps === 'function' ? panelHeaderProps(item) : panelHeaderProps;
    if (!headerProps) return null;

    const icon = resolveHeaderSlot(headerProps.icon, item);
    const title = resolveHeaderSlot(headerProps.title, item) ?? item.label;
    const subtitle = resolveHeaderSlot(headerProps.subtitle, item);
    const body = resolveHeaderSlot(headerProps.body, item);
    const search = resolveHeaderSlot(headerProps.search, item);
    const helper = resolveHeaderSlot(headerProps.helper, item);
    const bottomActions = resolveHeaderSlot(headerProps.bottomActions, item);
    const headerDetails = resolveHeaderSlot(headerProps.headerDetails, item);
    const customActions = resolveHeaderSlot(headerProps.actions, item);
    const promotedActions = options?.promoteItemActions ? item.actions : undefined;
    const promotedListActions = options?.promoteItemActions ? listActions : undefined;
    const mergedActions =
      customActions || promotedActions || promotedListActions ? (
        <>
          {customActions}
          {promotedActions}
          {promotedListActions}
        </>
      ) : undefined;
    const border = headerProps.border ?? true;
    const detailsVariant = headerDetails?.variant ?? headerDetails?.variants ?? 'subtle';
    const detailsDecoration = headerDetails?.decoration ?? headerDetails?.decorations ?? 'none';
    const detailsTone = headerDetails?.tone ?? 'neutral';
    const hasCustomHeaderBody = headerDetails?.headerBody !== undefined && headerDetails?.headerBody !== null;
    const hasHeaderDetailsContent = Boolean(hasCustomHeaderBody || headerDetails?.title || headerDetails?.subtitle || headerDetails?.description || headerDetails?.tags);
    const isDetailsBordered = headerDetails?.bordered ?? true;

    return (
      <div className={classNames('flex-none', border, headerProps.className)}>
        <div className="flex items-center gap-3 px-4 py-3">
          {icon && <div className="shrink-0">{icon}</div>}
          <div className="flex-1 min-w-0">
            <h2 className="flex items-center gap-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              <span>{title}</span>
              {helper && <HelpButton {...helper} />}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 truncate">{subtitle}</p>}
          </div>
          {body && <div className="shrink-0">{body}</div>}
          {search && <div className={classNames('shrink-0', headerProps.searchWidth)}>{search}</div>}
          {mergedActions && <div className="flex items-center gap-1 shrink-0">{mergedActions}</div>}
        </div>
        {bottomActions && <div className="flex items-center justify-end gap-2 px-4 pb-3">{bottomActions}</div>}
        {headerDetails && hasHeaderDetailsContent && (
          <div className={classNames(isDetailsBordered && 'border-t border-b border-neutral-200 dark:border-neutral-700')}>
            <Panel
              variant={detailsVariant}
              tone={detailsTone}
              decoration={detailsDecoration}
              corner="none"
              padding="none"
              className={classNames('w-full shadow-none px-3 py-4', headerDetails.className)}
            >
              {hasCustomHeaderBody ? (
                headerDetails.headerBody
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {headerDetails.title && <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">{headerDetails.title}</div>}
                    {headerDetails.subtitle && <div className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{headerDetails.subtitle}</div>}
                    {headerDetails.description && <div className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-400">{headerDetails.description}</div>}
                  </div>
                  {headerDetails.tags && <div className="flex items-center justify-end gap-2 flex-wrap">{headerDetails.tags}</div>}
                </div>
              )}
            </Panel>
          </div>
        )}
      </div>
    );
  };

  const renderPanelHeader = (item: SplitViewItem, options?: { promoteItemActions?: boolean }) => {
    if (panelHeaderProps !== undefined) {
      return renderBuiltInHeader(item, options);
    }
    if (!panelHeader) return null;
    return typeof panelHeader === 'function' ? panelHeader(item) : panelHeader;
  };
  const singleItem = shouldHideList ? visibleItems[0] : undefined;
  const singleHeader = singleItem ? renderPanelHeader(singleItem, { promoteItemActions: true }) : null;
  const activeHeader = activeItem ? renderPanelHeader(activeItem, { promoteItemActions: false }) : null;

  /* ---- List panel width ---- */
  const listPanelStyle: React.CSSProperties | undefined = isCollapsed ? { width: 48 } : resizable ? { width: resizableWidth } : undefined;

  const listPanelWidthClass = isCollapsed || resizable ? undefined : listWidthClass;

  /* ---- Overlay helper ---- */
  const renderOverlay = () => {
    if (loading) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[inherit] bg-white/60 backdrop-blur-md dark:bg-neutral-900/50">
          {loadingState ?? <Loader size="lg" label="Please wait..." color={color} variant="spinner" title="Loading..." spinnerThickness="thick" spinnerVariant="segments" />}
        </div>
      );
    }
    if (error) {
      return (
        <div className="absolute inset-0 z-40 flex items-center justify-center rounded-[inherit] bg-white/60 backdrop-blur-md p-6 dark:bg-neutral-900/50">
          {errorState ?? (
            <EmptyState
              icon="Error"
              title="Something went wrong"
              subtitle={typeof error === 'string' ? error : 'An unexpected error occurred.'}
              showIcon
              actionLabel={onRetry ? 'Retry' : undefined}
              onAction={onRetry}
              actionVariant="solid"
              actionColor={color}
              disableBorder
              transparentBackground
              iconColor="danger"
              size="lg"
            />
          )}
        </div>
      );
    }
    return null;
  };

  /* ---- Auto-hide: just render the detail panel ---- */
  if (shouldHideList) {
    return (
      <div className={classNames('relative flex h-full min-h-0 overflow-hidden', borderLeft && 'border-l border-gray-200 dark:border-gray-700', className)}>
        {renderOverlay()}
        <div className={classNames('flex flex-1 flex-col min-w-0 h-full overflow-hidden', panelClassName)}>
          {singleItem ? (
            <>
              {singleHeader ? (
                <div className="shrink-0">{singleHeader}</div>
              ) : listActions ? (
                <div className="shrink-0 flex items-center justify-end gap-1 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">{listActions}</div>
              ) : null}
              <div className={classNames('flex-1', panelScrollable ? 'overflow-y-auto' : 'overflow-hidden')}>{singleItem.panel}</div>
            </>
          ) : (
            panelEmptyState !== null && (
              <div className="flex flex-1 items-center justify-center p-6">
                {panelEmptyState ?? <EmptyState icon="Info" title="No items" subtitle="There are no items to display." showIcon disableBorder color={color} />}
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={classNames('relative flex h-full min-h-0 overflow-hidden', borderLeft && 'border-l border-gray-200 dark:border-gray-700', className)}>
      {renderOverlay()}
      {/* ---- List Panel ---- */}
      <div
        style={listPanelStyle}
        className={classNames(
          'flex flex-col shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/80 h-full overflow-hidden',
          isCollapsed && 'transition-[width] duration-300 ease-in-out',
          listPanelWidthClass,
          listClassName,
        )}
      >
        {isCollapsed ? (
          /* ---- Collapsed: just an expand button ---- */
          <div className="flex items-center justify-center pt-3">
            <IconButton icon="ChevronRight" variant="ghost" color={color} size="xs" onClick={toggleCollapsed} aria-label="Expand list" />
          </div>
        ) : (
          <>
            {/* Title + Actions */}
            {(listTitle || listActions || collapsible) && (
              <div className="shrink-0 px-4 pt-4 pb-2 flex items-center justify-between gap-2">
                {listTitle && <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{listTitle}</h3>}
                <div className="flex items-center gap-1 ml-auto">
                  {listActions}
                  {collapsible && <IconButton icon="ChevronLeft" variant="ghost" color={color} size="xs" onClick={toggleCollapsed} aria-label="Collapse list" />}
                </div>
              </div>
            )}

            {/* Search — hidden when only one item since there is nothing to filter */}
            {visibleItems.length > 1 && (
              <div className="shrink-0 px-3 pb-2 pt-1">
                <SearchBar placeholder={searchPlaceholder} variant="gradient" glowIntensity="subtle" color={color} onSearch={setFilter} />
              </div>
            )}

            {/* Item list */}
            <div className="flex-1 overflow-y-auto">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">{emptyState ?? 'No items found'}</div>
              ) : (
                filteredItems.map((item) => {
                  const isActive = item.id === activeId;
                  const isExpanded = item.id === expandedId;
                  return (
                    <div key={item.id}>
                      {/* Row wrapper – uses a div so that action/expand buttons inside are not nested buttons */}
                      <div
                        role="button"
                        tabIndex={item.disabled ? -1 : 0}
                        aria-disabled={item.disabled}
                        onClick={() => {
                          if (!item.disabled) handleSelect(item);
                        }}
                        onKeyDown={(e) => {
                          if (!item.disabled && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            handleSelect(item);
                          }
                        }}
                        className={classNames(
                          'group/item w-full text-left border-l-3 transition-all duration-150 outline-none cursor-default',
                          item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                          tokens.item,
                          isActive
                            ? classNames(accent.bg, accent.border, 'border-l-[3px]')
                            : item.highlight
                              ? classNames(highlightAccent.bg, accent.border, 'border-l-[3px]')
                              : 'border-l-[3px] border-l-transparent hover:bg-gray-100/80 dark:hover:bg-gray-800/60',
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {/* Item content */}
                          <div className="flex-1 min-w-0">
                            <div className={classNames('flex gap-2 font-semibold leading-tight', tokens.label, isActive || item.highlight ? accent.text : 'text-gray-900 dark:text-gray-100')}>
                              {item.icon && (
                                <div className="flex items-start">
                                  <CustomIcon icon={item.icon} className={classNames('shrink-0', iconSizeClasses[size])} />
                                </div>
                              )}
                              <div className="flex items-center w-full gap-1.5">
                                <span className="truncate">{item.label}</span>
                                {item.highlight && <span className={classNames('h-2 w-2 shrink-0 rounded-full', highlightAccent.dot, !isActive && 'animate-pulse')} />}
                              </div>
                            </div>
                            {item.subtitle && (
                              <div className={classNames('mt-0.5 leading-tight truncate', tokens.subtitle, isActive ? accent.subtitle : 'text-gray-500 dark:text-gray-400', item.icon && 'ml-7')}>
                                {item.subtitle}
                              </div>
                            )}
                            {item.badges && item.badges.length > 0 && (
                              <div className={classNames('flex flex-wrap gap-1.5 mt-1.5', item.icon && 'ml-7')}>{item.badges.map((badge, idx) => renderBadge(badge, idx))}</div>
                            )}
                          </div>
                          {/* Item actions (hover-reveal) */}
                          {item.actions && (
                            <div
                              className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              {item.actions}
                            </div>
                          )}
                          {/* Expand button – only when autoExpand=false */}
                          {!autoExpand && (
                            <div className="shrink-0 flex items-center" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                disabled={item.disabled || item.subContent === undefined}
                                onClick={() => handleExpand(item)}
                                title={isExpanded ? 'Collapse details' : 'Expand details'}
                                aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                                aria-expanded={isExpanded}
                                className={classNames(
                                  'rounded p-1 transition-colors duration-150',
                                  item.subContent === undefined
                                    ? 'invisible'
                                    : isExpanded
                                      ? classNames(accent.text, 'opacity-100')
                                      : 'text-gray-400 opacity-0 group-hover/item:opacity-100 hover:text-gray-700 dark:hover:text-gray-200',
                                )}
                              >
                                <svg
                                  className={classNames('h-4 w-4 transition-transform duration-200 ease-in-out', isExpanded ? 'rotate-90' : 'rotate-0')}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {item.subContent !== undefined && (
                        <div
                          className={classNames(
                            'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out',
                            // When autoExpand=false, subContent is gated by the expand button (isExpanded),
                            // not by row selection (isActive) — fixes both the auto-expand and sticky-collapse bugs.
                            (autoExpand ? isActive : isExpanded) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                          )}
                        >
                          <div className="overflow-hidden">
                            <div className={classNames('border-l-[3px]', (autoExpand ? isActive : isExpanded) ? accent.border : 'border-l-transparent')}>{item.subContent}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* ---- Resize Handle ---- */}
      {resizable && !isCollapsed && (
        <div
          {...handleProps}
          className={classNames('w-1.5 shrink-0 cursor-col-resize transition-all duration-150', resizerColor, isDragging ? 'opacity-100' : 'opacity-0 hover:opacity-30 active:opacity-100')}
        />
      )}

      {/* ---- Detail Panel ---- */}
      <div className={classNames('flex flex-1 flex-col min-w-0 h-full bg-white overflow-hidden', panelClassName)}>
        {activeItem ? (
          <>
            {/* Panel Header */}
            {activeHeader && <div className="shrink-0">{activeHeader}</div>}
            {/* Panel Body */}
            <div className={classNames('flex-1', panelScrollable ? 'overflow-y-auto' : 'overflow-hidden')}>{activeItem.panel}</div>
          </>
        ) : (
          panelEmptyState !== null && (
            <div className="flex flex-1 items-center justify-center p-6">
              {panelEmptyState ?? <EmptyState icon="Info" title="No item selected" subtitle="Select an item from the list to view its details." showIcon disableBorder color={color} />}
            </div>
          )
        )}
      </div>
    </div>
  );
};

SplitView.displayName = 'SplitView';

export default SplitView;
