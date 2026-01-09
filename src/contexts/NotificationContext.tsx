
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Notification } from '../types/Notification';
import notificationService from '@/services/NotificationService';
import {
  NotificationAction,
  NotificationContextValue,
  NotificationUpdate,
} from '@/interfaces/NotificationContext';
import { NotificationState } from '../types/Notification';

// We need to define NotificationState here if it was removed from types or ensure it exists
// Based on previous file content, NotificationState was imported from types/Notification
// Let's assume we need to re-export or re-define if the types file didn't include it. 
// The newly created types/Notification.ts DID NOT include NotificationState interface.
// We should add it to types/Notification.ts or define it here. 
// Given the context is consuming it, let's define it here for now or update types.
// Ideally, update types. But to proceed fast, let's look at what was there.

// NotificationState is now imported from ../types/Notification

const initialState: NotificationState = {
  notifications: {},
  unreadCount: {},
  openPanels: {},
  totalUnread: 0,
  currentPage: 1,
  itemsPerPage: 5,
  activeModal: null,
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const STORAGE_KEY = 'notifications';
const MAX_NOTIFICATIONS_PER_CHANNEL = 500;

function notificationReducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  let newState: NotificationState = state;

  switch (action.type) {
    case 'INIT_STATE':
      return {
        ...action.state,
        openPanels: state.openPanels,
        activeModal: null, // Always start with no modal
      };

    case 'OPEN_MODAL':
      newState = { ...state, activeModal: action.payload };
      break;

    case 'CLOSE_MODAL':
      newState = { ...state, activeModal: null };
      break;

    case 'ADD_NOTIFICATION': {
      const { notification } = action;
      const { channel, id } = notification;

      const channelNotifications = [...(state.notifications[channel] || [])];
      const existingIndex = channelNotifications.findIndex((n) => n.id === id);
      const isExistingNotification = existingIndex !== -1;

      if (isExistingNotification) {
        channelNotifications[existingIndex] = notification;
      } else {
        channelNotifications.unshift(notification);
        if (channelNotifications.length > MAX_NOTIFICATIONS_PER_CHANNEL) {
          channelNotifications.pop();
        }
      }

      let channelUnreadCount = state.unreadCount[channel] || 0;
      if (!notification.isRead && !isExistingNotification) {
        channelUnreadCount += 1;
      }

      const totalUnread =
        Object.keys(state.unreadCount)
          .filter((c) => c !== channel)
          .reduce((sum, c) => sum + (state.unreadCount[c] || 0), 0) + channelUnreadCount;

      newState = {
        ...state,
        notifications: {
          ...state.notifications,
          [channel]: channelNotifications,
        },
        unreadCount: {
          ...state.unreadCount,
          [channel]: channelUnreadCount,
        },
        totalUnread,
      };
      break;
    }

    case 'UPDATE_NOTIFICATION': {
      const { notification } = action;
      const { channel, id } = notification;

      if (!state.notifications[channel]) {
        return notificationReducer(state, { type: 'ADD_NOTIFICATION', notification });
      }

      const channelNotifications = [...state.notifications[channel]];
      const index = channelNotifications.findIndex((n) => n.id === id);

      if (index === -1) {
        return notificationReducer(state, { type: 'ADD_NOTIFICATION', notification });
      }

      const oldNotification = channelNotifications[index];
      const updatedNotification = {
        ...notification,
        timestamp: oldNotification.timestamp,
        updatedAt: Date.now(),
      };

      channelNotifications[index] = updatedNotification;

      let channelUnreadCount = state.unreadCount[channel] || 0;
      if (!oldNotification.isRead && notification.isRead) {
        channelUnreadCount = Math.max(0, channelUnreadCount - 1);
      } else if (oldNotification.isRead && !notification.isRead) {
        channelUnreadCount += 1;
      }

      const totalUnread =
        Object.keys(state.unreadCount)
          .filter((c) => c !== channel)
          .reduce((sum, c) => sum + (state.unreadCount[c] || 0), 0) + channelUnreadCount;

      newState = {
        ...state,
        notifications: {
          ...state.notifications,
          [channel]: channelNotifications,
        },
        unreadCount: {
          ...state.unreadCount,
          [channel]: channelUnreadCount,
        },
        totalUnread,
      };
      break;
    }

    case 'DELETE_NOTIFICATION': {
      const { id, channel } = action;
      if (!state.notifications[channel]) return state;

      const channelNotifications = state.notifications[channel];
      const notificationToDelete = channelNotifications.find((n) => n.id === id);
      if (!notificationToDelete) return state;

      const updatedNotifications = channelNotifications.filter((n) => n.id !== id);
      const shouldDecrementUnread = !notificationToDelete.isRead;
      const channelUnreadCount = shouldDecrementUnread
        ? Math.max(0, (state.unreadCount[channel] || 0) - 1)
        : state.unreadCount[channel] || 0;

      const totalUnread = shouldDecrementUnread
        ? Object.keys(state.unreadCount)
          .filter((c) => c !== channel)
          .reduce((sum, c) => sum + (state.unreadCount[c] || 0), 0) + channelUnreadCount
        : state.totalUnread;

      newState = {
        ...state,
        notifications: {
          ...state.notifications,
          [channel]: updatedNotifications,
        },
        unreadCount: {
          ...state.unreadCount,
          [channel]: channelUnreadCount,
        },
        totalUnread,
      };
      break;
    }

    case 'MARK_AS_READ': {
      const { id, channel } = action;
      if (!state.notifications[channel]) return state;

      const channelNotifications = [...state.notifications[channel]];
      const index = channelNotifications.findIndex((n) => n.id === id);

      if (index === -1 || channelNotifications[index].isRead) return state;

      channelNotifications[index] = { ...channelNotifications[index], isRead: true };
      const channelUnreadCount = Math.max(0, (state.unreadCount[channel] || 0) - 1);

      const totalUnread =
        Object.keys(state.unreadCount)
          .filter((c) => c !== channel)
          .reduce((sum, c) => sum + (state.unreadCount[c] || 0), 0) + channelUnreadCount;

      newState = {
        ...state,
        notifications: {
          ...state.notifications,
          [channel]: channelNotifications,
        },
        unreadCount: {
          ...state.unreadCount,
          [channel]: channelUnreadCount,
        },
        totalUnread,
      };
      break;
    }

    case 'MARK_ALL_READ': {
      const { channel } = action;

      if (channel) {
        if (state.notifications[channel]) {
          const updatedNotifications = state.notifications[channel].map((n) => ({ ...n, isRead: true }));
          newState = {
            ...state,
            notifications: {
              ...state.notifications,
              [channel]: updatedNotifications,
            },
            unreadCount: {
              ...state.unreadCount,
              [channel]: 0,
            },
          };
        }
      } else {
        const updatedNotifications = { ...state.notifications };
        Object.keys(updatedNotifications).forEach((c) => {
          updatedNotifications[c] = updatedNotifications[c].map((n) => ({ ...n, isRead: true }));
        });

        newState = {
          ...state,
          notifications: updatedNotifications,
          unreadCount: Object.keys(state.unreadCount).reduce(
            (acc, c) => {
              acc[c] = 0;
              return acc;
            },
            {} as typeof state.unreadCount
          ),
        };
      }

      newState.totalUnread = Object.values(newState.unreadCount).reduce(
        (sum, count) => sum + count,
        0
      );
      break;
    }

    case 'CLEAR_ALL': {
      const { channel } = action;
      if (channel) {
        const { [channel]: _, ...remainingNotifications } = state.notifications;
        const { [channel]: __, ...remainingUnreadCount } = state.unreadCount;
        const totalUnread = Object.values(remainingUnreadCount).reduce(
          (sum, count) => sum + count,
          0
        );
        newState = {
          ...state,
          notifications: remainingNotifications,
          unreadCount: remainingUnreadCount,
          totalUnread,
          activeModal: state.activeModal, // Preserve modal state
        };
      } else {
        newState = {
          ...state,
          notifications: {},
          unreadCount: {},
          totalUnread: 0,
          activeModal: state.activeModal, // Preserve modal state
        };
      }
      break;
    }

    case 'TOGGLE_PANEL': {
      const { channel = 'global', open } = action;
      const current = !!state.openPanels[channel];
      const nextOpen = typeof open === 'boolean' ? open : !current;
      newState = {
        ...state,
        openPanels: {
          ...state.openPanels,
          [channel]: nextOpen,
        },
      };
      break;
    }

    case 'SET_PAGE': {
      newState = { ...state, currentPage: action.page };
      break;
    }

    case 'REMOVE_NOTIFICATION': {
      const { channel, id } = action;
      if (!state.notifications[channel]) return state;

      const channelNotifications = state.notifications[channel];
      const notificationToRemove = channelNotifications.find((n) => n.id === id);
      if (!notificationToRemove) return state;

      const shouldDecrementUnread = !notificationToRemove.isRead;

      newState = {
        ...state,
        notifications: {
          ...state.notifications,
          [channel]: channelNotifications.filter((n) => n.id !== id),
        },
        unreadCount: {
          ...state.unreadCount,
          [channel]: shouldDecrementUnread
            ? Math.max(0, (state.unreadCount[channel] || 0) - 1)
            : state.unreadCount[channel] || 0,
        },
        totalUnread: shouldDecrementUnread ? Math.max(0, state.totalUnread - 1) : state.totalUnread,
      };
      break;
    }

    case 'SET_ALREADY_SHOWN_TOAST': {
      const { id, channel, alreadyShownToast } = action;
      if (!state.notifications[channel]) return state;

      const channelNotifications = [...state.notifications[channel]];
      const index = channelNotifications.findIndex((n) => n.id === id);
      if (index === -1) return state;

      channelNotifications[index] = { ...channelNotifications[index], alreadyShownToast };
      newState = {
        ...state,
        notifications: {
          ...state.notifications,
          [channel]: channelNotifications,
        },
      };
      break;
    }

    default:
      return state;
  }

  // Persist state (excluding modal and panels)
  if (action.type !== 'TOGGLE_PANEL' && action.type !== 'OPEN_MODAL' && action.type !== 'CLOSE_MODAL') {
    saveStateToStorage(newState);
  }

  return newState;
}

