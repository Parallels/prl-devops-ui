import React, { useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';
import { formatLogTime } from '@prl/ui-kit';
import { useEventsHub } from '@/contexts/EventsHubContext';
import { CustomIcon } from '@/controls';
import { normalizeLevel, LEVEL_META, levelMeta } from '@/utils/logUtils';
import { LogViewer } from '@/components/LogViewer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LogMessage {
    level: string;
    message: string;
    time: string;
}

type LogTarget = 'global' | string; // 'global' or a hostId

// ---------------------------------------------------------------------------
// Global log viewer (system_logs container)
// ---------------------------------------------------------------------------
const GlobalLogViewer: React.FC<{ onClear: () => void }> = ({ onClear }) => {
    const { containerMessages } = useEventsHub();
    const [autoScroll, setAutoScroll] = React.useState(true);
    const [filterLevel, setFilterLevel] = React.useState('');
    const [search, setSearch] = React.useState('');
    const listRef = React.useRef<HTMLDivElement>(null);
    const isProgrammaticRef = React.useRef(false);

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
            result = result.filter((m) => m._level === filterLevel);
        }
        if (search.trim()) {
            let rx: RegExp | null = null;
            try { rx = new RegExp(search.trim(), 'i'); } catch { /* literal fallback */ }
            result = result.filter((m) => {
                const msg = m._body?.message ?? '';
                return rx ? rx.test(msg) : msg.toLowerCase().includes(search.trim().toLowerCase());
            });
        }
        return result;
    }, [logMessages, filterLevel, search]);

    React.useLayoutEffect(() => {
        setAutoScroll(true);
        if (listRef.current) listRef.current.scrollTop = 0;
    }, [filterLevel, search]);

    React.useEffect(() => {
        if (autoScroll && listRef.current) {
            isProgrammaticRef.current = true;
            listRef.current.scrollTop = listRef.current.scrollHeight;
            requestAnimationFrame(() => { isProgrammaticRef.current = false; });
        }
    }, [filtered, autoScroll]);

    const contentKey = `${filterLevel}:${search}:${filtered.length === 0 ? 'empty' : 'has'}`;

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-neutral-950">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
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
                <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 text-xs font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-sky-400 dark:focus:border-sky-500/50"
                >
                    <option value="">All</option>
                    {(['debug', 'info', 'warn', 'error', 'fatal'] as const).map((l) => (
                        <option key={l} value={l}>{LEVEL_META[l].label}</option>
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
                <button
                    type="button"
                    onClick={onClear}
                    disabled={logMessages.length === 0}
                    className="px-2 py-1 rounded text-xs font-mono border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:border-rose-400 dark:hover:border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Clear logs"
                >✕</button>
            </div>

            {/* Log lines */}
            <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-2 font-mono text-xs leading-5">
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

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-400 dark:text-neutral-600 flex-shrink-0">
                <span>{filtered.length} / {logMessages.length} lines</span>
                <span>{logMessages.length > 0 ? `${logMessages.length} buffered` : 'no logs'}</span>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main Logs page
// ---------------------------------------------------------------------------
export const Logs: React.FC = () => {
    const { clearContainer, hostLogs, clearHostLogs } = useEventsHub();
    const [target, setTarget] = useState<LogTarget>('global');

    // Build target list: global + any host that has buffered logs
    const hostIds = useMemo(() => Object.keys(hostLogs).filter((id) => hostLogs[id].length > 0), [hostLogs]);

    const handleClear = useCallback(() => {
        if (target === 'global') {
            clearContainer('system_logs');
        } else {
            clearHostLogs(target);
        }
    }, [target, clearContainer, clearHostLogs]);

    const targetLogs = target !== 'global' ? (hostLogs[target] ?? []) : [];

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
            {/* ── Target selector bar ─────────────────────────────────── */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex-shrink-0">
                <CustomIcon icon="Log" className="h-4 w-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider shrink-0">Source</span>
                <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value as LogTarget)}
                    className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 text-xs font-mono text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-sky-400 dark:focus:border-sky-500/50"
                >
                    <option value="global">Global</option>
                    {hostIds.map((id) => (
                        <option key={id} value={id}>{id}</option>
                    ))}
                </select>
            </div>

            {/* ── Log content ─────────────────────────────────────────── */}
            <div className="flex-1 min-h-0">
                {target === 'global' ? (
                    <GlobalLogViewer onClear={handleClear} />
                ) : (
                    <LogViewer
                        key={target}
                        logs={targetLogs}
                        configSlug={`logs::${target}::config`}
                        onClear={handleClear}
                    />
                )}
            </div>
        </div>
    );
};
