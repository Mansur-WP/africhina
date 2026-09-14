import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { getUnreadNotificationCount } from '@/src/application/notifications/notificationService.js';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const unreadCount = await getUnreadNotificationCount(user.id);
    return jsonResponse(
      { unreadCount },
      'Unread notification count loaded',
      200,
    );
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to load unread notification count',
      error.status || 500,
    );
  }
}
