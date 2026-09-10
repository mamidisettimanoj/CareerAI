import { db } from '@/lib/db';
import { NotificationData } from '@/domain/notifications/types/notification.types';

export class LocalNotificationRepository {
  async getNotifications(): Promise<NotificationData[]> {
    if (!db) return [];
    try {
      const all = await db.notifications.toArray();
      return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
      console.error('Failed to get notifications', e);
      return [];
    }
  }

  async saveNotification(notification: NotificationData): Promise<void> {
    if (!db) return;
    try {
      await db.notifications.put(notification);
    } catch (e) {
      console.error(e);
    }
  }

  async markAsRead(id: string): Promise<void> {
    if (!db) return;
    try {
      await db.notifications.update(id, { isRead: true });
    } catch (e) {
      console.error(e);
    }
  }

  async dismiss(id: string): Promise<void> {
    if (!db) return;
    try {
      await db.notifications.update(id, { isDismissed: true });
    } catch (e) {
      console.error(e);
    }
  }

  async deleteOldNotifications(): Promise<void> {
    if (!db) return;
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      await db.notifications.where('date').below(thirtyDaysAgo).delete();
    } catch (e) {
      console.error(e);
    }
  }
}
