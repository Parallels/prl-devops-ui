import type { MutableRefObject } from 'react';

export type QueueBootstrapMode = 'latest' | 'all';

/**
 * Drain unseen messages in FIFO order (oldest -> newest) using a stable cursor.
 * The source array is expected to be newest-first.
 */
export function drainUnseenMessages<T extends { id: string }>(
    messages: T[] | undefined,
    lastSeenIdRef: MutableRefObject<string | null>,
    bootstrapMode: QueueBootstrapMode = 'latest',
): T[] {
    if (!messages || messages.length === 0) return [];

    const lastSeenId = lastSeenIdRef.current;
    let unseenNewestFirst: T[];

    if (!lastSeenId) {
        // Avoid replaying the entire buffered history when a consumer mounts.
        unseenNewestFirst = bootstrapMode === 'all' ? messages : [messages[0]];
    } else {
        const lastSeenIndex = messages.findIndex((message) => message.id === lastSeenId);
        unseenNewestFirst = lastSeenIndex === -1 ? messages : messages.slice(0, lastSeenIndex);
    }

    lastSeenIdRef.current = messages[0].id;
    return unseenNewestFirst.slice().reverse();
}
