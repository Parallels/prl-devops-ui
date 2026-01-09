
export enum WebSocketState {
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3,
}

export interface WebSocketMessage<T = any> {
    id: string;
    event_type: string;
    timestamp: string;
    message: string;
    body: T;
}

export type WebSocketListener<T = any> = (message: WebSocketMessage<T>) => void;

export interface WebSocketSubscription {
    id: string;
    unsubscribe: () => void;
}

export interface WebSocketConfig {
    url: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}
