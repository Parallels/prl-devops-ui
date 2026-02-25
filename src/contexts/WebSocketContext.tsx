import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { WebSocketService, type WsUrlFactory } from '../services/WebSocketService';
import { WebSocketMessage, WebSocketState } from '../types/WebSocket';

interface WebSocketContextType {
    connect: (serverId: string, urlOrFactory: WsUrlFactory) => void;
    disconnect: (serverId: string) => void;
    getState: (serverId: string) => WebSocketState;
    send: (serverId: string, type: string, payload: any) => void;
    subscribeRaw: (serverId: string, listener: (msg: WebSocketMessage, serverId: string) => void) => () => void;
    states: Record<string, WebSocketState>;
    service: WebSocketService;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
    children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const [states, setStates] = useState<Record<string, WebSocketState>>({});

    const service = WebSocketService.getInstance();

    useEffect(() => {
        const unsubscribe = service.onStateChange((serverId, newState) => {
            setStates((prev) => ({
                ...prev,
                [serverId]: newState,
            }));
        });

        return () => {
            unsubscribe();
        };
    }, [service]);

    const connect = useCallback((serverId: string, urlOrFactory: WsUrlFactory) => {
        service.connect(serverId, urlOrFactory);
    }, [service]);

    const disconnect = useCallback((serverId: string) => {
        service.disconnect(serverId);
    }, [service]);

    const send = useCallback((serverId: string, type: string, payload: any) => {
        service.send(serverId, type, payload);
    }, [service]);

    const getState = useCallback((serverId: string) => {
        return states[serverId] || WebSocketState.CLOSED;
    }, [states]);

    const subscribeRaw = useCallback(
        (serverId: string, listener: (msg: WebSocketMessage, serverId: string) => void) => {
            return service.subscribeRaw(serverId, listener);
        },
        [service]
    );

    const value: WebSocketContextType = {
        connect,
        disconnect,
        getState,
        send,
        subscribeRaw,
        states,
        service,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocketContext = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocketContext must be used within a WebSocketProvider');
    }
    return context;
};
