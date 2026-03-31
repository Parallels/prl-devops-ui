import { useEffect, useState } from 'react';
import classNames from 'classnames';
import { Folder, Pill } from '@prl/ui-kit';
import type { CacheConfig } from '@/interfaces/Cache';
import { formatCacheSize } from '@/utils/cacheUtils';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

export interface CacheHeaderDetailsProps {
  totalSize: number;
  itemCount: number;
  config: CacheConfig | null;
  cacheType?: string;
  cachePath?: string;
}

export function CacheHeaderDetails({ totalSize, itemCount, config, cacheType, cachePath }: CacheHeaderDetailsProps) {
  const maxSize = config?.max_size ?? 0;
  const usedPct = maxSize > 0 ? Math.min(100, (totalSize / maxSize) * 100) : 0;
  const isWarning = usedPct >= 85;
  const availableMb = maxSize > 0 ? Math.max(0, maxSize - totalSize) : 0;
  const hasConfig = config !== null && maxSize > 0;
  const { themeColor } = useSystemSettings();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, [usedPct]);

  const usedBarColor = isWarning ? 'bg-amber-500 dark:bg-amber-400' : 'bg-red-500 dark:bg-red-400';

  if (!hasConfig) {
    return (
      <div className="flex bg-red-500 items-center gap-2 flex-wrap text-xs text-neutral-500 dark:text-neutral-400">
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
        <span className="text-neutral-300 dark:text-neutral-700">·</span>
        <span className="font-bold text-neutral-700 dark:text-neutral-300 tabular-nums">{formatCacheSize(totalSize)} total</span>
        {cacheType && (
          <>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <Pill color="neutral">{cacheType}</Pill>
          </>
        )}
        {cachePath && (
          <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 truncate" title={cachePath}>
            {cachePath}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Animated quota bar */}
      <div className="h-3 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden relative">
        <div
          className={classNames('absolute inset-y-0 left-0 rounded-full', usedBarColor)}
          style={{
            width: mounted ? `${usedPct}%` : '0%',
            transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {isWarning && (
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-white/20 to-transparent" style={{ animation: 'shimmer 2s infinite linear' }} />
            </div>
          )}
        </div>
      </div>

      {/* Stat chips row */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-neutral-500 dark:text-neutral-400 tabular-nums">
          <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{itemCount}</span> {itemCount === 1 ? 'item' : 'items'}
        </span>
        <span className="text-neutral-300 dark:text-neutral-700">·</span>
        <span className="text-red-600 dark:text-red-400 font-bold tabular-nums">{formatCacheSize(totalSize)} used</span>
        <span className="text-neutral-300 dark:text-neutral-700">·</span>
        <span className="text-neutral-400 dark:text-neutral-500 tabular-nums">{formatCacheSize(availableMb)} available</span>
        <span className="text-neutral-300 dark:text-neutral-700">·</span>
        <span className="text-neutral-500 dark:text-neutral-400">
          Quota: <span className="font-medium">{formatCacheSize(maxSize)}</span>
        </span>
        {cacheType && (
          <>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <Pill color={themeColor}>{cacheType}</Pill>
          </>
        )}
      </div>

      {/* Config info row */}
      <div className="flex items-center gap-2 flex-wrap text-[10px] text-neutral-400 dark:text-neutral-500">
        {config.folder && (
          <>
            <Folder className="w-4 h-4 shrink-0" />
            <span className="font-mono truncate max-w-50" title={config.folder}>
              {config.folder}
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
          </>
        )}
        <span className="flex items-center gap-1">
          <span className={classNames('w-2 h-2 rounded-full inline-block', config.enabled ? 'bg-emerald-500' : 'bg-neutral-400')} />
          {config.enabled ? 'Enabled' : 'Disabled'}
        </span>
        {config.keep_free_disk_space > 0 && (
          <>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span>Keeps {formatCacheSize(config.keep_free_disk_space)} free on disk</span>
          </>
        )}
      </div>

      {/* Shimmer keyframe */}
      <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
            `}</style>
    </div>
  );
}
