import { useCallback } from 'react';
import { DevOpsRemoteHost } from '@/interfaces/devops';
import { useEventsHub, useHostLogs } from '@/contexts/EventsHubContext';
import { LogViewer } from '@/components/LogViewer';
import { EmptyState } from '@prl/ui-kit';

export function LogsTab({ host }: { host: DevOpsRemoteHost }) {
  const hostId = host.id || '';
  const logs = useHostLogs(hostId);
  const { clearHostLogs } = useEventsHub();

  const handleClear = useCallback(() => {
    clearHostLogs(hostId);
  }, [clearHostLogs, hostId]);

  if (!host.enabled || !host.enabled_modules?.includes('logs') || !host.id) {
    return <EmptyState icon="Warning" title="Logs unavailable" subtitle="This host does not have an ID, so logs cannot be displayed." fullHeight fullWidth disableBorder />;
  }

  return <LogViewer logs={logs} configSlug={`logs::${hostId}::config`} onClear={handleClear} loading={false} />;
}
