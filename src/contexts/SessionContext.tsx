import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Session data representing the current connection state.
 * This is NOT persisted - it's set on login and cleared on logout.
 * Extend this interface to add more session-related data as needed.
 */
export interface SessionData {
    // Server connection info
    serverUrl: string;
    hostname: string;

    // User info
    username: string;
    authType: 'credentials' | 'api_key';

    // Host config reference
    hostId: string;

    // Timestamps
    connectedAt: string;

    // Extend with more fields as needed:
    // userDisplayName?: string;
    // userEmail?: string;
    // userRoles?: string[];
    // serverVersion?: string;
    // features?: string[];
}

interface SessionContextType {
    /** Current session data, null if not connected */
    session: SessionData | null;

    /** Set session data on successful login */
    setSession: (data: SessionData) => void;

    /** Clear session on logout */
    clearSession: () => void;

    /** Check if there's an active session */
    isConnected: boolean;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSessionState] = useState<SessionData | null>(null);

    const setSession = useCallback((data: SessionData) => {
        console.log('[Session] Connected to', data.serverUrl);
        setSessionState(data);
    }, []);

    const clearSession = useCallback(() => {
        console.log('[Session] Disconnected');
        setSessionState(null);
    }, []);

    const value: SessionContextType = {
        session,
        setSession,
        clearSession,
        isConnected: session !== null,
    };

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = (): SessionContextType => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};
