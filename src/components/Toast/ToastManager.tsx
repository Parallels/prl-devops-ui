import React, { useEffect, useState, useCallback } from 'react';
// import { WebSocketService } from '../../services/WebSocketService';
import { Toast } from './Toast';
import { Toast as ToastType } from '../../types/Toast';
// import { ERROR_SUBJECT, LOG_SUBJECT, NOTIFICATION_SUBJECT } from '../../constants/constants';
// import { WsErrorMessage, WsLogMessage, WsNotificationMessage } from '@/types/websocket';
// import { WsMessage } from '../../types/WSMessage';
// import { listen } from '@tauri-apps/api/event';
import toastService from '../../services/ToastService';

const TOAST_DURATION = 5000; // 5 seconds

export const ToastManager: React.FC = () => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  // Handle adding a toast to state
  const addToast = useCallback((toast: ToastType) => {
    setToasts((prev) => {
      // Check if this toast already exists (by ID)
      const existingIndex = prev.findIndex((t) => t.id === toast.id);

      if (existingIndex >= 0) {
        // Update existing toast
        const updated = [...prev];
        updated[existingIndex] = toast;
        return updated;
      } else {
        // Add new toast
        return [...prev, toast];
      }
    });
  }, []);

  // Handle removing a toast from state
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    // Inform the service that this toast has been removed from UI
    toastService.markToastRemoved(id);
  }, []);

  // Subscribe to toasts from the service
  useEffect(() => {
    const subscription = toastService.getToasts().subscribe((toast) => {
      if (!toast) return; // Ignore null values
      if (toast._remove) {
        // This is a removal signal
        removeToast(toast.id);
      } else {
        // This is an add or update signal
        addToast(toast);
      }
    });

    return () => subscription.unsubscribe();
  }, [addToast, removeToast]);

  return (
    <div className="pointer-events-none fixed top-20 right-4 z-[9999] flex w-full max-w-md flex-col gap-3 sm:right-6 lg:right-8">
      {toasts.map((toast) => {
        // Handle individual duration with proper type safety
        const duration: number =
          toast.autoClose === false
            ? 0
            : typeof toast.autoCloseDuration === 'number'
              ? toast.autoCloseDuration
              : TOAST_DURATION;

        return <Toast key={toast.id} toast={toast} onRemove={removeToast} duration={duration} />;
      })}
    </div>
  );
};
