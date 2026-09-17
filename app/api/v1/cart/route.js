import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { cartAddSchema } from '@/src/shared/validators/cart.js';
import { addCartItem, getCart } from '@/src/application/cart/cartService.js';

async function requireBuyer() {
  const user = await getCurrentUser();
  if (!user) {
    const error = new Error('Authentication required.');
    error.code = 'UNAUTHORIZED';
    error.status = 401;
    throw error;
  }
  if (user.role?.code !== 'buyer') {
    const error = new Error('Access denied.');
    error.code = 'FORBIDDEN';
    error.status = 403;
    throw error;
  }
  return user;
}

export async function GET() {
  try {
    const user = await requireBuyer();
    return jsonResponse(await getCart(user.id), 'Cart loaded.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message,
      error.status || 500,
    );
  }
}

export async function POST(req) {
  try {
    const user = await requireBuyer();
    const parsed = cartAddSchema.safeParse(await req.json());
    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Validation failed.',
        422,
        parsed.error.issues,
      );
    }
    return jsonResponse(
      await addCartItem(user.id, parsed.data.productId, parsed.data.quantity),
      'Product added to cart.',
      201,
    );
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message,
      error.status || 500,
    );
  }
}
