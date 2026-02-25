import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { CustomIcon } from '@prl/ui-kit';
import { useReverseProxyEvents, type ReverseProxyEventEntry, type ReverseProxyTcpBody } from '@/contexts/EventsHubContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
    return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
    } as Intl.DateTimeFormatOptions).format(new Date(ts));
}

// ── Entry row ─────────────────────────────────────────────────────────────────

function TcpEventRow({ entry, isNew }: { entry: ReverseProxyEventEntry; isNew: boolean }) {
    const body = entry.body as ReverseProxyTcpBody;

    const source = body.source_ip ?? '—';
    const target = body.internal_ip_address ?? body.target_host ?? '—';

    return (
        <div className={classNames(
            'flex items-center gap-2 px-2 py-0.5 rounded transition-colors text-xs font-mono group',
            isNew && 'bg-sky-50/60 dark:bg-sky-500/5',
        )}>
            {/* New-arrival dot */}
            <span className={classNames(
                'h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors duration-500',
                isNew ? 'bg-violet-400' : 'bg-transparent',
            )} />

            {/* Timestamp */}
            <span className="shrink-0 text-[10px] text-neutral-400 dark:text-neutral-600 w-[84px]">
                {formatTime(entry.ts)}
            </span>

            {/* TCP badge */}
            <span className="shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 w-[36px] justify-center">
                TCP
            </span>

            {/* ── Traffic flow: source → icon → target ── */}
            <span className="flex-1 flex items-center gap-1.5 min-w-0">
                {/* Source IP */}
                <span className="text-neutral-500 dark:text-neutral-400 truncate" title={source}>
                    {source}
                </span>

                {/* Direction icon */}
                <CustomIcon
                    icon="ReverseProxyTo"
                    className="shrink-0 h-3.5 w-3.5 text-violet-400 dark:text-violet-500"
                />

                {/* Destination */}
                <span className="text-neutral-700 dark:text-neutral-200 font-medium truncate" title={target}>
                    {target}
                </span>
            </span>

            {/* Message label — right-aligned soft */}
            <span className="shrink-0 text-[10px] text-neutral-300 dark:text-neutral-600 truncate max-w-[160px] group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors">
                {entry.message}
            </span>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface TcpLogsTabProps {
    /** The ReverseProxyHost id — used to scope to this host's events */
    hostId: string;
}

export function TcpLogsTab({ hostId }: TcpLogsTabProps) {
    const rawEntries = useReverseProxyEvents(hostId);
    const [search, setSearch] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);
    const [newIds, setNewIds] = useState<Set<string>>(new Set());
    const listRef = useRef<HTMLDivElement>(null);
    const prevCountRef = useRef(0);
    const isProgrammaticRef = useRef(false);

    // Filter to tcp only, oldest-first
    const tcpEntries = useMemo(
        () => rawEntries.filter((e) => e.body.traffic_type === 'tcp'),
        [rawEntries],
    );

    // Apply search
    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return tcpEntries;
        return tcpEntries.filter((e) => {
            const b = e.body as ReverseProxyTcpBody;
            const hay = `${e.message} ${b.target_host ?? ''} ${b.internal_ip_address ?? ''}`.toLowerCase();
            return hay.includes(needle);
        });
    }, [tcpEntries, search]);

    // Reset on search change
    useLayoutEffect(() => {
        prevCountRef.current = 0;
        setNewIds(new Set());
        setAutoScroll(true);
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [search]);

    // New-arrival flash (2 s)
    useEffect(() => {
        if (tcpEntries.length > prevCountRef.current) {
            const added = tcpEntries.slice(prevCountRef.current).map((e) => e.id);
            setNewIds((prev) => new Set([...prev, ...added]));
            const t = setTimeout(() => {
                setNewIds((prev) => {
                    const next = new Set(prev);
                    added.forEach((id) => next.delete(id));
                    return next;
                });
            }, 2000);
            prevCountRef.current = tcpEntries.length;
            return () => clearTimeout(t);
        }
        prevCountRef.current = tcpEntries.length;
    }, [tcpEntries.length]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (autoScroll && listRef.current) {
            isProgrammaticRef.current = true;
            listRef.current.scrollTop = listRef.current.scrollHeight;
            requestAnimationFrame(() => { isProgrammaticRef.current = false; });
        }
    }, [filtered, autoScroll]);

    const handleClear = useCallback(() => {
        setNewIds(new Set());
        prevCountRef.current = 0;
    }, []);

    return (
        <div className="flex flex-col h-full min-h-0 bg-white dark:bg-neutral-950">

            {/* ── Toolbar ──────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[120px]">
                    <CustomIcon icon="Search" className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter by target / message…"
                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded pl-7 pr-7 py-1 text-xs font-mono text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-sky-400 dark:focus:border-sky-500/50"
                    />
                    {search && (
                        <button type="button" onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300">
                            <CustomIcon icon="Close" className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {/* Auto-scroll */}
                <button
                    type="button"
                    onClick={() => setAutoScroll((v) => !v)}
                    title="Toggle auto-scroll"
                    className={classNames(
                        'px-2 py-1 rounded text-xs font-mono border transition-colors',
                        autoScroll
                            ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/40 text-sky-600 dark:text-sky-400'
                            : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500',
                    )}
                >↓</button>

                {/* Clear */}
                <button
                    type="button"
                    onClick={handleClear}
                    title="Clear flash indicators"
                    disabled={tcpEntries.length === 0}
                    className="px-2 py-1 rounded text-xs font-mono border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:border-rose-400 dark:hover:border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >✕</button>
            </div>

            {/* ── Event rows ───────────────────────────────────────────── */}
            <div
                ref={listRef}
                className="flex-1 min-h-0 overflow-y-auto px-3 py-2"
                onScroll={(e) => {
                    if (isProgrammaticRef.current) return;
                    const el = e.currentTarget;
                    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
                    setAutoScroll(atBottom);
                }}
            >
                {filtered.length === 0 ? (
                    <p className="text-xs font-mono text-neutral-400 dark:text-neutral-600 py-4 text-center">
                        {tcpEntries.length === 0 ? 'Waiting for TCP traffic…' : 'No matches.'}
                    </p>
                ) : (
                    filtered.map((entry) => (
                        <TcpEventRow
                            key={entry.id}
                            entry={entry}
                            isNew={newIds.has(entry.id)}
                        />
                    ))
                )}
            </div>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-400 dark:text-neutral-600 flex-shrink-0">
                <span>{filtered.length} / {tcpEntries.length} TCP events</span>
                {!hostId && (
                    <span className="text-amber-500 dark:text-amber-400">no host ID — events unavailable</span>
                )}
            </div>
        </div>
    );
}
