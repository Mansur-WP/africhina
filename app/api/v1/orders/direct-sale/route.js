import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { directSaleCheckoutSchema } from '@/src/shared/validators/cart.js';
import { prepareDirectSaleOrder } from '@/src/application/orders/directSaleOrderService.js';

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'buyer')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);
    const parsed = directSaleCheckoutSchema.safeParse(await req.json());
    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Validation failed.',
        422,
        parsed.error.issues,
      );
    }
    const order = await prepareDirectSaleOrder(user.id, parsed.data);
    return jsonResponse(order, 'Order prepared for payment.', 201);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message,
      error.status || 500,
    );
  }
}
