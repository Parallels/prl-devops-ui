import React, { useEffect, useId, useMemo, useState } from "react";

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
   * e.g. "sm", "base", "lg".
   */
  size?: "xs" | "sm" | "base" | "lg";
  /**
   * Tailwind color token used when the pill is selected.
   * Defaults to "indigo".
   */
  color?: "indigo" | "blue" | "emerald" | "rose" | "amber";
  /**
   * Selection behaviour. Defaults to multi-select.
   */
  selectionMode?: "multiple" | "single";
}

const sizeMap = {
  xs: {
    text: "text-xs",
    padding: "px-2 py-1",
  },
  sm: {
    text: "text-sm",
    padding: "px-3 py-1.5",
  },
  base: {
    text: "text-base",
    padding: "px-4 py-2",
  },
  lg: {
    text: "text-lg",
    padding: "px-5 py-2.5",
  },
} as const;

const colorMap = {
  indigo: {
    selected: "border-indigo-600 bg-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500",
    ring: "focus-visible:ring-indigo-500",
  },
  blue: {
    selected: "border-blue-500 bg-blue-500 text-white dark:bg-blue-500 dark:border-blue-500 hover:opacity-70",
    ring: "focus-visible:ring-blue-300",
  },
  emerald: {
    selected: "border-emerald-600 bg-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500",
    ring: "focus-visible:ring-emerald-500",
  },
  rose: {
    selected: "border-rose-600 bg-rose-600 text-white dark:bg-rose-500 dark:border-rose-500",
    ring: "focus-visible:ring-rose-500",
  },
  amber: {
    selected: "border-amber-500 bg-amber-500 text-white dark:bg-amber-400 dark:border-amber-400",
    ring: "focus-visible:ring-amber-500",
  },
} as const;

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
  color = "indigo",
  selectionMode = "multiple",
}) => {
  const generatedId = useId();
  const isControlled = value !== undefined;

  const [internalSelected, setInternalSelected] = useState<string[]>(defaultValue);

  useEffect(() => {
    if (!isControlled) {
      return;
    }
    setInternalSelected(value ?? []);
  }, [isControlled, value]);

  useEffect(() => {
    if (isControlled) {
      return;
    }
    setInternalSelected(defaultValue);
  }, [defaultValue, isControlled]);

  const selectedValues = useMemo(() => (isControlled ? (value ?? []) : internalSelected), [isControlled, value, internalSelected]);
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  const sizeClasses = sizeMap[size];
  const colorClasses = colorMap[color] ?? colorMap.indigo;

  const handleToggle = (optionValue: string, optionDisabled: boolean | undefined) => {
    if (disabled || optionDisabled) {
      return;
    }
    let nextSelected: string[];

    const isAlreadySelected = selectedSet.has(optionValue);

    if (selectionMode === "single") {
      if (isAlreadySelected) {
        // Allow deselecting the only selected pill in single mode for flexibility
        nextSelected = [];
      } else {
        nextSelected = [optionValue];
      }
    } else {
      nextSelected = isAlreadySelected ? selectedValues.filter((item) => item !== optionValue) : [...selectedValues, optionValue];
    }

    if (!isControlled) {
      setInternalSelected(nextSelected);
    }

    onChange?.(nextSelected);
  };

  return (
    <fieldset className={["flex flex-col", className ?? ""].filter(Boolean).join(" ")} disabled={disabled}>
      {legend && <legend className={`text-sm font-medium text-neutral-800 dark:text-neutral-200 ${!description ? "pb-3" : ""}`}>{legend}</legend>}
      {description && <p className="text-xs text-neutral-500 dark:text-neutral-400 pb-2">{description}</p>}

      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          const optionId = `${generatedId}-${name}-${index}`;
          const isSelected = selectedSet.has(option.value);
          const isOptionDisabled = option.disabled ?? false;

          return (
            <React.Fragment key={option.value}>
              <input type="checkbox" id={optionId} name={`${name}[]`} value={option.value} checked={isSelected} readOnly className="sr-only" tabIndex={-1} />
              <button
                type="button"
                onClick={() => handleToggle(option.value, option.disabled)}
                className={[
                  "inline-flex items-center rounded-full border font-medium transition focus:outline-none focus-visible:ring-2",
                  sizeClasses.text,
                  sizeClasses.padding,
                  isSelected
                    ? colorClasses.selected
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 hover:shadow-sm dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:border-neutral-600",
                  disabled || isOptionDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                  colorClasses.ring,
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-pressed={isSelected}
                aria-disabled={disabled || isOptionDisabled}
                disabled={disabled || isOptionDisabled}
              >
                {option.label}
                {option.description && <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">{option.description}</span>}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </fieldset>
  );
};

export default MultiSelectPills;
