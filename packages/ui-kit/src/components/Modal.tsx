import classNames from "classnames";
import React, { type ReactNode, useCallback, useEffect, useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Loader, Tabs, type TabsProps, IconButton, Button, type ButtonColor, type ButtonProps, type ButtonVariant } from ".";
import type { ModalSize } from "../theme";
import { type IconName } from "../icons/registry";
import { renderIcon } from "../utils/renderIcon";

type ModalActionsAlign = "start" | "center" | "end" | "between";

const sizePresets: Record<
  ModalSize,
  {
    width?: number;
    className: string;
  }
> = {
  xs: { width: 320, className: "sm:max-w-[320px]" },
  sm: { width: 400, className: "sm:max-w-[400px]" },
  md: { width: 600, className: "sm:max-w-[600px]" },
  lg: { width: 800, className: "sm:max-w-[800px]" },
  xl: { width: 1000, className: "sm:max-w-[1000px]" },
  xxl: { width: 1120, className: "sm:max-w-[1120px]" },
  "2xl": { width: 1120, className: "sm:max-w-[1120px]" },
  xxxl: { width: 1280, className: "sm:max-w-[1280px]" },
  "3xl": { width: 1280, className: "sm:max-w-[1280px]" },
  full: { className: "sm:max-w-none sm:w-full" },
};

const toCssDimension = (value?: number | string): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === "number") {
    return `${value}px`;
  }
  return value;
};

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

interface ModalActionsProps {
  children: ReactNode;
  align?: ModalActionsAlign;
  className?: string;
}

const alignmentClassMap: Record<ModalActionsAlign, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

const ModalActions: React.FC<ModalActionsProps> = ({ children, align = "end", className }) => {
  const alignmentClass = alignmentClassMap[align] ?? alignmentClassMap.end;
  return <div className={classNames("flex w-full flex-wrap items-center gap-2", alignmentClass, className)}>{children}</div>;
};

