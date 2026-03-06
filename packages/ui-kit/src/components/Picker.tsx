import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import Pill from './Pill';
import type { TreeTone } from './TreeView/types';

// ── Shared positioning helpers (mirrors DropdownMenu) ─────────────────────────

type RectBounds = { top: number; right: number; bottom: number; left: number; width: number; height: number };

const viewportBounds = (): RectBounds => ({
    top: 0, left: 0,
    right: window.innerWidth, bottom: window.innerHeight,
    width: window.innerWidth, height: window.innerHeight,
});

const isClippingParent = (el: HTMLElement): boolean =>
    /(auto|scroll|hidden|clip)/.test(
        [getComputedStyle(el).overflow, getComputedStyle(el).overflowX, getComputedStyle(el).overflowY].join(' ')
    );

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
    selectedId?: string;
    onSelect: (item: PickerItem) => void;
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
}) => {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [filterActive, setFilterActive] = useState(true);
    const [style, setStyle] = useState<React.CSSProperties>();
    const [computedMaxHeight, setComputedMaxHeight] = useState(MAX_DROPDOWN_HEIGHT);

    const selectedItem = useMemo(() => items.find(o => o.id === selectedId), [items, selectedId]);

    const baseItems = useMemo(
        () => (filterActive && defaultFilter ? items.filter(defaultFilter.predicate) : items),
        [items, filterActive, defaultFilter],
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return baseItems;
        return baseItems.filter(item =>
            item.title.toLowerCase().includes(q) ||
            (item.subtitle ?? '').toLowerCase().includes(q) ||
            (item.description ?? '').toLowerCase().includes(q) ||
            (item.tags ?? []).some(t => t.label.toLowerCase().includes(q)),
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

        const computedWidth = Math.min(
            Math.max(anchorRect.width, menuRect.width),
            boundary.width - minMargin * 2,
        );
        const computedHeight = menuRect.height;

        const belowTop = anchorRect.bottom + offset;
        const aboveTop = anchorRect.top - offset - computedHeight;

        const overflowFor = (top: number) =>
            Math.max(0, boundary.top + minMargin - top) +
            Math.max(0, top + computedHeight - (boundary.bottom - minMargin));

        const isTopSide = overflowFor(aboveTop) < overflowFor(belowTop);
        const rawTop = isTopSide ? aboveTop : belowTop;
        const clampedTop = Math.min(
            Math.max(rawTop, boundary.top + minMargin),
            Math.max(boundary.top + minMargin, boundary.bottom - computedHeight - minMargin),
        );

        const availableSpace = isTopSide
            ? Math.max(120, anchorRect.top - offset - (boundary.top + minMargin))
            : Math.max(120, boundary.bottom - minMargin - belowTop);
        const nextMaxHeight = Math.min(MAX_DROPDOWN_HEIGHT, availableSpace);

        const startLeft = anchorRect.left;
        const clampedLeft = Math.min(
            Math.max(startLeft, boundary.left + minMargin),
            Math.max(boundary.left + minMargin, boundary.right - computedWidth - minMargin),
        );

        setComputedMaxHeight(Math.max(120, nextMaxHeight));
        setStyle({ position: 'fixed', top: clampedTop, left: clampedLeft, width: computedWidth, zIndex });
    }, [open]);

    useLayoutEffect(() => { updatePosition(); }, [updatePosition]);

    useEffect(() => {
        if (!open) { setStyle(undefined); return; }

        let frame = 0;
        const schedule = () => {
            if (frame) cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => { updatePosition(); frame = 0; });
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
            if (
                dropdownRef.current?.contains(e.target as Node) ||
                triggerRef.current?.contains(e.target as Node)
            ) return;
            setOpen(false);
            setQuery('');
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); setQuery(''); }
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
        onSelect(item);
        setOpen(false);
        setQuery('');
    };

    // ── Derived search placeholder ────────────────────────────────────────────

    const resolvedSearchPlaceholder = searchPlaceholder ?? (
        defaultFilter
            ? (filterActive ? `Search ${defaultFilter.label.toLowerCase()} items…` : 'Search all items…')
            : 'Search…'
    );

    // ── Dropdown portal ───────────────────────────────────────────────────────

    const dropdown = open && PORTAL_ROOT ? createPortal(
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
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Escape' && (setOpen(false), setQuery(''))}
                    placeholder={resolvedSearchPlaceholder}
                    className="min-w-0 flex-1 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-200 dark:placeholder:text-neutral-500"
                />
                {query && (
                    <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => setQuery('')}
                        className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                )}
                {defaultFilter && (
                    <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => setFilterActive(v => !v)}
                        className={classNames(
                            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                            filterActive
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400',
                        )}
                    >
                        {filterActive ? defaultFilter.label : 'All'}
                    </button>
                )}
            </div>

            {/* Option list */}
            <ul
                className="divide-y divide-neutral-50 overflow-y-auto dark:divide-neutral-800/60"
                style={{ maxHeight: computedMaxHeight }}
            >
                {filtered.length === 0 ? (
                    <li className="px-4 py-5 text-center text-sm text-neutral-400 dark:text-neutral-500">
                        {baseItems.length === 0 ? emptyMessage : 'No items match your search.'}
                    </li>
                ) : (
                    filtered.map(item => {
                        const isSelected = item.id === selectedId;
                        return (
                            <li
                                key={item.id}
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => handleSelect(item)}
                                className={classNames(
                                    'flex cursor-pointer select-none items-center gap-3 px-4 py-2.5 transition-colors',
                                    isSelected
                                        ? 'bg-blue-50 dark:bg-blue-900/20'
                                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60',
                                )}
                            >
                                {/* Checkmark */}
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                                    {isSelected && (
                                        <svg className="h-3.5 w-3.5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                                        </svg>
                                    )}
                                </span>

                                {/* Icon */}
                                {item.icon && (
                                    <span className={classNames(
                                        'shrink-0',
                                        isSelected ? 'text-blue-500 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500',
                                    )}>
                                        {item.icon}
                                    </span>
                                )}

                                {/* Title + subtitle + description */}
                                <div className="min-w-0 flex-1">
                                    <p className={classNames(
                                        'truncate text-sm font-medium',
                                        isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-neutral-800 dark:text-neutral-200',
                                    )}>
                                        {item.title}
                                    </p>
                                    {item.subtitle && (
                                        <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">
                                            {item.subtitle}
                                        </p>
                                    )}
                                    {item.description && (
                                        <p className="truncate text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                                            {item.description}
                                        </p>
                                    )}
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
    ) : null;

    // ── Trigger button ────────────────────────────────────────────────────────

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen(prev => !prev)}
                className={classNames(
                    'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                    'bg-white dark:bg-neutral-900',
                    open
                        ? 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400'
                        : 'border-neutral-300 hover:border-neutral-400 dark:border-neutral-600 dark:hover:border-neutral-500',
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
                ) : selectedItem ? (
                    <>
                        {selectedItem.icon && (
                            <span className="shrink-0 text-neutral-500 dark:text-neutral-400">
                                {selectedItem.icon}
                            </span>
                        )}
                        <div className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
                                {selectedItem.title}
                            </span>
                            {selectedItem.subtitle && (
                                <span className="block truncate text-xs text-neutral-400 dark:text-neutral-500">
                                    {selectedItem.subtitle}
                                </span>
                            )}
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
                    <span className="flex-1 text-sm text-neutral-400 dark:text-neutral-500">{placeholder}</span>
                )}

                {/* Chevron */}
                <svg
                    className={classNames('h-4 w-4 shrink-0 text-neutral-400 transition-transform', open && 'rotate-180')}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {dropdown}
        </>
    );
};

Picker.displayName = 'Picker';

export { Picker };
export default Picker;
