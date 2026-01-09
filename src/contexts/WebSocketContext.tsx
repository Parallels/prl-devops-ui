import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { WebSocketService } from '../services/WebSocketService';
import { WebSocketState } from '../types/WebSocket';

interface WebSocketContextType {
    connect: (serverId: string, url: string) => void;
    disconnect: (serverId: string) => void;
    getState: (serverId: string) => WebSocketState;
    send: (serverId: string, type: string, payload: any) => void;
    states: Record<string, WebSocketState>; // Use Record for easier React consumption
    service: WebSocketService;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
    children: ReactNode;
    // url: string; // Removed default single URL
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    // We use a Record to track states for reactivity
    const [states, setStates] = useState<Record<string, WebSocketState>>({});

    // Initialize instance once
    const service = WebSocketService.getInstance();

    useEffect(() => {
        // Subscribe to state changes
        const unsubscribe = service.onStateChange((serverId, newState) => {
            setStates((prev) => ({
                ...prev,
                [serverId]: newState,
            }));
        });

        return () => {
            unsubscribe();
            // We might not want to auto-disconnect everything on unmount if this provider 
            // is at the root, but for cleanup safety:
            // service.disconnectAll(); // If we had such a method. 
            // Ideally we let connections persist or user manages them.
        };
    }, [service]);

    const connect = useCallback((serverId: string, url: string) => {
        service.connect(serverId, url);
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

    const value: WebSocketContextType = {
        connect,
        disconnect,
        getState,
        send,
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
