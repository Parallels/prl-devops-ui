import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import classNames from 'classnames';
import Button from '../Button';
import DropdownMenu from '../DropdownMenu';
import type { DropdownMenuOption } from '../DropdownMenu';
import { getPanelToneStyles, ThemeColor } from '../../theme/Theme';
import { getTreeColorTokens } from '../TreeView/toneColors';
import { paddingStyles } from '../Panel';
import type {
  TimelinePanelProps,
  TimelinePanelItem,
  TimelinePanelAction,
  TimelinePanelHeaderAction,
} from './types';
import type { PanelVariant, PanelCorner, PanelPadding } from '../Panel';
import Loader from '../Loader';

// ── useIsDark — detects Tailwind dark class on <html> ────────────────────────

function useIsDark(): boolean {
  const detect = (): boolean => {
    if (typeof document === 'undefined') return false;
    const probe = document.createElement('div');
    probe.className = 'hidden dark:block';
    document.body.appendChild(probe);
    const dark = window.getComputedStyle(probe).display === 'block';
    probe.remove();
    return dark;
  };
  const [isDark, setIsDark] = useState<boolean>(() => detect());
  useEffect(() => {
    const update = () => setIsDark(detect());
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', update);
    update();
    return () => {
      media.removeEventListener('change', update);
      obs.disconnect();
    };
  }, []);
  return isDark;
}

// ── SVG layout constants ───────────────────────────────────────────────────────

/** Width of the left gutter that the SVG occupies. */
const SVG_W = 28;
/** X position of the vertical trunk line. */
const TRUNK_X = 12;
/**
 * One indent column = icon width (32px / w-8) + inner gap (12px / gap-3).
 * Each depth level shifts by this amount so a child's icon aligns with its
 * parent's text start.
 */
const ITEM_DEPTH_PX = 44;
/** Icon width in px (w-8). Used to compute parent icon center for L alignment. */
const ICON_W = 32;
/** Corner radius for the L-connector bend. */
const L_CORNER_R = 6;
/** Gap between the horizontal line end and the item icon. */
const L_GAP = 6;
/** Ring radius for root / current-state connectors. */
const ROOT_RING_R = 6.5;
/** Stroke width. */
const BW = 1.5;


// ── TimelineSvg ───────────────────────────────────────────────────────────────
// Absolute overlay drawn on top of the item rows.
// Renders:
//  • vertical trunk connecting only depth-0 items (root → current)
//  • root: filled anchor circle on trunk
//  • current: hollow anchor circle on trunk
//  • depth > 0 items: L-shaped connector at depth * DEPTH_INDENT
//      vertical from prev item's midY → this item's midY
//      horizontal → item icon
//    consecutive same-depth items share the vertical (their segments join)

interface TimelineSvgProps {
  items: TimelinePanelItem[];
  /** Measured offsetHeight of each item row div */
  itemHeights: number[];
  isDark: boolean;
  tone: ThemeColor;
  showTrunkDots: boolean;
}

