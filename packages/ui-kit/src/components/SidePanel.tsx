import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import IconButton from './IconButton';
import { IconSize } from '../types';

export interface SidePanelProps {
    /** Whether the panel is open */
    isOpen: boolean;
    /** Called when the user clicks the close button */
    onClose?: () => void;
    /** Panel title */
    title?: React.ReactNode;
    /** Secondary line rendered below the title */
    subtitle?: React.ReactNode;
    /** Width of the panel in px (default: 420) */
    width?: number;
    /** Extra nodes rendered in the header next to the close button */
    headerActions?: React.ReactNode;
    /** Sticky footer rendered at the bottom of the panel */
    footer?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    closeIconSize?: IconSize;
}

/**
 * SidePanel — slides in from the right as a fixed overlay.
 *
 * Because it uses `position: fixed` it never affects the page layout,
 * so no horizontal scrollbar artifacts occur during the animation.
 *
 * ```tsx
 * <SidePanel isOpen={open} onClose={() => setOpen(false)} title="Details">
 *   …detail content…
 * </SidePanel>
 * ```
 */
export const SidePanel: React.FC<SidePanelProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    width = 420,
    headerActions,
    footer,
    children,
    className,
    closeIconSize = 'sm',
}) => {
    // Mount immediately on open so the opening animation can play.
    // Unmount only after the closing animation finishes (onTransitionEnd).
    const [mounted, setMounted] = useState(isOpen);
    const prevOpenRef = useRef(isOpen);

    useEffect(() => {
        if (isOpen && !prevOpenRef.current) {
            setMounted(true);
        }
        prevOpenRef.current = isOpen;
    }, [isOpen]);

    const handleTransitionEnd = () => {
        if (!isOpen) setMounted(false);
    };

    if (!mounted) return null;

    return (
        <div
            className={classNames(
                'absolute top-0 right-0 h-full z-40',
                'overflow-hidden transition-[width] duration-300 ease-in-out',
                'border-l border-neutral-200 dark:border-neutral-700',
                'shadow-xl dark:shadow-neutral-900/50',
            )}
            style={{ width: isOpen ? width : 0 }}
            onTransitionEnd={handleTransitionEnd}
        >
            {/* Inner container — fixed at target width so content never squishes during animation */}
            <div
                className={classNames(
                    'flex h-full flex-col bg-white dark:bg-neutral-900',
                    className,
                )}
                style={{ width }}
            >
                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex-none flex items-start justify-between gap-3 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3">
                    <div className="min-w-0 flex-1">
                        {title && (
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1 pt-0.5">
                        {headerActions}
                        {onClose && (
                            <IconButton
                                icon="Close"
                                size={closeIconSize}
                                variant="ghost"
                                color="slate"
                                onClick={onClose}
                                aria-label="Close panel"
                            />
                        )}
                    </div>
                </div>

                {/* ── Body ───────────────────────────────────────────────── */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    {children}
                </div>

                {/* ── Footer ─────────────────────────────────────────────── */}
                {footer && (
                    <div className="flex-none border-t border-neutral-200 dark:border-neutral-700 px-4 py-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SidePanel;
