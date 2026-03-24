import { getRandomThemeColorClass } from '@prl/ui-kit';

// ── Manifest color palette (consistent across per-card and aggregate bars) ────
export const MANIFEST_COLORS = Array.from({ length: 12 }, () => getRandomThemeColorClass('bg'));