const TimelineSvg: React.FC<TimelineSvgProps> = ({ items, itemHeights, isDark, tone, showTrunkDots }) => {
  const ci = isDark ? 1 : 0;
  const tok = getTreeColorTokens(tone);
  // Derived color shorthands — [light, dark] resolved to current mode
  const trunkColor  = tok.trunk[ci];
  const branchColor = tok.trunk[ci];
  const rootFill    = tok.connDot[ci];     // tone accent fill for root circle
  const rootBorder  = tok.trunk[ci];       // matches line color
  const rootDot     = tok.connFill[ci];    // inner dot contrasts against filled circle
  const curFill     = tok.connFill[ci];    // very light tinted bg for current circle
  const curBorder   = tok.trunk[ci];       // matches line color

  // Compute midY for each item. No stub — cumY starts at 0.
  const midYs: number[] = [];
  let cumY = 0;
  for (let i = 0; i < items.length; i++) {
    const h = itemHeights[i] ?? 44;
    midYs.push(cumY + h / 2);
    cumY += h;
  }

  const totalSvgH = cumY;

  if (totalSvgH === 0 || midYs.length === 0) return null;

  // Trunk anchors: depth-0 items PLUS any isRoot / isCurrent items at any depth.
  // isCurrent always renders its circle on the trunk (TRUNK_X), so the trunk
  // must extend down to it even when depth > 0.
  const d0Indices = items
    .map((it, idx) => ((it.depth ?? 0) === 0 || it.isRoot || it.isCurrent ? idx : -1))
    .filter((idx) => idx >= 0);
  // Trunk segments: one segment between each consecutive pair of depth-0 items,
  // leaving a gap of (ROOT_RING_R + L_GAP) around each anchor circle.
  // Segments up to/including current are solid; segments after current are dashed.
  const ANCHOR_GAP = ROOT_RING_R + L_GAP;
  const currentIdx = items.findIndex((it) => it.isCurrent);
  const trunkSegments = d0Indices.slice(0, -1).map((fromIdx, i) => {
    const toIdx = d0Indices[i + 1];
    const dashed = currentIdx >= 0 && fromIdx >= currentIdx;
    return {
      y1: midYs[fromIdx] + ANCHOR_GAP,
      y2: midYs[toIdx] - ANCHOR_GAP,
      dashed,
    };
  });

  return (
    <svg
      width={SVG_W}
      height={totalSvgH}
      viewBox={`0 0 ${SVG_W} ${totalSvgH}`}
      overflow="visible"
      aria-hidden="true"
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
    >
      {/* ── Vertical trunk — depth-0 items only, gaps around anchors ────────── */}
      {trunkSegments.map(({ y1, y2, dashed }, i) => (
        <line
          key={i}
          x1={TRUNK_X} y1={y1}
          x2={TRUNK_X} y2={y2}
          stroke={trunkColor}
          strokeWidth={2}
          strokeLinecap="round"
          {...(dashed ? { strokeDasharray: '3 4' } : {})}
        />
      ))}

      {/* ── Trunk dots — one per item on the solid segment ──────────────────── */}
      {showTrunkDots && midYs.map((my, i) => {
        const item = items[i];
        if (!item || item.isRoot || item.isCurrent) return null;
        const onSolid = currentIdx < 0 || i < currentIdx;
        if (!onSolid) return null;
        return <circle key={`td-${item.id}`} cx={TRUNK_X} cy={my} r={3} fill={trunkColor} />;
      })}

      {/* ── Per-item connectors ──────────────────────────────────────────────── */}
      {midYs.map((my, i) => {
        const item = items[i];
        if (!item) return null;

        if (item.isRoot) {
          // When the root is also the current snapshot, draw the dashed
          // extension downward — otherwise the isCurrent branch is never reached.
          const dashY2 = i < items.length - 1 ? totalSvgH : my + ROOT_RING_R + 20;
          return (
            <g key={item.id}>
              <circle cx={TRUNK_X} cy={my} r={ROOT_RING_R} fill={rootFill} />
              <circle cx={TRUNK_X} cy={my} r={ROOT_RING_R} stroke={rootBorder} strokeWidth={BW} fill="none" />
              <circle cx={TRUNK_X} cy={my} r="2.5" fill={rootDot} />
              {item.isCurrent && (
                <line
                  x1={TRUNK_X} y1={my + ROOT_RING_R + 4}
                  x2={TRUNK_X} y2={dashY2}
                  stroke={trunkColor}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeDasharray="2 3"
                />
              )}
            </g>
          );
        }

        if (item.isCurrent) {
          const hasItemsAfter = i < items.length - 1;
          const dashY2 = hasItemsAfter ? totalSvgH : my + ROOT_RING_R + 20;
          const curDepth = Math.min(item.depth ?? 0, 3);
          let lPath: string | null = null;
          if (curDepth > 0) {
            const lx = SVG_W + (curDepth - 1) * ITEM_DEPTH_PX + ICON_W / 2;
            let prevRefIdxC = i - 1;
            while (prevRefIdxC > 0 && (items[prevRefIdxC]?.depth ?? 0) > curDepth) prevRefIdxC--;
            const prevDepth = items[prevRefIdxC] ? (items[prevRefIdxC].depth ?? 0) : 0;
            const topGap = prevDepth < curDepth ? ICON_W / 2 + L_GAP : -L_CORNER_R;
            const topY = (midYs[prevRefIdxC] ?? my) + topGap;
            const rightX = SVG_W + curDepth * ITEM_DEPTH_PX - L_GAP;
            const cornerY = Math.max(topY, my - L_CORNER_R);
            lPath = [
              `M ${lx} ${topY}`,
              `L ${lx} ${cornerY}`,
              `A ${L_CORNER_R} ${L_CORNER_R} 0 0 0 ${lx + L_CORNER_R} ${my}`,
              `L ${rightX} ${my}`,
            ].join(' ');
          }
          return (
            <g key={item.id}>
              <circle cx={TRUNK_X} cy={my} r={ROOT_RING_R} fill={curFill} />
              <circle cx={TRUNK_X} cy={my} r={ROOT_RING_R} stroke={curBorder} strokeWidth={BW} fill="none" />
              {lPath && (
                <path d={lPath} stroke={branchColor} strokeWidth={1.5} strokeLinecap="round" fill="none" />
              )}
              <line
                x1={TRUNK_X} y1={my + ROOT_RING_R + 4}
                x2={TRUNK_X} y2={dashY2}
                stroke={trunkColor}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeDasharray="2 3"
              />
            </g>
          );
        }

        // L-shaped connector aligned to the parent icon center.
        // Vertical: from previous item's midY → this item's midY at parent icon center X.
        // Rounded corner → horizontal to this item's icon left edge.
        const depth = Math.min(item.depth ?? 0, 3);
        if (depth === 0) return null;

        // X = center of the parent icon (depth - 1 level)
        const lx = SVG_W + (depth - 1) * ITEM_DEPTH_PX + ICON_W / 2;
        // Walk back to find the last item whose depth <= current depth so the
        // vertical segment spans across any deeper children in between.
        let prevRefIdx = i - 1;
        while (prevRefIdx > 0 && (items[prevRefIdx]?.depth ?? 0) > depth) prevRefIdx--;
        const prevDepth = items[prevRefIdx] ? (items[prevRefIdx].depth ?? 0) : 0;
        const topGap = prevDepth < depth ? ICON_W / 2 + L_GAP : -L_CORNER_R;
        const topY = (midYs[prevRefIdx] ?? my) + topGap;
        const rightX = SVG_W + depth * ITEM_DEPTH_PX - L_GAP;
        const cornerY = Math.max(topY, my - L_CORNER_R);

        const lPath = [
          `M ${lx} ${topY}`,
          `L ${lx} ${cornerY}`,
          `A ${L_CORNER_R} ${L_CORNER_R} 0 0 0 ${lx + L_CORNER_R} ${my}`,
          `L ${rightX} ${my}`,
        ].join(' ');

        return (
          <g key={item.id}>
            <path d={lPath} stroke={branchColor} strokeWidth={1.5} strokeLinecap="round" fill="none" />
          </g>
        );
      })}
    </svg>
  );
};

