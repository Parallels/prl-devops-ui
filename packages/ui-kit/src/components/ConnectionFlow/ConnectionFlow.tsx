import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import ConnectionFlowConnector from './ConnectionFlowConnector';
import ConnectionFlowColumn, { type ColumnGeometry } from './ConnectionFlowColumn';
import type { ConnectionFlowProps } from './types';

export type { ConnectionState, ConnectionFlowConnectorConfig, ConnectionFlowItem, ConnectionFlowProps } from './types';

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
    className,
    rightAction,
}) => {
    // Track geometry per column so the connector knows about children anchors
    const [colGeo, setColGeo] = useState<Record<number, ColumnGeometry>>({});

    const handleGeo = useCallback((idx: number, geo: ColumnGeometry) => {
        setColGeo((prev) => {
            const cur = prev[idx];
            if (cur && cur.totalHeight === geo.totalHeight &&
                cur.anchors.length === geo.anchors.length &&
                cur.anchors.every((a, i) => a === geo.anchors[i])) return prev;
            return { ...prev, [idx]: geo };
        });
    }, []);

    // Which items emit a right-side connector (not terminal, not last)
    const emitsConnector = items.map((item, i) => !item.terminal && i < items.length - 1);

    if (items.length === 0) return null;

    return (
        <div className={classNames('flex items-start', allowScroll && 'overflow-auto max-w-full', className)}>
            {items.map((item, i) => {
                const prevItem = items[i - 1];
                const isFirst = i === 0;
                const renderConnector = !isFirst && (prevItem ? emitsConnector[i - 1] : false);
                const connCfg = item.connector;

                // Resolve connector values
                const state = connCfg?.state ?? flowState;
                const icon = connCfg?.icon ?? flowIcon;
                const cWidth = connCfg?.width ?? connectorWidth;
                const cAnimated = connCfg?.animated ?? animated;
                const cDotSpace = connCfg?.dotSpacing ?? dotSpacing;
                const cBorder = connCfg?.borderSize ?? connectorBorderSize;
                const cHalf = connCfg?.halfRing ?? connectorHalf;
                const cShowLine = connCfg?.showLine ?? showLine;
                const srcTone = connCfg?.sourceTone ?? prevItem?.tone ?? 'neutral';
                const dstTone = connCfg?.targetTone ?? item.tone ?? 'neutral';

                // Multi-source: left-column (prev) geometry — pass even for single anchor
                const prevGeo = colGeo[i - 1];
                const leftAnchors = prevGeo?.anchors;           // always pass when known
                const connectorHeight = prevGeo?.totalHeight;

                // Extra tones for child source rings — read from child's connector.sourceTone first
                const extraSourceTones = prevItem?.children?.map(
                    (c) => c.connector?.sourceTone ?? c.tone ?? 'neutral',
                ) ?? [];

                return (
                    <React.Fragment key={item.id}>
                        {/* Connector leading INTO this node */}
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
                                extraSourceTones={extraSourceTones}
                            />
                        )}

                        {/* Column: parent card + optional vertical children */}
                        <ConnectionFlowColumn
                            item={item}
                            childIndent={childIndent}
                            childRowGap={childRowGap}
                            animated={animated}
                            showLine={showLine}
                            connectorHalf={connectorHalf}
                            connectorBorderSize={connectorBorderSize}
                            dotSpacing={dotSpacing}
                            flowActive={state === 'flowing'}
                            onGeometryChange={(geo) => handleGeo(i, geo)}
                            itemWidth={itemWidth}
                        />
                    </React.Fragment>
                );
            })}

            {rightAction && (
                <div className="flex items-center shrink-0 ml-3 self-start">
                    {rightAction}
                </div>
            )}
        </div>
    );
};

export default ConnectionFlow;
