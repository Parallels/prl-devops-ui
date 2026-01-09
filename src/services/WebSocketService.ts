
import { WebSocketConfig, WebSocketListener, WebSocketMessage, WebSocketState } from '../types/WebSocket';

export class WebSocketService {
    private static instance: WebSocketService;
    private socket: WebSocket | null = null;
    private config: WebSocketConfig;
    private listeners: Map<string, Set<WebSocketListener>> = new Map();
    private reconnectAttempts = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private messageQueue: string[] = [];
    private stateListeners: Set<(state: WebSocketState) => void> = new Set();

    private _state: WebSocketState = WebSocketState.CLOSED;

    private constructor(config: WebSocketConfig) {
        this.config = {
            reconnectInterval: 5000,
            maxReconnectAttempts: 10,
            ...config,
        };
    }

    public static getInstance(config?: WebSocketConfig): WebSocketService {
        if (!WebSocketService.instance) {
            if (!config) {
                throw new Error('WebSocketService must be initialized with config first');
            }
            WebSocketService.instance = new WebSocketService(config);
        }
        return WebSocketService.instance;
    }

    public connect(): void {
        if (this._state === WebSocketState.OPEN || this._state === WebSocketState.CONNECTING) {
            return;
        }

        this.updateState(WebSocketState.CONNECTING);

        try {
            this.socket = new WebSocket(this.config.url);

            this.socket.onopen = this.handleOpen.bind(this);
            this.socket.onmessage = this.handleMessage.bind(this);
            this.socket.onclose = this.handleClose.bind(this);
            this.socket.onerror = this.handleError.bind(this);
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.handleClose({ code: 1006, reason: 'Connection failed', wasClean: false } as CloseEvent);
        }
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.close();
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.updateState(WebSocketState.CLOSED);
    }

    public send(type: string, payload: any): void {
        const message = JSON.stringify({ type, payload, timestamp: Date.now() });

        if (this._state === WebSocketState.OPEN && this.socket) {
            this.socket.send(message);
        } else {
            this.messageQueue.push(message);
        }
    }

    public subscribe<T = any>(type: string, listener: WebSocketListener<T>) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)!.add(listener);

        return () => {
            const listeners = this.listeners.get(type);
            if (listeners) {
                listeners.delete(listener);
                if (listeners.size === 0) {
                    this.listeners.delete(type);
                }
            }
        };
    }

    public onStateChange(listener: (state: WebSocketState) => void) {
        this.stateListeners.add(listener);
        return () => {
            this.stateListeners.delete(listener);
        };
    }

    public get state(): WebSocketState {
        return this._state;
    }

    private updateState(newState: WebSocketState) {
        this._state = newState;
        this.stateListeners.forEach(listener => listener(newState));
    }

    private handleOpen(_event: Event) {
        console.log('WebSocket connected');
        this.updateState(WebSocketState.OPEN);
        this.reconnectAttempts = 0;
        this.flushMessageQueue();
    }

    private handleMessage(event: MessageEvent) {
        try {
            const parsed: WebSocketMessage = JSON.parse(event.data);
            const listeners = this.listeners.get(parsed.event_type);
            if (listeners) {
                listeners.forEach(listener => listener(parsed));
            }
            // logic for wildcards or global listeners can go here
        } catch (error) {
            console.error('Failed to parse WebSocket message:', event.data);
        }
    }

    private handleClose(event: CloseEvent) {
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);
        this.updateState(WebSocketState.CLOSED);
        this.socket = null;
        this.attemptReconnect();
    }

    private handleError(event: Event) {
        console.error('WebSocket error:', event);
        // Error will usually trigger close as well
    }

    private attemptReconnect() {
        if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
            console.error('Max reconnect attempts reached');
            return;
        }

        if (this.reconnectTimer) return;

        this.reconnectAttempts++;
        const delay = (this.config.reconnectInterval || 5000) * Math.pow(1.5, this.reconnectAttempts - 1);
        console.log(`Attempting reconnect ${this.reconnectAttempts} in ${delay}ms`);

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, delay);
    }

    private flushMessageQueue() {
        if (!this.socket || this._state !== WebSocketState.OPEN) return;

        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (message) {
                this.socket.send(message);
            }
        }
    }
}
