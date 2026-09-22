import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { markNotificationAsRead } from '@/src/application/notifications/notificationService.js';

export async function PUT(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id } = await params;
    if (!id) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Notification ID is required',
        400,
      );
    }

    const updated = await markNotificationAsRead(user.id, id);
    return jsonResponse(updated, 'Notification marked as read', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to update notification',
      error.status || 500,
    );
  }
}
