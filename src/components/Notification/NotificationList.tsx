import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Notification } from '../../types/Notification';
import { format } from 'date-fns';
import { NotificationCard } from './NotificationCard';
import { GLOBAL_NOTIFICATION_CHANNEL } from '../../constants/constants';
import classNames from 'classnames';

interface Props {
  channelFilter?: string;
}

interface GroupedNotifications {
  [key: string]: Notification[];
}

export const NotificationList: React.FC<Props> = ({ channelFilter }) => {
  const { state, setPage, removeNotification } = useNotifications();
  const { notifications, currentPage, itemsPerPage } = state;

  // Get notifications for the channel or all channels
  const allNotifications = channelFilter
    ? notifications[channelFilter] || []
    : Object.entries(notifications)
        .filter(([channel]) => channel === GLOBAL_NOTIFICATION_CHANNEL)
        .flatMap(([, channelNotifications]) => channelNotifications);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(allNotifications.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Get paginated notifications
  const paginatedNotifications =
    allNotifications.length > 0 ? allNotifications.slice(startIndex, endIndex) : [];

  // Group the paginated notifications by date
  const groupedNotifications = paginatedNotifications.reduce(
    (groups: GroupedNotifications, notification) => {
      const date = format(notification.timestamp, 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
      return groups;
    },
    {}
  );

  const getDateLabel = (date: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

    switch (date) {
      case today:
        return 'Today';
      case yesterday:
        return 'Yesterday';
      default:
        return format(new Date(date), 'MMMM d, yyyy');
    }
  };

  const handleDelete = (id: string) => {
    const notification = allNotifications.find((n) => n.id === id);
    if (notification) {
      removeNotification(notification.channel, id);
    }
  };

  const hasNotifications = Object.keys(groupedNotifications).length > 0;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
      {hasNotifications ? (
        <>
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([date, notificationsForDay]) => (
              <div key={date} className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  {getDateLabel(date)}
                </div>
                <div className="space-y-3">
                  {notificationsForDay.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onDelete={handleDelete}
                      variant="default"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {allNotifications.length > itemsPerPage && (
            <div className="sticky bottom-0 mt-6 flex justify-center gap-2 bg-gradient-to-t from-white via-white/95 to-transparent py-3 dark:from-neutral-900 dark:via-neutral-900/95">
              {Array.from({ length: totalPages }, (_, i) => {
                const pageNumber = i + 1;
                const isActive = currentPage === pageNumber;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    className={classNames(
                      'inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition-colors duration-150',
                      isActive
                        ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                        : 'border-transparent bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    )}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-12 text-sm font-medium text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-400">
          No notifications yet
        </div>
      )}
    </div>
  );
};
