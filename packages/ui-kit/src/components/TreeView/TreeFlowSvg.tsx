import React, { useEffect, useState } from 'react';
import { getTreeColorTokens, NEUTRAL_TOKENS } from './toneColors';
import type { TreeFlowSvgProps } from './types';

// ── useIsDark — detects Tailwind dark class strategy on <html> ────────────────

function useIsDark(): boolean {
    const detectDark = (): boolean => {
        if (typeof document === 'undefined') return false;
        const probe = document.createElement('div');
        probe.className = 'hidden dark:block';
        document.body.appendChild(probe);
        const darkActive = window.getComputedStyle(probe).display === 'block';
        probe.remove();
        return darkActive;
    };

    const [isDark, setIsDark] = useState<boolean>(() => detectDark());

    useEffect(() => {
        const update = () => setIsDark(detectDark());
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

// ── Constants ────────────────────────────────────────────────────────────────

const INDENT_PX: Record<'xs' | 'sm' | 'md' | 'lg', number> = {
    xs: 24, sm: 36, md: 52, lg: 72,
};

const CONNECTOR_BORDER_WIDTH: Record<'fit' | 'xs' | 'sm' | 'md' | 'lg', number> = {
    fit: 1, xs: 1.5, sm: 2, md: 2.5, lg: 3,
};

// ── TreeFlowSvg ──────────────────────────────────────────────────────────────
//
// Single SVG spanning all items at one tree level.
// Position: absolute, left:0, top:-stubHeight — extends above the items container
// to visually connect from the root/parent card down through the stub gap.
//
// Layout contract (enforced by parent container):
//   position:relative, paddingLeft:indentPx
//   This SVG: position:absolute, left:0, top:-stubHeight
//   Route rows: normal flow at x=indentPx
//   rendered LAST so it paints on top of card borders without z-index

const TreeFlowSvg: React.FC<TreeFlowSvgProps> = ({
    mode = 'tree', parentAnchorY = 0, parentOffset = 0, depth = 0, rootChildIndentExtra = 0,
    cardHeights, cardAnchors, toneList, activeList,
    rootTone, rootActive = false,
    rowGap, stubHeight = 12,
    indent = 'xs', showLine = true, showConnectors = true, connectorStyle = 'rings',
    branchColorMode = 'item', junctionStyle = 'rounded', showCenterDot = true,
    connectorHalf = false, connectorBorderSize = 'xs',
    dotSpacing = 50, animated = true,
    style, className,
}) => {
    const isDark = useIsDark();
    const indentPx = INDENT_PX[indent];
    const branchDepthExtra = depth === 1 ? rootChildIndentExtra : 0;
    const branchEndX = connectorStyle === 'dots' ? indentPx + 2 + branchDepthExtra : indentPx + branchDepthExtra;

    // ── Compute midYs (connector Y positions) ─────────────────────────────────
    const midYs: number[] = [];
    let cumY = stubHeight;
    for (let i = 0; i < cardHeights.length; i++) {
        const h = cardHeights[i] ?? 0;
        const anchor = (cardAnchors?.[i] ?? 0) > 0 ? cardAnchors![i] : h / 2;
        midYs.push(cumY + anchor);
        cumY += h + rowGap;
    }
    const totalHeight = cumY;
    const lastMidY = midYs[midYs.length - 1] ?? 0;

    const isBracket = mode === 'bracket';
    const hasParentStub = !isBracket && stubHeight > 0;
    const normalizedParentOffset = Math.max(0, parentOffset);
    const rootInset = hasParentStub ? -2.8 : 0;
    const branchCorner = 3;
    const rootConnectorY = isBracket
        ? parentAnchorY
        : (hasParentStub ? Math.max(-6, stubHeight - normalizedParentOffset + rootInset) : 0);
    const trunkTop = isBracket ? parentAnchorY : rootConnectorY;

    if (lastMidY <= stubHeight || totalHeight <= stubHeight) return null;

    // ── Color helpers ─────────────────────────────────────────────────────────

    const ci = isDark ? 1 : 0;

    const rootTokens = getTreeColorTokens(rootTone);
    const trunkColor = rootActive
        ? rootTokens.connBorder[ci]
        : NEUTRAL_TOKENS.connBorder[ci];

    const branchLineColor = (i: number): string => {
        if (!activeList[i]) return NEUTRAL_TOKENS.connBorder[ci];
        return (getTreeColorTokens(toneList[i]) ?? rootTokens).connBorder[ci];
    };
    const branchUsesParentTone = branchColorMode === 'parent' && hasParentStub;
    const resolvedTrunkColor = trunkColor;
    const resolvedBranchLineColor = (i: number): string =>
        branchUsesParentTone ? trunkColor : branchLineColor(i);

    const cFill = (i: number): string =>
        (getTreeColorTokens(toneList[i]) ?? rootTokens).connFill[ci];
    const cBorder = (i: number): string =>
        (getTreeColorTokens(toneList[i]) ?? rootTokens).connBorder[ci];
    const cDot = (i: number): string =>
        (getTreeColorTokens(toneList[i]) ?? rootTokens).connDot[ci];

    const rootFill = rootTokens.connFill[ci];
    const rootBorder = rootTokens.connBorder[ci];
    const rootDot = rootTokens.connDot[ci];

    // ── Ring arc paths ─────────────────────────────────────────────────────────
    const ringR = 5.5;
    const bw = CONNECTOR_BORDER_WIDTH[connectorBorderSize];

    // Entry ring → LEFT semicircle (top→bottom, sweep=0 CCW) — sits in gutter
    const entryArc = (cx: number, cy: number) =>
        `M ${cx} ${cy - ringR} A ${ringR} ${ringR} 0 0 0 ${cx} ${cy + ringR}`;
    // Root ring → BOTTOM semicircle (left→right, sweep=0) — sits below root card
    const rootArc = (cx: number) =>
        `M ${cx - ringR} 0 A ${ringR} ${ringR} 0 0 0 ${cx + ringR} 0`;

    // ── Dot animation ─────────────────────────────────────────────────────────
    const isFlowing = animated && (rootActive || activeList.some(Boolean));
    const dotColor = isDark ? '#d4d4d4' : '#737373';  // neutral-300 / neutral-500 as fallback
    // Use root token dot color when flowing
    const animDotColor = isFlowing ? rootTokens.connDot[ci] : dotColor;

    const DOT_VELOCITY = 35;
    const actualTrunkLen = isBracket ? (indentPx - 12 + lastMidY - parentAnchorY) : Math.max(0, lastMidY - trunkTop);
    const numDots = Math.max(1, Math.ceil(actualTrunkLen / dotSpacing));
    const virtualTrunkLen = numDots * dotSpacing;
    const DOT_GAP = dotSpacing / DOT_VELOCITY;
    const DUR = numDots * DOT_GAP;
    const overflow = Math.max(0, virtualTrunkLen - actualTrunkLen);

    const actualBranchLen = Math.max(0, branchEndX - 12);
    const branchFrac = actualBranchLen / virtualTrunkLen;

    return (
        <svg
            width={indentPx}
            height={totalHeight}
            viewBox={`0 0 ${indentPx} ${totalHeight}`}
            overflow="visible"
            className={className}
            style={{ position: 'absolute', left: 0, top: -stubHeight, pointerEvents: 'none', ...style }}
        >
            {/* Vertical trunk */}
            {showLine && (
                <path
                    d={`M 12 ${trunkTop} L 12 ${lastMidY}`}
                    stroke={resolvedTrunkColor}
                    strokeWidth={connectorStyle === 'dots' ? 2.25 : 2.1}
                    strokeLinecap={junctionStyle === 'rounded' ? 'butt' : 'round'}
                    strokeLinejoin="round"
                    fill="none"
                />
            )}

            {/* Parent line for bracket mode (horizontal from parent to trunk) */}
            {showLine && isBracket && (
                <path
                    d={`M ${indentPx} ${parentAnchorY} L 12 ${parentAnchorY}`}
                    stroke={resolvedTrunkColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                    fill="none"
                />
            )}

            {/* Per-item horizontal branches */}
            {showLine && midYs.map((my, i) => (
                <path
                    key={`branch-${i}`}
                    d={
                        junctionStyle === 'rounded'
                            ? `M 12 ${my - branchCorner} L 12 ${my} L ${branchEndX} ${my}`
                            : `M 12 ${my} L ${branchEndX} ${my}`
                    }
                    stroke={resolvedBranchLineColor(i)}
                    strokeWidth={connectorStyle === 'dots' ? 2.75 : 2.1}
                    strokeLinecap={junctionStyle === 'rounded' ? 'butt' : 'round'}
                    strokeLinejoin="round"
                    fill="none"
                />
            ))}

            {/* Connector decorators — rendered after lines so they sit on top */}
            {showConnectors && connectorStyle === 'rings' && (
                <>
                    {/* Root connector */}
                    {isBracket ? (
                        <g>
                            {junctionStyle === 'dot' && (
                                <>
                                    <circle cx="12" cy={parentAnchorY} r="4.5" fill={rootFill} />
                                    <circle cx="12" cy={parentAnchorY} r="4.5" stroke={rootBorder} strokeWidth={bw} fill="none" />
                                    {showCenterDot && <circle cx="12" cy={parentAnchorY} r="2" fill={rootDot} />}
                                </>
                            )}
                            <circle cx={indentPx} cy={parentAnchorY} r={ringR} fill={rootFill} />
                            {connectorHalf
                                ? <path d={entryArc(indentPx, parentAnchorY)} stroke={rootBorder} strokeWidth={bw} fill="none" strokeLinecap="round" />
                                : <circle cx={indentPx} cy={parentAnchorY} r={ringR} stroke={rootBorder} strokeWidth={bw} fill="none" />
                            }
                            {showCenterDot && <circle cx={indentPx} cy={parentAnchorY} r="2" fill={rootDot} />}
                        </g>
                    ) : hasParentStub ? (
                        <g>
                            {/* Junction marker entering the child level (half ring by default). */}
                            {connectorHalf
                                ? (
                                    <>
                                        <path d={rootArc(12)} fill={rootFill} transform={`translate(0, ${rootConnectorY})`} />
                                        <path d={rootArc(12)} stroke={rootBorder} strokeWidth={bw} fill="none" strokeLinecap="round" transform={`translate(0, ${rootConnectorY})`} />
                                    </>
                                )
                                : (
                                    <>
                                        <circle cx="12" cy={rootConnectorY} r={ringR} fill={rootFill} />
                                        <circle cx="12" cy={rootConnectorY} r={ringR} stroke={rootBorder} strokeWidth={bw} fill="none" />
                                    </>
                                )}
                            {showCenterDot && <circle cx="12" cy={rootConnectorY} r="2" fill={rootDot} />}
                        </g>
                    ) : (
                        <>
                            <circle cx="12" cy={rootConnectorY} r={ringR} fill={rootFill} />
                            {connectorHalf
                                ? <path d={rootArc(12)} stroke={rootBorder} strokeWidth={bw} fill="none" strokeLinecap="round" transform={`translate(0, ${rootConnectorY})`} />
                                : <circle cx="12" cy={rootConnectorY} r={ringR} stroke={rootBorder} strokeWidth={bw} fill="none" />
                            }
                            {showCenterDot && <circle cx="12" cy={rootConnectorY} r="2" fill={rootDot} />}
                        </>
                    )}

                    {/* Per-item: junction dot on trunk + entry ring on card edge */}
                    {midYs.map((my, i) => (
                        <g key={`conn-${i}`}>
                            {junctionStyle === 'dot' && (
                                <>
                                    <circle cx="12" cy={my} r="4.5" fill={cFill(i)} />
                                    <circle cx="12" cy={my} r="4.5" stroke={resolvedBranchLineColor(i)} strokeWidth={bw} fill="none" />
                                    {showCenterDot && (
                                        <circle
                                            cx="12"
                                            cy={my}
                                            r="2"
                                            fill={cDot(i)}
                                        />
                                    )}
                                </>
                            )}
                            <circle cx={branchEndX} cy={my} r={ringR} fill={cFill(i)} />
                            {connectorHalf
                                ? <path d={entryArc(branchEndX, my)} stroke={cBorder(i)} strokeWidth={bw} fill="none" strokeLinecap="round" />
                                : <circle cx={branchEndX} cy={my} r={ringR} stroke={cBorder(i)} strokeWidth={bw} fill="none" />
                            }
                            {showCenterDot && <circle cx={branchEndX} cy={my} r="2" fill={cDot(i)} />}
                        </g>
                    ))}
                </>
            )}

            {/* Lightweight connector dots (for cleaner tree style) */}
            {showConnectors && connectorStyle === 'dots' && (
                <>
                    <circle cx="12" cy={rootConnectorY} r="4.5" fill={resolvedTrunkColor} />
                    {midYs.map((my, i) => (
                        <g key={`dot-conn-${i}`}>
                            <path
                                d={`M 12 ${my - 6} L 12 ${my + 6}`}
                                stroke={resolvedBranchLineColor(i)}
                                strokeWidth={2.75}
                                strokeLinecap="round"
                                fill="none"
                            />
                            <circle cx="12" cy={my} r="4.5" fill={resolvedBranchLineColor(i)} />
                            <circle cx={branchEndX} cy={my} r="4.5" fill={resolvedBranchLineColor(i)} />
                        </g>
                    ))}
                </>
            )}

            {/* Trunk dots */}
            {isFlowing && Array.from({ length: numDots }, (_, i) => {
                const isB = isBracket;
                const trPath = isB
                    ? `M ${indentPx} ${parentAnchorY} L 12 ${parentAnchorY} L 12 ${lastMidY + overflow}`
                    : `M 12 ${trunkTop} L 12 ${lastMidY + overflow}`;

                // Fix WebKit animateMotion pacing bugs by manually specifying linear distances
                const l1 = isB ? (indentPx - 12) : (lastMidY + overflow - trunkTop);
                const l2 = isB ? (lastMidY - parentAnchorY + overflow) : 0;
                const total = l1 + l2;
                const p1 = total > 0 ? (l1 / total).toFixed(4) : "1";
                const motionProps = isB ? {
                    calcMode: "linear",
                    keyPoints: `0;${p1};1`,
                    keyTimes: `0;${p1};1`
                } : {};

                const fadeOutEnd = (actualTrunkLen / virtualTrunkLen);
                const fadeOutStart = Math.max(0, fadeOutEnd - (10 / virtualTrunkLen));
                const fadeInEnd = Math.min(fadeOutStart, (4 / virtualTrunkLen));
                const opTimes = `0;${fadeInEnd.toFixed(4)};${fadeOutStart.toFixed(4)};${fadeOutEnd.toFixed(4)};1`;

                return (
                    <circle key={`trunk-${i}`} r="3" fill={animDotColor} opacity="0">
                        <animateMotion path={trPath} dur={`${DUR}s`} begin={`${(-i * DOT_GAP).toFixed(3)}s`} repeatCount="indefinite" {...motionProps} />
                        <animate attributeName="opacity" values="0;0.9;0.9;0;0" keyTimes={opTimes}
                            dur={`${DUR}s`} begin={`${(-i * DOT_GAP).toFixed(3)}s`} repeatCount="indefinite" />
                    </circle>
                );
            })}

            {/* Branch dots — one set per active item */}
            {isFlowing && midYs.map((my, ri) => {
                if (!activeList[ri]) return null;
                const pathToMy = isBracket ? (indentPx - 12 + my - parentAnchorY) : Math.max(0, my - trunkTop);
                const branchBeginBase = (pathToMy / virtualTrunkLen) * DUR;
                const bf = branchFrac;

                // Fixed-distance opacity fading ensures dots don't vanish prematurely on short branches
                const bFadeIn = Math.min(bf, 4 / virtualTrunkLen);
                const bFadeOutStart = Math.max(bFadeIn, bf - (10 / virtualTrunkLen));
                const bOpKT = `0;${bFadeIn.toFixed(4)};${bFadeOutStart.toFixed(4)};${bf.toFixed(4)};1`;

                return Array.from({ length: numDots }, (_, di) => (
                    <circle key={`branch-${ri}-${di}`} cx="12" cy={my} r="3" fill={animDotColor} opacity="0">
                        <animate attributeName="cx"
                            values={`12;${branchEndX};${branchEndX}`}
                            keyTimes={`0;${bf.toFixed(4)};1`}
                            dur={`${DUR}s`} begin={`${(branchBeginBase - di * DOT_GAP).toFixed(3)}s`}
                            repeatCount="indefinite" />
                        <animate attributeName="opacity"
                            values="0;0.9;0.9;0;0" keyTimes={bOpKT}
                            dur={`${DUR}s`} begin={`${(branchBeginBase - di * DOT_GAP).toFixed(3)}s`}
                            repeatCount="indefinite" />
                    </circle>
                ));
            })}
        </svg>
    );
};

export { INDENT_PX };
export default TreeFlowSvg;
