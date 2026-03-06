import classNames from "classnames";
import React from "react";
import Button, { type ButtonVariant, type ButtonSize, type ButtonColor } from "./Button";
import { type IconSize } from "../types/Icon";
import { useIconRenderer } from "../contexts/IconContext";
import { ThemeSize, type ThemeColor } from "../theme/Theme";
export type TextSize = "xs" | "sm" | "md" | "lg" | "xl";


const iconSizes: Record<IconSize, string> = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const textSizes: Record<TextSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
  xl: "text-2xl",
};


/** Accepts all theme colors. The original five semantic names (neutral/info/success/warning/danger) are preserved unchanged. */
export type EmptyStateTone = ThemeColor;

// ── Color resolution (mirrors Theme.ts) ────────────────────────────────────

const resolveColor = (color: ThemeColor): string => {
  switch (color) {
    case "brand": return "blue";
    case "info": return "sky";
    case "success": return "emerald";
    case "warning": return "amber";
    case "danger": return "rose";
    case "theme": return "neutral";
    case "parallels": return "red";
    default: return color;
  }
};

type ToneConfig = { border: string; text: string; bg: string; icon: string };

// ── Preserved original semantic entries (static strings — Tailwind picks these up directly) ──

const semanticTones: Partial<Record<ThemeColor, ToneConfig>> = {
  neutral: {
    border: "border-slate-300/70 dark:border-slate-700/60",
    text: "text-slate-600 dark:text-slate-300",
    bg: "bg-white/80 dark:bg-slate-900/40",
    icon: "text-slate-400 dark:text-slate-500",
  },
  info: {
    border: "border-blue-300/60 dark:border-blue-500/40",
    text: "text-blue-700 dark:text-blue-200",
    bg: "bg-blue-50/60 dark:bg-blue-950/20",
    icon: "text-blue-500 dark:text-blue-300",
  },
  success: {
    border: "border-emerald-300/60 dark:border-emerald-500/40",
    text: "text-emerald-700 dark:text-emerald-200",
    bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
    icon: "text-emerald-500 dark:text-emerald-300",
  },
  warning: {
    border: "border-amber-300/60 dark:border-amber-500/40",
    text: "text-amber-700 dark:text-amber-200",
    bg: "bg-amber-50/60 dark:bg-amber-950/20",
    icon: "text-amber-500 dark:text-amber-300",
  },
  danger: {
    border: "border-rose-300/60 dark:border-rose-500/40",
    text: "text-rose-700 dark:text-rose-200",
    bg: "bg-rose-50/60 dark:bg-rose-950/20",
    icon: "text-rose-500 dark:text-rose-300",
  },
  parallels: {
    border: "border-red-300/60 dark:border-red-500/40",
    text: "text-red-700 dark:text-red-200",
    bg: "bg-red-50/60 dark:bg-red-950/20",
    icon: "text-red-500 dark:text-red-300",
  },
  brand: {
    border: "border-blue-300/60 dark:border-blue-500/40",
    text: "text-blue-700 dark:text-blue-200",
    bg: "bg-blue-50/60 dark:bg-blue-950/20",
    icon: "text-blue-500 dark:text-blue-300",
  },
  theme: {
    border: "border-slate-300/60 dark:border-slate-500/40",
    text: "text-slate-700 dark:text-slate-200",
    bg: "bg-slate-50/60 dark:bg-slate-950/20",
    icon: "text-slate-500 dark:text-slate-300",
  },
  white: {
    border: "border-slate-300/60 dark:border-slate-500/40",
    text: "text-slate-700 dark:text-slate-200",
    bg: "bg-slate-50/60 dark:bg-slate-950/20",
    icon: "text-slate-500 dark:text-slate-300",
  },
};

