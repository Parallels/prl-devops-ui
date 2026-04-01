import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CustomIcon, DeleteConfirmModal, EmptyState, IconButton, Pill, SplitView, type SplitViewItem, type SplitViewPanelHeaderProps } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { useSession } from '@/contexts/SessionContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import type { DevOpsRemoteHost } from '@/interfaces/devops';
import type { CatalogCacheResponse, CatalogCacheManifestItem, CacheConfig } from '@/interfaces/Cache';
import { CacheHeaderDetails } from '@/components/Cache/CacheHeaderDetails';
import { PageHeaderIcon } from '@/components/PageHeader';
import { CachePanel } from './CachePanel';

// ── Inline label for SplitView list items ─────────────────────────────────────
function CacheItemLabel({ label, state }: { label: string; state?: string }) {
  return (
    <div className="flex gap-2 min-w-0 flex-1 w-full flex-col">
      <span className="grow font-medium truncate">{label}</span>
      {state && (
        <div className="flex items-center">
          <Pill size="sm" tone={state === 'healthy' ? 'emerald' : 'rose'} variant="soft">
            {state.charAt(0).toUpperCase() + state.slice(1)}
          </Pill>
        </div>
      )}
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────
export const Cache: React.FC = () => {
  const { session, hasModule } = useSession();
  const { themeColor } = useSystemSettings();
  const hostname = session?.hostname ?? '';

  const isOrchestratorMode = hasModule('orchestrator');
  const isHostMode = hasModule('host');

  const [hosts, setHosts] = useState<DevOpsRemoteHost[]>([]);
  const [hostsLoading, setHostsLoading] = useState(false);
  const [hostsError, setHostsError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  // ── Cache data for the active panel ────────────────────────────────────────
  const [cacheData, setCacheData] = useState<CatalogCacheResponse | null>(null);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [cacheError, setCacheError] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const activeHostId = selectedId === 'local' || !selectedId ? undefined : selectedId;
  const activeIsOrchestrator = isOrchestratorMode && !!selectedId && selectedId !== 'local';

  const fetchHosts = useCallback(async () => {
    if (!isOrchestratorMode || !hostname) return;
    setHostsLoading(true);
    setHostsError(null);
    try {
      const data = await devopsService.orchestrator.getOrchestratorHosts(hostname);
      setHosts(data ?? []);
    } catch (err: any) {
      setHostsError(err?.message ?? 'Failed to load hosts');
    } finally {
      setHostsLoading(false);
    }
  }, [hostname, isOrchestratorMode]);

  const fetchCacheData = useCallback(async () => {
    if (!hostname || !selectedId) return;
    setCacheLoading(true);
    setCacheError(null);
    try {
      const result = await devopsService.cache.getCatalogCache(hostname, activeHostId, activeIsOrchestrator);
      setCacheData(result);
    } catch {
      setCacheError('Failed to load cache data');
    } finally {
      setCacheLoading(false);
    }
  }, [hostname, selectedId, activeHostId, activeIsOrchestrator]);

  useEffect(() => {
    void fetchHosts();
  }, [fetchHosts]);

  useEffect(() => {
    setCacheData(null);
    void fetchCacheData();
  }, [fetchCacheData]);

  // Auto-select first item after load
  useEffect(() => {
    if (selectedId) return;
    if (isHostMode) {
      setSelectedId('local');
    } else if (isOrchestratorMode && hosts.length > 0) {
      setSelectedId(hosts[0].id);
    }
  }, [isOrchestratorMode, isHostMode, hosts, selectedId]);

  // ── Derived cache state ────────────────────────────────────────────────────
  const manifests = useMemo(() => [...new Map((cacheData?.manifests ?? []).map((m) => [m.id, m])).values()] as CatalogCacheManifestItem[], [cacheData]);
  const totalSize = cacheData?.total_size ?? 0;
  const cacheType = manifests[0]?.cache_type;
  const cachePath = manifests[0]?.cache_local_path;
  const config = (cacheData?.cache_config ?? null) as CacheConfig | null;

  // ── Clear All ──────────────────────────────────────────────────────────────
  const executeClearAll = useCallback(async () => {
    setClearingAll(true);
    try {
      await devopsService.cache.clearCatalogCache(hostname, activeHostId, undefined, undefined, activeIsOrchestrator);
      setShowClearAllModal(false);
      await fetchCacheData();
    } catch {
      setCacheError('Failed to clear cache');
    } finally {
      setClearingAll(false);
    }
  }, [hostname, activeHostId, activeIsOrchestrator, fetchCacheData]);

  // ── Panel header ───────────────────────────────────────────────────────────
  const panelHeaderProps = useMemo((): SplitViewPanelHeaderProps => {
    const maxSize = config?.max_size ?? 0;
    const hasConfig = config !== null && maxSize > 0;
    const usedPct = hasConfig ? Math.min(100, (totalSize / maxSize) * 100) : 0;
    const isWarning = usedPct >= 85;
    return {
      icon: (
        <PageHeaderIcon color={themeColor}>
          <CustomIcon icon="Cache" className="w-5 h-5" />
        </PageHeaderIcon>
      ),
      actions: (
        <>
          {manifests.length > 0 && (
            <IconButton tooltip='Clear All' variant="ghost" color="rose" icon="Trash" size="sm" onClick={() => setShowClearAllModal(true)}/>
          )}
          <IconButton tooltip='Refresh' icon="Refresh" variant="ghost" size="xs" onClick={() => void fetchCacheData()} disabled={cacheLoading} loading={cacheLoading} color={themeColor} />
        </>
      ),
      headerDetails:
        totalSize > 0 || hasConfig
          ? {
              tone: 'white',
              variant: 'simple',
              headerBody: (
                <div className="flex items-start justify-between gap-4 ">
                  <div className="min-w-0 mt-1 grow text-[12px] text-neutral-600 dark:text-neutral-400">
                    <CacheHeaderDetails totalSize={totalSize} itemCount={manifests.length} config={config} cacheType={cacheType} cachePath={cachePath} />
                  </div>
                  {hasConfig && (
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${isWarning ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'}`}
                      >
                        {(100 - usedPct).toFixed(0)}% free
                      </span>
                    </div>
                  )}
                </div>
              ),
              bordered: false,
            }
          : undefined,
    };
  }, [config, totalSize, manifests, cacheType, cachePath, cacheLoading, fetchCacheData]);

  // ── Items ──────────────────────────────────────────────────────────────────
  const items = useMemo<SplitViewItem[]>(() => {
    const result: SplitViewItem[] = [];
    if (isHostMode) {
      result.push({
        id: 'local',
        tags: ['host'],
        label: <CacheItemLabel label="Local Cache" />,
        icon: 'Cache',
        panel: <CachePanel hostname={hostname} data={cacheData} loading={cacheLoading} error={cacheError} onRefresh={() => void fetchCacheData()} />,
      });
    }
    if (isOrchestratorMode) {
      for (const host of hosts) {
        const hostName = host.description || host.host;
        result.push({
          id: host.id ?? '',
          tags: ['orchestrator'],
          label: <CacheItemLabel label={`${hostName} Cache`} state={host.state} />,
          icon: 'Cache',
          panel: <CachePanel hostname={hostname} hostId={host.id} isOrchestrator data={cacheData} loading={cacheLoading} error={cacheError} onRefresh={() => void fetchCacheData()} />,
        });
      }
    }
    return result;
  }, [isOrchestratorMode, isHostMode, hosts, hostname, cacheData, cacheLoading, cacheError, fetchCacheData]);

  return (
    <div className="relative flex h-full min-h-0">
      <SplitView
        className="flex-1 min-w-0"
        items={items}
        value={selectedId}
        onChange={(id) => setSelectedId(id)}
        loading={hostsLoading}
        error={hostsError ?? undefined}
        onRetry={() => void fetchHosts()}
        listTitle="Cache"
        autoHideList={false}
        borderLeft
        color={themeColor}
        collapsible
        resizable
        autoExpand={false}
        minListWidth={220}
        panelHeaderProps={panelHeaderProps}
        panelScrollable={false}
        emptyState={
          <EmptyState
            disableBorder
            icon="Cache"
            title="There are no cache sources"
            subtitle="We couldn't find any cache sources to display."
            tone="neutral"
          />
        }
        panelEmptyState={
          <EmptyState
            disableBorder
            icon="Cache"
            title="There are no cache sources"
            subtitle="We couldn't find any cache sources to display."
            tone="neutral"
          />
        }
      />

      <DeleteConfirmModal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        onConfirm={() => void executeClearAll()}
        title="Clear All Cache"
        icon="Trash"
        confirmLabel={clearingAll ? 'Clearing…' : 'Clear All'}
        isConfirmDisabled={clearingAll}
        confirmValue="all"
        confirmValueLabel="confirmation string"
        size="md"
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400">This action is irreversible. All cached manifests and items will be deleted. Type "all" to confirm.</p>
      </DeleteConfirmModal>
    </div>
  );
};
