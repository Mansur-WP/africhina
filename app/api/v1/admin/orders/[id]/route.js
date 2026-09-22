import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import {
  getAdminOrder,
  advanceOrderStatus,
} from '@/src/application/orders/orderService.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';

export async function GET(_req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'admin')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);
    const order = await getAdminOrder((await params).id);
    if (!order) return errorResponse('NOT_FOUND', 'Order not found.', 404);
    return jsonResponse(order, 'Order loaded.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to load order.',
      error.status || 500,
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'admin')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);

    const orderId = (await params).id;
    const body = await req.json();
    const { status, note } = body ?? {};

    if (!status) {
      return errorResponse(
        'VALIDATION_ERROR',
        'A target "status" is required.',
        422,
      );
    }

    const updated = await advanceOrderStatus(orderId, user.id, status, {
      note,
    });

    return jsonResponse(updated, 'Order status updated.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to update order status.',
      error.status || 500,
    );
  }
}