// ── Variant shell styles (mirrors Panel) ──────────────────────────────────────

const variantShellStyles: Record<PanelVariant, string> = {
  elevated: 'bg-white shadow-xl ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10 text-neutral-900 dark:text-neutral-100',
  outlined: 'bg-white/90 text-neutral-900 ring-1 dark:bg-neutral-900/80 dark:text-neutral-100 dark:ring-white/10',
  subtle: 'text-neutral-900 shadow-sm ring-1 ring-transparent dark:text-neutral-100 dark:ring-white/5',
  tonal: 'text-neutral-900 shadow-sm ring-1 ring-transparent dark:text-neutral-100 dark:ring-white/5',
  default: 'bg-white/80 backdrop-blur-xl text-neutral-900 shadow-2xl ring-1 ring-transparent dark:text-neutral-100 dark:ring-white/5',
  glass: 'backdrop-blur-xl text-neutral-900 ring-1 ring-transparent dark:text-neutral-100 dark:ring-white/5',
  simple: 'text-neutral-900 ring-transparent dark:text-neutral-100 dark:ring-white/5',
};

const cornerStyles: Record<PanelCorner, string> = {
  rounded: 'rounded-sm',
  'rounded-sm': 'rounded-lg',
  'rounded-md': 'rounded-2xl',
  'rounded-lg': 'rounded-3xl',
  'rounded-full': 'rounded-full',
  pill: 'rounded-3xl',
  none: 'rounded-none',
};

