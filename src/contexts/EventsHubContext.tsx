import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSession } from './SessionContext';
import { useWebSocketContext } from './WebSocketContext';
import { WebSocketState, type WebSocketMessage } from '../types/WebSocket';
import { authService } from '../services/authService';

export const EVENTS_HUB_SERVER_ID = 'events-hub';
const WS_EVENT_TYPES = 'pdfm,health,orchestrator,stats,system_logs,reverse_proxy';
const DEFAULT_LIMIT = 500;
const HOST_STATS_LIMIT = 60; // ~1 min of data at 1-second intervals
const HOST_LOGS_LIMIT = 100;
const REVERSE_PROXY_LIMIT = 100;

export interface HostLogEntry {
    id: string;
    ts: number;
    level: string;
    message: string;
    time: string;
}

export interface HostStatsPoint {
    ts: number;
    cpu_system_seconds: number;
    cpu_user_seconds: number;
    goroutines: number;
    memory_bytes: number;
}

const SUBSCRIBED_TYPES = WS_EVENT_TYPES.split(',').map((s) => s.trim());

// ---------------------------------------------------------------------------
// Reverse proxy event types
// ---------------------------------------------------------------------------

export interface ReverseProxyHttpBody {
    traffic_type: 'http';
    reverse_proxy_host_id: string;
    target_vm_id?: string;
    target_host?: string;
    target_port?: string;
    path?: string;
    internal_ip_address?: string;
    method?: string;
}

export interface ReverseProxyTcpBody {
    traffic_type: 'tcp';
    reverse_proxy_host_id: string;
    source_ip?: string;
    target_host?: string;
    internal_ip_address?: string;
}

export interface ReverseProxyRouteBody {
    traffic_type?: undefined;
    reverse_proxy_host_id: string;
    target_vm_id?: string;
}

export type ReverseProxyBody = ReverseProxyHttpBody | ReverseProxyTcpBody | ReverseProxyRouteBody;

export interface ReverseProxyEventEntry {
    /** Unique id for this entry */
    id: string;
    /** When this entry was received (ms epoch) */
    ts: number;
    /** The message string from the event (e.g. "HTTP Traffic Forwarded") */
    message: string;
    /** The parsed body of the event */
    body: ReverseProxyBody;
}

