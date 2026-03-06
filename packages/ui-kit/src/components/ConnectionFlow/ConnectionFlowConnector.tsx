import React, { useEffect, useState } from 'react';
import { getTreeColorTokens, NEUTRAL_TOKENS } from '../TreeView/toneColors';
import type { TreeTone } from '../TreeView/types';
import type { ConnectionState, ConnectionFlowConnectorConfig } from './types';

// ── useIsDark ─────────────────────────────────────────────────────────────────

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

// ── Border width map ──────────────────────────────────────────────────────────

const BORDER_WIDTH: Record<'fit' | 'xs' | 'sm' | 'md' | 'lg', number> = {
    fit: 1, xs: 1.5, sm: 2, md: 2.5, lg: 3,
};

// ── ConnectionFlowConnector ───────────────────────────────────────────────────

export interface ConnectionFlowConnectorProps {
    state?: ConnectionState;
    sourceTone?: TreeTone;
    targetTone?: TreeTone;
    middleIcon?: React.ReactNode;
    width?: number;
    halfRing?: boolean;
    showLine?: boolean;
    animated?: boolean;
    dotSpacing?: number;
    borderSize?: 'fit' | 'xs' | 'sm' | 'md' | 'lg';
    // Fine-grained color overrides
    sourceFill?: string;
    sourceBorder?: string;
    sourceDot?: string;
    targetFill?: string;
    targetBorder?: string;
    targetDot?: string;
    dotColor?: string;
    /**
     * Multi-source mode: Y offsets from the TOP of the connector space for each
     * source card's centre (parent first, then children).
     * When provided and length > 1, a vertical trunk is drawn on the left side
     * connecting all source rings, and each source gets its own dotted line to
     * the RIGHT entry ring.
     */
    leftAnchors?: number[];
    /**
     * Total height the connector should occupy.
     * Defaults to the source column height; pass max(source, target) when heights differ.
     */
    connectorHeight?: number;
    /**
     * Y offset of the TARGET card's centre from the top of the connector space.
     * When different from the source anchor, a bezier curve is drawn between the
     * two ring positions instead of a straight horizontal line.
     * Defaults to the source anchor (straight line).
     */
    rightAnchorY?: number;
    /**
     * Tones for extra source rings (index 0 = parent, already set via sourceTone).
     * Used to colour child source rings independently.
     */
    extraSourceTones?: TreeTone[];
    /**
     * Fan-out mode: Y offsets from the TOP of the connector space for each TARGET card's centre.
     * When provided and length > 1, a vertical trunk is drawn on the RIGHT side
     * connecting all target rings, and each target gets its own dotted line from the LEFT entry ring.
     */
    rightAnchors?: number[];
    /**
     * Tones for each right-side ring in fan-out mode.
     * Index i corresponds to rightAnchors[i]. Falls back to targetTone.
     */
    rightAnchorTones?: TreeTone[];
    /**
     * Per-lane active state for fan-out mode.
     * Index i corresponds to rightAnchors[i]. When provided, each lane's animation is
     * controlled independently. Falls back to the overall `state`.
     */
    rightAnchorStates?: ConnectionState[];
    /**
     * When true, flowing dots are shown even when `state` is `'stopped'`
     * (already-traversed / completed connectors also animate).
     * Default: false
     */
    animateCompleted?: boolean;
}

