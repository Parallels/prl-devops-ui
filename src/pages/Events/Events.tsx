import React, {
    useCallback, useDeferredValue, useEffect, useLayoutEffect,
    useMemo, useRef, useState, useTransition,
} from 'react';
import classNames from 'classnames';
import {
    useEventsHub,
    type EventsHubMessage,
    type ReverseProxyServiceStatus,
    type ReverseProxyHostStatus,
    type ReverseProxyHostStateValue,
} from '@/contexts/EventsHubContext';
import { WebSocketState } from '@/types/WebSocket';
import { CustomIcon } from '@/controls';
import { Picker, type PickerItem } from '@prl/ui-kit';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
/** Maximum number of rows rendered at once. Older events beyond this cap are
 *  still counted / searchable — just not rendered as DOM nodes. */
const MAX_DISPLAY = 500;

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

const FILTER_TYPES = ['', 'pdfm', 'orchestrator', 'health', 'stats', 'system_logs', 'reverse_proxy', '_other'];
const KNOWN_TYPES = new Set(['pdfm', 'orchestrator', 'health', 'stats', 'system_logs', 'reverse_proxy']);

// ---------------------------------------------------------------------------
// Enriched message — pre-computed search haystack so filtering is O(1) per msg
// ---------------------------------------------------------------------------
interface RichMessage {
    msg: EventsHubMessage;
    haystack: string; // lowercased, pre-serialised once
}

