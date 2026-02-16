// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { firstValueFrom } from 'rxjs';

// Mock ToastService
const mockToastService = vi.hoisted(() => ({
  showToast: vi.fn().mockReturnValue('toast-id'),
  showError: vi.fn().mockReturnValue('toast-id'),
  showWarning: vi.fn().mockReturnValue('toast-id'),
  showInfo: vi.fn().mockReturnValue('toast-id'),
  showSuccess: vi.fn().mockReturnValue('toast-id'),
  showProgress: vi.fn().mockReturnValue('toast-id'),
  showLoading: vi.fn().mockReturnValue('toast-id'),
  clearToast: vi.fn(),
  updateToast: vi.fn(),
  getToasts: vi.fn(),
  clearAllToasts: vi.fn(),
  hasToast: vi.fn(),
}));

vi.mock('./ToastService', () => ({
  toastService: mockToastService,
  default: mockToastService,
}));

// Mock WebSocketService
const mockSubscribe = vi.hoisted(() => vi.fn());
const mockSend = vi.hoisted(() => vi.fn());

vi.mock('./WebSocketService', () => ({
  WebSocketService: {
    getInstance: () => ({
      subscribe: mockSubscribe,
      send: mockSend,
    }),
  },
}));

// Capture WebSocket subscription callbacks
function getWsCallback(eventType: string): ((message: any) => void) | undefined {
  const call = mockSubscribe.mock.calls.find((c: any[]) => c[0] === eventType);
  return call ? call[1] : undefined;
}

