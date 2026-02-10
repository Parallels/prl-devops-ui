import React, { useMemo, useState } from 'react';
import classNames from 'classnames';
import { Notification } from '../../types/Notification';
import { useNotifications } from '../../contexts/NotificationContext';
import { format } from 'date-fns';
import { Button, IconButton, type ButtonColor, type ToastAction, type IconName } from '@prl/ui-kit';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import type { Components as MarkdownComponents } from 'react-markdown';
import { useNotificationPopover } from './NotificationPopoverContext';
// import LogService from '@/services/LogService';

interface NotificationCardProps {
  notification: Notification;
  onDelete: (id: string) => void;
  variant?: 'default' | 'card';
}

const ACCENT_MAP: Record<
  Notification['type'],
  { border: string; dot: string; unreadBg: string; ring: string }
> = {
  success: {
    border: 'border-emerald-500',
    dot: 'bg-emerald-500',
    unreadBg: 'bg-emerald-50/60 dark:bg-emerald-500/10',
    ring: 'ring-emerald-200/70 dark:ring-emerald-500/40',
  },
  error: {
    border: 'border-rose-500',
    dot: 'bg-rose-500',
    unreadBg: 'bg-rose-50/60 dark:bg-rose-500/10',
    ring: 'ring-rose-200/70 dark:ring-rose-500/40',
  },
  warning: {
    border: 'border-amber-500',
    dot: 'bg-amber-400',
    unreadBg: 'bg-amber-50/60 dark:bg-amber-400/10',
    ring: 'ring-amber-200/70 dark:ring-amber-400/40',
  },
  info: {
    border: 'border-blue-500',
    dot: 'bg-blue-500',
    unreadBg: 'bg-blue-50/60 dark:bg-blue-500/10',
    ring: 'ring-blue-200/70 dark:ring-blue-500/40',
  },
  progress: {
    border: 'border-sky-500',
    dot: 'bg-sky-500',
    unreadBg: 'bg-sky-50/60 dark:bg-sky-500/10',
    ring: 'ring-sky-200/70 dark:ring-sky-500/40',
  },
};

const MARKDOWN_COMPONENTS: MarkdownComponents = {
  p: ({ children, ...props }) => (
    <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-300" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul
      className="ml-5 list-disc text-sm leading-6 text-neutral-600 dark:text-neutral-300"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      className="ml-5 list-decimal text-sm leading-6 text-neutral-600 dark:text-neutral-300"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="mt-1 first:mt-0" {...props}>
      {children}
    </li>
  ),
  code: ({ children, ...props }) => (
    <code
      className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[0.75rem] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="overflow-x-auto rounded-lg bg-neutral-100 px-4 py-3 text-sm leading-6 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
      {...props}
    >
      {children}
    </pre>
  ),
  a: ({ children, ...props }) => (
    <a
      className="font-medium text-blue-600 underline hover:text-blue-500 dark:text-blue-400"
      {...props}
    >
      {children}
    </a>
  ),
};

