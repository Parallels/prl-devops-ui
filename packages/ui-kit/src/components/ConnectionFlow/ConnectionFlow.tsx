import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import ConnectionFlowConnector from './ConnectionFlowConnector';
import ConnectionFlowColumn, { type ColumnGeometry } from './ConnectionFlowColumn';
import ConnectionFlowParallelGroup from './ConnectionFlowParallelGroup';
import type { ConnectionFlowItem, ConnectionFlowProps, ConnectionState } from './types';
import type { TreeTone } from '../TreeView/types';
import { getTreeColorTokens } from '../TreeView/toneColors';

// ── useIsDark (local copy — mirrors ConnectionFlowConnector's) ─────────────────

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
        return () => { media.removeEventListener('change', update); obs.disconnect(); };
    }, []);
    return isDark;
}

// ── Bypass path data ──────────────────────────────────────────────────────────
// The bypass travels from the top-right connection point of the source card
// to the top-left connection point of the destination card using an orthogonal
// stepped path with rounded corners, staying just above the card tops.

interface BypassArcData {
    /** top-right connection point of source card — inset from corner */
    sx: number;
    /** top edge of source card */
    sy: number;
    /** top-left connection point of destination card — inset from corner */
    dx: number;
    /** top edge of destination card */
    dy: number;
    sourceTone: TreeTone;
    destTone: TreeTone;
    /** True when at least one item in the destination group is currently active (running). */
    destActive: boolean;
}

/** How many px above the card tops the bypass path travels. */
const BYPASS_LIFT = 10;
/** Radius of the rounded corners on the bypass path. */
const BYPASS_CORNER_R = 6;
/** Inset from card corners for the top-edge connection points (matches card border-radius). */
const CARD_CORNER_INSET = 19;
/** How many px the ring base overlaps into the card so the card border is fully covered. */
const RING_OVERLAP = 1;

export type { ConnectionState, ConnectionFlowConnectorConfig, ConnectionFlowItem, ConnectionFlowProps } from './types';

// ── Column group — single item or parallel cluster ────────────────────────────

type ColumnGroup =
    | { kind: 'single'; item: ConnectionFlowItem }
    | { kind: 'parallel'; items: ConnectionFlowItem[] };

function buildGroups(items: ConnectionFlowItem[]): ColumnGroup[] {
    const groups: ColumnGroup[] = [];
    let i = 0;
    while (i < items.length) {
        if (items[i].parallel) {
            const batch: ConnectionFlowItem[] = [];
            while (i < items.length && items[i].parallel) {
                batch.push(items[i]);
                i++;
            }
            groups.push({ kind: 'parallel', items: batch });
        } else {
            groups.push({ kind: 'single', item: items[i] });
            i++;
        }
    }
    return groups;
}

/** Returns a stable key for a group */
function groupKey(g: ColumnGroup): string {
    return g.kind === 'single' ? g.item.id : g.items.map(it => it.id).join('|');
}

/** True when a group does NOT emit a right-side connector */
function isTerminal(g: ColumnGroup): boolean {
    return g.kind === 'single'
        ? (g.item.terminal ?? false)
        : (g.items[g.items.length - 1]?.terminal ?? false);
}

/** True when every item in the group is flagged as skipped */
function isGroupSkipped(g: ColumnGroup): boolean {
    return g.kind === 'single'
        ? (g.item.skipped ?? false)
        : g.items.every(it => it.skipped ?? false);
}

/** Returns the effective tone of the first item in a group (neutral when unset). */
function effectiveTone(g: ColumnGroup): TreeTone {
    return (g.kind === 'single' ? g.item.tone : g.items[0]?.tone) ?? 'neutral';
}

// ── ConnectionFlow ────────────────────────────────────────────────────────────

