import { useCallback, useMemo, useState } from "react";

export interface UseAccordionOptions {
  defaultOpenIds?: string[];
  openIds?: string[];
  multiple?: boolean;
  onChange?: (openIds: string[]) => void;
}

export interface UseAccordionResult {
  openIds: string[];
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
  open: (id: string) => void;
  close: (id: string) => void;
  setOpenIds: (ids: string[]) => void;
}

export function useAccordion({
  defaultOpenIds,
  openIds: controlledOpenIds,
  multiple = false,
  onChange,
}: UseAccordionOptions = {}): UseAccordionResult {
  const [internalOpenIds, setInternalOpenIds] = useState<string[]>(defaultOpenIds ?? []);

  const resolvedOpenIds = controlledOpenIds ?? internalOpenIds;

  const emitChange = useCallback(
    (next: string[]) => {
      if (!controlledOpenIds) {
        setInternalOpenIds(next);
      }
      onChange?.(next);
    },
    [controlledOpenIds, onChange]
  );

  const toggle = useCallback(
    (id: string) => {
      const isCurrentlyOpen = resolvedOpenIds.includes(id);

      if (isCurrentlyOpen) {
        emitChange(resolvedOpenIds.filter((item) => item !== id));
        return;
      }

      if (multiple) {
        emitChange([...resolvedOpenIds, id]);
      } else {
        emitChange([id]);
      }
    },
    [emitChange, multiple, resolvedOpenIds]
  );

  const open = useCallback(
    (id: string) => {
      if (resolvedOpenIds.includes(id)) {
        return;
      }
      if (multiple) {
        emitChange([...resolvedOpenIds, id]);
      } else {
        emitChange([id]);
      }
    },
    [emitChange, multiple, resolvedOpenIds]
  );

  const close = useCallback(
    (id: string) => {
      if (!resolvedOpenIds.includes(id)) {
        return;
      }
      emitChange(resolvedOpenIds.filter((item) => item !== id));
    },
    [emitChange, resolvedOpenIds]
  );

  const api = useMemo(
    () => ({
      openIds: resolvedOpenIds,
      isOpen: (id: string) => resolvedOpenIds.includes(id),
      toggle,
      open,
      close,
      setOpenIds: emitChange,
    }),
    [resolvedOpenIds, toggle, open, close, emitChange]
  );

  return api;
}

export default useAccordion;
