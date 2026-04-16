import React, { useEffect, useId, useMemo, useState } from "react";
import { type ThemeColor } from "../theme/Theme";

export type MultiSelectPillOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export interface MultiSelectPillsProps {
  /**
   * Used as the name for the generated hidden inputs (e.g. `${name}[]`).
   */
  name: string;
  /**
   * Options rendered as pills.
   */
  options: MultiSelectPillOption[];
  /**
   * Optional legend displayed above the pill list.
   */
  legend?: React.ReactNode;
  /**
   * Optional helper text rendered below the legend.
   */
  description?: React.ReactNode;
  /**
   * Current selected values when using the component in a controlled way.
   */
  value?: string[];
  /**
   * Default selected values for uncontrolled usage.
   */
  defaultValue?: string[];
  /**
   * Called whenever the selected values change.
   */
  onChange?: (selectedValues: string[]) => void;
  /**
   * Optional class applied to the fieldset wrapper.
   */
  className?: string;
  /**
   * Disable the whole control.
   */
  disabled?: boolean;
  /**
   * Tailwind size token controlling text size and padding.
   */
  size?: "xs" | "sm" | "base" | "lg";
  /**
   * Theme color used when a pill is selected.
   * Accepts any ThemeColor value. Defaults to "blue".
   */
  color?: ThemeColor;
  /**
   * Border radius of the pills.
   * Defaults to "full" (fully rounded).
   */
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  /**
   * Gap between pills.
   * Defaults to "2".
   */
  gap?: "1" | "1.5" | "2" | "3" | "4";
  /**
   * Selection behaviour. Defaults to multi-select.
   */
  selectionMode?: "multiple" | "single";
}

// ── Maps ──────────────────────────────────────────────────────────────────────

const sizeMap = {
  xs: { text: "text-xs", padding: "px-2 py-1" },
  sm: { text: "text-sm", padding: "px-3 py-1.5" },
  base: { text: "text-base", padding: "px-4 py-2" },
  lg: { text: "text-lg", padding: "px-5 py-2.5" },
} as const;

const roundedMap = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
} as const;

const gapMap = {
  "1": "gap-1",
  "1.5": "gap-1.5",
  "2": "gap-2",
  "3": "gap-3",
  "4": "gap-4",
} as const;

