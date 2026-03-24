import { useSession } from '@/contexts/SessionContext';
import { DevOpsRemoteHost } from '@/interfaces/devops';
import { CachePanel } from '@/pages/Cache/CachePanel';
import { EmptyState } from '@prl/ui-kit';

export function CacheTab({ host }: { host: DevOpsRemoteHost }) {
  const { session } = useSession();
  if (!host.enabled || !host.enabled_modules?.includes('cache') || !host.id) {
    return <EmptyState icon="Database" title="Cache information unavailable" subtitle="This host does not have an ID, so cache details cannot be displayed." fullHeight fullWidth disableBorder />;
  }

  return <CachePanel hostname={session?.hostname ?? ''} hostId={host.id} isOrchestrator />;
}
