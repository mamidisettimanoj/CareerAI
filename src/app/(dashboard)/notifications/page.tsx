"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { repositories } from '@/services/ServiceLocator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, GraduationCap, Briefcase, Trash2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsCenter() {
  const notifications = useLiveQuery(() => db.notifications.orderBy('date').reverse().toArray()) || [];

  const handleMarkAsRead = async (id: string) => {
    await repositories.notifications.markAsRead(id);
  };

  const handleDismiss = async (id: string) => {
    await repositories.notifications.dismiss(id);
  };

  const activeNotifications = notifications.filter(n => !n.isDismissed);
  const unreadCount = activeNotifications.filter(n => !n.isRead).length;

  const getIcon = (category: string) => {
    switch (category) {
      case 'Academic': return <GraduationCap className="h-5 w-5 text-blue-500" />;
      case 'Placement': return <Briefcase className="h-5 w-5 text-purple-500" />;
      case 'Goal': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default: return <Bell className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" /> Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">You have {unreadCount} unread notifications.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={async () => {
            const unread = activeNotifications.filter(n => !n.isRead);
            for (const n of unread) {
              await repositories.notifications.markAsRead(n.id);
            }
          }}>Mark all as read</Button>
        )}
      </div>

      <div className="space-y-3">
        {activeNotifications.length === 0 ? (
          <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
            No notifications at this time. You're all caught up!
          </div>
        ) : (
          activeNotifications.map(notification => (
            <Card key={notification.id} className={`${notification.isRead ? 'opacity-70 bg-muted/30' : 'border-primary/50 bg-primary/5'}`}>
              <CardContent className="p-4 flex gap-4">
                <div className="shrink-0 mt-1">
                  {getIcon(notification.category)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`text-base ${!notification.isRead ? 'font-bold' : 'font-medium'}`}>{notification.title}</h3>
                    <span className="text-xs text-muted-foreground">{new Date(notification.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm mt-1">{notification.message}</p>
                  
                  <div className="flex items-center gap-3 mt-3">
                    {notification.link && (
                      <Link href={notification.link}>
                        <Button variant="link" size="sm" className="h-auto p-0 flex items-center gap-1" onClick={() => handleMarkAsRead(notification.id)}>
                          View Details <ChevronRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                    {!notification.isRead && (
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => handleMarkAsRead(notification.id)}>
                        Mark as read
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-destructive hover:text-destructive/80" onClick={() => handleDismiss(notification.id)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
