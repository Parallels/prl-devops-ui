import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { useIconRenderer } from '../contexts/IconContext';
import type { ThemeColor } from '../theme/Theme';

// ── Color tokens ──────────────────────────────────────────────────────────────
// Full class strings are required so Tailwind's JIT scanner can pick them up.

const COLOR_TOKENS: Partial<
  Record<
    ThemeColor,
    {
      border: string; // focus-within border
      ring: string; // focus-within ring
      icon: string; // icon color on focus (gradient variant)
      btnHover: string; // clear button hover classes
    }
  >
> = {
  blue: {
    border: 'focus-within:border-blue-500',
    ring: 'focus-within:ring-blue-400/40',
    icon: 'group-focus-within:text-blue-500',
    btnHover: 'hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/40 dark:hover:text-blue-400',
  },
  indigo: {
    border: 'focus-within:border-indigo-500',
    ring: 'focus-within:ring-indigo-400/40',
    icon: 'group-focus-within:text-indigo-500',
    btnHover: 'hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-400',
  },
  violet: {
    border: 'focus-within:border-violet-500',
    ring: 'focus-within:ring-violet-400/40',
    icon: 'group-focus-within:text-violet-500',
    btnHover: 'hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/40 dark:hover:text-violet-400',
  },
  purple: {
    border: 'focus-within:border-purple-500',
    ring: 'focus-within:ring-purple-400/40',
    icon: 'group-focus-within:text-purple-500',
    btnHover: 'hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/40 dark:hover:text-purple-400',
  },
  fuchsia: {
    border: 'focus-within:border-fuchsia-500',
    ring: 'focus-within:ring-fuchsia-400/40',
    icon: 'group-focus-within:text-fuchsia-500',
    btnHover: 'hover:bg-fuchsia-100 hover:text-fuchsia-600 dark:hover:bg-fuchsia-900/40 dark:hover:text-fuchsia-400',
  },
  pink: {
    border: 'focus-within:border-pink-500',
    ring: 'focus-within:ring-pink-400/40',
    icon: 'group-focus-within:text-pink-500',
    btnHover: 'hover:bg-pink-100 hover:text-pink-600 dark:hover:bg-pink-900/40 dark:hover:text-pink-400',
  },
  rose: {
    border: 'focus-within:border-rose-500',
    ring: 'focus-within:ring-rose-400/40',
    icon: 'group-focus-within:text-rose-500',
    btnHover: 'hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/40 dark:hover:text-rose-400',
  },
  red: {
    border: 'focus-within:border-red-500',
    ring: 'focus-within:ring-red-400/40',
    icon: 'group-focus-within:text-red-500',
    btnHover: 'hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-400',
  },
  orange: {
    border: 'focus-within:border-orange-500',
    ring: 'focus-within:ring-orange-400/40',
    icon: 'group-focus-within:text-orange-500',
    btnHover: 'hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-900/40 dark:hover:text-orange-400',
  },
  amber: {
    border: 'focus-within:border-amber-500',
    ring: 'focus-within:ring-amber-400/40',
    icon: 'group-focus-within:text-amber-500',
    btnHover: 'hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/40 dark:hover:text-amber-400',
  },
  yellow: {
    border: 'focus-within:border-yellow-500',
    ring: 'focus-within:ring-yellow-400/40',
    icon: 'group-focus-within:text-yellow-500',
    btnHover: 'hover:bg-yellow-100 hover:text-yellow-600 dark:hover:bg-yellow-900/40 dark:hover:text-yellow-400',
  },
  lime: {
    border: 'focus-within:border-lime-500',
    ring: 'focus-within:ring-lime-400/40',
    icon: 'group-focus-within:text-lime-500',
    btnHover: 'hover:bg-lime-100 hover:text-lime-600 dark:hover:bg-lime-900/40 dark:hover:text-lime-400',
  },
  green: {
    border: 'focus-within:border-green-500',
    ring: 'focus-within:ring-green-400/40',
    icon: 'group-focus-within:text-green-500',
    btnHover: 'hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/40 dark:hover:text-green-400',
  },
  emerald: {
    border: 'focus-within:border-emerald-500',
    ring: 'focus-within:ring-emerald-400/40',
    icon: 'group-focus-within:text-emerald-500',
    btnHover: 'hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-400',
  },
  teal: {
    border: 'focus-within:border-teal-500',
    ring: 'focus-within:ring-teal-400/40',
    icon: 'group-focus-within:text-teal-500',
    btnHover: 'hover:bg-teal-100 hover:text-teal-600 dark:hover:bg-teal-900/40 dark:hover:text-teal-400',
  },
  cyan: {
    border: 'focus-within:border-cyan-500',
    ring: 'focus-within:ring-cyan-400/40',
    icon: 'group-focus-within:text-cyan-500',
    btnHover: 'hover:bg-cyan-100 hover:text-cyan-600 dark:hover:bg-cyan-900/40 dark:hover:text-cyan-400',
  },
  sky: {
    border: 'focus-within:border-sky-500',
    ring: 'focus-within:ring-sky-400/40',
    icon: 'group-focus-within:text-sky-500',
    btnHover: 'hover:bg-sky-100 hover:text-sky-600 dark:hover:bg-sky-900/40 dark:hover:text-sky-400',
  },
  slate: {
    border: 'focus-within:border-slate-500',
    ring: 'focus-within:ring-slate-400/40',
    icon: 'group-focus-within:text-slate-500',
    btnHover: 'hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200',
  },
  gray: {
    border: 'focus-within:border-gray-500',
    ring: 'focus-within:ring-gray-400/40',
    icon: 'group-focus-within:text-gray-500',
    btnHover: 'hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200',
  },
};