const DETAILS_SCROLL_CONTAINER = 'max-h-60 overflow-y-auto pr-1 space-y-3 pb-3';

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onDelete,
  variant = 'default',
}) => {
  const { markAsRead, togglePanel } = useNotifications();
  const popoverControls = useNotificationPopover();
  const [isExpanded, setIsExpanded] = useState(false);
  const accent = ACCENT_MAP[notification.type];

  const handleActionClick = (action: ToastAction) => {
    // void LogService.debug('NotificationCard', 'actionClick', {
    //   channel: notification.channel,
    //   notificationId: notification.id,
    //   actionLabel: action.label,
    // });
    if (action.onClick) {
      action.onClick();
    }
    setIsExpanded(false);
    if (popoverControls && popoverControls.channel === notification.channel) {
      popoverControls.setOpen(false);
    } else {
      togglePanel(notification.channel, false);
    }
  };

  const toggleExpand = () => {
    // void LogService.debug('NotificationCard', 'toggleExpand', {
    //   channel: notification.channel,
    //   notificationId: notification.id,
    //   nextExpanded: !isExpanded,
    // });
    if (!notification.isRead) {
      markAsRead(notification.id, notification.channel);
    }
    setIsExpanded(!isExpanded);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  const getNotificationActionIcon = (
    action: ToastAction
  ): IconName | React.ReactElement | undefined => {
    if (action.customIcon && React.isValidElement(action.customIcon)) {
      return action.customIcon;
    }
    if (action.icon) {
      return action.icon as IconName;
    }
    return undefined;
  };

  const timeDisplay = useMemo(() => {
    const timestamp = format(notification.timestamp, 'MMM d, h:mm a');
    if (notification.updatedAt && notification.updatedAt > notification.timestamp) {
      const updatedTime = format(notification.updatedAt, 'MMM d, h:mm a');
      return (
        <div className="flex flex-col gap-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          <span>Created: {timestamp}</span>
          <span>Updated: {updatedTime}</span>
        </div>
      );
    }
    return (
      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{timestamp}</div>
    );
  }, [notification.timestamp, notification.updatedAt]);

  const actionColorMap: Record<NonNullable<ToastAction['variant']>, ButtonColor> = {
    primary: 'blue',
    secondary: 'slate',
    danger: 'rose',
  };

  const containerClasses = classNames(
    'group relative select-none overflow-hidden rounded-xl border bg-white/95 shadow-sm transition-all duration-200 hover:shadow-lg dark:bg-neutral-900/90',
    'border-l-6',
    accent.border,
    !notification.isRead && accent.unreadBg,
    !notification.isRead && accent.ring && 'ring-1',
    !notification.isRead && accent.ring
  );

  return (
    <div
      className={containerClasses}
      data-id={notification.id}
      data-variant={variant}
      data-read={notification.isRead}
    >
      {!notification.isRead && (
        <span
          aria-hidden
          className={classNames(
            'absolute left-1 top-5.5 h-2 w-2 rounded-full shadow-sm',
            accent.dot
          )}
        />
      )}
      <div
        className={classNames(
          'flex items-center gap-4 p-4 pr-20 transition-colors duration-200',
          variant === 'card' ? 'cursor-pointer' : ''
        )}
      >
        <div className="flex select-none cursor-default min-w-0 flex-1 flex-col gap-2">
          <div
            className={classNames(
              'text-sm font-semibold leading-5 text-neutral-900 dark:text-neutral-100',
              !notification.isRead ? 'tracking-tight' : 'font-medium'
            )}
          >
            {notification.message}
          </div>
        </div>
        <div className="absolute right-2 top-1 flex items-center">
          <IconButton
            accent={true}
            size="sm"
            rounded="lg"
            color="theme"
            icon="Close"
            className="opacity-60 transition-opacity duration-150 hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
            onClick={handleDelete}
            title="Delete notification"
            srLabel="Delete notification"
          />
          {(notification.details || (notification.actions && notification.actions.length > 0)) && (
            <IconButton
              accent={true}
              size="sm"
              rounded="lg"
              color="blue"
              icon="ArrowDown"
              iconClassName={classNames(
                'transition-transform duration-200',
                isExpanded ? 'rotate-180' : 'rotate-0'
              )}
              onClick={toggleExpand}
              title={isExpanded ? 'Collapse notification' : 'Expand notification'}
              srLabel={isExpanded ? 'Collapse notification' : 'Expand notification'}
              aria-expanded={isExpanded}
            />
          )}
        </div>
      </div>
      <div className="px-4 pb-3 select-none cursor-default">{timeDisplay}</div>
      <div
        className={classNames(
          'overflow-hidden px-4 transition-all duration-200 ease-out',
          isExpanded ? 'max-h-60 py-3 opacity-100' : 'max-h-0 opacity-0'
        )}
        aria-hidden={!isExpanded}
      >
        {notification.details && (
          <div className={classNames('text-sm leading-6 text-neutral-600 dark:text-neutral-300', DETAILS_SCROLL_CONTAINER)}>
            {typeof notification.details === 'string' ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                {notification.details}
              </ReactMarkdown>
            ) : (
              notification.details
            )}
          </div>
        )}
      </div>
      {notification.actions && notification.actions.length > 0 && isExpanded && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          {notification.actions.map((action) => (
            <Button
              key={action.label}
              variant="soft"
              size="sm"
              color={action.variant ? (actionColorMap[action.variant] ?? 'theme') : 'theme'}
              leadingIcon={getNotificationActionIcon(action)}
              onClick={() => handleActionClick(action)}
              className="font-medium"
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
