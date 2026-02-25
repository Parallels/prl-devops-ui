import { WebSocketConfig, WebSocketListener, WebSocketMessage, WebSocketState } from '../types/WebSocket';

const RECONNECT_DELAY_CAP_MS = 30_000;

/**
 * A static URL string **or** an async factory that returns a fresh URL before
 * every connection attempt.  Use a factory when the URL contains credentials
 * (e.g. a bearer token in the query string) that can expire — this ensures each
 * reconnect uses a valid token rather than the original stale one.
 */
export type WsUrlFactory = string | (() => Promise<string>);

export class WebSocketService {
    private static instance: WebSocketService;
    private connections: Map<string, WebSocket> = new Map();
    private connectionStates: Map<string, WebSocketState> = new Map();
    private config: WebSocketConfig;
    private listeners: Map<string, Set<WebSocketListener>> = new Map();
    private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
    private messageQueues: Map<string, string[]> = new Map();
    private stateListeners: Set<(serverId: string, state: WebSocketState) => void> = new Set();
    private rawListeners: Map<string, Set<(msg: WebSocketMessage, serverId: string) => void>> = new Map();
    private reconnectAttempts: Map<string, number> = new Map();
    /** URL factories stored per server — called fresh on every connection attempt. */
    private urlFactories: Map<string, () => Promise<string>> = new Map();
    /**
     * Set of server IDs that were disconnected intentionally via disconnect().
     * openConnection / handleClose skip reconnection for these.
     */
    private intentionalDisconnects: Set<string> = new Set();

    private constructor(config: WebSocketConfig) {
        this.config = {
            reconnectInterval: 5000,
            maxReconnectAttempts: Infinity,
            ...config,
        };
    }

