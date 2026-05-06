import React, { useRef, useState } from "react";
import classNames from "classnames";

// ── Types ─────────────────────────────────────────────────────────────────────

export type InfoRowSize = "xs" | "sm" | "md" | "lg";

export type InfoRowPadding =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl";

export interface InfoRowProps {
  /** Row label (left side). Accepts ReactNode for composed/styled labels. */
  label: React.ReactNode;
  /**
   * Override label text size independently from `size`.
   * When omitted the shared `size` prop drives label size.
   */
  labelSize?: InfoRowSize;
  /**
   * Extra classes for the label span — use for custom colour, weight, etc.
   * e.g. `labelClassName="text-emerald-600 font-semibold"`
   */
  labelClassName?: string;
  /**
   * Fixed width class for the label column (e.g. `"w-32"`).
   * Defaults to a size-appropriate width (`w-16` / `w-20` / `w-24` / `w-28`).
   * Pass `""` to let the label size naturally.
   */
  labelWidth?: string;
  /**
   * Row value (right side).
   * - `string` / `number` — rendered as text, copy button enabled automatically.
   * - `boolean` — rendered as "Yes" / "No" with copy enabled.
   * - `ReactNode` — rendered as-is, copy button suppressed.
   * - `null` / `undefined` / `''` — treated as empty (see `hideIfEmpty`).
   */
  value?: React.ReactNode;
  /**
   * Override value text size independently from `size`.
   * When omitted the shared `size` prop drives value size.
   */
  valueSize?: InfoRowSize;
  /**
   * Extra classes for the value span — use for custom colour, weight, etc.
   * e.g. `valueClassName="text-sky-500"`
   */
  valueClassName?: string;
  /** Controls both label and value text size when individual overrides are absent. Defaults to `'md'`. */
  size?: InfoRowSize;
  /**
   * Vertical padding override. Accepts the full size scale including `'none'`.
   * When omitted, padding is derived from `size` (xs→py-1, sm→py-1.5, md→py-2, lg→py-2.5).
   */
  padding?: InfoRowPadding;
  /**
   * Show a copy-to-clipboard button.
   * Defaults to `true` — shown automatically when the resolved value is a string or number.
   * Pass `false` to suppress the button entirely.
   */
  copyable?: boolean;
  /**
   * Render the value in a monospace font.
   * Shorthand for `valueClassName="font-mono"`.
   */
  mono?: boolean;
  /**
   * Hide the row entirely when `value` is `null`, `undefined`, or `''`.
   * Defaults to `true`. Set to `false` to show the `emptyText` placeholder instead.
   */
  hideIfEmpty?: boolean;
  /**
   * Placeholder text shown when `hideIfEmpty` is `false` and the value is empty.
   * Defaults to `'—'`.
   */
  emptyText?: string;
  /**
   * Allow the value to wrap to multiple lines instead of truncating.
   * Defaults to `false`.
   */
  wrap?: boolean;
  /**
   * Show a tooltip with the full value when the text is truncated.
   * Only active when `wrap` is `false` and the value is a string or number.
   * Defaults to `true`.
   */
  tooltipOnTruncate?: boolean;
  /** Remove the bottom border (e.g. for the last row when handled externally). */
  noBorder?: boolean;
  /**
   * Remove the default horizontal padding (`px-3`/`px-4`).
   * Useful when the parent already provides horizontal spacing.
   */
  noPadding?: boolean;
  /**
   * Add a subtle hover background and rounded corners (matches classic detail-panel row style).
   * Defaults to `false`.
   */
  hoverable?: boolean;
  className?: string;
}

// ── Size tokens ───────────────────────────────────────────────────────────────

type SizeToken = {
  defaultPadding: string;
  horizontalPadding: string;
  defaultLabelWidth: string;
  text: string;
};

const sizeTokens: Record<InfoRowSize, SizeToken> = {
  xs: {
    defaultPadding: "py-1",
    horizontalPadding: "px-3",
    defaultLabelWidth: "w-16",
    text: "text-[10px]",
  },
  sm: {
    defaultPadding: "py-1.5",
    horizontalPadding: "px-3",
    defaultLabelWidth: "w-20",
    text: "text-xs",
  },
  md: {
    defaultPadding: "py-2",
    horizontalPadding: "px-4",
    defaultLabelWidth: "w-24",
    text: "text-sm",
  },
  lg: {
    defaultPadding: "py-2.5",
    horizontalPadding: "px-4",
    defaultLabelWidth: "w-28",
    text: "text-base",
  },
};

// ── Padding tokens ────────────────────────────────────────────────────────────

const paddingTokens: Record<InfoRowPadding, string> = {
  none: "py-0",
  xs: "py-0.5",
  sm: "py-1.5",
  md: "py-2",
  lg: "py-2.5",
  xl: "py-4",
  "2xl": "py-5",
  "3xl": "py-6",
};

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ── Value normalisation ───────────────────────────────────────────────────────

type NormalisedValue = {
  display: React.ReactNode;
  copyText: string | null;
  isEmpty: boolean;
};

