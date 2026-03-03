import React from 'react';
import { CustomIcon } from '@prl/ui-kit';
import type { TreeTone } from '@prl/ui-kit';

export function stateToTone(state: string): TreeTone {
    switch (state) {
        case 'running':   return 'blue';
        case 'pending':   return 'cyan';
        case 'completed': return 'emerald';
        case 'failed':    return 'rose';
        default:          return 'neutral';
    }
}

export function jobTypeIcon(type: string): React.ReactNode {
    switch (type.toLowerCase()) {
        case 'catalog':
            return React.createElement(CustomIcon, { icon: 'Library', className: 'w-5 h-5' });
        case 'vm':
            return React.createElement(CustomIcon, { icon: 'VirtualMachine', className: 'w-5 h-5' });
        case 'packer':
        case 'packer_template':
            return React.createElement(CustomIcon, { icon: 'Blueprint', className: 'w-5 h-5' });
        default:
            return React.createElement(CustomIcon, { icon: 'Jobs', className: 'w-5 h-5' });
    }
}

export function formatTimestamp(iso: string): string {
    try {
        return new Date(iso).toLocaleString(undefined, {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
    } catch {
        return iso;
    }
}

export function titleCase(s: string): string {
    return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Parse an ETA value that may be a number (seconds) or a string like
 * "2s", "1m 30s", "1h 2m", "1h 2m 30s". Returns seconds as a number,
 * or 0 if the value cannot be parsed.
 */
export function parseEtaToSeconds(eta: number | string | undefined | null): number {
    if (eta == null) return 0;
    if (typeof eta === 'number') return Number.isFinite(eta) ? eta : 0;

    const s = String(eta).trim().toLowerCase();
    // Already a plain number string e.g. "90"
    const asNum = Number(s);
    if (Number.isFinite(asNum)) return asNum;

    // Parse "1h 2m 30s" style
    let total = 0;
    const hours   = s.match(/(\d+(?:\.\d+)?)\s*h/);
    const minutes = s.match(/(\d+(?:\.\d+)?)\s*m(?!s)/);
    const seconds = s.match(/(\d+(?:\.\d+)?)\s*s/);
    if (hours)   total += parseFloat(hours[1])   * 3600;
    if (minutes) total += parseFloat(minutes[1]) * 60;
    if (seconds) total += parseFloat(seconds[1]);
    return total;
}

export function formatEta(eta: number | string): string {
    const seconds = parseEtaToSeconds(eta);
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) {
        const m = Math.floor(seconds / 60);
        const s = Math.round(seconds % 60);
        return s > 0 ? `${m}m ${s}s` : `${m}m`;
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Icon background + text colour classes keyed by tone name. */
export const TONE_ICON_BG: Record<string, string> = {
    amber:   'bg-amber-50   text-amber-600   dark:bg-amber-900/30   dark:text-amber-400',
    blue:    'bg-blue-50    text-blue-600    dark:bg-blue-900/30    dark:text-blue-400',
    cyan:    'bg-cyan-50    text-cyan-600    dark:bg-cyan-900/30    dark:text-cyan-400',
    sky:     'bg-sky-50     text-sky-600     dark:bg-sky-900/30     dark:text-sky-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    rose:    'bg-rose-50    text-rose-600    dark:bg-rose-900/30    dark:text-rose-400',
    neutral: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800   dark:text-neutral-400',
};
