import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import TreeItemCard from './TreeItemCard';
import TreeFlowSvg, { INDENT_PX } from './TreeFlowSvg';
import Loader from '../Loader';
import EmptyState from '../EmptyState';
import type { TreeItemData, TreeTone, TreeViewProps } from './types';

// ── useElementHeight ─────────────────────────────────────────────────────────

function useElementHeight(ref: React.RefObject<HTMLElement | null>): number {
    const [h, setH] = useState(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(([e]) => setH(e.contentRect.height));
        ro.observe(el);
        return () => ro.disconnect();
    }, [ref]);
    return h;
}

// ── TreeItemRow — wraps a card + optional sub-tree, reports height/anchor ────

interface TreeItemRowProps {
    item: TreeItemData;
    globalTone?: TreeTone;
    index: number;
    isLast: boolean;
    // SVG config forwarded to sub-tree
    svgProps: Omit<TreeViewProps, 'root' | 'items' | 'tone' | 'className'>;
    // Callbacks for parent TrunkSvg
    onHeightChange: (height: number) => void;
    onAnchorChange: (anchor: number) => void;
    onToneChange: (tone: TreeTone) => void;
    onActiveChange: (active: boolean) => void;
}

const TreeItemRow: React.FC<TreeItemRowProps> = ({
    item, globalTone, index, svgProps,
    onHeightChange, onAnchorChange, onToneChange, onActiveChange,
}) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const rowHeight = useElementHeight(rowRef);
    const minHeightRef = useRef<number | null>(null);

    const resolvedTone: TreeTone = item.tone ?? globalTone ?? 'neutral';
    const isActive = item.active ?? false;

    // Report height — always update full height (includes expanded body + children)
    useEffect(() => {
        if (rowHeight > 0) {
            onHeightChange(rowHeight);
            // Only update anchor when height is at a new minimum (collapsed state)
            if (minHeightRef.current === null || rowHeight < minHeightRef.current) {
                minHeightRef.current = rowHeight;
                onAnchorChange(rowHeight / 2);
            }
        }
    }, [rowHeight, onHeightChange, onAnchorChange]);

    // Report tone and active
    useEffect(() => { onToneChange(resolvedTone); }, [resolvedTone, onToneChange]);
    useEffect(() => { onActiveChange(isActive); }, [isActive, onActiveChange]);

    return (
        <div ref={rowRef} className="mb-2 min-w-0">
            <TreeItemCard
                icon={item.icon}
                iconClassName={item.iconClassName}
                title={item.title}
                titleClassName={item.titleClassName}
                subtitle={item.subtitle}
                subtitleClassName={item.subtitleClassName}
                description={item.description}
                descriptionClassName={item.descriptionClassName}
                tone={resolvedTone}
                body={item.body}
                defaultExpanded={item.defaultExpanded}
                actions={item.actions}
                hoverActions={item.hoverActions}
                index={index}
            />
            {/* Recursive sub-tree for children */}
            {item.children && item.children.length > 0 && (
                <div className="mt-1">
                    <TreeLevel
                        items={item.children}
                        globalTone={globalTone}
                        svgProps={svgProps}
                        parentTone={resolvedTone}
                        parentActive={isActive}
                    />
                </div>
            )}
        </div>
    );
};

// ── TreeLevel — renders a list of items + their TrunkSvg ─────────────────────

interface TreeLevelProps {
    items: TreeItemData[];
    globalTone?: TreeTone;
    svgProps: Omit<TreeViewProps, 'root' | 'items' | 'tone' | 'className'>;
    parentTone?: TreeTone;
    parentActive?: boolean;
    stubHeight?: number;
}

