import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { useEventsHub, type EventsHubMessage } from '@/contexts/EventsHubContext';
import { WebSocketState } from '@/types/WebSocket';
import { CustomIcon } from '@/controls';

// ---------------------------------------------------------------------------
// JSON syntax highlighter (no external deps)
// ---------------------------------------------------------------------------
function syntaxHighlight(json: string): string {
    const escaped = json
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return escaped.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
        (match) => {
            if (/^"/.test(match)) {
                return /:$/.test(match)
                    ? `<span class="text-sky-400">${match}</span>`
                    : `<span class="text-emerald-400">${match}</span>`;
            }
            if (/true|false/.test(match)) return `<span class="text-amber-400">${match}</span>`;
            if (/null/.test(match)) return `<span class="text-neutral-500">${match}</span>`;
            return `<span class="text-violet-400">${match}</span>`;
        }
    );
}

// ---------------------------------------------------------------------------
// Event type badge colours
// ---------------------------------------------------------------------------
const TYPE_BADGES: Record<string, string> = {
    pdfm: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
    orchestrator: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
    health: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    stats: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    system_logs: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-500/20 dark:text-neutral-400',
    reverse_proxy: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    _other: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700/40 dark:text-neutral-400',
};

function typeBadge(t: string): string {
    return TYPE_BADGES[t] ?? TYPE_BADGES['_other'];
}

function formatTime(ts: number): string {
    return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
    } as Intl.DateTimeFormatOptions).format(new Date(ts));
}

// ---------------------------------------------------------------------------
// Human-readable label for each event type
// ---------------------------------------------------------------------------
const TYPE_LABELS: Record<string, string> = {
    '': 'All',
    pdfm: 'PDFM',
    orchestrator: 'Orchestrator',
    health: 'Health',
    stats: 'Stats',
    system_logs: 'System Logs',
    reverse_proxy: 'Reverse Proxy',
    _other: 'Other',
};

// Ordered list of filter types
const FILTER_TYPES = ['', 'pdfm', 'orchestrator', 'health', 'stats', 'system_logs', 'reverse_proxy', '_other'];

// ---------------------------------------------------------------------------
// Single event row
// ---------------------------------------------------------------------------
const EventRow = React.memo(function EventRow({
    msg,
    isNew,
    onToggle,
}: {
    msg: EventsHubMessage;
    isNew: boolean;
    onToggle: (expanding: boolean) => void;
}) {
    const [expanded, setExpanded] = useState(false);

    const highlighted = useMemo(
        () => expanded ? syntaxHighlight(JSON.stringify(msg.raw, null, 2)) : '',
        [expanded, msg.raw]
    );

    const handleToggle = useCallback(() => {
        const next = !expanded;
        setExpanded(next);
        onToggle(next);
    }, [expanded, onToggle]);

    return (
        <div className={classNames(
            'rounded transition-colors',
            isNew && 'bg-sky-50/60 dark:bg-sky-500/5',
        )}>
            {/* Summary row */}
            <button
                type="button"
                onClick={handleToggle}
                className="w-full flex items-center gap-2 px-2 py-0.5 text-left hover:bg-neutral-50 dark:hover:bg-white/5 rounded"
            >
                {/* New dot */}
                <span className={classNames(
                    'h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors duration-500',
                    isNew ? 'bg-sky-400' : 'bg-transparent'
                )} />

                {/* Timestamp */}
                <span className="shrink-0 text-[10px] font-mono text-neutral-400 dark:text-neutral-600 w-[84px]">
                    {formatTime(msg.receivedAt)}
                </span>

                {/* Type badge */}
                <span className={classNames(
                    'shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide w-[88px] justify-center',
                    typeBadge(msg.raw.event_type)
                )}>
                    {msg.raw.event_type || '?'}
                </span>

                {/* Message */}
                <span className="flex-1 truncate text-xs text-neutral-600 dark:text-neutral-300 font-mono">
                    {msg.raw.message || <span className="text-neutral-300 dark:text-neutral-600 italic">no message</span>}
                </span>

                {/* Chevron */}
                <CustomIcon
                    icon="ChevronRight"
                    className={classNames(
                        'h-3 w-3 text-neutral-400 dark:text-neutral-600 shrink-0 transition-transform duration-150',
                        expanded && 'rotate-90'
                    )}
                />
            </button>

            {/* Expanded JSON */}
            {expanded && (
                <div className="ml-[120px] mr-2 mb-1 px-3 py-2 rounded bg-neutral-950 dark:bg-black/40 border border-neutral-800 overflow-x-auto">
                    <pre
                        className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-words text-neutral-200"
                        dangerouslySetInnerHTML={{ __html: highlighted }}
                    />
                </div>
            )}
        </div>
    );
});

