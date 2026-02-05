import React, { useState } from 'react';
import { PlaygroundSection } from '../PlaygroundSection';
import { InfiniteScrollPanel, Toggle, Button } from '../../..';

export const InfiniteScrollDemo: React.FC = () => {
    const [infiniteItems, setInfiniteItems] = useState<number[]>(Array.from({ length: 20 }, (_, i) => i));
    const [infiniteHasMore, setInfiniteHasMore] = useState(true);
    const [infiniteIsLoading, setInfiniteIsLoading] = useState(false);
    const [infiniteMasonry, setInfiniteMasonry] = useState(true);
    const [infiniteFixedColumns, setInfiniteFixedColumns] = useState(false);

    const loadMoreInfiniteItems = async () => {
        if (infiniteIsLoading) return;
        setInfiniteIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setInfiniteItems((prev) => [
            ...prev,
            ...Array.from({ length: 10 }, (_, i) => prev.length + i),
        ]);
        setInfiniteIsLoading(false);
        if (infiniteItems.length > 100) {
            setInfiniteHasMore(false);
        }
    };

    return (
        <PlaygroundSection
            title="Infinite Scroll Panel"
            label="[InfiniteScrollPanel]"
            description="Scrollable container with masonry layout and auto-loading."
            controls={
                <div className="space-y-4 text-sm">
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex items-center justify-between">
                            <span>Masonry</span>
                            <Toggle
                                size="sm"
                                checked={infiniteMasonry}
                                onChange={(event) => setInfiniteMasonry(event.target.checked)}
                                disabled={infiniteFixedColumns}
                            />
                        </label>
                        <label className="flex items-center justify-between">
                            <span>Fixed Columns</span>
                            <Toggle
                                size="sm"
                                checked={infiniteFixedColumns}
                                onChange={(event) => setInfiniteFixedColumns(event.target.checked)}
                            />
                        </label>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Has More</span>
                        <Toggle
                            size="sm"
                            checked={infiniteHasMore}
                            onChange={(event) => setInfiniteHasMore(event.target.checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Reset Data</span>
                        <Button
                            size="xs"
                            variant="soft"
                            onClick={() => {
                                setInfiniteItems(Array.from({ length: 20 }, (_, i) => i));
                                setInfiniteHasMore(true);
                            }}
                        >
                            Reset
                        </Button>
                    </div>
                </div>
            }
            preview={
                <div className="h-[500px] w-full rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
                    <InfiniteScrollPanel
                        items={infiniteItems}
                        isLoading={infiniteIsLoading}
                        hasMore={infiniteHasMore}
                        onLoadMore={loadMoreInfiniteItems}
                        masonry={infiniteMasonry}
                        useFixedColumns={infiniteFixedColumns}
                        renderItem={(item: number) => (
                            <div
                                className="w-full rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
                                style={{ height: `${100 + (item % 5) * 40}px` }}
                            >
                                <div className="mb-2 font-semibold">Item {item}</div>
                                <div className="text-xs text-neutral-500">
                                    Height: {100 + (item % 5) * 40}px
                                </div>
                            </div>
                        )}
                    />
                </div>
            }
        />
    );
};
