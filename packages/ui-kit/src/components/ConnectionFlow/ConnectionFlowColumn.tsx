import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import TreeItemCard from '../TreeView/TreeItemCard';
import TreeFlowSvg, { INDENT_PX } from '../TreeView/TreeFlowSvg';
import type { TreeTone } from '../TreeView/types';
import type { ConnectionFlowItem } from './types';

// ── Geometry reported by a column ─────────────────────────────────────────────

export interface ColumnGeometry {
    /** Total rendered height of the whole column (parent + gap + all children). */
    totalHeight: number;
    /**
     * Y offsets (from the TOP of the column) to the centre of each source card.
     * anchors[0] = parent card, anchors[1..] = child cards.
     */
    anchors: number[];
}

// ── useElementHeight ──────────────────────────────────────────────────────────

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

// ── ChildRow ─────────────────────────────────────────────────────────────────

interface ChildRowProps {
    item: ConnectionFlowItem;
    index: number;
    globalTone?: TreeTone;
    onHeightChange: (h: number) => void;
    onAnchorChange: (a: number) => void;
    onToneChange: (t: TreeTone) => void;
    onActiveChange: (v: boolean) => void;
}

const ChildRow: React.FC<ChildRowProps> = ({
    item, index, globalTone,
    onHeightChange, onAnchorChange, onToneChange, onActiveChange,
}) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const rowH = useElementHeight(rowRef);
    const minHRef = useRef<number | null>(null);

    const resolvedTone: TreeTone = item.tone ?? globalTone ?? 'neutral';
    const isActive = item.active ?? false;

    useEffect(() => {
        if (rowH > 0) {
            onHeightChange(rowH);
            if (minHRef.current === null || rowH < minHRef.current) {
                minHRef.current = rowH;
                onAnchorChange(rowH / 2);
            }
        }
    }, [rowH, onHeightChange, onAnchorChange]);

    useEffect(() => { onToneChange(resolvedTone); }, [resolvedTone, onToneChange]);
    useEffect(() => { onActiveChange(isActive); }, [isActive, onActiveChange]);

    return (
        <div ref={rowRef} className="mb-2 min-w-0">
            <TreeItemCard
                icon={item.icon} iconClassName={item.iconClassName}
                title={item.title} titleClassName={item.titleClassName}
                subtitle={item.subtitle} subtitleClassName={item.subtitleClassName}
                description={item.description} descriptionClassName={item.descriptionClassName}
                tone={resolvedTone}
                body={item.body} defaultExpanded={item.defaultExpanded}
                actions={item.actions} hoverActions={item.hoverActions}
                index={index}
            />
        </div>
    );
};

// ── ConnectionFlowColumn ──────────────────────────────────────────────────────

export interface ConnectionFlowColumnProps {
    item: ConnectionFlowItem;
    globalTone?: TreeTone;
    childIndent?: 'xs' | 'sm' | 'md' | 'lg';
    childRowGap?: number;
    animated?: boolean;
    showLine?: boolean;
    connectorHalf?: boolean;
    connectorBorderSize?: 'fit' | 'xs' | 'sm' | 'md' | 'lg';
    dotSpacing?: number;
    itemWidth?: number | string;
    /** Reports geometry so ConnectionFlow can build a multi-source connector. */
    onGeometryChange?: (geo: ColumnGeometry) => void;
    /** When true, forces all child branches to animate (mirrors parent connection state). */
    flowActive?: boolean;
}

// Gap between parent card bottom and first child card top (mt-2)
const CHILD_GAP_TOP = 8;
// mb-2 gap after each ChildRow
const CHILD_ROW_MB = 8;