function normaliseValue(value: React.ReactNode): NormalisedValue {
  if (value === undefined || value === null || value === "") {
    return { display: null, copyText: null, isEmpty: true };
  }
  if (typeof value === "boolean") {
    const text = value ? "Yes" : "No";
    return { display: text, copyText: text, isEmpty: false };
  }
  if (typeof value === "string" || typeof value === "number") {
    return { display: value, copyText: String(value), isEmpty: false };
  }
  return { display: value, copyText: null, isEmpty: false };
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

const ValueTooltip: React.FC<{ text: string }> = ({ text }) => (
  <div
    role="tooltip"
    className={classNames(
      "pointer-events-none absolute bottom-full right-0 z-50 mb-1.5",
      "max-w-xs break-all rounded-md px-2.5 py-1.5",
      "bg-neutral-900 dark:bg-neutral-700 text-white text-xs leading-snug",
      "shadow-lg",
      // fade-in
      "animate-[fadeIn_120ms_ease-out]",
    )}
  >
    {text}
    {/* arrow */}
    <span
      className={classNames(
        "absolute top-full right-3",
        "border-4 border-transparent border-t-neutral-900 dark:border-t-neutral-700",
      )}
    />
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

export const InfoRow: React.FC<InfoRowProps> = ({
  label,
  labelSize,
  labelClassName,
  labelWidth,
  value,
  valueSize,
  valueClassName,
  size = "md",
  padding,
  copyable = true,
  mono = false,
  hideIfEmpty = true,
  emptyText = "—",
  wrap = false,
  tooltipOnTruncate = true,
  noBorder = false,
  noPadding = false,
  hoverable = false,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const [tooltipVisible, setTooltip] = useState(false);
  const valueRef = useRef<HTMLSpanElement>(null);

  const { display, copyText, isEmpty } = normaliseValue(value);

  if (isEmpty && hideIfEmpty) return null;

  const tokens = sizeTokens[size];
  const labelTokens = sizeTokens[labelSize ?? size];
  const valueTokens = sizeTokens[valueSize ?? size];
  const rowPadding =
    padding !== undefined ? paddingTokens[padding] : tokens.defaultPadding;
  const showCopy = copyable && copyText !== null && !isEmpty;
  const canTooltip = tooltipOnTruncate && !wrap && copyText !== null;
  // Smart layout: label caps at 30% of row width, value gets the rest.
  // Falls back to fixed-width flex when an explicit labelWidth is provided.
  const useSmartLayout = labelWidth === undefined;

  const handleCopy = () => {
    if (!copyText || copied) return;
    void navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  const handleMouseEnter = () => {
    if (!canTooltip || !valueRef.current) return;
    if (valueRef.current.scrollWidth > valueRef.current.offsetWidth) {
      setTooltip(true);
    }
  };

  const handleMouseLeave = () => setTooltip(false);

  return (
    <div
      className={classNames(
        "group flex items-center gap-3 transition-colors duration-300",
        rowPadding,
        !noPadding && tokens.horizontalPadding,
        hoverable && "rounded-md mx-1",
        hoverable &&
          !copied &&
          "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
        !noBorder &&
          !hoverable &&
          "border-b border-neutral-100 dark:border-neutral-800 last:border-0",
        copied && "bg-emerald-50/60 dark:bg-emerald-950/20",
        copied && hoverable && "animate-copied-flash",
        className,
      )}
    >
      {/* Label — natural content width, capped at 30%; fixed width when labelWidth is explicit */}
      <span
        className={classNames(
          labelTokens.text,
          "text-neutral-500 dark:text-neutral-400",
          useSmartLayout
            ? "shrink-0 min-w-0 truncate"
            : `grow shrink-0 ${labelWidth ?? tokens.defaultLabelWidth}`,
          labelClassName,
        )}
        style={useSmartLayout ? { maxWidth: "30%" } : undefined}
      >
        {label}
      </span>

      {/* Value + copy button — fills remaining space */}
      <div
        className="relative flex flex-1 items-center justify-end gap-1 min-w-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span
          ref={valueRef}
          className={classNames(
            valueTokens.text,
            "font-medium",
            wrap ? "wrap-break-word whitespace-normal text-right" : "truncate",
            isEmpty
              ? "text-neutral-400 dark:text-neutral-600"
              : "text-neutral-800 dark:text-neutral-200",
            mono && "font-mono",
            valueClassName,
          )}
        >
          {isEmpty ? emptyText : display}
        </span>

        {tooltipVisible && copyText && <ValueTooltip text={copyText} />}

        {showCopy && (
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy to clipboard"}
            aria-label={copied ? "Copied!" : "Copy to clipboard"}
            className={classNames(
              "shrink-0 rounded-md p-1 transition-all duration-200",
              copied
                ? [
                    "opacity-100 scale-110",
                    "text-emerald-500 dark:text-emerald-400",
                    "bg-emerald-100 dark:bg-emerald-950/40",
                  ]
                : [
                    "opacity-0 translate-x-1",
                    "group-hover:opacity-100 group-hover:translate-x-0",
                    "text-neutral-400 dark:text-neutral-500",
                    "hover:text-neutral-600 dark:hover:text-neutral-300",
                    "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  ],
            )}
          >
            <span
              className={classNames(
                "block transition-all duration-200",
                copied ? "scale-110" : "scale-100",
              )}
            >
              {copied ? (
                <CheckIcon className="h-3.5 w-3.5" />
              ) : (
                <CopyIcon className="h-3.5 w-3.5" />
              )}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default InfoRow;