export interface EventsHubMessage {
    id: string;
    receivedAt: number;
    /** The hostname of the host that emitted this message */
    hostname: string;
    raw: WebSocketMessage;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type ContainerEntry = { messages: EventsHubMessage[]; limit: number };
type ContainersState = Record<string, ContainerEntry>;

type Action =
    | { type: 'ADD'; key: string; msg: EventsHubMessage }
    | { type: 'SET_LIMIT'; key: string; limit: number }
    | { type: 'CLEAR'; key: string }
    | { type: 'CLEAR_ALL' };

function initialContainers(): ContainersState {
    return Object.fromEntries(
        [...SUBSCRIBED_TYPES, '_other'].map((k) => [k, { messages: [], limit: DEFAULT_LIMIT }])
    );
}

// ---------------------------------------------------------------------------
// Host stats reducer — separate from message containers so that high-frequency
// stat updates (1/s per host) don't flood the orchestrator container.
// ---------------------------------------------------------------------------

type HostStatsState = Record<string, HostStatsPoint[]>;
type HostStatsAction =
    | { type: 'ADD_STAT'; hostId: string; point: HostStatsPoint }
    | { type: 'CLEAR_ALL' };

function hostStatsReducer(state: HostStatsState, action: HostStatsAction): HostStatsState {
    switch (action.type) {
        case 'ADD_STAT': {
            const prev = state[action.hostId] ?? [];
            const next = [...prev, action.point];
            return {
                ...state,
                [action.hostId]: next.length > HOST_STATS_LIMIT ? next.slice(-HOST_STATS_LIMIT) : next,
            };
        }
        case 'CLEAR_ALL':
            return {};
    }
}

// ---------------------------------------------------------------------------
// Host logs reducer — rolling buffer of the last 100 log lines per host.
// ---------------------------------------------------------------------------

type HostLogsState = Record<string, HostLogEntry[]>;
type HostLogsAction =
    | { type: 'ADD_LOG'; hostId: string; entry: HostLogEntry }
    | { type: 'CLEAR_ALL' };

function hostLogsReducer(state: HostLogsState, action: HostLogsAction): HostLogsState {
    switch (action.type) {
        case 'ADD_LOG': {
            const prev = state[action.hostId] ?? [];
            const next = [...prev, action.entry];
            return {
                ...state,
                [action.hostId]: next.length > HOST_LOGS_LIMIT ? next.slice(-HOST_LOGS_LIMIT) : next,
            };
        }
        case 'CLEAR_ALL':
            return {};
    }
}

// ---------------------------------------------------------------------------
// Reverse proxy events reducer — rolling buffer of last 100 events
// per reverse_proxy_host_id.
// ---------------------------------------------------------------------------

type ReverseProxyState = Record<string, ReverseProxyEventEntry[]>;
type ReverseProxyAction =
    | { type: 'ADD_RP_EVENT'; hostId: string; entry: ReverseProxyEventEntry }
    | { type: 'CLEAR_ALL' };

function reverseProxyReducer(state: ReverseProxyState, action: ReverseProxyAction): ReverseProxyState {
    switch (action.type) {
        case 'ADD_RP_EVENT': {
            const prev = state[action.hostId] ?? [];
            const next = [...prev, action.entry];
            return {
                ...state,
                [action.hostId]: next.length > REVERSE_PROXY_LIMIT ? next.slice(-REVERSE_PROXY_LIMIT) : next,
            };
        }
        case 'CLEAR_ALL':
            return {};
    }
}

function containersReducer(state: ContainersState, action: Action): ContainersState {
    switch (action.type) {
        case 'ADD': {
            const knownKey = action.key in state ? action.key : '_other';
            const container = state[knownKey];
            const next = [action.msg, ...container.messages];
            return {
                ...state,
                [knownKey]: {
                    ...container,
                    messages: next.length > container.limit ? next.slice(0, container.limit) : next,
                },
            };
        }
        case 'SET_LIMIT': {
            const c = state[action.key];
            if (!c) return state;
            const msgs = c.messages.length > action.limit ? c.messages.slice(0, action.limit) : c.messages;
            return { ...state, [action.key]: { messages: msgs, limit: action.limit } };
        }
        case 'CLEAR': {
            const c = state[action.key];
            if (!c) return state;
            return { ...state, [action.key]: { ...c, messages: [] } };
        }
        case 'CLEAR_ALL':
            return Object.fromEntries(
                Object.entries(state).map(([k, v]) => [k, { ...v, messages: [] }])
            );
    }
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface EventsHubContextType {
    containerMessages: Record<string, EventsHubMessage[]>;
    allMessages: EventsHubMessage[];
    messages: EventsHubMessage[];
    messageCount: number;
    containerLimits: Record<string, number>;
    setContainerLimit: (key: string, limit: number) => void;
    clearContainer: (key: string) => void;
    clearAllContainers: () => void;
    clearMessages: () => void;
    isConnected: boolean;
    connectionState: WebSocketState;
    /** Per-host rolling buffers of HOST_STATS_UPDATE data points (newest last). */
    hostStats: Record<string, HostStatsPoint[]>;
    /** Per-host rolling buffers of the last 100 HOST_LOGS_UPDATE lines (oldest first). */
    hostLogs: Record<string, HostLogEntry[]>;
    /** Per-reverse-proxy-host rolling buffers of the last 100 reverse proxy events (oldest first). */
    reverseProxyEvents: Record<string, ReverseProxyEventEntry[]>;
}

const EventsHubContext = createContext<EventsHubContextType | null>(null);

export const EventsHubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session, isConnected: isSessionConnected } = useSession();
    const { connect, disconnect, service } = useWebSocketContext();
    const [containers, dispatch] = useReducer(containersReducer, undefined, initialContainers);
    const [hostStats, dispatchHostStats] = useReducer(hostStatsReducer, {});
    const [hostLogs, dispatchHostLogs] = useReducer(hostLogsReducer, {});
    const [reverseProxyEvents, dispatchReverseProxy] = useReducer(reverseProxyReducer, {});
    const [connectionState, setConnectionState] = useState<WebSocketState>(WebSocketState.CLOSED);

    // Always-current hostname for the subscribeRaw closure (avoids stale closure)
    const hostnameRef = useRef<string>('');
    hostnameRef.current = session?.hostname ?? '';

    // -----------------------------------------------------------------------
    // Async helper: obtain a **fresh** token and build the WS URL.
    // -----------------------------------------------------------------------
    const buildWsUrl = useCallback(async (hostname: string, serverUrl: string): Promise<string> => {
        const effectiveUrl = serverUrl || window.location.origin;
        const token = await authService.forceReauth(hostname, effectiveUrl);
        const base = effectiveUrl.replace(/^http/, 'ws').replace(/\/$/, '');
        return `${base}/api/v1/ws/subscribe?event_types=${WS_EVENT_TYPES}&authorization=${encodeURIComponent(token)}`;
    }, []);

