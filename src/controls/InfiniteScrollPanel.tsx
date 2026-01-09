import React, { useEffect, useState, useRef, useCallback } from 'react';
import classNames from 'classnames';
import Spinner from './Spinner';

export interface InfiniteScrollPanelProps<T> {
  items: T[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  renderItem: (item: T, index: number) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  className?: string;
  threshold?: number; // Number of items from bottom to trigger load more
  debounceMs?: number; // Debounce time for scroll events
  // Fixed columns mode: assign items to columns by index (index % columnCount)
  useFixedColumns?: boolean;
  minColumnWidthPx?: number;
  maxColumns?: number;
  columnTemplate?: string;
  masonry?: boolean;
}

export function InfiniteScrollPanel<T>({
  items,
  isLoading,
  hasMore,
  onLoadMore,
  renderItem,
  loadingComponent,
  emptyComponent,
  className = '',
  threshold = 3,
  debounceMs = 100,
  useFixedColumns = false,
  minColumnWidthPx = 300,
  maxColumns,
  columnTemplate,
  masonry = false,
}: InfiniteScrollPanelProps<T>) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const loadingRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resizeObserversRef = useRef<ResizeObserver[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const delayedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [columnCount, setColumnCount] = useState<number>(1);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      await onLoadMore();
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, onLoadMore]);

  const handleScroll = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (!containerRef.current || !loadingRef.current) return;

      const container = containerRef.current;
      const loadingElement = loadingRef.current;
      const containerRect = container.getBoundingClientRect();
      const loadingRect = loadingElement.getBoundingClientRect();

      // Check if loading element is visible (within threshold)
      const isVisible = loadingRect.top <= containerRect.bottom + threshold * 50; // 50px per item threshold

      if (isVisible && hasMore && !isLoadingMore && !isLoading) {
        void handleLoadMore();
      }
    }, debounceMs);
  }, [hasMore, isLoadingMore, isLoading, threshold, debounceMs, handleLoadMore]);

  // Ensure we register scroll/resize listeners once here, after handleScroll is created
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

  // Auto-load more when there are few items and more are available
  useEffect(() => {
    if (items.length > 0 && items.length < threshold && hasMore && !isLoadingMore && !isLoading) {
      void handleLoadMore();
    }
  }, [items.length, threshold, hasMore, isLoadingMore, isLoading, handleLoadMore]);

  // Re-check visibility when loading finishes or items change to ensure continuous loading if loader is still visible
  useEffect(() => {
    if (!isLoading && !isLoadingMore) {
      handleScroll();
    }
  }, [isLoading, isLoadingMore, items.length, handleScroll]);

  const defaultLoadingComponent = (
    <div className='flex flex-col items-center justify-center gap-4'>
      <Spinner thickness='thick' color='blue' size='lg' variant='segments' />
      <span className='text-md '>Loading more...</span>
    </div>
  );

  const defaultEmptyComponent = (
    <div className="flex items-center justify-center p-12 text-center text-base text-neutral-500 dark:text-neutral-400">
      <span>No items found</span>
    </div>
  );

  // Masonry: compute row spans for a stable grid that won't reshuffle other columns
  const recomputeMasonrySpans = useCallback(() => {
    const grid = itemsContainerRef.current;
    if (!grid) return;
    const computed = window.getComputedStyle(grid);
    const rowGap = parseFloat(computed.rowGap || '0');
    const rowHeight = parseFloat(computed.getPropertyValue('--masonry-row-height') || '8');

    itemRefs.current.forEach((el) => {
      if (!el) return;
      const contentHeight = el.getBoundingClientRect().height;
      const rowSpan = Math.max(1, Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap)));
      const current = el.style.gridRowEnd;
      const next = `span ${rowSpan}`;
      if (current !== next) {
        el.style.gridRowEnd = next;
      }
    });
  }, []);

  const scheduleRecompute = useCallback(
    (delayMs: number = 60) => {
      // Optional small delay lets height transitions settle to a final value
      if (delayedTimerRef.current) {
        clearTimeout(delayedTimerRef.current);
        delayedTimerRef.current = null;
      }
      delayedTimerRef.current = setTimeout(() => {
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }
        rafIdRef.current = requestAnimationFrame(() => {
          recomputeMasonrySpans();
          rafIdRef.current = null;
        });
      }, delayMs);
    },
    [recomputeMasonrySpans]
  );

  useEffect(() => {
    // Set up resize observers for each item so spans update on expand/collapse
    if (useFixedColumns) return; // skip in fixed-columns mode
    resizeObserversRef.current.forEach((ro) => ro.disconnect());
    resizeObserversRef.current = [];

    itemRefs.current.forEach((el) => {
      if (!el) return;
      const ro = new ResizeObserver(() => scheduleRecompute());
      ro.observe(el);
      resizeObserversRef.current.push(ro);
    });

    // Initial layout
    scheduleRecompute(0);

    const handler = () => scheduleRecompute(0);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('resize', handler);
      resizeObserversRef.current.forEach((ro) => ro.disconnect());
      resizeObserversRef.current = [];
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (delayedTimerRef.current) {
        clearTimeout(delayedTimerRef.current);
        delayedTimerRef.current = null;
      }
    };
  }, [items, scheduleRecompute, useFixedColumns]);

  // Compute responsive column count in fixed-columns mode
  useEffect(() => {
    if (!useFixedColumns) return;
    const computeColumns = () => {
      const container = containerRef.current;
      if (!container) return;
      const gap = 16; // match 1rem gap in CSS
      const width = container.clientWidth;
      const cols = Math.max(1, Math.floor((width + gap) / (minColumnWidthPx + gap)));
      setColumnCount(maxColumns ? Math.min(cols, maxColumns) : cols);
    };
    computeColumns();
    window.addEventListener('resize', computeColumns);
    return () => window.removeEventListener('resize', computeColumns);
  }, [useFixedColumns, minColumnWidthPx, maxColumns]);

  return (
    <div
      ref={containerRef}
      className={classNames(
        'relative flex h-full min-h-0 flex-col overflow-x-hidden overflow-y-auto',
        'scrollbar-thin scrollbar-track-neutral-100 scrollbar-thumb-neutral-300 hover:scrollbar-thumb-neutral-400',
        'dark:scrollbar-track-neutral-800 dark:scrollbar-thumb-neutral-600 dark:hover:scrollbar-thumb-neutral-500',
        '[&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:rounded',
        className
      )}
    >
      {items.length === 0 && !isLoading ? (
        emptyComponent || defaultEmptyComponent
      ) : (
        <>
          {useFixedColumns ? (
            <div
              className={classNames(
                'mb-5 grid gap-4',
                columnCount === 1 && 'grid-cols-1',
                columnCount === 2 && 'grid-cols-2',
                columnCount === 3 && 'grid-cols-3',
                columnCount === 4 && 'grid-cols-4',
                columnCount >= 5 && 'grid-cols-5'
              )}
            >
              {Array.from({ length: columnCount }).map((_, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-4">
                  {items
                    .map((item, index) => ({ item, index }))
                    .filter(({ index }) => index % columnCount === colIdx)
                    .map(({ item, index }) => (
                      <div key={index} className="flex items-start justify-center">
                        {renderItem(item, index)}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ) : (
            <div
              ref={itemsContainerRef}
              className={classNames(
                'mb-[60px] grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] items-start gap-2.5 py-4',
                masonry && '[--masonry-row-height:8px] auto-rows-[var(--masonry-row-height)]'
              )}
              style={{
                gridTemplateColumns: columnTemplate,
              }}
            >
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start justify-center"
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                >
                  {renderItem(item, index)}
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (hasMore || isLoadingMore) && (
            <div
              ref={loadingRef}
              className={`flex min-h-[100px] ${!loadingComponent ? ' items-center justify-center p-8' : ''}`}
            >
              {loadingComponent || defaultLoadingComponent}
            </div>
          )}
        </>
      )}
    </div>
  );
}
