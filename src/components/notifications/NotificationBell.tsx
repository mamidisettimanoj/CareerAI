'use client';

import React, { useState } from 'react';
import { useNotifications } from './NotificationProvider';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import Link from 'next/link';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mb-2"></div>
                  <p className="text-sm">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Inbox className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm font-medium text-foreground">All caught up!</p>
                  <p className="text-xs">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.slice(0, 10).map(notif => {
                    const isUnread = !notif.readAt;
                    // Provide safe routing based on type if needed
                    // A proper implementation might map entity types to routes, e.g. APPLICATION -> /applications/[id]
                    return (
                      <div 
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${isUnread ? 'bg-primary/5' : ''}`}
                        onClick={() => {
                          if (isUnread) markAsRead(notif.id);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {isUnread && (
                            <div className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                          )}
                          <div className={!isUnread ? 'ml-5' : ''}>
                            <p className={`text-sm ${isUnread ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                              {notif.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <Link 
              href="/notifications" 
              onClick={() => setIsOpen(false)}
              className="block w-full px-4 py-3 text-center text-sm font-medium text-muted-foreground hover:text-foreground border-t border-border bg-muted/20 hover:bg-muted/60 transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
