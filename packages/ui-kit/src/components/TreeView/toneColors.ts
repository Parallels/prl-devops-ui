import type { ThemeColor } from '../../theme/Theme';

// ── Color token interface ────────────────────────────────────────────────────

export interface TreeColorTokens {
    // Tailwind class strings — static so JIT scanner can include them
    bg: string;           // card background  (header area)
    border: string;       // card border
    headerText: string;   // primary title/subtitle text
    labelText: string;    // secondary icon / label / description text
    // SVG hex values [light, dark]
    trunk: readonly [string, string];       // trunk & branch line
    connFill: readonly [string, string];    // connector ring fill (≈ card bg)
    connBorder: readonly [string, string];  // connector ring stroke (≈ card border)
    connDot: readonly [string, string];     // connector inner dot (≈ label text)
}

// ── Disabled / neutral fallback ──────────────────────────────────────────────

export const NEUTRAL_TOKENS: TreeColorTokens = {
    bg: 'bg-neutral-50 dark:bg-neutral-800/50',
    border: 'border-neutral-200 dark:border-neutral-700',
    headerText: 'text-neutral-600 dark:text-neutral-400',
    labelText: 'text-neutral-500 dark:text-neutral-400',
    trunk: ['#d4d4d4', '#525252'],
    connFill: ['#fafafa', '#171717'],
    connBorder: ['#e5e5e5', '#404040'],
    connDot: ['#737373', '#a3a3a3'],
};

// ── Per-base-color token table ───────────────────────────────────────────────
//
// All class strings are FULL STATIC STRINGS so Tailwind's JIT scanner includes them.
// Dark-mode bg uses shade-950/30 approximation.
// SVG: trunk=300/700, fill=50/950, border=200/800, dot=600/400.

