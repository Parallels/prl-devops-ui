import { WebSocketConfig, WebSocketListener, WebSocketMessage, WebSocketState } from '../types/WebSocket';

export class WebSocketService {
    private static instance: WebSocketService;
    private connections: Map<string, WebSocket> = new Map();
    private connectionStates: Map<string, WebSocketState> = new Map();
    private config: WebSocketConfig;
    private listeners: Map<string, Set<WebSocketListener>> = new Map();
    // private reconnectAttempts = 0; // Per-connection logic needed
    private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
    private messageQueues: Map<string, string[]> = new Map();
    private stateListeners: Set<(serverId: string, state: WebSocketState) => void> = new Set();
    private reconnectAttempts: Map<string, number> = new Map();

    private constructor(config: WebSocketConfig) {
        this.config = {
            reconnectInterval: 5000,
            maxReconnectAttempts: 10,
            ...config,
        };
    }

    public static getInstance(config?: WebSocketConfig): WebSocketService {
        if (!WebSocketService.instance) {
            // Default config if none provided, but typically should be initialized with one
            WebSocketService.instance = new WebSocketService(config || { url: '' });
        }
        return WebSocketService.instance;
    }

    public connect(serverId: string, url: string): void {
        const currentState = this.connectionStates.get(serverId) || WebSocketState.CLOSED;

        if (currentState === WebSocketState.OPEN || currentState === (WebSocketState.CONNECTING as WebSocketState)) {
            return;
        }

        this.updateState(serverId, WebSocketState.CONNECTING);

        try {
            const socket = new WebSocket(url);

            socket.onopen = (event) => this.handleOpen(serverId, event);
            socket.onmessage = (event) => this.handleMessage(serverId, event);
            socket.onclose = (event) => this.handleClose(serverId, event, url);
            socket.onerror = (event) => this.handleError(serverId, event);

            this.connections.set(serverId, socket);
        } catch (error) {
            console.error(`WebSocket connection error for ${serverId}:`, error);
            this.handleClose(serverId, { code: 1006, reason: 'Connection failed', wasClean: false } as CloseEvent, url);
        }
    }

    public disconnect(serverId: string): void {
        const socket = this.connections.get(serverId);
        if (socket) {
            socket.close();
            this.connections.delete(serverId);
        }

        const timer = this.reconnectTimers.get(serverId);
        if (timer) {
            clearTimeout(timer);
            this.reconnectTimers.delete(serverId);
        }

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
        // We wrap the listener to filter by serverId if provided, or allow all if not
        const wrapper: WebSocketListener<T> = (message: WebSocketMessage<T>) => {
            // If subscriber specified a serverId, only pass messages from that server
            // Determine source server from message (handled in handleMessage)
            // Note: WebSocketMessage needs a way to identify source. 
            // We will solve this by augmenting the message in handleMessage.
            const messageSource = (message as any)._serverId; // Internal property added during parsing

            if (serverId && messageSource !== serverId) {
                return;
            }
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
                if (listeners.size === 0) {
                    this.listeners.delete(type);
                }
            }
        };
    }

    public onStateChange(listener: (serverId: string, state: WebSocketState) => void) {
        this.stateListeners.add(listener);
        return () => {
            this.stateListeners.delete(listener);
        };
    }

    public getState(serverId: string): WebSocketState {
        return this.connectionStates.get(serverId) || WebSocketState.CLOSED;
    }

    private updateState(serverId: string, newState: WebSocketState) {
        this.connectionStates.set(serverId, newState);
        this.stateListeners.forEach(listener => listener(serverId, newState));
    }

    private handleOpen(serverId: string, _event: Event) {
        console.log(`WebSocket connected: ${serverId}`);
        this.updateState(serverId, WebSocketState.OPEN);
        this.reconnectAttempts.set(serverId, 0);
        this.flushMessageQueue(serverId);
    }

    private handleMessage(serverId: string, event: MessageEvent) {
        try {
            const parsed: WebSocketMessage = JSON.parse(event.data);
            // Augment message with source server ID for filtering
            (parsed as any)._serverId = serverId;

            const listeners = this.listeners.get(parsed.event_type);
            if (listeners) {
                listeners.forEach(listener => listener(parsed));
            }
        } catch (error) {
            console.error(`Failed to parse WebSocket message from ${serverId}:`, event.data);
        }
    }

    private handleClose(serverId: string, event: CloseEvent, url: string) {
        console.log(`WebSocket closed for ${serverId}: ${event.code} ${event.reason}`);
        this.updateState(serverId, WebSocketState.CLOSED);
        this.connections.delete(serverId);
        this.attemptReconnect(serverId, url);
    }

    private handleError(serverId: string, event: Event) {
        console.error(`WebSocket error for ${serverId}:`, event);
    }

    private attemptReconnect(serverId: string, url: string) {
        const attempts = this.reconnectAttempts.get(serverId) || 0;
        if (attempts >= (this.config.maxReconnectAttempts || 10)) {
            console.error(`Max reconnect attempts reached for ${serverId}`);
            return;
        }

        if (this.reconnectTimers.has(serverId)) return;

        const newAttempts = attempts + 1;
        this.reconnectAttempts.set(serverId, newAttempts);

        const delay = (this.config.reconnectInterval || 5000) * Math.pow(1.5, newAttempts - 1);
        console.log(`Attempting reconnect ${newAttempts} for ${serverId} in ${delay}ms`);

        const timer = setTimeout(() => {
            this.reconnectTimers.delete(serverId);
            this.connect(serverId, url);
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
            if (message) {
                socket.send(message);
            }
        }
    }
}
