import React, { useId } from "react";
import classNames from "classnames";
import type { ThemeColor } from "../theme/Theme";
import { useIconRenderer } from "../contexts/IconContext";
import type { IconSize } from "../types/Icon";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonSelectorMode = "single" | "multi";

export interface ButtonSelectorOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  /** Icon name (string from icon registry) or a ReactElement */
  icon?: string | React.ReactElement;
  disabled?: boolean;
}

export interface ButtonSelectorProps<T extends string = string> {
  options: ButtonSelectorOption<T>[];
  /** In single mode: a single value. In multi mode: an array of values. */
  value: T | T[];
  onChange: (value: T | T[]) => void;
  /** "single" enforces radio-like behaviour; "multi" allows multiple selections (default). */
  mode?: ButtonSelectorMode;
  color?: ThemeColor;
  /** Number of grid columns (default: 2) */
  cols?: 1 | 2 | 3 | 4;
  /** Tailwind gap class applied to the grid (default: "gap-2") */
  gap?: string;
  /** Optional label rendered above the grid */
  label?: string;
  /** Icon size passed to the icon renderer (default: "sm") */
  iconSize?: IconSize;
  className?: string;
  disabled?: boolean;
}

// ─── Selected-state color tokens ───────────────────────────────────────────────
// Defined as a static literal map so Tailwind's scanner can detect every class.

type SelectedTokens = {
  border: string;
  bg: string;
  icon: string;
  label: string;
  indicatorBg: string;
  indicatorBorder: string;
};

