import classNames from "classnames";
import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Loader,
  IconButton,
  Button,
  type ButtonProps,
  type ButtonVariant,
  type ButtonColor,
} from ".";
import type { ModalSize } from "../theme";
import { type IconName } from "../icons/registry";
import { renderIcon } from "../utils/renderIcon";

// ── Size presets (mirrors Modal) ──────────────────────────────────────────────

const sizePresets: Record<ModalSize, { className: string; maxWidth?: string }> =
  {
    xs: { maxWidth: "320px", className: "max-w-[320px]" },
    sm: { maxWidth: "400px", className: "max-w-[400px]" },
    md: { maxWidth: "600px", className: "max-w-[600px]" },
    lg: { maxWidth: "800px", className: "max-w-[800px]" },
    xl: { maxWidth: "1000px", className: "max-w-[1000px]" },
    xxl: { maxWidth: "1120px", className: "max-w-[1120px]" },
    "2xl": { maxWidth: "1120px", className: "max-w-[1120px]" },
    xxxl: { maxWidth: "1280px", className: "max-w-[1280px]" },
    "3xl": { maxWidth: "1280px", className: "max-w-[1280px]" },
    full: { className: "w-full max-w-none" },
  };

// ── Types ─────────────────────────────────────────────────────────────────────

/** Where the panel is anchored inside its positioned ancestor. */
export type InlinePanelAnchor = "top" | "bottom" | "center" | "fill";

