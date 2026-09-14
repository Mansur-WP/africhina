export function buildNotificationWhere(userId, unreadOnly = false) {
  return {
    userId,
    ...(unreadOnly ? { read: false } : {}),
  };
}
