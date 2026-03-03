import classNames from 'classnames';
import { Calendar, Folder, IconButton, MultiProgressBar, Panel, Pill, ThemeColor, formatDate, formatMB } from '@prl/ui-kit';
import type { CatalogCacheManifestItem } from '@/interfaces/Cache';
import { formatCacheSize } from '@/utils/cacheUtils';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

export function CacheManifestCard({
    manifest,
    isDeleting,
    onDelete,
    index,
    totalCacheSize,
    maxSize,
    seriesColor,
}: {
    manifest: CatalogCacheManifestItem;
    isDeleting: boolean;
    onDelete: () => void;
    index: number;
    totalCacheSize: number;
    maxSize?: number;
    seriesColor: string;
}) {
    const { themeColor } = useSystemSettings();
    const minReq = manifest.minimum_requirements as { cpu?: number; memory?: number; disk?: number } | undefined;
    const archColor: ThemeColor =
        manifest.architecture === 'arm64' ? 'rose'
            : manifest.architecture === 'x86_64' ? 'blue'
                : 'neutral';

    const effectiveTotal = (maxSize ?? 0) > 0 ? maxSize! : totalCacheSize;
    const pct = effectiveTotal > 0 ? (manifest.cache_size / effectiveTotal) * 100 : 0;
    const quotaLabel = (maxSize ?? 0) > 0 ? 'quota' : 'total';

    return (
        <Panel
            variant='glass'
            padding='none'
            tone={themeColor}
            className={classNames(
                'transition-opacity duration-200',
                isDeleting && 'opacity-40 pointer-events-none',
            )}
            style={{
                animation: 'fadeIn 0.3s ease both',
                animationDelay: `${index * 0.045}s`,
            }}
        >
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
                        <Pill tone={archColor}>{manifest.architecture}</Pill>
                        <Pill tone="emerald">{manifest.version}</Pill>
                        <Pill tone="violet">{manifest.type}</Pill>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-xl font-bold text-neutral-800 dark:text-neutral-100 leading-none tabular-nums">
                        {formatCacheSize(manifest.cache_size)}
                    </div>
                    <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">cached</div>
                </div>
            </div>

            {/* Per-card proportion bar */}
            <MultiProgressBar
                label=""
                labelClassName="hidden"
                secondaryLabel={`${pct.toFixed(1)}% of ${quotaLabel}`}
                secondaryLabelClassName="text-[10px] text-neutral-400 dark:text-neutral-500"
                total={effectiveTotal}
                series={[{
                    key: 'item',
                    label: manifest.description || manifest.catalog_id,
                    value: manifest.cache_size,
                    color: seriesColor,
                    displayValue: formatCacheSize(manifest.cache_size),
                }]}
                className="px-4 pb-1"
            />

            {/* Details */}
            <div className="px-4 py-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <Calendar className="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
                    <span>Cached {formatDate(manifest.cache_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <Folder className="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
                    <span className="font-mono text-[10px] truncate" title={manifest.cache_local_path}>
                        {manifest.cache_local_path}
                    </span>
                </div>
                {minReq && (
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-neutral-400 dark:text-neutral-600">Requirements:</span>
                        {minReq.cpu != null && (
                            <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">{minReq.cpu} CPU</span>
                        )}
                        {minReq.memory != null && (
                            <>
                                <span className="text-neutral-500 dark:text-neutral-700">·</span>
                                <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">{formatMB(minReq.memory)} RAM</span>
                            </>
                        )}
                        {minReq.disk != null && (
                            <>
                                <span className="text-neutral-500 dark:text-neutral-700">·</span>
                                <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">{formatMB(minReq.disk)} disk</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Footer — delete action */}
            <div className="flex items-center justify-end px-4 pb-3">
                <IconButton
                    variant='ghost'
                    size='sm'
                    icon="Trash"
                    color="rose"
                    aria-label={`Delete ${manifest.description} ${manifest.version} ${manifest.architecture} cache`}
                    onClick={onDelete} />
            </div>
        </Panel>
    );
}
