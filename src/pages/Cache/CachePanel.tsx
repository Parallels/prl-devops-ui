import { useCallback, useMemo, useState } from 'react';
import { CustomIcon, DeleteConfirmModal, EmptyState, MultiProgressBar, type MultiProgressBarSeries } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import type { CatalogCacheResponse, CatalogCacheManifestItem, CacheConfig } from '@/interfaces/Cache';
import { formatCacheSize } from '@/utils/cacheUtils';
import { MANIFEST_COLORS } from '@/components/Cache/cacheConstants';
import { CacheManifestCard } from '@/components/Cache/CacheManifestCard';

export interface CachePanelProps {
  hostname: string;
  hostId?: string;
  isOrchestrator?: boolean;
  data: CatalogCacheResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function CachePanel({ hostname, hostId, isOrchestrator = false, data, loading, error, onRefresh }: CachePanelProps) {
  const [itemToDelete, setItemToDelete] = useState<{ key: string; catalogId?: string; version?: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const manifests = [...new Map((data?.manifests ?? []).map((m) => [m.id, m])).values()] as CatalogCacheManifestItem[];
  const totalSize = data?.total_size ?? 0;
  const config = (data?.cache_config ?? null) as CacheConfig | null;
  const maxSize = config?.max_size ?? 0;
  const effectiveTotal = maxSize > 0 ? maxSize : totalSize;

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

  const executeDelete = useCallback(async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await devopsService.cache.clearCatalogCache(hostname, hostId, itemToDelete.catalogId, itemToDelete.version, isOrchestrator);
      setItemToDelete(null);
      onRefresh();
    } catch {
      // error handled by parent refresh
    } finally {
      setDeleting(false);
    }
  }, [itemToDelete, hostname, hostId, isOrchestrator, onRefresh]);

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
      <div className="flex w-full h-full items-center justify-center gap-3 py-16 text-neutral-400 dark:text-neutral-500">
        <EmptyState disableBorder icon="Warning" iconColor="rose" title="Error" subtitle={error} />
      </div>
    );
  }

  if (manifests.length === 0) {
    return (
      <div className="flex w-full h-full items-center justify-center gap-3 py-16 text-neutral-400 dark:text-neutral-500">
        <EmptyState disableBorder icon="Cache" title="No cached items" subtitle="There are no cached catalog manifests in this host" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {/* Aggregate breakdown bar */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 pt-4 pb-3" style={{ animation: 'fadeIn 0.3s ease both' }}>
          <MultiProgressBar
            label="Storage breakdown"
            labelClassName="text-xs font-semibold text-neutral-700 dark:text-neutral-200"
            secondaryLabel={`${manifests.length} ${manifests.length === 1 ? 'item' : 'items'}`}
            secondaryLabelClassName="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5"
            total={effectiveTotal}
            totalLabel={<span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">{formatCacheSize(effectiveTotal)}</span>}
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
              isDeleting={deleting && itemToDelete?.key === deleteKey}
              onDelete={() => setItemToDelete({ key: deleteKey, catalogId: manifest.catalog_id, version: manifest.version, name: manifest.description || manifest.catalog_id || 'manifest' })}
              index={index}
              totalCacheSize={totalSize}
              maxSize={maxSize > 0 ? maxSize : undefined}
              seriesColor={MANIFEST_COLORS[index % MANIFEST_COLORS.length]}
            />
          );
        })}
      </div>

      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => void executeDelete()}
        title="Delete Cached Manifest"
        icon="Trash"
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        isConfirmDisabled={deleting}
        confirmValue={itemToDelete?.name ?? ''}
        confirmValueLabel="manifest name"
        size="md"
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400">This action is irreversible. The cached contents for this manifest will be deleted.</p>
      </DeleteConfirmModal>
    </div>
  );
}
