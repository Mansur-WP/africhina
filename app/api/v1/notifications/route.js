import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { getUserNotifications } from '@/src/application/notifications/notificationService.js';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const notifications = await getUserNotifications(user.id);
    return jsonResponse(notifications, 'Notifications loaded', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to load notifications',
      error.status || 500,
    );
  }
}