    // -----------------------------------------------------------------------
    // Clear all containers whenever the active hostname changes
    // -----------------------------------------------------------------------
    const prevHostnameRef = useRef<string | undefined>(undefined);
    useEffect(() => {
        const newHostname = session?.hostname;
        if (prevHostnameRef.current !== undefined && prevHostnameRef.current !== newHostname) {
            dispatch({ type: 'CLEAR_ALL' });
            dispatchHostStats({ type: 'CLEAR_ALL' });
            dispatchHostLogs({ type: 'CLEAR_ALL' });
            dispatchReverseProxy({ type: 'CLEAR_ALL' });
        }
        prevHostnameRef.current = newHostname;
    }, [session?.hostname]);

    // -----------------------------------------------------------------------
    // Connect / disconnect driven by session lifecycle.
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!isSessionConnected || !session) {
            disconnect(EVENTS_HUB_SERVER_ID);
            dispatch({ type: 'CLEAR_ALL' });
            dispatchHostStats({ type: 'CLEAR_ALL' });
            dispatchHostLogs({ type: 'CLEAR_ALL' });
            dispatchReverseProxy({ type: 'CLEAR_ALL' });
            return;
        }

        const { hostname, serverUrl } = session;
        connect(EVENTS_HUB_SERVER_ID, () => buildWsUrl(hostname, serverUrl));

        return () => {
            disconnect(EVENTS_HUB_SERVER_ID);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSessionConnected, session?.hostname, session?.serverUrl, buildWsUrl]);

    // -----------------------------------------------------------------------
    // Track connection state changes from the service
    // -----------------------------------------------------------------------
    useEffect(() => {
        const unsub = service.onStateChange((serverId, state) => {
            if (serverId === EVENTS_HUB_SERVER_ID) {
                setConnectionState(state);
            }
        });
        return unsub;
    }, [service]);

    // -----------------------------------------------------------------------
    // Route incoming messages into per-type containers
    // -----------------------------------------------------------------------
    useEffect(() => {
        const unsub = service.subscribeRaw(EVENTS_HUB_SERVER_ID, (msg) => {
            const entry: EventsHubMessage = {
                id: msg.id || crypto.randomUUID(),
                receivedAt: Date.now(),
                hostname: hostnameRef.current,
                raw: msg,
            };

            // HOST_STATS_UPDATE messages are high-frequency (1/s per host).
            // Route them into the per-host stats store and skip the general
            // containers to avoid flooding the orchestrator container.
            if (msg.event_type === 'orchestrator' && msg.message === 'HOST_STATS_UPDATE') {
                const body = msg.body as { host_id?: string; stats?: Partial<HostStatsPoint> } | undefined;
                if (body?.host_id && body?.stats) {
                    dispatchHostStats({
                        type: 'ADD_STAT',
                        hostId: body.host_id,
                        point: {
                            ts: entry.receivedAt,
                            cpu_system_seconds: body.stats.cpu_system_seconds ?? 0,
                            cpu_user_seconds: body.stats.cpu_user_seconds ?? 0,
                            goroutines: body.stats.goroutines ?? 0,
                            memory_bytes: body.stats.memory_bytes ?? 0,
                        },
                    });
                }
                return;
            }

            // HOST_LOGS_UPDATE — route into per-host log buffer, skip general containers.
            if (msg.event_type === 'orchestrator' && msg.message === 'HOST_LOGS_UPDATE') {
                const body = msg.body as { host_id?: string; log?: { level?: string; message?: string; time?: string } } | undefined;
                if (body?.host_id && body?.log) {
                    dispatchHostLogs({
                        type: 'ADD_LOG',
                        hostId: body.host_id,
                        entry: {
                            id: entry.id,
                            ts: entry.receivedAt,
                            level: (body.log.level ?? 'info').toLowerCase(),
                            message: body.log.message ?? '',
                            time: body.log.time ?? new Date(entry.receivedAt).toISOString(),
                        },
                    });
                }
                return;
            }

            // HOST_REVERSE_PROXY_EVENT — orchestrator wraps a reverse_proxy event.
            // Unwrap the inner event and route it into the per-host RP buffer,
            // then fall through so the general container also receives it.
            if (msg.event_type === 'orchestrator' && msg.message === 'HOST_REVERSE_PROXY_EVENT') {
                const body = msg.body as { host_id?: string; event?: { message?: string; body?: ReverseProxyBody } } | undefined;
                const innerBody = body?.event?.body;
                const hostId = innerBody?.reverse_proxy_host_id;
                if (hostId && innerBody) {
                    dispatchReverseProxy({
                        type: 'ADD_RP_EVENT',
                        hostId,
                        entry: {
                            id: entry.id,
                            ts: entry.receivedAt,
                            message: body?.event?.message ?? '',
                            body: innerBody,
                        },
                    });
                }
                // fall through to general container dispatch
            }

            // Direct reverse_proxy event — also feed the per-host RP buffer,
            // then fall through so the general container receives it.
            if (msg.event_type === 'reverse_proxy') {
                const body = msg.body as ReverseProxyBody | undefined;
                const hostId = body?.reverse_proxy_host_id;
                if (hostId && body) {
                    dispatchReverseProxy({
                        type: 'ADD_RP_EVENT',
                        hostId,
                        entry: {
                            id: entry.id,
                            ts: entry.receivedAt,
                            message: msg.message ?? '',
                            body,
                        },
                    });
                }
                // fall through to general container dispatch
            }

            dispatch({ type: 'ADD', key: msg.event_type ?? '_other', msg: entry });
        });
        return unsub;
    }, [service]);

    // -----------------------------------------------------------------------
    // Stable derived values
    // -----------------------------------------------------------------------
    const containerMessages = useMemo<Record<string, EventsHubMessage[]>>(
        () => Object.fromEntries(Object.entries(containers).map(([k, v]) => [k, v.messages])),
        [containers]
    );

    const containerLimits = useMemo<Record<string, number>>(
        () => Object.fromEntries(Object.entries(containers).map(([k, v]) => [k, v.limit])),
        [containers]
    );

    // Merged newest-first view across all containers
    const allMessages = useMemo<EventsHubMessage[]>(() => {
        const all = Object.values(containers).flatMap((c) => c.messages);
        return all.sort((a, b) => b.receivedAt - a.receivedAt);
    }, [containers]);

    const setContainerLimit = useCallback((key: string, limit: number) => {
        dispatch({ type: 'SET_LIMIT', key, limit });
    }, []);

    const clearContainer = useCallback((key: string) => {
        dispatch({ type: 'CLEAR', key });
    }, []);

    const clearAllContainers = useCallback(() => {
        dispatch({ type: 'CLEAR_ALL' });
    }, []);

    const value = useMemo<EventsHubContextType>(() => ({
        containerMessages,
        allMessages,
        messages: allMessages,
        messageCount: allMessages.length,
        containerLimits,
        setContainerLimit,
        clearContainer,
        clearAllContainers,
        clearMessages: clearAllContainers,
        isConnected: connectionState === WebSocketState.OPEN,
        connectionState,
        hostStats,
        hostLogs,
        reverseProxyEvents,
    }), [containerMessages, allMessages, containerLimits, setContainerLimit, clearContainer, clearAllContainers, connectionState, hostStats, hostLogs, reverseProxyEvents]);

    return (
        <EventsHubContext.Provider value={value}>
            {children}
        </EventsHubContext.Provider>
    );
};

