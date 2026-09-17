import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { paymentInitializationSchema } from '@/src/shared/validators/cart.js';
import { initializePaystackPayment } from '@/src/application/payments/paymentService.js';

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
    const parsed = paymentInitializationSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Validation failed.',
        422,
        parsed.error.issues,
      );
    }

    const payment = await initializePaystackPayment(
      user.id,
      parsed.data.orderId,
      parsed.data.idempotencyKey,
    );
    return jsonResponse(
      {
        paymentId: payment.id,
        providerReference: payment.providerReference,
        authorizationUrl: payment.authorizationUrl,
        status: payment.status,
      },
      'Payment initialized.',
      200,
    );
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.code === 'PAYMENT_PROVIDER_UNAVAILABLE'
        ? 'Payment provider is temporarily unavailable.'
        : error.message || 'Unable to initialize payment.',
      error.status || 500,
    );
  }
}