const DEFAULT_TOKENS = COLOR_TOKENS.blue!;

function getTokens(color: ThemeColor) {
  return COLOR_TOKENS[color] ?? DEFAULT_TOKENS;
}

// ── Gradient pairs (600 → 400 within the same hue) ───────────────────────────
// Each entry is [darker, lighter] — used as the default glow gradient.

const GRADIENT_MAP: Partial<Record<ThemeColor, [string, string]>> = {
  blue: ['#2563eb', '#60a5fa'],
  indigo: ['#4f46e5', '#818cf8'],
  violet: ['#7c3aed', '#a78bfa'],
  purple: ['#9333ea', '#c084fc'],
  fuchsia: ['#c026d3', '#e879f9'],
  pink: ['#db2777', '#f472b6'],
  rose: ['#e11d48', '#fb7185'],
  red: ['#dc2626', '#f87171'],
  orange: ['#ea580c', '#fb923c'],
  amber: ['#d97706', '#fbbf24'],
  yellow: ['#ca8a04', '#facc15'],
  lime: ['#65a30d', '#a3e635'],
  green: ['#16a34a', '#4ade80'],
  emerald: ['#059669', '#34d399'],
  teal: ['#0d9488', '#2dd4bf'],
  cyan: ['#0891b2', '#22d3ee'],
  sky: ['#0284c7', '#38bdf8'],
  slate: ['#475569', '#94a3b8'],
  gray: ['#4b5563', '#9ca3af'],
  zinc: ['#52525b', '#a1a1aa'],
  neutral: ['#525252', '#a3a3a3'],
  stone: ['#57534e', '#a8a29e'],
};

function resolveGradient(color: ThemeColor, from?: string, to?: string): [string, string] {
  const pair = GRADIENT_MAP[color] ?? GRADIENT_MAP.blue!;
  return [from ?? pair[0], to ?? pair[1]];
}

// ── Props ──────────────────────────────────────────────────────────────────────

export interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string, signal?: AbortSignal) => void;
  onClear?: () => void;
  debounceMs?: number;
  autoSearch?: boolean;
  className?: string;
  disabled?: boolean;
  initialValue?: string;
  shouldClear?: boolean;
  leadingIcon?: string | React.ReactElement;
  variant?: 'default' | 'gradient';
  /** Accent colour for focus ring, icon highlight, and clear-button hover. Default: 'blue' */
  color?: ThemeColor;
  /**
   * Start (darker) colour of the gradient glow (gradient variant only).
   * Defaults to the -600 shade of `color` when omitted.
   */
  gradientFrom?: string;
  /**
   * End (lighter) colour of the gradient glow (gradient variant only).
   * Defaults to the -400 shade of `color` when omitted.
   */
  gradientTo?: string;
  /**
   * Controls how prominent the gradient glow is (gradient variant only).
   * - `subtle`  – barely visible; a hint of colour at the border
   * - `soft`    – gentle glow, low key (default)
   * - `medium`  – clearly visible glow
   * - `strong`  – bold, wide glow
   */
  glowIntensity?: 'subtle' | 'soft' | 'medium' | 'strong';
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  onSearch,
  onClear,
  debounceMs = 400,
  autoSearch = true,
  className,
  disabled = false,
  initialValue = '',
  shouldClear = false,
  leadingIcon = 'Search',
  variant = 'default',
  color = 'blue',
  gradientFrom,
  gradientTo,
  glowIntensity = 'soft',
}) => {
  const [resolvedFrom, resolvedTo] = resolveGradient(color, gradientFrom, gradientTo);
  const glowConfig = {
    subtle: { inset: '-inset-px', blur: 'blur-sm', idleOpacity: 0.06, focusOpacity: 0.14 },
    soft: { inset: '-inset-0.5', blur: 'blur-sm', idleOpacity: 0.1, focusOpacity: 0.22 },
    medium: { inset: '-inset-0.5', blur: 'blur', idleOpacity: 0.2, focusOpacity: 0.4 },
    strong: { inset: '-inset-1', blur: 'blur-md', idleOpacity: 0.3, focusOpacity: 0.55 },
  } as const;
  const glow = glowConfig[glowIntensity];
  const tokens = getTokens(color);

  const renderIcon = useIconRenderer();
  const [query, setQuery] = useState(initialValue);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const generationRef = useRef(0);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  const clearPendingSearch = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  const triggerSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      onSearchRef.current('');
      return;
    }
    abortRef.current = new AbortController();
    onSearchRef.current(trimmed, abortRef.current?.signal);
  };

  useEffect(() => {
    if (!autoSearch) {
      return undefined;
    }

    clearPendingSearch();
    if (!query.trim()) {
      onSearchRef.current('');
      return undefined;
    }

    const myGeneration = ++generationRef.current;
    debounceRef.current = setTimeout(() => {
      if (myGeneration !== generationRef.current) {
        return;
      }
      triggerSearch(query);
    }, debounceMs);

    return () => clearPendingSearch();
  }, [query, autoSearch, debounceMs]);

  const handleInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    if (!event.target.value) {
      clearPendingSearch();
      onSearchRef.current('');
    }
  }, []);

  const handleClear = useCallback(() => {
    clearPendingSearch();
    setQuery('');
    onClear?.();
    inputRef.current?.focus();
  }, [onClear]);

  useEffect(() => {
    if (shouldClear) {
      handleClear();
    }
  }, [shouldClear, handleClear]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        handleClear();
      }
      if (event.key === 'Enter') {
        clearPendingSearch();
        generationRef.current += 1;
        triggerSearch(event.currentTarget.value);
      }
    },
    [handleClear],
  );

  // ── Clear button — always rendered to keep width stable ───────────────────
  // Visible only when there is text and the bar is not disabled.
  const showClear = !!(query && !disabled);

  const clearBtn = showClear ? (
    <button
      type="button"
      onClick={handleClear}
      className={classNames(
        'absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition',
        'focus-visible:outline-none focus-visible:ring-2',
        tokens.ring.replace('focus-within:', 'focus-visible:'),
        'bg-slate-200/80 text-slate-400 dark:bg-slate-700/80 dark:text-slate-400',
        tokens.btnHover,
      )}
      aria-label="Clear search"
    >
      {renderIcon('Close', 'xs')}
    </button>
  ) : null;

  const clearBtnGradient = showClear ? (
    <button
      type="button"
      onClick={handleClear}
      className={classNames(
        'absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded-full transition',
        'focus-visible:outline-none focus-visible:ring-2',
        tokens.ring.replace('focus-within:', 'focus-visible:'),
        'bg-slate-200 text-slate-500',
        tokens.btnHover,
      )}
      aria-label="Clear search"
    >
      {renderIcon('Close', 'xs')}
    </button>
  ) : null;

  // ── Gradient variant ──────────────────────────────────────────────────────
  if (variant === 'gradient') {
    return (
      <div className={classNames('relative w-full group', className)}>
        <div
          className={classNames('absolute rounded-2xl transition-opacity duration-500 leading-none', glow.inset, glow.blur)}
          style={{
            background: `linear-gradient(to right, ${resolvedFrom}, ${resolvedTo})`,
            opacity: focused ? glow.focusOpacity : glow.idleOpacity,
          }}
          aria-hidden
        />
        <div className="relative flex w-full items-center rounded-xl bg-white/80 backdrop-blur-xl border border-white/20 px-4 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition">
          <span className={classNames('mr-2 inline-flex hrink-0 items-center text-slate-400 transition-colors', tokens.icon)}>{renderIcon(leadingIcon, 'xs')}</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className="text-sm flex-1 border-none bg-transparent text-slate-900 placeholder-slate-400 outline-none leading-5"
          />
          {clearBtnGradient}
        </div>
      </div>
    );
  }

  // ── Default variant ───────────────────────────────────────────────────────
  return (
    <div
      className={classNames(
        'group relative flex w-full items-center rounded-lg border border-slate-200/80 bg-white/80 px-3 py-1.5 shadow-sm transition',
        'focus-within:ring-2',
        tokens.border,
        tokens.ring,
        'dark:border-slate-700/60 dark:bg-slate-900/60',
        disabled && 'opacity-60',
        className,
      )}
    >
      <span className="mr-2 inline-flex shrink-0 items-center text-slate-400 dark:text-slate-500">{renderIcon(leadingIcon, 'sm')}</span>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 border-none bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-slate-200 dark:placeholder-slate-500"
      />
      {clearBtn}
    </div>
  );
};

export default SearchBar;
