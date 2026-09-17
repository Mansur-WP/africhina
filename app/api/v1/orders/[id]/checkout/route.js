import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { confirmOrderCheckout } from '@/src/application/orders/orderService.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';

export async function POST(_req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'buyer')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);
    const order = await confirmOrderCheckout((await params).id, user.id);
    return jsonResponse(order, 'Checkout confirmed. Payment is pending.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to confirm checkout.',
      error.status || 500,
    );
  }
}
