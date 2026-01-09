
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { WebSocketService } from '../services/WebSocketService';
import { WebSocketState } from '../types/WebSocket';

interface WebSocketContextType {
    isConnected: boolean;
    state: WebSocketState;
    service: WebSocketService;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
    children: ReactNode;
    url: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url }) => {
    const [state, setState] = useState<WebSocketState>(WebSocketState.CLOSED);

    // Initialize instance once
    const service = WebSocketService.getInstance({ url });

    useEffect(() => {
        // Subscribe to state changes
        const unsubscribe = service.onStateChange((newState) => {
            setState(newState);
        });

        // Connect on mount
        service.connect();

        return () => {
            unsubscribe();
            service.disconnect();
        };
    }, [service]);

    const value: WebSocketContextType = {
        isConnected: state === WebSocketState.OPEN,
        state,
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
