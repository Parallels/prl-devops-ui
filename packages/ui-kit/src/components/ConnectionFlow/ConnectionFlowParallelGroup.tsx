import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import TreeItemCard from '../TreeView/TreeItemCard';
import type { TreeTone } from '../TreeView/types';
import type { ConnectionFlowItem } from './types';
import type { ColumnGeometry } from './ConnectionFlowColumn';

// Gap between parallel item cards
const GROUP_ROW_GAP = 8;

function useElementHeight(ref: React.RefObject<HTMLElement | null>): number {
    const [h, setH] = useState(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let raf: number;
        const ro = new ResizeObserver(() => {
            raf = requestAnimationFrame(() => {
                if (el) setH(el.getBoundingClientRect().height);
            });
        });
        ro.observe(el);
        return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    }, [ref]);
    return h;
}

export interface ConnectionFlowParallelGroupProps {
    items: ConnectionFlowItem[];
    globalTone?: TreeTone;
    itemWidth?: number | string;
    hoverable?: boolean;
    onGeometryChange?: (geo: ColumnGeometry) => void;
}

const ConnectionFlowParallelGroup: React.FC<ConnectionFlowParallelGroupProps> = ({
    items,
    globalTone,
    itemWidth,
    hoverable = false,
    onGeometryChange,
}) => {
    const groupRef = useRef<HTMLDivElement>(null);
    const groupH = useElementHeight(groupRef);
    const itemCount = items.length;

    // Per-item height measurements via individual refs
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [itemHeights, setItemHeights] = useState<number[]>(() => Array(itemCount).fill(0));

    // Reset when item count changes
    useEffect(() => {
        setItemHeights(Array(itemCount).fill(0));
        itemRefs.current = itemRefs.current.slice(0, itemCount);
    }, [itemCount]);

    // Register a ResizeObserver per item
    useEffect(() => {
        const observers: ResizeObserver[] = [];
        const rafs: number[] = [];
        itemRefs.current.forEach((el, i) => {
            if (!el) return;
            const ro = new ResizeObserver(() => {
                const raf = requestAnimationFrame(() => {
                    if (!el) return;
                    const h = el.getBoundingClientRect().height;
                    setItemHeights(prev => {
                        if (prev[i] === h) return prev;
                        const n = [...prev];
                        n[i] = h;
                        return n;
                    });
                });
                rafs.push(raf);
            });
            ro.observe(el);
            observers.push(ro);
        });
        return () => {
            rafs.forEach(cancelAnimationFrame);
            observers.forEach(ro => ro.disconnect());
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemCount]);

    // Report geometry: anchor at the vertical centre of each item card
    useEffect(() => {
        if (!onGeometryChange || groupH === 0) return;
        if (itemHeights.some(h => h === 0)) return;

        const anchors: number[] = [];
        let y = 0;
        itemHeights.forEach(h => {
            anchors.push(y + h / 2);
            y += h + GROUP_ROW_GAP;
        });

        onGeometryChange({ totalHeight: groupH, anchors, isParallelGroup: true });
    }, [groupH, itemHeights, onGeometryChange]);

    return (
        <div
            ref={groupRef}
            className={classNames(
                'flex flex-col',
                itemWidth ? 'flex-shrink-0' : 'flex-1 min-w-0',
            )}
            style={{
                gap: GROUP_ROW_GAP,
                ...(itemWidth ? { width: itemWidth } : undefined),
            }}
        >
            {items.map((item, i) => {
                const tone: TreeTone = item.tone ?? globalTone ?? 'neutral';
                return (
                    <div
                        key={item.id}
                        ref={el => { itemRefs.current[i] = el; }}
                    >
                        <TreeItemCard
                            icon={item.icon}
                            iconClassName={item.iconClassName}
                            title={item.title}
                            titleClassName={item.titleClassName}
                            titleWrap={item.titleWrap}
                            titleScroll={item.titleScroll}
                            subtitle={item.subtitle}
                            subtitleClassName={item.subtitleClassName}
                            description={item.description}
                            descriptionClassName={item.descriptionClassName}
                            badge={item.badge}
                            tone={tone}
                            body={item.body}
                            defaultExpanded={item.defaultExpanded}
                            actions={item.actions}
                            hoverActions={item.hoverActions}
                            hoverable={hoverable}
                            activePulse={item.activePulse}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default ConnectionFlowParallelGroup;
