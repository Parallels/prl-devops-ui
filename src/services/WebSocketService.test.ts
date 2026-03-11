import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketService } from './WebSocketService';
import { WebSocketState } from '../types/WebSocket';

// ── Mock WebSocket ────────────────────────────────────────────────────────────

const mockWebSocket = {
    send: vi.fn(),
    close: vi.fn(),
    onopen: null as ((e: Event) => void) | null,
    onmessage: null as ((e: MessageEvent) => void) | null,
    onclose: null as ((e: CloseEvent) => void) | null,
    onerror: null as ((e: Event) => void) | null,
};

const constructionSpy = vi.fn();

class MockWebSocket {
    constructor(url: string) {
        constructionSpy(url);
        // Copy handlers back to mockWebSocket so tests can trigger them
        Object.assign(mockWebSocket, {
            send: vi.fn(),
            close: vi.fn(),
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null,
        });
        return mockWebSocket;
    }
}

vi.stubGlobal('WebSocket', MockWebSocket);

// ── Helpers ───────────────────────────────────────────────────────────────────

const SERVER_ID = 'test-server';
const WS_URL = 'ws://test.com';

/** Flush all pending microtasks (lets async openConnection finish) */
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WebSocketService', () => {
    let service: WebSocketService;

    beforeEach(() => {
        (WebSocketService as any).instance = null;
        service = WebSocketService.getInstance();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize with CLOSED state', () => {
        expect(service.getState(SERVER_ID)).toBe(WebSocketState.CLOSED);
    });

    it('should connect and create a WebSocket with the given URL', async () => {
        service.connect(SERVER_ID, WS_URL);
        await flush();
        expect(constructionSpy).toHaveBeenCalledWith(WS_URL);
    });

    it('should set state to CONNECTING while the connection is being established', async () => {
        // Capture state synchronously after the promise resolves but before onopen fires
        let stateAfterConnect: WebSocketState | undefined;
        service.connect(SERVER_ID, WS_URL);
        await flush();
        stateAfterConnect = service.getState(SERVER_ID);
        expect(stateAfterConnect).toBe(WebSocketState.CONNECTING);
    });

    it('should set state to OPEN after the open event fires', async () => {
        service.connect(SERVER_ID, WS_URL);
        await flush();
        mockWebSocket.onopen?.({} as Event);
        expect(service.getState(SERVER_ID)).toBe(WebSocketState.OPEN);
    });

    it('should send a message immediately when the connection is OPEN', async () => {
        service.connect(SERVER_ID, WS_URL);
        await flush();
        mockWebSocket.onopen?.({} as Event);

        service.send(SERVER_ID, 'TEST_EVENT', { data: 123 });

        expect(mockWebSocket.send).toHaveBeenCalledOnce();
        const sent = JSON.parse((mockWebSocket.send as ReturnType<typeof vi.fn>).mock.calls[0][0]);
        expect(sent.type).toBe('TEST_EVENT');
        expect(sent.payload).toEqual({ data: 123 });
    });

    it('should queue messages sent before OPEN and flush them on connect', async () => {
        service.connect(SERVER_ID, WS_URL);
        await flush();

        // Connection not open yet — message should be queued
        service.send(SERVER_ID, 'TEST_EVENT', { data: 123 });
        expect(mockWebSocket.send).not.toHaveBeenCalled();

        // Opening the connection should flush the queue
        mockWebSocket.onopen?.({} as Event);
        expect(mockWebSocket.send).toHaveBeenCalledOnce();
    });

    it('should not reconnect after an intentional disconnect', async () => {
        vi.useFakeTimers();

        service.connect(SERVER_ID, WS_URL);
        await vi.runAllTimersAsync(); // flush() won't work with fake timers — use this instead
        mockWebSocket.onopen?.({} as Event);

        service.disconnect(SERVER_ID);
        expect(service.getState(SERVER_ID)).toBe(WebSocketState.CLOSED);

        // Advance past any reconnect delay — no new WebSocket should be created
        const callsBefore = constructionSpy.mock.calls.length;
        await vi.runAllTimersAsync();
        expect(constructionSpy.mock.calls.length).toBe(callsBefore);
    });

    it('should notify state listeners on state changes', async () => {
        const listener = vi.fn();
        service.onStateChange(listener);

        service.connect(SERVER_ID, WS_URL);
        await flush();
        mockWebSocket.onopen?.({} as Event);

        expect(listener).toHaveBeenCalledWith(SERVER_ID, WebSocketState.CONNECTING);
        expect(listener).toHaveBeenCalledWith(SERVER_ID, WebSocketState.OPEN);
    });

    it('should use a URL factory and call it before connecting', async () => {
        const factory = vi.fn().mockResolvedValue(WS_URL);
        service.connect(SERVER_ID, factory);
        await flush();

        expect(factory).toHaveBeenCalledOnce();
        expect(constructionSpy).toHaveBeenCalledWith(WS_URL);
    });

    it('should deliver typed messages to subscribers', async () => {
        const listener = vi.fn();
        service.subscribe('PING', listener);

        service.connect(SERVER_ID, WS_URL);
        await flush();
        mockWebSocket.onopen?.({} as Event);

        const msg = JSON.stringify({ event_type: 'PING', payload: { seq: 1 } });
        mockWebSocket.onmessage?.({ data: msg } as MessageEvent);

        expect(listener).toHaveBeenCalledOnce();
        expect(listener.mock.calls[0][0].payload).toEqual({ seq: 1 });
    });

    it('should unsubscribe listeners correctly', async () => {
        const listener = vi.fn();
        const unsubscribe = service.subscribe('PING', listener);
        unsubscribe();

        service.connect(SERVER_ID, WS_URL);
        await flush();
        mockWebSocket.onopen?.({} as Event);

        const msg = JSON.stringify({ event_type: 'PING', payload: {} });
        mockWebSocket.onmessage?.({ data: msg } as MessageEvent);

        expect(listener).not.toHaveBeenCalled();
    });
});
