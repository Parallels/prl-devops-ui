import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@prl/ui-kit';
import { useSystemStats } from '@/contexts/SystemStatsContext';
import { useSession } from '@/contexts/SessionContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useEventsHub } from '@/contexts/EventsHubContext';
import { useUserConfig } from '@/contexts/UserConfigContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { OrchestratorResource } from '@/interfaces/Orchestrator';
import { HostConfig } from '@/interfaces/Host';
import { devopsService } from '@/services/devops';
import { useModuleView } from '@/components/HostSwitcher/ModuleViewSwitcher';
import { drainUnseenMessages } from '@/utils/messageQueue';
import { SmartGridLayout, type SmartGridItemDefinition, type SmartGridLayoutState } from '@prl/ui-kit/components/SmartGridLayout';
import {
  ARCH_META,
  UNKNOWN_META,
  VmStatCard,
  HostInformationPanel,
  AvailableResourcesPanel,
  CpuUtilizationPanel,
  MemoryUsagePanel,
  GoroutinesPanel,
  VmsPanel,
  HostsPanel,
} from './panels';

const HOME_SMART_GRID_LAYOUT_SLUG = 'home.smart_grid_layout';

export const Home: React.FC = () => {
  const { session, updateHardwareInfo, hasModule } = useSession();
  const { themeColor } = useSystemSettings();
  const { isLoaded: userConfigLoaded, getConfig, setConfig } = useUserConfig();
  const moduleView = useModuleView();
  const config = useConfig();
  const { currentStats, history, setHardwareInfo } = useSystemStats();
  const { containerMessages } = useEventsHub();
  const lastOrchEventIdRef = useRef<string | null>(null);
  const pendingLayoutRef = useRef<SmartGridLayoutState | null>(null);
  const hw = session?.hardwareInfo;
  const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
  const [layoutRenderKey, setLayoutRenderKey] = useState(0);
  const [orchResources, setOrchResources] = useState<OrchestratorResource[]>([]);
  const [orchLoading, setOrchLoading] = useState(false);
  const [orchError, setOrchError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null)


  // Unified resource pages: local host first (when available), then one per
  // orchestrator CPU architecture. Both share the same OrchestratorResource shape.
  // The module view filter determines which pages are included:
  //   'all'          → local host + all orchestrator arch pages
  //   'host'         → local host only
  //   'orchestrator' → orchestrator arch pages only (can be two: ARM64 + x86_64)
  const showLocal = moduleView === 'all' || moduleView === 'host';
  const showOrchestrator = moduleView === 'all' || moduleView === 'orchestrator';

  const resourcePages = useMemo(() => {
    const pages: { title: string; res: OrchestratorResource }[] = [];
    if (showLocal && hw?.total?.logical_cpu_count) {
      pages.push({
        title: `Local Host${hw.cpu_type ? ` / ${hw.cpu_type.toUpperCase()}` : ''}`,
        res: hw as unknown as OrchestratorResource,
      });
    }
    if (showOrchestrator) {
      orchResources.forEach((res) => {
        pages.push({ title: (ARCH_META[res.cpu_type] ?? UNKNOWN_META).label, res });
      });
    }
    return pages;
  }, [hw, orchResources, showLocal, showOrchestrator]);

  // Refresh hardware info on every visit, then persist to the host config
  useEffect(() => {
    if (!session?.hostname) return;

    config.get<HostConfig[]>('hosts').then((hosts) => {
      const currentHost = hosts?.find((h) => h.id === session?.hostId);
      const displayName = currentHost?.name || currentHost?.hostname || session?.serverUrl || 'No Connection';
      setDisplayName(displayName)
    })
    devopsService.config
      .getHardwareInfo(session.hostname)
      .then(async (info) => {
        if (!info) return;
        updateHardwareInfo(info);
        setHardwareInfo(info);

        const hosts = (await config.get<HostConfig[]>('hosts')) ?? [];
        const idx = hosts.findIndex((h) => h.hostname === session.hostname);
        if (idx >= 0) {
          hosts[idx] = { ...hosts[idx], hardwareInfo: info };
          await config.set('hosts', hosts);
          await config.save();
        }
      })
      .catch((err) => console.warn('[Home] Failed to refresh hardware info:', err));
  }, [session?.hostname]);

  const fetchOrchResources = useCallback(() => {
    if (!session?.hostname || !hasModule('orchestrator')) return;
    setOrchLoading(true);
    setOrchError(null);
    devopsService.orchestrator
      .getOrchestratorResources(session.hostname)
      .then((data) => {
        setOrchResources(Array.isArray(data) ? data : [data]);
        setOrchLoading(false);
      })
      .catch((err) => {
        console.warn('[Home] Failed to fetch orchestrator resources:', err);
        setOrchError(String(err?.message ?? err));
        setOrchLoading(false);
      });
  }, [session?.hostname, hasModule]);

  // Fetch orchestrator resources when the module is available
  useEffect(() => {
    if (!session?.hostname || !hasModule('orchestrator')) {
      setOrchResources([]);
      setOrchError(null);
      return;
    }
    fetchOrchResources();
  }, [session?.hostname, hasModule]);

  // Re-fetch orchestrator resources when hosts are added, removed, or deployed
  useEffect(() => {
    const msgs = containerMessages['orchestrator'];
    const unseen = drainUnseenMessages(msgs, lastOrchEventIdRef);
    if (unseen.length === 0) return;

    const shouldRefresh = unseen.some(({ raw }) => raw.message === 'HOST_ADDED' || raw.message === 'HOST_REMOVED' || raw.message === 'HOST_DEPLOYED');
    if (shouldRefresh) fetchOrchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerMessages['orchestrator']]);

  const graphData = useMemo(
    () =>
      [...history].reverse().map((s) => ({
        timestamp: s.timestamp,
        cpuPercent: s.cpuPercent,
        memoryBytes: s.memoryUsedBytes,
        goroutines: s.goroutinesSmoothed,
      })),
    [history],
  );

  const cpuTotal = currentStats ? currentStats.cpuPercent.toFixed(2) : '0.0';

  const autoScaleBytes = (bytes: number): { value: string; unit: string } => {
    if (bytes >= 1024 ** 3) return { value: (bytes / 1024 ** 3).toFixed(2), unit: 'GB' };
    if (bytes >= 1024 ** 2) return { value: (bytes / 1024 ** 2).toFixed(2), unit: 'MB' };
    return { value: (bytes / 1024).toFixed(2), unit: 'KB' };
  };

  const memUsed = currentStats ? autoScaleBytes(currentStats.memoryAllocBytes) : { value: '0.0', unit: 'GB' };
  const memTotal = currentStats ? autoScaleBytes(currentStats.memoryTotalBytes) : { value: '—', unit: 'GB' };
  const memUsedDisplay = `${memUsed.value} ${memUsed.unit}`;
  const memTotalDisplay = `${memTotal.value} ${memTotal.unit}`;
  const hasGraphData = history.length > 0;

  const persistedLayout = getConfig<SmartGridLayoutState | null>(HOME_SMART_GRID_LAYOUT_SLUG, null);

  const handleLayoutChange = useCallback(
    (layout: SmartGridLayoutState) => {
      pendingLayoutRef.current = layout;
      if (!isLayoutEditMode) {
        void setConfig(HOME_SMART_GRID_LAYOUT_SLUG, layout);
      }
    },
    [isLayoutEditMode, setConfig],
  );

  const startLayoutEdit = useCallback(() => {
    pendingLayoutRef.current = null;
    setIsLayoutEditMode(true);
  }, []);

  const saveLayoutEdit = useCallback(() => {
    if (pendingLayoutRef.current) {
      void setConfig(HOME_SMART_GRID_LAYOUT_SLUG, pendingLayoutRef.current);
    }
    pendingLayoutRef.current = null;
    setIsLayoutEditMode(false);
  }, [setConfig]);

  const cancelLayoutEdit = useCallback(() => {
    pendingLayoutRef.current = null;
    setIsLayoutEditMode(false);
    // Force SmartGridLayout to reload from persisted layout snapshot.
    setLayoutRenderKey((prev) => prev + 1);
  }, []);

  const smartGridItems = useMemo<SmartGridItemDefinition[]>(
    () => [
      {
        id: 'system-info-host',
        title: 'Host Information',
        group: 'System Info',
        defaultSpan: 4,
        render: () => <HostInformationPanel hw={hw} />,
      },
      {
        id: 'system-info-resources',
        title: 'Available Resources',
        group: 'System Info',
        defaultSpan: 8,
        render: () => <AvailableResourcesPanel resourcePages={resourcePages} orchLoading={orchLoading} orchError={orchError} />,
      },
      {
        id: 'agent-resources-cpu',
        title: 'CPU Utilization',
        group: 'Agent Resources',
        defaultSpan: 4,
        defaultHidden: !hasGraphData,
        render: () => <CpuUtilizationPanel hasGraphData={hasGraphData} cpuTotal={cpuTotal} graphData={graphData} />,
      },
      {
        id: 'agent-resources-memory',
        title: 'Memory Usage',
        group: 'Agent Resources',
        defaultSpan: 4,
        defaultHidden: !hasGraphData,
        render: () => <MemoryUsagePanel hasGraphData={hasGraphData} memUsedDisplay={memUsedDisplay} memTotalDisplay={memTotalDisplay} graphData={graphData} />,
      },
      {
        id: 'agent-resources-goroutines',
        title: 'Goroutines',
        group: 'Agent Resources',
        defaultSpan: 4,
        defaultHidden: !hasGraphData,
        render: () => <GoroutinesPanel hasGraphData={hasGraphData} goroutinesSmoothed={currentStats?.goroutinesSmoothed} graphData={graphData} />,
      },
      {
        id: 'overview-vms',
        title: 'Virtual Machines',
        description: 'Combined list of all virtual machines from local host and orchestrator, deduplicated.',
        group: 'Overview',
        defaultSpan: 12,
        defaultHidden: true,
        defaultRemoved: !hasModule('host') && !hasModule('orchestrator'),
        render: () => <VmsPanel />,
      },
      {
        id: 'overview-hosts',
        title: 'Hosts',
        description: 'All remote hosts registered in the orchestrator with their addresses and health state.',
        group: 'Overview',
        defaultSpan: 12,
        defaultHidden: true,
        defaultRemoved: !hasModule('orchestrator'),
        render: () => <HostsPanel />,
      },
    ],
    [cpuTotal, currentStats?.goroutinesSmoothed, graphData, hasGraphData, hasModule, hw, memTotalDisplay, memUsedDisplay, orchError, orchLoading, resourcePages],
  );

  return (
    <div className="flex flex-col w-full h-full bg-neutral-50 dark:bg-neutral-950">
      {/* ── Sticky header ───────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-950 px-6 pt-6 pb-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
        <div className="flex gap-2 flex-col grow">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{displayName ?? 'Dashboard'}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Connected {session?.connectedAt ? `since ${new Date(session.connectedAt).toLocaleTimeString()}` : ''}</p>
        </div>
        {isLayoutEditMode ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" accent={true} accentColor="rose" color="slate" size="sm" onClick={cancelLayoutEdit}>
              Cancel
            </Button>
            <Button variant="solid" color="emerald" size="sm" onClick={saveLayoutEdit}>
              Save Layout
            </Button>
          </div>
        ) : (
          <Button variant="solid" color={themeColor} size="sm" leadingIcon="Edit" onClick={startLayoutEdit}>
            Edit Layout
          </Button>
        )}
        {hasModule('notifications') && (
          <div className="flex gap-2">
            <VmStatCard label="No Alerts" value={0} color="emerald" />
          </div>
        )}
      </div>

      {/* ── Scrollable body ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-6 p-6">
        <SmartGridLayout
          key={layoutRenderKey}
          items={smartGridItems}
          persistedLayout={userConfigLoaded ? persistedLayout : null}
          onLayoutChange={handleLayoutChange}
          maxColumns={12}
          editThemeColor={themeColor}
          isEditMode={isLayoutEditMode}
          onEditModeChange={setIsLayoutEditMode}
        />
      </div>
      {/* end scrollable body */}
    </div>
  );
};
