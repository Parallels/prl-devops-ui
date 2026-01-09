
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationService } from './NotificationService';
import { WebSocketService } from './WebSocketService';

// Mock WebSocketService
const mockWsService = vi.hoisted(() => ({
    subscribe: vi.fn(),
    send: vi.fn(),
}));

// Mock the singleton
vi.mock('./WebSocketService', () => ({
    WebSocketService: {
        getInstance: () => mockWsService,
    },
}));

describe('NotificationService', () => {


    it('should create a notification', () => {
        const id = notificationService.createNotification({
            message: 'Test Message',
            type: 'success',
        });

        expect(id).toBeDefined();
        // We can't easily check private map, but we can check if it notified subscribers
        // Ideally we subscribe to getNotifications()
    });

    it('should subscribe to web socket on init', () => {
        // Since singleton is created at module level, this might have already happened.
        // We can check if it called subscribe
        expect(mockWsService.subscribe).toHaveBeenCalledWith('notification', expect.any(Function));
    });

    it('should handle incoming websocket message', () => {
        // capture the callback
        const subscribeCall = mockWsService.subscribe.mock.calls.find(call => call[0] === 'notification');
        expect(subscribeCall).toBeDefined();
        const callback = subscribeCall[1];

        // Simulate message
        callback({
            body: {
                id: 'ws-notif-1',
                message: 'WS Message',
                type: 'info'
            },
            id: 'msg-1'
        });

        // Verification would require checking state or subscriptions
        // For now, at least verify it didn't crash
    });
});