const ConnectionFlow: React.FC<ConnectionFlowProps> = ({
    items,
    flowState = 'flowing',
    flowIcon,
    connectorWidth = 56,
    animated = true,
    dotSpacing = 60,
    connectorBorderSize = 'xs',
    connectorHalf = true,
    showLine = true,
    childIndent = 'xs',
    childRowGap = 8,
    allowScroll = false,
    itemWidth,
    autoScale = false,
    minScale = 0.55,
    className,
    rightAction,
    hoverable = false,
    autoConnectorState = false,
    animateCompleted = false,
}) => {
    const isDark = useIsDark();

    // Track geometry per column group
    const [colGeo, setColGeo] = useState<Record<number, ColumnGeometry>>({});

    const handleGeo = useCallback((idx: number, geo: ColumnGeometry) => {
        setColGeo((prev) => {
            const cur = prev[idx];
            if (cur && cur.totalHeight === geo.totalHeight &&
                cur.isParallelGroup === geo.isParallelGroup &&
                cur.anchors.length === geo.anchors.length &&
                cur.anchors.every((a, i) => a === geo.anchors[i])) return prev;
            return { ...prev, [idx]: geo };
        });
    }, []);

    // ── Auto-scale ────────────────────────────────────────────────────────────
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined);

    useLayoutEffect(() => {
        if (!autoScale) {
            setScale(1);
            setScaledHeight(undefined);
            return;
        }

        const container = containerRef.current;
        const content = contentRef.current;
        if (!container || !content) return;

        const measure = () => {
            // Temporarily reset transform so we read the natural (scale=1) dimensions
            content.style.transform = '';
            const containerW = container.offsetWidth;
            const naturalW = content.scrollWidth;
            const naturalH = content.scrollHeight;
            if (!containerW || !naturalW) return;

            const raw = containerW / naturalW;
            const s = Math.min(1, Math.max(minScale, raw));
            setScale(s);
            setScaledHeight(s < 1 ? Math.ceil(naturalH * s) : undefined);
        };

        measure();

        const ro = new ResizeObserver(measure);
        ro.observe(container);
        return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoScale, minScale, items]);

    // ── Bypass arc state ──────────────────────────────────────────────────────
    // One ref per group (index = group index); tracks only the card div, not the connector.
    const groupDivRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [bypassArcs, setBypassArcs] = useState<BypassArcData[]>([]);

    // ── Pre-process items into groups ─────────────────────────────────────────
    const groups = buildGroups(items);

    // ── Auto-skipped set ──────────────────────────────────────────────────────
    // When autoConnectorState is on, derive which groups are "skipped" from their
    // tone alone (neutral tone with at least one non-neutral successor).
    // The result is stable across renders where items haven't changed.
    // Explicit skipped:false always takes precedence — an item that was executed
    // but happens to have a neutral tone must not be auto-treated as bypassed.
    const autoSkippedSet = useMemo(() => {
        const set = new Set<number>();
        if (!autoConnectorState) return set;
        const grps = buildGroups(items);
        grps.forEach((g, gi) => {
            if (effectiveTone(g) !== 'neutral') return;
            // If any item in the group explicitly declares skipped:false it ran —
            // honour that and skip the auto-detection for this group.
            const explicitlyNotSkipped = g.kind === 'single'
                ? g.item.skipped === false
                : g.items.some(it => it.skipped === false);
            if (explicitlyNotSkipped) return;
            const hasNonNeutralAfter = grps.slice(gi + 1).some(sg => effectiveTone(sg) !== 'neutral');
            if (hasNonNeutralAfter) set.add(gi);
        });
        return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, autoConnectorState]);

    // Compute bypass arc positions from DOM measurements.
    // Uses `items` (not derived `groups`) in deps so the callback is only recreated
    // when the actual items or scale change, not on every render.
    const computeBypassArcs = useCallback(() => {
        if (!contentRef.current) return;
        const contentEl = contentRef.current;
        const contentRect = contentEl.getBoundingClientRect();
        if (!contentRect.width) return;

        const grps = buildGroups(items);
        const arcs: BypassArcData[] = [];
        let skipStart = -1;

        for (let gi = 0; gi <= grps.length; gi++) {
            const skipped = gi < grps.length && (isGroupSkipped(grps[gi]) || autoSkippedSet.has(gi));

            if (skipped && skipStart === -1) {
                skipStart = gi;
            } else if (!skipped && skipStart !== -1) {
                // Arc from group[skipStart-1] to group[gi]
                const prevEl = groupDivRefs.current[skipStart - 1];
                const nextEl = groupDivRefs.current[gi];

                if (prevEl && nextEl) {
                    const prevRect = prevEl.getBoundingClientRect();
                    const nextRect = nextEl.getBoundingClientRect();
                    // Convert screen coords → content's natural (pre-scale) coordinate space.
                    // Connection points are on the TOP edge of each card, inset from the corners
                    // so they sit inside the rounded-corner border (not at the very tip).
                    const sx = (prevRect.right  - CARD_CORNER_INSET - contentRect.left) / scale;
                    const sy = (prevRect.top    - contentRect.top)  / scale;
                    const dx = (nextRect.left   + CARD_CORNER_INSET - contentRect.left) / scale;
                    const dy = (nextRect.top    - contentRect.top)  / scale;

                    const prevGroup = grps[skipStart - 1];
                    const srcTone: TreeTone = prevGroup
                        ? ((prevGroup.kind === 'single' ? prevGroup.item.tone : prevGroup.items[0]?.tone) ?? 'neutral')
                        : 'neutral';
                    const dstGroup = grps[gi];
                    const dstTone: TreeTone = dstGroup
                        ? ((dstGroup.kind === 'single' ? dstGroup.item.tone : dstGroup.items[0]?.tone) ?? 'neutral')
                        : 'neutral';
                    const destActive = dstGroup
                        ? (dstGroup.kind === 'single'
                            ? (dstGroup.item.active ?? false)
                            : dstGroup.items.some(it => it.active ?? false))
                        : false;

                    arcs.push({ sx, sy, dx, dy, sourceTone: srcTone, destTone: dstTone, destActive });
                }
                skipStart = -1;
            }
        }

        setBypassArcs(arcs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, scale, autoSkippedSet]);

    useLayoutEffect(() => {
        computeBypassArcs();
        const ro = new ResizeObserver(computeBypassArcs);
        if (contentRef.current) ro.observe(contentRef.current);
        return () => ro.disconnect();
    }, [computeBypassArcs]);

    if (groups.length === 0) return null;

    // Which groups emit a right-side connector
    const emitsConnector = groups.map((g, gi) => !isTerminal(g) && gi < groups.length - 1);

    // When autoScale is active and scale < 1 the content must overflow the clipped
    // outer div — we allow horizontal scroll only if scale is pinned at minScale.
    const needsScroll = autoScale && scale <= minScale;

    const outerClass = classNames(
        autoScale ? 'relative w-full' : 'flex items-start',
        !autoScale && allowScroll && 'overflow-auto max-w-full',
        needsScroll && 'overflow-x-auto',
        !autoScale && !allowScroll && !needsScroll && 'overflow-hidden',
        className,
    );

    const contentStyle: React.CSSProperties | undefined =
        autoScale && scale < 1
            ? { transform: `scale(${scale})`, transformOrigin: 'left top' }
            : undefined;

    const content = (
        <div
            ref={contentRef}
            className="relative flex items-start"
            style={contentStyle}
        >
            {groups.map((group, gi) => {
                const prevGroup = groups[gi - 1];
                const isFirst = gi === 0;
                const renderConnector = !isFirst && (prevGroup ? emitsConnector[gi - 1] : false);

                // Resolve connector config — from the group's "first receiver" item
                const receiverItem = group.kind === 'single' ? group.item : group.items[0];
                const connCfg = receiverItem.connector;

                // Connector state: explicit override → auto-derived (if autoConnectorState) → global flowState
                const state: ConnectionState = connCfg?.state ??
                    (autoConnectorState && prevGroup
                        ? (effectiveTone(prevGroup) !== 'neutral' ? 'stopped' : 'disabled')
                        : flowState);
                const icon = connCfg?.icon ?? flowIcon;
                const cWidth = connCfg?.width ?? connectorWidth;
                const cAnimated = connCfg?.animated ?? animated;
                const cDotSpace = connCfg?.dotSpacing ?? dotSpacing;
                const cBorder = connCfg?.borderSize ?? connectorBorderSize;
                const cHalf = connCfg?.halfRing ?? connectorHalf;
                const cShowLine = connCfg?.showLine ?? showLine;

                // Suppress animateCompleted on connectors adjacent to skipped groups —
                // the bypass arc already carries the animated flow over those steps.
                const thisGroupSkipped = isGroupSkipped(group) || autoSkippedSet.has(gi);
                const prevGroupSkipped = gi > 0 && (isGroupSkipped(groups[gi - 1]) || autoSkippedSet.has(gi - 1));
                const cAnimateCompleted = (thisGroupSkipped || prevGroupSkipped)
                    ? false
                    : (connCfg?.animateCompleted ?? animateCompleted);

                // Source tone (from the outgoing / previous group)
                const prevFirstItem = prevGroup
                    ? (prevGroup.kind === 'single' ? prevGroup.item : prevGroup.items[0])
                    : undefined;
                const srcTone: TreeTone = connCfg?.sourceTone ?? prevFirstItem?.tone ?? 'neutral';

                // Target tone (from this group's first item)
                const dstTone: TreeTone = connCfg?.targetTone ?? receiverItem.tone ?? 'neutral';

                const prevGeo = colGeo[gi - 1];
                const curGeo  = colGeo[gi];

                // Left anchors — all prev anchors (handles both single and parallel source)
                const leftAnchors = prevGeo?.anchors;

                // Right anchors — for fan-out into a parallel group
                const rightAnchors = (curGeo?.isParallelGroup && curGeo.anchors.length > 1)
                    ? curGeo.anchors
                    : undefined;

                // Right anchor Y for single target (not fan-out)
                const rightAnchorY = rightAnchors ? undefined : curGeo?.anchors[0];

                // Connector height: span the taller of the two adjacent groups
                const connectorHeight = (prevGeo && curGeo)
                    ? Math.max(prevGeo.totalHeight, curGeo.totalHeight)
                    : (prevGeo?.totalHeight ?? curGeo?.totalHeight);

                // Extra source tones for multi-source rings (fan-in from prev parallel group, or children)
                const extraSourceTones: TreeTone[] = prevGroup?.kind === 'parallel'
                    ? prevGroup.items.slice(1).map(it => it.tone ?? 'neutral')
                    : (prevGroup?.kind === 'single'
                        ? (prevGroup.item.children?.map(c => c.connector?.sourceTone ?? c.tone ?? 'neutral') ?? [])
                        : []);

                // Right anchor tones for fan-out rings
                const rightAnchorTones: TreeTone[] = rightAnchors
                    ? (group as { kind: 'parallel'; items: ConnectionFlowItem[] }).items.map(it => it.tone ?? 'neutral')
                    : [];

                // Right anchor states for per-lane animation in fan-out
                const rightAnchorStates = rightAnchors
                    ? (group as { kind: 'parallel'; items: ConnectionFlowItem[] }).items.map((it): ConnectionState => {
                        if (it.connector?.state !== undefined) return it.connector.state;
                        if (autoConnectorState) {
                            if (it.active) return 'flowing';
                            const tone = it.tone ?? 'neutral';
                            return tone !== 'neutral' ? 'stopped' : 'disabled';
                        }
                        return state;
                    })
                    : [];

                return (
                    <React.Fragment key={groupKey(group)}>
                        {/* Connector leading INTO this group */}
                        {renderConnector && (
                            <ConnectionFlowConnector
                                state={state}
                                sourceTone={srcTone}
                                targetTone={dstTone}
                                middleIcon={icon}
                                width={cWidth}
                                halfRing={cHalf}
                                showLine={cShowLine}
                                animated={cAnimated}
                                dotSpacing={cDotSpace}
                                borderSize={cBorder}
                                sourceFill={connCfg?.sourceFill}
                                sourceBorder={connCfg?.sourceBorder}
                                sourceDot={connCfg?.sourceDot}
                                targetFill={connCfg?.targetFill}
                                targetBorder={connCfg?.targetBorder}
                                targetDot={connCfg?.targetDot}
                                dotColor={connCfg?.dotColor}
                                leftAnchors={leftAnchors}
                                connectorHeight={connectorHeight}
                                rightAnchorY={rightAnchorY}
                                extraSourceTones={extraSourceTones}
                                rightAnchors={rightAnchors}
                                rightAnchorTones={rightAnchorTones}
                                rightAnchorStates={rightAnchorStates}
                                animateCompleted={cAnimateCompleted}
                            />
                        )}

                        {/* Column or parallel group — wrapped in a ref div for bypass arc measurement */}
                        <div
                            ref={el => { groupDivRefs.current[gi] = el; }}
                            className={itemWidth ? 'flex-shrink-0' : 'flex-1 min-w-0'}
                            style={itemWidth
                                ? { width: typeof itemWidth === 'number' ? `${itemWidth}px` : itemWidth }
                                : undefined}
                        >
                            {group.kind === 'single' ? (
                                <ConnectionFlowColumn
                                    item={group.item}
                                    childIndent={childIndent}
                                    childRowGap={childRowGap}
                                    animated={animated}
                                    showLine={showLine}
                                    connectorHalf={connectorHalf}
                                    connectorBorderSize={connectorBorderSize}
                                    dotSpacing={dotSpacing}
                                    flowActive={state === 'flowing'}
                                    onGeometryChange={(geo) => handleGeo(gi, geo)}
                                    itemWidth={itemWidth}
                                    hoverable={hoverable}
                                />
                            ) : (
                                <ConnectionFlowParallelGroup
                                    items={group.items}
                                    itemWidth={itemWidth}
                                    hoverable={hoverable}
                                    onGeometryChange={(geo) => handleGeo(gi, geo)}
                                />
                            )}
                        </div>
                    </React.Fragment>
                );
            })}

            {rightAction && (
                <div className="flex items-center shrink-0 ml-3 self-start">
                    {rightAction}
                </div>
            )}

            {/* ── Bypass arc overlay ──────────────────────────────────────────── */}
            {bypassArcs.length > 0 && (
                <svg
                    className="absolute inset-0 pointer-events-none z-20"
                    style={{ width: '100%', height: '100%', overflow: 'visible' }}
                >
                    {bypassArcs.map((arc, i) => {
                        const ci = isDark ? 1 : 0;
                        const srcTokens = getTreeColorTokens(arc.sourceTone);
                        const dstTokens = getTreeColorTokens(arc.destTone);
                        const lineColor = srcTokens.connBorder[ci];
                        const dotFill   = srcTokens.connDot[ci];

                        // Path starts/ends RING_OVERLAP px inside the card top edge so the
                        // ring fill covers the card border (same technique as left/right rings).
                        const sBase = arc.sy + RING_OVERLAP;
                        const dBase = arc.dy + RING_OVERLAP;

                        // Orthogonal stepped path with rounded corners:
                        //  (sx, sBase) → up → rounded bend → right → rounded bend → down to (dx, dBase)
                        const aboveY = Math.min(arc.sy, arc.dy) - BYPASS_LIFT;
                        const CR = BYPASS_CORNER_R;
                        const d = [
                            `M ${arc.sx} ${sBase}`,
                            `V ${aboveY + CR}`,
                            `Q ${arc.sx} ${aboveY} ${arc.sx + CR} ${aboveY}`,
                            `H ${arc.dx - CR}`,
                            `Q ${arc.dx} ${aboveY} ${arc.dx} ${aboveY + CR}`,
                            `V ${dBase}`,
                        ].join(' ');

                        // Approximate path length for dot timing
                        const legV1  = Math.abs(sBase - aboveY - CR);
                        const legH   = Math.max(0, arc.dx - arc.sx - 2 * CR);
                        const legV2  = Math.abs(dBase - aboveY - CR);
                        const corners = Math.PI * 0.5 * CR * 2; // two quarter-circle corners
                        const pathLen = legV1 + legH + legV2 + corners;

                        const DOT_VELOCITY = 35;
                        const DOT_GAP = dotSpacing / DOT_VELOCITY;
                        const numDots = Math.max(1, Math.ceil(pathLen / dotSpacing));
                        const virtualLen = numDots * dotSpacing;
                        const dur = numDots * DOT_GAP;

                        // Add overflow extension AFTER the destination so dots follow the correct
                        // arc shape (including the destination corner and descent) before the
                        // invisible loop-back segment begins. Extending the H segment rightward
                        // (old approach) caused dots to travel past the destination horizontally
                        // and miss the descent curve entirely.
                        const overflow = Math.max(0, virtualLen - pathLen);
                        const dMotion = overflow > 0 ? [
                            `M ${arc.sx} ${sBase}`,
                            `V ${aboveY + CR}`,
                            `Q ${arc.sx} ${aboveY} ${arc.sx + CR} ${aboveY}`,
                            `H ${arc.dx - CR}`,
                            `Q ${arc.dx} ${aboveY} ${arc.dx} ${aboveY + CR}`,
                            `V ${dBase}`,
                            `v ${overflow}`,
                        ].join(' ') : d;

                        const fadeOutEnd   = pathLen / virtualLen;
                        const fadeOutStart = Math.max(0, fadeOutEnd - 10 / virtualLen);
                        const fadeInEnd    = Math.min(fadeOutStart, 4 / virtualLen);
                        const opTimes = `0;${fadeInEnd.toFixed(4)};${fadeOutStart.toFixed(4)};${fadeOutEnd.toFixed(4)};1`;

                        // Ring visual constants (match ConnectionFlowConnector)
                        const ringR = 5.5;
                        const bw = 1.5;

                        // Source ring — half-circle bumping upward, base sits RING_OVERLAP px
                        // inside the card so the fill covers the card's top border.
                        const srcFill   = srcTokens.connFill[ci];
                        const srcBorder = srcTokens.connBorder[ci];
                        const srcDot    = srcTokens.connDot[ci];
                        const srcArcD   = `M ${arc.sx - ringR} ${sBase} A ${ringR} ${ringR} 0 0 1 ${arc.sx + ringR} ${sBase}`;

                        // Destination ring — same treatment.
                        const dstFill   = dstTokens.connFill[ci];
                        const dstBorder = dstTokens.connBorder[ci];
                        const dstDot    = dstTokens.connDot[ci];
                        const dstArcD   = `M ${arc.dx - ringR} ${dBase} A ${ringR} ${ringR} 0 0 1 ${arc.dx + ringR} ${dBase}`;

                        return (
                            <g key={i}>
                                {/* Bypass path */}
                                <path
                                    d={d}
                                    fill="none"
                                    stroke={lineColor}
                                    strokeWidth={1.5}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Source ring endpoint */}
                                <path d={srcArcD} fill={srcFill} />
                                <path d={srcArcD} stroke={srcBorder} strokeWidth={bw} fill="none" strokeLinecap="round" />
                                <circle cx={arc.sx} cy={sBase} r="2" fill={srcDot} />

                                {/* Destination ring endpoint */}
                                <path d={dstArcD} fill={dstFill} />
                                <path d={dstArcD} stroke={dstBorder} strokeWidth={bw} fill="none" strokeLinecap="round" />
                                <circle cx={arc.dx} cy={dBase} r="2" fill={dstDot} />

                                {/* Animated dots — only when bypass is actively being traversed
                                    (source done, destination not yet reached), or when
                                    animateCompleted is on (completed arcs also animate). */}
                                {(() => {
                                    // Animate when source is done AND destination is either
                                    // not yet reached (neutral) or currently running (destActive).
                                    const arcActive    = arc.sourceTone !== 'neutral' && (arc.destTone === 'neutral' || arc.destActive);
                                    const arcCompleted = arc.sourceTone !== 'neutral' && arc.destTone !== 'neutral' && !arc.destActive;
                                    return animated && (arcActive || (animateCompleted && arcCompleted));
                                })() && Array.from({ length: numDots }, (_, di) => (
                                    <circle key={di} r="3" fill={dotFill} opacity="0">
                                        <animateMotion
                                            path={dMotion}
                                            dur={`${dur}s`}
                                            begin={`${(-di * DOT_GAP).toFixed(3)}s`}
                                            repeatCount="indefinite"
                                        />
                                        <animate
                                            attributeName="opacity"
                                            values="0;0.9;0.9;0;0"
                                            keyTimes={opTimes}
                                            dur={`${dur}s`}
                                            begin={`${(-di * DOT_GAP).toFixed(3)}s`}
                                            repeatCount="indefinite"
                                        />
                                    </circle>
                                ))}
                            </g>
                        );
                    })}
                </svg>
            )}
        </div>
    );

    if (autoScale) {
        return (
            <div
                ref={containerRef}
                className={outerClass}
                style={scaledHeight !== undefined ? { height: scaledHeight } : undefined}
            >
                {content}
            </div>
        );
    }

    return (
        <div className={outerClass}>
            {content}
        </div>
    );
};

export default ConnectionFlow;