function saveStateToStorage(state: NotificationState): void {
  try {
    const { openPanels, activeModal, ...stateToSave } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to save notifications to localStorage:', error);
  }
}

function loadStateFromStorage(): Partial<NotificationState> | null {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    const state = JSON.parse(savedState || '{}') as Partial<NotificationState>;
    if (savedState) {
      for (const notification of Object.values(state.notifications || {}).flat()) {
        notification.alreadyShownToast = false;
      }
    }
    return state;
  } catch (error) {
    console.error('Failed to load notifications from localStorage:', error);
  }
  return null;
}

export const NotificationProvider: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  useEffect(() => {
    const savedState = loadStateFromStorage();
    if (savedState) {
      dispatch({
        type: 'INIT_STATE',
        state: {
          ...initialState,
          ...savedState,
          itemsPerPage: initialState.itemsPerPage,
        },
      });
    }
  }, []);

  const addNotification = useCallback((notification: Notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', notification });
  }, []);

  const updateNotification = useCallback((notification: Notification) => {
    dispatch({ type: 'UPDATE_NOTIFICATION', notification });
  }, []);

  const deleteNotification = useCallback((id: string, channel: string) => {
    dispatch({ type: 'DELETE_NOTIFICATION', id, channel });
  }, []);

  const markAsRead = useCallback((id: string, channel: string) => {
    dispatch({ type: 'MARK_AS_READ', id, channel });
    // Also update service
    notificationService.markAsRead(id);
  }, []);

  const markAllAsRead = useCallback((channel?: string) => {
    dispatch({ type: 'MARK_ALL_READ', channel });
  }, []);

  const clearAll = useCallback((channel?: string) => {
    dispatch({ type: 'CLEAR_ALL', channel });
  }, []);

  const togglePanel = useCallback((channel?: string, openState?: boolean) => {
    dispatch({ type: 'TOGGLE_PANEL', channel, open: openState });
  }, []);

  const setPage = useCallback((page: number) => {
    dispatch({ type: 'SET_PAGE', page });
  }, []);

  const removeNotification = useCallback((channel: string, id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', channel, id });
  }, []);

  const setAlreadyShownToast = useCallback(
    (id: string, channel: string, alreadyShownToast: boolean) => {
      dispatch({ type: 'SET_ALREADY_SHOWN_TOAST', id, channel, alreadyShownToast });
    },
    []
  );

  const openModal = useCallback((payload: import('../types/Notification').NotificationModalPayload) => {
    dispatch({ type: 'OPEN_MODAL', payload });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  // Listen for updates from NotificationService
  useEffect(() => {
    const handleNotificationUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ updates: NotificationUpdate[] }>;
      const { updates } = customEvent.detail;

      if (Array.isArray(updates)) {
        updates.forEach((update) => {
          const { type, notification } = update;
          if (type === 'add') {
            addNotification(notification);
          } else if (type === 'update') {
            updateNotification(notification);
          } else if (type === 'delete') {
            deleteNotification(notification.id, notification.channel);
          }
        });
      }
    };

    const handleModalEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ payload: import('../types/Notification').NotificationModalPayload | null; action: 'open' | 'close' }>;
      const { action, payload } = customEvent.detail;
      if (action === 'open' && payload) {
        openModal(payload);
      } else if (action === 'close') {
        closeModal();
      }
    };

    window.addEventListener('notification-update', handleNotificationUpdate);
    window.addEventListener('notification-modal', handleModalEvent);
    return () => {
      window.removeEventListener('notification-update', handleNotificationUpdate);
      window.removeEventListener('notification-modal', handleModalEvent);
    };
  }, [addNotification, updateNotification, deleteNotification, openModal, closeModal]);

  return (
    <NotificationContext.Provider
      value={{
        state,
        addNotification,
        updateNotification,
        deleteNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        togglePanel,
        setPage,
        removeNotification,
        setAlreadyShownToast,
        openModal,
        closeModal,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};


export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
