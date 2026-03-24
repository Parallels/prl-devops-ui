import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { formatLogTime } from '@prl/ui-kit';
import { CustomIcon } from '@/controls';
import { LEVEL_META, levelMeta, normalizeLevel } from '@/utils/logUtils';
import { useUserConfig } from '@/contexts/UserConfigContext';
import type { HostLogEntry } from '@/contexts/EventsHubContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LogViewerEntry = HostLogEntry;

export interface LogViewerProps {
    logs: LogViewerEntry[];
    /** Slug used to persist limit + wrapLines settings per target. If omitted, settings are not persisted. */
    configSlug?: string;
    onClear?: () => void;
    /** When true, shows a "loading" indicator briefly on mount when logs already exist. */
    loading?: boolean;
}

const LIMIT_OPTIONS = [50, 100, 200, 500, 1000] as const;
type LimitOption = typeof LIMIT_OPTIONS[number];

// ---------------------------------------------------------------------------
// Settings shape stored in UserConfig
// ---------------------------------------------------------------------------
interface LogViewerConfig {
    limit: LimitOption;
    wrapLines: boolean;
}

const DEFAULT_CONFIG: LogViewerConfig = { limit: 200, wrapLines: false };

// ---------------------------------------------------------------------------
// Single log row — memoized to avoid re-rendering the entire list on each new entry
// ---------------------------------------------------------------------------
interface LogRowProps {
    entry: LogViewerEntry;
    wrapLines: boolean;
}

