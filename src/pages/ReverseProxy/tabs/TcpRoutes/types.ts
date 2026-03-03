import type { TreeTone } from '@prl/ui-kit';
import type { ReverseProxyHostTcpRoute } from '@/interfaces/ReverseProxy';

export type TargetType = 'static' | 'vm';
export type VmHealth = 'running' | 'stopped' | 'paused' | 'suspended' | 'unknown';

/** target_vm_id presence always wins — target_host may be set by the backend as the resolved VM IP */
export const resolveTargetType = (
    route: Pick<ReverseProxyHostTcpRoute, 'target_vm_id'> | null | undefined,
): TargetType => (route?.target_vm_id ? 'vm' : 'static');

export function getVmHealth(state?: string): VmHealth {
    const s = state?.toLowerCase();
    if (s === 'running') return 'running';
    if (s === 'stopped') return 'stopped';
    if (s === 'paused') return 'paused';
    if (s === 'suspended') return 'suspended';
    return 'unknown';
}

export function healthToTone(health: VmHealth, proxyEnabled: boolean): TreeTone {
    if (!proxyEnabled) return 'neutral';
    switch (health) {
        case 'running': return 'emerald';
        case 'stopped': return 'rose';
        case 'paused':
        case 'suspended': return 'amber';
        default: return 'neutral';
    }
}
