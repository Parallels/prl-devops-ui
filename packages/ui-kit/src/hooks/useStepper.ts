import { useCallback, useMemo, useState } from "react";

export interface StepperState<TStep extends { id?: string }> {
  steps: TStep[];
  currentIndex: number;
  currentStepId?: string;
  progressPercent: number;
  goToIndex: (index: number) => void;
  goToStep: (id: string) => void;
  goToNext: () => void;
  goToPrev: () => void;
  isActive: (id: string, index: number) => boolean;
  isCompleted: (id: string, index: number) => boolean;
}

export interface UseStepperOptions {
  defaultCurrentIndex?: number;
  defaultCurrentStepId?: string;
  currentIndex?: number;
  currentStepId?: string;
  onChange?: (index: number, stepId?: string) => void;
  completedStepIds?: string[];
}

export function useStepper<TStep extends { id?: string }>(
  steps: TStep[],
  {
    defaultCurrentIndex = 0,
    defaultCurrentStepId,
    currentIndex,
    currentStepId,
    onChange,
    completedStepIds,
  }: UseStepperOptions = {}
): StepperState<TStep> {
  const resolveInitialIndex = useCallback(() => {
    if (typeof currentIndex === "number") {
      return currentIndex;
    }
    if (currentStepId) {
      const targetIndex = steps.findIndex((step) => step.id === currentStepId);
      if (targetIndex !== -1) {
        return targetIndex;
      }
    }
    if (defaultCurrentStepId) {
      const targetIndex = steps.findIndex((step) => step.id === defaultCurrentStepId);
      if (targetIndex !== -1) {
        return targetIndex;
      }
    }
    return Math.min(Math.max(defaultCurrentIndex, 0), Math.max(steps.length - 1, 0));
  }, [currentIndex, currentStepId, defaultCurrentIndex, defaultCurrentStepId, steps]);

  const [internalIndex, setInternalIndex] = useState(resolveInitialIndex);

  const resolvedIndex = typeof currentIndex === "number" ? currentIndex : internalIndex;

  const resolvedStepId = useMemo(() => {
    if (currentStepId) {
      return currentStepId;
    }
    const step = steps[resolvedIndex];
    return step?.id;
  }, [currentStepId, steps, resolvedIndex]);

  const emitChange = useCallback(
    (nextIndex: number) => {
      const boundedIndex = Math.min(Math.max(nextIndex, 0), Math.max(steps.length - 1, 0));
      if (typeof currentIndex !== "number") {
        setInternalIndex(boundedIndex);
      }
      const step = steps[boundedIndex];
      onChange?.(boundedIndex, step?.id);
    },
    [currentIndex, onChange, steps]
  );

  const goToIndex = useCallback(
    (index: number) => {
      emitChange(index);
    },
    [emitChange]
  );

  const goToStep = useCallback(
    (id: string) => {
      const idx = steps.findIndex((step) => step.id === id);
      if (idx !== -1) {
        emitChange(idx);
      }
    },
    [emitChange, steps]
  );

  const goToNext = useCallback(() => {
    emitChange(resolvedIndex + 1);
  }, [emitChange, resolvedIndex]);

  const goToPrev = useCallback(() => {
    emitChange(resolvedIndex - 1);
  }, [emitChange, resolvedIndex]);

  const completedSet = useMemo(() => new Set(completedStepIds ?? []), [completedStepIds]);

  const progressPercent = useMemo(() => {
    if (steps.length === 0) {
      return 0;
    }
    const baseCompleted = completedStepIds ? completedStepIds.length : Math.max(resolvedIndex, 0);

    const bounded = Math.min(baseCompleted, steps.length);
    return (bounded / steps.length) * 100;
  }, [completedStepIds, resolvedIndex, steps.length]);

  const isActive = useCallback(
    (id: string, index: number) => {
      if (currentStepId) {
        return currentStepId === id;
      }
      return resolvedIndex === index;
    },
    [currentStepId, resolvedIndex]
  );

  const isCompleted = useCallback(
    (id: string, index: number) => {
      if (completedSet.size > 0) {
        return completedSet.has(id);
      }
      return index < resolvedIndex;
    },
    [completedSet, resolvedIndex]
  );

  return {
    steps,
    currentIndex: resolvedIndex,
    currentStepId: resolvedStepId,
    progressPercent,
    goToIndex,
    goToStep,
    goToNext,
    goToPrev,
    isActive,
    isCompleted,
  };
}

export default useStepper;