// ---------------------------------------------------------------------------
// Connection state badge
// ---------------------------------------------------------------------------
const ConnectionBadge: React.FC<{ state: WebSocketState }> = ({ state }) => {
    const map: Record<WebSocketState, { label: string; cls: string; dot: string }> = {
        [WebSocketState.OPEN]: { label: 'Connected', cls: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500 shadow-[0_0_5px_rgba(52,211,153,0.7)]' },
        [WebSocketState.CONNECTING]: { label: 'Connecting…', cls: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
        [WebSocketState.CLOSING]: { label: 'Closing…', cls: 'text-neutral-500 dark:text-neutral-400', dot: 'bg-neutral-400' },
        [WebSocketState.CLOSED]: { label: 'Disconnected', cls: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
    };
    const { label, cls, dot } = map[state];
    return (
        <span className={classNames('inline-flex items-center gap-1.5 text-[10px] font-mono', cls)}>
            <span className={classNames('h-1.5 w-1.5 rounded-full', dot)} />
            {label}
        </span>
    );
};

// ---------------------------------------------------------------------------
// Main Events page
// ---------------------------------------------------------------------------
export const Events: React.FC = () => {
    const { allMessages, clearContainer, clearAllContainers, connectionState } = useEventsHub();
    const [autoScroll, setAutoScroll] = useState(true);
    const [filterType, setFilterType] = useState<string>('');
    const [search, setSearch] = useState<string>('');
    const [newIds, setNewIds] = useState<Set<string>>(new Set());
    const listRef = useRef<HTMLDivElement>(null);
    const prevCountRef = useRef(0);
    const isProgrammaticRef = useRef(false);

    // Base pool: all messages oldest-first
    const allSorted = useMemo(() => {
        return [...allMessages].sort((a, b) => a.receivedAt - b.receivedAt);
    }, [allMessages]);

    // Filter by event_type. '_other' = anything not in our known list.
    const KNOWN_TYPES = new Set(['pdfm', 'orchestrator', 'health', 'stats', 'system_logs', 'reverse_proxy']);

    const typeFiltered = useMemo(() => {
        if (!filterType) return allSorted;
        if (filterType === '_other') {
            return allSorted.filter((m) => !KNOWN_TYPES.has(m.raw.event_type));
        }
        return allSorted.filter((m) => m.raw.event_type === filterType);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allSorted, filterType]);

    // Apply search across event_type + message + raw body
    const filtered = useMemo(() => {
        if (!search.trim()) return typeFiltered;
        let rx: RegExp | null = null;
        try { rx = new RegExp(search.trim(), 'i'); } catch { /* fall back to literal */ }
        const needle = search.trim().toLowerCase();
        return typeFiltered.filter((m) => {
            const hay = `${m.raw.event_type} ${m.raw.message} ${JSON.stringify(m.raw.body)}`;
            return rx ? rx.test(hay) : hay.toLowerCase().includes(needle);
        });
    }, [typeFiltered, search]);

    // Counts for filter dropdown
    const typeCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const m of allMessages) {
            const k = KNOWN_TYPES.has(m.raw.event_type) ? m.raw.event_type : '_other';
            counts[k] = (counts[k] ?? 0) + 1;
        }
        return counts;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allMessages]);

    // Reset on filter/search change
    useLayoutEffect(() => {
        setNewIds(new Set());
        prevCountRef.current = 0;
        setAutoScroll(true);
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [filterType, search]);

    // Track new IDs (flash 2 s)
    useEffect(() => {
        if (allSorted.length > prevCountRef.current) {
            const added = allSorted
                .slice(prevCountRef.current)
                .map((m) => m.id);
            setNewIds((prev) => new Set([...prev, ...added]));
            const timer = setTimeout(() => {
                setNewIds((prev) => {
                    const next = new Set(prev);
                    added.forEach((id) => next.delete(id));
                    return next;
                });
            }, 2000);
            prevCountRef.current = allSorted.length;
            return () => clearTimeout(timer);
        }
        prevCountRef.current = allSorted.length;
    }, [allSorted.length]);

    // Auto-scroll to bottom (newest at bottom, like logs)
    useEffect(() => {
        if (autoScroll && listRef.current) {
            isProgrammaticRef.current = true;
            listRef.current.scrollTop = listRef.current.scrollHeight;
            requestAnimationFrame(() => { isProgrammaticRef.current = false; });
        }
    }, [filtered, autoScroll]);

    // Expanding a card freezes auto-scroll; collapsing re-enables
    const handleCardToggle = useCallback((expanding: boolean) => {
        setAutoScroll(!expanding);
    }, []);

    const handleClear = useCallback(() => {
        if (filterType && filterType !== '_other') clearContainer(filterType);
        else clearAllContainers();
        setNewIds(new Set());
        prevCountRef.current = 0;
    }, [filterType, clearContainer, clearAllContainers]);

    const contentKey = `${filterType}:${search}:${filtered.length === 0 ? 'empty' : 'has'}`;

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-neutral-950">

            {/* ── Toolbar ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0 flex-wrap">
                <CustomIcon icon="Log" className="h-4 w-4 text-neutral-400 dark:text-neutral-500 shrink-0" />

                {/* Search */}
                <div className="relative flex-1 min-w-[120px]">
                    <CustomIcon icon="Search" className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search / regexp…"
                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded pl-7 pr-7 py-1 text-xs font-mono text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-sky-400 dark:focus:border-sky-500/50"
                    />
                    {search && (
                        <button type="button" onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300">
                            <CustomIcon icon="Close" className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {/* Event type filter */}
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 text-xs font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-sky-400 dark:focus:border-sky-500/50"
                >
                    {FILTER_TYPES.map((t) => {
                        const count = t === '' ? allMessages.length : (typeCounts[t] ?? 0);
                        const label = TYPE_LABELS[t] ?? t;
                        return (
                            <option key={t} value={t}>
                                {label} ({count})
                            </option>
                        );
                    })}
                </select>

                {/* Auto-scroll toggle */}
                <button
                    type="button"
                    onClick={() => setAutoScroll((v) => !v)}
                    title="Toggle auto-scroll"
                    className={classNames(
                        'px-2 py-1 rounded text-xs font-mono border transition-colors',
                        autoScroll
                            ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/40 text-sky-600 dark:text-sky-400'
                            : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
                    )}
                >↓</button>

                {/* Clear */}
                <button
                    type="button"
                    onClick={handleClear}
                    disabled={allMessages.length === 0}
                    title={filterType && filterType !== '_other' ? `Clear ${filterType}` : 'Clear all'}
                    className="px-2 py-1 rounded text-xs font-mono border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:border-rose-400 dark:hover:border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >✕</button>
            </div>

            {/* ── Event rows ─────────────────────────────────────────── */}
            <div
                ref={listRef}
                className="flex-1 min-h-0 overflow-y-auto px-3 py-2 font-mono text-xs leading-5"
            >
                <div key={contentKey}>
                    {filtered.length === 0 ? (
                        <p className="text-neutral-400 dark:text-neutral-600 py-4 text-center">
                            {allMessages.length === 0 ? 'Waiting for events…' : 'No matches.'}
                        </p>
                    ) : (
                        filtered.map((msg) => (
                            <EventRow
                                key={msg.id}
                                msg={msg}
                                isNew={newIds.has(msg.id)}
                                onToggle={handleCardToggle}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-400 dark:text-neutral-600 flex-shrink-0">
                <span>{filtered.length} / {allMessages.length} events</span>
                <ConnectionBadge state={connectionState} />
            </div>
        </div>
    );
};
