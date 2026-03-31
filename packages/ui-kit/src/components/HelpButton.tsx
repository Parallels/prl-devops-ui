import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import classNames from 'classnames';
import IconButton from './IconButton';
import CustomIcon from './CustomIcon';
import type { ThemeColor } from '../theme/Theme';
import type { IconName } from '../icons/registry';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type HelpButtonPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface HelpButtonProps {
  /**
   * Help content to display in the panel.
   * Pass a `string` to render as Markdown (tables and URLs supported).
   * Pass a `ReactNode` to render arbitrary JSX directly.
   */
  content: string | React.ReactNode;
  /** Optional title shown in the panel header. Defaults to "Help". */
  title?: React.ReactNode;
  /**
   * Preferred placement of the floating panel relative to the trigger button.
   * "auto" (default) picks the side with the most available space.
   */
  placement?: HelpButtonPlacement;
  /** Accent color for the trigger button and the panel header stripe. */
  color?: ThemeColor;
  /** Size of the trigger icon button. */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Icon for the trigger button. Defaults to "Help". */
  icon?: IconName;
  /** Maximum width of the floating panel in px. Defaults to 360. */
  maxWidth?: number;
  /** Extra class applied to the root wrapper. */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Tone tokens (header stripe + accent text + icon bg)                 */
/* ------------------------------------------------------------------ */

type ToneTokens = { strip: string; accent: string; iconBg: string };

const toneMap: Partial<Record<ThemeColor, ToneTokens>> = {
  blue: { strip: 'border-t-blue-500    bg-blue-50/70    dark:bg-blue-950/40', accent: 'text-blue-700    dark:text-blue-300', iconBg: 'bg-blue-100/80    dark:bg-blue-900/40' },
  indigo: { strip: 'border-t-indigo-500  bg-indigo-50/70  dark:bg-indigo-950/40', accent: 'text-indigo-700  dark:text-indigo-300', iconBg: 'bg-indigo-100/80  dark:bg-indigo-900/40' },
  violet: { strip: 'border-t-violet-500  bg-violet-50/70  dark:bg-violet-950/40', accent: 'text-violet-700  dark:text-violet-300', iconBg: 'bg-violet-100/80  dark:bg-violet-900/40' },
  sky: { strip: 'border-t-sky-500     bg-sky-50/70     dark:bg-sky-950/40', accent: 'text-sky-700     dark:text-sky-300', iconBg: 'bg-sky-100/80     dark:bg-sky-900/40' },
  cyan: { strip: 'border-t-cyan-500    bg-cyan-50/70    dark:bg-cyan-950/40', accent: 'text-cyan-700    dark:text-cyan-300', iconBg: 'bg-cyan-100/80    dark:bg-cyan-900/40' },
  teal: { strip: 'border-t-teal-500    bg-teal-50/70    dark:bg-teal-950/40', accent: 'text-teal-700    dark:text-teal-300', iconBg: 'bg-teal-100/80    dark:bg-teal-900/40' },
  emerald: { strip: 'border-t-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40', accent: 'text-emerald-700 dark:text-emerald-300', iconBg: 'bg-emerald-100/80 dark:bg-emerald-900/40' },
  green: { strip: 'border-t-green-500   bg-green-50/70   dark:bg-green-950/40', accent: 'text-green-700   dark:text-green-300', iconBg: 'bg-green-100/80   dark:bg-green-900/40' },
  amber: { strip: 'border-t-amber-500   bg-amber-50/70   dark:bg-amber-950/40', accent: 'text-amber-700   dark:text-amber-300', iconBg: 'bg-amber-100/80   dark:bg-amber-900/40' },
  orange: { strip: 'border-t-orange-500  bg-orange-50/70  dark:bg-orange-950/40', accent: 'text-orange-700  dark:text-orange-300', iconBg: 'bg-orange-100/80  dark:bg-orange-900/40' },
  rose: { strip: 'border-t-rose-500    bg-rose-50/70    dark:bg-rose-950/40', accent: 'text-rose-700    dark:text-rose-300', iconBg: 'bg-rose-100/80    dark:bg-rose-900/40' },
  pink: { strip: 'border-t-pink-500    bg-pink-50/70    dark:bg-pink-950/40', accent: 'text-pink-700    dark:text-pink-300', iconBg: 'bg-pink-100/80    dark:bg-pink-900/40' },
  slate: { strip: 'border-t-slate-400   bg-slate-50/80   dark:bg-slate-800/50', accent: 'text-slate-700   dark:text-slate-300', iconBg: 'bg-slate-100/80   dark:bg-slate-800' },
  // Semantic aliases
  info: { strip: 'border-t-sky-500     bg-sky-50/70     dark:bg-sky-950/40', accent: 'text-sky-700     dark:text-sky-300', iconBg: 'bg-sky-100/80     dark:bg-sky-900/40' },
  success: { strip: 'border-t-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40', accent: 'text-emerald-700 dark:text-emerald-300', iconBg: 'bg-emerald-100/80 dark:bg-emerald-900/40' },
  warning: { strip: 'border-t-amber-500   bg-amber-50/70   dark:bg-amber-950/40', accent: 'text-amber-700   dark:text-amber-300', iconBg: 'bg-amber-100/80   dark:bg-amber-900/40' },
  danger: { strip: 'border-t-rose-500    bg-rose-50/70    dark:bg-rose-950/40', accent: 'text-rose-700    dark:text-rose-300', iconBg: 'bg-rose-100/80    dark:bg-rose-900/40' },
  brand: { strip: 'border-t-blue-500    bg-blue-50/70    dark:bg-blue-950/40', accent: 'text-blue-700    dark:text-blue-300', iconBg: 'bg-blue-100/80    dark:bg-blue-900/40' },
};

const fallbackTone: ToneTokens = {
  strip: 'border-t-neutral-400 bg-neutral-50/80 dark:bg-neutral-800/50',
  accent: 'text-neutral-700 dark:text-neutral-300',
  iconBg: 'bg-neutral-100 dark:bg-neutral-800',
};

/* ------------------------------------------------------------------ */
/*  Markdown component map                                              */
/* ------------------------------------------------------------------ */

const mdComponents: Components = {
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-200 transition-colors duration-150"
    >
      {children}
    </a>
  ),
  p: ({ children }) => <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-2 last:mb-0">{children}</p>,
  h1: ({ children }) => <h1 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-2 mt-3 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1.5 mt-3 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1 mt-2 first:mt-0">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc list-outside text-sm text-neutral-700 dark:text-neutral-300 space-y-0.5 mb-2 pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside text-sm text-neutral-700 dark:text-neutral-300 space-y-0.5 mb-2 pl-4">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => <blockquote className="border-l-[3px] border-neutral-300 dark:border-neutral-600 pl-3 my-2 text-neutral-500 dark:text-neutral-400 italic">{children}</blockquote>,
  hr: () => <hr className="my-3 border-neutral-200 dark:border-neutral-700" />,
  strong: ({ children }) => <strong className="font-semibold text-neutral-900 dark:text-neutral-100">{children}</strong>,
  em: ({ children }) => <em className="italic text-neutral-600 dark:text-neutral-400">{children}</em>,
  /**
   * Inline code has no className; fenced block code has a language-* class.
   * We style them differently — inline is a subtle chip, block is a scrollable box.
   */
  code: ({ className, children }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return <code className="block bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre">{children}</code>;
    }
    return <code className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded px-1.5 py-0.5 text-xs font-mono">{children}</code>;
  },
  pre: ({ children }) => <pre className="my-2 rounded-lg overflow-hidden">{children}</pre>,
  // remark-gfm table support
  table: ({ children }) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-neutral-100 dark:bg-neutral-800">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">{children}</tbody>,
  tr: ({ children }) => <tr className="transition-colors duration-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/40">{children}</tr>,
  th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">{children}</td>,
};

