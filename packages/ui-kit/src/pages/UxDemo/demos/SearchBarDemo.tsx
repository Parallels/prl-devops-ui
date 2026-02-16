import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { SearchBar, Input, Toggle, Button } from '../../..';

export const SearchBarDemo: React.FC = () => {
    const [searchBarPlaceholder, setSearchBarPlaceholder] = useState('Search...');
    const [searchBarDebounce, setSearchBarDebounce] = useState(400);
    const [searchBarAutoSearch, setSearchBarAutoSearch] = useState(true);
    const [searchBarDisabled, setSearchBarDisabled] = useState(false);
    const [searchBarShouldClear, setSearchBarShouldClear] = useState(false);
    const [searchBarLastQuery, setSearchBarLastQuery] = useState('');

    return (
        <PlaygroundSection
            title="SearchBar"
            label="[SearchBar]"
            description="A search input with debounce and clear functionality."
            controls={
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-neutral-500">Placeholder</label>
                            <Input
                                value={searchBarPlaceholder}
                                onChange={(e) => setSearchBarPlaceholder(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-neutral-500">Debounce (ms)</label>
                            <Input
                                type="number"
                                value={searchBarDebounce.toString()}
                                onChange={(e) => setSearchBarDebounce(Number(e.target.value))}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <Toggle
                            label="Auto Search"
                            checked={searchBarAutoSearch}
                            onChange={(e) => setSearchBarAutoSearch(e.target.checked)}
                        />
                        <Toggle
                            label="Disabled"
                            checked={searchBarDisabled}
                            onChange={(e) => setSearchBarDisabled(e.target.checked)}
                        />
                        <Button
                            size="sm"
                            onClick={() => {
                                setSearchBarShouldClear(true);
                                setTimeout(() => setSearchBarShouldClear(false), 100);
                            }}
                        >
                            Clear Search
                        </Button>
                    </div>
                </div>
            }
            preview={
                <div className="flex flex-col gap-4 w-full max-w-md">
                    <SearchBar
                        placeholder={searchBarPlaceholder}
                        debounceMs={searchBarDebounce}
                        autoSearch={searchBarAutoSearch}
                        disabled={searchBarDisabled}
                        shouldClear={searchBarShouldClear}
                        onSearch={(query) => setSearchBarLastQuery(query)}
                    />
                    <div className="text-sm text-neutral-500">
                        Last search query: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{searchBarLastQuery || '(none)'}</span>
                    </div>
                </div>
            }
        />
    );
};
