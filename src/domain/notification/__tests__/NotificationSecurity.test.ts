import { PrismaClient, NotificationType, Role } from '@prisma/client';
import { NotificationService } from '../service/NotificationService';
import { describe, it, expect, beforeEach, vi, afterAll, beforeAll } from 'vitest';
import { getSecureUserChannelName } from '../../../lib/realtime';

// Integration test suite verifying the strict isolation and idempotency invariants
describe('Notification Security & Delivery Invariants', () => {
  let prisma: PrismaClient;
  let service: NotificationService;

  beforeAll(async () => {
    prisma = new PrismaClient();
    service = new NotificationService(prisma);
    
    // Clear out any DB cruft
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();
  });

  async function createTestUser(id: string, role: Role = 'STUDENT') {
    return prisma.user.create({
      data: {
        id,
        email: `${id}@test.com`,
        role,
      }
    });
  }

  describe('Isolation Boundaries', () => {
    it('1. should only return notifications for the authenticated user', async () => {
      const userA = await createTestUser('user-a');
      const userB = await createTestUser('user-b');

      await service.createNotification({
        recipientUserId: userA.id,
        type: NotificationType.SYSTEM_NOTIFICATION,
        title: 'For A',
        message: 'A'
      });

      await service.createNotification({
        recipientUserId: userB.id,
        type: NotificationType.SYSTEM_NOTIFICATION,
        title: 'For B',
        message: 'B'
      });

      const resA = await service.getUserNotifications(userA.id);
      expect(resA.data).toHaveLength(1);
      expect(resA.data[0].title).toBe('For A');

      const resB = await service.getUserNotifications(userB.id);
      expect(resB.data).toHaveLength(1);
      expect(resB.data[0].title).toBe('For B');
    });

    it('2. should enforce unread count strictly per user', async () => {
      const userA = await createTestUser('user-count-a');
      const userB = await createTestUser('user-count-b');

      await service.createNotification({ recipientUserId: userA.id, type: NotificationType.SYSTEM_NOTIFICATION, title: 'A1', message: 'A' });
      await service.createNotification({ recipientUserId: userA.id, type: NotificationType.SYSTEM_NOTIFICATION, title: 'A2', message: 'A' });
      await service.createNotification({ recipientUserId: userB.id, type: NotificationType.SYSTEM_NOTIFICATION, title: 'B1', message: 'B' });

      expect(await service.getUnreadCount(userA.id)).toBe(2);
      expect(await service.getUnreadCount(userB.id)).toBe(1);
    });

    it('3. should prevent IDOR when marking another user\'s notification as read', async () => {
      const userA = await createTestUser('user-idor-a');
      const userB = await createTestUser('user-idor-b');

      await service.createNotification({ recipientUserId: userA.id, type: NotificationType.SYSTEM_NOTIFICATION, title: 'A1', message: 'A' });
      
      const notifsA = await service.getUserNotifications(userA.id);
      const targetId = notifsA.data[0].id;

      // User B attempts to mark User A's notification as read
      await service.markAsRead(targetId, userB.id);

      // Verify it is STILL unread for User A because the UPDATE failed closed
      const checkA = await service.getUserNotifications(userA.id);
      expect(checkA.data[0].readAt).toBeNull();
    });

    it('4. should successfully mark own notification as read', async () => {
      const userA = await createTestUser('user-read-a');
      await service.createNotification({ recipientUserId: userA.id, type: NotificationType.SYSTEM_NOTIFICATION, title: 'A1', message: 'A' });
      
      const notifs = await service.getUserNotifications(userA.id);
      await service.markAsRead(notifs.data[0].id, userA.id);

      const check = await service.getUserNotifications(userA.id);
      expect(check.data[0].readAt).not.toBeNull();
    });
  });

  describe('Idempotency & Consistency', () => {
    it('5. should silently ignore duplicate creations if idempotencyKey is used', async () => {
      const user = await createTestUser('user-idem');
      
      await service.createNotification({
        recipientUserId: user.id,
        type: NotificationType.SYSTEM_NOTIFICATION,
        title: 'Task Done',
        message: 'Success',
        idempotencyKey: 'event-123'
      });

      // Second identical event
      await service.createNotification({
        recipientUserId: user.id,
        type: NotificationType.SYSTEM_NOTIFICATION,
        title: 'Task Done',
        message: 'Success',
        idempotencyKey: 'event-123'
      });

      const res = await service.getUserNotifications(user.id);
      expect(res.data).toHaveLength(1);
    });

    it('6. should allow duplicate creations if no idempotencyKey is used', async () => {
      const user = await createTestUser('user-no-idem');
      
      await service.createNotification({ recipientUserId: user.id, type: NotificationType.SYSTEM_NOTIFICATION, title: 'A', message: 'A' });
      await service.createNotification({ recipientUserId: user.id, type: NotificationType.SYSTEM_NOTIFICATION, title: 'A', message: 'A' });

      const res = await service.getUserNotifications(user.id);
      expect(res.data).toHaveLength(2);
    });
  });

  describe('Realtime Channel Cryptography', () => {
    it('7. should generate a deterministic unguessable channel name', () => {
      const ch1 = getSecureUserChannelName('user-1');
      const ch2 = getSecureUserChannelName('user-1');
      expect(ch1).toBe(ch2);
      expect(ch1).toMatch(/^private-notifications-user-1-[a-f0-9]{32}$/);
    });

    it('8. should generate completely different hashes for different users', () => {
      const ch1 = getSecureUserChannelName('user-1');
      const ch2 = getSecureUserChannelName('user-2');
      expect(ch1.split('-')[3]).not.toBe(ch2.split('-')[3]);
    });
  });
});
