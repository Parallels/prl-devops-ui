import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Table, Pill } from '@prl/ui-kit';
import type { TableColumn } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { useSession } from '@/contexts/SessionContext';
import { OsIcon } from '@/utils/virtualMachine';
import { getStateTone, sortVirtualMachines } from '@/utils/vmUtils';
import type { VirtualMachine } from '@/interfaces/VirtualMachine';

// ── Row type ──────────────────────────────────────────────────────────────────

interface VmPanelRow extends VirtualMachine {
  _source: 'local' | 'orchestrator';
}

// ── Column definitions ────────────────────────────────────────────────────────

const columns: TableColumn<VmPanelRow>[] = [
  {
    id: 'os',
    header: 'OS',
    width: 40,
    render: (row) => (
      <span className="flex items-center justify-center">
        <OsIcon os={row.OS} className="w-4 h-4" />
      </span>
    ),
    sortable: false,
    hideable: false,
    groupable: false,
  },
  {
    id: 'name',
    header: 'Name',
    accessor: 'Name',
    sortable: true,
    groupable: false,
    render: (row) => (
      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
        {row.Name ?? '—'}
      </span>
    ),
  },
  {
    id: 'state',
    header: 'State',
    accessor: 'State',
    width: 110,
    sortable: true,
    groupable: false,
    render: (row) => (
      <Pill size="sm" tone={getStateTone(row.State)} variant="soft">
        {row.State ?? 'Unknown'}
      </Pill>
    ),
  },
  {
    id: 'host',
    header: 'Host',
    width: 120,
    groupable: false,
    sortable: true,
    sortValue: (row) => (row._source === 'local' ? 'Local' : (row.host_name ?? row.host_id ?? '')),
    render: (row) =>
      row._source === 'local' ? (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">Local</span>
      ) : (
        <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate">
          {String(row.host_name ?? row.host_id ?? '—')}
        </span>
      ),
  },
  {
    id: 'ip',
    header: 'IP',
    accessor: 'internal_ip_address',
    groupable: false,
    sortable: true,
    render: (row) => (
      <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
        {String(row.internal_ip_address ?? '—')}
      </span>
    ),
  },
];

// ── VmsPanel ──────────────────────────────────────────────────────────────────

export function VmsPanel() {
  const { session, hasModule } = useSession();
  const hostname = session?.hostname ?? '';

  const [localVms, setLocalVms]               = useState<VirtualMachine[]>([]);
  const [orchestratorVms, setOrchestratorVms] = useState<VirtualMachine[]>([]);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  const fetchVms = useCallback(async () => {
    if (!hostname) return;
    setLoading(true);
    setError(null);
    try {
      const [orch, local] = await Promise.all([
        hasModule('orchestrator')
          ? devopsService.machines.getVirtualMachines(hostname, true).catch(() => [] as VirtualMachine[])
          : Promise.resolve([] as VirtualMachine[]),
        hasModule('host')
          ? devopsService.machines.getVirtualMachines(hostname, false).catch(() => [] as VirtualMachine[])
          : Promise.resolve([] as VirtualMachine[]),
      ]);
      setOrchestratorVms(sortVirtualMachines(orch));
      setLocalVms(sortVirtualMachines(local));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load virtual machines');
    } finally {
      setLoading(false);
    }
  }, [hostname, hasModule]);

  useEffect(() => { void fetchVms(); }, [fetchVms]);

  // Deduplicate: orchestrator VMs first, then local VMs not already present
  const rows = useMemo<VmPanelRow[]>(() => {
    const orchIds = new Set(orchestratorVms.map((v) => v.ID).filter(Boolean));
    const localOnly = localVms.filter((v) => !orchIds.has(v.ID));
    return [
      ...orchestratorVms.map((v) => ({ ...v, _source: 'orchestrator' as const })),
      ...localOnly.map((v) => ({ ...v, _source: 'local' as const })),
    ];
  }, [orchestratorVms, localVms]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 h-full overflow-hidden">
      <Table<VmPanelRow>
        columns={columns}
        data={rows}
        rowKey={(row) => row.ID ?? row.Name ?? String(Math.random())}
        variant="compact"
        hoverable
        stickyHeader
        groupable={false}
        emptyState={
          <p className="text-center text-xs text-neutral-400 py-6">
            {loading ? 'Loading virtual machines…' : 'No virtual machines found'}
          </p>
        }
      />
    </div>
  );
}
