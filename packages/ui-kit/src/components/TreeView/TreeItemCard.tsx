import React, { useState } from 'react';
import classNames from 'classnames';
import { getTreeColorTokens } from './toneColors';
import type { TreeItemCardProps } from './types';

// ── TreeItemCard ─────────────────────────────────────────────────────────────
//
// Generic collapsible card for use in tree layouts.
// - tone drives all colors (bg, border, text) automatically
// - body enables an expand toggle; when absent, no toggle is shown
// - actions: always-visible slot (before expand toggle)
// - hoverActions: rendered with opacity-0 / group-hover:opacity-100

const TreeItemCard: React.FC<TreeItemCardProps> = ({
    icon, iconClassName,
    title, titleClassName,
    subtitle, subtitleClassName,
    description, descriptionClassName,
    tone, body, defaultExpanded = false,
    expanded,
    onToggleExpanded,
    forceToggle = false,
    actions, hoverActions,
    dragHandle,
    isDragging = false,
    index = 0, className,
}) => {
    const tokens = getTreeColorTokens(tone);
    const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
    const isExpanded = expanded ?? internalExpanded;
    const canExpand = forceToggle || (body !== undefined && body !== null);

    const handleToggle = () => {
        if (onToggleExpanded) {
            onToggleExpanded();
            return;
        }
        setInternalExpanded(v => !v);
    };

    return (
        <div
            className={classNames(
                'relative transition-[transform,opacity] duration-200 ease-out',
                isDragging && 'opacity-70',
                className,
            )}
            style={index > 0 ? {
                animation: 'fadeIn 0.3s ease both',
                animationDelay: `${index * 0.05}s`,
            } : undefined}
        >
            <div className={classNames(
                'relative overflow-hidden rounded-xl border group/tree-card flex flex-col h-full',
                tokens.border,
            )}>
                {/* Header row */}
                <div className={classNames('flex items-stretch gap-3 p-3 flex-1', tokens.bg)}>

                    {/* Icon slot */}
                    {icon && (
                        <div className={classNames(
                            'w-10 h-10 flex-shrink-0 self-center',
                            tokens.labelText,
                            iconClassName,
                        )}>
                            {icon}
                        </div>
                    )}

                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                        {title && (
                            <div className={classNames(
                                'text-sm font-semibold truncate mb-0.5',
                                tokens.headerText,
                                titleClassName,
                            )}>
                                {title}
                            </div>
                        )}
                        {subtitle && (
                            <div className={classNames(
                                'text-sm font-mono truncate',
                                tokens.headerText,
                                subtitleClassName,
                            )}>
                                {subtitle}
                            </div>
                        )}
                        {description && (
                            <div className={classNames(
                                'text-[10px] mt-0.5',
                                tokens.labelText,
                                descriptionClassName,
                            )}>
                                {description}
                            </div>
                        )}
                    </div>

                    {/* Hover actions */}
                    {hoverActions && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/tree-card:opacity-100 transition-opacity duration-150 flex-shrink-0 self-start mt-1">
                            {hoverActions}
                        </div>
                    )}

                    {/* Always-visible actions */}
                    {actions && (
                        <div className="flex items-center gap-0.5 flex-shrink-0 self-start mt-1">
                            {actions}
                        </div>
                    )}

                    {/* Drag handle */}
                    {dragHandle && (
                        <div className="flex items-center flex-shrink-0 self-start mt-1">
                            {dragHandle}
                        </div>
                    )}

                    {/* Expand toggle */}
                    {canExpand && (
                        <div className="flex items-center flex-shrink-0 self-start mt-1">
                            <button
                                type="button"
                                onClick={handleToggle}
                                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                aria-expanded={isExpanded}
                            >
                                <svg
                                    className={classNames(
                                        'w-4 h-4 transition-transform duration-200',
                                        tokens.labelText,
                                        isExpanded && 'rotate-180',
                                    )}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Expandable body panel */}
                {body !== undefined && body !== null && (
                    <div className={classNames(
                        'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out',
                        isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                    )}>
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
