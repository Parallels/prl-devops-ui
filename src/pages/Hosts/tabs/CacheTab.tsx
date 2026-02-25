import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { CustomIcon, formatDate, formatMB } from '@prl/ui-kit';
import { DevOpsRemoteHost } from '@/interfaces/devops';
import type { CatalogCacheResponse, CatalogCacheManifestItem } from '@/interfaces/Cache';
import { useSession } from '@/contexts/SessionContext';
import { devopsService } from '@/services/devops';
import { formatCacheSize } from '@/utils/cacheUtils';

// ── Internal helpers ──────────────────────────────────────────────────────────

function CacheChip({ children, color = 'neutral' }: {
    children: React.ReactNode;
    color?: 'neutral' | 'rose' | 'blue' | 'violet' | 'emerald';
}) {
    const colors = {
        neutral: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
        rose:    'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
        blue:    'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
        violet:  'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors[color]}`}>
            {children}
        </span>
    );
}

function CacheManifestCard({
    manifest,
    isDeleting,
    isConfirming,
    onDelete,
    onCancelConfirm,
}: {
    manifest: CatalogCacheManifestItem;
    isDeleting: boolean;
    isConfirming: boolean;
    onDelete: () => void;
    onCancelConfirm: () => void;
}) {
    const minReq = manifest.minimum_requirements as { cpu?: number; memory?: number; disk?: number } | undefined;
    const archColor: 'rose' | 'blue' | 'neutral' =
        manifest.architecture === 'arm64' ? 'rose'
        : manifest.architecture === 'x86_64' ? 'blue'
        : 'neutral';

    return (
        <div className={classNames(
            'rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden transition-opacity duration-200',
            isDeleting && 'opacity-40 pointer-events-none',
        )}>
            {/* Header */}
            <div className="flex items-start justify-between p-4 pb-3">
                <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 leading-snug mb-1">
                        {manifest.description || manifest.catalog_id}
                    </p>
                    <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 truncate mb-2.5">
                        {manifest.name}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <CacheChip color={archColor}>{manifest.architecture}</CacheChip>
                        <CacheChip color="emerald">{manifest.version}</CacheChip>
                        <CacheChip color="violet">{manifest.type}</CacheChip>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-xl font-bold text-neutral-800 dark:text-neutral-100 leading-none tabular-nums">
                        {formatCacheSize(manifest.cache_size)}
                    </div>
                    <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">cached</div>
                </div>
            </div>

            <div className="h-px bg-neutral-100 dark:bg-neutral-800 mx-4" />

            {/* Details */}
            <div className="px-4 py-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <svg className="h-3.5 w-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Cached {formatDate(manifest.cache_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <svg className="h-3.5 w-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="font-mono text-[10px] truncate" title={manifest.cache_local_path}>
                        {manifest.cache_local_path}
                    </span>
                </div>
                {minReq && (
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-neutral-300 dark:text-neutral-600">
                            min
                        </span>
                        {minReq.cpu != null && (
                            <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                                {minReq.cpu} CPU
                            </span>
                        )}
                        {minReq.memory != null && (
                            <>
                                <span className="text-neutral-200 dark:text-neutral-700">·</span>
                                <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                                    {formatMB(minReq.memory)} RAM
                                </span>
                            </>
                        )}
                        {minReq.disk != null && (
                            <>
                                <span className="text-neutral-200 dark:text-neutral-700">·</span>
                                <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                                    {formatMB(minReq.disk)} disk
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Footer — delete action */}
            <div className="flex items-center justify-end px-4 pb-3">
                {isConfirming ? (
                    <span className="flex items-center gap-1.5">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">Remove?</span>
                        <button type="button" onClick={onDelete}
                            className="px-2.5 py-0.5 rounded-md bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-semibold transition-colors">
                            Yes
                        </button>
                        <button type="button" onClick={onCancelConfirm}
                            className="px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-[11px] font-semibold transition-colors">
                            No
                        </button>
                    </span>
                ) : (
                    <button type="button" onClick={onDelete}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-transparent text-neutral-400 dark:text-neutral-500 hover:border-rose-200 dark:hover:border-rose-800/40 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all">
                        <CustomIcon icon="Trash" className="h-3.5 w-3.5" />
                        Remove
                    </button>
                )}
            </div>
        </div>
    );
}

// ── CacheTab ──────────────────────────────────────────────────────────────────

export function CacheTab({ host }: { host: DevOpsRemoteHost }) {
    const { session } = useSession();
    const [data, setData] = useState<CatalogCacheResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmKey, setConfirmKey] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const hostname = session?.hostname ?? '';
    const manifests = (data?.manifests ?? []) as CatalogCacheManifestItem[];
    const totalSize = data?.total_size ?? 0;
    const cachePath = manifests[0]?.cache_local_path;
    const cacheType = manifests[0]?.cache_type;

    const fetchCache = useCallback(async () => {
        if (!hostname || !host.id) return;
        setLoading(true);
        setError(null);
        try {
            const result = await devopsService.cache.getCatalogCache(hostname, host.id, true);
            setData(result);
        } catch {
            setError('Failed to load cache data');
        } finally {
            setLoading(false);
        }
    }, [hostname, host.id]);

    useEffect(() => { void fetchCache(); }, [fetchCache]);

    const handleDelete = useCallback(async (key: string, catalogId?: string, version?: string) => {
        if (confirmKey !== key) { setConfirmKey(key); return; }
        setConfirmKey(null);
        setDeleting(key);
        try {
            await devopsService.cache.clearCatalogCache(hostname, host.id, catalogId, version, true);
            await fetchCache();
        } catch {
            setError('Failed to clear cache');
        } finally {
            setDeleting(null);
        }
    }, [confirmKey, hostname, host.id, fetchCache]);

    const cancelConfirm = useCallback(() => setConfirmKey(null), []);

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-400 dark:text-neutral-500">
                <CustomIcon icon="Cache" className="h-8 w-8 opacity-30 animate-pulse" />
                <p className="text-sm">Loading cache…</p>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-400 dark:text-neutral-500">
                <p className="text-sm text-rose-500">{error}</p>
                <button type="button" onClick={() => void fetchCache()}
                    className="text-xs text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Summary bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0 flex-wrap">
                <div className="flex items-center gap-2 flex-1 flex-wrap min-w-0">
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        {manifests.length} {manifests.length === 1 ? 'item' : 'items'}
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-700">·</span>
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 tabular-nums">
                        {formatCacheSize(totalSize)} total
                    </span>
                    {cacheType && (
                        <>
                            <span className="text-neutral-300 dark:text-neutral-700">·</span>
                            <CacheChip color="neutral">{cacheType}</CacheChip>
                        </>
                    )}
                    {cachePath && (
                        <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 truncate" title={cachePath}>
                            {cachePath}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {/* Refresh */}
                    <button type="button" onClick={() => void fetchCache()} disabled={loading}
                        className="p-1.5 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40"
                        title="Refresh">
                        <svg className={classNames('h-3.5 w-3.5', loading && 'animate-spin')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                    </button>
                    {/* Clear all */}
                    {manifests.length > 0 && (
                        confirmKey === 'all' ? (
                            <span className="flex items-center gap-1.5">
                                <span className="text-xs text-neutral-500 dark:text-neutral-400">Clear all?</span>
                                <button type="button" onClick={() => void handleDelete('all')}
                                    disabled={deleting === 'all'}
                                    className="px-2.5 py-0.5 rounded-md bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-semibold transition-colors disabled:opacity-50">
                                    Yes
                                </button>
                                <button type="button" onClick={cancelConfirm}
                                    className="px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-[11px] font-semibold transition-colors">
                                    No
                                </button>
                            </span>
                        ) : (
                            <button type="button" onClick={() => void handleDelete('all')}
                                disabled={deleting !== null}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-40">
                                Clear All
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* Manifest list */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                {manifests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-400 dark:text-neutral-500">
                        <CustomIcon icon="Cache" className="h-8 w-8 opacity-30" />
                        <p className="text-sm">No cached manifests</p>
                    </div>
                ) : (
                    manifests.map((manifest) => {
                        const deleteKey = `${manifest.catalog_id}/${manifest.version}`;
                        return (
                            <CacheManifestCard
                                key={manifest.id}
                                manifest={manifest}
                                isDeleting={deleting === deleteKey || deleting === 'all'}
                                isConfirming={confirmKey === deleteKey}
                                onDelete={() => void handleDelete(deleteKey, manifest.catalog_id, manifest.version)}
                                onCancelConfirm={cancelConfirm}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
