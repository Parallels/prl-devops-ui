// ── Log level normalisation ───────────────────────────────────────────────────

export function normalizeLevel(raw: string): string {
    const l = (raw ?? '').toLowerCase().trim();
    if (l === 'warning') return 'warn';
    return l;
}

// ── Level ordering (for ≥ threshold filters) ──────────────────────────────────

export const LEVEL_ORDER: Record<string, number> = {
    debug: 0, info: 1, warn: 2, error: 3, fatal: 4,
};

// ── Level display metadata (label + Tailwind colour classes) ──────────────────

export interface LevelMeta {
    label: string;
    row: string;
    badge: string;
}

export const LEVEL_META: Record<string, LevelMeta> = {
    debug: {
        label: 'DBG',
        row: 'text-fuchsia-500 dark:text-fuchsia-400',
        badge: 'text-fuchsia-500 dark:text-fuchsia-400',
    },
    info: {
        label: 'INF',
        row: 'text-neutral-700 dark:text-neutral-200',
        badge: 'text-sky-600 dark:text-sky-400',
    },
    warn: {
        label: 'WRN',
        row: 'text-amber-700 dark:text-amber-200',
        badge: 'text-amber-600 dark:text-amber-400',
    },
    error: {
        label: 'ERR',
        row: 'text-rose-600 dark:text-rose-300',
        badge: 'text-rose-500 dark:text-rose-400',
    },
    fatal: {
        label: 'FTL',
        row: 'text-rose-700 dark:text-rose-200 font-semibold',
        badge: 'text-rose-600 dark:text-rose-300 font-semibold',
    },
};

const FALLBACK_META: LevelMeta = {
    label: '',
    row: 'text-neutral-600 dark:text-neutral-300',
    badge: 'text-neutral-500 dark:text-neutral-400',
};

export function levelMeta(raw: string): LevelMeta {
    const level = normalizeLevel(raw);
    return LEVEL_META[level] ?? { ...FALLBACK_META, label: level.slice(0, 3).toUpperCase() };
}
