
import { useEffect, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import { WebSocketListener } from '../types/WebSocket';

export const useWebSocket = (serverId: string) => {
    const { service, getState, states } = useWebSocketContext();

    const subscribe = useCallback(<T = any>(type: string, listener: WebSocketListener<T>) => {
        return service.subscribe<T>(type, listener);
    }, [service]);

    const send = useCallback((type: string, payload: any) => {
        service.send(serverId, type, payload);
    }, [service, serverId]);

    return {
        state: getState(serverId),
        states,
        subscribe,
        send,
    };
};

export const useWebSocketSubscription = <T = any>(type: string, listener: WebSocketListener<T>, serverId: string) => {
    const { subscribe } = useWebSocket(serverId);

    useEffect(() => {
        const unsubscribe = subscribe(type, listener);
        return () => {
            unsubscribe();
        };
    }, [type, listener, subscribe]);
};
