import { handlePaystackWebhook } from '@/src/application/payments/paymentService.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';

export async function POST(req) {
  try {
    const signature = req.headers.get('x-paystack-signature');
    if (!signature) {
      return errorResponse('UNAUTHORIZED', 'Missing webhook signature.', 401);
    }

    const rawBody = await req.text();
    if (!rawBody) {
      return errorResponse('VALIDATION_ERROR', 'Empty webhook payload.', 400);
    }

    const result = await handlePaystackWebhook({
      rawBody,
      signature,
    });

    return jsonResponse(
      {
        received: true,
        alreadyVerified: Boolean(result?.alreadyVerified),
      },
      'Webhook processed successfully.',
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
    const message = error?.message || 'Unable to process webhook.';

    return errorResponse(code, message, status);
  }
}