const BASE_TOKENS: Record<string, TreeColorTokens> = {
    red: {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800',
        headerText: 'text-red-800 dark:text-red-200',
        labelText: 'text-red-600 dark:text-red-400',
        trunk: ['#fca5a5', '#b91c1c'],
        connFill: ['#fef2f2', '#450a0a'],
        connBorder: ['#fecaca', '#991b1b'],
        connDot: ['#dc2626', '#f87171'],
    },
    orange: {
        bg: 'bg-orange-50 dark:bg-orange-950/30',
        border: 'border-orange-200 dark:border-orange-800',
        headerText: 'text-orange-800 dark:text-orange-200',
        labelText: 'text-orange-600 dark:text-orange-400',
        trunk: ['#fdba74', '#c2410c'],
        connFill: ['#fff7ed', '#431407'],
        connBorder: ['#fed7aa', '#9a3412'],
        connDot: ['#ea580c', '#fb923c'],
    },
    amber: {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        headerText: 'text-amber-800 dark:text-amber-200',
        labelText: 'text-amber-600 dark:text-amber-400',
        trunk: ['#fcd34d', '#b45309'],
        connFill: ['#fffbeb', '#451a03'],
        connBorder: ['#fde68a', '#92400e'],
        connDot: ['#d97706', '#fbbf24'],
    },
    yellow: {
        bg: 'bg-yellow-50 dark:bg-yellow-950/30',
        border: 'border-yellow-200 dark:border-yellow-800',
        headerText: 'text-yellow-800 dark:text-yellow-200',
        labelText: 'text-yellow-600 dark:text-yellow-400',
        trunk: ['#fde047', '#a16207'],
        connFill: ['#fefce8', '#422006'],
        connBorder: ['#fef08a', '#854d0e'],
        connDot: ['#ca8a04', '#facc15'],
    },
    lime: {
        bg: 'bg-lime-50 dark:bg-lime-950/30',
        border: 'border-lime-200 dark:border-lime-800',
        headerText: 'text-lime-800 dark:text-lime-200',
        labelText: 'text-lime-600 dark:text-lime-400',
        trunk: ['#bef264', '#4d7c0f'],
        connFill: ['#f7fee7', '#1a2e05'],
        connBorder: ['#d9f99d', '#3f6212'],
        connDot: ['#65a30d', '#a3e635'],
    },
    green: {
        bg: 'bg-green-50 dark:bg-green-950/30',
        border: 'border-green-200 dark:border-green-800',
        headerText: 'text-green-800 dark:text-green-200',
        labelText: 'text-green-600 dark:text-green-400',
        trunk: ['#86efac', '#15803d'],
        connFill: ['#f0fdf4', '#052e16'],
        connBorder: ['#bbf7d0', '#166534'],
        connDot: ['#16a34a', '#4ade80'],
    },
    emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        headerText: 'text-emerald-800 dark:text-emerald-200',
        labelText: 'text-emerald-600 dark:text-emerald-400',
        trunk: ['#6ee7b7', '#047857'],
        connFill: ['#ecfdf5', '#022c22'],
        connBorder: ['#a7f3d0', '#065f46'],
        connDot: ['#059669', '#34d399'],
    },
    teal: {
        bg: 'bg-teal-50 dark:bg-teal-950/30',
        border: 'border-teal-200 dark:border-teal-800',
        headerText: 'text-teal-800 dark:text-teal-200',
        labelText: 'text-teal-600 dark:text-teal-400',
        trunk: ['#5eead4', '#0f766e'],
        connFill: ['#f0fdfa', '#042f2e'],
        connBorder: ['#99f6e4', '#115e59'],
        connDot: ['#0d9488', '#2dd4bf'],
    },
    cyan: {
        bg: 'bg-cyan-50 dark:bg-cyan-950/30',
        border: 'border-cyan-200 dark:border-cyan-800',
        headerText: 'text-cyan-800 dark:text-cyan-200',
        labelText: 'text-cyan-600 dark:text-cyan-400',
        trunk: ['#67e8f9', '#0e7490'],
        connFill: ['#ecfeff', '#083344'],
        connBorder: ['#a5f3fc', '#155e75'],
        connDot: ['#0891b2', '#22d3ee'],
    },
    sky: {
        bg: 'bg-sky-50 dark:bg-sky-950/30',
        border: 'border-sky-200 dark:border-sky-800',
        headerText: 'text-sky-800 dark:text-sky-200',
        labelText: 'text-sky-600 dark:text-sky-400',
        trunk: ['#7dd3fc', '#0369a1'],
        connFill: ['#f0f9ff', '#082f49'],
        connBorder: ['#bae6fd', '#075985'],
        connDot: ['#0284c7', '#38bdf8'],
    },
    blue: {
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800',
        headerText: 'text-blue-800 dark:text-blue-200',
        labelText: 'text-blue-600 dark:text-blue-400',
        trunk: ['#93c5fd', '#1d4ed8'],
        connFill: ['#eff6ff', '#172554'],
        connBorder: ['#bfdbfe', '#1e40af'],
        connDot: ['#2563eb', '#60a5fa'],
    },
    indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-950/30',
        border: 'border-indigo-200 dark:border-indigo-800',
        headerText: 'text-indigo-800 dark:text-indigo-200',
        labelText: 'text-indigo-600 dark:text-indigo-400',
        trunk: ['#a5b4fc', '#4338ca'],
        connFill: ['#eef2ff', '#1e1b4b'],
        connBorder: ['#c7d2fe', '#3730a3'],
        connDot: ['#4f46e5', '#818cf8'],
    },
    violet: {
        bg: 'bg-violet-50 dark:bg-violet-950/30',
        border: 'border-violet-200 dark:border-violet-800',
        headerText: 'text-violet-800 dark:text-violet-200',
        labelText: 'text-violet-600 dark:text-violet-400',
        trunk: ['#c4b5fd', '#6d28d9'],
        connFill: ['#f5f3ff', '#2e1065'],
        connBorder: ['#ddd6fe', '#4c1d95'],
        connDot: ['#7c3aed', '#a78bfa'],
    },
    purple: {
        bg: 'bg-purple-50 dark:bg-purple-950/30',
        border: 'border-purple-200 dark:border-purple-800',
        headerText: 'text-purple-800 dark:text-purple-200',
        labelText: 'text-purple-600 dark:text-purple-400',
        trunk: ['#d8b4fe', '#7e22ce'],
        connFill: ['#faf5ff', '#3b0764'],
        connBorder: ['#e9d5ff', '#6b21a8'],
        connDot: ['#9333ea', '#c084fc'],
    },
    fuchsia: {
        bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30',
        border: 'border-fuchsia-200 dark:border-fuchsia-800',
        headerText: 'text-fuchsia-800 dark:text-fuchsia-200',
        labelText: 'text-fuchsia-600 dark:text-fuchsia-400',
        trunk: ['#f0abfc', '#a21caf'],
        connFill: ['#fdf4ff', '#4a044e'],
        connBorder: ['#f5d0fe', '#86198f'],
        connDot: ['#c026d3', '#e879f9'],
    },
    pink: {
        bg: 'bg-pink-50 dark:bg-pink-950/30',
        border: 'border-pink-200 dark:border-pink-800',
        headerText: 'text-pink-800 dark:text-pink-200',
        labelText: 'text-pink-600 dark:text-pink-400',
        trunk: ['#f9a8d4', '#be185d'],
        connFill: ['#fdf2f8', '#500724'],
        connBorder: ['#fbcfe8', '#9d174d'],
        connDot: ['#db2777', '#f472b6'],
    },
    rose: {
        bg: 'bg-rose-50 dark:bg-rose-950/30',
        border: 'border-rose-200 dark:border-rose-800',
        headerText: 'text-rose-800 dark:text-rose-200',
        labelText: 'text-rose-600 dark:text-rose-400',
        trunk: ['#fca5a5', '#be123c'],
        connFill: ['#fff1f2', '#4c0519'],
        connBorder: ['#fecdd3', '#9f1239'],
        connDot: ['#e11d48', '#fb7185'],
    },
    slate: {
        bg: 'bg-slate-50 dark:bg-slate-800/50',
        border: 'border-slate-200 dark:border-slate-700',
        headerText: 'text-slate-700 dark:text-slate-300',
        labelText: 'text-slate-500 dark:text-slate-400',
        trunk: ['#cbd5e1', '#334155'],
        connFill: ['#f8fafc', '#020617'],
        connBorder: ['#e2e8f0', '#1e293b'],
        connDot: ['#475569', '#94a3b8'],
    },
    gray: {
        bg: 'bg-gray-50 dark:bg-gray-800/50',
        border: 'border-gray-200 dark:border-gray-700',
        headerText: 'text-gray-700 dark:text-gray-300',
        labelText: 'text-gray-500 dark:text-gray-400',
        trunk: ['#d1d5db', '#374151'],
        connFill: ['#f9fafb', '#030712'],
        connBorder: ['#e5e7eb', '#1f2937'],
        connDot: ['#4b5563', '#9ca3af'],
    },
    zinc: {
        bg: 'bg-zinc-50 dark:bg-zinc-800/50',
        border: 'border-zinc-200 dark:border-zinc-700',
        headerText: 'text-zinc-700 dark:text-zinc-300',
        labelText: 'text-zinc-500 dark:text-zinc-400',
        trunk: ['#d4d4d8', '#3f3f46'],
        connFill: ['#fafafa', '#09090b'],
        connBorder: ['#e4e4e7', '#27272a'],
        connDot: ['#52525b', '#a1a1aa'],
    },
    neutral: NEUTRAL_TOKENS,
    stone: {
        bg: 'bg-stone-50 dark:bg-stone-800/50',
        border: 'border-stone-200 dark:border-stone-700',
        headerText: 'text-stone-700 dark:text-stone-300',
        labelText: 'text-stone-500 dark:text-stone-400',
        trunk: ['#d6d3d1', '#44403c'],
        connFill: ['#fafaf9', '#0c0a09'],
        connBorder: ['#e7e5e4', '#292524'],
        connDot: ['#57534e', '#a8a29e'],
    },
};

// ── Public accessor ──────────────────────────────────────────────────────────

function resolveBaseColor(color: ThemeColor): string {
    switch (color) {
        case 'brand':    return 'blue';
        case 'info':     return 'sky';
        case 'success':  return 'emerald';
        case 'warning':  return 'amber';
        case 'danger':   return 'rose';
        case 'theme':
        case 'white':    return 'neutral';
        case 'parallels': return 'red';
        default:         return color;
    }
}

export function getTreeColorTokens(tone: ThemeColor | undefined): TreeColorTokens {
    if (!tone) return NEUTRAL_TOKENS;
    const base = resolveBaseColor(tone);
    return BASE_TOKENS[base] ?? NEUTRAL_TOKENS;
}
