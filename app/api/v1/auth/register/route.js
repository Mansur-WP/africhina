import { registerSchema } from '@/src/shared/validators/auth.js';
import { registerUser } from '@/src/application/auth/authService.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';

export async function POST(req) {
  const body = await req.json();
  const result = registerSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Validation failed',
      422,
      result.error.errors,
    );
  }

  try {
    const user = await registerUser(result.data);
    return jsonResponse(
      { user },
      'Registration successful. You can now sign in.',
      201,
    );
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to register user',
      error.status || 500,
    );
  }
}