const ConnectionFlowConnector: React.FC<ConnectionFlowConnectorProps> = ({
    state = 'flowing',
    sourceTone = 'neutral',
    targetTone = 'neutral',
    middleIcon,
    width = 56,
    halfRing = true,
    showLine = true,
    animated = true,
    dotSpacing = 60,
    borderSize = 'xs',
    sourceFill: srcFillOvr,
    sourceBorder: srcBorderOvr,
    sourceDot: srcDotOvr,
    targetFill: dstFillOvr,
    targetBorder: dstBorderOvr,
    targetDot: dstDotOvr,
    dotColor: dotColorOvr,
    leftAnchors,
    connectorHeight,
    rightAnchorY,
    extraSourceTones = [],
    rightAnchors,
    rightAnchorTones = [],
    rightAnchorStates = [],
    animateCompleted = false,
}) => {
    const isDark = useIsDark();
    const ci = isDark ? 1 : 0;
    const bw = BORDER_WIDTH[borderSize];
    const ringR = 5.5;
    const STRAIGHT = 8; // tangent length so bezier curves arrive/depart horizontally at rings

    // isActive gates animated-dot rendering; extended to 'stopped' when animateCompleted is on
    const isActive = state === 'flowing' || (animateCompleted && state === 'stopped');
    // Show tone colors for both 'flowing' and 'stopped' — only 'disabled' uses neutral gray
    const showTone = state !== 'disabled';

    // Resolved color tokens for sourceTone (parent)
    const srcTokens = getTreeColorTokens(sourceTone);
    const dstTokens = getTreeColorTokens(targetTone);

    const srcFill = srcFillOvr ?? srcTokens.connFill[ci];
    const srcBorder = srcBorderOvr ?? srcTokens.connBorder[ci];
    const srcDot = srcDotOvr ?? srcTokens.connDot[ci];
    const dstFill = dstFillOvr ?? (showTone ? dstTokens.connFill[ci] : NEUTRAL_TOKENS.connFill[ci]);
    const dstBorder = dstBorderOvr ?? (showTone ? dstTokens.connBorder[ci] : NEUTRAL_TOKENS.connBorder[ci]);
    const dstDot = dstDotOvr ?? (showTone ? dstTokens.connDot[ci] : NEUTRAL_TOKENS.connDot[ci]);
    // Keep connector lines on the same tonal ramp as connector rings/cards.
    const lineColor = showTone ? dstTokens.connBorder[ci] : NEUTRAL_TOKENS.connBorder[ci];
    const animDotColor = dotColorOvr ?? (isActive ? dstTokens.connDot[ci] : NEUTRAL_TOKENS.connDot[ci]);

    // ── Simple vs multi-source / fan-out mode ─────────────────────────────────
    const isMultiSource = !!(leftAnchors && leftAnchors.length > 1);
    const isMultiTarget = !!(rightAnchors && rightAnchors.length > 1);
    // Connector SVG spans the full column height when geometry is known
    const svgH = connectorHeight ?? (ringR * 2 + 4);
    // Source anchor Y (left ring) — first left anchor or vertical centre of SVG
    const sy = leftAnchors?.[0] ?? (svgH / 2);
    // Target anchor Y (right ring) — when provided and different, draw a bezier curve
    const ty = rightAnchorY ?? sy;
    // Keep legacy name for multi-source code that uses `my` throughout
    const my = sy;

    // Fan-out: control-point X for bezier curves from source to each target lane
    const fanOutCx = width / 2;

    // Global dot animation timing (px/s)
    const DOT_VELOCITY = 35;
    const DOT_GAP = dotSpacing / DOT_VELOCITY;

    // Arc helpers (half-rings)
    // Source right-facing: opens rightward (sweep=1)
    const srcArc = (y: number) =>
        `M 0 ${y - ringR} A ${ringR} ${ringR} 0 0 1 0 ${y + ringR}`;
    // Target left-facing: opens leftward (sweep=0) — uses target anchor Y
    const dstArc = `M ${width} ${ty - ringR} A ${ringR} ${ringR} 0 0 0 ${width} ${ty + ringR}`;

    // Trunk X — middle of the connector gap
    const trunkX = width / 2;
    // In multi-source, the vertical trunk on the left spans from first to last anchor
    return (
        <div
            className="relative z-10 flex items-start justify-center shrink-0 -mx-[1px]"
            style={{ width, height: svgH }}
        >
            <svg
                width={width}
                height={svgH}
                viewBox={`0 0 ${width} ${svgH}`}
                overflow="visible"
                style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
            >

{/* ── Horizontal line(s) ────────────────────────────────── */}
                {showLine && (
                    isMultiSource ? (
                        <>
                            {/* Bezier curves per source lane converging to the feed entry point (trunkX, sy) */}
                            {leftAnchors!.map((ay, idx) => (
                                <path
                                    key={`hline-src-${idx}`}
                                    d={ay === sy
                                        ? `M 0 ${ay} L ${trunkX} ${sy}`
                                        : `M 0 ${ay} L ${STRAIGHT} ${ay} C ${trunkX / 2} ${ay}, ${trunkX - STRAIGHT} ${sy}, ${trunkX} ${sy}`
                                    }
                                    stroke={lineColor}
                                    strokeWidth={idx === 0 ? 2 : 1.5}
                                    strokeLinecap="round"
                                    strokeDasharray={state === 'disabled' ? '4 4' : undefined}
                                    strokeOpacity={idx === 0 ? 1 : 0.75}
                                    fill="none"
                                />
                            ))}
                            {/* Feed line from trunk to right ring — straight or bezier */}
                            <path
                                d={sy === ty
                                    ? `M ${trunkX} ${sy} L ${width - ringR} ${ty}`
                                    : `M ${trunkX} ${sy} C ${(trunkX + width) / 2} ${sy}, ${(trunkX + width) / 2} ${ty}, ${width - ringR} ${ty}`
                                }
                                stroke={lineColor}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeDasharray={state === 'disabled' ? '4 4' : undefined}
                                fill="none"
                            />
                        </>
                    ) : isMultiTarget ? (
                        <>
                            {/* One smooth bezier curve per target lane — departs and arrives horizontally */}
                            {rightAnchors!.map((ry, idx) => (
                                <path
                                    key={`hline-target-${idx}`}
                                    d={ry === sy
                                        ? `M ${ringR} ${sy} L ${width - ringR} ${ry}`
                                        : `M ${ringR} ${sy} L ${ringR + STRAIGHT} ${sy} C ${fanOutCx} ${sy}, ${width - ringR - STRAIGHT} ${ry}, ${width - ringR} ${ry}`
                                    }
                                    stroke={lineColor}
                                    strokeWidth={idx === 0 ? 2 : 1.5}
                                    strokeLinecap="round"
                                    strokeDasharray={state === 'disabled' ? '4 4' : undefined}
                                    strokeOpacity={idx === 0 ? 1 : 0.75}
                                    fill="none"
                                />
                            ))}
                        </>
                    ) : (
                        <path
                            d={sy === ty
                                ? `M ${ringR} ${sy} L ${width - ringR} ${ty}`
                                : `M ${ringR} ${sy} C ${width / 2} ${sy}, ${width / 2} ${ty}, ${width - ringR} ${ty}`
                            }
                            stroke={lineColor}
                            strokeWidth={2}
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray={state === 'disabled' ? '4 4' : undefined}
                        />
                    )
                )}

                {/* ── Source rings ─────────────────────────────────────── */}
                {isMultiSource ? (
                    leftAnchors!.map((ay, idx) => {
                        const tone = idx === 0 ? sourceTone : (extraSourceTones[idx - 1] ?? sourceTone);
                        const tok = getTreeColorTokens(tone);
                        const fill = idx === 0 ? srcFill : tok.connFill[ci];
                        const border = idx === 0 ? srcBorder : tok.connBorder[ci];
                        const dot = idx === 0 ? srcDot : tok.connDot[ci];
                        return (
                            <g key={`src-${idx}`}>
                                {halfRing ? (
                                    <>
                                        <path d={srcArc(ay)} fill={fill} />
                                        <path d={srcArc(ay)} stroke={border} strokeWidth={bw} fill="none" strokeLinecap="round" />
                                    </>
                                ) : (
                                    <>
                                        <circle cx={0} cy={ay} r={ringR} fill={fill} />
                                        <circle cx={0} cy={ay} r={ringR} stroke={border} strokeWidth={bw} fill="none" />
                                    </>
                                )}
                                <circle cx={0} cy={ay} r="2" fill={dot} />
                            </g>
                        );
                    })
                ) : (
                    <g>
                        {halfRing ? (
                            <>
                                <path d={srcArc(my)} fill={srcFill} />
                                <path d={srcArc(my)} stroke={srcBorder} strokeWidth={bw} fill="none" strokeLinecap="round" />
                            </>
                        ) : (
                            <>
                                <circle cx={0} cy={my} r={ringR} fill={srcFill} />
                                <circle cx={0} cy={my} r={ringR} stroke={srcBorder} strokeWidth={bw} fill="none" />
                            </>
                        )}
                        <circle cx={0} cy={my} r="2" fill={srcDot} />
                    </g>
                )}

                {/* ── Target entry ring(s) ── */}
                {isMultiTarget ? (
                    rightAnchors!.map((ry, idx) => {
                        const tone = rightAnchorTones[idx] ?? targetTone;
                        const tok = getTreeColorTokens(tone);
                        const laneState = rightAnchorStates[idx] ?? state;
                        const laneTone = laneState !== 'disabled';
                        const fill = laneTone ? tok.connFill[ci] : NEUTRAL_TOKENS.connFill[ci];
                        const border = laneTone ? tok.connBorder[ci] : NEUTRAL_TOKENS.connBorder[ci];
                        const dot = laneTone ? tok.connDot[ci] : NEUTRAL_TOKENS.connDot[ci];
                        const arc = `M ${width} ${ry - ringR} A ${ringR} ${ringR} 0 0 0 ${width} ${ry + ringR}`;
                        return (
                            <g key={`dst-${idx}`}>
                                {halfRing ? (
                                    <>
                                        <path d={arc} fill={fill} />
                                        <path d={arc} stroke={border} strokeWidth={bw} fill="none" strokeLinecap="round" />
                                    </>
                                ) : (
                                    <>
                                        <circle cx={width} cy={ry} r={ringR} fill={fill} />
                                        <circle cx={width} cy={ry} r={ringR} stroke={border} strokeWidth={bw} fill="none" />
                                    </>
                                )}
                                <circle cx={width} cy={ry} r="2" fill={dot} />
                            </g>
                        );
                    })
                ) : (
                    <g>
                        {halfRing ? (
                            <>
                                <path d={dstArc} fill={dstFill} />
                                <path d={dstArc} stroke={dstBorder} strokeWidth={bw} fill="none" strokeLinecap="round" />
                            </>
                        ) : (
                            <>
                                <circle cx={width} cy={ty} r={ringR} fill={dstFill} />
                                <circle cx={width} cy={ty} r={ringR} stroke={dstBorder} strokeWidth={bw} fill="none" />
                            </>
                        )}
                        <circle cx={width} cy={ty} r="2" fill={dstDot} />
                    </g>
                )}

                {/* ── Animated dots ────────────────────────────────────── */}
                {animated && (
                    isMultiTarget ? (() => {
                        // Fan-out: one bezier-path dot set per ACTIVE target lane
                        return rightAnchors!.map((ry, idx) => {
                            const laneState = rightAnchorStates[idx] ?? state;
                            const laneActive = laneState === 'flowing';
                            if (!laneActive) return null;

                            // Approximate arc length: horizontal span + half the vertical delta (bezier correction)
                            const actualLen = (width - 2 * ringR) + Math.abs(ry - sy) * 0.5;
                            const numDots = Math.max(1, Math.ceil(actualLen / dotSpacing));
                            const virtualLen = numDots * dotSpacing;
                            const pathDur = numDots * DOT_GAP;
                            const overflow = Math.max(0, virtualLen - actualLen);

                            // Same bezier as the visual line; append a short L for overflow fade-out
                            const pathData = ry === sy
                                ? `M ${ringR} ${sy} L ${width - ringR + overflow} ${sy}`
                                : `M ${ringR} ${sy} L ${ringR + STRAIGHT} ${sy} C ${fanOutCx} ${sy}, ${width - ringR - STRAIGHT} ${ry}, ${width - ringR} ${ry} L ${width - ringR + overflow} ${ry}`;

                            const fadeOutEnd = actualLen / virtualLen;
                            const fadeOutStart = Math.max(0, fadeOutEnd - 10 / virtualLen);
                            const fadeInEnd = Math.min(fadeOutStart, 4 / virtualLen);
                            const opTimes = `0;${fadeInEnd.toFixed(4)};${fadeOutStart.toFixed(4)};${fadeOutEnd.toFixed(4)};1`;

                            const tone = rightAnchorTones[idx] ?? targetTone;
                            const tok = getTreeColorTokens(tone);
                            const dotFill = tok.connDot[ci];

                            return Array.from({ length: numDots }, (_, di) => (
                                <circle key={`dot-fan-${idx}-${di}`} r="3" fill={dotFill} opacity="0">
                                    <animateMotion
                                        path={pathData}
                                        dur={`${pathDur}s`}
                                        begin={`${(-di * DOT_GAP).toFixed(3)}s`}
                                        repeatCount="indefinite"
                                    />
                                    <animate
                                        attributeName="opacity"
                                        values="0;0.9;0.9;0;0"
                                        keyTimes={opTimes}
                                        dur={`${pathDur}s`}
                                        begin={`${(-di * DOT_GAP).toFixed(3)}s`}
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            ));
                        });
                    })() : !isActive ? null : isMultiSource ? (
                        // One bezier path per source lane: branch bezier → feed bezier → target
                        leftAnchors!.map((ay, idx) => {
                            // Approximate length: branch segment + feed segment
                            const branchLen = trunkX + Math.abs(ay - sy) * 0.5;
                            const feedH = width - trunkX - ringR;
                            const feedV = sy !== ty ? Math.abs(ty - sy) * 0.5 : 0;
                            const actualLen = branchLen + feedH + feedV;

                            const numDots = Math.max(1, Math.ceil(actualLen / dotSpacing));
                            const virtualLen = numDots * dotSpacing;
                            const pathDur = numDots * DOT_GAP;
                            const overflow = Math.max(0, virtualLen - actualLen);

                            // Branch bezier mirrors visual path; feed bezier matches feed line
                            const cx = (trunkX + width) / 2;
                            const feedEndX = width - ringR + overflow;
                            const branchSeg = ay === sy
                                ? `M 0 ${ay} L ${trunkX} ${sy}`
                                : `M 0 ${ay} L ${STRAIGHT} ${ay} C ${trunkX / 2} ${ay}, ${trunkX - STRAIGHT} ${sy}, ${trunkX} ${sy}`;
                            const feedSeg = sy === ty
                                ? ` L ${feedEndX} ${ty}`
                                : ` C ${cx} ${sy}, ${cx} ${ty}, ${feedEndX} ${ty}`;
                            const pathData = `${branchSeg}${feedSeg}`;

                            const fadeOutEnd = actualLen / virtualLen;
                            const fadeOutStart = Math.max(0, fadeOutEnd - 10 / virtualLen);
                            const fadeInEnd = Math.min(fadeOutStart, 4 / virtualLen);
                            const opTimes = `0;${fadeInEnd.toFixed(4)};${fadeOutStart.toFixed(4)};${fadeOutEnd.toFixed(4)};1`;

                            return Array.from({ length: numDots }, (_, di) => (
                                <circle key={`dot-${idx}-${di}`} r="3" fill={animDotColor} opacity="0">
                                    <animateMotion
                                        path={pathData}
                                        dur={`${pathDur}s`}
                                        begin={`${(-di * DOT_GAP).toFixed(3)}s`}
                                        repeatCount="indefinite"
                                    />
                                    <animate attributeName="opacity"
                                        values="0;0.9;0.9;0;0" keyTimes={opTimes}
                                        dur={`${pathDur}s`} begin={`${(-di * DOT_GAP).toFixed(3)}s`}
                                        repeatCount="indefinite" />
                                </circle>
                            ));
                        })
                    ) : (() => {
                        const actualLen = width - 2 * ringR;
                        const simpleNumDots = Math.max(1, Math.ceil(actualLen / dotSpacing));
                        const virtualLen = simpleNumDots * dotSpacing;
                        const simpleDur = simpleNumDots * DOT_GAP;
                        const overflow = Math.max(0, virtualLen - actualLen);

                        const fadeOutEnd = (actualLen / virtualLen);
                        const fadeOutStart = Math.max(0, fadeOutEnd - (10 / virtualLen));
                        const fadeInEnd = Math.min(fadeOutStart, (4 / virtualLen));
                        const opTimes = `0;${fadeInEnd.toFixed(4)};${fadeOutStart.toFixed(4)};${fadeOutEnd.toFixed(4)};1`;

                        // When source and target are at different Y positions use animateMotion
                        // along the same bezier path as the visible line so dots track it exactly.
                        const isAngled = Math.abs(ty - sy) > 1;
                        const motionPath = isAngled
                            ? `M ${ringR} ${sy} C ${width / 2} ${sy}, ${width / 2} ${ty}, ${width - ringR + overflow} ${ty}`
                            : undefined;

                        return Array.from({ length: simpleNumDots }, (_, i) => (
                            <circle key={`dot-${i}`} r="3" fill={animDotColor} opacity="0"
                                {...(!isAngled && { cy: sy })}
                            >
                                {isAngled ? (
                                    <animateMotion
                                        path={motionPath}
                                        dur={`${simpleDur}s`}
                                        begin={`${(-i * DOT_GAP).toFixed(3)}s`}
                                        repeatCount="indefinite"
                                    />
                                ) : (
                                    <animate attributeName="cx"
                                        values={`${ringR};${width - ringR + overflow}`} keyTimes="0;1"
                                        dur={`${simpleDur}s`} begin={`${(-i * DOT_GAP).toFixed(3)}s`}
                                        repeatCount="indefinite" />
                                )}
                                <animate attributeName="opacity"
                                    values="0;0.9;0.9;0;0" keyTimes={opTimes}
                                    dur={`${simpleDur}s`} begin={`${(-i * DOT_GAP).toFixed(3)}s`}
                                    repeatCount="indefinite" />
                            </circle>
                        ));
                    })()
                )}
            </svg>

            {/* Optional middle icon (single-source only) */}
            {!isMultiSource && middleIcon && (
                <div className="relative z-20 flex items-center justify-center bg-white dark:bg-neutral-900 rounded-full p-0.5 mt-auto mb-auto">
                    {middleIcon}
                </div>
            )}
        </div>
    );
};

export { ConnectionFlowConnector };
export type { ConnectionState, ConnectionFlowConnectorConfig };
export default ConnectionFlowConnector;
