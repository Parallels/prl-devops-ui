import { useCallback, useEffect, useState } from 'react';
import { DevOpsRemoteHost } from '@/interfaces/devops';
import { CachePanel } from '@/pages/Cache/CachePanel';
import { EmptyState } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { useSession } from '@/contexts/SessionContext';
import type { CatalogCacheResponse } from '@/interfaces/Cache';

export function CacheTab({ host }: { host: DevOpsRemoteHost }) {
  const { session } = useSession();
  const hostname = session?.hostname ?? '';

  const [data, setData] = useState<CatalogCacheResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    void fetchCache();
  }, [fetchCache]);

  if (!host.enabled || !host.enabled_modules?.includes('cache') || !host.id) {
    return <EmptyState icon="Database" title="Cache information unavailable" subtitle="The host must be enabled with the cache module before cache details can be displayed." fullHeight fullWidth disableBorder />;
  }

  return <CachePanel hostname={hostname} hostId={host.id} isOrchestrator data={data} loading={loading} error={error} onRefresh={() => void fetchCache()} />;
}