const TreeLevel: React.FC<TreeLevelProps> = ({
    items, globalTone, svgProps, parentTone, parentActive = false, stubHeight,
}) => {
    const resolvedStubHeight = stubHeight ?? svgProps.stubHeight ?? 12;
    const resolvedIndent = svgProps.indent ?? 'xs';
    const resolvedRowGap = svgProps.rowGap ?? 8;
    const indentPx = INDENT_PX[resolvedIndent];

    // Per-item state for the SVG
    const [cardHeights, setCardHeights] = useState<number[]>(() => items.map(() => 0));
    const [cardAnchors, setCardAnchors] = useState<number[]>(() => items.map(() => 0));
    const [toneList, setToneList] = useState<TreeTone[]>(() => items.map(() => globalTone ?? 'neutral'));
    const [activeList, setActiveList] = useState<boolean[]>(() => items.map(() => false));

    // Resize arrays when items are added / removed
    const itemCount = items.length;
    useEffect(() => {
        setCardHeights(prev => items.map((_, i) => prev[i] ?? 0));
        setCardAnchors(prev => items.map((_, i) => prev[i] ?? 0));
        setToneList(prev => items.map((_, i) => prev[i] ?? globalTone ?? 'neutral'));
        setActiveList(prev => items.map((_, i) => prev[i] ?? false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemCount]);

    const updateHeight = useCallback((i: number, h: number) => {
        setCardHeights(prev => { if (prev[i] === h) return prev; const n = [...prev]; n[i] = h; return n; });
    }, []);
    const updateAnchor = useCallback((i: number, a: number) => {
        setCardAnchors(prev => { if (prev[i] === a) return prev; const n = [...prev]; n[i] = a; return n; });
    }, []);
    const updateTone = useCallback((i: number, t: TreeTone) => {
        setToneList(prev => { if (prev[i] === t) return prev; const n = [...prev]; n[i] = t; return n; });
    }, []);
    const updateActive = useCallback((i: number, v: boolean) => {
        setActiveList(prev => { if (prev[i] === v) return prev; const n = [...prev]; n[i] = v; return n; });
    }, []);

    return (
        <div className="relative" style={{ paddingLeft: indentPx }}>
            <div>
                {items.map((item, i) => (
                    <TreeItemRow
                        key={item.id}
                        item={item}
                        globalTone={globalTone}
                        index={i}
                        isLast={i === items.length - 1}
                        svgProps={svgProps}
                        onHeightChange={(h) => updateHeight(i, h)}
                        onAnchorChange={(a) => updateAnchor(i, a)}
                        onToneChange={(t) => updateTone(i, t)}
                        onActiveChange={(v) => updateActive(i, v)}
                    />
                ))}
            </div>
            {/* TrunkSvg rendered AFTER card rows so it paints on top of borders */}
            <TreeFlowSvg
                cardHeights={cardHeights}
                cardAnchors={cardAnchors}
                toneList={toneList}
                activeList={activeList}
                rootTone={parentTone}
                rootActive={parentActive}
                rowGap={resolvedRowGap}
                stubHeight={resolvedStubHeight}
                indent={resolvedIndent}
                showLine={svgProps.showLine}
                showConnectors={svgProps.showConnectors}
                connectorHalf={svgProps.connectorHalf}
                connectorBorderSize={svgProps.connectorBorderSize}
                dotSpacing={svgProps.dotSpacing}
                animated={svgProps.animated}
            />
        </div>
    );
};

// ── TreeView — top-level component ───────────────────────────────────────────

const TreeView: React.FC<TreeViewProps> = ({
    root, items, tone,
    rootTone, rootActive = false,
    animated = true, showLine = true, showConnectors = true,
    connectorHalf = false, connectorBorderSize = 'xs',
    dotSpacing = 50,
    indent = 'xs', rowGap = 8, stubHeight = 12,
    loading = false, loadingState, emptyState, error, errorState, onRetry,
    className,
}) => {
    const resolvedRootTone: TreeTone = root?.tone ?? rootTone ?? tone ?? 'neutral';
    const resolvedRootActive = root?.active ?? rootActive;
    // Show stub gap when root item OR standalone rootTone/rootActive is provided
    const hasRootContext = !!(root || rootTone !== undefined || rootActive);

    const svgProps: Omit<TreeViewProps, 'root' | 'items' | 'tone' | 'rootTone' | 'rootActive' | 'className' | 'loading' | 'loadingState' | 'emptyState' | 'error' | 'errorState' | 'onRetry'> = {
        animated, showLine, showConnectors, connectorHalf, connectorBorderSize,
        dotSpacing, indent, rowGap, stubHeight,
    };

    // ── Loading state ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className={classNames('flex items-center justify-center py-8', className)}>
                {loadingState ?? <Loader size="md" label="Loading..." />}
            </div>
        );
    }

    // ── Error state ──────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className={classNames('flex items-center justify-center py-8', className)}>
                {errorState ?? (
                    <EmptyState
                        icon="Error"
                        title="Something went wrong"
                        subtitle={typeof error === 'string' ? error : 'An unexpected error occurred.'}
                        tone="danger"
                        showIcon
                        actionLabel={onRetry ? 'Retry' : undefined}
                        onAction={onRetry}
                    />
                )}
            </div>
        );
    }

    return (
        <div className={classNames('flex flex-col', className)}>
            {/* Root item */}
            {root && (
                <TreeItemCard
                    icon={root.icon}
                    iconClassName={root.iconClassName}
                    title={root.title}
                    titleClassName={root.titleClassName}
                    subtitle={root.subtitle}
                    subtitleClassName={root.subtitleClassName}
                    description={root.description}
                    descriptionClassName={root.descriptionClassName}
                    tone={resolvedRootTone}
                    body={root.body}
                    defaultExpanded={root.defaultExpanded}
                    actions={root.actions}
                    hoverActions={root.hoverActions}
                />
            )}

            {/* Items list with SVG tree */}
            {items.length > 0 ? (
                <div className={root ? 'mt-3' : undefined}>
                    <TreeLevel
                        items={items}
                        globalTone={tone}
                        svgProps={svgProps}
                        parentTone={resolvedRootTone}
                        parentActive={resolvedRootActive}
                        stubHeight={hasRootContext ? stubHeight : 0}
                    />
                </div>
            ) : emptyState ? (
                <div className={root ? 'mt-3' : undefined}>
                    {emptyState}
                </div>
            ) : null}

            {/* Root children (sub-tree under root, separate from items) */}
            {root?.children && root.children.length > 0 && (
                <div className="mt-1">
                    <TreeLevel
                        items={root.children}
                        globalTone={tone}
                        svgProps={svgProps}
                        parentTone={resolvedRootTone}
                        parentActive={root.active ?? false}
                        stubHeight={0}
                    />
                </div>
            )}
        </div>
    );
};

export { TreeLevel };
export default TreeView;
