import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { listCustomerOrders } from '@/src/application/orders/orderService.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'buyer')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);
    const searchParams = new URL(req.url).searchParams;
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get('limit') || 20)),
    );
    const result = await listCustomerOrders(user.id, { page, limit });
    return jsonResponse(
      result.orders,
      'Orders loaded.',
      200,
      result.pagination,
    );
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to load orders.',
      error.status || 500,
    );
  }
}
