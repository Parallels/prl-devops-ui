export type LayoutModal =
    | 'settings'
    | 'feedback'
    | 'notifications';

export interface LayoutContextValue {
    modals: Record<LayoutModal, boolean>;
    isModalOpen: (key: LayoutModal) => boolean;
    openModal: (key: LayoutModal) => void;
    closeModal: (key: LayoutModal) => void;
    toggleModal: (key: LayoutModal) => void;
    setModalState: (key: LayoutModal, isOpen: boolean) => void;
    setModalStates: (updates: Partial<Record<LayoutModal, boolean>>) => void;
    isOverlay: boolean;
    setIsOverlay: (value: boolean) => void;
}
