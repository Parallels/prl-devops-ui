
import { Toast } from '../types/Toast';

export function getToastTimestamp(toast: Toast): number {
    return toast._updateTimestamp || Date.now();
}
