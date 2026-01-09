
import { ToastAction } from './Toast';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'progress';

export interface NotificationState {
    notifications: Record<string, Notification[]>;
    unreadCount: Record<string, number>;
    openPanels: Record<string, boolean>;
    totalUnread: number;
    currentPage: number;
    itemsPerPage: number;
    activeModal?: NotificationModalPayload | null;
}

export interface NotificationModalPayload {
    type: string;
    title: string;
    message: string;
    state?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    data?: Record<string, unknown>;
}

export interface NotificationProgress {
    current: number;
    total: number;
    status: 'running' | 'paused' | 'completed' | 'error';
    message?: string;
    indeterminate?: boolean;
}

export interface Notification {
    id: string;
    channel: string;
    type: NotificationType;
    message: string | React.ReactNode;
    details?: string | React.ReactNode;
    timestamp: number;
    updatedAt: number;
    isRead: boolean;
    replace?: boolean; // If true, replaces existing notification with same ID instead of bumping
    actions?: ToastAction[];
    showAsToast: boolean;
    alreadyShownToast?: boolean;
    progress?: NotificationProgress;
    autoClose?: boolean;
    dismissible?: boolean;
    data?: Record<string, unknown>;
}

export interface CreateNotificationOptions {
    id?: string;
    channel?: string; // Defaults to 'global'
    type?: NotificationType; // Defaults to 'info'
    message: string | React.ReactNode;
    details?: string | React.ReactNode;
    actions?: ToastAction[];
    replace?: boolean;
    showAsToast?: boolean;
    progress?: NotificationProgress;
    autoClose?: boolean;
    dismissible?: boolean;
    data?: Record<string, unknown>;
}

export interface UpdateNotificationOptions {
    message?: string | React.ReactNode;
    details?: string | React.ReactNode;
    isRead?: boolean;
    progress?: Partial<NotificationProgress>;
    actions?: ToastAction[];
    channel?: string;
    dismissible?: boolean;
    data?: Record<string, unknown>;
}
