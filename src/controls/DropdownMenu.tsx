import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import CustomIcon from './CustomIcon';
import type { IconName } from '@/types/Icon';

export interface DropdownMenuOption {
  label: ReactNode;
  value: string;
  description?: ReactNode;
  icon?: IconName | React.ReactElement;
  disabled?: boolean;
  danger?: boolean;
}

export interface DropdownMenuProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  items: DropdownMenuOption[];
  onSelect?: (item: DropdownMenuOption) => void;
  align?: 'start' | 'end';
  side?: 'auto' | 'top' | 'bottom';
  width?: number | 'trigger';
  maxHeight?: number;
  className?: string;
  itemClassName?: string;
}

const PORTAL_ROOT = typeof document !== 'undefined' ? document.body : null;

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  anchorRef,
  open,
  onClose,
  items,
  onSelect,
  align = 'end',
  side = 'auto',
  width = 'trigger',
  maxHeight = 288,
  className,
  itemClassName,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>();

  const handleSelect = useCallback(
    (item: DropdownMenuOption) => {
      if (item.disabled) {
        return;
      }
      onSelect?.(item);
      onClose();
    },
    [onClose, onSelect]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointer = (event: MouseEvent) => {
      if (
        menuRef.current?.contains(event.target as Node) ||
        anchorRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      onClose();
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    if (!open) {
      setStyle(undefined);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current || !menuRef.current) {
      return;
    }

    const anchorRect = anchorRef.current.getBoundingClientRect();
    const caretElement = anchorRef.current.querySelector('[data-dropdown-caret]');
    const caretRect = caretElement?.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const offset = 8;
    const minMargin = 8;

    const computedWidth =
      typeof width === 'number'
        ? width
        : width === 'trigger'
          ? Math.max(anchorRect.width, menuRect.width)
          : menuRect.width;

    // --- Vertical Positioning ---
    let top = anchorRect.bottom + offset;
    let preferredSide: 'top' | 'bottom' = 'bottom';
    if (side === 'top') {
      preferredSide = 'top';
    } else if (side === 'auto') {
      const fitsBelow =
        anchorRect.bottom + offset + menuRect.height <= viewportHeight - minMargin;
      const fitsAbove = anchorRect.top - offset - menuRect.height >= minMargin;
      preferredSide = !fitsBelow && fitsAbove ? 'top' : 'bottom';
    }
    if (preferredSide === 'top') {
      top = anchorRect.top - offset - menuRect.height;
    }

    // Clamp vertical position
    if (top < minMargin) {
      top = minMargin;
    }
    if (top + menuRect.height > viewportHeight - minMargin) {
      top = Math.max(minMargin, viewportHeight - menuRect.height - minMargin);
    }

    // --- Horizontal Positioning ---
    const alignReferenceRect = caretRect || anchorRect;
    const leftAlignedX = alignReferenceRect.left;
    const rightAlignedX = alignReferenceRect.right - computedWidth;

    let left = 0;

    // Check availability
    const fitsLeft = leftAlignedX + computedWidth <= viewportWidth - minMargin;
    const fitsRight = rightAlignedX >= minMargin;

    if (align === 'start') {
      if (fitsLeft) {
        left = leftAlignedX;
      } else if (fitsRight) {
        left = rightAlignedX;
      } else {
        left = leftAlignedX;
      }
    } else {
      // align === 'end'
      if (fitsRight) {
        left = rightAlignedX;
      } else if (fitsLeft) {
        left = leftAlignedX;
      } else {
        left = rightAlignedX;
      }
    }

    // Final Clamp
    if (left < minMargin) {
      left = minMargin;
    }
    if (left + computedWidth > viewportWidth - minMargin) {
      left = viewportWidth - computedWidth - minMargin;
    }

    const nextStyle: React.CSSProperties = {
      top: `${top}px`,
      left: `${left}px`,
    };

    if (typeof width === 'number') {
      nextStyle.width = computedWidth;
    } else if (width === 'trigger') {
      nextStyle.minWidth = computedWidth;
    }

    setStyle(nextStyle);
  }, [open, anchorRef, align, side, width]);

  if (!open || !PORTAL_ROOT) {
    return null;
  }

  const resolvedStyle = style ?? { visibility: 'hidden' };

  return createPortal(
    <div
      ref={menuRef}
      style={resolvedStyle}
      role="menu"
      className={classNames(
        'fixed z-[1200] min-w-[10rem] overflow-hidden rounded-lg border border-neutral-200 bg-white/95 p-1 text-sm shadow-xl ring-1 ring-black/5 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95',
        !style && 'invisible opacity-0',
        className
      )}
    >
      <ul
        className="overflow-auto"
        style={{ maxHeight }}
        onClick={(event) => event.stopPropagation()}
      >
        {items.map((item) => (
          <li key={item.value}>
            <button
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={(event) => {
                event.stopPropagation();
                handleSelect(item);
              }}
              className={classNames(
                'flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60',
                item.disabled
                  ? 'cursor-not-allowed opacity-50'
                  : item.danger
                    ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                itemClassName
              )}
            >
              {item.icon && (
                <span className="mt-0.5 flex h-4 w-4 items-center justify-center text-neutral-400 dark:text-neutral-300">
                  {typeof item.icon === 'string' ? (
                    <CustomIcon icon={item.icon} size="sm" />
                  ) : (
                    item.icon
                  )}
                </span>
              )}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                  {item.label}
                </span>
                {item.description && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {item.description}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>,
    PORTAL_ROOT
  );
};

DropdownMenu.displayName = 'DropdownMenu';

export default DropdownMenu;
