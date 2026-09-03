'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getRealtimeChannelNameAction, getUserNotificationsAction, getUnreadCountAction, markAsReadAction, markAllAsReadAction } from '@/actions/notifications';
import { NotificationDTO } from '@/domain/notification/service/NotificationService';

interface NotificationContextType {
  notifications: NotificationDTO[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      const [resList, resCount] = await Promise.all([
        getUserNotificationsAction(1, 20),
        getUnreadCountAction()
      ]);
      setNotifications(resList.data);
      setUnreadCount(resCount);
    } catch (e) {
      console.error('Failed to fetch initial notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const setupRealtime = async () => {
      await fetchInitial();
      
      try {
        eventSource = new EventSource('/api/notifications/stream');
        
        eventSource.onmessage = (event) => {
          const dataStr = event.data;
          // Ignore keep-alive heartbeats
          if (dataStr.includes('connected') || dataStr.includes('heartbeat')) return;
          
          try {
            const newNotif = JSON.parse(dataStr) as NotificationDTO;
            setNotifications(prev => {
              if (prev.some(n => n.id === newNotif.id)) return prev;
              return [newNotif, ...prev];
            });
            setUnreadCount(prev => prev + 1);
          } catch (err) {
            console.error('Failed to parse SSE notification', err);
          }
        };

        eventSource.onerror = (err) => {
          console.error('SSE Error:', err);
          // EventSource auto-reconnects, but we log it
        };
      } catch (e) {
        console.error('SSE setup failed, falling back to REST only.', e);
      }
    };

    setupRealtime();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const markAsRead = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif || notif.readAt) return; // Optimistic bypass

    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date() } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await markAsReadAction(id);
    } catch (e) {
      console.error('Failed to mark read', e);
      // We don't rollback to keep UI snappy, but could trigger a refresh here if critical
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt || new Date() })));
    setUnreadCount(0);
    
    try {
      await markAllAsReadAction();
    } catch (e) {
      console.error('Failed to mark all read', e);
    }
  };

  const refresh = async () => {
    await fetchInitial();
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, refresh, loading }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
