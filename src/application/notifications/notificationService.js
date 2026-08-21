import { prisma } from '@/lib/prisma';

/**
 * Fetch all notifications for a given user ordered by creation date descending.
 */
export async function getUserNotifications(userId) {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Mark a notification as read for a given user.
 */
export async function markNotificationAsRead(userId, notificationId) {
  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      read: true,
    },
  });

  if (result.count === 0) {
    const error = new Error('Notification not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return { id: notificationId, read: true };
}

/**
 * Create a new notification for a user.
 */
export async function createNotification({
  userId,
  type = 'system',
  title,
  body,
}) {
  return await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
    },
  });
}
