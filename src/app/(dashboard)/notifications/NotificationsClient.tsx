'use client';

import React, { useEffect, useState } from 'react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { CheckCheck, Bell, Inbox, AlertCircle } from 'lucide-react';
import { getUserNotificationsAction } from '@/actions/notifications';
import { NotificationDTO } from '@/domain/notification/service/NotificationService';

export function NotificationsClient() {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [history, setHistory] = useState<NotificationDTO[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Sync context notifications to the history list
  useEffect(() => {
    // The provider fetches the first 20. We sync it to history.
    if (page === 1) {
      setHistory(notifications);
    }
  }, [notifications, page]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getUserNotificationsAction(nextPage, 20);
      setHistory(prev => {
        // Simple deduplication
        const existingIds = new Set(prev.map(n => n.id));
        const newUnique = res.data.filter(n => !existingIds.has(n.id));
        return [...prev, ...newUnique];
      });
      setPage(nextPage);
      setHasMore(res.metadata.hasNext);
    } catch (e) {
      console.error('Failed to load more notifications', e);
    } finally {
      setLoadingMore(false);
    }
  };

  if (history.length === 0 && !hasMore) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full mb-4">
          <Inbox className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">All caught up</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You don&apos;t have any notifications right now.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Alerts</h2>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {history.map((notif) => {
          const isUnread = !notif.readAt;
          return (
            <div 
              key={notif.id}
              onClick={() => isUnread && markAsRead(notif.id)}
              className={`p-4 sm:p-6 transition-colors ${
                isUnread 
                  ? 'bg-blue-50/50 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-1 flex-shrink-0 p-2 rounded-full ${isUnread ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                  {notif.type.includes('ALERT') ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <Bell className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <p className={`text-base ${isUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                      {notif.title}
                    </p>
                    <p className="text-sm text-gray-500 whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {notif.message}
                  </p>
                  <p className="mt-2 text-xs text-gray-400 font-mono">
                    ID: {notif.id.split('-')[0]}
                  </p>
                </div>
                {isUnread && (
                  <div className="flex-shrink-0 w-2.5 h-2.5 mt-2 bg-blue-500 rounded-full" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-center bg-gray-50/50 dark:bg-gray-800/20">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load older notifications'}
          </button>
        </div>
      )}
    </div>
  );
}