/* ------------------------------------------------------------------ */
/*  Position computation                                                */
/* ------------------------------------------------------------------ */

const ESTIMATED_HEIGHT = 320;
const GAP = 8;

function computePopoverPosition(rect: DOMRect, placement: HelpButtonPlacement, maxWidth: number): { style: React.CSSProperties; resolvedPlacement: 'top' | 'bottom' | 'left' | 'right' } {
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;
  const W = Math.min(maxWidth, vpW - 16);

  const spaceBelow = vpH - rect.bottom - GAP;
  const spaceAbove = rect.top - GAP;

  let resolved: 'top' | 'bottom' | 'left' | 'right';
  if (placement === 'auto' || placement === 'bottom') {
    resolved = spaceBelow >= ESTIMATED_HEIGHT || spaceBelow >= spaceAbove ? 'bottom' : 'top';
  } else if (placement === 'top') {
    resolved = spaceAbove >= ESTIMATED_HEIGHT || spaceAbove >= spaceBelow ? 'top' : 'bottom';
  } else {
    resolved = placement;
  }

  const style: React.CSSProperties = { width: W };

  if (resolved === 'bottom') {
    style.top = rect.bottom + GAP;
    style.left = Math.max(8, Math.min(rect.left + rect.width / 2 - W / 2, vpW - W - 8));
  } else if (resolved === 'top') {
    // distance from bottom of viewport so it sits above the button
    style.bottom = vpH - rect.top + GAP;
    style.left = Math.max(8, Math.min(rect.left + rect.width / 2 - W / 2, vpW - W - 8));
  } else if (resolved === 'right') {
    style.left = Math.min(rect.right + GAP, vpW - W - 8);
    style.top = Math.max(8, Math.min(rect.top + rect.height / 2 - ESTIMATED_HEIGHT / 2, vpH - ESTIMATED_HEIGHT - 8));
  } else {
    // left
    style.left = Math.max(8, rect.left - W - GAP);
    style.top = Math.max(8, Math.min(rect.top + rect.height / 2 - ESTIMATED_HEIGHT / 2, vpH - ESTIMATED_HEIGHT - 8));
  }

  return { style, resolvedPlacement: resolved };
}

