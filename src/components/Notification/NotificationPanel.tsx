import React, { useEffect, forwardRef, useMemo } from 'react';
import classNames from 'classnames';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationList } from './NotificationList';
import { IconButton } from '../../controls';
import { useNotificationPopover } from './NotificationPopoverContext';
// import LogService from '@/services/LogService';
interface NotificationPanelProps {
  channelFilter: string;
  variant?: 'header' | 'card';
  className?: string;
  animation?: 'slide-down' | 'slide-up' | 'fade';
  position?: {
    position?: 'fixed' | 'absolute';
    top?: number | string;
    right?: number | string;
    left?: number | string;
    bottom?: number | string;
    zIndex?: number;
  };
  placement?: string;
}

export const NotificationPanel = forwardRef<HTMLDivElement, NotificationPanelProps>(
  (
    {
      channelFilter = '',
      variant = 'header',
      className = '',
      animation = 'slide-down',
      position,
      placement = '',
    },
    ref
  ) => {
    const { state, togglePanel, markAllAsRead, clearAll } = useNotifications();
    const popoverControls = useNotificationPopover();
    const isOpen = !!state.openPanels?.[channelFilter];

    // We no longer need to handle click outside here, as it's handled in the wrapper
    // This handles click outside for the non-portal version only (legacy support)
    useEffect(() => {
      if (!position || position.position !== 'fixed') {
        const handleClickOutside = (event: MouseEvent) => {
          const panelElement = ref as React.RefObject<HTMLDivElement>;
          if (
            state.openPanels[channelFilter] &&
            panelElement.current &&
            !panelElement.current.contains(event.target as Node)
          ) {
            if (popoverControls && popoverControls.channel === channelFilter) {
              // void LogService.debug('NotificationPanel', 'outside click closing via popover', {
              //   channel: channelFilter,
              // });
              popoverControls.setOpen(false);
            } else {
              // void LogService.debug('NotificationPanel', 'outside click closing via context', {
              //   channel: channelFilter,
              // });
              togglePanel(channelFilter, false);
            }
          }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [state.openPanels, togglePanel, channelFilter, position, ref, popoverControls]);

    useEffect(() => {
      // void LogService.debug('NotificationPanel', 'isOpen changed', {
      //   channel: channelFilter,
      //   isOpen,
      // });
    }, [channelFilter, isOpen]);

    const notifications = channelFilter ? state.notifications[channelFilter] || [] : [];
    const unreadCount = channelFilter ? state.unreadCount[channelFilter] || 0 : state.totalUnread;

    const inlineStyle = useMemo(() => {
      if (!position) {
        return undefined;
      }
      const { position: pos, top, right, bottom, left, zIndex } = position;
      return {
        position: pos,
        top,
        right,
        bottom,
        left,
        zIndex,
      } as React.CSSProperties;
    }, [position]);

    const animationMap: Record<
      NonNullable<NotificationPanelProps['animation']>,
      { open: string; closed: string }
    > = {
      'slide-down': {
        open: 'pointer-events-auto opacity-100 translate-y-0 scale-100',
        closed: 'pointer-events-none opacity-0 -translate-y-2 scale-95',
      },
      'slide-up': {
        open: 'pointer-events-auto opacity-100 translate-y-0 scale-100',
        closed: 'pointer-events-none opacity-0 translate-y-2 scale-95',
      },
      fade: {
        open: 'pointer-events-auto opacity-100',
        closed: 'pointer-events-none opacity-0',
      },
    };

    const animationPreset = animationMap[animation] ?? animationMap['slide-down'];
    const animationClasses = isOpen ? animationPreset.open : animationPreset.closed;

    const panelClasses = classNames(
      'flex w-[min(400px,calc(100vw-1.5rem))] max-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white/95 shadow-xl ring-1 ring-black/5 backdrop-blur-lg transition-all duration-200 ease-out dark:border-neutral-700 dark:bg-neutral-900/95 dark:ring-white/10',
      variant === 'card' ? 'rounded-xl' : 'rounded-2xl',
      placement,
      animationClasses,
      className
    );

    return (
      <div
        ref={ref}
        className={panelClasses}
        style={inlineStyle}
        data-variant={variant}
        data-open={isOpen}
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-4 text-neutral-900 dark:border-neutral-700 dark:text-neutral-100">
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Notifications</h3>
            <div className="flex items-center gap-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <span>{unreadCount > 0 ? `${unreadCount} unread` : 'All read'}</span>
              <span aria-hidden className="inline-flex h-3 w-px rounded-full bg-neutral-200 dark:bg-neutral-700" />
              <span>{notifications.length} total</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <IconButton
                variant="icon"
                size="sm"
                rounded="lg"
                color="theme"
                icon="CheckCircle"
                onClick={() => markAllAsRead(channelFilter)}
                title="Mark all as read"
                srLabel="Mark all notifications as read"
              />
            )}
            <IconButton
              variant="icon"
              size="sm"
              rounded="lg"
              color="theme"
              icon="Trash"
              onClick={() => clearAll(channelFilter)}
              title="Clear all notifications"
              srLabel="Clear notifications"
            />
          </div>
        </div>
        <NotificationList channelFilter={channelFilter} />
      </div>
    );
  }
);

NotificationPanel.displayName = 'NotificationPanel';

export default NotificationPanel;