describe('NotificationService', () => {
  let notificationService: any;
  let dispatchEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset singleton
    const mod = await import('./NotificationService');
    const ServiceClass = (mod as any).default?.constructor ?? Object.getPrototypeOf(mod.notificationService).constructor;
    (ServiceClass as any).instance = undefined;

    // Re-import to get a fresh singleton
    vi.resetModules();
    const freshMod = await import('./NotificationService');
    notificationService = freshMod.notificationService;

    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    vi.useRealTimers();
    dispatchEventSpy?.mockRestore();
  });

  // ─── Initialization ───────────────────────────────────────────────

  describe('initialization', () => {
    it('should subscribe to global "notification" websocket events', () => {
      expect(mockSubscribe).toHaveBeenCalledWith('notification', expect.any(Function));
    });

    it('should return an observable from getNotifications()', async () => {
      const notifications = await firstValueFrom(notificationService.getNotifications());
      expect(notifications).toEqual([]);
    });
  });

  // ─── Create Notification ──────────────────────────────────────────

  describe('createNotification', () => {
    it('should create a notification and return its id', () => {
      const id = notificationService.createNotification({
        message: 'Hello',
        type: 'info',
      });

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('should generate an id if none provided', () => {
      const id = notificationService.createNotification({
        message: 'Auto ID',
        type: 'info',
      });

      expect(id).toMatch(/^notif_/);
    });

    it('should use the provided id', () => {
      const id = notificationService.createNotification({
        id: 'my-custom-id',
        message: 'Custom ID',
        type: 'info',
      });

      expect(id).toBe('my-custom-id');
    });

    it('should emit notifications via the observable', async () => {
      notificationService.createNotification({
        id: 'obs-test',
        message: 'Observable test',
        type: 'success',
      });

      const notifications = await firstValueFrom(notificationService.getNotifications());
      expect(notifications).toHaveLength(1);
      expect(notifications[0].id).toBe('obs-test');
      expect(notifications[0].message).toBe('Observable test');
      expect(notifications[0].type).toBe('success');
    });

    it('should dispatch a context update event', () => {
      notificationService.createNotification({
        id: 'ctx-test',
        message: 'Context event test',
        type: 'info',
      });

      // Process the queued setTimeout
      vi.runAllTimers();

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'notification-update',
          detail: expect.objectContaining({
            updates: expect.arrayContaining([
              expect.objectContaining({
                type: 'add',
                notification: expect.objectContaining({ id: 'ctx-test' }),
              }),
            ]),
          }),
        })
      );
    });

    it('should default showAsToast to true', () => {
      notificationService.createNotification({
        id: 'toast-default',
        message: 'Toast default',
        type: 'info',
      });

      expect(mockToastService.showInfo).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'toast-default', message: 'Toast default' })
      );
    });

    it('should not show toast when showAsToast is false', () => {
      notificationService.createNotification({
        id: 'no-toast',
        message: 'No toast',
        type: 'success',
        showAsToast: false,
      });

      expect(mockToastService.showSuccess).not.toHaveBeenCalled();
    });

    it('should update existing notification if same id already exists', () => {
      notificationService.createNotification({
        id: 'dup-id',
        message: 'First',
        type: 'info',
      });

      const result = notificationService.createNotification({
        id: 'dup-id',
        message: 'Second',
        type: 'success',
      });

      expect(result).toBe('dup-id');
    });

    it('should default channel to "global"', async () => {
      notificationService.createNotification({
        id: 'ch-test',
        message: 'Channel test',
        type: 'info',
      });

      const notifications = await firstValueFrom(notificationService.getNotifications());
      expect(notifications[0].channel).toBe('global');
    });

    it('should set timestamp and updatedAt', async () => {
      const now = Date.now();
      notificationService.createNotification({
        id: 'ts-test',
        message: 'Timestamp test',
        type: 'info',
      });

      const notifications = await firstValueFrom(notificationService.getNotifications());
      expect(notifications[0].timestamp).toBeGreaterThanOrEqual(now);
      expect(notifications[0].updatedAt).toBeGreaterThanOrEqual(now);
    });
  });

  // ─── Toast Delegation ─────────────────────────────────────────────

  describe('toast delegation', () => {
    it('should show info toast for info type', () => {
      notificationService.createNotification({ id: 't1', message: 'Info', type: 'info' });
      expect(mockToastService.showInfo).toHaveBeenCalledWith(
        expect.objectContaining({ id: 't1', message: 'Info' })
      );
    });

    it('should show success toast for success type', () => {
      notificationService.createNotification({ id: 't2', message: 'Success', type: 'success' });
      expect(mockToastService.showSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ id: 't2', message: 'Success' })
      );
    });

    it('should show error toast for error type', () => {
      notificationService.createNotification({ id: 't3', message: 'Error', type: 'error' });
      expect(mockToastService.showError).toHaveBeenCalledWith(
        expect.objectContaining({ id: 't3', message: 'Error' })
      );
    });

    it('should show warning toast for warning type', () => {
      notificationService.createNotification({ id: 't4', message: 'Warning', type: 'warning' });
      expect(mockToastService.showWarning).toHaveBeenCalledWith(
        expect.objectContaining({ id: 't4', message: 'Warning' })
      );
    });

    it('should show progress toast for progress type with determinate progress', () => {
      notificationService.createNotification({
        id: 't5',
        message: 'Progress',
        type: 'progress',
        progress: { current: 50, total: 100, status: 'running' as const },
      });

      expect(mockToastService.showProgress).toHaveBeenCalledWith(
        expect.objectContaining({ id: 't5', message: 'Progress', percent: 50 })
      );
    });

    it('should show loading toast for progress type with indeterminate at start', () => {
      notificationService.createNotification({
        id: 't6',
        message: 'Loading',
        type: 'progress',
        progress: { current: 0, total: 100, status: 'running' as const, indeterminate: true },
      });

      expect(mockToastService.showLoading).toHaveBeenCalledWith(
        expect.objectContaining({ id: 't6', message: 'Loading' })
      );
    });

    it('should pass actions and autoClose to toast', () => {
      const actions = [{ label: 'Undo', onClick: vi.fn() }];
      notificationService.createNotification({
        id: 't7',
        message: 'With actions',
        type: 'info',
        actions,
        autoClose: false,
      });

      expect(mockToastService.showInfo).toHaveBeenCalledWith(
        expect.objectContaining({ id: 't7', actions, autoClose: false })
      );
    });
  });

  // ─── Update Notification ──────────────────────────────────────────

  describe('updateNotification', () => {
    it('should update an existing notification', async () => {
      notificationService.createNotification({
        id: 'upd-1',
        message: 'Original',
        type: 'info',
      });

      const result = notificationService.updateNotification('upd-1', {
        message: 'Updated',
      });

      expect(result).toBe('upd-1');

      const notifications = await firstValueFrom(notificationService.getNotifications());
      const updated = notifications.find((n: any) => n.id === 'upd-1');
      expect(updated.message).toBe('Updated');
    });

    it('should return null if notification does not exist', () => {
      const result = notificationService.updateNotification('nonexistent', {
        message: 'Nope',
      });

      expect(result).toBeNull();
    });

    it('should merge progress updates', async () => {
      notificationService.createNotification({
        id: 'prog-upd',
        message: 'Progress',
        type: 'progress',
        progress: { current: 10, total: 100, status: 'running' as const },
      });

      notificationService.updateNotification('prog-upd', {
        progress: { current: 50 },
      });

      const notifications = await firstValueFrom(notificationService.getNotifications());
      const updated = notifications.find((n: any) => n.id === 'prog-upd');
      expect(updated.progress.current).toBe(50);
      expect(updated.progress.total).toBe(100);
      expect(updated.progress.status).toBe('running');
    });

    it('should update the updatedAt timestamp', async () => {
      notificationService.createNotification({
        id: 'ts-upd',
        message: 'Timestamp',
        type: 'info',
      });

      const before = await firstValueFrom(notificationService.getNotifications());
      const originalTs = before[0].updatedAt;

      // Advance time slightly
      vi.advanceTimersByTime(100);

      notificationService.updateNotification('ts-upd', { message: 'Updated' });

      const after = await firstValueFrom(notificationService.getNotifications());
      expect(after[0].updatedAt).toBeGreaterThan(originalTs);
    });

    it('should dispatch a context update event for updates', () => {
      notificationService.createNotification({
        id: 'ctx-upd',
        message: 'Original',
        type: 'info',
      });

      vi.runAllTimers();
      dispatchEventSpy.mockClear();

      notificationService.updateNotification('ctx-upd', { message: 'Updated' });
      vi.runAllTimers();

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'notification-update',
          detail: expect.objectContaining({
            updates: expect.arrayContaining([
              expect.objectContaining({
                type: 'update',
                notification: expect.objectContaining({ id: 'ctx-upd', message: 'Updated' }),
              }),
            ]),
          }),
        })
      );
    });
  });

  // ─── Delete Notification ──────────────────────────────────────────

  describe('deleteNotification', () => {
    it('should remove the notification from the map', async () => {
      notificationService.createNotification({
        id: 'del-1',
        message: 'To delete',
        type: 'info',
      });

      notificationService.deleteNotification('del-1');

      const notifications = await firstValueFrom(notificationService.getNotifications());
      expect(notifications).toHaveLength(0);
    });

    it('should dispatch a delete context event', () => {
      notificationService.createNotification({
        id: 'del-2',
        message: 'To delete',
        type: 'info',
      });

      dispatchEventSpy.mockClear();
      notificationService.deleteNotification('del-2');

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'notification-update',
          detail: expect.objectContaining({
            updates: expect.arrayContaining([
              expect.objectContaining({ type: 'delete' }),
            ]),
          }),
        })
      );
    });

    it('should clear the corresponding toast', () => {
      notificationService.createNotification({
        id: 'del-3',
        message: 'Toast to clear',
        type: 'info',
      });

      notificationService.deleteNotification('del-3');

      expect(mockToastService.clearToast).toHaveBeenCalledWith('del-3');
    });
  });

  // ─── Mark as Read ─────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      notificationService.createNotification({
        id: 'read-1',
        message: 'Unread',
        type: 'info',
      });

      notificationService.markAsRead('read-1');

      const notifications = await firstValueFrom(notificationService.getNotifications());
      expect(notifications[0].isRead).toBe(true);
    });

    it('should not error when marking nonexistent notification', () => {
      expect(() => notificationService.markAsRead('nonexistent')).not.toThrow();
    });

    it('should dispatch a context update for mark as read', () => {
      notificationService.createNotification({
        id: 'read-2',
        message: 'To read',
        type: 'info',
      });

      vi.runAllTimers();
      dispatchEventSpy.mockClear();

      notificationService.markAsRead('read-2');
      vi.runAllTimers();

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'notification-update',
          detail: expect.objectContaining({
            updates: expect.arrayContaining([
              expect.objectContaining({
                type: 'update',
                notification: expect.objectContaining({ id: 'read-2', isRead: true }),
              }),
            ]),
          }),
        })
      );
    });

    it('should not re-dispatch if already read', () => {
      notificationService.createNotification({
        id: 'read-3',
        message: 'Already read',
        type: 'info',
      });

      notificationService.markAsRead('read-3');
      vi.runAllTimers();
      dispatchEventSpy.mockClear();

      notificationService.markAsRead('read-3');
      vi.runAllTimers();

      // Should not have dispatched again since already read
      const notifEvents = dispatchEventSpy.mock.calls.filter(
        (c) => (c[0] as CustomEvent).type === 'notification-update'
      );
      expect(notifEvents).toHaveLength(0);
    });
  });

  // ─── WebSocket Message Handling ───────────────────────────────────

  describe('WebSocket message handling', () => {
    it('should create a notification from a new WebSocket message', async () => {
      const callback = getWsCallback('notification');
      expect(callback).toBeDefined();

      callback!({
        id: 'msg-1',
        body: {
          id: 'ws-1',
          message: 'WS notification',
          type: 'info',
          channel: 'builds',
        },
      });

      const notifications = await firstValueFrom(notificationService.getNotifications());
      expect(notifications).toHaveLength(1);
      expect(notifications[0].id).toBe('ws-1');
      expect(notifications[0].message).toBe('WS notification');
      expect(notifications[0].channel).toBe('builds');
    });

    it('should update an existing notification from WebSocket', async () => {
      const callback = getWsCallback('notification');

      // Create first
      callback!({
        id: 'msg-2',
        body: {
          id: 'ws-upd',
          message: 'Original WS',
          type: 'info',
        },
      });

      // Then update
      callback!({
        id: 'msg-3',
        body: {
          id: 'ws-upd',
          message: 'Updated WS',
          type: 'success',
        },
      });

      const notifications = await firstValueFrom(notificationService.getNotifications());
      const updated = notifications.find((n: any) => n.id === 'ws-upd');
      expect(updated.message).toBe('Updated WS');
    });

    it('should use message.id as fallback if payload.id is missing', async () => {
      const callback = getWsCallback('notification');

      callback!({
        id: 'fallback-id',
        body: {
          message: 'No payload id',
          type: 'warning',
        },
      });

      const notifications = await firstValueFrom(notificationService.getNotifications());
      expect(notifications[0].id).toBe('fallback-id');
    });

    it('should ignore messages with no body', async () => {
      const callback = getWsCallback('notification');

      callback!({ id: 'msg-empty', body: null });

      const notifications = await firstValueFrom(notificationService.getNotifications());
      expect(notifications).toHaveLength(0);
    });

    it('should default showAsToast to true for WS messages', () => {
      const callback = getWsCallback('notification');

      callback!({
        id: 'msg-toast',
        body: {
          id: 'ws-toast',
          message: 'WS with toast',
          type: 'success',
        },
      });

      expect(mockToastService.showSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'ws-toast' })
      );
    });

    it('should default type to "info" if not provided', async () => {
      const callback = getWsCallback('notification');

      callback!({
        id: 'msg-no-type',
        body: {
          id: 'ws-no-type',
          message: 'No type',
        },
      });

      const notifications = await firstValueFrom(notificationService.getNotifications());
      expect(notifications[0].type).toBe('info');
    });
  });

  // ─── Modal Handling ───────────────────────────────────────────────

  describe('modal handling', () => {
    it('should handle modal payloads from WebSocket', () => {
      const callback = getWsCallback('notification');

      callback!({
        id: 'msg-modal',
        body: {
          type: 'modal',
          modalType: 'warning',
          title: 'Confirm',
          message: 'Are you sure?',
          state: 'pending',
          size: 'md',
          data: { key: 'value' },
        },
        _serverId: 'server-1',
      });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'notification-modal',
          detail: expect.objectContaining({
            action: 'open',
            payload: expect.objectContaining({
              type: 'warning',
              title: 'Confirm',
              message: 'Are you sure?',
            }),
          }),
        })
      );
    });

    it('should handle isModal flag from WebSocket', () => {
      const callback = getWsCallback('notification');

      callback!({
        id: 'msg-modal-2',
        body: {
          isModal: true,
          title: 'Modal via flag',
          message: 'Content',
        },
      });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'notification-modal',
        })
      );
    });

    it('should not create a notification for modal messages', async () => {
      const callback = getWsCallback('notification');

      callback!({
        id: 'msg-modal-only',
        body: {
          type: 'modal',
          title: 'Modal Only',
          message: 'This is a modal',
        },
      });

      const notifications = await firstValueFrom(notificationService.getNotifications());
      expect(notifications).toHaveLength(0);
    });

    it('should dispatch showModal event', () => {
      notificationService.showModal({
        type: 'info',
        title: 'Manual Modal',
        message: 'Manually triggered',
      });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'notification-modal',
          detail: expect.objectContaining({
            action: 'open',
            payload: expect.objectContaining({
              type: 'info',
              title: 'Manual Modal',
            }),
          }),
        })
      );
    });

    it('should dispatch closeModal event', () => {
      notificationService.closeModal();

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'notification-modal',
          detail: expect.objectContaining({
            action: 'close',
            payload: null,
          }),
        })
      );
    });
  });

  // ─── Channel Subscriptions ────────────────────────────────────────

  describe('channel subscriptions', () => {
    it('should subscribe to a channel on WebSocket', () => {
      notificationService.subscribeToChannel('builds', 'server-1');

      expect(mockSubscribe).toHaveBeenCalledWith(
        'notification:builds',
        expect.any(Function),
        'server-1'
      );
    });

    it('should send subscription message to server when serverId provided', () => {
      notificationService.subscribeToChannel('deploys', 'server-2');

      expect(mockSend).toHaveBeenCalledWith('server-2', 'global', {
        client_id: 'ui',
        subscriptions: ['deploys'],
      });
    });

    it('should not duplicate subscriptions for the same channel:serverId', () => {
      notificationService.subscribeToChannel('builds', 'server-1');
      const callCount = mockSubscribe.mock.calls.length;

      notificationService.subscribeToChannel('builds', 'server-1');
      // Should not add another subscription
      expect(mockSubscribe.mock.calls.length).toBe(callCount);
    });

    it('should unsubscribe from a channel', () => {
      const mockUnsubscribe = vi.fn();
      mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

      notificationService.subscribeToChannel('logs');
      notificationService.unsubscribeFromChannel('logs');

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  // ─── Helper Methods ───────────────────────────────────────────────

  describe('helper methods', () => {
    it('info() should create an info notification', () => {
      const id = notificationService.info({ message: 'Info helper' });
      expect(id).toBeDefined();
      expect(mockToastService.showInfo).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Info helper' })
      );
    });

    it('success() should create a success notification', () => {
      const id = notificationService.success({ message: 'Success helper' });
      expect(id).toBeDefined();
      expect(mockToastService.showSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Success helper' })
      );
    });

    it('error() should create an error notification', () => {
      const id = notificationService.error({ message: 'Error helper' });
      expect(id).toBeDefined();
      expect(mockToastService.showError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Error helper' })
      );
    });

    it('warning() should create a warning notification', () => {
      const id = notificationService.warning({ message: 'Warning helper' });
      expect(id).toBeDefined();
      expect(mockToastService.showWarning).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Warning helper' })
      );
    });
  });

  // ─── Cleanup ──────────────────────────────────────────────────────

  describe('cleanup', () => {
    it('should unsubscribe channel listeners on cleanup', () => {
      const mockChannelUnsub = vi.fn();
      mockSubscribe.mockReturnValueOnce(mockChannelUnsub);

      notificationService.subscribeToChannel('test-channel');
      notificationService.cleanup();

      expect(mockChannelUnsub).toHaveBeenCalled();
    });

    it('should clear all channel unsubscriptions on cleanup', () => {
      const unsub1 = vi.fn();
      const unsub2 = vi.fn();
      mockSubscribe.mockReturnValueOnce(unsub1).mockReturnValueOnce(unsub2);

      notificationService.subscribeToChannel('ch1');
      notificationService.subscribeToChannel('ch2');
      notificationService.cleanup();

      expect(unsub1).toHaveBeenCalled();
      expect(unsub2).toHaveBeenCalled();
    });
  });

  // ─── Context Update Batching ──────────────────────────────────────

  describe('context update batching', () => {
    it('should batch multiple updates into a single event', () => {
      notificationService.createNotification({ id: 'batch-1', message: 'A', type: 'info' });
      notificationService.createNotification({ id: 'batch-2', message: 'B', type: 'info' });

      // Before timer fires, no event yet
      const eventsBefore = dispatchEventSpy.mock.calls.filter(
        (c) => (c[0] as CustomEvent).type === 'notification-update'
      );
      expect(eventsBefore).toHaveLength(0);

      // After timer fires, one batched event
      vi.runAllTimers();

      const eventsAfter = dispatchEventSpy.mock.calls.filter(
        (c) => (c[0] as CustomEvent).type === 'notification-update'
      );
      expect(eventsAfter).toHaveLength(1);

      const updates = (eventsAfter[0][0] as CustomEvent).detail.updates;
      expect(updates).toHaveLength(2);
    });
  });
});
