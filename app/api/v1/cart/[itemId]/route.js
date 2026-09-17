import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { cartQuantitySchema } from '@/src/shared/validators/cart.js';
import {
  removeCartItem,
  updateCartItem,
} from '@/src/application/cart/cartService.js';

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

export async function PATCH(req, { params }) {
  try {
    const user = await requireBuyer();
    const parsed = cartQuantitySchema.safeParse(await req.json());
    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Validation failed.',
        422,
        parsed.error.issues,
      );
    }
    const { itemId } = await params;
    return jsonResponse(
      await updateCartItem(user.id, itemId, parsed.data.quantity),
      'Cart updated.',
      200,
    );
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message,
      error.status || 500,
    );
  }
}

export async function DELETE(_req, { params }) {
  try {
    const user = await requireBuyer();
    const { itemId } = await params;
    return jsonResponse(
      await removeCartItem(user.id, itemId),
      'Cart item removed.',
      200,
    );
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message,
      error.status || 500,
    );
  }
}