const LogRow = memo(function LogRow({ entry, wrapLines }: LogRowProps) {
    const meta = levelMeta(entry.level);
    return (
        <div className={classNames('flex gap-2 py-0.5 hover:bg-neutral-50 dark:hover:bg-white/5 rounded', meta.row)}>
            <span className="shrink-0 text-neutral-400 dark:text-neutral-600">{formatLogTime(entry.time)}</span>
            <span className={classNames('shrink-0 w-7', meta.badge)}>{meta.label}</span>
            <span className={wrapLines ? 'break-all' : 'truncate'}>{entry.message}</span>
        </div>
    );
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function LogViewer({ logs, configSlug, onClear, loading: externalLoading }: LogViewerProps) {
    const { getConfig, setConfig } = useUserConfig();

    // Load persisted settings (or defaults) once on mount.
    const savedConfig = configSlug ? getConfig<LogViewerConfig>(configSlug, DEFAULT_CONFIG) : DEFAULT_CONFIG;
    const [limit, setLimit] = useState<LimitOption>(savedConfig.limit);
    const [wrapLines, setWrapLines] = useState<boolean>(savedConfig.wrapLines);
    const [showSettings, setShowSettings] = useState(false);
    const [search, setSearch] = useState('');
    const [searchError, setSearchError] = useState(false);
    const [levelFilter, setLevelFilter] = useState<string>('');
    const [autoScroll, setAutoScroll] = useState(true);

    // Deferred-ready flag: when logs already exist on mount we briefly show "initializing"
    const [ready, setReady] = useState(() => logs.length === 0);
    useEffect(() => {
        if (!ready) {
            const id = requestAnimationFrame(() => setReady(true));
            return () => cancelAnimationFrame(id);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const listRef = useRef<HTMLDivElement>(null);
    const isProgrammaticRef = useRef(false);

    // ── Slice to limit, then filter ────────────────────────────────────────
    const limitedLogs = useMemo(() => logs.slice(-limit), [logs, limit]);

    const filtered = useMemo(() => {
        let result = limitedLogs;

        if (levelFilter) {
            result = result.filter((e) => normalizeLevel(e.level) === levelFilter);
        }

        const q = search.trim();
        if (q) {
            let rx: RegExp | null = null;
            let bad = false;
            try { rx = new RegExp(q, 'i'); } catch { bad = true; }
            setSearchError(bad);
            if (!bad && rx) {
                result = result.filter((e) => rx!.test(e.message));
            }
        } else {
            setSearchError(false);
        }

        return result;
    }, [limitedLogs, levelFilter, search]);

    // ── Reset scroll to top on filter change ───────────────────────────────
    useLayoutEffect(() => {
        if (listRef.current) listRef.current.scrollTop = 0;
    }, [search, levelFilter, limit]);

    // ── Auto-scroll to bottom ──────────────────────────────────────────────
    useEffect(() => {
        if (autoScroll && listRef.current && ready) {
            isProgrammaticRef.current = true;
            listRef.current.scrollTop = listRef.current.scrollHeight;
            requestAnimationFrame(() => { isProgrammaticRef.current = false; });
        }
    }, [filtered, autoScroll, ready]);

    const handleScroll = useCallback(() => {
        if (isProgrammaticRef.current || !listRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        setAutoScroll(scrollHeight - scrollTop - clientHeight < 40);
    }, []);

    // ── Settings persistence ───────────────────────────────────────────────
    const applyLimit = useCallback((v: LimitOption) => {
        setLimit(v);
        if (configSlug) void setConfig(configSlug, { limit: v, wrapLines });
    }, [configSlug, setConfig, wrapLines]);

    const applyWrapLines = useCallback((v: boolean) => {
        setWrapLines(v);
        if (configSlug) void setConfig(configSlug, { limit, wrapLines: v });
    }, [configSlug, setConfig, limit]);

    // ── Content key forces remount when filters change ─────────────────────
    const contentKey = `${levelFilter}:${search}:${filtered.length === 0 ? 'empty' : 'has'}`;

    const isLoading = externalLoading || !ready;

    return (
        <div className="flex flex-col h-full min-h-0 bg-white dark:bg-neutral-950">

            {/* ── Toolbar ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">

                {/* Search */}
                <div className="relative flex-1">
                    <CustomIcon
                        icon={searchError ? 'Warning' : 'Search'}
                        className={classNames(
                            'absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none',
                            searchError ? 'text-amber-500' : 'text-neutral-400 dark:text-neutral-500'
                        )}
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search / regexp…"
                        className={classNames(
                            'w-full bg-neutral-50 dark:bg-neutral-900 border rounded pl-7 pr-7 py-1 text-xs font-mono text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none',
                            searchError
                                ? 'border-amber-400 dark:border-amber-500/50 focus:border-amber-400'
                                : 'border-neutral-300 dark:border-neutral-700 focus:border-sky-400 dark:focus:border-sky-500/50'
                        )}
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
                        >
                            <CustomIcon icon="Close" className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {/* Level filter */}
                <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 text-xs font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-sky-400 dark:focus:border-sky-500/50"
                >
                    <option value="">All</option>
                    {(['debug', 'info', 'warn', 'error', 'fatal'] as const).map((l) => (
                        <option key={l} value={l}>{LEVEL_META[l].label}</option>
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

                {/* Settings gear */}
                <button
                    type="button"
                    onClick={() => setShowSettings((v) => !v)}
                    className={classNames(
                        'px-2 py-1 rounded text-xs border transition-colors',
                        showSettings
                            ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/40 text-sky-600 dark:text-sky-400'
                            : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
                    )}
                    title="Log settings"
                >
                    <CustomIcon icon="Settings" className="h-3.5 w-3.5" />
                </button>

                {/* Clear */}
                {onClear && (
                    <button
                        type="button"
                        onClick={onClear}
                        disabled={logs.length === 0}
                        className="px-2 py-1 rounded text-xs font-mono border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:border-rose-400 dark:hover:border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Clear logs"
                    >✕</button>
                )}
            </div>

            {/* ── Settings panel ──────────────────────────────────────── */}
            {showSettings && (
                <div className="flex items-center gap-4 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex-shrink-0">
                    <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider shrink-0">Settings</span>

                    <label className="flex items-center gap-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
                        <span>Limit</span>
                        <select
                            value={limit}
                            onChange={(e) => applyLimit(Number(e.target.value) as LimitOption)}
                            className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-1.5 py-0.5 text-xs font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none"
                        >
                            {LIMIT_OPTIONS.map((n) => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                        <span className="text-neutral-400 dark:text-neutral-600">lines</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={wrapLines}
                            onChange={(e) => applyWrapLines(e.target.checked)}
                            className="rounded border-neutral-400"
                        />
                        <span>Wrap lines</span>
                    </label>
                </div>
            )}

            {/* ── Log lines ───────────────────────────────────────────── */}
            <div
                ref={listRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto px-3 py-2 font-mono text-xs leading-5"
            >
                {isLoading ? (
                    <p className="text-neutral-400 dark:text-neutral-600 py-4 text-center animate-pulse">Initializing logs…</p>
                ) : (
                    <div key={contentKey}>
                        {filtered.length === 0 ? (
                            <p className="text-neutral-400 dark:text-neutral-600 py-4 text-center">
                                {logs.length === 0 ? 'Waiting for logs…' : 'No matches.'}
                            </p>
                        ) : (
                            filtered.map((entry) => (
                                <LogRow key={entry.id} entry={entry} wrapLines={wrapLines} />
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* ── Footer ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-400 dark:text-neutral-600 flex-shrink-0">
                <span>{filtered.length} / {limitedLogs.length} lines</span>
                <span>
                    {logs.length >= limit ? `last ${limit} buffered` : `${logs.length} buffered`}
                </span>
            </div>
        </div>
    );
}
