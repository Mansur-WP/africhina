import { resetPasswordSchema } from '@/src/shared/validators/auth.js';
import { resetPassword } from '@/src/application/auth/authService.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';

export async function POST(req) {
  const body = await req.json();
  const result = resetPasswordSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Validation failed',
      422,
      result.error.errors,
    );
  }

  try {
    await resetPassword(result.data.token, result.data.password);
    return jsonResponse({}, 'Password reset successfully', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to reset password',
      error.status || 500,
    );
  }
}
