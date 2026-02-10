
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Notification,
  CreateNotificationOptions,
  UpdateNotificationOptions,
} from '../types/Notification';
import toastService from './ToastService';
import { WebSocketService } from './WebSocketService';
import { WebSocketMessage } from '../types/WebSocket';
import { BackendMessageType } from '../types/BackendMessages';

/**
 * Service for managing notifications via WebSockets
 */
class NotificationService {
  private static instance: NotificationService;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private notifications: Map<string, Notification> = new Map();
  private wsService: WebSocketService;
  private contextUpdateQueued = false;
  private updateQueue: Array<{ type: 'add' | 'update' | 'delete'; notification: Notification }> = [];
  private wsUnsubscribe: (() => void) | null = null;
  private channelUnsubscribes: Map<string, () => void> = new Map();

  private constructor() {
    this.wsService = WebSocketService.getInstance();
    this.setupGlobalListener();

    // Setup cleanup on unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Setup listener for global notification events from WebSocket
   */
  private setupGlobalListener(): void {
    // Subscribe to global notifications from ANY server
    this.wsUnsubscribe = this.wsService.subscribe('notification', (message: WebSocketMessage<any>) => {
      this.handleWebSocketMessage(message);
    });
  }

  public subscribeToChannel(channel: string, serverId?: string): void {
    const key = serverId ? `${channel}:${serverId}` : channel;
    if (this.channelUnsubscribes.has(key)) return;

    const unsubscribe = this.wsService.subscribe(`notification:${channel}`, (message: WebSocketMessage<any>) => {
      this.handleWebSocketMessage(message);
    }, serverId);

    this.channelUnsubscribes.set(key, unsubscribe);

    // If serverId provided, send subscription only to that server
    if (serverId) {
      this.wsService.send(serverId, BackendMessageType.GLOBAL, {
        client_id: 'ui',
        subscriptions: [channel]
      });
    } else {
      // Broadcast? Or we need serverId to send. 
      // For now, if no serverId, maybe we don't send or send to all?
      // Let's assume we need serverId to send.
      // TODO: iterate connections if we want to subscribe properly on all?
    }
  }

  public unsubscribeFromChannel(channel: string): void {
    const unsubscribe = this.channelUnsubscribes.get(channel);
    if (unsubscribe) {
      unsubscribe();
      this.channelUnsubscribes.delete(channel);
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage<any>): void {
    const payload = message.body;
    if (!payload) return;

    const sourceServerId = (message as any)._serverId; // Captured from WebSocketService augmentation

    // Handle Modal payloads
    if (payload.type === 'modal' || payload.isModal) {
      this.showModal({
        type: payload.modalType || 'info',
        title: payload.title || 'Notification',
        message: payload.message || '',
        state: payload.state,
        size: payload.size,
        data: { ...payload.data, sourceServerId }
      });
      return;
    }

    // Map payload to Notification options
    // This mapping depends on what the backend actually sends. 
    // Assuming payload has similar shape to CreateNotificationOptions

    const id = payload.id || message.id;

    if (this.notifications.has(id)) {
      this.updateNotification(id, {
        ...payload,
        message: payload.message,
        type: payload.type,
      });
    } else {
      this.createNotification({
        id,
        channel: payload.channel || 'global',
        message: payload.message,
        type: payload.type || 'info',
        details: payload.details,
        actions: payload.actions, // Need to ensure types match
        data: payload.data,
        progress: payload.progress,
        showAsToast: payload.showAsToast ?? true
      });
    }
  }

  /**
   * Queue an update to the notification context
   */
  private queueContextUpdate(type: 'add' | 'update' | 'delete', notification: Notification): void {
    this.updateQueue.push({ type, notification });

    if (!this.contextUpdateQueued) {
      this.contextUpdateQueued = true;
      setTimeout(() => {
        this.processContextUpdateQueue();
      }, 0);
    }
  }

  private processContextUpdateQueue(): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('notification-update', {
        detail: {
          updates: this.updateQueue,
        },
      });

      window.dispatchEvent(event);

      this.updateQueue = [];
      this.contextUpdateQueued = false;
    }
  }

