import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { JwtTokenPayload, Modules } from '../interfaces/tokenTypes';
import { HostHardwareInfo } from '../interfaces/devops';
import { authService } from '../services/authService';
import { decodeToken } from '../utils/tokenUtils';
import { clearActiveHostId, setActiveHostId } from '../utils/activeHost';

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

    // Decoded JWT token payload
    tokenPayload?: JwtTokenPayload;

    // Hardware info fetched at login time
    hardwareInfo?: HostHardwareInfo;
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

    /** Check if the user has a specific claim */
    hasClaim: (claim: string) => boolean;

    /** Check if the user has a specific role */
    hasRole: (role: string) => boolean;

    /** Check if the user has any of the specified claims */
    hasAnyClaim: (claims: string[]) => boolean;

    /** Check if the user has all of the specified claims */
    hasAllClaims: (claims: string[]) => boolean;

    /** Update the hardware info stored in the session (e.g. after a refresh on the Home page) */
    updateHardwareInfo: (info: HostHardwareInfo) => void;

    /**
     * Check whether a host feature module is enabled.
     *
     * Resolution order:
     *  1. `hardwareInfo.enabled_modules` array — generic list returned by newer agent versions.
     *  2. Dedicated boolean flags for well-known modules (`is_reverse_proxy_enabled`,
     *     `is_log_streaming_enabled`) — backwards-compat with older agents that do not
     *     yet populate `enabled_modules`.
     *
     * Returns `false` when no hardware info has been loaded yet.
     */
    hasModule: (module: string) => boolean;
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
        clearActiveHostId();
        setSessionState(null);
    }, []);

    // Permission checking utilities
    const hasClaim = useCallback((claim: string): boolean => {
        if (!session?.tokenPayload?.claims) {
            return false;
        }
        return session.tokenPayload.claims.includes(claim);
    }, [session]);

    const hasRole = useCallback((role: string): boolean => {
        if (!session?.tokenPayload?.roles) {
            return false;
        }
        return session.tokenPayload.roles.includes(role);
    }, [session]);

    const hasAnyClaim = useCallback((claims: string[]): boolean => {
        if (!session?.tokenPayload?.claims) {
            return false;
        }
        return claims.some(claim => session.tokenPayload!.claims.includes(claim));
    }, [session]);

    const updateHardwareInfo = useCallback((info: HostHardwareInfo) => {
        setSessionState((prev) => prev ? { ...prev, hardwareInfo: info } : prev);
    }, []);

    const hasModule = useCallback((module: string): boolean => {
        const hw = session?.hardwareInfo;
        if (!hw) return false;

        // 1. Generic enabled_modules list (preferred — newer agent versions)
        if (hw.enabled_modules?.includes(module)) return true;

        // 2. Dedicated boolean flags (backwards-compat with older agents)
        if (module === Modules.REVERSE_PROXY && hw.is_reverse_proxy_enabled) return true;

        return false;
    }, [session]);

    const hasAllClaims = useCallback((claims: string[]): boolean => {
        if (!session?.tokenPayload?.claims) {
            return false;
        }
        return claims.every(claim => session.tokenPayload!.claims.includes(claim));
    }, [session]);

    // Keep a ref so the subscription always sees the current session without
    // needing to re-subscribe every time the session changes.
    const sessionRef = useRef(session);
    sessionRef.current = session;

    useEffect(() => {
        const sub = authService.onTokenRefreshed$.subscribe(({ hostname, token }) => {
            if (hostname !== sessionRef.current?.hostname) return;
            const newPayload = decodeToken(token) ?? undefined;
            if (!newPayload) return;
            console.log('[Session] Token refreshed — updating claims/roles');
            setSessionState((prev) => prev ? { ...prev, tokenPayload: newPayload } : prev);
        });
        return () => sub.unsubscribe();
    }, []);

    useEffect(() => {
        if (session?.hostId) setActiveHostId(session.hostId);
    }, [session?.hostId]);

    const value: SessionContextType = useMemo(() => ({
        session,
        setSession,
        clearSession,
        isConnected: session !== null,
        hasClaim,
        hasRole,
        hasAnyClaim,
        hasAllClaims,
        updateHardwareInfo,
        hasModule,
    }), [session, setSession, clearSession, hasClaim, hasRole, hasAnyClaim, hasAllClaims, updateHardwareInfo, hasModule]);

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
