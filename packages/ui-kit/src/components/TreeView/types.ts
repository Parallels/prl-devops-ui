import type React from 'react';
import type { ThemeColor } from '../../theme/Theme';

export type TreeTone = ThemeColor;

export interface TreeReorderEvent {
    id: string;
    oldOrder: number; // zero-based index before move
    newOrder: number; // zero-based index after move
}

export interface TreeItemData {
    id: string;
    // Icon slot
    icon?: React.ReactNode;
    iconClassName?: string;
    // Text content
    title?: React.ReactNode;
    titleClassName?: string;
    subtitle?: React.ReactNode;
    subtitleClassName?: string;
    description?: React.ReactNode;
    descriptionClassName?: string;
    /** Optional badge/status slot rendered below description, without tone-derived text styling. */
    badge?: React.ReactNode;
    // Appearance — tone drives card bg, border, text, connector and animation colors
    tone?: TreeTone;
    // Whether this item's branch should carry flowing dot animation
    active?: boolean;
    // Expandable body — when provided, an expand toggle is shown in the card header
    body?: React.ReactNode;
    defaultExpanded?: boolean;
    // Actions always visible in header row (before expand toggle)
    actions?: React.ReactNode;
    // Actions shown only on card hover
    hoverActions?: React.ReactNode;
    // Recursive sub-tree
    children?: TreeItemData[];
}

// ── TreeView (top-level) ────────────────────────────────────────────────────

export interface TreeViewProps {
    // Optional root "listener" item rendered above the items list
    root?: TreeItemData;
    // Child items (direct children of root, or top-level if no root)
    items: TreeItemData[];
    // Fallback tone when an item has none (default: 'neutral')
    tone?: TreeTone;
    // When root is not provided, these drive the trunk color + animation
    rootTone?: TreeTone;
    rootActive?: boolean;
    // Animation
    animated?: boolean;          // enable dot flow (default: true)
    showLine?: boolean;          // show trunk/branch lines (default: true)
    showConnectors?: boolean;    // show ring decorators (default: true)
    connectorStyle?: 'rings' | 'dots'; // connector decoration style (default: 'rings')
    branchColorMode?: 'item' | 'parent'; // L-branch color source (default: 'item')
    junctionStyle?: 'rounded' | 'dot'; // L-junction style (default: 'rounded')
    showCenterDot?: boolean;     // draw center dot inside rings (default: true)
    connectorHalf?: boolean;     // half-ring mode (default: false)
    connectorBorderSize?: 'fit' | 'xs' | 'sm' | 'md' | 'lg';
    dotSpacing?: number;         // target px between dots (default: 50)
    // Layout
    indent?: 'xs' | 'sm' | 'md' | 'lg';  // gutter width (default: 'xs' = 24 px)
    rootChildIndentExtra?: number; // extra px for only root->first-child branch end
    rowGap?: number;             // px gap between item rows (default: 8)
    stubHeight?: number;         // px gap between root and first item (default: 12)
    className?: string;
    // State slots (like SplitView)
    loading?: boolean;
    loadingState?: React.ReactNode;
    emptyState?: React.ReactNode;
    error?: React.ReactNode;
    errorState?: React.ReactNode;
    onRetry?: () => void;
    // Reorder support
    reorderable?: boolean;
    onReorder?: (event: TreeReorderEvent) => void;
}

// ── TreeItemCard (exported standalone for advanced consumers) ───────────────

export interface TreeItemCardProps {
    icon?: React.ReactNode;
    iconClassName?: string;
    title?: React.ReactNode;
    titleClassName?: string;
    /** When true, the title wraps on word boundaries up to 10 lines instead of truncating. Default: false */
    titleWrap?: boolean;
    /** When true, the title stays on one line and scrolls horizontally — no wrapping, no truncation. Default: false */
    titleScroll?: boolean;
    subtitle?: React.ReactNode;
    subtitleClassName?: string;
    description?: React.ReactNode;
    descriptionClassName?: string;
    /** Optional badge/status slot rendered below description, without tone-derived text styling. */
    badge?: React.ReactNode;
    tone?: TreeTone;
    body?: React.ReactNode;
    defaultExpanded?: boolean;
    expanded?: boolean;
    onToggleExpanded?: () => void;
    forceToggle?: boolean;
    actions?: React.ReactNode;
    hoverActions?: React.ReactNode;
    dragHandle?: React.ReactNode;
    isDragging?: boolean;
    index?: number;
    className?: string;
    /** When true, show a subtle hover lift effect (shadow + translate-y). Default: false */
    hoverable?: boolean;
    /** When true, overlay a pulsing background animation using the item's tone color. Default: false */
    activePulse?: boolean;
}

// ── TreeFlowSvg (exported standalone for advanced consumers) ─────────────────

export interface TreeFlowSvgProps {
    cardHeights: number[];       // measured height of each row (including children)
    cardAnchors?: number[];      // Y offset from row top to connector centre (collapsed h/2)
    mode?: 'tree' | 'bracket';   // 'tree' (default L-shape) or 'bracket' ([-shape with parent connecting from right)
    parentAnchorY?: number;      // specific Y offset for parent connection in bracket mode
    parentOffset?: number;       // measured px gap from parent card border to child tree container top
    toneList: TreeTone[];        // tone per item
    activeList: boolean[];       // active state per item (drives branch color + animation)
    rootTone?: TreeTone;         // tone for root connector (default: 'neutral')
    rootActive?: boolean;        // root active (drives trunk color + animation)
    rowGap: number;
    stubHeight?: number;
    depth?: number;
    rootChildIndentExtra?: number;
    indent?: 'xs' | 'sm' | 'md' | 'lg';
    showLine?: boolean;
    showConnectors?: boolean;
    connectorStyle?: 'rings' | 'dots';
    branchColorMode?: 'item' | 'parent';
    junctionStyle?: 'rounded' | 'dot';
    showCenterDot?: boolean;
    connectorHalf?: boolean;
    connectorBorderSize?: 'fit' | 'xs' | 'sm' | 'md' | 'lg';
    dotSpacing?: number;
    style?: React.CSSProperties;
    className?: string;
    animated?: boolean;
}