export interface InlinePanelProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  // ── Visibility ──────────────────────────────────────────────────────────
  isOpen: boolean;
  onClose: () => void;

  // ── Content ─────────────────────────────────────────────────────────────
  title: ReactNode;
  description?: ReactNode;
  /** Icon name string or a React element rendered in the header. */
  icon?: IconName | React.ReactElement;
  children: ReactNode;
  bodyHeader?: ReactNode;
  bodyClassName?: string;
  /** Slot rendered in the footer bar (use alongside actions). */
  footer?: ReactNode;
  /** Alias for footer — matches Modal API. */
  actions?: ReactNode;

  // ── Sizing (ignored when anchor="fill") ─────────────────────────────────
  /**
   * Width preset for the content card. Only meaningful when anchor is
   * "top" or "bottom". Ignored for "fill". Default: "md".
   */
  size?: ModalSize;
  maxWidth?: number | string;
  minWidth?: number | string;
  height?: number | string;
  maxHeight?: number | string;
  minHeight?: number | string;

  // ── Positioning ──────────────────────────────────────────────────────────
  /**
   * "fill"   — covers the entire parent (absolute inset-0).
   * "top"    — slides in from the top edge.
   * "bottom" — slides up from the bottom edge.
   *
   * The parent element MUST have `position: relative` (or any non-static
   * position) for the overlay to clip correctly.
   *
   * @default "fill"
   */
  anchor?: InlinePanelAnchor;
  /** z-index of the panel relative to its positioned parent. @default 20 */
  zIndex?: number;

  // ── Behaviour ────────────────────────────────────────────────────────────
  /** Press Escape to close. @default true */
  closeOnEsc?: boolean;
  /**
   * Click the backdrop behind the panel card to close.
   * Only relevant when anchor is "top" or "bottom".
   * @default false  (more conservative than Modal — inline forms are higher-risk to dismiss accidentally)
   */
  closeOnBackdropClick?: boolean;
  /** Show a semi-transparent backdrop behind the card (top/bottom only). @default false */
  showBackdrop?: boolean;

  // ── Loading ──────────────────────────────────────────────────────────────
  loading?: boolean;
  loadingTitle?: ReactNode;
  loadingLabel?: ReactNode;

  // ── Header extras ────────────────────────────────────────────────────────
  headerActions?: ButtonProps[];
  onBack?: () => void;
  backTooltip?: string;
  hideCloseButton?: boolean;
  showFooterDivider?: boolean;

  // ── Focus ────────────────────────────────────────────────────────────────
  /** Ref to the element that should receive focus when the panel opens. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;

  // ── ARIA ─────────────────────────────────────────────────────────────────
  ariaLabel?: string;
  role?: "dialog" | "alertdialog";
}

// ── InlinePanel ───────────────────────────────────────────────────────────────

const InlinePanel: React.FC<InlinePanelProps> = ({
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
  height,
  maxHeight,
  minHeight,
  anchor = "fill",
  zIndex = 20,
  closeOnEsc = true,
  closeOnBackdropClick = false,
  showBackdrop = false,
  loading,
  loadingTitle,
  loadingLabel,
  headerActions = [],
  onBack,
  backTooltip = "Go back",
  hideCloseButton = false,
  showFooterDivider,
  initialFocusRef,
  ariaLabel,
  role = "dialog",
  className,
  style,
  ...rest
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const prevOpenRef = useRef(isOpen);

  const headingId = useId();
  const bodyId = useId();

  // ── Mount / unmount with animation ───────────────────────────────────────

  const [mounted, setMounted] = useState(isOpen);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setMounted(true);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      // Only act on the shell itself, not on child element transitions
      if (e.target !== e.currentTarget) return;
      if (!isOpen) setMounted(false);
    },
    [isOpen],
  );

  // ── Focus management ─────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current =
        document.activeElement as HTMLElement | null;
      const focusTarget =
        initialFocusRef?.current ??
        (!hideCloseButton ? closeButtonRef.current : null) ??
        contentRef.current;
      const frame = requestAnimationFrame(() =>
        focusTarget?.focus({ preventScroll: true }),
      );
      return () => cancelAnimationFrame(frame);
    }
  }, [isOpen, hideCloseButton, initialFocusRef]);

  useEffect(() => {
    if (!isOpen && previouslyFocusedRef.current) {
      const node = previouslyFocusedRef.current;
      previouslyFocusedRef.current = null;
      node.focus({ preventScroll: true });
    }
  }, [isOpen]);

  // ── Escape key ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const handler = (e: KeyboardEvent) => {
      // Don't steal Escape from a nested Modal (which calls preventDefault)
      if (e.key === "Escape" && !e.defaultPrevented) {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, closeOnEsc, onClose]);

  // ── Dev-mode parent-positioning check ────────────────────────────────────

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && isOpen && contentRef.current) {
      const parent = contentRef.current.parentElement;
      if (parent) {
        const { position } = getComputedStyle(parent);
        if (position === "static") {
          console.warn(
            "[InlinePanel] The parent element has `position: static`. " +
              "Add `position: relative` (or any non-static position) so the " +
              "panel clips to the intended container.",
          );
        }
      }
    }
  }, [isOpen]);

  // ── Shell position classes ────────────────────────────────────────────────

  const shellPositionClass = useMemo(() => {
    switch (anchor) {
      case "top":
        return "absolute top-0 inset-x-0 flex justify-center items-start";
      case "bottom":
        return "absolute bottom-0 inset-x-0 flex justify-center items-end";
      case "center":
        return "absolute inset-0 flex justify-center items-center";
      case "fill":
      default:
        return "absolute inset-0";
    }
  }, [anchor]);

  // ── Transition classes ────────────────────────────────────────────────────

  const transitionBase =
    "transition-[transform,opacity,scale] duration-200 ease-out";

  const shellTransitionClass = useMemo(() => {
    if (anchor === "fill") {
      return isOpen ? "opacity-100" : "opacity-0 pointer-events-none";
    }
    if (anchor === "top") {
      return isOpen
        ? "translate-y-0 opacity-100"
        : "-translate-y-full opacity-0 pointer-events-none";
    }
    if (anchor === "bottom") {
      return isOpen
        ? "translate-y-0 opacity-100"
        : "translate-y-full opacity-0 pointer-events-none";
    }
    // center
    return isOpen
      ? "scale-100 opacity-100"
      : "scale-95 opacity-0 pointer-events-none";
  }, [anchor, isOpen]);

  // ── Content card sizing (ignored for fill) ────────────────────────────────

  const preset = sizePresets[size] ?? sizePresets.md;
  const isFill = anchor === "fill";
  const isCenter = anchor === "center";

  const cardSizeClass = isFill ? "w-full h-full" : preset.className;

  const cardStyle: React.CSSProperties = {
    ...(maxWidth !== undefined
      ? { maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth }
      : !isFill
        ? { maxWidth: preset.maxWidth }
        : undefined),
    ...(minWidth !== undefined
      ? { minWidth: typeof minWidth === "number" ? `${minWidth}px` : minWidth }
      : undefined),
    ...(height !== undefined
      ? { height: typeof height === "number" ? `${height}px` : height }
      : undefined),
    ...(maxHeight !== undefined
      ? {
          maxHeight:
            typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
        }
      : undefined),
    ...(minHeight !== undefined
      ? {
          minHeight:
            typeof minHeight === "number" ? `${minHeight}px` : minHeight,
        }
      : undefined),
    ...style,
  };

  const footerContent = footer ?? actions;
  const showFooterDividerClass = showFooterDivider
    ? "border-t border-neutral-200/70 dark:border-neutral-700/60"
    : "";

  const ariaLabelValue =
    ariaLabel ?? (typeof title === "string" ? title : undefined);
  const ariaLabelledBy = ariaLabelValue ? undefined : headingId;
  const ariaDescribedBy = description || bodyHeader ? bodyId : undefined;

  if (!mounted) return null;

  return (
    // ── Positioning shell ──────────────────────────────────────────────────
    <div
      className={classNames(
        shellPositionClass,
        transitionBase,
        shellTransitionClass,
      )}
      style={{ zIndex }}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* Optional backdrop for top/bottom/center anchors */}
      {!isFill && showBackdrop && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm"
          onMouseDown={closeOnBackdropClick ? onClose : undefined}
        />
      )}

      {/* ── Content card ──────────────────────────────────────────────── */}
      <div
        ref={contentRef}
        className={classNames(
          "relative flex flex-col overflow-hidden border border-neutral-200/70 bg-white shadow-2xl dark:border-neutral-700/60 dark:bg-neutral-800",
          isFill
            ? "rounded-[inherit] w-full h-full"
            : isCenter
              ? "rounded-[28px] w-full mx-4"
              : "rounded-[28px] w-full",
          cardSizeClass,
          "focus-visible:outline-none",
          className,
        )}
        style={cardStyle}
        role={role}
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabelValue}
        aria-describedby={ariaDescribedBy}
        aria-busy={loading ? "true" : undefined}
        tabIndex={-1}
        {...rest}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-200/70 pl-4 pr-3 py-4 dark:border-neutral-700/60">
          {onBack && (
            <div className="flex shrink-0 items-center self-center">
              <IconButton
                icon="ArrowChevronLeft"
                variant="ghost"
                color="slate"
                size="sm"
                tooltip={backTooltip}
                tooltipPosition="bottom"
                aria-label={backTooltip}
                onClick={onBack}
              />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-3">
              {icon && (
                <div className="flex shrink-0 items-center justify-center text-neutral-600 dark:text-neutral-200">
                  {renderIcon(icon, "sm")}
                </div>
              )}
              <div className="min-w-0">
                <h2
                  id={headingId}
                  className="truncate text-xl font-medium tracking-tight text-neutral-900 dark:text-neutral-100"
                >
                  {title}
                </h2>
              </div>
            </div>
            {description && (
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                {description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerActions.map((action, i) => (
              <Button key={`inline-panel-action-${i}`} {...action} />
            ))}
            {!hideCloseButton && (
              <IconButton
                ref={closeButtonRef}
                icon="Close"
                variant="ghost"
                color="slate"
                size="sm"
                aria-label="Close"
                onClick={onClose}
              />
            )}
          </div>
        </div>

        {/* ── Body header ─────────────────────────────────────────────── */}
        {bodyHeader && (
          <div
            id={bodyId}
            className="shrink-0 border-b border-neutral-200/70 bg-neutral-50 px-6 py-3 dark:border-neutral-700/60 dark:bg-neutral-800/60"
          >
            {bodyHeader}
          </div>
        )}

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="relative flex flex-1 min-h-0 overflow-hidden bg-neutral-50 dark:bg-neutral-800/60">
          {loading && (
            <Loader
              overlay
              title={loadingTitle}
              label={loadingLabel}
              className="z-30"
            />
          )}
          <div
            id={bodyHeader ? undefined : bodyId}
            className={classNames(
              "relative flex-1 min-h-0 overflow-y-auto px-6 py-5",
              "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-200 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700",
              bodyClassName,
              loading && "pointer-events-none",
            )}
          >
            <div className="flex flex-col gap-4">{children}</div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        {footerContent && (
          <div
            className={classNames(
              "flex shrink-0 items-center justify-end gap-3 bg-neutral-50 px-6 py-4 dark:bg-neutral-800/60",
              showFooterDividerClass,
            )}
          >
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
};

InlinePanel.displayName = "InlinePanel";

// ── ConfirmInlinePanel ────────────────────────────────────────────────────────

export interface ConfirmInlinePanelProps
  extends Omit<InlinePanelProps, "actions" | "footer" | "role" | "children"> {
  children?: ReactNode;
  onConfirm: () => void;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  confirmVariant?: ButtonVariant;
  confirmColor?: ButtonColor;
  isConfirmDisabled?: boolean;
}

export const ConfirmInlinePanel: React.FC<ConfirmInlinePanelProps> = ({
  onConfirm,
  onClose,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "solid",
  confirmColor = "blue",
  isConfirmDisabled = false,
  anchor = "center",
  showBackdrop = true,
  size = "sm",
  children,
  ...props
}) => (
  <InlinePanel
    {...props}
    anchor={anchor}
    showBackdrop={showBackdrop}
    size={size}
    onClose={onClose}
    role="alertdialog"
    actions={
      <>
        <Button variant="soft" color="slate" size="sm" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant={confirmVariant}
          color={confirmColor}
          size="sm"
          disabled={isConfirmDisabled}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </>
    }
  >
    {children ?? null}
  </InlinePanel>
);

ConfirmInlinePanel.displayName = "ConfirmInlinePanel";

// ── DeleteConfirmInlinePanel ──────────────────────────────────────────────────

export interface DeleteConfirmInlinePanelProps
  extends Omit<
    ConfirmInlinePanelProps,
    "confirmLabel" | "confirmVariant" | "confirmColor"
  > {
  /** The exact string the user must type to enable the delete button. */
  confirmValue: string;
  /** Human-readable label shown in the instruction, e.g. "snapshot name". @default "name" */
  confirmValueLabel?: string;
  confirmLabel?: ReactNode;
}

export const DeleteConfirmInlinePanel: React.FC<
  DeleteConfirmInlinePanelProps
> = ({
  confirmValue,
  confirmValueLabel = "name",
  confirmLabel = "Delete",
  onConfirm,
  onClose,
  isConfirmDisabled,
  children,
  cancelLabel = "Cancel",
  ...props
}) => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isMatch = inputValue === confirmValue;

  useEffect(() => {
    if (!props.isOpen) setInputValue("");
  }, [props.isOpen]);

  return (
    <ConfirmInlinePanel
      {...props}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      confirmVariant="solid"
      confirmColor="danger"
      isConfirmDisabled={!isMatch || isConfirmDisabled}
      initialFocusRef={inputRef}
    >
      {children}
      <div className="flex flex-col gap-2 pt-1">
        <label className="text-sm text-neutral-600 dark:text-neutral-400">
          Type the {confirmValueLabel}{" "}
          <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
            {confirmValue}
          </span>{" "}
          to confirm:
        </label>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && isMatch && !isConfirmDisabled) onConfirm();
          }}
          placeholder={confirmValue}
          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-mono text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/30"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </ConfirmInlinePanel>
  );
};

DeleteConfirmInlinePanel.displayName = "DeleteConfirmInlinePanel";

export { InlinePanel };
export default InlinePanel;