export const useEventsHub = (): EventsHubContextType => {
    const ctx = useContext(EventsHubContext);
    if (!ctx) throw new Error('useEventsHub must be used within EventsHubProvider');
    return ctx;
};

/** Returns the rolling stats buffer for a specific host (oldest → newest). */
export function useHostStats(hostId: string): HostStatsPoint[] {
    const { hostStats } = useEventsHub();
    return hostStats[hostId] ?? [];
}

/** Returns the rolling log buffer for a specific host (oldest → newest, max 100). */
export function useHostLogs(hostId: string): HostLogEntry[] {
    const { hostLogs } = useEventsHub();
    return hostLogs[hostId] ?? [];
}

/** Returns the rolling reverse-proxy event buffer for a specific reverse_proxy_host_id (oldest → newest, max 100). */
export function useReverseProxyEvents(reverseProxyHostId: string): ReverseProxyEventEntry[] {
    const { reverseProxyEvents } = useEventsHub();
    return reverseProxyEvents[reverseProxyHostId] ?? [];
}

/** Returns a map of all known reverse proxy host IDs → their event buffers. */
export function useAllReverseProxyEvents(): Record<string, ReverseProxyEventEntry[]> {
    const { reverseProxyEvents } = useEventsHub();
    return reverseProxyEvents;
}
