import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { cancelDirectSaleOrder } from '@/src/application/orders/directSaleOrderService.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';

export async function POST(_req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (user.role?.code !== 'buyer') {
      return errorResponse('FORBIDDEN', 'Access denied.', 403);
    }

    const { id } = await params;
    const cancelled = await cancelDirectSaleOrder(id, user.id);

    return jsonResponse(cancelled, 'Order cancelled successfully.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to cancel order.',
      error.status || 500,
    );
  }
}
