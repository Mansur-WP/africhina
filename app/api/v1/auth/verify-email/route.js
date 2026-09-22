import { verifyEmailSchema } from '@/src/shared/validators/auth.js';
import { verifyEmail } from '@/src/application/auth/authService.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';

export async function POST(req) {
  const body = await req.json();
  const result = verifyEmailSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Validation failed',
      422,
      result.error.errors,
    );
  }

  try {
    await verifyEmail(result.data.token);
    return jsonResponse({}, 'Email verified successfully', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to verify email',
      error.status || 500,
    );
  }
}
