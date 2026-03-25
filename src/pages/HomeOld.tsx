import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PagedPanel, Panel, Pill, StatGraphTile, MultiProgressBar, formatMB, ThemeColor, InfoRow, Section } from '@prl/ui-kit';
import { useSystemStats } from '@/contexts/SystemStatsContext';
import { useSession } from '@/contexts/SessionContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useEventsHub } from '@/contexts/EventsHubContext';
import { OrchestratorResource } from '@/interfaces/Orchestrator';
import { HostConfig } from '@/interfaces/Host';
import { devopsService } from '@/services/devops';
import { useModuleView } from '@/components/HostSwitcher/ModuleViewSwitcher';
import { drainUnseenMessages } from '@/utils/messageQueue';

// ── Orchestrator resource card ────────────────────────────────────────────────

const ARCH_META: Record<string, { label: string; short: string; accent: string; bg: string; border: string; chip: string }> = {
  arm64: {
    label: 'Apple Silicon / ARM',
    short: 'ARM64',
    accent: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800/60',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
  },
  x86_64: {
    label: 'Intel / AMD (x86)',
    short: 'x86_64',
    accent: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800/60',
    chip: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
  },
};

const UNKNOWN_META = {
  label: 'Unknown Arch',
  short: 'Unknown',
  accent: 'text-neutral-500 dark:text-neutral-400',
  bg: 'bg-neutral-50 dark:bg-neutral-900/40',
  border: 'border-neutral-200 dark:border-neutral-700',
  chip: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
};

function OrchestratorResourceCard({ res }: { res: OrchestratorResource }) {
  const diskTotal = res.total?.disk_size ?? res.total?.disk_count;
  const diskInUse = res.total_in_use?.disk_size ?? res.total_in_use?.disk_count;
  const diskReserved = res.total_reserved?.disk_size ?? res.total_reserved?.disk_count;
  const diskAvailable = res.total_available?.disk_size ?? res.total_available?.disk_count;
  const diskSysReserved = res.system_reserved?.disk_size ?? res.system_reserved?.disk_count ?? 0;
  // Physical space committed to VM disks (thin-provisioned, allocated but not yet written).
  // = total − in_use − system_reserved − available
  const diskCommitted = Math.max(0, (diskTotal ?? 0) - (diskInUse ?? 0) - diskSysReserved - (diskAvailable ?? 0));

  const getUseColor = (inUse: number | undefined, total: number | undefined) => {
    const usePct = inUse && total ? (inUse / total) * 100 : 0;
    return usePct > 85 ? 'bg-rose-500' : usePct > 60 ? 'bg-amber-400' : 'bg-blue-500';
  };

  return (
    <div className="flex w-full flex-col gap-5 pt-2">
      <MultiProgressBar
        label="CPU Cores"
        total={res.total?.logical_cpu_count ?? 0}
        totalLabel={`${res.total?.logical_cpu_count ?? 0} Cores Total`}
        secondaryLabel={
          <>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{res.total_reserved?.logical_cpu_count ?? 0}</span> Cores Reserved
          </>
        }
        series={[
          {
            key: 'inUse',
            label: 'In Use',
            value: res.total_in_use?.logical_cpu_count ?? 0,
            color: getUseColor(res.total_in_use?.logical_cpu_count, res.total?.logical_cpu_count),
          },
          {
            key: 'sysRes',
            label: 'System Reserved',
            value: res.system_reserved?.logical_cpu_count ?? 0,
            color: 'bg-violet-400 dark:bg-violet-500',
          },
          {
            key: 'available',
            label: 'Available',
            value: res.total_available?.logical_cpu_count ?? 0,
            color: 'bg-emerald-400 dark:bg-emerald-500',
          },
        ]}
      />

      <div className="h-px bg-neutral-100 dark:bg-neutral-800/80 w-full" />

      <MultiProgressBar
        label="Memory"
        total={res.total?.memory_size ?? 0}
        totalLabel={`${formatMB(res.total?.memory_size)} Total`}
        secondaryLabel={
          <>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatMB(res.total_reserved?.memory_size)}</span> Reserved
          </>
        }
        series={[
          {
            key: 'inUse',
            label: 'In Use',
            value: res.total_in_use?.memory_size ?? 0,
            displayValue: formatMB(res.total_in_use?.memory_size),
            color: getUseColor(res.total_in_use?.memory_size, res.total?.memory_size),
          },
          {
            key: 'sysRes',
            label: 'System Reserved',
            value: res.system_reserved?.memory_size ?? 0,
            displayValue: formatMB(res.system_reserved?.memory_size),
            color: 'bg-violet-400 dark:bg-violet-500',
          },
          {
            key: 'available',
            label: 'Available',
            value: res.total_available?.memory_size ?? 0,
            displayValue: formatMB(res.total_available?.memory_size),
            color: 'bg-emerald-400 dark:bg-emerald-500',
          },
        ]}
      />

      {diskTotal != null && (
        <>
          <div className="h-px bg-neutral-100 dark:bg-neutral-800/80 w-full" />
          <MultiProgressBar
            label="Disk"
            total={diskTotal}
            totalLabel={`${formatMB(diskTotal)} Total`}
            secondaryLabel={
              <>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{formatMB(diskReserved)}</span> VM Allocated
              </>
            }
            series={[
              {
                key: 'inUse',
                label: 'In Use',
                value: diskInUse ?? 0,
                displayValue: formatMB(diskInUse),
                color: getUseColor(diskInUse, diskTotal),
              },
              {
                key: 'sysRes',
                label: 'System Reserved',
                value: diskSysReserved,
                displayValue: formatMB(diskSysReserved),
                color: 'bg-violet-400 dark:bg-violet-500',
              },
              {
                key: 'committed',
                label: 'VM Committed',
                value: diskCommitted,
                displayValue: formatMB(diskCommitted),
                color: 'bg-orange-400 dark:bg-orange-500',
              },
              {
                key: 'available',
                label: 'Available',
                value: diskAvailable ?? 0,
                displayValue: formatMB(diskAvailable),
                color: 'bg-emerald-400 dark:bg-emerald-500',
              },
            ]}
          />
        </>
      )}
    </div>
  );
}

function VmStatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const dot: Record<string, string> = {
    emerald: 'bg-emerald-500',
    neutral: 'bg-neutral-400',
    amber: 'bg-amber-400',
    blue: 'bg-blue-500',
  };
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dot[color] ?? 'bg-neutral-400'}`} />
        <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
      </div>
      {value != null && value > 0 && <span className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{value}</span>}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export const HomeOld: React.FC = () => {
  const { session, updateHardwareInfo, hasModule } = useSession();
  const moduleView = useModuleView();
  const config = useConfig();
  const { currentStats, history, setHardwareInfo } = useSystemStats();
  const { containerMessages } = useEventsHub();
  const lastOrchEventIdRef = useRef<string | null>(null);
  const hw = session?.hardwareInfo;
  const [orchResources, setOrchResources] = useState<OrchestratorResource[]>([]);
  const [orchLoading, setOrchLoading] = useState(false);
  const [orchError, setOrchError] = useState<string | null>(null);

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

  const moduleColors: Record<string, ThemeColor> = {
    host: 'blue',
    catalog: 'emerald',
    orchestrator: 'violet',
    api: 'sky',
    reverse_proxy: 'amber',
    cache: 'lime',
  };
  return (
    <div className="flex flex-col w-full h-full bg-neutral-50 dark:bg-neutral-950">
      {/* ── Sticky header ───────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-950 px-6 pt-6 pb-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
        <div className="flex gap-2 flex-col grow">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{session?.hostname ?? 'Dashboard'}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Connected {session?.connectedAt ? `since ${new Date(session.connectedAt).toLocaleTimeString()}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <VmStatCard label="No Alerts" value={0} color="emerald" />
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-6 p-6">
        {/* ── System info ─────────────────────────────────────────── */}
        <div>
          <Section title="System Info" size="lg" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel variant="glass" padding="sm">
              <Section title="Host" size="lg" noPadding />
              <InfoRow noBorder labelSize="sm" noPadding label="CPU" value={hw?.cpu_brand ?? hw?.cpu_type} />
              <InfoRow noBorder labelSize="sm" noPadding label="Architecture" value={hw?.cpu_type} />
              <InfoRow noBorder labelSize="sm" noPadding label="OS" value={hw?.os_name && hw?.os_version ? `${hw.os_name} ${hw.os_version}` : hw?.os_name} />
              <InfoRow noBorder labelSize="sm" noPadding label="External IP" value={hw?.external_ip_address} />
              <Section title="Software" size="lg" noPadding />
              {(hw?.parallels_desktop_version || hw?.parallels_desktop_licensed) && (
                <>
                  <InfoRow noBorder labelSize="sm" noPadding label="Parallels Desktop" value={hw?.parallels_desktop_version} />
                  <InfoRow noBorder labelSize="sm" noPadding label="PD Licensed" value={hw?.parallels_desktop_licensed != null ? (hw.parallels_desktop_licensed ? 'Yes' : 'No') : undefined} />
                </>
              )}
              <InfoRow noBorder labelSize="sm" noPadding label="DevOps Version" value={hw?.devops_version} />
              {hw?.enabled_modules && hw.enabled_modules.length > 0 && (
                <div className="pt-2 mt-1 border-t border-neutral-100 dark:border-neutral-800">
                  <Section title="Enabled Modules" size="lg" noPadding className="py-3" />
                  <div className="flex flex-wrap gap-1.5">
                    {hw.enabled_modules.map((m) => (
                      <Pill key={m} size="sm" tone={moduleColors[m] ?? 'neutral'} variant="soft">
                        {m}
                      </Pill>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
            <Panel variant="glass" padding="sm" className="col-span-2">
              <Section title="Available Resources" size="lg" noPadding />
              <PagedPanel
                variant="glass"
                padding="xs"
                bare={true}
                loading={orchLoading}
                error={orchError}
                title={resourcePages.map((p) => p.title)}
                pages={resourcePages.map((p) => (
                  <OrchestratorResourceCard key={p.title} res={p.res} />
                ))}
                className="col-span-2 w-full"
              />
            </Panel>
          </div>
        </div>
        {resourcePages.length > 0 && (
          <div>
            <Section title="Agent Resources" size="lg" />
            {/* ── Live graphs — only rendered once we have at least one data point ── */}
            {history.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                  <StatGraphTile
                    title="CPU Utilization"
                    value={`${cpuTotal}%`}
                    subtitle="Total load"
                    data={graphData}
                    variant="sparkline"
                    series={[{ key: 'cpuPercent', label: 'CPU %', color: 'blue' }]}
                    yDomain={['auto', 'auto']}
                    height={120}
                    showLegend={false}
                    showAxes={false}
                    showGrid={false}
                    withDecoration={false}
                    className="shadow-none! border-none bg-transparent"
                  />
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                  <StatGraphTile
                    title="Memory Usage"
                    value={memUsedDisplay}
                    subtitle={`of ${memTotalDisplay} total`}
                    data={graphData}
                    variant="sparkline"
                    series={[{ key: 'memoryBytes', label: 'Used', color: 'amber' }]}
                    yDomain={['auto', 'auto']}
                    height={120}
                    showLegend={false}
                    showAxes={false}
                    showGrid={false}
                    withDecoration={false}
                    className="shadow-none! border-none bg-transparent"
                  />
                </div>
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                  <StatGraphTile
                    title="Goroutines"
                    value={String(currentStats?.goroutinesSmoothed ?? 0)}
                    subtitle="Active Go routines"
                    data={graphData}
                    variant="sparkline"
                    series={[{ key: 'goroutines', label: 'Goroutines', color: 'violet' }]}
                    height={120}
                    showLegend={false}
                    showAxes={false}
                    showGrid={false}
                    withDecoration={false}
                    className="shadow-none! border-none bg-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* end scrollable body */}
    </div>
  );
};
