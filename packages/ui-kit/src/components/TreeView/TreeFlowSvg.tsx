import React, { useEffect, useState } from 'react';
import { getTreeColorTokens, NEUTRAL_TOKENS } from './toneColors';
import type { TreeFlowSvgProps } from './types';

// ── useIsDark — detects Tailwind dark class strategy on <html> ────────────────

function useIsDark(): boolean {
    const [isDark, setIsDark] = useState(
        () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
    );
    useEffect(() => {
        const obs = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        obs.observe(document.documentElement, { attributeFilter: ['class'] });
        return () => obs.disconnect();
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
    mode = 'tree', parentAnchorY = 0,
    cardHeights, cardAnchors, toneList, activeList,
    rootTone, rootActive = false,
    rowGap, stubHeight = 12,
    indent = 'xs', showLine = true, showConnectors = true,
    connectorHalf = false, connectorBorderSize = 'xs',
    dotSpacing = 50, animated = true,
    style, className,
}) => {
    const isDark = useIsDark();
    const indentPx = INDENT_PX[indent];

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
    const trunkTop = isBracket ? parentAnchorY : 0;

    if (lastMidY <= stubHeight || totalHeight <= stubHeight) return null;

    // ── Color helpers ─────────────────────────────────────────────────────────

    const ci = isDark ? 1 : 0;

    const rootTokens = getTreeColorTokens(rootTone);
    const trunkColor = rootActive
        ? rootTokens.trunk[ci]
        : NEUTRAL_TOKENS.trunk[ci];

    const branchLineColor = (i: number): string => {
        if (!activeList[i]) return NEUTRAL_TOKENS.trunk[ci];
        return (getTreeColorTokens(toneList[i]) ?? rootTokens).trunk[ci];
    };

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
    const actualTrunkLen = isBracket ? (indentPx - 12 + lastMidY - parentAnchorY) : lastMidY;
    const numDots = Math.max(1, Math.ceil(actualTrunkLen / dotSpacing));
    const virtualTrunkLen = numDots * dotSpacing;
    const DOT_GAP = dotSpacing / DOT_VELOCITY;
    const DUR = numDots * DOT_GAP;
    const overflow = Math.max(0, virtualTrunkLen - actualTrunkLen);

    const actualBranchLen = indentPx - 12;
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
                    stroke={trunkColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                    fill="none"
                />
            )}

            {/* Parent line for bracket mode (horizontal from parent to trunk) */}
            {showLine && isBracket && (
                <path
                    d={`M ${indentPx} ${parentAnchorY} L 12 ${parentAnchorY}`}
                    stroke={trunkColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                    fill="none"
                />
            )}

            {/* Per-item horizontal branches */}
            {showLine && midYs.map((my, i) => (
                <path
                    key={`branch-${i}`}
                    d={`M 12 ${my} L ${indentPx} ${my}`}
                    stroke={branchLineColor(i)}
                    strokeWidth={2}
                    strokeLinecap="round"
                    fill="none"
                />
            ))}

            {/* Connector decorators — rendered after lines so they sit on top */}
            {showConnectors && (
                <>
                    {/* Root connector */}
                    {isBracket ? (
                        <g>
                            <circle cx="12" cy={parentAnchorY} r="4" fill={rootBorder} />
                            <circle cx={indentPx} cy={parentAnchorY} r={ringR} fill={rootFill} />
                            {connectorHalf
                                ? <path d={entryArc(indentPx, parentAnchorY)} stroke={rootBorder} strokeWidth={bw} fill="none" strokeLinecap="round" />
                                : <circle cx={indentPx} cy={parentAnchorY} r={ringR} stroke={rootBorder} strokeWidth={bw} fill="none" />
                            }
                            <circle cx={indentPx} cy={parentAnchorY} r="2" fill={rootDot} />
                        </g>
                    ) : (
                        <>
                            <circle cx="12" cy="0" r={ringR} fill={rootFill} />
                            {connectorHalf
                                ? <path d={rootArc(12)} stroke={rootBorder} strokeWidth={bw} fill="none" strokeLinecap="round" />
                                : <circle cx="12" cy="0" r={ringR} stroke={rootBorder} strokeWidth={bw} fill="none" />
                            }
                            <circle cx="12" cy="0" r="2" fill={rootDot} />
                        </>
                    )}

                    {/* Per-item: junction dot on trunk + entry ring on card edge */}
                    {midYs.map((my, i) => (
                        <g key={`conn-${i}`}>
                            <circle cx="12" cy={my} r="4" fill={cBorder(i)} />
                            <circle cx={indentPx} cy={my} r={ringR} fill={cFill(i)} />
                            {connectorHalf
                                ? <path d={entryArc(indentPx, my)} stroke={cBorder(i)} strokeWidth={bw} fill="none" strokeLinecap="round" />
                                : <circle cx={indentPx} cy={my} r={ringR} stroke={cBorder(i)} strokeWidth={bw} fill="none" />
                            }
                            <circle cx={indentPx} cy={my} r="2" fill={cDot(i)} />
                        </g>
                    ))}
                </>
            )}

            {/* Trunk dots */}
            {isFlowing && Array.from({ length: numDots }, (_, i) => {
                const isB = isBracket;
                const trPath = isB
                    ? `M ${indentPx} ${parentAnchorY} L 12 ${parentAnchorY} L 12 ${lastMidY + overflow}`
                    : `M 12 0 L 12 ${lastMidY + overflow}`;

                // Fix WebKit animateMotion pacing bugs by manually specifying linear distances
                const l1 = isB ? (indentPx - 12) : (lastMidY + overflow);
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
                const pathToMy = isBracket ? (indentPx - 12 + my - parentAnchorY) : my;
                const branchBeginBase = (pathToMy / virtualTrunkLen) * DUR;
                const bf = branchFrac;

                // Fixed-distance opacity fading ensures dots don't vanish prematurely on short branches
                const bFadeIn = Math.min(bf, 4 / virtualTrunkLen);
                const bFadeOutStart = Math.max(bFadeIn, bf - (10 / virtualTrunkLen));
                const bOpKT = `0;${bFadeIn.toFixed(4)};${bFadeOutStart.toFixed(4)};${bf.toFixed(4)};1`;

                return Array.from({ length: numDots }, (_, di) => (
                    <circle key={`branch-${ri}-${di}`} cx="12" cy={my} r="3" fill={animDotColor} opacity="0">
                        <animate attributeName="cx"
                            values={`12;${indentPx};${indentPx}`}
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