const colorTokens: Record<ThemeColor, { selected: string; ring: string }> = {
  parallels: {
    selected:
      "border-rose-500 bg-rose-500 text-white dark:bg-rose-500 dark:border-rose-500",
    ring: "focus-visible:ring-rose-400",
  },
  brand: {
    selected:
      "border-rose-500 bg-rose-500 text-white dark:bg-rose-500 dark:border-rose-500",
    ring: "focus-visible:ring-rose-400",
  },
  theme: {
    selected:
      "border-rose-500 bg-rose-500 text-white dark:bg-rose-500 dark:border-rose-500",
    ring: "focus-visible:ring-rose-400",
  },
  red: {
    selected:
      "border-rose-500 bg-rose-500 text-white dark:bg-rose-500 dark:border-rose-500",
    ring: "focus-visible:ring-rose-400",
  },
  orange: {
    selected:
      "border-orange-500 bg-orange-500 text-white dark:bg-orange-500 dark:border-orange-500",
    ring: "focus-visible:ring-orange-400",
  },
  amber: {
    selected:
      "border-amber-500 bg-amber-500 text-white dark:bg-amber-400 dark:border-amber-400",
    ring: "focus-visible:ring-amber-400",
  },
  yellow: {
    selected:
      "border-yellow-500 bg-yellow-500 text-white dark:bg-yellow-400 dark:border-yellow-400",
    ring: "focus-visible:ring-yellow-400",
  },
  lime: {
    selected:
      "border-lime-500 bg-lime-500 text-white dark:bg-lime-500 dark:border-lime-500",
    ring: "focus-visible:ring-lime-400",
  },
  green: {
    selected:
      "border-emerald-600 bg-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500",
    ring: "focus-visible:ring-emerald-400",
  },
  emerald: {
    selected:
      "border-emerald-600 bg-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500",
    ring: "focus-visible:ring-emerald-400",
  },
  teal: {
    selected:
      "border-teal-500 bg-teal-500 text-white dark:bg-teal-500 dark:border-teal-500",
    ring: "focus-visible:ring-teal-400",
  },
  cyan: {
    selected:
      "border-cyan-500 bg-cyan-500 text-white dark:bg-cyan-500 dark:border-cyan-500",
    ring: "focus-visible:ring-cyan-400",
  },
  sky: {
    selected:
      "border-sky-500 bg-sky-500 text-white dark:bg-sky-500 dark:border-sky-500",
    ring: "focus-visible:ring-sky-400",
  },
  blue: {
    selected:
      "border-blue-500 bg-blue-500 text-white dark:bg-blue-500 dark:border-blue-500",
    ring: "focus-visible:ring-blue-400",
  },
  indigo: {
    selected:
      "border-indigo-600 bg-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500",
    ring: "focus-visible:ring-indigo-400",
  },
  violet: {
    selected:
      "border-violet-500 bg-violet-500 text-white dark:bg-violet-500 dark:border-violet-500",
    ring: "focus-visible:ring-violet-400",
  },
  purple: {
    selected:
      "border-purple-500 bg-purple-500 text-white dark:bg-purple-500 dark:border-purple-500",
    ring: "focus-visible:ring-purple-400",
  },
  fuchsia: {
    selected:
      "border-fuchsia-500 bg-fuchsia-500 text-white dark:bg-fuchsia-500 dark:border-fuchsia-500",
    ring: "focus-visible:ring-fuchsia-400",
  },
  pink: {
    selected:
      "border-pink-500 bg-pink-500 text-white dark:bg-pink-500 dark:border-pink-500",
    ring: "focus-visible:ring-pink-400",
  },
  rose: {
    selected:
      "border-rose-500 bg-rose-500 text-white dark:bg-rose-500 dark:border-rose-500",
    ring: "focus-visible:ring-rose-400",
  },
  slate: {
    selected:
      "border-slate-600 bg-slate-600 text-white dark:bg-slate-500 dark:border-slate-500",
    ring: "focus-visible:ring-slate-400",
  },
  gray: {
    selected:
      "border-gray-600 bg-gray-600 text-white dark:bg-gray-500 dark:border-gray-500",
    ring: "focus-visible:ring-gray-400",
  },
  zinc: {
    selected:
      "border-zinc-600 bg-zinc-600 text-white dark:bg-zinc-500 dark:border-zinc-500",
    ring: "focus-visible:ring-zinc-400",
  },
  neutral: {
    selected:
      "border-neutral-600 bg-neutral-600 text-white dark:bg-neutral-500 dark:border-neutral-500",
    ring: "focus-visible:ring-neutral-400",
  },
  stone: {
    selected:
      "border-stone-600 bg-stone-600 text-white dark:bg-stone-500 dark:border-stone-500",
    ring: "focus-visible:ring-stone-400",
  },
  white: {
    selected:
      "border-slate-400 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200",
    ring: "focus-visible:ring-slate-300",
  },
  info: {
    selected:
      "border-sky-500 bg-sky-500 text-white dark:bg-sky-500 dark:border-sky-500",
    ring: "focus-visible:ring-sky-400",
  },
  success: {
    selected:
      "border-emerald-600 bg-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500",
    ring: "focus-visible:ring-emerald-400",
  },
  warning: {
    selected:
      "border-amber-500 bg-amber-500 text-white dark:bg-amber-400 dark:border-amber-400",
    ring: "focus-visible:ring-amber-400",
  },
  danger: {
    selected:
      "border-rose-500 bg-rose-500 text-white dark:bg-rose-500 dark:border-rose-500",
    ring: "focus-visible:ring-rose-400",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

const MultiSelectPills: React.FC<MultiSelectPillsProps> = ({
  name,
  options,
  legend,
  description,
  value,
  defaultValue = [],
  onChange,
  className,
  disabled = false,
  size = "sm",
  color = "blue",
  rounded = "full",
  gap = "2",
  selectionMode = "multiple",
}) => {
  const generatedId = useId();
  const isControlled = value !== undefined;

  const [internalSelected, setInternalSelected] =
    useState<string[]>(defaultValue);

  useEffect(() => {
    if (!isControlled) return;
    setInternalSelected(value ?? []);
  }, [isControlled, value]);

  useEffect(() => {
    if (isControlled) return;
    setInternalSelected(defaultValue);
  }, [defaultValue, isControlled]);

  const selectedValues = useMemo(
    () => (isControlled ? (value ?? []) : internalSelected),
    [isControlled, value, internalSelected],
  );
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  const sizeClasses = sizeMap[size];
  const roundedClass = roundedMap[rounded];
  const gapClass = gapMap[gap];
  const colorClasses = colorTokens[color] ?? colorTokens.blue;

  const handleToggle = (
    optionValue: string,
    optionDisabled: boolean | undefined,
  ) => {
    if (disabled || optionDisabled) return;

    const isAlreadySelected = selectedSet.has(optionValue);
    let nextSelected: string[];

    if (selectionMode === "single") {
      nextSelected = isAlreadySelected ? [] : [optionValue];
    } else {
      nextSelected = isAlreadySelected
        ? selectedValues.filter((item) => item !== optionValue)
        : [...selectedValues, optionValue];
    }

    if (!isControlled) setInternalSelected(nextSelected);
    onChange?.(nextSelected);
  };

  return (
    <fieldset
      className={["flex flex-col", className ?? ""].filter(Boolean).join(" ")}
      disabled={disabled}
    >
      {legend && (
        <legend
          className={`text-sm font-medium text-neutral-800 dark:text-neutral-200 ${!description ? "pb-3" : ""}`}
        >
          {legend}
        </legend>
      )}
      {description && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 pb-2">
          {description}
        </p>
      )}

      <div className={`flex flex-wrap ${gapClass}`}>
        {options.map((option, index) => {
          const optionId = `${generatedId}-${name}-${index}`;
          const isSelected = selectedSet.has(option.value);
          const isOptionDisabled = option.disabled ?? false;

          return (
            <React.Fragment key={option.value}>
              <input
                type="checkbox"
                id={optionId}
                name={`${name}[]`}
                value={option.value}
                checked={isSelected}
                readOnly
                className="sr-only"
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={() => handleToggle(option.value, option.disabled)}
                className={[
                  "inline-flex items-center border font-medium transition focus:outline-none focus-visible:ring-2",
                  sizeClasses.text,
                  sizeClasses.padding,
                  roundedClass,
                  isSelected
                    ? colorClasses.selected
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:border-neutral-600",
                  disabled || isOptionDisabled
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer",
                  colorClasses.ring,
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-pressed={isSelected}
                aria-disabled={disabled || isOptionDisabled}
                disabled={disabled || isOptionDisabled}
              >
                {option.label}
                {option.description && (
                  <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {option.description}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </fieldset>
  );
};

MultiSelectPills.displayName = "MultiSelectPills";

export default MultiSelectPills;
