
export interface ToastAction {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    data?: Record<string, unknown>;
    keepOpen?: boolean;
    icon?: string;
    customIcon?: React.ReactNode;
}

export interface ToastProgress {
    percent: number;
    status: 'running' | 'paused' | 'completed' | 'error';
    indeterminate?: boolean;
}

export interface Toast {
    id: string;
    message: string | React.ReactNode;
    details?: string | React.ReactNode;
    type: 'info' | 'success' | 'warning' | 'error';
    actions?: ToastAction[];
    autoClose?: boolean;
    autoCloseDuration?: number;
    progress?: ToastProgress;
    label?: string;
    showIcon?: boolean;
    _remove?: boolean;
    _updateTimestamp?: number;
}
