import type React from 'react';
import type { ButtonVariant, ButtonSize } from '../Button';
import type { ThemeColor } from '../../theme/Theme';
import type { PanelVariant, PanelPadding, PanelCorner } from '../Panel';
import { LoaderProps } from '../Loader';

export type { PanelVariant as TimelinePanelVariant, PanelPadding as TimelinePanelPadding, PanelCorner as TimelinePanelCorner };

export interface TimelinePanelAction {
  label: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  color?: ThemeColor;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
}

export interface TimelinePanelOverflowItem {
  label: React.ReactNode;
  value: string;
  icon?: string | React.ReactElement;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface TimelinePanelItem {
  id: string;
  /** Icon shown in a rounded box next to the content */
  icon?: React.ReactNode;
  /** draws a background for the icon */
  iconBackground?: boolean;
  /** Primary label */
  title: React.ReactNode;
  /** Secondary line (date, size, etc.) */
  subtitle?: React.ReactNode;
  /**
   * When true the item is rendered as a "current state" badge row instead of
   * a normal content row. The title becomes the badge text.
   */
  isCurrent?: boolean;
  /**
   * When true the dot on the timeline line is larger/filled — use for root or
   * first items to visually anchor the timeline.
   */
  isRoot?: boolean;
  /** Inline action buttons rendered on the right side */
  actions?: TimelinePanelAction[];
  /** Items for the overflow (⋮) dropdown menu */
  overflowActions?: TimelinePanelOverflowItem[];
  /**
   * Optional depth (0-based) for subtle left-indentation of content inside
   * each row. The dot and icon always stay on the left rail.
   */
  depth?: number;
}

export interface TimelinePanelHeaderAction {
  label: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  color?: ThemeColor;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leadingIcon?: string | React.ReactElement;
}

export interface TimelinePanelProps {
  /** Panel title rendered in the header */
  title?: React.ReactNode;
  /** Optional button rendered at the right of the header */
  headerAction?: TimelinePanelHeaderAction;
  /** Timeline items */
  items: TimelinePanelItem[];
  // ── Appearance ────────────────────────────────────────────────────────────
  variant?: PanelVariant;
  tone?: ThemeColor;
  padding?: PanelPadding;
  corner?: PanelCorner;
  /** Color of the connecting vertical line */
  lineColor?: string;
  // ── State ─────────────────────────────────────────────────────────────────
  loading?: boolean;
  /** Node to show when items is empty */
  emptyState?: React.ReactNode;
  className?: string;
  loaderProps?: LoaderProps
}
