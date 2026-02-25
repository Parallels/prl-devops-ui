import { useCallback, useEffect, useMemo, useState } from 'react';
import { CustomIcon, DeleteConfirmModal, MultiProgressBar, type MultiProgressBarSeries } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import type { CatalogCacheResponse, CatalogCacheManifestItem, CacheConfig } from '@/interfaces/Cache';
import { formatCacheSize } from '@/utils/cacheUtils';
import { MANIFEST_COLORS } from './cacheConstants';
import { DiskStorageWidget } from './DiskStorageWidget';
import { CacheManifestCard } from './CacheManifestCard';
import { PageHeaderIcon } from '@/components/PageHeader';

export interface CachePanelProps {
    hostname: string;
    hostId?: string;
    isOrchestrator?: boolean;
}

export function CachePanel({ hostname, hostId, isOrchestrator = false }: CachePanelProps) {
    const [data, setData] = useState<CatalogCacheResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'all' } | { type: 'manifest', key: string, catalogId?: string, version?: string, name: string } | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const manifests = (data?.manifests ?? []) as CatalogCacheManifestItem[];
    const totalSize = data?.total_size ?? 0;
    const cachePath = manifests[0]?.cache_local_path;
    const cacheType = manifests[0]?.cache_type;
    const config = (data?.cache_config ?? null) as CacheConfig | null;
    const maxSize = config?.max_size ?? 0;
    const effectiveTotal = maxSize > 0 ? maxSize : totalSize;

    // Build multi-series for the aggregate breakdown bar
    const allSeries = useMemo<MultiProgressBarSeries[]>(() => {
        if (manifests.length === 0) return [];
        const series: MultiProgressBarSeries[] = manifests.map((m, i) => ({
            key: m.id || `manifest-${i}`,
            label: m.description || m.catalog_id,
            value: m.cache_size,
            color: MANIFEST_COLORS[i % MANIFEST_COLORS.length],
            displayValue: formatCacheSize(m.cache_size),
        }));
        if (maxSize > 0) {
            const freeSpace = Math.max(0, maxSize - totalSize);
            if (freeSpace > 0) {
                series.push({
                    key: '__free__',
                    label: 'Free',
                    value: freeSpace,
                    color: 'bg-neutral-300 dark:bg-neutral-600',
                    displayValue: formatCacheSize(freeSpace),
                });
            }
        }
        return series;
    }, [manifests, totalSize, maxSize]);

    const fetchCache = useCallback(async () => {
        if (!hostname) return;
        setLoading(true);
        setError(null);
        try {
            const result = await devopsService.cache.getCatalogCache(hostname, hostId, isOrchestrator);
            setData(result);
        } catch {
            setError('Failed to load cache data');
        } finally {
            setLoading(false);
        }
    }, [hostname, hostId, isOrchestrator]);

    useEffect(() => { void fetchCache(); }, [fetchCache]);

    const executeDelete = useCallback(async () => {
        if (!itemToDelete) return;

        const key = itemToDelete.type === 'manifest' ? itemToDelete.key : 'all';
        setDeleting(key);
        try {
            if (itemToDelete.type === 'manifest') {
                await devopsService.cache.clearCatalogCache(hostname, hostId, itemToDelete.catalogId, itemToDelete.version, isOrchestrator);
            } else {
                await devopsService.cache.clearCatalogCache(hostname, hostId, undefined, undefined, isOrchestrator);
            }
            setItemToDelete(null);
            await fetchCache();
        } catch {
            setError('Failed to clear cache');
        } finally {
            setDeleting(null);
        }
    }, [itemToDelete, hostname, hostId, isOrchestrator, fetchCache]);

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
            {/* Storage widget */}
            <DiskStorageWidget
                totalSize={totalSize}
                itemCount={manifests.length}
                config={config}
                loading={loading}
                cacheType={cacheType}
                cachePath={cachePath}
                onRefresh={() => void fetchCache()}
                onClearAll={() => setItemToDelete({ type: 'all' })}
                canClear={manifests.length > 0}
            />

            {/* Manifest list */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                {manifests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-400 dark:text-neutral-500">
                        <PageHeaderIcon color="rose"><CustomIcon icon="Host" className="w-5 h-5" /></PageHeaderIcon>
                        <p className="text-sm">No cached manifests</p>
                    </div>
                ) : (
                    <>
                        {/* Aggregate breakdown bar */}
                        <div
                            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 pt-4 pb-3 bg-red"
                            style={{ animation: 'fadeIn 0.3s ease both' }}
                        >
                            <MultiProgressBar
                                label="Storage breakdown"
                                labelClassName="text-xs font-semibold text-neutral-700 dark:text-neutral-200"
                                secondaryLabel={`${manifests.length} ${manifests.length === 1 ? 'item' : 'items'}`}
                                secondaryLabelClassName="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5"
                                total={effectiveTotal}
                                totalLabel={
                                    <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                                        {formatCacheSize(effectiveTotal)}
                                    </span>
                                }
                                series={allSeries}
                            />
                        </div>

                        {/* Individual manifest cards */}
                        {manifests.map((manifest, index) => {
                            const deleteKey = `${manifest.catalog_id}/${manifest.version}`;
                            return (
                                <CacheManifestCard
                                    key={manifest.id}
                                    manifest={manifest}
                                    isDeleting={deleting === deleteKey || deleting === 'all'}
                                    onDelete={() => setItemToDelete({ type: 'manifest', key: deleteKey, catalogId: manifest.catalog_id, version: manifest.version, name: manifest.description || manifest.catalog_id || 'manifest' })}
                                    index={index}
                                    totalCacheSize={totalSize}
                                    maxSize={maxSize > 0 ? maxSize : undefined}
                                    seriesColor={MANIFEST_COLORS[index % MANIFEST_COLORS.length]}
                                />
                            );
                        })}
                    </>
                )}
            </div>

            <DeleteConfirmModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={() => void executeDelete()}
                title={itemToDelete?.type === 'all' ? 'Clear All Cache' : 'Delete Cached Manifest'}
                icon={itemToDelete?.type === 'all' ? 'Trash' : 'Trash'}
                confirmLabel={deleting ? (itemToDelete?.type === 'all' ? 'Clearing…' : 'Deleting…') : (itemToDelete?.type === 'all' ? 'Clear All' : 'Delete')}
                isConfirmDisabled={!!deleting}
                confirmValue={itemToDelete?.type === 'all' ? 'all' : itemToDelete?.name ?? ''}
                confirmValueLabel={itemToDelete?.type === 'all' ? 'confirmation string' : 'manifest name'}
                size="md"
            >
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {itemToDelete?.type === 'all'
                        ? 'This action is irreversible. All cached manifests and items will be deleted. Type "all" to confirm.'
                        : 'This action is irreversible. The cached contents for this manifest will be deleted.'}
                </p>
            </DeleteConfirmModal>
        </div>
    );
}
