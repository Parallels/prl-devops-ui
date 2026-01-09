import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { LayoutContextValue, LayoutModal } from '@/interfaces/LayoutContext';

const DEFAULT_MODAL_STATE: Record<LayoutModal, boolean> = {
  settings: false,
  feedback: false,
  notifications: false,
};

const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

export const LayoutProvider: React.FC<PropsWithChildren<object>> = ({ children }) => {
  const [modalState, setModalStateInternal] = useState<Record<LayoutModal, boolean>>(
    DEFAULT_MODAL_STATE
  );
  const [isOverlay, setIsOverlay] = useState(false);

  const setModalState = useCallback((key: LayoutModal, isOpen: boolean) => {
    setModalStateInternal((previous) => {
      if (previous[key] === isOpen) {
        return previous;
      }
      return { ...previous, [key]: isOpen };
    });
  }, []);

  const setModalStates = useCallback((updates: Partial<Record<LayoutModal, boolean>>) => {
    setModalStateInternal((previous) => {
      let next = previous;
      (Object.entries(updates) as Array<[LayoutModal, boolean | undefined]>).forEach(
        ([key, value]) => {
          if (value === undefined || previous[key] === value) {
            return;
          }
          if (next === previous) {
            next = { ...previous };
          }
          next[key] = value;
        }
      );
      return next;
    });
  }, []);

  const openModal = useCallback(
    (key: LayoutModal) => {
      setModalState(key, true);
    },
    [setModalState]
  );

  const closeModal = useCallback(
    (key: LayoutModal) => {
      setModalState(key, false);
    },
    [setModalState]
  );

  const toggleModal = useCallback((key: LayoutModal) => {
    setModalStateInternal((previous) => ({ ...previous, [key]: !previous[key] }));
  }, []);

  const isModalOpen = useCallback(
    (key: LayoutModal) => {
      return Boolean(modalState[key]);
    },
    [modalState]
  );

  const value = useMemo<LayoutContextValue>(
    () => ({
      modals: modalState,
      isModalOpen,
      openModal,
      closeModal,
      toggleModal,
      setModalState,
      setModalStates,
      isOverlay,
      setIsOverlay,
    }),
    [
      modalState,
      isModalOpen,
      openModal,
      closeModal,
      toggleModal,
      setModalState,
      setModalStates,
      isOverlay,
    ]
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

export const useLayout = (): LayoutContextValue => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
