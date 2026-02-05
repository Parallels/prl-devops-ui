import { ReactNode } from 'react';

export interface BottomSheetControls {
    dismiss: () => void;
}

export type BottomSheetRenderable = ReactNode | ((controls: BottomSheetControls) => ReactNode);

export interface BottomSheetOptions {
    id?: string;
    title?: ReactNode;
    description?: ReactNode;
    content?: BottomSheetRenderable;
    actions?: BottomSheetRenderable;
    showCloseButton?: boolean;
    backdropDismiss?: boolean;
    className?: string;
    onClose?: () => void;
}

export interface BottomSheetContextValue {
    presentSheet: (options: BottomSheetOptions) => void;
    dismissSheet: () => void;
    isOpen: boolean;
    currentSheet: BottomSheetOptions | null;
}
