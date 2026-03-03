import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import TreeItemCard from './TreeItemCard';
import TreeFlowSvg, { INDENT_PX } from './TreeFlowSvg';
import Loader from '../Loader';
import EmptyState from '../EmptyState';
import type { TreeItemData, TreeTone, TreeViewProps } from './types';

// ── Helpers ──────────────────────────────────────────────────────────────────

type DropPosition = 'before' | 'after';

interface DropTarget {
    index: number;
    position: DropPosition;
}

function buildOrderKey(items: TreeItemData[]): string {
    return items.map((item) => item.id).join('::');
}

function mergeItemsByExistingOrder(current: TreeItemData[], incoming: TreeItemData[]): TreeItemData[] {
    const incomingById = new Map(incoming.map((item) => [item.id, item]));
    const next: TreeItemData[] = [];

    for (const item of current) {
        const incomingItem = incomingById.get(item.id);
        if (incomingItem) {
            next.push(incomingItem);
            incomingById.delete(item.id);
        }
    }

    for (const item of incoming) {
        if (incomingById.has(item.id)) {
            next.push(item);
            incomingById.delete(item.id);
        }
    }

    return next;
}

function moveItem<T>(list: T[], from: number, to: number): T[] {
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
}

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
    depth: number;
    index: number;
    // SVG config forwarded to sub-tree
    svgProps: Omit<TreeViewProps, 'root' | 'items' | 'tone' | 'className'>;
    // Reordering
    reorderable: boolean;
    isDragging: boolean;
    dropIndicator: DropPosition | null;
    onRowElement: (el: HTMLDivElement | null) => void;
    onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
    onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
    // Callbacks for parent TrunkSvg
    onHeightChange: (height: number) => void;
    onAnchorChange: (anchor: number) => void;
    onToneChange: (tone: TreeTone) => void;
    onActiveChange: (active: boolean) => void;
}

