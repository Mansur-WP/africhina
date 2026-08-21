import { forgotPasswordSchema } from '@/src/shared/validators/auth.js';
import { requestPasswordReset } from '@/src/application/auth/authService.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';

export async function POST(req) {
  const body = await req.json();
  const result = forgotPasswordSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Validation failed',
      422,
      result.error.errors,
    );
  }

  try {
    await requestPasswordReset(result.data.email);
    return jsonResponse(
      {},
      'If the email is registered, a reset link has been sent.',
      200,
    );
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to process request',
      error.status || 500,
    );
  }
}