const ConnectionFlowColumn: React.FC<ConnectionFlowColumnProps> = ({
    item, globalTone,
    childIndent = 'xs', childRowGap = CHILD_ROW_MB,
    animated = true, showLine = true,
    connectorHalf = true, connectorBorderSize = 'xs', dotSpacing = 50,
    itemWidth,
    onGeometryChange, flowActive = false,
}) => {
    const hasChildren = !!(item.children && item.children.length > 0);
    const resolvedTone: TreeTone = item.tone ?? globalTone ?? 'neutral';
    const childCount = item.children?.length ?? 0;

    // ── Refs & heights ────────────────────────────────────────────────────────
    const columnRef = useRef<HTMLDivElement>(null);
    const parentCardRef = useRef<HTMLDivElement>(null);
    const parentCardH = useElementHeight(parentCardRef);
    const columnH = useElementHeight(columnRef);

    // Per-child measurements
    const [cardHeights, setCardHeights] = useState<number[]>(() => Array(childCount).fill(0));
    const [cardAnchors, setCardAnchors] = useState<number[]>(() => Array(childCount).fill(0));
    const [toneList, setToneList] = useState<TreeTone[]>(() => Array(childCount).fill(globalTone ?? 'neutral'));
    const [activeList, setActiveList] = useState<boolean[]>(() => Array(childCount).fill(false));

    // Reset arrays when child count changes
    useEffect(() => {
        setCardHeights(Array(childCount).fill(0));
        setCardAnchors(Array(childCount).fill(0));
        setToneList(Array(childCount).fill(globalTone ?? 'neutral'));
        setActiveList(Array(childCount).fill(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [childCount]);

    const updH = useCallback((i: number, h: number) =>
        setCardHeights(p => { if (p[i] === h) return p; const n = [...p]; n[i] = h; return n; }), []);
    const updA = useCallback((i: number, a: number) =>
        setCardAnchors(p => { if (p[i] === a) return p; const n = [...p]; n[i] = a; return n; }), []);
    const updT = useCallback((i: number, t: TreeTone) =>
        setToneList(p => { if (p[i] === t) return p; const n = [...p]; n[i] = t; return n; }), []);
    const updAc = useCallback((i: number, v: boolean) =>
        setActiveList(p => { if (p[i] === v) return p; const n = [...p]; n[i] = v; return n; }), []);

    // ── Geometry → ConnectionFlow ─────────────────────────────────────────────
    useEffect(() => {
        if (!onGeometryChange || parentCardH === 0 || columnH === 0) return;

        const anchors: number[] = [parentCardH / 2];

        if (hasChildren && cardHeights.length > 0 && cardHeights.every(h => h > 0)) {
            // Children start after: parentCard + mt-2 (CHILD_GAP_TOP)
            const childBlockTop = parentCardH + CHILD_GAP_TOP;
            let rowTop = childBlockTop;
            cardHeights.forEach((h, idx) => {
                anchors.push(rowTop + (cardAnchors[idx] ?? h / 2));
                rowTop += h + childRowGap;
            });
        }

        onGeometryChange({ totalHeight: columnH, anchors });
    }, [parentCardH, columnH, cardHeights, cardAnchors, hasChildren, childRowGap, onGeometryChange]);

    // Force-active merging for TreeFlowSvg
    const mergedActiveList = flowActive ? activeList.map(() => true) : activeList;

    return (
        <div
            ref={columnRef}
            className={classNames("flex flex-col relative", itemWidth ? "flex-shrink-0" : "flex-1 min-w-0")}
            style={itemWidth ? { width: itemWidth } : undefined}
        >
            {/* Parent card — full width */}
            <div ref={parentCardRef}>
                <TreeItemCard
                    icon={item.icon} iconClassName={item.iconClassName}
                    title={item.title} titleClassName={item.titleClassName}
                    subtitle={item.subtitle} subtitleClassName={item.subtitleClassName}
                    description={item.description} descriptionClassName={item.descriptionClassName}
                    tone={resolvedTone}
                    body={item.body} defaultExpanded={item.defaultExpanded}
                    actions={item.actions} hoverActions={item.hoverActions}
                />
            </div>

            {/* Children — full width, NO paddingLeft */}
            {hasChildren && (
                <div className="mt-2 flex-1">
                    {item.children!.map((child, i) => (
                        <ChildRow
                            key={child.id}
                            item={child}
                            index={i}
                            globalTone={globalTone}
                            onHeightChange={(h) => updH(i, h)}
                            onAnchorChange={(a) => updA(i, a)}
                            onToneChange={(t) => updT(i, t)}
                            onActiveChange={(v) => updAc(i, v)}
                        />
                    ))}
                </div>
            )}

            {/* Column-level SVG: positioned to the left of the column
                and draws the [ shape connecting parent left edge to children's left edges */}
            {hasChildren && parentCardH > 0 && cardHeights.every(h => h > 0) && (
                <TreeFlowSvg
                    mode="bracket"
                    parentAnchorY={parentCardH - 16}
                    cardHeights={cardHeights}
                    cardAnchors={cardAnchors}
                    toneList={toneList}
                    activeList={mergedActiveList}
                    rootTone={resolvedTone}
                    rootActive={item.active || flowActive}
                    rowGap={childRowGap}
                    stubHeight={parentCardH + CHILD_GAP_TOP}
                    indent={childIndent}
                    showLine={showLine}
                    showConnectors
                    connectorHalf={connectorHalf}
                    connectorBorderSize={connectorBorderSize}
                    dotSpacing={dotSpacing}
                    animated={animated}
                    style={{ position: 'absolute', left: -INDENT_PX[childIndent], top: 0, pointerEvents: 'none' }}
                />
            )}
        </div>
    );
};

export default ConnectionFlowColumn;