const COLOR_TOKENS: Record<ThemeColor, SelectedTokens> = {
  red:      { border: "border-red-400 dark:border-red-500",         bg: "bg-red-50 dark:bg-red-500/10",         icon: "text-red-600 dark:text-red-400",         label: "text-red-700 dark:text-red-300",         indicatorBg: "bg-red-500",     indicatorBorder: "border-red-500" },
  orange:   { border: "border-orange-400 dark:border-orange-500",   bg: "bg-orange-50 dark:bg-orange-500/10",   icon: "text-orange-600 dark:text-orange-400",   label: "text-orange-700 dark:text-orange-300",   indicatorBg: "bg-orange-500",  indicatorBorder: "border-orange-500" },
  amber:    { border: "border-amber-400 dark:border-amber-500",     bg: "bg-amber-50 dark:bg-amber-500/10",     icon: "text-amber-600 dark:text-amber-400",     label: "text-amber-700 dark:text-amber-300",     indicatorBg: "bg-amber-500",   indicatorBorder: "border-amber-500" },
  yellow:   { border: "border-yellow-400 dark:border-yellow-500",   bg: "bg-yellow-50 dark:bg-yellow-500/10",   icon: "text-yellow-600 dark:text-yellow-400",   label: "text-yellow-700 dark:text-yellow-300",   indicatorBg: "bg-yellow-500",  indicatorBorder: "border-yellow-500" },
  lime:     { border: "border-lime-400 dark:border-lime-500",       bg: "bg-lime-50 dark:bg-lime-500/10",       icon: "text-lime-600 dark:text-lime-400",       label: "text-lime-700 dark:text-lime-300",       indicatorBg: "bg-lime-500",    indicatorBorder: "border-lime-500" },
  green:    { border: "border-green-400 dark:border-green-500",     bg: "bg-green-50 dark:bg-green-500/10",     icon: "text-green-600 dark:text-green-400",     label: "text-green-700 dark:text-green-300",     indicatorBg: "bg-green-500",   indicatorBorder: "border-green-500" },
  emerald:  { border: "border-emerald-400 dark:border-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "text-emerald-600 dark:text-emerald-400", label: "text-emerald-700 dark:text-emerald-300", indicatorBg: "bg-emerald-500", indicatorBorder: "border-emerald-500" },
  teal:     { border: "border-teal-400 dark:border-teal-500",       bg: "bg-teal-50 dark:bg-teal-500/10",       icon: "text-teal-600 dark:text-teal-400",       label: "text-teal-700 dark:text-teal-300",       indicatorBg: "bg-teal-500",    indicatorBorder: "border-teal-500" },
  cyan:     { border: "border-cyan-400 dark:border-cyan-500",       bg: "bg-cyan-50 dark:bg-cyan-500/10",       icon: "text-cyan-600 dark:text-cyan-400",       label: "text-cyan-700 dark:text-cyan-300",       indicatorBg: "bg-cyan-500",    indicatorBorder: "border-cyan-500" },
  sky:      { border: "border-sky-400 dark:border-sky-500",         bg: "bg-sky-50 dark:bg-sky-500/10",         icon: "text-sky-600 dark:text-sky-400",         label: "text-sky-700 dark:text-sky-300",         indicatorBg: "bg-sky-500",     indicatorBorder: "border-sky-500" },
  blue:     { border: "border-blue-400 dark:border-blue-500",       bg: "bg-blue-50 dark:bg-blue-500/10",       icon: "text-blue-600 dark:text-blue-400",       label: "text-blue-700 dark:text-blue-300",       indicatorBg: "bg-blue-500",    indicatorBorder: "border-blue-500" },
  indigo:   { border: "border-indigo-400 dark:border-indigo-500",   bg: "bg-indigo-50 dark:bg-indigo-500/10",   icon: "text-indigo-600 dark:text-indigo-400",   label: "text-indigo-700 dark:text-indigo-300",   indicatorBg: "bg-indigo-500",  indicatorBorder: "border-indigo-500" },
  violet:   { border: "border-violet-400 dark:border-violet-500",   bg: "bg-violet-50 dark:bg-violet-500/10",   icon: "text-violet-600 dark:text-violet-400",   label: "text-violet-700 dark:text-violet-300",   indicatorBg: "bg-violet-500",  indicatorBorder: "border-violet-500" },
  purple:   { border: "border-purple-400 dark:border-purple-500",   bg: "bg-purple-50 dark:bg-purple-500/10",   icon: "text-purple-600 dark:text-purple-400",   label: "text-purple-700 dark:text-purple-300",   indicatorBg: "bg-purple-500",  indicatorBorder: "border-purple-500" },
  fuchsia:  { border: "border-fuchsia-400 dark:border-fuchsia-500", bg: "bg-fuchsia-50 dark:bg-fuchsia-500/10", icon: "text-fuchsia-600 dark:text-fuchsia-400", label: "text-fuchsia-700 dark:text-fuchsia-300", indicatorBg: "bg-fuchsia-500", indicatorBorder: "border-fuchsia-500" },
  pink:     { border: "border-pink-400 dark:border-pink-500",       bg: "bg-pink-50 dark:bg-pink-500/10",       icon: "text-pink-600 dark:text-pink-400",       label: "text-pink-700 dark:text-pink-300",       indicatorBg: "bg-pink-500",    indicatorBorder: "border-pink-500" },
  rose:     { border: "border-rose-400 dark:border-rose-500",       bg: "bg-rose-50 dark:bg-rose-500/10",       icon: "text-rose-600 dark:text-rose-400",       label: "text-rose-700 dark:text-rose-300",       indicatorBg: "bg-rose-500",    indicatorBorder: "border-rose-500" },
  slate:    { border: "border-slate-400 dark:border-slate-500",     bg: "bg-slate-50 dark:bg-slate-500/10",     icon: "text-slate-600 dark:text-slate-400",     label: "text-slate-700 dark:text-slate-300",     indicatorBg: "bg-slate-500",   indicatorBorder: "border-slate-500" },
  gray:     { border: "border-gray-400 dark:border-gray-500",       bg: "bg-gray-50 dark:bg-gray-500/10",       icon: "text-gray-600 dark:text-gray-400",       label: "text-gray-700 dark:text-gray-300",       indicatorBg: "bg-gray-500",    indicatorBorder: "border-gray-500" },
  zinc:     { border: "border-zinc-400 dark:border-zinc-500",       bg: "bg-zinc-50 dark:bg-zinc-500/10",       icon: "text-zinc-600 dark:text-zinc-400",       label: "text-zinc-700 dark:text-zinc-300",       indicatorBg: "bg-zinc-500",    indicatorBorder: "border-zinc-500" },
  neutral:  { border: "border-neutral-400 dark:border-neutral-500", bg: "bg-neutral-50 dark:bg-neutral-500/10", icon: "text-neutral-600 dark:text-neutral-400", label: "text-neutral-700 dark:text-neutral-300", indicatorBg: "bg-neutral-500", indicatorBorder: "border-neutral-500" },
  stone:    { border: "border-stone-400 dark:border-stone-500",     bg: "bg-stone-50 dark:bg-stone-500/10",     icon: "text-stone-600 dark:text-stone-400",     label: "text-stone-700 dark:text-stone-300",     indicatorBg: "bg-stone-500",   indicatorBorder: "border-stone-500" },
  // Semantic aliases
  white:      { border: "border-neutral-400 dark:border-neutral-400", bg: "bg-neutral-100 dark:bg-neutral-500/10", icon: "text-neutral-700 dark:text-neutral-300", label: "text-neutral-800 dark:text-neutral-200", indicatorBg: "bg-neutral-600", indicatorBorder: "border-neutral-600" },
  brand:      { border: "border-blue-400 dark:border-blue-500",       bg: "bg-blue-50 dark:bg-blue-500/10",       icon: "text-blue-600 dark:text-blue-400",       label: "text-blue-700 dark:text-blue-300",       indicatorBg: "bg-blue-500",    indicatorBorder: "border-blue-500" },
  info:       { border: "border-sky-400 dark:border-sky-500",         bg: "bg-sky-50 dark:bg-sky-500/10",         icon: "text-sky-600 dark:text-sky-400",         label: "text-sky-700 dark:text-sky-300",         indicatorBg: "bg-sky-500",     indicatorBorder: "border-sky-500" },
  success:    { border: "border-emerald-400 dark:border-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "text-emerald-600 dark:text-emerald-400", label: "text-emerald-700 dark:text-emerald-300", indicatorBg: "bg-emerald-500", indicatorBorder: "border-emerald-500" },
  warning:    { border: "border-amber-400 dark:border-amber-500",     bg: "bg-amber-50 dark:bg-amber-500/10",     icon: "text-amber-600 dark:text-amber-400",     label: "text-amber-700 dark:text-amber-300",     indicatorBg: "bg-amber-500",   indicatorBorder: "border-amber-500" },
  danger:     { border: "border-rose-400 dark:border-rose-500",       bg: "bg-rose-50 dark:bg-rose-500/10",       icon: "text-rose-600 dark:text-rose-400",       label: "text-rose-700 dark:text-rose-300",       indicatorBg: "bg-rose-500",    indicatorBorder: "border-rose-500" },
  theme:      { border: "border-neutral-400 dark:border-neutral-400", bg: "bg-neutral-100 dark:bg-neutral-500/10", icon: "text-neutral-700 dark:text-neutral-300", label: "text-neutral-800 dark:text-neutral-200", indicatorBg: "bg-neutral-600", indicatorBorder: "border-neutral-600" },
  parallels:  { border: "border-red-400 dark:border-red-500",         bg: "bg-red-50 dark:bg-red-500/10",         icon: "text-red-600 dark:text-red-400",         label: "text-red-700 dark:text-red-300",         indicatorBg: "bg-red-500",     indicatorBorder: "border-red-500" },
};

// ─── Grid cols map ─────────────────────────────────────────────────────────────

const colsClass: Record<1 | 2 | 3 | 4, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ButtonSelector<T extends string = string>(props: ButtonSelectorProps<T>): React.ReactElement {
  const {
    options,
    value,
    onChange,
    mode = "multi",
    color = "blue",
    cols = 2,
    gap = "gap-2",
    label,
    iconSize = "sm",
    className,
    disabled = false,
  } = props;

  const renderIcon = useIconRenderer();
  const labelId = useId();
  const tokens = COLOR_TOKENS[color] ?? COLOR_TOKENS.blue;

  const isSelected = (v: T): boolean =>
    Array.isArray(value) ? value.includes(v) : value === v;

  const handleClick = (v: T, itemDisabled: boolean) => {
    if (disabled || itemDisabled) return;
    if (mode === "single") {
      onChange(v);
    } else {
      const arr = Array.isArray(value) ? value : value ? [value] : [];
      onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    }
  };

  return (
    <div className={classNames("flex flex-col", className)}>
      {label && (
        <p
          id={labelId}
          className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
        >
          {label}
        </p>
      )}

      <div
        className={classNames("grid", colsClass[cols], gap)}
        role={mode === "single" ? "radiogroup" : "group"}
        aria-labelledby={label ? labelId : undefined}
      >
        {options.map((opt) => {
          const selected = isSelected(opt.value);
          const itemDisabled = disabled || !!opt.disabled;

          return (
            <button
              key={opt.value}
              type="button"
              role={mode === "single" ? "radio" : "checkbox"}
              aria-checked={selected}
              disabled={itemDisabled}
              onClick={() => handleClick(opt.value, !!opt.disabled)}
              className={classNames(
                "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors duration-150",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                itemDisabled && "cursor-not-allowed opacity-60",
                selected
                  ? [tokens.border, tokens.bg]
                  : "border-neutral-200/70 bg-white dark:border-neutral-700/60 dark:bg-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-600"
              )}
            >
              {/* Icon */}
              {opt.icon && (
                <span
                  className={classNames(
                    "shrink-0",
                    selected
                      ? tokens.icon
                      : "text-neutral-400 dark:text-neutral-500"
                  )}
                >
                  {renderIcon(opt.icon, iconSize)}
                </span>
              )}

              {/* Label + description */}
              <div className="min-w-0 flex-1">
                <p
                  className={classNames(
                    "truncate text-xs font-semibold leading-tight",
                    selected
                      ? tokens.label
                      : "text-neutral-700 dark:text-neutral-200"
                  )}
                >
                  {opt.label}
                </p>
                {opt.description && (
                  <p className="truncate text-[10px] leading-tight text-neutral-400 dark:text-neutral-500">
                    {opt.description}
                  </p>
                )}
              </div>

              {/* Indicator (checkbox / radio dot) */}
              <div
                className={classNames(
                  "ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                  selected
                    ? [tokens.indicatorBg, tokens.indicatorBorder]
                    : "border-neutral-300 dark:border-neutral-600"
                )}
                aria-hidden="true"
              >
                {selected && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ButtonSelector;
