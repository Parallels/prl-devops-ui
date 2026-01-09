import { Notification, NotificationState, NotificationModalPayload } from '../types/Notification';

export type NotificationAction =
    | { type: 'INIT_STATE'; state: NotificationState }
    | { type: 'ADD_NOTIFICATION'; notification: Notification }
    | { type: 'UPDATE_NOTIFICATION'; notification: Notification }
    | { type: 'DELETE_NOTIFICATION'; id: string; channel: string }
    | { type: 'MARK_AS_READ'; id: string; channel: string }
    | { type: 'MARK_ALL_READ'; channel?: string }
    | { type: 'CLEAR_ALL'; channel?: string }
    | { type: 'TOGGLE_PANEL'; channel?: string; open?: boolean }
    | { type: 'SET_PAGE'; page: number }
    | { type: 'REMOVE_NOTIFICATION'; channel: string; id: string }
    | { type: 'SET_ALREADY_SHOWN_TOAST'; id: string; channel: string; alreadyShownToast: boolean }
    | { type: 'OPEN_MODAL'; payload: NotificationModalPayload }
    | { type: 'CLOSE_MODAL' };

export interface NotificationContextValue {
    state: NotificationState;
    addNotification: (notification: Notification) => void;
    updateNotification: (notification: Notification) => void;
    deleteNotification: (id: string, channel: string) => void;
    markAsRead: (id: string, channel: string) => void;
    markAllAsRead: (channel?: string) => void;
    clearAll: (channel?: string) => void;
    togglePanel: (channel?: string, open?: boolean) => void;
    setPage: (page: number) => void;
    removeNotification: (channel: string, id: string) => void;
    setAlreadyShownToast: (id: string, channel: string, alreadyShownToast: boolean) => void;
    openModal: (payload: NotificationModalPayload) => void;
    closeModal: () => void;
}

export interface NotificationUpdate {
    type: 'add' | 'update' | 'delete';
    notification: Notification;
}
