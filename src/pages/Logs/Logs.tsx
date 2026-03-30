import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { formatLogTime, Input, Picker } from '@prl/ui-kit';
import type { PickerItem } from '@prl/ui-kit';
import { useEventsHub } from '@/contexts/EventsHubContext';
import { useSession } from '@/contexts/SessionContext';
import { CustomIcon } from '@/controls';
import { normalizeLevel, levelMeta } from '@/utils/logUtils';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { devopsService } from '@/services/devops';

const LEVEL_PICKER_ITEMS: PickerItem[] = [
    { id: 'debug', title: 'Debug' },
    { id: 'info',  title: 'Info' },
    { id: 'warn',  title: 'Warn' },
    { id: 'error', title: 'Error' },
    { id: 'fatal', title: 'Fatal' },
];

interface HostCacheEntry {
    id: string;
    host: string;
    description: string;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LogMessage {
    level: string;
    message: string;
    time: string;
}

interface MergedEntry {
    id: string;
    ts: number;
    source: string; // 'global' | hostId
    level: string;
    message: string;
    time: string;
}

// ---------------------------------------------------------------------------
// Merged log viewer — handles all selected sources in one sorted stream
// ---------------------------------------------------------------------------
interface MergedLogViewerProps {
    entries: MergedEntry[];
    onClear: () => void;
    showSourceBadge: boolean;
}

const MergedLogViewer: React.FC<MergedLogViewerProps> = ({ entries, onClear, showSourceBadge }) => {
      const { themeColor } = useSystemSettings();
    const [autoScroll, setAutoScroll] = useState(true);
    const [filterLevels, setFilterLevels] = useState<string[]>(() => LEVEL_PICKER_ITEMS.map((i) => i.id));
    const [search, setSearch] = useState('');
    const listRef = useRef<HTMLDivElement>(null);
    const isProgrammaticRef = useRef(false);

    const deferredEntries = useDeferredValue(entries);

    const filtered = useMemo(() => {
        let result = deferredEntries;
        if (filterLevels.length > 0 && filterLevels.length < LEVEL_PICKER_ITEMS.length) {
            result = result.filter((e) => filterLevels.includes(normalizeLevel(e.level)));
        }
        if (search.trim()) {
            let rx: RegExp | null = null;
            try { rx = new RegExp(search.trim(), 'i'); } catch { /* literal fallback */ }
            result = result.filter((e) => {
                return rx ? rx.test(e.message) : e.message.toLowerCase().includes(search.trim().toLowerCase());
            });
        }
        return result;
    }, [deferredEntries, filterLevels, search]);

    React.useLayoutEffect(() => {
        setAutoScroll(true);
        if (listRef.current) listRef.current.scrollTop = 0;
    }, [filterLevels, search]);

    useEffect(() => {
        if (autoScroll && listRef.current) {
            isProgrammaticRef.current = true;
            listRef.current.scrollTop = listRef.current.scrollHeight;
            requestAnimationFrame(() => { isProgrammaticRef.current = false; });
        }
    }, [filtered, autoScroll]);

    const contentKey = `${filterLevels.join(',')}:${search}:${filtered.length === 0 ? 'empty' : 'has'}`;

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-neutral-950">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                <div className="relative flex-1">
                    <CustomIcon icon="Search" className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                    <Input
                        type="text"
                        leadingIcon="Search"
                        value={search}
                        size='sm'
                        tone={themeColor}
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
                <div className="w-50 shrink-0 h-full">
                    <Picker
                        items={LEVEL_PICKER_ITEMS}
                        multi
                        selectedIds={filterLevels}
                        onMultiChange={setFilterLevels}
                        placeholder="All levels"
                        size="sm"
                        color={themeColor}
                        fullWidth
                        fullHeight
                        escapeBoundary
                    />
                </div>
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
                <button
                    type="button"
                    onClick={onClear}
                    disabled={entries.length === 0}
                    className="px-2 py-1 rounded text-xs font-mono border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:border-rose-400 dark:hover:border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Clear logs"
                >✕</button>
            </div>

            {/* Log lines */}
            <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-2 font-mono text-xs leading-5">
                <div key={contentKey}>
                    {filtered.length === 0 ? (
                        <p className="text-neutral-400 dark:text-neutral-600 py-4 text-center">
                            {entries.length === 0 ? 'Waiting for log messages…' : 'No matches.'}
                        </p>
                    ) : (
                        filtered.map((entry) => {
                            const meta = levelMeta(entry.level);
                            return (
                                <div key={entry.id} className={classNames('flex gap-2 py-0.5 hover:bg-neutral-50 dark:hover:bg-white/5 rounded', meta.row)}>
                                    <span className="shrink-0 text-neutral-400 dark:text-neutral-600">{formatLogTime(entry.time)}</span>
                                    <span className={classNames('shrink-0 w-7', meta.badge)}>{meta.label}</span>
                                    {showSourceBadge && (
                                        <span className="shrink-0 max-w-[80px] truncate rounded px-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[10px] leading-[18px]">
                                            {entry.source === 'global' ? 'global' : entry.source}
                                        </span>
                                    )}
                                    <span className="break-all">{entry.message}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-400 dark:text-neutral-600 flex-shrink-0">
                <span>{filtered.length} / {entries.length} lines</span>
                <span>{entries.length > 0 ? `${entries.length} buffered` : 'no logs'}</span>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main Logs page
// ---------------------------------------------------------------------------
export const Logs: React.FC = () => {
    const { themeColor } = useSystemSettings();
    const { session } = useSession();
    const { containerMessages, clearContainer, hostLogs, clearHostLogs } = useEventsHub();
    const [selectedSource, setSelectedSource] = useState<string>('global');
    const [hostCache, setHostCache] = useState<HostCacheEntry[]>([]);

    // Fetch all orchestrator hosts once on mount (and when the connected hostname changes)
    // and cache as a lean { id, host, description } array to avoid repeated API calls.
    useEffect(() => {
        const hostname = session?.hostname;
        if (!hostname) return;
        void devopsService.orchestrator.getOrchestratorHosts(hostname)
            .then((hosts) => {
                setHostCache(
                    (hosts ?? [])
                        .filter((h) => h.id)
                        .map((h) => ({ id: h.id!, host: h.host ?? '', description: h.description ?? '' }))
                );
            })
            .catch(() => { /* non-fatal — names fall back to raw id */ });
    }, [session?.hostname]);

    // Build source list: global + any host that has buffered logs
    const hostIds = useMemo(() => Object.keys(hostLogs).filter((id) => hostLogs[id].length > 0), [hostLogs]);

    const pickerItems = useMemo<PickerItem[]>(() => {
        const items: PickerItem[] = [{ id: 'global', title: 'Global' }];
        for (const id of hostIds) {
            const cached = hostCache.find((h) => h.id === id);
            items.push({ id, title: cached?.description || cached?.host || id });
        }
        return items;
    }, [hostIds, hostCache]);

    // Entries for the selected source
    const entries = useMemo<MergedEntry[]>(() => {
        if (selectedSource === 'global') {
            return (containerMessages['system_logs'] ?? []).map((m) => {
                const body = m.raw.body as LogMessage | null;
                return {
                    id: m.id,
                    ts: body?.time ? (new Date(body.time).getTime() || m.receivedAt) : m.receivedAt,
                    source: 'global',
                    level: body?.level ?? '',
                    message: body?.message ?? '',
                    time: body?.time ?? '',
                };
            }).sort((a, b) => a.ts - b.ts);
        }
        return (hostLogs[selectedSource] ?? []).map((e) => ({
            id: e.id,
            ts: e.ts,
            source: selectedSource,
            level: e.level,
            message: e.message,
            time: e.time,
        }));
    }, [selectedSource, containerMessages, hostLogs]);

    const handleClear = useCallback(() => {
        if (selectedSource === 'global') {
            clearContainer('system_logs');
        } else {
            clearHostLogs(selectedSource);
        }
    }, [selectedSource, clearContainer, clearHostLogs]);

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
            {/* ── Source selector bar ──────────────────────────────────── */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex-shrink-0">
                <CustomIcon icon="Log" className="h-4 w-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider shrink-0">Source</span>
                <div className="w-100">
                    <Picker
                        items={pickerItems}
                        selectedId={selectedSource}
                        onSelect={(item) => setSelectedSource(item.id)}
                        size="sm"
              color={themeColor}
                        fullWidth
                        escapeBoundary
                    />
                </div>
            </div>

            {/* ── Log content ─────────────────────────────────────────── */}
            <div className="flex-1 min-h-0">
                <MergedLogViewer
                    entries={entries}
                    onClear={handleClear}
                    showSourceBadge={false}
                />
            </div>
        </div>
    );
};
