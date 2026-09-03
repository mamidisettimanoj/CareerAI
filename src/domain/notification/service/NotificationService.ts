import { PrismaClient, NotificationType } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { getSecureUserChannelName } from '../../../lib/realtime';

export interface CreateNotificationDTO {
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  metadata: Record<string, unknown> | null;
}

export class NotificationService {
  private readonly supabase;

  constructor(private readonly prisma: PrismaClient) {
    // Initialize Supabase Admin client for server-side broadcasting
    // We use the service role key to bypass RLS and ensure delivery
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
  }

  /**
   * Creates a notification and triggers a realtime broadcast.
   * Safe to call within a Prisma transaction via the `tx` parameter.
   */
  async createNotification(dto: CreateNotificationDTO, tx?: any): Promise<void> {
    const db = tx || this.prisma;
    
    // 1. Idempotency Check (if key provided)
    if (dto.idempotencyKey) {
      const existing = await db.notification.findUnique({
        where: {
          recipientUserId_idempotencyKey: {
            recipientUserId: dto.recipientUserId,
            idempotencyKey: dto.idempotencyKey
          }
        }
      });
      if (existing) return; // Silent return for duplicate idempotent request
    }

    // 2. Persist to Database (Source of Truth)
    const notification = await db.notification.create({
      data: {
        recipientUserId: dto.recipientUserId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        relatedEntityType: dto.relatedEntityType,
        relatedEntityId: dto.relatedEntityId,
        metadata: dto.metadata ?? null,
        idempotencyKey: dto.idempotencyKey
      }
    });

    // 3. Realtime Delivery via Secure Channel
    // Fire-and-forget: do not block or fail the transaction if broadcast fails
    try {
      const channelName = getSecureUserChannelName(dto.recipientUserId);
      const payload: NotificationDTO = {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
        relatedEntityType: notification.relatedEntityType,
        relatedEntityId: notification.relatedEntityId,
        metadata: (notification.metadata as Record<string, unknown>) ?? null
      };

      // Use explicit REST delivery to avoid the warning since we don't open a full WebSocket connection
      await this.supabase.channel(channelName).httpSend(
        'new_notification',
        payload
      );
    } catch (e) {
      console.error('Failed to broadcast realtime notification:', e);
      // We don't throw because DB persistence succeeded
    }
  }

  /**
   * Fetches paginated notifications securely scoped to the recipient.
   */
  async getUserNotifications(userId: string, page = 1, pageSize = 50): Promise<{ data: NotificationDTO[], metadata: any }> {
    const take = Math.min(pageSize, 100);
    const skip = (page - 1) * take;

    const [notifications, totalCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { recipientUserId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      this.prisma.notification.count({
        where: { recipientUserId: userId }
      })
    ]);

    const data: NotificationDTO[] = notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      readAt: n.readAt,
      createdAt: n.createdAt,
      relatedEntityType: n.relatedEntityType,
      relatedEntityId: n.relatedEntityId,
      metadata: (n.metadata as Record<string, unknown>) ?? null
    }));

    return {
      data,
      metadata: { page, pageSize: take, totalCount, hasNext: skip + take < totalCount }
    };
  }

  /**
   * Fast aggregate query for unread bell indicator.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        recipientUserId: userId,
        readAt: null
      }
    });
  }

  /**
   * Marks a specific notification as read.
   * Validates ownership implicitly via the where clause.
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    // We use updateMany to safely enforce the recipientUserId constraint
    // without risking an IDOR if someone guesses a UUID.
    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientUserId: userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });
  }

  /**
   * Marks all notifications for a user as read.
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        recipientUserId: userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });
  }
}
