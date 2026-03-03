import type { TreeTone } from '@prl/ui-kit';

export type TargetType = 'static' | 'vm';
export type VmHealth = 'running' | 'stopped' | 'paused' | 'suspended' | 'unknown';

export function getVmHealth(state?: string): VmHealth {
    const s = state?.toLowerCase();
    if (s === 'running') return 'running';
    if (s === 'stopped') return 'stopped';
    if (s === 'paused') return 'paused';
    if (s === 'suspended') return 'suspended';
    return 'unknown';
}

export function headersToEntries(h?: Record<string, string>): { key: string; value: string }[] {
    if (!h) return [];
    return Object.entries(h).map(([key, value]) => ({ key, value }));
}

/** Maps a VM health value + proxy enabled state to a TreeTone. */
export function healthToTone(health: VmHealth, proxyEnabled: boolean): TreeTone {
    if (!proxyEnabled) return 'neutral';
    switch (health) {
        case 'running':   return 'emerald';
        case 'stopped':   return 'rose';
        case 'paused':
        case 'suspended': return 'amber';
        default:          return 'neutral';
    }
}