    public static getInstance(config?: WebSocketConfig): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService(config || { url: '' });
        }
        return WebSocketService.instance;
    }

    /**
     * Connect to a WebSocket server.
     *
     * Pass a **factory function** `() => Promise<string>` instead of a plain URL when
     * the URL embeds short-lived credentials (bearer tokens, etc.) — the factory is
     * invoked before **every** connection attempt, including automatic reconnects, so
     * the token is always fresh.
     */
    public connect(serverId: string, urlOrFactory: WsUrlFactory): void {
        // Remove from intentional-disconnect set so reconnects are allowed again
        this.intentionalDisconnects.delete(serverId);

        // Normalise to a factory so the rest of the code is uniform
        this.urlFactories.set(
            serverId,
            typeof urlOrFactory === 'function' ? urlOrFactory : () => Promise.resolve(urlOrFactory),
        );

        const currentState = this.connectionStates.get(serverId) ?? WebSocketState.CLOSED;
        if (currentState === WebSocketState.OPEN || currentState === WebSocketState.CONNECTING) {
            return;
        }

        void this.openConnection(serverId);
    }

    public disconnect(serverId: string): void {
        // Mark as intentional BEFORE closing so openConnection/handleClose can see the flag
        this.intentionalDisconnects.add(serverId);

        // Cancel any pending reconnect timer
        const timer = this.reconnectTimers.get(serverId);
        if (timer) {
            clearTimeout(timer);
            this.reconnectTimers.delete(serverId);
        }

        const socket = this.connections.get(serverId);
        if (socket) {
            socket.onclose = null; // Prevent handleClose from firing
            socket.close();
            this.connections.delete(serverId);
        }

        this.urlFactories.delete(serverId);
        this.updateState(serverId, WebSocketState.CLOSED);
        this.reconnectAttempts.delete(serverId);
        this.messageQueues.delete(serverId);
    }

    public send(serverId: string, type: string, payload: any): void {
        const message = JSON.stringify({ type, payload, timestamp: Date.now() });
        const socket = this.connections.get(serverId);
        const state = this.connectionStates.get(serverId);

        if (state === WebSocketState.OPEN && socket) {
            socket.send(message);
        } else {
            if (!this.messageQueues.has(serverId)) {
                this.messageQueues.set(serverId, []);
            }
            this.messageQueues.get(serverId)!.push(message);
        }
    }

    public subscribe<T = any>(type: string, listener: WebSocketListener<T>, serverId?: string) {
        const wrapper: WebSocketListener<T> = (message: WebSocketMessage<T>) => {
            const messageSource = (message as any)._serverId;
            if (serverId && messageSource !== serverId) return;
            listener(message);
        };

        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)!.add(wrapper);

        return () => {
            const listeners = this.listeners.get(type);
            if (listeners) {
                listeners.delete(wrapper);
                if (listeners.size === 0) this.listeners.delete(type);
            }
        };
    }

    public subscribeRaw(serverId: string, listener: (msg: WebSocketMessage, serverId: string) => void): () => void {
        if (!this.rawListeners.has(serverId)) {
            this.rawListeners.set(serverId, new Set());
        }
        this.rawListeners.get(serverId)!.add(listener);
        return () => {
            this.rawListeners.get(serverId)?.delete(listener);
        };
    }

    public onStateChange(listener: (serverId: string, state: WebSocketState) => void) {
        this.stateListeners.add(listener);
        return () => {
            this.stateListeners.delete(listener);
        };
    }

    public getState(serverId: string): WebSocketState {
        return this.connectionStates.get(serverId) ?? WebSocketState.CLOSED;
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    /**
     * Resolve the URL via the factory (which may refresh the token), then open
     * the WebSocket.  Called both on the initial connect and on every reconnect.
     */
    private async openConnection(serverId: string): Promise<void> {
        if (this.intentionalDisconnects.has(serverId)) return;

        const factory = this.urlFactories.get(serverId);
        if (!factory) return;

        this.updateState(serverId, WebSocketState.CONNECTING);

        try {
            const url = await factory();

            // Re-check after the async token fetch in case disconnect() was called
            if (this.intentionalDisconnects.has(serverId)) {
                this.updateState(serverId, WebSocketState.CLOSED);
                return;
            }

            const socket = new WebSocket(url);
            socket.onopen    = (event) => this.handleOpen(serverId, event);
            socket.onmessage = (event) => this.handleMessage(serverId, event);
            socket.onclose   = (event) => this.handleClose(serverId, event);
            socket.onerror   = (event) => this.handleError(serverId, event);
            this.connections.set(serverId, socket);
        } catch (error) {
            // Token fetch or other pre-connect failure — schedule a retry
            console.error(`[WS] URL factory failed for ${serverId}:`, error);
            this.updateState(serverId, WebSocketState.CLOSED);
            if (!this.intentionalDisconnects.has(serverId)) {
                this.attemptReconnect(serverId);
            }
        }
    }

    private updateState(serverId: string, newState: WebSocketState) {
        this.connectionStates.set(serverId, newState);
        this.stateListeners.forEach(listener => listener(serverId, newState));
    }

    private handleOpen(serverId: string, _event: Event) {
        console.log(`[WS] Connected: ${serverId}`);
        this.updateState(serverId, WebSocketState.OPEN);
        this.reconnectAttempts.set(serverId, 0);
        this.flushMessageQueue(serverId);
    }

    private handleMessage(serverId: string, event: MessageEvent) {
        try {
            const parsed: WebSocketMessage = JSON.parse(event.data);
            (parsed as any)._serverId = serverId;

            const listeners = this.listeners.get(parsed.event_type);
            if (listeners) {
                listeners.forEach(listener => listener(parsed));
            }

            const rawListeners = this.rawListeners.get(serverId);
            if (rawListeners) {
                rawListeners.forEach(l => l(parsed, serverId));
            }
        } catch (error) {
            console.error(`[WS] Failed to parse message from ${serverId}:`, event.data);
        }
    }

    private handleClose(serverId: string, event: CloseEvent) {
        console.log(`[WS] Closed: ${serverId} (code=${event.code})`);
        this.updateState(serverId, WebSocketState.CLOSED);
        this.connections.delete(serverId);

        // Don't reconnect if this was an intentional disconnect
        if (this.intentionalDisconnects.has(serverId)) {
            this.intentionalDisconnects.delete(serverId);
            return;
        }

        this.attemptReconnect(serverId);
    }

    private handleError(serverId: string, event: Event) {
        console.error(`[WS] Error: ${serverId}`, event);
    }

    private attemptReconnect(serverId: string) {
        const maxAttempts = this.config.maxReconnectAttempts ?? Infinity;
        const attempts = this.reconnectAttempts.get(serverId) || 0;

        if (attempts >= maxAttempts) {
            console.error(`[WS] Max reconnect attempts reached for ${serverId}`);
            return;
        }

        // Don't schedule a second timer if one is already pending
        if (this.reconnectTimers.has(serverId)) return;

        const newAttempts = attempts + 1;
        this.reconnectAttempts.set(serverId, newAttempts);

        // Exponential back-off, hard-capped at RECONNECT_DELAY_CAP_MS
        const base = this.config.reconnectInterval || 5000;
        const delay = Math.min(base * Math.pow(1.5, newAttempts - 1), RECONNECT_DELAY_CAP_MS);
        console.log(`[WS] Reconnect attempt ${newAttempts} for ${serverId} in ${Math.round(delay / 1000)}s`);

        const timer = setTimeout(() => {
            this.reconnectTimers.delete(serverId);
            // openConnection calls the factory for a fresh URL/token on every attempt
            void this.openConnection(serverId);
        }, delay);

        this.reconnectTimers.set(serverId, timer);
    }

    private flushMessageQueue(serverId: string) {
        const socket = this.connections.get(serverId);
        const queue = this.messageQueues.get(serverId);
        const state = this.connectionStates.get(serverId);
        if (!socket || state !== WebSocketState.OPEN || !queue) return;

        while (queue.length > 0) {
            const message = queue.shift();
            if (message) socket.send(message);
        }
    }
}
