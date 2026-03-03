import { useSession } from '@/contexts/SessionContext';
import { DevOpsRemoteHost } from '@/interfaces/devops';
import { CachePanel } from '@/pages/Cache/CachePanel';

export function CacheTab({ host }: { host: DevOpsRemoteHost }) {
    const { session } = useSession();

    return (
        <CachePanel
            hostname={session?.hostname ?? ''}
            hostId={host.id}
            isOrchestrator
        />
    );
}
