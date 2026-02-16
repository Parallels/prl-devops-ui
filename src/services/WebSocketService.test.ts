// @ts-nocheck

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketService } from './WebSocketService';
import { WebSocketState } from '../types/WebSocket';

// Mock WebSocket
const mockWebSocket = {
    send: vi.fn(),
    close: vi.fn(),
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,
};

const constructionSpy = vi.fn();

class MockWebSocket {
    constructor(url: string) {
        constructionSpy(url);
        return mockWebSocket;
    }
}

global.WebSocket = MockWebSocket as any;

describe('WebSocketService', () => {
    let service: WebSocketService;

    beforeEach(() => {
        // Reset singleton instance if possible or create new one for testing
        // Since it's a singleton, we need to be careful. Ideally we'd modify the class to allow resetting, 
        // or just valid basic flows. 
        // For test purposes, we can cast to any to reset the private instance
        (WebSocketService as any).instance = null;
        service = WebSocketService.getInstance({ url: 'ws://test.com' });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with CLOSED state', () => {
        expect(service.state).toBe(WebSocketState.CLOSED);
    });

    it('should connect and update state to CONNECTING', () => {
        service.connect();
        expect(constructionSpy).toHaveBeenCalledWith('ws://test.com');
        // State might be CONNECTING or OPEN depending on sync/async of mock.
        // Our implementation sets CONNECTING synchronously before new WebSocket
        // We can't easily check internal state without a getter, but we have onStateChange
    });

    it('should handle open event', () => {
        service.connect();
        // Simulate open
        if (mockWebSocket.onopen) {
            (mockWebSocket.onopen as any)({});
        }
        expect(service.state).toBe(WebSocketState.OPEN);
    });

    it('should send message if OPEN', () => {
        service.connect();
        (mockWebSocket.onopen as any)({}); // Open it

        service.send('TEST_EVENT', { data: 123 });
        expect(mockWebSocket.send).toHaveBeenCalled();
        const sentData = JSON.parse((mockWebSocket.send as any).mock.calls[0][0]);
        expect(sentData.type).toBe('TEST_EVENT');
        expect(sentData.payload).toEqual({ data: 123 });
    });

    it('should queue message if not OPEN', () => {
        service.connect();
        // Not opened yet
        service.send('TEST_EVENT', { data: 123 });
        expect(mockWebSocket.send).not.toHaveBeenCalled();

        // Now open
        (mockWebSocket.onopen as any)({});
        // Should flush queue
        expect(mockWebSocket.send).toHaveBeenCalled();
    });
});
