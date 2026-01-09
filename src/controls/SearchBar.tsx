import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { renderIcon } from '@/utils/icon';
import { IconName } from '@/types/Icon';
import { amplitudeService } from '@/services/AmplitudeService';

export interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string, signal?: AbortSignal) => void;
  onClear?: () => void;
  debounceMs?: number;
  autoSearch?: boolean;
  className?: string;
  disabled?: boolean;
  initialValue?: string;
  shouldClear?: boolean;
  leadingIcon?: IconName | React.ReactElement;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search…',
  onSearch,
  onClear,
  debounceMs = 400,
  autoSearch = true,
  className,
  disabled = false,
  initialValue = '',
  shouldClear = false,
  leadingIcon = 'Search',
}) => {
  const [query, setQuery] = useState(initialValue);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const generationRef = useRef(0);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  const clearPendingSearch = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  const triggerSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      onSearchRef.current('');
      return;
    }
    abortRef.current = new AbortController();
    void amplitudeService.logEvent('APP::SEARCH', { query: value });
    onSearchRef.current(trimmed, abortRef.current.signal);
  };

  useEffect(() => {
    if (!autoSearch) {
      return undefined;
    }

    clearPendingSearch();
    if (!query.trim()) {
      onSearchRef.current('');
      return undefined;
    }

    const myGeneration = ++generationRef.current;
    debounceRef.current = setTimeout(() => {
      if (myGeneration !== generationRef.current) {
        return;
      }
      triggerSearch(query);
    }, debounceMs);

    return () => clearPendingSearch();
  }, [query, autoSearch, debounceMs]);

  const handleInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    if (!event.target.value) {
      clearPendingSearch();
      onSearchRef.current('');
    }
  }, []);

  const handleClear = useCallback(() => {
    clearPendingSearch();
    setQuery('');
    onClear?.();
    inputRef.current?.focus();
  }, [onClear]);

  useEffect(() => {
    if (shouldClear) {
      handleClear();
    }
  }, [shouldClear, handleClear]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        handleClear();
      }
      if (event.key === 'Enter') {
        clearPendingSearch();
        generationRef.current += 1;
        triggerSearch(event.currentTarget.value);
      }
    },
    [handleClear]
  );

  return (
    <div
      className={classNames(
        'group relative flex w-full items-center rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2 shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-400/40 dark:border-slate-700/60 dark:bg-slate-900/60',
        disabled && 'opacity-60',
        focused && 'ring-2 ring-blue-300/70 border-blue-400/70',
        className
      )}
    >
      <span className="mr-3 flex text-slate-400 dark:text-slate-500">
        {renderIcon(leadingIcon, 'md')}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 border-none bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-slate-200 dark:placeholder-slate-500"
      />
      {query && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="ml-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Clear search"
        >
          {renderIcon('Close', 'sm')}
        </button>
      )}
    </div>
  );
};

export default SearchBar;
