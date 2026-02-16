import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { IconButton } from '../components';

import {
  BottomSheetContextValue,
  BottomSheetControls,
  BottomSheetOptions,
  BottomSheetRenderable,
} from '../types/BottomSheetContext';

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

const TRANSITION_MS = 260;

const renderSlot = (
  slot: BottomSheetRenderable | undefined,
  controls: BottomSheetControls
): ReactNode => {
  if (!slot) {
    return null;
  }
  return typeof slot === 'function' ? slot(controls) : slot;
};

export const BottomSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sheet, setSheet] = useState<BottomSheetOptions | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const pendingCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissSheet = useCallback(() => {
    setIsVisible(false);
  }, []);

  const presentSheet = useCallback((options: BottomSheetOptions) => {
    if (pendingCloseRef.current) {
      clearTimeout(pendingCloseRef.current);
      pendingCloseRef.current = null;
    }
    setSheet(options);
    const animateIn = () => setIsVisible(true);
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(animateIn);
    } else {
      setTimeout(animateIn, 0);
    }
  }, []);

  useEffect(() => {
    if (!isVisible && sheet) {
      pendingCloseRef.current = setTimeout(() => {
        sheet.onClose?.();
        setSheet(null);
      }, TRANSITION_MS);
      return () => {
        if (pendingCloseRef.current) {
          clearTimeout(pendingCloseRef.current);
          pendingCloseRef.current = null;
        }
      };
    }
    return undefined;
  }, [isVisible, sheet]);

  useEffect(
    () => () => {
      if (pendingCloseRef.current) {
        clearTimeout(pendingCloseRef.current);
      }
    },
    []
  );

  const controls = useMemo<BottomSheetControls>(
    () => ({
      dismiss: dismissSheet,
    }),
    [dismissSheet]
  );

  const contextValue = useMemo<BottomSheetContextValue>(
    () => ({
      presentSheet,
      dismissSheet,
      isOpen: Boolean(sheet) && isVisible,
      currentSheet: sheet,
    }),
    [presentSheet, dismissSheet, sheet, isVisible]
  );

  const overlayNode =
    typeof document !== 'undefined' && sheet
      ? createPortal(
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-end justify-center">
          <div
            className={classNames(
              'absolute inset-0 bg-neutral-900/40 transition-opacity duration-300',
              isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0'
            )}
            aria-hidden="true"
            onClick={
              sheet.backdropDismiss === false
                ? undefined
                : () => {
                  dismissSheet();
                }
            }
          />
          <div className="relative w-full max-w-4xl px-4 pb-4 sm:px-8">
            <section
              role="dialog"
              aria-modal="true"
              className={classNames(
                'pointer-events-auto ml-auto flex w-full flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl transition-transform duration-300 dark:border-slate-700 dark:bg-slate-900',
                sheet.className,
                isVisible ? 'translate-y-0' : 'translate-y-full'
              )}
              style={{ minHeight: '25vh', maxHeight: '85vh' }}
            >
              <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <div className="space-y-1">
                  {sheet.title && (
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {sheet.title}
                    </div>
                  )}
                  {sheet.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      {sheet.description}
                    </p>
                  )}
                </div>
                {(sheet.showCloseButton ?? true) && (
                  <IconButton
                    icon="Close"
                    variant="ghost"
                    size="sm"
                    accent
                    aria-label="Close feedback"
                    onClick={dismissSheet}
                  />
                )}
              </header>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {renderSlot(sheet.content, controls) ?? (
                  <p className="text-sm text-slate-500">No content provided.</p>
                )}
              </div>
              {sheet.actions && (
                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
                  {renderSlot(sheet.actions, controls)}
                </div>
              )}
            </section>
          </div>
        </div>,
        document.body
      )
      : null;

  return (
    <BottomSheetContext.Provider value={contextValue}>
      {children}
      {overlayNode}
    </BottomSheetContext.Provider>
  );
};

export const useBottomSheet = () => {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error('useBottomSheet must be used within a BottomSheetProvider');
  }
  return context;
};
