import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { CustomIcon, formatLogTime } from '@prl/ui-kit';
import { DevOpsRemoteHost } from '@/interfaces/devops';
import { useHostLogs } from '@/contexts/EventsHubContext';
import { levelMeta } from '@/utils/logUtils';

export function LogsTab({ host }: { host: DevOpsRemoteHost }) {
    const logs = useHostLogs(host.id || '');
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState<string>('');
    const listRef = useRef<HTMLDivElement>(null);
    const isProgrammaticRef = useRef(false);
    const [autoScroll, setAutoScroll] = useState(true);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return logs.filter((e) => {
            if (levelFilter && e.level !== levelFilter) return false;
            if (q && !e.message.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [logs, search, levelFilter]);

    // Reset scroll to top whenever the filter changes — guarantees old nodes
    // are scrolled out of view before React paints the new filtered content.
    useLayoutEffect(() => {
        if (listRef.current) listRef.current.scrollTop = 0;
    }, [search, levelFilter]);

    // Auto-scroll to bottom (newest last — terminal style)
    useEffect(() => {
        if (autoScroll && listRef.current) {
            isProgrammaticRef.current = true;
            listRef.current.scrollTop = listRef.current.scrollHeight;
            requestAnimationFrame(() => { isProgrammaticRef.current = false; });
        }
    }, [filtered, autoScroll]);

    const handleScroll = useCallback(() => {
        if (isProgrammaticRef.current || !listRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        setAutoScroll(scrollHeight - scrollTop - clientHeight < 40);
    }, []);

    // A key that changes whenever filters change — forces React to fully
    // unmount and remount the content area so no stale DOM nodes linger.
    const contentKey = `${levelFilter}:${search}:${filtered.length === 0 ? 'empty' : 'has'}`;

    return (
        <div className="flex flex-col h-full min-h-0 bg-white dark:bg-neutral-950">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                <div className="relative flex-1">
                    <CustomIcon icon="Search" className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter logs…"
                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded pl-7 pr-3 py-1 text-xs font-mono text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-sky-400 dark:focus:border-sky-500/50"
                    />
                </div>
                <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 text-xs font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-sky-400 dark:focus:border-sky-500/50"
                >
                    <option value="">All</option>
                    {['debug', 'info', 'warn', 'error', 'fatal'].map((l) => (
                        <option key={l} value={l}>{l}</option>
                    ))}
                </select>
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
            </div>

            {/* Log lines */}
            <div
                ref={listRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto px-3 py-2 font-mono text-xs leading-5"
            >
                <div key={contentKey}>
                    {filtered.length === 0 ? (
                        <p className="text-neutral-400 dark:text-neutral-600 py-4 text-center">
                            {logs.length === 0 ? 'Waiting for logs…' : 'No matches.'}
                        </p>
                    ) : (
                        filtered.map((entry) => {
                            const meta = levelMeta(entry.level);
                            return (
                                <div key={entry.id} className={classNames('flex gap-2 py-0.5 hover:bg-neutral-50 dark:hover:bg-white/5 rounded', meta.row)}>
                                    <span className="shrink-0 text-neutral-400 dark:text-neutral-600">{formatLogTime(entry.time)}</span>
                                    <span className={classNames('shrink-0 w-7', meta.badge)}>{meta.label}</span>
                                    <span className="break-all">{entry.message}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-400 dark:text-neutral-600 flex-shrink-0">
                <span>{filtered.length} / {logs.length} lines</span>
                <span>{logs.length === 100 ? 'last 100' : `${logs.length} buffered`}</span>
            </div>
        </div>
    );
}