// ---------------------------------------------------------------------------
// Single event row
// ---------------------------------------------------------------------------
const EventRow = React.memo(function EventRow({
    msg,
    onToggle,
}: {
    msg: EventsHubMessage;
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
        <div className="rounded">
            {/* Summary row */}
            <button
                type="button"
                onClick={handleToggle}
                className="w-full flex items-center gap-2 px-2 py-0.5 text-left hover:bg-neutral-50 dark:hover:bg-white/5 rounded"
            >
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
// Reverse Proxy state summary group
// ---------------------------------------------------------------------------
const RP_STATE_DOT: Record<ReverseProxyHostStateValue, string> = {
    starting: 'bg-amber-400 animate-pulse',
    started: 'bg-emerald-500',
    stopped: 'bg-neutral-400',
    ip_changed: 'bg-sky-400',
    error: 'bg-rose-500',
};

const RP_STATE_COLOR: Record<ReverseProxyHostStateValue, string> = {
    starting: 'text-amber-600 dark:text-amber-400',
    started: 'text-emerald-600 dark:text-emerald-400',
    stopped: 'text-neutral-500 dark:text-neutral-400',
    ip_changed: 'text-sky-600 dark:text-sky-400',
    error: 'text-rose-600 dark:text-rose-400',
};

const ReverseProxyGroup: React.FC<{
    serviceStatus: ReverseProxyServiceStatus | null;
    hostStatuses: Record<string, ReverseProxyHostStatus>;
}> = ({ serviceStatus, hostStatuses }) => {
    const hosts = useMemo(
        () => Object.values(hostStatuses).sort((a, b) => b.ts - a.ts),
        [hostStatuses]
    );

    return (
        <div className="border-b border-amber-200 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-500/5 flex-shrink-0">
            {/* Service state row */}
            <div className="px-3 py-1.5 flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wide shrink-0">
                    Reverse Proxy
                </span>
                {serviceStatus ? (
                    <span className={classNames(
                        'inline-flex items-center gap-1.5 text-[10px] font-mono',
                        serviceStatus.state === 'started'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-neutral-500 dark:text-neutral-400'
                    )}>
                        <span className={classNames(
                            'h-1.5 w-1.5 rounded-full',
                            serviceStatus.state === 'started' ? 'bg-emerald-500' : 'bg-neutral-400'
                        )} />
                        Service {serviceStatus.state}
                    </span>
                ) : (
                    <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-600 italic">service state unknown</span>
                )}
                {hosts.length > 0 && (
                    <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-600 ml-auto">
                        {hosts.length} host{hosts.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Per-host state rows */}
            {hosts.length > 0 && (
                <div className="border-t border-amber-100 dark:border-amber-500/10">
                    {hosts.map((h) => (
                        <div key={h.id} className="px-3 py-0.5 flex items-center gap-2 text-[10px] font-mono border-b border-amber-100/50 dark:border-amber-500/5 last:border-0">
                            <span className={classNames('h-1.5 w-1.5 rounded-full shrink-0', RP_STATE_DOT[h.state] ?? 'bg-neutral-400')} />
                            <span className="text-neutral-500 dark:text-neutral-400 shrink-0 w-[72px] truncate" title={h.id}>
                                {h.id.length > 8 ? `${h.id.slice(0, 8)}…` : h.id}
                            </span>
                            <span className={classNames('shrink-0 w-[64px]', RP_STATE_COLOR[h.state] ?? '')}>{h.state}</span>
                            {h.state === 'ip_changed' && (h.old_ip || h.new_ip) && (
                                <span className="text-sky-600 dark:text-sky-400 truncate">
                                    {h.old_ip && `${h.old_ip} → `}{h.new_ip}
                                </span>
                            )}
                            {h.state === 'error' && h.error_message && (
                                <span className="text-rose-500 dark:text-rose-400 truncate">{h.error_message}</span>
                            )}
                            <span className="ml-auto text-neutral-400 dark:text-neutral-600 shrink-0">{formatTime(h.ts)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main Events page
// ---------------------------------------------------------------------------
export const Events: React.FC = () => {
    const { allMessages, clearContainer, clearAllContainers, connectionState, rpServiceStatus, rpHostStatuses } = useEventsHub();
    const [autoScroll, setAutoScroll] = useState(true);
    const [filterTypes, setFilterTypes] = useState<string[]>([]);
    const [search, setSearch] = useState<string>('');
    const listRef = useRef<HTMLDivElement>(null);
    const isProgrammaticRef = useRef(false);

    // Defer search so the input stays responsive while the filter runs in the background
    const deferredSearch = useDeferredValue(search);

    // Defer incoming messages — all heavy derivations run at low priority so
    // they never interrupt user interactions (filter dropdown, search input).
    const deferredMessages = useDeferredValue(allMessages);

    // Transition for filter type changes — keeps the UI interactive while re-filtering
    const [filterPending, startFilterTransition] = useTransition();

    // ── Build sorted + enriched list ────────────────────────────────────────
    // Pre-compute each message's search haystack once so filter is O(n) string
    // comparison instead of O(n × JSON.stringify) per keystroke.
    const richSorted = useMemo<RichMessage[]>(() => {
        const arr = Array.from(deferredMessages).sort((a, b) => a.receivedAt - b.receivedAt);
        return arr.map((msg) => ({
            msg,
            haystack: `${msg.raw.event_type} ${msg.raw.message} ${JSON.stringify(msg.raw.body)}`.toLowerCase(),
        }));
    }, [deferredMessages]);

    // ── Type filter ─────────────────────────────────────────────────────────
    const typeFiltered = useMemo<RichMessage[]>(() => {
        if (filterTypes.length === 0) return richSorted;
        return richSorted.filter((r) => {
            const et = r.msg.raw.event_type;
            return filterTypes.some((t) => (t === '_other' ? !KNOWN_TYPES.has(et) : et === t));
        });
    }, [richSorted, filterTypes]);

    // ── Search filter (uses deferred value) ─────────────────────────────────
    const filtered = useMemo<RichMessage[]>(() => {
        const q = deferredSearch.trim();
        if (!q) return typeFiltered;
        let rx: RegExp | null = null;
        try { rx = new RegExp(q, 'i'); } catch { /* fall back to literal */ }
        const needle = q.toLowerCase();
        return typeFiltered.filter((r) =>
            rx ? rx.test(r.haystack) : r.haystack.includes(needle)
        );
    }, [typeFiltered, deferredSearch]);

    // ── Cap rendered rows ───────────────────────────────────────────────────
    // Never mount more than MAX_DISPLAY DOM nodes — show the most recent slice.
    const visibleRows = useMemo(
        () => filtered.length > MAX_DISPLAY ? filtered.slice(-MAX_DISPLAY) : filtered,
        [filtered]
    );
    const hiddenCount = filtered.length - visibleRows.length;

    // ── Type counts for the dropdown ────────────────────────────────────────
    const typeCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const r of richSorted) {
            const k = KNOWN_TYPES.has(r.msg.raw.event_type) ? r.msg.raw.event_type : '_other';
            counts[k] = (counts[k] ?? 0) + 1;
        }
        return counts;
    }, [richSorted]);

    // ── Reset scroll + autoscroll on filter/search change ───────────────────
    useLayoutEffect(() => {
        setAutoScroll(true);
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [filterTypes, deferredSearch]);

    // ── Auto-scroll to bottom ───────────────────────────────────────────────
    useEffect(() => {
        if (autoScroll && listRef.current) {
            isProgrammaticRef.current = true;
            listRef.current.scrollTop = listRef.current.scrollHeight;
            requestAnimationFrame(() => { isProgrammaticRef.current = false; });
        }
    }, [visibleRows, autoScroll]);

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleCardToggle = useCallback((expanding: boolean) => {
        setAutoScroll(!expanding);
    }, []);

    const handleClear = useCallback(() => {
        // If exactly one known container type is selected, clear just that container
        const knownSelected = filterTypes.filter((t) => t !== '_other' && KNOWN_TYPES.has(t));
        if (filterTypes.length === 1 && knownSelected.length === 1) {
            clearContainer(knownSelected[0]);
        } else {
            clearAllContainers();
        }
    }, [filterTypes, clearContainer, clearAllContainers]);

    const handleFilterChange = useCallback((ids: string[]) => {
        startFilterTransition(() => setFilterTypes(ids));
    }, [startFilterTransition]);

    // ── Filter picker items ──────────────────────────────────────────────────
    const filterPickerItems = useMemo<PickerItem[]>(() =>
        FILTER_TYPES
            .filter((t) => t !== '')
            .map((t) => ({
                id: t,
                title: TYPE_LABELS[t] ?? t,
                subtitle: `${t === '_other'
                    ? (typeCounts['_other'] ?? 0)
                    : (typeCounts[t] ?? 0)} events`,
            })),
        [typeCounts]
    );

    const contentKey = `${filterTypes.join(',')}:${deferredSearch}:${visibleRows.length === 0 ? 'empty' : 'has'}`;
    const isStale = search !== deferredSearch || filterPending;

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
                        className={classNames(
                            'w-full bg-neutral-50 dark:bg-neutral-900 border rounded pl-7 pr-7 py-1 text-xs font-mono text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-sky-400 dark:focus:border-sky-500/50 transition-colors',
                            isStale
                                ? 'border-amber-300 dark:border-amber-500/40'
                                : 'border-neutral-300 dark:border-neutral-700',
                        )}
                    />
                    {search && (
                        <button type="button" onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300">
                            <CustomIcon icon="Close" className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {/* Event type filter — multi-select picker */}
                <div className="w-[180px] shrink-0">
                    <Picker
                        items={filterPickerItems}
                        multi
                        selectedIds={filterTypes}
                        onMultiChange={handleFilterChange}
                        placeholder="All types"
                        size="sm"
                        color="sky"
                        escapeBoundary
                    />
                </div>

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
                    disabled={deferredMessages.length === 0}
                    title={filterTypes.length === 1 && filterTypes[0] !== '_other' ? `Clear ${TYPE_LABELS[filterTypes[0]] ?? filterTypes[0]}` : 'Clear all'}
                    className="px-2 py-1 rounded text-xs font-mono border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:border-rose-400 dark:hover:border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >✕</button>
            </div>

            {/* ── Reverse Proxy state group ──────────────────────────── */}
            {(filterTypes.length === 0 || filterTypes.includes('reverse_proxy')) && (rpServiceStatus !== null || Object.keys(rpHostStatuses).length > 0) && (
                <ReverseProxyGroup serviceStatus={rpServiceStatus} hostStatuses={rpHostStatuses} />
            )}

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
                        <>
                            {hiddenCount > 0 && (
                                <p className="text-center text-[10px] font-mono text-neutral-400 dark:text-neutral-600 py-1 mb-1 border-b border-dashed border-neutral-200 dark:border-neutral-800">
                                    {hiddenCount.toLocaleString()} older events hidden — clear or narrow your filter to see them
                                </p>
                            )}
                            {visibleRows.map(({ msg }) => (
                                <EventRow
                                    key={msg.id}
                                    msg={msg}
                                    onToggle={handleCardToggle}
                                />
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-400 dark:text-neutral-600 flex-shrink-0">
                <span>
                    {filtered.length.toLocaleString()} / {deferredMessages.length.toLocaleString()} events
                    {hiddenCount > 0 && <span className="ml-1 text-amber-500 dark:text-amber-400">(showing last {MAX_DISPLAY.toLocaleString()})</span>}
                </span>
                <ConnectionBadge state={connectionState} />
            </div>
        </div>
    );
};
