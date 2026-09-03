'use server';

import { requireCareerUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/domain/notification/service/NotificationService';
import { getSecureUserChannelName } from '@/lib/realtime';

export async function getUserNotificationsAction(page = 1, pageSize = 50) {
  const user = await requireCareerUser();
  const service = new NotificationService(prisma);
  return service.getUserNotifications(user.id, page, pageSize);
}

export async function getUnreadCountAction() {
  const user = await requireCareerUser();
  const service = new NotificationService(prisma);
  return service.getUnreadCount(user.id);
}

export async function markAsReadAction(notificationId: string) {
  const user = await requireCareerUser();
  const service = new NotificationService(prisma);
  await service.markAsRead(notificationId, user.id);
}

export async function markAllAsReadAction() {
  const user = await requireCareerUser();
  const service = new NotificationService(prisma);
  await service.markAllAsRead(user.id);
}

export async function getRealtimeChannelNameAction() {
  const user = await requireCareerUser();
  // Generate the unguessable HMAC channel name securely on the server
  return getSecureUserChannelName(user.id);
}