// ── Overflow (⋮) button ───────────────────────────────────────────────────────

interface OverflowButtonProps {
  options: DropdownMenuOption[];
  onSelect: (item: DropdownMenuOption) => void;
}

const OverflowButton: React.FC<OverflowButtonProps> = ({ options, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  if (options.length === 0) return null;
  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label="More actions"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="2.5" cy="8" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="13.5" cy="8" r="1.5" />
        </svg>
      </button>
      <DropdownMenu
        anchorRef={ref as React.RefObject<HTMLElement | null>}
        open={open}
        onClose={() => setOpen(false)}
        items={options}
        onSelect={(opt) => { onSelect(opt); setOpen(false); }}
        align="end"
        width={180}
      />
    </>
  );
};

// ── TimelineItemRow ───────────────────────────────────────────────────────────

interface TimelineItemRowProps {
  item: TimelinePanelItem;
  color: ThemeColor;
  itemRef: (el: HTMLDivElement | null) => void;
  actionSize: TimelinePanelAction['size'];
}

const TimelineItemRow: React.FC<TimelineItemRowProps> = ({ item, color, itemRef, actionSize }) => {
  const depth = Math.min(item.depth ?? 0, 3);
  const depthPx = depth * ITEM_DEPTH_PX;

  const overflowOptions: DropdownMenuOption[] = (item.overflowActions ?? []).map((a) => ({
    label: a.label,
    value: a.value,
    icon: a.icon,
    danger: a.danger,
    disabled: a.disabled,
  }));

  const handleOverflowSelect = (option: DropdownMenuOption) => {
    item.overflowActions?.find((a) => a.value === option.value)?.onClick?.();
  };

  const iconColorClasses = classNames(item.iconBackground ? `rounded-full bg-${color}-100`:'')

  return (
    // paddingLeft = SVG_W + depthPx so the whole row is column-shifted (total inside parent)
    <div ref={itemRef} className="flex items-center gap-2 py-2.5" style={{ paddingLeft: SVG_W + depthPx }}>
      {/* Icon + text */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Icon slot */}
        {item.icon && (
          <div className={classNames('flex h-8 w-8 shrink-0 items-center justify-center text-blue-500 dark:bg-neutral-800 dark:text-neutral-400', iconColorClasses)}>
            {item.icon}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {item.title}
          </div>
          {item.subtitle && (
            <div className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
              {item.subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Actions — always at far right, unaffected by depth */}
      {(item.actions !== undefined && item.actions !== null && (!Array.isArray(item.actions) || (item.actions as TimelinePanelAction[]).length > 0) || overflowOptions.length > 0) && (
        <div className="flex shrink-0 items-center gap-1.5">
          {Array.isArray(item.actions)
            ? (item.actions as TimelinePanelAction[]).map((action, idx) => (
                <Button
                  key={idx}
                  variant={action.variant ?? 'outline'}
                  color={action.color ?? color}
                  size={action.size ?? actionSize ?? 'sm'}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  loading={action.loading}
                >
                  {action.label}
                </Button>
              ))
            : item.actions as React.ReactNode}
          <OverflowButton options={overflowOptions} onSelect={handleOverflowSelect} />
        </div>
      )}
    </div>
  );
};

function isHeaderActionObject(v: unknown): v is TimelinePanelHeaderAction {
  return typeof v === 'object' && v !== null && !React.isValidElement(v) && 'label' in v;
}

// ── TimelinePanel ─────────────────────────────────────────────────────────────

const TimelinePanel: React.FC<TimelinePanelProps> = ({
  title,
  headerAction,
  items,
  variant = 'simple',
  tone = 'neutral',
  padding = 'sm',
  corner = 'none',
  loading = false,
  emptyState,
  className,
  loaderProps,
  showTrunkDots = false,
}) => {
  const isDark = useIsDark();
  const palette = getPanelToneStyles(tone);

  // ── Height measurement for SVG ────────────────────────────────────────────
  const itemEls = useRef<(HTMLDivElement | null)[]>([]);
  const [itemHeights, setItemHeights] = useState<number[]>([]);

  const measureHeights = useCallback(() => {
    const heights = itemEls.current.map((el) => el?.offsetHeight ?? 0);
    setItemHeights((prev) =>
      prev.length === heights.length && prev.every((h, i) => h === heights[i]) ? prev : heights,
    );
  }, []);

  useLayoutEffect(() => {
    // Trim stale refs when items shrink (e.g. after a delete) so heights array
    // stays in sync with items.length and the SVG guard doesn't suppress render.
    itemEls.current = itemEls.current.slice(0, items.length);
    measureHeights();
    const ro = new ResizeObserver(measureHeights);
    itemEls.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [measureHeights, items]);

  // ── Variant shell ─────────────────────────────────────────────────────────
  const variantClass = (() => {
    switch (variant) {
      case 'outlined': return classNames(variantShellStyles.outlined, palette.border);
      case 'subtle':   return classNames(variantShellStyles.subtle, palette.border, palette.subtleBg);
      case 'tonal':    return classNames(variantShellStyles.tonal, palette.tonalBg);
      case 'glass':    return classNames(variantShellStyles.glass, 'border', palette.glassBorder, palette.glassBg);
      case 'simple':   return classNames(variantShellStyles.simple);
      default:         return variantShellStyles[variant] ?? variantShellStyles.elevated;
    }
  })();

  return (
    <section
      className={classNames('relative flex w-full flex-col overflow-hidden',paddingStyles[padding as PanelPadding], variantClass, cornerStyles[corner], className)}
      aria-busy={loading}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      {(title || headerAction) && (
        <div className={classNames('flex items-center justify-between gap-4')}>
          {title && (
            <h3 className={classNames('text-lg font-semibold leading-2', palette.heading)}>{title}</h3>
          )}
          {headerAction && (() => {
            if (isHeaderActionObject(headerAction)) {
              return (
                <Button
                  variant={headerAction.variant ?? 'solid'}
                  color={headerAction.color ?? tone}
                  size={headerAction.size ?? 'sm'}
                  onClick={headerAction.onClick}
                  disabled={headerAction.disabled}
                  loading={headerAction.loading}
                  leadingIcon={headerAction.leadingIcon}
                  weight="semibold"
                >
                  {headerAction.label}
                </Button>
              );
            }
            return (
              <div className='flex shrink-0 gap-2'>
                {headerAction as React.ReactNode}
              </div>
            )
              
          })()}
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="relative">
        {loading && items.length === 0 ? (
          /* No items yet — centred spinner */
          <div className="flex items-center justify-center min-h-30 w-full h-full">
            <Loader
              spinnerThickness={loaderProps?.spinnerThickness}
              color={tone}
              glass={loaderProps?.glass}
              glassBlurIntensity={loaderProps?.glassBlurIntensity}
              label={loaderProps?.label}
              size={loaderProps?.size}
              spinnerVariant={loaderProps?.spinnerVariant}
              title={loaderProps?.title}
              variant={loaderProps?.variant}
            />
          </div>
        ) : items.length === 0 && emptyState ? (
          <div className="py-4">{emptyState}</div>
        ) : (
          <div className="relative">
            {/* SVG overlay — drawn once heights are known */}
            {itemHeights.length === items.length && items.length > 0 && (
              <TimelineSvg items={items} itemHeights={itemHeights} isDark={isDark} tone={tone} showTrunkDots={showTrunkDots} />
            )}

            <div className={classNames(loading && 'pointer-events-none')}>
              {items.map((item, i) => (
                <TimelineItemRow
                  key={item.id}
                  color={tone}
                  item={item}
                  itemRef={(el) => { itemEls.current[i] = el; }}
                  actionSize="sm"
                />
              ))}
            </div>

            {/* Glass overlay loader when refreshing over existing items */}
            {loading && (
              <Loader
                overlay
                glass
                color={tone}
                spinnerThickness={loaderProps?.spinnerThickness}
                glassBlurIntensity={loaderProps?.glassBlurIntensity ?? 'low'}
                label={loaderProps?.label}
                size={loaderProps?.size}
                spinnerVariant={loaderProps?.spinnerVariant}
                title={loaderProps?.title}
                variant={loaderProps?.variant}
                className="absolute inset-0 rounded-[inherit]"
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
};

TimelinePanel.displayName = 'TimelinePanel';

export default TimelinePanel;
