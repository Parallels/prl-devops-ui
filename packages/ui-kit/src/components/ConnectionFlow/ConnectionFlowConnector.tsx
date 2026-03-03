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
     * Total height the connector should occupy (= source column height).
     * Required when leftAnchors is set to more than one entry.
     */
    connectorHeight?: number;
    /**
     * Tones for extra source rings (index 0 = parent, already set via sourceTone).
     * Used to colour child source rings independently.
     */
    extraSourceTones?: TreeTone[];
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
    extraSourceTones = [],
}) => {
    const isDark = useIsDark();
    const ci = isDark ? 1 : 0;
    const bw = BORDER_WIDTH[borderSize];
    const ringR = 5.5;

    const isActive = state === 'flowing';

    // Resolved color tokens for sourceTone (parent)
    const srcTokens = getTreeColorTokens(sourceTone);
    const dstTokens = getTreeColorTokens(targetTone);

    const srcFill = srcFillOvr ?? srcTokens.connFill[ci];
    const srcBorder = srcBorderOvr ?? srcTokens.connBorder[ci];
    const srcDot = srcDotOvr ?? srcTokens.connDot[ci];
    const dstFill = dstFillOvr ?? (isActive ? dstTokens.connFill[ci] : NEUTRAL_TOKENS.connFill[ci]);
    const dstBorder = dstBorderOvr ?? (isActive ? dstTokens.connBorder[ci] : NEUTRAL_TOKENS.connBorder[ci]);
    const dstDot = dstDotOvr ?? (isActive ? dstTokens.connDot[ci] : NEUTRAL_TOKENS.connDot[ci]);
    // Keep connector lines on the same tonal ramp as connector rings/cards.
    const lineColor = isActive ? dstTokens.connBorder[ci] : NEUTRAL_TOKENS.connBorder[ci];
    const animDotColor = dotColorOvr ?? (isActive ? dstTokens.connDot[ci] : NEUTRAL_TOKENS.connDot[ci]);

    // ── Simple vs multi-source mode ───────────────────────────────────────────
    const isMultiSource = !!(leftAnchors && leftAnchors.length > 1);
    // Connector SVG spans the full column height when geometry is known
    const svgH = connectorHeight ?? (ringR * 2 + 4);
    // Parent card anchor Y — positions the main ring + right-side ring
    const my = leftAnchors?.[0] ?? (svgH / 2);

    // Global dot animation timing (px/s)
    const DOT_VELOCITY = 35;
    const DOT_GAP = dotSpacing / DOT_VELOCITY;

    // Arc helpers (half-rings)
    // Source right-facing: opens rightward (sweep=1)
    const srcArc = (y: number) =>
        `M 0 ${y - ringR} A ${ringR} ${ringR} 0 0 1 0 ${y + ringR}`;
    // Target left-facing: opens leftward (sweep=0)
    const dstArc = `M ${width} ${my - ringR} A ${ringR} ${ringR} 0 0 0 ${width} ${my + ringR}`;

    // Trunk X — middle of the connector gap
    const trunkX = width / 2;
    // In multi-source, the vertical trunk on the left spans from first to last anchor
    const firstAnchor = leftAnchors?.[0] ?? my;
    const lastAnchor = leftAnchors?.[leftAnchors.length - 1] ?? my;

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
                {/* ── Vertical trunk (multi-source only) — drawn BEFORE rings ── */}
                {isMultiSource && showLine && (
                    <path
                        d={`M ${trunkX} ${firstAnchor} L ${trunkX} ${lastAnchor}`}
                        stroke={lineColor}
                        strokeWidth={2}
                        strokeLinecap="round"
                        fill="none"
                    />
                )}

                {/* ── Horizontal line(s) ────────────────────────────────── */}
                {showLine && (
                    isMultiSource ? (
                        <>
                            {/* Parent line goes all the way across */}
                            <path
                                d={`M 0 ${firstAnchor} L ${width - ringR} ${firstAnchor}`}
                                stroke={lineColor}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeDasharray={state === 'disabled' ? '4 4' : undefined}
                                fill="none"
                            />
                            {/* Children branches go from source to trunk */}
                            {leftAnchors!.slice(1).map((ay, idx) => (
                                <path
                                    key={`hline-child-${idx}`}
                                    d={`M 0 ${ay} L ${trunkX} ${ay}`}
                                    stroke={lineColor}
                                    strokeWidth={1.5}
                                    strokeLinecap="round"
                                    strokeDasharray={state === 'disabled' ? '4 4' : undefined}
                                    strokeOpacity={0.75}
                                    fill="none"
                                />
                            ))}
                        </>
                    ) : (
                        <path
                            d={`M ${ringR} ${my} L ${width - ringR} ${my}`}
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

                {/* ── Target entry ring (always one, at parent anchor Y) ── */}
                <g>
                    {halfRing ? (
                        <>
                            <path d={dstArc} fill={dstFill} />
                            <path d={dstArc} stroke={dstBorder} strokeWidth={bw} fill="none" strokeLinecap="round" />
                        </>
                    ) : (
                        <>
                            <circle cx={width} cy={my} r={ringR} fill={dstFill} />
                            <circle cx={width} cy={my} r={ringR} stroke={dstBorder} strokeWidth={bw} fill="none" />
                        </>
                    )}
                    <circle cx={width} cy={my} r="2" fill={dstDot} />
                </g>

                {/* ── Animated dots ────────────────────────────────────── */}
                {isActive && animated && (
                    isMultiSource ? (
                        // One set of dots per horizontal lane
                        leftAnchors!.map((ay, idx) => {
                            const isParent = idx === 0;

                            const l1_raw = isParent ? (width - ringR) : trunkX;
                            const l2_raw = isParent ? 0 : Math.abs(ay - firstAnchor);
                            const l3_raw = isParent ? 0 : (width - trunkX - ringR);
                            const actualLen = l1_raw + l2_raw + l3_raw;

                            // To maintain exact DOT_VELOCITY, path duration MUST be an integer multiple of DOT_GAP.
                            // We achieve this by artificially extending the path past the target, letting dots travel invisibly.
                            const childNumDots = Math.max(1, Math.ceil(actualLen / dotSpacing));
                            const virtualLen = childNumDots * dotSpacing;
                            const pathDur = childNumDots * DOT_GAP;

                            // How much extra distance to add to the final segment
                            const overflow = Math.max(0, virtualLen - actualLen);

                            // Build extended path
                            let pathData = "";
                            let l1 = l1_raw, l2 = l2_raw, l3 = l3_raw;

                            if (isParent) {
                                l1 += overflow;
                                pathData = `M 0 ${ay} L ${l1} ${ay}`;
                            } else {
                                l3 += overflow;
                                pathData = `M 0 ${ay} L ${trunkX} ${ay} L ${trunkX} ${firstAnchor} L ${trunkX + l3} ${firstAnchor}`;
                            }

                            // Linear pacing to bypass WebKit bugs
                            const p1 = virtualLen > 0 ? (l1 / virtualLen).toFixed(4) : "0.5";
                            const p2 = virtualLen > 0 ? ((l1 + l2) / virtualLen).toFixed(4) : "0.5";
                            const motionProps = isParent ? {} : {
                                calcMode: "linear",
                                keyPoints: `0;${p1};${p2};1`,
                                keyTimes: `0;${p1};${p2};1`
                            };

                            // Opacity fades out smoothly precisely before hitting `actualLen`
                            // So it remains totally invisible in the `overflow` area
                            const fadeOutEnd = (actualLen / virtualLen);
                            const fadeOutStart = Math.max(0, fadeOutEnd - (10 / virtualLen)); // fade over last 10px
                            const fadeInEnd = Math.min(fadeOutStart, (4 / virtualLen)); // fade in over first 4px

                            const opTimes = `0;${fadeInEnd.toFixed(4)};${fadeOutStart.toFixed(4)};${fadeOutEnd.toFixed(4)};1`;

                            return Array.from({ length: childNumDots }, (_, di) => (
                                <circle key={`dot-${idx}-${di}`} r="3" fill={animDotColor} opacity="0">
                                    <animateMotion
                                        path={pathData}
                                        dur={`${pathDur}s`}
                                        begin={`${(-di * DOT_GAP).toFixed(3)}s`}
                                        repeatCount="indefinite"
                                        {...motionProps}
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

                        return Array.from({ length: simpleNumDots }, (_, i) => (
                            <circle key={`dot-${i}`} cy={my} r="3" fill={animDotColor} opacity="0">
                                <animate attributeName="cx"
                                    values={`${ringR};${width - ringR + overflow}`} keyTimes="0;1"
                                    dur={`${simpleDur}s`} begin={`${(-i * DOT_GAP).toFixed(3)}s`}
                                    repeatCount="indefinite" />
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
