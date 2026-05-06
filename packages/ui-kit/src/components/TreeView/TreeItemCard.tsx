import React, { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { getTreeColorTokens } from "./toneColors";
import type { TreeItemCardProps } from "./types";
import TooltipWrapper from "../TooltipWrapper";
import { IconButton } from "../..";

// ── TreeItemCard ─────────────────────────────────────────────────────────────
//
// Generic collapsible card for use in tree layouts.
// - tone drives all colors (bg, border, text) automatically
// - body enables an expand toggle; when absent, no toggle is shown
// - actions: always-visible slot (before expand toggle)
// - hoverActions: rendered with opacity-0 / group-hover:opacity-100

const TreeItemCard: React.FC<TreeItemCardProps> = ({
  icon,
  iconClassName,
  title,
  titleClassName,
  titleWrap = false,
  titleScroll = false,
  subtitle,
  subtitleClassName,
  description,
  descriptionClassName,
  tone,
  body,
  defaultExpanded = false,
  expanded,
  onToggleExpanded,
  forceToggle = false,
  badge,
  actions,
  hoverActions,
  dragHandle,
  isDragging = false,
  index = 0,
  className,
  hoverable = false,
  activePulse = false,
}) => {
  const tokens = getTreeColorTokens(tone);
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = expanded ?? internalExpanded;
  const canExpand = forceToggle || (body !== undefined && body !== null);

  // ── Clamp detection (only when titleWrap is active, not titleScroll) ────────
  const titleRef = useRef<HTMLDivElement>(null);
  const [isTitleClamped, setIsTitleClamped] = useState(false);

  useEffect(() => {
    if (!titleWrap || titleScroll) {
      setIsTitleClamped(false);
      return;
    }
    const el = titleRef.current;
    if (!el) return;
    const check = () => setIsTitleClamped(el.scrollHeight > el.clientHeight);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [titleWrap, titleScroll, title]);

  const handleToggle = () => {
    if (onToggleExpanded) {
      onToggleExpanded();
      return;
    }
    setInternalExpanded((v) => !v);
  };

  // ── Title element (shared between wrapped, scrolled, and truncated paths) ──
  // titleScroll  → single line, scrollable horizontally
  // titleWrap    → word-boundary wrapping, max 10 lines (via CSS -webkit-line-clamp)
  // default      → single line, ellipsis truncation
  const titleEl = title ? (
    <div
      ref={titleRef}
      className={classNames(
        "text-sm font-semibold mb-0.5",
        titleScroll
          ? "whitespace-nowrap overflow-x-auto"
          : titleWrap
            ? "overflow-hidden"
            : "truncate",
        tokens.headerText,
        titleClassName,
      )}
      style={
        titleWrap && !titleScroll
          ? {
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 10,
            }
          : undefined
      }
    >
      {title}
    </div>
  ) : null;

  return (
    <div
      className={classNames(
        "relative transition-[transform,opacity,box-shadow] duration-200 ease-out",
        isDragging && "opacity-70",
        hoverable && "hover:-translate-y-0.5 hover:shadow-md cursor-pointer",
        className,
      )}
      style={
        index > 0
          ? {
              animation: "fadeIn 0.3s ease both",
              animationDelay: `${index * 0.05}s`,
            }
          : undefined
      }
    >
      <div
        className={classNames(
          "relative overflow-hidden rounded-xl border group/tree-card flex flex-col h-full",
          tokens.border,
        )}
      >
        {/* Pulsing background layer — sits behind the header so text is unaffected */}
        {activePulse && (
          <div
            className={classNames(
              "absolute inset-0 pointer-events-none animate-pulse",
              tokens.pulseBg,
            )}
          />
        )}

        {/* Header row — bg-transparent when pulsing so the layer behind shows through */}
        <div
          className={classNames(
            "relative flex items-stretch gap-1.5 p-3 flex-1",
            activePulse ? "bg-transparent" : tokens.bg,
          )}
        >
          {/* Icon slot */}
          {icon && (
            <div
              className={classNames(
                "w-10 h-10 shrink-0 self-center",
                tokens.labelText,
                iconClassName,
              )}
            >
              {icon}
            </div>
          )}

          {/* Text content */}
          <div className="flex-1 min-w-0">
            {titleEl &&
              (titleWrap && isTitleClamped && typeof title === "string" ? (
                <TooltipWrapper text={title}>{titleEl}</TooltipWrapper>
              ) : (
                titleEl
              ))}
            {subtitle && (
              <div
                className={classNames(
                  "text-sm font-mono truncate",
                  tokens.headerText,
                  subtitleClassName,
                )}
              >
                {subtitle}
              </div>
            )}
            {description && (
              <div
                className={classNames(
                  "text-[10px] mt-0.5",
                  tokens.labelText,
                  descriptionClassName,
                )}
              >
                {description}
              </div>
            )}
            {badge && (
              <div className="flex flex-wrap items-center gap-1 mt-1">
                {badge}
              </div>
            )}
          </div>

          {/* Hover actions */}
          {hoverActions && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover/tree-card:opacity-100 transition-opacity duration-150 shrink-0 self-start">
              {hoverActions}
            </div>
          )}

          {/* Always-visible actions */}
          {actions && (
            <div className="flex items-center gap-0.5 shrink-0 self-start">
              {actions}
            </div>
          )}

          {/* Drag handle */}
          {dragHandle && (
            <div className="flex items-center shrink-0 self-start">
              {dragHandle}
            </div>
          )}

          {/* Expand toggle */}
          {canExpand && (
            <div className="flex items-center shrink-0 self-start">
              <IconButton
                icon={isExpanded ? "ArrowDown" : "ArrowChevronRight"}
                onClick={handleToggle}
                tooltip={isExpanded ? "Collapse" : "Expand"}
                variant="ghost"
                size="xs"
                color="slate"
              />
            </div>
          )}
        </div>

        {/* Expandable body panel */}
        {body !== undefined && body !== null && (
          <div
            className={classNames(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
              isExpanded
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="min-h-0 bg-white dark:bg-neutral-900 rounded-b-xl">
              <div className="border-t border-neutral-200 dark:border-neutral-700" />
              {body}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeItemCard;
