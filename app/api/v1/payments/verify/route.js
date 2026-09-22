import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { paymentVerificationSchema } from '@/src/shared/validators/cart.js';
import { verifyAndSyncPayment } from '@/src/application/payments/paymentService.js';

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (user.role?.code !== 'buyer') {
      return errorResponse('FORBIDDEN', 'Access denied.', 403);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse(
        'VALIDATION_ERROR',
        'Request body must be valid JSON.',
        422,
      );
    }

    const parsed = paymentVerificationSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Validation failed.',
        422,
        parsed.error.issues,
      );
    }

    const result = await verifyAndSyncPayment({
      buyerId: user.id,
      orderId: parsed.data.orderId,
      reference: parsed.data.reference,
    });

    return jsonResponse(
      {
        payment: result.payment,
        order: result.order,
        alreadyVerified: Boolean(result.alreadyVerified),
      },
      'Payment verified.',
      200,
    );
  } catch (error) {
    const status =
      typeof error?.status === 'number' &&
      error.status >= 400 &&
      error.status <= 599
        ? error.status
        : 500;
    const code = error?.code || 'INTERNAL_ERROR';
    const message =
      error?.code === 'PAYMENT_PROVIDER_UNAVAILABLE'
        ? 'Payment provider is temporarily unavailable.'
        : error?.message || 'Unable to verify payment.';

    return errorResponse(code, message, status);
  }
}
