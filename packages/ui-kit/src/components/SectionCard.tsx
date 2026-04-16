import React from "react";
import classNames from "classnames";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SectionCardVariant = "glass" | "elevated" | "subtle" | "flat";
export type SectionCardSize = "sm" | "md" | "lg";

export interface SectionCardProps {
  /** Section heading displayed above the content area. */
  title: string;
  titleClassName?: string;
  actions?: React.ReactNode;
  /**
   * Visual treatment of the card container.
   * - `glass`    — frosted glass (default)
   * - `elevated` — white/dark surface with shadow
   * - `subtle`   — very light tinted background, no border
   * - `flat`     — no background or border; title + content only
   */
  variant?: SectionCardVariant;
  /** Body padding size. Defaults to 'md'. */
  size?: SectionCardSize;
  /** Blur the body content (e.g. to indicate unavailable data). */
  blur?: boolean;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
}

// ── Style tokens ──────────────────────────────────────────────────────────────

const variantStyles: Record<SectionCardVariant, string> = {
  glass: [
    "bg-white/95 dark:bg-neutral-900/90",
    "backdrop-blur-xl",
    "border border-neutral-200 dark:border-neutral-800",
    "rounded-xl",
  ].join(" "),
  elevated: [
    "bg-white dark:bg-neutral-900",
    "border border-neutral-200 dark:border-neutral-800",
    "shadow-sm",
    "rounded-xl",
  ].join(" "),
  subtle: ["bg-neutral-50 dark:bg-neutral-800/50", "rounded-xl"].join(" "),
  flat: "",
};

const sizeTokens: Record<SectionCardSize, { header: string; body: string }> = {
  sm: { header: "px-4 pt-2.5 pb-1.5", body: "px-4 pb-3" },
  md: { header: "px-6 pt-3 pb-2", body: "px-6 pb-4" },
  lg: { header: "px-8 pt-4 pb-2", body: "px-8 pb-6" },
};

// ── Component ─────────────────────────────────────────────────────────────────

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  titleClassName,
  actions,
  variant = "glass",
  size = "md",
  blur = false,
  className,
  bodyClassName,
  children,
}) => {
  const { header, body } = sizeTokens[size];

  return (
    <div
      className={classNames(
        "overflow-hidden",
        variantStyles[variant],
        className,
      )}
    >
      {/* Section heading */}
      <div className={header}>
        <div className="flex items-center justify-between">
          <span
            className={classNames(
              "text-[10px] font-semibold uppercase tracking-widest",
              "text-neutral-400 dark:text-neutral-500",
              titleClassName,
            )}
          >
            {title}
          </span>
          {actions && <div>{actions}</div>}
        </div>
      </div>

      {/* Body */}
      <div className={classNames(body, blur && "blur-xs", bodyClassName)}>
        {children}
      </div>
    </div>
  );
};

export default SectionCard;
