import React, { useEffect, useState } from 'react';
import { Modal, Button, UIModalActions as ModalActions } from '../../controls';
import enableLocalNetwork from '../../assets/videos/enable_local_network.gif';
import { useNotifications } from '@/contexts/NotificationContext';

export const NotificationModal: React.FC = () => {
    const { state, closeModal } = useNotifications();
    const { activeModal } = state;
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setIsOpen(!!activeModal);
    }, [activeModal]);

    const handleClose = () => {
        closeModal();
    };

    if (!activeModal) {
        return null;
    }

    const renderContent = () => {
        if (activeModal.type === 'no_local_network') {
            return (
                <div className="flex flex-col gap-4 text-center">
                    <div className="space-y-2">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {activeModal.message || 'Please check your internet connection and try again.'}
                        </p>
                    </div>
                    <div className="flex items-center justify-center rounded-2xl bg-neutral-200 p-2 text-neutral-600 dark:bg-neutral-900/30 dark:text-neutral-400">
                        <img
                            className="rounded-xl w-auto max-h-[50vh] object-contain max-w-full"
                            src={enableLocalNetwork}
                            alt="Enable Local Network"
                        />
                    </div>
                </div>
            );
        }

        // Default/Catch-all
        return (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                <p>{activeModal.message}</p>
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={activeModal.title || 'Notification'}
            size={activeModal.size || 'sm'}
            closeOnEsc={false}
            closeOnBackdropClick={false}
            footer={
                <ModalActions align="center">
                    <Button variant="solid" color="blue" onClick={handleClose}>
                        Understood
                    </Button>
                </ModalActions>
            }
        >
            {renderContent()}
        </Modal>
    );
};
