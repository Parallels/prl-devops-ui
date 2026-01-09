
import { useEffect, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import { WebSocketListener } from '../types/WebSocket';

export const useWebSocket = () => {
    const { service, isConnected, state } = useWebSocketContext();

    const subscribe = useCallback(<T = any>(type: string, listener: WebSocketListener<T>) => {
        return service.subscribe<T>(type, listener);
    }, [service]);

    const send = useCallback((type: string, payload: any) => {
        service.send(type, payload);
    }, [service]);

    return {
        isConnected,
        state,
        subscribe,
        send,
    };
};

export const useWebSocketSubscription = <T = any>(type: string, listener: WebSocketListener<T>) => {
    const { subscribe } = useWebSocket();

    useEffect(() => {
        const unsubscribe = subscribe(type, listener);
        return () => {
            unsubscribe();
        };
    }, [type, listener, subscribe]);
};