const sizes: Record<ThemeSize, string> = {
  xs: "h-[30%] w-[30%]",
  sm: "h-[35%] w-[35%]",
  md: "h-[40%] w-[40%]",
  lg: "h-[45%] w-[45%]",
  xl: "h-[50%] w-[50%]",
  xxl: "h-[55%] w-[55%]",
  xxxl: "h-[60%] w-[60%]",
  full: "h-full w-full",
  "2xl": "h-[65%] w-[65%]",
  "3xl": "h-[70%] w-[70%]",
};

// ── Dynamic builder for all other ThemeColor values ────────────────────────
// Uses only class patterns already declared in tailwind-safelist.ts:
//   border-{c}-200            (border200)
//   dark:border-{c}-500/40    (darkBorder500_40)
//   text-{c}-700              (text700)
//   dark:text-{c}-200         (darkText200)
//   bg-{c}-50/80              (bg50_80)
//   dark:bg-{c}-500/10        (darkBg500_10)
//   text-{c}-500              (text500)
//   dark:text-{c}-300         (darkText300)

function buildToneClasses(color: ThemeColor): ToneConfig {
  if (semanticTones[color]) return semanticTones[color]!;
  if (color === "white" || color === "theme") return semanticTones.neutral!;

  const c = resolveColor(color);
  return {
    border: `border-${c}-200 dark:border-${c}-500/40`,
    text: `text-${c}-700 dark:text-${c}-200`,
    bg: `bg-${c}-50/80 dark:bg-${c}-500/10`,
    icon: `text-${c}-500 dark:text-${c}-300`,
  };
}

// ── Props ───────────────────────────────────────────────────────────────────

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
  actionColor?: ButtonColor;
  icon?: string | React.ReactElement;
  iconSize?: IconSize;
  iconColor?: ThemeColor;
  textSize?: TextSize;
  showIcon?: boolean;
  tone?: EmptyStateTone;
  disableBorder?: boolean;
  fullWidth?: boolean;
  fullHeight?: boolean;
  actionSize?: ButtonSize;
  actionLeadingIcon?: string | React.ReactElement;
  size?: ThemeSize;
}

// ── Component ───────────────────────────────────────────────────────────────

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionVariant = "soft",
  actionColor = "blue",
  icon = "Plus",
  iconSize = "xl",
  iconColor,
  textSize = "md",
  showIcon = true,
  tone = "neutral",
  fullWidth = false,
  fullHeight = false,
  actionSize = "sm",
  size = "md",
  actionLeadingIcon,
  className,
  disableBorder = false,
  ...rest
}) => {
  const renderIcon = useIconRenderer();
  const palette = buildToneClasses(tone);

  // lets make the subtitle text size smaller than the title text size
  const subtitleTextSize = textSize === "xs" ? "xs" : textSize === "sm" ? "xs" : textSize === "md" ? "sm" : textSize === "lg" ? "md" : "lg";
  const iconPallete = !iconColor ? palette : buildToneClasses(iconColor);

  return (
    <section
      className={classNames(
        "flex flex-col items-center justify-center gap-1 rounded-3xl px-6 py-10 text-center transition",
        !disableBorder && "border-2 border-dashed shadow-sm",
        palette.border,
        palette.bg,
        sizes[size],
        fullWidth && "w-full",
        fullHeight && "h-full",
        className
      )}
      {...rest}
    >
      {showIcon && (
        <div className={classNames("p-2 dark:bg-white/5", iconPallete.icon)}>
          {React.isValidElement(icon) ? icon : renderIcon(icon, iconSize, iconSizes[iconSize])}
        </div>
      )}
      <div className="space-y-1">
        <p className={classNames(textSizes[textSize], "font-semibold", palette.text)}>{title}</p>
        {subtitle && <p className={classNames(textSizes[subtitleTextSize], "leading-relaxed break-all", palette.text)}>{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button size={actionSize} variant={actionVariant} color={actionColor} onClick={onAction} leadingIcon={actionLeadingIcon}>
            {actionLabel}
          </Button>
        </div>
      )}
    </section>
  );
};

export default EmptyState;
