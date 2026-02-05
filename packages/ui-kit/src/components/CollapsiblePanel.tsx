import React, { useMemo, useState } from "react";
import classNames from "classnames";
import { useIconRenderer } from "../contexts/IconContext";
import type { PanelTone } from "./Panel";

const toneStyles: Partial<Record<PanelTone, { container: string; header: string; chevron: string; content: string }>> = {
  neutral: {
    container: "border-slate-200/70 bg-white/90 text-slate-900 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-100",
    header: "text-slate-800 dark:text-slate-100",
    chevron: "text-slate-400 dark:text-slate-500",
    content: "text-slate-600 dark:text-slate-200",
  },
  info: {
    container: "border-blue-200/70 bg-blue-50/80 text-blue-900 shadow-sm dark:border-blue-500/40 dark:bg-blue-950/30 dark:text-blue-100",
    header: "text-blue-900 dark:text-blue-100",
    chevron: "text-blue-500 dark:text-blue-300",
    content: "text-blue-700 dark:text-blue-200",
  },
  success: {
    container: "border-emerald-200/70 bg-emerald-50/80 text-emerald-900 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-100",
    header: "text-emerald-900 dark:text-emerald-100",
    chevron: "text-emerald-500 dark:text-emerald-300",
    content: "text-emerald-700 dark:text-emerald-200",
  },
  warning: {
    container: "border-amber-200/70 bg-amber-50/80 text-amber-900 shadow-sm dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-100",
    header: "text-amber-900 dark:text-amber-100",
    chevron: "text-amber-500 dark:text-amber-300",
    content: "text-amber-700 dark:text-amber-200",
  },
  danger: {
    container: "border-rose-200/70 bg-rose-50/80 text-rose-900 shadow-sm dark:border-rose-500/40 dark:bg-rose-950/30 dark:text-rose-100",
    header: "text-rose-900 dark:text-rose-100",
    chevron: "text-rose-500 dark:text-rose-300",
    content: "text-rose-700 dark:text-rose-200",
  },
  brand: {
    container: "border-blue-200/70 bg-blue-50/80 text-blue-900 shadow-sm dark:border-blue-500/40 dark:bg-blue-950/30 dark:text-blue-100",
    header: "text-blue-900 dark:text-blue-100",
    chevron: "text-blue-500 dark:text-blue-300",
    content: "text-blue-700 dark:text-blue-200",
  },
};

type CollapsibleVariant = "card" | "plain";

const variantStyles: Record<CollapsibleVariant, string> = {
  card: "border rounded-3xl px-5 py-3",
  plain: "border border-transparent px-0 py-0 shadow-none bg-transparent",
};

export interface CollapsiblePanelProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  disabled?: boolean;
  tone?: PanelTone;
  variant?: CollapsibleVariant;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  contentMaxHeight?: number;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  subtitle,
  defaultExpanded = false,
  expanded,
  onToggle,
  disabled = false,
  tone = "neutral",
  variant = "card",
  actions,
  children,
  className,
  contentClassName,
  contentMaxHeight = 320,
}) => {
  const renderIcon = useIconRenderer();
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = typeof expanded === "boolean";
  const isExpanded = isControlled ? expanded : internalExpanded;

  const palette = useMemo(() => (toneStyles[tone] ?? toneStyles.neutral)!, [tone]);

  const handleToggle = () => {
    if (disabled) {
      return;
    }
    const next = !isExpanded;
    if (!isControlled) {
      setInternalExpanded(next);
    }
    onToggle?.(next);
  };

  const computedContentMaxHeight = `min(${contentMaxHeight}px, 65vh)`;

  return (
    <section className={classNames(variantStyles[variant], palette.container, disabled && "opacity-60", className)}>
      <button type="button" className="flex w-full items-center gap-3 text-left" onClick={handleToggle} disabled={disabled}>
        <div className="flex flex-1 flex-col gap-1">
          <span className={classNames("text-sm font-semibold", palette.header)}>{title}</span>
          {subtitle && <span className={classNames("text-xs text-slate-500 dark:text-slate-300")}>{subtitle}</span>}
        </div>
        {actions}
        <span className={classNames("transition-transform", palette.chevron, isExpanded ? "rotate-180" : "rotate-0")}>
          {renderIcon("ArrowDown", "sm")}
        </span>
      </button>
      <div
        className={classNames("overflow-hidden transition-[max-height] duration-300", isExpanded ? "mt-3" : "max-h-0")}
        style={{
          maxHeight: isExpanded ? `calc(${computedContentMaxHeight} + 3rem)` : "0px",
        }}
      >
        <div
          className={classNames("text-sm leading-relaxed pr-1", palette.content, isExpanded && "overflow-y-auto", contentClassName)}
          style={isExpanded ? { maxHeight: computedContentMaxHeight } : undefined}
        >
          {children}
        </div>
      </div>
    </section>
  );
};

export default CollapsiblePanel;
