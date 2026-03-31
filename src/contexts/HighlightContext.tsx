import React, { createContext, useCallback, useContext, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

export type HighlightState = 'success' | 'warning' | 'info' | 'error';

export interface HighlightEntry {
  id: string;
  /** Page identifier, e.g. 'vms', 'hosts', 'catalogs'. Matches the URL path segment. */
  pageId: string;
  /** SideMenu slug to badge, e.g. 'vms', 'hosts'. Omit for navigation-only highlights. */
  menuItemId?: string;
  /** SplitView item ID to highlight, e.g. 'orchestrator', 'local'. */
  itemId?: string;
  /** Table row ID to highlight, e.g. vm.ID or host.id. */
  recordId?: string;
  /** Determines the badge / pulsing indicator color. */
  state: HighlightState;
  createdAt: number;
}

export interface HighlightFilter {
  id?: string;
  pageId?: string;
  menuItemId?: string;
  itemId?: string;
  recordId?: string;
}

export interface MenuBadgeInfo {
  count: number;
  state: HighlightState;
}

// ── Context ────────────────────────────────────────────────────────────────

interface HighlightContextValue {
  highlights: HighlightEntry[];
  /**
   * Add a new highlight entry. Returns the generated entry id.
   */
  addHighlight(entry: Omit<HighlightEntry, 'id' | 'createdAt'>): string;
  /**
   * Remove a single entry by its id.
   */
  clearHighlight(id: string): void;
  /**
   * Remove all entries where every specified field in `filter` matches.
   * Fields absent from `filter` are ignored (AND semantics).
   *
   * Examples:
   *   clearHighlights({ pageId: 'hosts' })                     → removes all hosts entries
   *   clearHighlights({ pageId: 'vms', recordId: vmId })       → removes vms entries with that recordId
   *   clearHighlights({ menuItemId: 'catalogs' })              → removes all catalog menu entries
   */
  clearHighlights(filter: HighlightFilter): void;
  /**
   * Get all entries for a given pageId.
   */
  getPageHighlights(pageId: string): HighlightEntry[];
  /**
   * Get badge info (count + highest-priority state) for a menu item.
   * Returns null when there are no entries for that menuItemId.
   * Priority order: error > warning > info > success.
   */
  getMenuBadgeInfo(menuItemId: string): MenuBadgeInfo | null;
}

const HighlightContext = createContext<HighlightContextValue | null>(null);

// ── Priority ───────────────────────────────────────────────────────────────

const STATE_PRIORITY_ORDER: HighlightState[] = ['error', 'warning', 'info', 'success'];

// ── ID generation ──────────────────────────────────────────────────────────

let _counter = 0;
function genId(): string {
  return `hl-${Date.now()}-${++_counter}`;
}

// ── Provider ───────────────────────────────────────────────────────────────

export const HighlightProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highlights, setHighlights] = useState<HighlightEntry[]>([]);

  const addHighlight = useCallback((entry: Omit<HighlightEntry, 'id' | 'createdAt'>): string => {
    const id = genId();
    setHighlights((prev) => [...prev, { ...entry, id, createdAt: Date.now() }]);
    return id;
  }, []);

  const clearHighlight = useCallback((id: string) => {
    setHighlights((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearHighlights = useCallback((filter: HighlightFilter) => {
    const filterKeys = (Object.keys(filter) as (keyof HighlightFilter)[]).filter((k) => filter[k] !== undefined);
    if (filterKeys.length === 0) return;

    setHighlights((prev) =>
      prev.filter((entry) => {
        // Keep the entry if any specified filter field does NOT match (AND semantics: remove only when all match)
        return !filterKeys.every((key) => entry[key] === filter[key]);
      }),
    );
  }, []);

  const getPageHighlights = useCallback((pageId: string): HighlightEntry[] => highlights.filter((e) => e.pageId === pageId), [highlights]);

  const getMenuBadgeInfo = useCallback(
    (menuItemId: string): MenuBadgeInfo | null => {
      const matching = highlights.filter((e) => e.menuItemId === menuItemId);
      if (matching.length === 0) return null;

      const topState = STATE_PRIORITY_ORDER.find((s) => matching.some((e) => e.state === s)) ?? 'success';
      return { count: matching.length, state: topState };
    },
    [highlights],
  );

  return (
    <HighlightContext.Provider value={{ highlights, addHighlight, clearHighlight, clearHighlights, getPageHighlights, getMenuBadgeInfo }}>
      {children}
    </HighlightContext.Provider>
  );
};

// ── Hook ───────────────────────────────────────────────────────────────────

export const useHighlight = (): HighlightContextValue => {
  const ctx = useContext(HighlightContext);
  if (!ctx) throw new Error('useHighlight must be used within HighlightProvider');
  return ctx;
};