const TreeItemRow: React.FC<TreeItemRowProps> = ({
    item, globalTone, depth, index, svgProps,
    reorderable, isDragging, dropIndicator,
    onRowElement, onDragStart, onDragOver, onDrop, onDragEnd,
    onHeightChange, onAnchorChange, onToneChange, onActiveChange,
}) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const childLevelWrapRef = useRef<HTMLDivElement>(null);
    const rowHeight = useElementHeight(rowRef);
    const cardHeight = useElementHeight(cardRef);
    const [childLevelOffset, setChildLevelOffset] = useState(0);

    const resolvedTone: TreeTone = item.tone ?? globalTone ?? 'neutral';
    const isActive = item.active ?? false;
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const [childrenExpanded, setChildrenExpanded] = useState(item.defaultExpanded ?? true);

    const setRowElement = useCallback((el: HTMLDivElement | null) => {
        rowRef.current = el;
        onRowElement(el);
    }, [onRowElement]);

    // Report full row height (card + nested subtree) for level layout spacing.
    useEffect(() => {
        if (rowHeight > 0) {
            onHeightChange(rowHeight);
        }
    }, [rowHeight, onHeightChange]);

    // Anchor must be based on card height only (not children), otherwise expanded
    // branches drift downward and no longer align with their own cards.
    useEffect(() => {
        if (cardHeight > 0) {
            onAnchorChange(cardHeight / 2);
        }
    }, [cardHeight, onAnchorChange]);

    // Measure actual gap between the parent card border and nested TreeLevel
    // container. This keeps parent->child connector anchoring correct across
    // responsive layout changes and varying row densities.
    useEffect(() => {
        const cardEl = cardRef.current;
        const childWrapEl = childLevelWrapRef.current;

        if (!cardEl || !childWrapEl || !hasChildren || !childrenExpanded) {
            setChildLevelOffset(0);
            return;
        }

        const computeOffset = () => {
            const cardRect = cardEl.getBoundingClientRect();
            const childRect = childWrapEl.getBoundingClientRect();
            setChildLevelOffset(Math.max(0, childRect.top - cardRect.bottom));
        };

        computeOffset();
        const ro = new ResizeObserver(computeOffset);
        ro.observe(cardEl);
        ro.observe(childWrapEl);
        window.addEventListener('resize', computeOffset);

        return () => {
            ro.disconnect();
            window.removeEventListener('resize', computeOffset);
        };
    }, [childrenExpanded, hasChildren]);

    // Report tone and active
    useEffect(() => { onToneChange(resolvedTone); }, [resolvedTone, onToneChange]);
    useEffect(() => { onActiveChange(isActive); }, [isActive, onActiveChange]);

    return (
        <div
            ref={setRowElement}
            className={classNames(
                'relative mb-2 min-w-0 transition-[transform,opacity] duration-200 ease-out',
                reorderable && 'cursor-grab active:cursor-grabbing',
                isDragging && 'opacity-70',
            )}
            draggable={reorderable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
        >
            {dropIndicator && (
                <div
                    className={classNames(
                        'pointer-events-none absolute left-0 right-0 z-20 h-0.5 rounded-full bg-sky-400/90',
                        dropIndicator === 'before' ? '-top-1' : '-bottom-1',
                    )}
                />
            )}
            <div ref={cardRef}>
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
                    expanded={hasChildren ? childrenExpanded : undefined}
                    onToggleExpanded={hasChildren ? () => setChildrenExpanded((v) => !v) : undefined}
                    forceToggle={hasChildren}
                    actions={item.actions}
                    hoverActions={item.hoverActions}
                    dragHandle={reorderable ? (
                        <span
                            className="inline-flex cursor-grab items-center rounded p-1 text-neutral-400 transition-colors hover:bg-black/5 hover:text-neutral-600 active:cursor-grabbing dark:hover:bg-white/10 dark:hover:text-neutral-300"
                            title="Drag to reorder"
                            aria-hidden
                        >
                            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                                <circle cx="6" cy="5" r="1.1" />
                                <circle cx="6" cy="10" r="1.1" />
                                <circle cx="6" cy="15" r="1.1" />
                                <circle cx="12" cy="5" r="1.1" />
                                <circle cx="12" cy="10" r="1.1" />
                                <circle cx="12" cy="15" r="1.1" />
                            </svg>
                        </span>
                    ) : undefined}
                    isDragging={isDragging}
                    index={index}
                />
            </div>
            {/* Recursive sub-tree for children */}
            {hasChildren && childrenExpanded && item.children && (
                <div ref={childLevelWrapRef} className="mt-1">
                    <TreeLevel
                        items={item.children}
                        globalTone={globalTone}
                        svgProps={svgProps}
                        parentTone={resolvedTone}
                        parentActive={isActive}
                        parentOffset={childLevelOffset}
                        depth={depth + 1}
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
    parentOffset?: number;
    depth?: number;
}

const TreeLevel: React.FC<TreeLevelProps> = ({
    items, globalTone, svgProps, parentTone, parentActive = false, stubHeight, parentOffset, depth = 0,
}) => {
    const resolvedStubHeight = stubHeight ?? svgProps.stubHeight ?? 12;
    const resolvedIndent = svgProps.indent ?? 'xs';
    const resolvedRowGap = svgProps.rowGap ?? 8;
    const indentPx = INDENT_PX[resolvedIndent];

    const isReorderEnabled = Boolean(svgProps.reorderable && items.length > 1);

    const [orderedItems, setOrderedItems] = useState<TreeItemData[]>(items);
    const prevIncomingOrderKeyRef = useRef(buildOrderKey(items));
    const hasLocalOrderOverride = useRef(false);

    // Keep local order when parent re-renders unchanged order while async save is in-flight.
    useEffect(() => {
        const incomingKey = buildOrderKey(items);
        setOrderedItems((prev) => {
            if (!hasLocalOrderOverride.current) {
                return items;
            }
            if (incomingKey !== prevIncomingOrderKeyRef.current) {
                hasLocalOrderOverride.current = false;
                return items;
            }
            return mergeItemsByExistingOrder(prev, items);
        });
        prevIncomingOrderKeyRef.current = incomingKey;
    }, [items]);

    // Per-item state for the SVG (tracked by id, then projected to arrays)
    const [cardHeightById, setCardHeightById] = useState<Record<string, number>>({});
    const [cardAnchorById, setCardAnchorById] = useState<Record<string, number>>({});
    const [toneById, setToneById] = useState<Record<string, TreeTone>>({});
    const [activeById, setActiveById] = useState<Record<string, boolean>>({});

    const rowElementsRef = useRef<Record<string, HTMLDivElement | null>>({});
    const previousTopByIdRef = useRef<Record<string, number>>({});

    const dragStartRef = useRef<{ id: string; index: number } | null>(null);
    const dropTargetRef = useRef<DropTarget | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

    useEffect(() => {
        const validIds = new Set(orderedItems.map((item) => item.id));

        const prune = <T,>(prev: Record<string, T>): Record<string, T> => {
            let dirty = false;
            const next: Record<string, T> = {};
            for (const [id, value] of Object.entries(prev)) {
                if (validIds.has(id)) {
                    next[id] = value;
                } else {
                    dirty = true;
                }
            }
            return dirty ? next : prev;
        };

        setCardHeightById(prune);
        setCardAnchorById(prune);
        setToneById(prune);
        setActiveById(prune);
    }, [orderedItems]);

    const updateHeight = useCallback((id: string, h: number) => {
        setCardHeightById((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
    }, []);

    const updateAnchor = useCallback((id: string, a: number) => {
        setCardAnchorById((prev) => (prev[id] === a ? prev : { ...prev, [id]: a }));
    }, []);

    const updateTone = useCallback((id: string, t: TreeTone) => {
        setToneById((prev) => (prev[id] === t ? prev : { ...prev, [id]: t }));
    }, []);

    const updateActive = useCallback((id: string, active: boolean) => {
        setActiveById((prev) => (prev[id] === active ? prev : { ...prev, [id]: active }));
    }, []);

    const setRowElement = useCallback((id: string, el: HTMLDivElement | null) => {
        if (el) {
            rowElementsRef.current[id] = el;
            return;
        }
        delete rowElementsRef.current[id];
        delete previousTopByIdRef.current[id];
    }, []);

    const clearDragState = useCallback(() => {
        dragStartRef.current = null;
        dropTargetRef.current = null;
        setDraggingId(null);
        setDropTarget(null);
    }, []);

    const commitDrop = useCallback(() => {
        if (!isReorderEnabled) {
            clearDragState();
            return;
        }

        const dragStart = dragStartRef.current;
        const target = dropTargetRef.current;
        if (!dragStart || !target) {
            clearDragState();
            return;
        }

        const fromIndex = orderedItems.findIndex((item) => item.id === dragStart.id);
        if (fromIndex === -1) {
            clearDragState();
            return;
        }

        let nextIndex = target.position === 'after' ? target.index + 1 : target.index;
        if (nextIndex > fromIndex) {
            nextIndex -= 1;
        }
        nextIndex = Math.max(0, Math.min(nextIndex, orderedItems.length - 1));

        if (nextIndex !== fromIndex) {
            hasLocalOrderOverride.current = true;
            setOrderedItems(moveItem(orderedItems, fromIndex, nextIndex));
            svgProps.onReorder?.({
                id: dragStart.id,
                oldOrder: fromIndex,
                newOrder: nextIndex,
            });
        }

        clearDragState();
    }, [clearDragState, isReorderEnabled, orderedItems, svgProps]);

    // FLIP animation so sibling cards move smoothly when order changes.
    useLayoutEffect(() => {
        const nextTopById: Record<string, number> = {};

        for (const item of orderedItems) {
            const rowEl = rowElementsRef.current[item.id];
            if (!rowEl) continue;

            const nextTop = rowEl.offsetTop;
            nextTopById[item.id] = nextTop;

            const prevTop = previousTopByIdRef.current[item.id];
            if (prevTop === undefined || prevTop === nextTop) continue;

            const deltaY = prevTop - nextTop;
            rowEl.style.transition = 'none';
            rowEl.style.transform = `translateY(${deltaY}px)`;
            rowEl.style.willChange = 'transform';

            requestAnimationFrame(() => {
                rowEl.style.transition = 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)';
                rowEl.style.transform = 'translateY(0)';
            });
        }

        previousTopByIdRef.current = nextTopById;
    }, [orderedItems]);

    const cardHeights = orderedItems.map((item) => cardHeightById[item.id] ?? 0);
    const cardAnchors = orderedItems.map((item) => cardAnchorById[item.id] ?? 0);
    const toneList = orderedItems.map((item) => toneById[item.id] ?? item.tone ?? globalTone ?? 'neutral');
    const activeList = orderedItems.map((item) => activeById[item.id] ?? Boolean(item.active));

    const handleLevelDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        if (!isReorderEnabled || !dragStartRef.current) return;

        event.preventDefault();
        event.stopPropagation();

        if (orderedItems.length === 0) return;

        const firstId = orderedItems[0]?.id;
        const lastId = orderedItems[orderedItems.length - 1]?.id;
        const firstRow = firstId ? rowElementsRef.current[firstId] : null;
        const lastRow = lastId ? rowElementsRef.current[lastId] : null;

        if (!firstRow || !lastRow) return;

        let nextTarget: DropTarget | null = null;
        const firstRect = firstRow.getBoundingClientRect();
        const lastRect = lastRow.getBoundingClientRect();

        if (event.clientY <= firstRect.top) {
            nextTarget = { index: 0, position: 'before' };
        } else if (event.clientY >= lastRect.bottom) {
            nextTarget = { index: orderedItems.length - 1, position: 'after' };
        }

        if (nextTarget) {
            const prevTarget = dropTargetRef.current;
            if (!prevTarget || prevTarget.index !== nextTarget.index || prevTarget.position !== nextTarget.position) {
                dropTargetRef.current = nextTarget;
                setDropTarget(nextTarget);
            }
        }

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }, [isReorderEnabled, orderedItems]);

    const handleLevelDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        if (!isReorderEnabled) return;
        event.preventDefault();
        event.stopPropagation();
        commitDrop();
    }, [commitDrop, isReorderEnabled]);

    return (
        <div className="relative" style={{ paddingLeft: indentPx }}>
            <div onDragOver={handleLevelDragOver} onDrop={handleLevelDrop}>
                {orderedItems.map((item, i) => (
                    <TreeItemRow
                        key={item.id}
                        item={item}
                        globalTone={globalTone}
                        depth={depth}
                        index={i}
                        svgProps={svgProps}
                        reorderable={isReorderEnabled}
                        isDragging={draggingId === item.id}
                        dropIndicator={
                            dropTarget && dropTarget.index === i && draggingId !== item.id
                                ? dropTarget.position
                                : null
                        }
                        onRowElement={(el) => setRowElement(item.id, el)}
                        onDragStart={isReorderEnabled ? (event) => {
                            event.stopPropagation();
                            dragStartRef.current = { id: item.id, index: i };
                            dropTargetRef.current = { index: i, position: 'before' };
                            setDraggingId(item.id);
                            setDropTarget({ index: i, position: 'before' });
                            if (event.dataTransfer) {
                                event.dataTransfer.effectAllowed = 'move';
                                event.dataTransfer.setData('text/plain', item.id);
                            }
                        } : undefined}
                        onDragOver={isReorderEnabled ? (event) => {
                            if (!dragStartRef.current) return;
                            event.preventDefault();
                            event.stopPropagation();

                            const rect = event.currentTarget.getBoundingClientRect();
                            const position: DropPosition = event.clientY < (rect.top + rect.height / 2)
                                ? 'before'
                                : 'after';
                            const nextTarget: DropTarget = { index: i, position };

                            const prevTarget = dropTargetRef.current;
                            if (!prevTarget || prevTarget.index !== nextTarget.index || prevTarget.position !== nextTarget.position) {
                                dropTargetRef.current = nextTarget;
                                setDropTarget(nextTarget);
                            }

                            if (event.dataTransfer) {
                                event.dataTransfer.dropEffect = 'move';
                            }
                        } : undefined}
                        onDrop={isReorderEnabled ? (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            commitDrop();
                        } : undefined}
                        onDragEnd={isReorderEnabled ? (event) => {
                            event.stopPropagation();
                            clearDragState();
                        } : undefined}
                        onHeightChange={(h) => updateHeight(item.id, h)}
                        onAnchorChange={(a) => updateAnchor(item.id, a)}
                        onToneChange={(t) => updateTone(item.id, t)}
                        onActiveChange={(v) => updateActive(item.id, v)}
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
                parentOffset={parentOffset}
                depth={depth}
                rootChildIndentExtra={svgProps.rootChildIndentExtra}
                indent={resolvedIndent}
                showLine={svgProps.showLine}
                showConnectors={svgProps.showConnectors}
                connectorStyle={svgProps.connectorStyle}
                branchColorMode={svgProps.branchColorMode}
                junctionStyle={svgProps.junctionStyle}
                showCenterDot={svgProps.showCenterDot}
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
    connectorStyle = 'rings',
    branchColorMode = 'item',
    junctionStyle = 'rounded',
    showCenterDot = true,
    connectorHalf = false, connectorBorderSize = 'xs',
    dotSpacing = 50,
    indent = 'xs', rootChildIndentExtra = 0, rowGap = 8, stubHeight = 12,
    loading = false, loadingState, emptyState, error, errorState, onRetry,
    reorderable = false, onReorder,
    className,
}) => {
    const resolvedRootTone: TreeTone = root?.tone ?? rootTone ?? tone ?? 'neutral';
    const resolvedRootActive = root?.active ?? rootActive;
    // Show stub gap when root item OR standalone rootTone/rootActive is provided
    const hasRootContext = !!(root || rootTone !== undefined || rootActive);

    const svgProps: Omit<TreeViewProps, 'root' | 'items' | 'tone' | 'rootTone' | 'rootActive' | 'className' | 'loading' | 'loadingState' | 'emptyState' | 'error' | 'errorState' | 'onRetry'> = {
        animated,
        showLine,
        showConnectors,
        connectorStyle,
        branchColorMode,
        junctionStyle,
        showCenterDot,
        connectorHalf,
        connectorBorderSize,
        dotSpacing,
        indent,
        rootChildIndentExtra,
        rowGap,
        stubHeight,
        reorderable,
        onReorder,
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
                <div className={root ? 'mt-1' : undefined}>
                    <TreeLevel
                        items={items}
                        globalTone={tone}
                        svgProps={svgProps}
                        parentTone={resolvedRootTone}
                        parentActive={resolvedRootActive}
                        stubHeight={hasRootContext ? stubHeight : 0}
                        depth={0}
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
                        depth={0}
                    />
                </div>
            )}
        </div>
    );
};

export { TreeLevel };
export default TreeView;
