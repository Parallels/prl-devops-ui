import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { formatLogTime } from '@prl/ui-kit';
import { useEventsHub } from '@/contexts/EventsHubContext';
import { CustomIcon } from '@/controls';
import { normalizeLevel, LEVEL_ORDER, LEVEL_META, levelMeta } from '@/utils/logUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LogMessage {
    level: string;
    message: string;
    time: string;
}

// ---------------------------------------------------------------------------
// Main Logs page
// ---------------------------------------------------------------------------
export const Logs: React.FC = () => {
    const { containerMessages, clearContainer } = useEventsHub();
    const [autoScroll, setAutoScroll] = useState(true);
    const [filterLevel, setFilterLevel] = useState<string>('');
    const [search, setSearch] = useState<string>('');
    const listRef = useRef<HTMLDivElement>(null);
    const isProgrammaticRef = useRef(false);

    const logMessages = useMemo(() => {
        return (containerMessages['system_logs'] ?? [])
            .map((m) => {
                const body = m.raw.body as LogMessage | null;
                return {
                    ...m,
                    _body: body,
                    _level: body?.level ? normalizeLevel(body.level) : '',
                    _ts: body?.time ? (new Date(body.time).getTime() || m.receivedAt) : m.receivedAt,
                };
            })
            .sort((a, b) => a._ts - b._ts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerMessages['system_logs']]);

    const filtered = useMemo(() => {
        let result = logMessages;
        if (filterLevel) {
            const minOrder = LEVEL_ORDER[filterLevel]!;
            result = result.filter((m) =>
                m._level !== '' && (LEVEL_ORDER[m._level] ?? -1) >= minOrder
            );
        }
        if (search.trim()) {
            let rx: RegExp | null = null;
            try { rx = new RegExp(search.trim(), 'i'); } catch { /* fall back to literal */ }
            result = result.filter((m) => {
                const msg = m._body?.message ?? '';
                return rx ? rx.test(msg) : msg.toLowerCase().includes(search.trim().toLowerCase());
            });
        }
        return result;
    }, [logMessages, filterLevel, search]);

    // Re-enable auto-scroll and reset to top synchronously on every filter change.
    // The auto-scroll effect below then immediately takes over and scrolls to bottom.
    useLayoutEffect(() => {
        setAutoScroll(true);
        if (listRef.current) listRef.current.scrollTop = 0;
    }, [filterLevel, search]);

    // Scroll to bottom whenever filtered list changes and auto-scroll is on
    useEffect(() => {
        if (autoScroll && listRef.current) {
            isProgrammaticRef.current = true;
            listRef.current.scrollTop = listRef.current.scrollHeight;
            requestAnimationFrame(() => { isProgrammaticRef.current = false; });
        }
    }, [filtered, autoScroll]);

    // contentKey forces full remount of the content area on every filter change,
    // guaranteeing no stale DOM nodes linger between filter states.
    const contentKey = `${filterLevel}:${search}:${filtered.length === 0 ? 'empty' : 'has'}`;

    const handleClear = useCallback(() => {
        clearContainer('system_logs');
    }, [clearContainer]);

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-neutral-950">

            {/* ── Toolbar ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                <CustomIcon icon="Log" className="h-4 w-4 text-neutral-400 dark:text-neutral-500 shrink-0" />

                {/* Search */}
                <div className="relative flex-1">
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

                {/* Level filter */}
                <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 text-xs font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-sky-400 dark:focus:border-sky-500/50"
                >
                    <option value="">All</option>
                    {(['debug', 'info', 'warn', 'error', 'fatal'] as const).map((l) => (
                        <option key={l} value={l}>≥ {LEVEL_META[l].label}</option>
                    ))}
                </select>

                {/* Auto-scroll toggle */}
                <button
                    type="button"
                    onClick={() => setAutoScroll((v) => !v)}
                    className={classNames(
                        'px-2 py-1 rounded text-xs font-mono border transition-colors',
                        autoScroll
                            ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/40 text-sky-600 dark:text-sky-400'
                            : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
                    )}
                    title="Toggle auto-scroll"
                >↓</button>

                {/* Clear */}
                <button
                    type="button"
                    onClick={handleClear}
                    disabled={logMessages.length === 0}
                    className="px-2 py-1 rounded text-xs font-mono border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:border-rose-400 dark:hover:border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Clear logs"
                >✕</button>
            </div>

            {/* ── Log lines ───────────────────────────────────────────── */}
            <div
                ref={listRef}
                className="flex-1 min-h-0 overflow-y-auto px-3 py-2 font-mono text-xs leading-5"
            >
                <div key={contentKey}>
                    {filtered.length === 0 ? (
                        <p className="text-neutral-400 dark:text-neutral-600 py-4 text-center">
                            {logMessages.length === 0 ? 'Waiting for log messages…' : 'No matches.'}
                        </p>
                    ) : (
                        filtered.map((msg) => {
                            if (!msg._body) return null;
                            const meta = levelMeta(msg._body.level);
                            return (
                                <div key={msg.id} className={classNames('flex gap-2 py-0.5 hover:bg-neutral-50 dark:hover:bg-white/5 rounded', meta.row)}>
                                    <span className="shrink-0 text-neutral-400 dark:text-neutral-600">{formatLogTime(msg._body.time)}</span>
                                    <span className={classNames('shrink-0 w-7', meta.badge)}>{meta.label}</span>
                                    <span className="break-all">{msg._body.message}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-400 dark:text-neutral-600 flex-shrink-0">
                <span>{filtered.length} / {logMessages.length} lines</span>
                <span>{logMessages.length > 0 ? `${logMessages.length} buffered` : 'no logs'}</span>
            </div>
        </div>
    );
};
