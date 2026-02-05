import React, { useState, useRef, useEffect, useMemo } from "react";
import classNames from "classnames";
import { useIconRenderer } from "../contexts/IconContext";
import IconButton from "./IconButton";

export interface ComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  emptyMessage?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  value = "",
  onChange,
  options = [],
  placeholder,
  className,
  disabled = false,
  error = false,
  emptyMessage = "No matching options found. You can keep typing to create a custom one.",
}) => {
  const renderIcon = useIconRenderer();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFilter(value);
  }, [value]);

  const filteredOptions = useMemo(() => {
    if (!filter) return options;
    const lowerFilter = filter.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(lowerFilter));
  }, [options, filter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setFilter(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleOptionClick = (option: string) => {
    onChange(option);
    setFilter(option);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={classNames("relative w-full", className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={filter}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={classNames(
            "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
          )}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {filter && !disabled && (
            <IconButton
              icon="Close"
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600"
              onClick={() => {
                onChange("");
                setFilter("");
                inputRef.current?.focus();
              }}
              aria-label="Clear"
            />
          )}
          <div className="pointer-events-none text-gray-400 pl-1">{renderIcon("ArrowDown", "sm", "h-4 w-4")}</div>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-neutral-800">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={index}
                onClick={() => handleOptionClick(option)}
                className={classNames(
                  "cursor-pointer px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-300",
                  option === value
                    ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-900 dark:text-gray-100"
                )}
              >
                {option}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500 italic dark:text-gray-400">{emptyMessage}</div>
          )}
        </div>
      )}
    </div>
  );
};

Combobox.displayName = "Combobox";

export default Combobox;
