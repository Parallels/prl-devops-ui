import { useCallback, useEffect, useState } from 'react';
import { Table, Pill } from '@prl/ui-kit';
import type { TableColumn } from '@prl/ui-kit';
import { devopsService } from '@/services/devops';
import { useSession } from '@/contexts/SessionContext';
import type { DevOpsRemoteHost } from '@/interfaces/devops';

// ── Column definitions ────────────────────────────────────────────────────────

const columns: TableColumn<DevOpsRemoteHost>[] = [
  {
    id: 'name',
    header: 'Name',
    sortable: true,
    groupable: false,
    render: (row) => (
      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
        {row.description || row.host || '—'}
      </span>
    ),
  },
  {
    id: 'host',
    header: 'Address',
    accessor: 'host',
    sortable: true,
    groupable: false,
    render: (row) => (
      <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400 truncate">
        {row.external_ip_address || row.host || '—'}
      </span>
    ),
  },
  {
    id: 'state',
    header: 'State',
    accessor: 'state',
    width: 110,
    sortable: true,
    groupable: false,
    render: (row) => (
      <Pill
        size="sm"
        tone={row.state === 'healthy' ? 'success' : 'rose'}
        variant="soft"
      >
        {row.state ?? 'Unknown'}
      </Pill>
    ),
  },
];

// ── HostsPanel ────────────────────────────────────────────────────────────────

export function HostsPanel() {
  const { session } = useSession();
  const hostname = session?.hostname ?? '';

  const [hosts, setHosts]     = useState<DevOpsRemoteHost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchHosts = useCallback(async () => {
    if (!hostname) return;
    setLoading(true);
    setError(null);
    try {
      const data = await devopsService.orchestrator.getOrchestratorHosts(hostname);
      setHosts(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load hosts');
    } finally {
      setLoading(false);
    }
  }, [hostname]);

  useEffect(() => { void fetchHosts(); }, [fetchHosts]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 h-full overflow-hidden">
      <Table<DevOpsRemoteHost>
        columns={columns}
        data={hosts}
        rowKey={(row) => row.id ?? row.host}
        variant="compact"
        hoverable
        stickyHeader
        groupable={false}
        emptyState={
          <p className="text-center text-xs text-neutral-400 py-6">
            {loading ? 'Loading hosts…' : 'No hosts found'}
          </p>
        }
      />
    </div>
  );
}