  public showModal(payload: import('../types/Notification').NotificationModalPayload): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('notification-modal', {
        detail: {
          action: 'open',
          payload
        }
      });
      window.dispatchEvent(event);
    }
  }

  public closeModal(): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('notification-modal', {
        detail: {
          action: 'close',
          payload: null
        }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Create a new notification manually (client-side)
   */
  public createNotification(options: CreateNotificationOptions): string {
    const id = options.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (this.notifications.has(id)) {
      return this.updateNotification(id, options) ?? id;
    }

    const now = Date.now();
    const notification: Notification = {
      id,
      channel: options.channel || 'global',
      type: options.type || 'info',
      message: options.message,
      details: options.details,
      timestamp: now,
      updatedAt: now,
      isRead: false,
      replace: options.replace,
      actions: options.actions,
      showAsToast: options.showAsToast !== false,
      progress: options.progress,
      data: options.data,
      autoClose: options.autoClose, // Logic can be refined based on type
      dismissible: options.dismissible,
    };

    this.notifications.set(id, notification);
    this.notificationsSubject.next(Array.from(this.notifications.values()));
    this.queueContextUpdate('add', notification);

    if (notification.showAsToast) {
      this.showAsToast(notification);
    }

    return id;
  }

  public updateNotification(id: string, options: UpdateNotificationOptions): string | null {
    const notification = this.notifications.get(id);
    if (!notification) return null;

    const updatedNotification: Notification = {
      ...notification,
      ...options,
      updatedAt: Date.now(),
      progress: options.progress ? { ...notification.progress, ...options.progress } : notification.progress,
    };

    this.notifications.set(id, updatedNotification);
    this.notificationsSubject.next(Array.from(this.notifications.values()));

    if (notification.showAsToast && (!updatedNotification.alreadyShownToast || notification.replace)) {
      this.showAsToast(updatedNotification);
      updatedNotification.alreadyShownToast = true;
      this.notifications.set(id, updatedNotification); // Update state with toast shown flag
    }

    this.queueContextUpdate('update', updatedNotification);
    return id;
  }

  public deleteNotification(id: string, channel: string = 'global'): void {
    this.notifications.delete(id);
    this.notificationsSubject.next(Array.from(this.notifications.values()));

    const event = new CustomEvent('notification-update', {
      detail: {
        updates: [{ type: 'delete', notification: { id, channel } as Notification }],
      },
    });
    window.dispatchEvent(event);

    toastService.clearToast(id);
  }

  public markAsRead(id: string): void {
    const notification = this.notifications.get(id);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.notifications.set(id, notification);
      this.notificationsSubject.next(Array.from(this.notifications.values()));
      this.queueContextUpdate('update', notification);
    }
  }

  public getNotifications(): Observable<Notification[]> {
    return this.notificationsSubject.asObservable();
  }

  public cleanup(): void {
    if (this.wsUnsubscribe) {
      this.wsUnsubscribe();
      this.wsUnsubscribe = null;
    }
    this.channelUnsubscribes.forEach(unsub => unsub());
    this.channelUnsubscribes.clear();
  }

  // Toast delegation
  private showAsToast(notification: Notification): void {
    const { id, message, type, details, actions, autoClose, progress } = notification;

    if (type === 'progress' && progress) {
      if (progress.current === 0 && progress.indeterminate) {
        toastService.showLoading({ id, message, details, actions, autoClose });
      } else {
        toastService.showProgress({
          id,
          message,
          details,
          percent: (progress.current / progress.total) * 100,
          status: progress.status,
          actions,
          autoClose
        });
      }
    } else {
      switch (type) {
        case 'success': toastService.showSuccess({ id, message, details, actions, autoClose }); break;
        case 'error': toastService.showError({ id, message, details, actions, autoClose }); break;
        case 'warning': toastService.showWarning({ id, message, details, actions, autoClose }); break;
        default: toastService.showInfo({ id, message, details, actions, autoClose }); break;
      }
    }
  }

  // Helpers
  public info(options: Omit<CreateNotificationOptions, 'type'>) { return this.createNotification({ ...options, type: 'info' }); }
  public success(options: Omit<CreateNotificationOptions, 'type'>) { return this.createNotification({ ...options, type: 'success' }); }
  public error(options: Omit<CreateNotificationOptions, 'type'>) { return this.createNotification({ ...options, type: 'error' }); }
  public warning(options: Omit<CreateNotificationOptions, 'type'>) { return this.createNotification({ ...options, type: 'warning' }); }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;