export interface ModalProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: IconName | React.ReactElement;
  children: ReactNode;
  bodyHeader?: ReactNode;
  bodyClassName?: string;
  footer?: ReactNode;
  actions?: ReactNode;
  size?: ModalSize;
  maxWidth?: number | string;
  minWidth?: number | string;
  backgroundClassName?: string;
  background_color?: string;
  darkOverlay?: boolean;
  dark_overlay?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  preventScroll?: boolean;
  overlayClassName?: string;
  showFooterDivider?: boolean;
  headerActions?: ButtonProps[];
  header_actions?: ButtonProps[];
  headerTabs?: TabsProps;
  header_tabs?: TabsProps;
  loading?: boolean;
  loadingTitle?: ReactNode;
  loadingLabel?: ReactNode;
  hideCloseButton?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
  ariaLabel?: string;
  role?: "dialog" | "alertdialog";
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  bodyHeader,
  bodyClassName,
  footer,
  actions,
  size = "md",
  maxWidth,
  minWidth,
  backgroundClassName,
  background_color,
  darkOverlay,
  dark_overlay,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  preventScroll = true,
  className,
  overlayClassName,
  style,
  headerActions,
  header_actions,
  headerTabs,
  loading,
  loadingTitle,
  loadingLabel,
  hideCloseButton = false,
  initialFocusRef,
  ariaLabel,
  role = "dialog",
  showFooterDivider,
  onMouseDown,
  onClick,
  onKeyDown,
  ...rest
}) => {
  const hasDom = isBrowser;
  const contentRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const headingId = useId();
  const bodyId = useId();

  const isDarkOverlay = darkOverlay ?? dark_overlay ?? false;
  const footerContent = footer ?? actions;
  const effectiveHeaderActions = headerActions ?? header_actions ?? [];

  const tabsConfig = useMemo(() => {
    if (headerTabs) {
      return headerTabs;
    }
  }, [headerTabs]);

  const presetForSize = typeof size === "string" ? sizePresets[size] : undefined;
  const fallbackPreset = sizePresets.md;
  const resolvedPreset = presetForSize ?? fallbackPreset;
  const isFullWidth = size === "full";
  const explicitSize = typeof size === "number" || (typeof size === "string" && presetForSize === undefined && !isFullWidth);
  const sizeClass = !explicitSize ? resolvedPreset.className : undefined;
  const presetWidth = !explicitSize && !isFullWidth ? resolvedPreset.width : undefined;
  const presetWidthValue = presetWidth ? toCssDimension(presetWidth) : undefined;
  const explicitWidthValue = explicitSize ? toCssDimension(size as number | string) : undefined;
  const resolvedMaxWidth = maxWidth !== undefined ? toCssDimension(maxWidth) : isFullWidth ? "100%" : (explicitWidthValue ?? presetWidthValue);
  const resolvedWidth = isFullWidth ? "100%" : explicitWidthValue ? `min(100%, ${explicitWidthValue})` : presetWidthValue ? `min(100%, ${presetWidthValue})` : undefined;

  const overlayClasses = classNames(
    "fixed inset-0 z-[1600] flex min-h-full items-start justify-center overflow-y-auto px-4 py-6 sm:px-8 sm:py-12 sm:items-center",
    isDarkOverlay ? "bg-neutral-950/70" : "bg-neutral-900/40",
    "backdrop-blur-sm",
    overlayClassName,
  );

  const contentClasses = classNames(
    "relative flex w-full max-h-[90vh] sm:max-h-[85vh] flex-col overflow-hidden rounded-[28px] border border-neutral-200/70 bg-white shadow-2xl transition-all duration-200 ease-out dark:border-neutral-700/60 dark:bg-neutral-800",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-0",
    sizeClass,
    backgroundClassName,
    background_color,
    className,
  );

  const showFooterDividerClass = showFooterDivider ? "border-t border-neutral-200/70 dark:border-neutral-700/60" : "";

  const contentStyle: React.CSSProperties = {
    ...(resolvedWidth ? { width: resolvedWidth } : undefined),
    ...(resolvedMaxWidth ? { maxWidth: resolvedMaxWidth } : undefined),
    ...(minWidth !== undefined ? { minWidth: toCssDimension(minWidth) } : undefined),
    ...style,
  };

  const ariaLabelValue = ariaLabel ?? (typeof title === "string" ? title : undefined);
  const ariaLabelledBy = ariaLabelValue ? undefined : headingId;
  const ariaDescribedBy = description || bodyHeader ? bodyId : undefined;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    },
    [closeOnEsc, onClose],
  );

  // Effect to handle initial focus
  useEffect(() => {
    if (!hasDom) {
      return;
    }

    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

      const focusTarget = initialFocusRef?.current ?? (!hideCloseButton ? closeButtonRef.current : null) ?? (contentRef.current as HTMLElement | null);

      // Use requestAnimationFrame to ensure the modal is rendered and refs are available
      const focusFrame = requestAnimationFrame(() => {
        focusTarget?.focus({ preventScroll: true });
      });

      return () => {
        cancelAnimationFrame(focusFrame);
      };
    }
  }, [hasDom, isOpen, hideCloseButton, initialFocusRef]); // Minimal dependencies to ensure focus only runs on open or relevant prop change that might affect focus target

  // Effect to handle event listeners and scroll locking
  useEffect(() => {
    if (!hasDom) {
      return;
    }

    if (isOpen) {
      if (closeOnEsc) {
        document.addEventListener("keydown", handleKeyDown);
      }

      if (preventScroll) {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
          document.removeEventListener("keydown", handleKeyDown);
          document.body.style.overflow = originalOverflow;
        };
      }

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeOnEsc, handleKeyDown, hasDom, isOpen, preventScroll]);

  useEffect(() => {
    if (!hasDom) {
      return;
    }

    if (!isOpen && previouslyFocusedRef.current) {
      const node = previouslyFocusedRef.current;
      previouslyFocusedRef.current = null;
      node.focus({ preventScroll: true });
    }
  }, [hasDom, isOpen]);

  const handleBackdropMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!closeOnBackdropClick) {
        return;
      }
      if (event.target === event.currentTarget) {
        event.stopPropagation();
        onClose();
      }
    },
    [closeOnBackdropClick, onClose],
  );

  const handleContentMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      onMouseDown?.(event);
    },
    [onMouseDown],
  );

  const handleContentClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      onClick?.(event);
    },
    [onClick],
  );

  const handleContentKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
    },
    [onKeyDown],
  );

  if (!hasDom || !isOpen) {
    return null;
  }

  const content = (
    <div className={overlayClasses} onMouseDown={handleBackdropMouseDown}>
      <div
        ref={contentRef}
        className={contentClasses}
        style={contentStyle}
        role={role}
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabelValue}
        aria-describedby={ariaDescribedBy}
        aria-busy={loading ? "true" : undefined}
        tabIndex={-1}
        onMouseDown={handleContentMouseDown}
        onClick={handleContentClick}
        onKeyDown={handleContentKeyDown}
        {...rest}
      >
        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-neutral-200/70 pl-4 pr-3 py-4 dark:border-neutral-700/60">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-3">
              {icon && <div className="flex shrink-0 items-center justify-center text-neutral-600 dark:text-neutral-200">{renderIcon(icon, "sm")}</div>}
              <div className="min-w-0">
                <h2 id={headingId} className="truncate text-xl font-medium tracking-tight text-neutral-900 dark:text-neutral-100">
                  {title}
                </h2>
              </div>
            </div>
            {description && <p className="text-sm text-neutral-600 dark:text-neutral-300">{description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {effectiveHeaderActions.map((action, index) => (
              <Button key={`modal-header-action-${index}`} {...action} />
            ))}
            {!hideCloseButton && <IconButton ref={closeButtonRef} icon="Close" variant="ghost" color="slate" size="sm" aria-label="Close dialog" onClick={onClose} />}
          </div>
        </div>

        {tabsConfig && (
          <div className="flex-shrink-0 border-b border-neutral-200/70 px-6 py-2 dark:border-neutral-700/60">
            <Tabs {...tabsConfig} className={classNames("w-full overflow-x-auto", tabsConfig.className)} />
          </div>
        )}

        {bodyHeader && <div className="flex-shrink-0 border-b border-neutral-200/70 bg-neutral-50 px-6 py-3 dark:border-neutral-700/60 dark:bg-neutral-800/60"> {bodyHeader}</div>}
        <div className="relative flex flex-1 min-h-0 overflow-hidden bg-neutral-50 dark:bg-neutral-800/60">
          {loading && <Loader overlay title={loadingTitle} label={loadingLabel} className="z-30" />}
          <div
            id={bodyId}
            className={classNames(
              "relative flex-1 min-h-0 overflow-y-auto px-6 py-5",
              "scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent dark:scrollbar-thumb-neutral-700",
              bodyClassName,
              loading && "pointer-events-none",
            )}
          >
            <div className="flex flex-col gap-4">{children}</div>
          </div>
        </div>
        {footerContent && (
          <div className={classNames("flex flex-shrink-0 items-center  justify-end gap-3 bg-neutral-50 px-6 py-4 dark:bg-neutral-800/60", showFooterDividerClass)}>{footerContent}</div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

interface ConfirmModalProps extends Omit<ModalProps, "footer" | "actions" | "children" | "onClose" | "title"> {
  title: ReactNode;
  children?: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  confirmVariant?: ButtonVariant;
  confirmColor?: ButtonColor;
  isConfirmDisabled?: boolean;
  confirmButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  description?: ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  confirmVariant = "solid",
  isConfirmDisabled = false,
  confirmButtonProps,
  cancelButtonProps,
  children,
  ...props
}) => {
  return (
    <Modal
      {...props}
      onClose={onClose}
      footer={
        <ModalActions>
          <Button variant="soft" color="slate" onClick={onClose} {...cancelButtonProps}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} color={props.confirmColor || "blue"} onClick={onConfirm} disabled={isConfirmDisabled} {...confirmButtonProps}>
            {confirmLabel}
          </Button>
        </ModalActions>
      }
    >
      {children}
    </Modal>
  );
};

type ModalComponentType = typeof Modal & {
  Actions: typeof ModalActions;
  Confirm: typeof ConfirmModal;
};

(Modal as ModalComponentType).Actions = ModalActions;
(Modal as ModalComponentType).Confirm = ConfirmModal;

export { ModalActions, ConfirmModal };
export type { ModalActionsProps };
export default Modal as ModalComponentType;
