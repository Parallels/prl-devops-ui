import { formatMB, InfoRow, MultiProgressBar, Pill, SectionCard, Table, type Column } from '@prl/ui-kit';
import { useNavigate } from 'react-router-dom';
import { DevOpsRemoteHost } from '@/interfaces/devops';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { VirtualMachine } from '@/interfaces/VirtualMachine';
import { OsIcon } from '@/utils/virtualMachine';
import { getStateTone } from '@/utils/vmUtils';

// ── VM table columns ──────────────────────────────────────────────────────────

const vmColumns: Column<VirtualMachine>[] = [
  {
    id: 'os',
    header: 'OS',
    accessor: 'OS',
    sortable: true,
    sortValue: (row) => row.OS ?? '',
    align: 'center',
    width: 48,
    render: (row) => (
      <div className="flex items-center justify-center">
        <OsIcon os={row.OS} />
      </div>
    ),
  },
  {
    id: 'name',
    header: 'Name',
    accessor: 'Name',
    sortable: true,
    sortValue: (row) => row.Name ?? '',
    render: (row) => (
      <div className="flex flex-col">
        <span className="font-medium text-sm">{row.Name ?? '—'}</span>
        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">{row.ID ?? '—'}</span>
      </div>
    ),
  },
  {
    id: 'state',
    header: 'State',
    accessor: 'State',
    sortable: true,
    align: 'center',
    width: 110,
    render: (row) => (
      <Pill size="sm" tone={getStateTone(row.State)} variant="soft">
        {row.State ?? 'Unknown'}
      </Pill>
    ),
  },
  {
    id: 'internal_ip',
    header: 'Internal IP',
    accessor: 'internal_ip_address',
    align: 'center',
    width: 150,
    render: (row) => (
      <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500">
        {String(row.internal_ip_address ?? '—')}
      </span>
    ),
  },
  {
    id: 'uptime',
    header: 'Uptime',
    accessor: 'Uptime',
    align: 'center',
    width: 110,
    render: (row) => (
      <span className="text-xs text-neutral-500 dark:text-neutral-400">{row.Uptime ?? '—'}</span>
    ),
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function OverviewTab({ host }: { host: DevOpsRemoteHost }) {
  const navigate = useNavigate();
  const { themeColor } = useSystemSettings();

  const getUseColor = (inUse: number | undefined, total: number | undefined) => {
    const usePct = inUse && total ? (inUse / total) * 100 : 0;
    return usePct > 85 ? 'bg-rose-500' : usePct > 60 ? 'bg-amber-400' : 'bg-blue-500';
  };

  const isHealthy = host.state === 'healthy';
  const shouldBlur = !isHealthy;
  const vms = host.vms?.filter((vm) => vm.State === 'running') ?? [];

  const diskTotal = host.detailed_resources?.total?.disk_size ?? host.detailed_resources?.total?.disk_count;
  const diskInUse = host.detailed_resources?.total_in_use?.disk_size ?? host.detailed_resources?.total_in_use?.disk_count;
  const diskReserved = host.detailed_resources?.total_reserved?.disk_size ?? host.detailed_resources?.total_reserved?.disk_count;
  const diskAvailable = host.detailed_resources?.total_available?.disk_size ?? host.detailed_resources?.total_available?.disk_count;

  return (
    <div className="p-4 space-y-4">
      <SectionCard title="Host Info" blur={shouldBlur}>
        <InfoRow label="CPU" value={host.cpu_model || host.architecture || 'Unknown'} />
        <InfoRow label="Architecture" value={host.architecture} />
        <InfoRow label="OS" value={`${host.os_name || ''} ${host.os_version || ''}`.trim() || 'Unknown'} />
        <InfoRow label="External IP" value={host.external_ip_address || host.host} />
      </SectionCard>

      <SectionCard title="Software" blur={shouldBlur}>
        <InfoRow label="Parallels Desktop" value={host.parallels_desktop_version || 'Unknown'} />
        <InfoRow label="DevOps" value={host.devops_version || 'Unknown'} />
      </SectionCard>

      {/* Virtual Machines table */}
      <SectionCard
        title={`Virtual Machines${vms.length > 0 ? ` (${vms.length})` : ''}`}
        blur={shouldBlur}
      >
        {vms.length > 0 && (
          <div className="flex justify-end pb-1">
            <button
              onClick={() => navigate('/vms')}
              className="text-xs font-medium transition-colors text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200"
            >
              View All ›
            </button>
          </div>
        )}
        <Table<VirtualMachine>
          columns={vmColumns}
          data={vms}
          color={themeColor}
          rowKey={(row) => String(row.ID ?? Math.random())}
          hoverable
          groupable
          userStickyColumns
          noBorders
          stickyHeader
          variant="flat"
          defaultSort={{ columnId: 'name', direction: 'asc' }}
          emptyState={
            <div className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
              No virtual machines on this host
            </div>
          }
        />
      </SectionCard>

      {/* Resources */}
      <SectionCard title="Resources" blur={shouldBlur}>
        <MultiProgressBar
          className="py-2.5 border-b border-neutral-100 dark:border-neutral-800"
          label="CPU Cores"
          labelClassName="text-sm text-neutral-500 dark:text-neutral-400"
          total={host.detailed_resources?.total?.logical_cpu_count ?? 0}
          totalLabel={`${host.detailed_resources?.total?.logical_cpu_count ?? 0} Cores Total`}
          secondaryLabel={
            <>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {host.detailed_resources?.total_reserved?.logical_cpu_count ?? 0}
              </span>{' '}
              Cores Reserved by VMs
            </>
          }
          series={[
            {
              key: 'inUse',
              label: 'In Use',
              value: host.detailed_resources?.total_in_use?.logical_cpu_count ?? 0,
              color: getUseColor(
                host.detailed_resources?.total_in_use?.logical_cpu_count,
                host.detailed_resources?.total?.logical_cpu_count,
              ),
            },
            {
              key: 'sysRes',
              label: 'System Reserved',
              value: host.detailed_resources?.system_reserved?.logical_cpu_count ?? 0,
              color: 'bg-violet-400 dark:bg-violet-500',
            },
            {
              key: 'available',
              label: 'Available',
              value: host.detailed_resources?.total_available?.logical_cpu_count ?? 0,
              color: 'bg-emerald-400 dark:bg-emerald-500',
            },
          ]}
        />
        <MultiProgressBar
          className="py-2.5 border-b border-neutral-100 dark:border-neutral-800"
          label="Memory"
          labelClassName="text-sm text-neutral-500 dark:text-neutral-400"
          total={host.detailed_resources?.total?.memory_size ?? 0}
          totalLabel={`${formatMB(host.detailed_resources?.total?.memory_size)} Total`}
          secondaryLabel={
            <>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {formatMB(host.detailed_resources?.total_reserved?.memory_size)}
              </span>{' '}
              Reserved by VMs
            </>
          }
          series={[
            {
              key: 'inUse',
              label: 'In Use',
              value: host.detailed_resources?.total_in_use?.memory_size ?? 0,
              displayValue: formatMB(host.detailed_resources?.total_in_use?.memory_size),
              color: getUseColor(
                host.detailed_resources?.total_in_use?.memory_size,
                host.detailed_resources?.total?.memory_size,
              ),
            },
            {
              key: 'sysRes',
              label: 'System Reserved',
              value: host.detailed_resources?.system_reserved?.memory_size ?? 0,
              displayValue: formatMB(host.detailed_resources?.system_reserved?.memory_size),
              color: 'bg-violet-400 dark:bg-violet-500',
            },
            {
              key: 'available',
              label: 'Available',
              value: host.detailed_resources?.total_available?.memory_size ?? 0,
              displayValue: formatMB(host.detailed_resources?.total_available?.memory_size),
              color: 'bg-emerald-400 dark:bg-emerald-500',
            },
          ]}
        />

        {diskTotal != null && (
          <>
            <div className="h-px bg-neutral-100 dark:bg-neutral-800/80 w-full" />
            <MultiProgressBar
              className="py-2.5 border-b border-neutral-100 dark:border-neutral-800"
              label="Disk"
              labelClassName="text-sm text-neutral-500 dark:text-neutral-400"
              total={diskTotal}
              totalLabel={`${formatMB(diskTotal)} Total`}
              secondaryLabel={
                <>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {formatMB(diskReserved)}
                  </span>{' '}
                  Reserved by VMs
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
                  value:
                    host.detailed_resources?.system_reserved?.disk_size ??
                    host.detailed_resources?.system_reserved?.disk_count ??
                    0,
                  displayValue: formatMB(
                    host.detailed_resources?.system_reserved?.disk_size ??
                      host.detailed_resources?.system_reserved?.disk_count,
                  ),
                  color: 'bg-violet-400 dark:bg-violet-500',
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
      </SectionCard>
    </div>
  );
}