const originClass: Record<'top' | 'bottom' | 'left' | 'right', string> = {
  bottom: 'origin-top',
  top: 'origin-bottom',
  left: 'origin-right',
  right: 'origin-left',
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

const HelpButton: React.FC<HelpButtonProps> = ({ content, title, placement = 'auto', color = 'info', size = 'xs', icon = 'Help', maxWidth = 360, className }) => {
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [resolvedPlacement, setResolvedPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const recompute = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const { style, resolvedPlacement: rp } = computePopoverPosition(rect, placement, maxWidth);
    setPopoverStyle(style);
    setResolvedPlacement(rp);
  }, [placement, maxWidth]);

  const toggle = useCallback(() => {
    if (!open) recompute();
    setOpen((v) => !v);
  }, [open, recompute]);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!buttonRef.current?.contains(e.target as Node) && !panelRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, close]);

  // Reposition on scroll or resize while open
  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', recompute, true);
    window.addEventListener('resize', recompute);
    return () => {
      window.removeEventListener('scroll', recompute, true);
      window.removeEventListener('resize', recompute);
    };
  }, [open, recompute]);

  const tone = toneMap[color] ?? fallbackTone;
  const isMarkdown = typeof content === 'string';

  return (
    <span className={classNames('inline-flex items-center', className)}>
      {/* Trigger */}
      <IconButton ref={buttonRef} icon={icon} size={size} variant="ghost" color={color} onClick={toggle} aria-label="Show help" aria-expanded={open} aria-haspopup="dialog" />

      {/* Floating panel — rendered in a portal to avoid overflow clipping */}
      {createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label={typeof title === 'string' ? title : 'Help'}
          style={{ ...popoverStyle, position: 'fixed' }}
          className={classNames(
            'z-[2000] rounded-2xl border shadow-xl dark:shadow-neutral-950/60',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200/70 dark:border-neutral-700/60',
            // Animation — opacity + scale, origin tracks resolved placement
            'transition-[opacity,transform] duration-200 ease-out',
            originClass[resolvedPlacement],
            open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none',
          )}
        >
          {/* ---- Accent header strip ---- */}
          <div className={classNames('flex items-center justify-between gap-2 px-3 py-2 rounded-t-2xl border-t-[3px]', tone.strip)}>
            <div className={classNames('flex items-center gap-2 min-w-0', tone.accent)}>
              <span className={classNames('flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full', tone.iconBg)}>
                <CustomIcon icon="Info" className="h-3 w-3" />
              </span>
              <span className="text-xs font-semibold truncate">{title ?? 'Help'}</span>
            </div>
            <IconButton icon="Close" size="xs" variant="ghost" color="slate" onClick={close} aria-label="Close help" />
          </div>

          {/* ---- Content body ---- */}
          <div className="px-4 py-3 overflow-y-auto max-h-[55vh] scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
            {isMarkdown ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {content as string}
              </ReactMarkdown>
            ) : (
              <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{content}</div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </span>
  );
};

HelpButton.displayName = 'HelpButton';

export default HelpButton;
