import React from 'react';
import classNames from 'classnames';
import { CustomIcon } from './CustomIcon';
import { type IconName } from '../icons/registry';
import { type ThemeColor } from '../theme';
import { type PanelDecoration } from './Panel';

// ── Types ─────────────────────────────────────────────────────────────────────

export type HeroTitleSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type HeroSubtitleSize = 'xs' | 'sm' | 'md';
export type HeroPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface HeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Main heading text. */
  title: React.ReactNode;
  /** Supporting text rendered below the title at lower opacity. */
  subtitle?: React.ReactNode;
  /** Icon name from the registry, or a pre-built React element. When omitted the icon slot is not rendered. */
  icon?: IconName | React.ReactElement;
  /** Colour tone — drives the gradient background. Defaults to `"parallels"`. */
  tone?: ThemeColor;
  /** Size of the title text. Colour is always white. Defaults to `"sm"`. */
  titleSize?: HeroTitleSize;
  /** Size of the subtitle text. Colour is always white/75. Defaults to `"xs"`. */
  subtitleSize?: HeroSubtitleSize;
  /** Internal padding. Defaults to `"none"`. */
  padding?: HeroPadding;
  /** Whether to apply `rounded-xl` corner rounding. Defaults to `true`. */
  rounded?: boolean;
  /**
   * Decorative layer inside the banner:
   * - `"shapes"`   — three floating circles at low white opacity
   * - `"gradient"` — a diagonal white-to-transparent light wash
   * - `"both"`     — circles + wash (default)
   * - `"none"`     — no decoration
   */
  decoration?: PanelDecoration;
}

// ── Static gradient map ────────────────────────────────────────────────────────
// All values are complete, literal Tailwind class strings so the JIT scanner
// includes them without needing a safelist entry.

const toneGradient: Record<ThemeColor, string> = {
  red: 'from-red-500 to-rose-600',
  orange: 'from-orange-400 to-orange-600',
  amber: 'from-amber-400 to-orange-500',
  yellow: 'from-yellow-400 to-amber-500',
  lime: 'from-lime-500 to-green-600',
  green: 'from-green-500 to-emerald-600',
  emerald: 'from-emerald-500 to-teal-600',
  teal: 'from-teal-500 to-cyan-600',
  cyan: 'from-cyan-400 to-sky-500',
  sky: 'from-sky-400 to-indigo-500',
  blue: 'from-blue-500 to-indigo-600',
  indigo: 'from-indigo-500 to-violet-600',
  violet: 'from-violet-500 to-purple-600',
  purple: 'from-purple-500 to-fuchsia-600',
  fuchsia: 'from-fuchsia-500 to-pink-600',
  pink: 'from-pink-500 to-rose-600',
  rose: 'from-rose-500 to-red-600',
  slate: 'from-slate-600 to-slate-800',
  gray: 'from-gray-600 to-gray-800',
  zinc: 'from-zinc-600 to-zinc-800',
  neutral: 'from-neutral-600 to-neutral-800',
  stone: 'from-stone-600 to-stone-800',
  white: 'from-slate-500 to-slate-700',
  brand: 'from-blue-500 to-indigo-600',
  info: 'from-sky-400 to-blue-600',
  success: 'from-emerald-500 to-teal-600',
  warning: 'from-amber-400 to-orange-500',
  danger: 'from-rose-500 to-red-600',
  theme: 'from-neutral-600 to-neutral-800',
  parallels: 'from-red-500 to-rose-600',
};

// ── Size maps ─────────────────────────────────────────────────────────────────

const titleSizeMap: Record<HeroTitleSize, string> = {
  xs: 'text-xs font-bold',
  sm: 'text-sm font-bold',
  md: 'text-base font-bold',
  lg: 'text-lg font-semibold',
  xl: 'text-xl font-semibold',
};

const subtitleSizeMap: Record<HeroSubtitleSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
};

const paddingMap: Record<HeroPadding, string> = {
  none: 'p-0',
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
  xl: 'p-9',
};

// ── Component ─────────────────────────────────────────────────────────────────

const Hero: React.FC<HeroProps> = ({ title, subtitle, icon, tone = 'blue', titleSize = 'sm', subtitleSize = 'xs', padding = 'sm', rounded = true, decoration = 'both', className, ...rest }) => {
  const showShapes = decoration === 'shapes' || decoration === 'both';
  const showGradient = decoration === 'gradient' || decoration === 'both';

  const iconNode = icon ? typeof icon === 'string' ? <CustomIcon icon={icon as IconName} className="w-6 h-6 text-white" /> : icon : null;

  return (
    <div className={classNames('relative overflow-hidden flex items-center gap-4 bg-linear-to-br shadow-lg', toneGradient[tone], paddingMap[padding], rounded && 'rounded-xl', className)} {...rest}>
      {/* Decoration: floating circles at white/10 opacity — same intensity on all tones */}
      {showShapes && (
        <>
          <div className="pointer-events-none absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/10" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-8 -bottom-10 w-36 h-36 rounded-full bg-white/10 opacity-70" aria-hidden="true" />
          <div className="pointer-events-none absolute right-10 bottom-8 w-16 h-16 rounded-full bg-white/10 opacity-50" aria-hidden="true" />
        </>
      )}

      {/* Decoration: diagonal light wash for depth */}
      {showGradient && <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-white/10 to-transparent" aria-hidden="true" />}

      {/* Icon container */}
      {iconNode && <div className="relative shrink-0 w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner">{iconNode}</div>}

      {/* Text */}
      <div className="relative min-w-0 flex-1">
        <p className={classNames('text-white leading-tight', titleSizeMap[titleSize])}>{title}</p>
        {subtitle && <p className={classNames('text-white/75 mt-0.5 leading-relaxed', subtitleSizeMap[subtitleSize])}>{subtitle}</p>}
      </div>
    </div>
  );
};

export default Hero;
