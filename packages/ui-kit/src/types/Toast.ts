import { type IconName } from "../icons/registry";
import React from "react";

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface ToastAction {
    label: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    icon?: IconName;
    customIcon?: React.ReactNode;
}

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
    description?: string;
    icon?: IconName;
    details?: React.ReactNode;
    actions?: ToastAction[];
    channel?: string;
    timestamp: number;
    isRead?: boolean;
    updatedAt?: number;
    _updateTimestamp?: number;
}

