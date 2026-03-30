import { useEffect, RefObject } from 'react';

/**
 * Fires `handler` when the user clicks outside the element referenced by `ref`.
 * Pass `enabled = false` to skip attaching the listener (e.g. when a dropdown is closed).
 */
export function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T | null>,
    handler: () => void,
    enabled = true,
): void {
    useEffect(() => {
        if (!enabled) return;
        const handle = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                handler();
            }
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [ref, handler, enabled]);
}
