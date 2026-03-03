import type React from 'react';
import type { TreeTone } from '../TreeView/types';

export type ConnectionState = 'flowing' | 'stopped' | 'disabled';

// ── Connector config — lives on the "receiver" item ─────────────────────────
// The connector is the line/SVG between the previous item and this one.
// It's owned by the target/receiver node, so item[1].connector describes
// the bridge from item[0] → item[1], etc.

export interface ConnectionFlowConnectorConfig {
    /** Active flow state for this connector */
    state?: ConnectionState;
    /** Optional React element to render in the middle (e.g. an icon) */
    icon?: React.ReactNode;
    /** Width of the connector band in px (default: 56) */
    width?: number;
    /** Whether to animate the flowing dots (default: true) */
    animated?: boolean;
    /** target px per dot cycle (default: 60) */
    dotSpacing?: number;
    /** Connector ring border width (default: 'xs') */
    borderSize?: 'fit' | 'xs' | 'sm' | 'md' | 'lg';
    /** Whether to draw half-rings (default: true) */
    halfRing?: boolean;
    /** Show the horizontal line between rings (default: true) */
    showLine?: boolean;
    /** Override — force the source-side ring tone instead of inheriting from source item */
    sourceTone?: TreeTone;
    /** Override — force the target-side ring tone instead of inheriting from this item */
    targetTone?: TreeTone;

    // ── Fine-grained color overrides (both source and target sides) ──────────
    // When set, these take precedence over anything derived from tone tokens.

    /** Source ring background fill color (CSS string, e.g. '#22c55e' or 'rgba(...)') */
    sourceFill?: string;
    /** Source ring stroke/border color */
    sourceBorder?: string;
    /** Source ring center dot color */
    sourceDot?: string;

    /** Target ring background fill color */
    targetFill?: string;
    /** Target ring stroke/border color */
    targetBorder?: string;
    /** Target ring center dot color */
    targetDot?: string;

    /** Animated dot color (overrides what is derived from targetTone) */
    dotColor?: string;
}

// ── ConnectionFlowItem ────────────────────────────────────────────────────────
// Extends TreeItemData fields we care about, plus an optional connector config.

export interface ConnectionFlowItem {
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
    // Appearance
    tone?: TreeTone;
    // Expandable body
    body?: React.ReactNode;
    defaultExpanded?: boolean;
    // Actions
    actions?: React.ReactNode;
    hoverActions?: React.ReactNode;
    /**
     * Connector config for the edge leading INTO this item.
     * If not provided, inherits from the ConnectionFlow's default state.
     * Ignored for the first item (it has no predecessor).
     */
    connector?: ConnectionFlowConnectorConfig;
    /**
     * Children render vertically below this item's card using TreeView-style
     * SVG connectors. The connector between this item and the next sibling
     * spans the full column height (parent + children).
     */
    children?: ConnectionFlowItem[];
    /**
     * When true, this item has NO right-side connector to the next sibling
     * (it terminates the horizontal flow after itself).
     * Default: false
     */
    terminal?: boolean;
    /**
     * Active state — drives the vertical sub-tree dot animation color.
     * Default: false
     */
    active?: boolean;
}

// ── ConnectionFlowProps ───────────────────────────────────────────────────────

export interface ConnectionFlowProps {
    /** The nodes to render horizontally */
    items: ConnectionFlowItem[];
    /**
     * Fallback state applied to any connector that doesn't have its own `state`.
     * Default: 'flowing'
     */
    flowState?: ConnectionState;
    /**
     * Fallback icon shown in the middle of connectors (overridden per-item).
     */
    flowIcon?: React.ReactNode;
    /**
     * Fallback connector width in px.
     * Default: 56
     */
    connectorWidth?: number;
    /**
     * Whether flowing-dot animation is enabled globally.
     * Default: true
     */
    animated?: boolean;
    /**
     * Target px between dots globally.
     * Default: 60
     */
    dotSpacing?: number;
    /**
     * Ring border size globally.
     * Default: 'xs'
     */
    connectorBorderSize?: 'fit' | 'xs' | 'sm' | 'md' | 'lg';
    /**
     * Draw half-rings (matching TreeView half-connector style).
     * Default: true
     */
    connectorHalf?: boolean;
    /**
     * Show the horizontal line between connectors.
     * Default: true
     */
    showLine?: boolean;
    /** Indent size for children sub-trees. Default: 'xs' */
    childIndent?: 'xs' | 'sm' | 'md' | 'lg';
    /** Row gap in px between children. Default: 8 */
    childRowGap?: number;
    className?: string;
    /** Extra content to render to the right of the entire flow (e.g. an expand toggle) */
    rightAction?: React.ReactNode;
}
