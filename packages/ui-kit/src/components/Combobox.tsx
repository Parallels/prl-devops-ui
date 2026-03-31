import React, { useState, useRef, useEffect, useMemo } from 'react';
import classNames from 'classnames';
import { useIconRenderer } from '../contexts/IconContext';
import IconButton from './IconButton';
import { type ThemeColor } from '../theme/Theme';

const toneTokens: Record<ThemeColor, { focusRing: string; optionHover: string; optionSelected: string }> = {
  parallels: {
    focusRing: 'focus:border-rose-500 focus:ring-rose-200 dark:focus:border-rose-400 dark:focus:ring-rose-900/40',
    optionHover: 'hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/30 dark:hover:text-rose-300',
    optionSelected: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  },
  brand: {
    focusRing: 'focus:border-rose-500 focus:ring-rose-200 dark:focus:border-rose-400 dark:focus:ring-rose-900/40',
    optionHover: 'hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/30 dark:hover:text-rose-300',
    optionSelected: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  },
  theme: {
    focusRing: 'focus:border-rose-500 focus:ring-rose-200 dark:focus:border-rose-400 dark:focus:ring-rose-900/40',
    optionHover: 'hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/30 dark:hover:text-rose-300',
    optionSelected: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  },
  red: {
    focusRing: 'focus:border-rose-500 focus:ring-rose-200 dark:focus:border-rose-400 dark:focus:ring-rose-900/40',
    optionHover: 'hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/30 dark:hover:text-rose-300',
    optionSelected: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  },
  orange: {
    focusRing: 'focus:border-orange-500 focus:ring-orange-200 dark:focus:border-orange-400 dark:focus:ring-orange-900/40',
    optionHover: 'hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-900/30 dark:hover:text-orange-300',
    optionSelected: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  },
  amber: {
    focusRing: 'focus:border-amber-500 focus:ring-amber-200 dark:focus:border-amber-400 dark:focus:ring-amber-900/40',
    optionHover: 'hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-300',
    optionSelected: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  yellow: {
    focusRing: 'focus:border-yellow-500 focus:ring-yellow-200 dark:focus:border-yellow-400 dark:focus:ring-yellow-900/40',
    optionHover: 'hover:bg-yellow-50 hover:text-yellow-700 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-300',
    optionSelected: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  },
  lime: {
    focusRing: 'focus:border-lime-500 focus:ring-lime-200 dark:focus:border-lime-400 dark:focus:ring-lime-900/40',
    optionHover: 'hover:bg-lime-50 hover:text-lime-700 dark:hover:bg-lime-900/30 dark:hover:text-lime-300',
    optionSelected: 'bg-lime-50 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
  },
  green: {
    focusRing: 'focus:border-emerald-500 focus:ring-emerald-200 dark:focus:border-emerald-400 dark:focus:ring-emerald-900/40',
    optionHover: 'hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300',
    optionSelected: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  emerald: {
    focusRing: 'focus:border-emerald-500 focus:ring-emerald-200 dark:focus:border-emerald-400 dark:focus:ring-emerald-900/40',
    optionHover: 'hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300',
    optionSelected: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  teal: {
    focusRing: 'focus:border-teal-500 focus:ring-teal-200 dark:focus:border-teal-400 dark:focus:ring-teal-900/40',
    optionHover: 'hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-900/30 dark:hover:text-teal-300',
    optionSelected: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  },
  cyan: {
    focusRing: 'focus:border-cyan-500 focus:ring-cyan-200 dark:focus:border-cyan-400 dark:focus:ring-cyan-900/40',
    optionHover: 'hover:bg-cyan-50 hover:text-cyan-700 dark:hover:bg-cyan-900/30 dark:hover:text-cyan-300',
    optionSelected: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  },
  sky: {
    focusRing: 'focus:border-sky-500 focus:ring-sky-200 dark:focus:border-sky-400 dark:focus:ring-sky-900/40',
    optionHover: 'hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-900/30 dark:hover:text-sky-300',
    optionSelected: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  },
  blue: {
    focusRing: 'focus:border-blue-500 focus:ring-blue-200 dark:focus:border-blue-400 dark:focus:ring-blue-900/40',
    optionHover: 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-300',
    optionSelected: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  indigo: {
    focusRing: 'focus:border-indigo-500 focus:ring-indigo-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40',
    optionHover: 'hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300',
    optionSelected: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  },
  violet: {
    focusRing: 'focus:border-violet-500 focus:ring-violet-200 dark:focus:border-violet-400 dark:focus:ring-violet-900/40',
    optionHover: 'hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-900/30 dark:hover:text-violet-300',
    optionSelected: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  },
  purple: {
    focusRing: 'focus:border-purple-500 focus:ring-purple-200 dark:focus:border-purple-400 dark:focus:ring-purple-900/40',
    optionHover: 'hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-900/30 dark:hover:text-purple-300',
    optionSelected: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  },
  fuchsia: {
    focusRing: 'focus:border-fuchsia-500 focus:ring-fuchsia-200 dark:focus:border-fuchsia-400 dark:focus:ring-fuchsia-900/40',
    optionHover: 'hover:bg-fuchsia-50 hover:text-fuchsia-700 dark:hover:bg-fuchsia-900/30 dark:hover:text-fuchsia-300',
    optionSelected: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
  },
  pink: {
    focusRing: 'focus:border-pink-500 focus:ring-pink-200 dark:focus:border-pink-400 dark:focus:ring-pink-900/40',
    optionHover: 'hover:bg-pink-50 hover:text-pink-700 dark:hover:bg-pink-900/30 dark:hover:text-pink-300',
    optionSelected: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  },
  rose: {
    focusRing: 'focus:border-rose-500 focus:ring-rose-200 dark:focus:border-rose-400 dark:focus:ring-rose-900/40',
    optionHover: 'hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/30 dark:hover:text-rose-300',
    optionSelected: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  },
  slate: {
    focusRing: 'focus:border-slate-500 focus:ring-slate-200 dark:focus:border-slate-400 dark:focus:ring-slate-900/40',
    optionHover: 'hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-900/30 dark:hover:text-slate-300',
    optionSelected: 'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
  },
  gray: {
    focusRing: 'focus:border-gray-500 focus:ring-gray-200 dark:focus:border-gray-400 dark:focus:ring-gray-900/40',
    optionHover: 'hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-900/30 dark:hover:text-gray-300',
    optionSelected: 'bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
  },
  zinc: {
    focusRing: 'focus:border-zinc-500 focus:ring-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-900/40',
    optionHover: 'hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-900/30 dark:hover:text-zinc-300',
    optionSelected: 'bg-zinc-50 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-300',
  },
  neutral: {
    focusRing: 'focus:border-neutral-500 focus:ring-neutral-200 dark:focus:border-neutral-400 dark:focus:ring-neutral-900/40',
    optionHover: 'hover:bg-neutral-50 hover:text-neutral-700 dark:hover:bg-neutral-900/30 dark:hover:text-neutral-300',
    optionSelected: 'bg-neutral-50 text-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-300',
  },
  stone: {
    focusRing: 'focus:border-stone-500 focus:ring-stone-200 dark:focus:border-stone-400 dark:focus:ring-stone-900/40',
    optionHover: 'hover:bg-stone-50 hover:text-stone-700 dark:hover:bg-stone-900/30 dark:hover:text-stone-300',
    optionSelected: 'bg-stone-50 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300',
  },
  white: {
    focusRing: 'focus:border-slate-500 focus:ring-slate-200 dark:focus:border-slate-400 dark:focus:ring-slate-900/40',
    optionHover: 'hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-900/30 dark:hover:text-slate-300',
    optionSelected: 'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
  },
  info: {
    focusRing: 'focus:border-sky-500 focus:ring-sky-200 dark:focus:border-sky-400 dark:focus:ring-sky-900/40',
    optionHover: 'hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-900/30 dark:hover:text-sky-300',
    optionSelected: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  },
  success: {
    focusRing: 'focus:border-emerald-500 focus:ring-emerald-200 dark:focus:border-emerald-400 dark:focus:ring-emerald-900/40',
    optionHover: 'hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300',
    optionSelected: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  warning: {
    focusRing: 'focus:border-yellow-500 focus:ring-yellow-200 dark:focus:border-yellow-400 dark:focus:ring-yellow-900/40',
    optionHover: 'hover:bg-yellow-50 hover:text-yellow-700 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-300',
    optionSelected: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  },
  danger: {
    focusRing: 'focus:border-rose-500 focus:ring-rose-200 dark:focus:border-rose-400 dark:focus:ring-rose-900/40',
    optionHover: 'hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/30 dark:hover:text-rose-300',
    optionSelected: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  },
};

export interface ComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  emptyMessage?: string;
  color?: ThemeColor;
}

export const Combobox: React.FC<ComboboxProps> = ({
  value = '',
  onChange,
  options = [],
  placeholder,
  className,
  disabled = false,
  error = false,
  emptyMessage = 'No matching options found. You can keep typing to create a custom one.',
  color = 'blue',
}) => {
  const renderIcon = useIconRenderer();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const colorTokens = toneTokens[color] ?? toneTokens.theme;

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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    <div ref={containerRef} className={classNames('relative w-full', className)}>
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
            'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : `border-gray-300 ${colorTokens.focusRing}`,
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
                onChange('');
                setFilter('');
                inputRef.current?.focus();
              }}
              aria-label="Clear"
            />
          )}
          <div className="pointer-events-none text-gray-400 pl-1">{renderIcon('ArrowDown', 'sm', 'h-4 w-4')}</div>
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
                  `cursor-pointer px-4 py-2 text-sm ${colorTokens.optionHover}`,
                  option === value ? `${colorTokens.optionSelected} font-medium` : 'text-gray-900 dark:text-gray-100',
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

Combobox.displayName = 'Combobox';

export default Combobox;
