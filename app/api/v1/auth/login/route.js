import { loginSchema } from '@/src/shared/validators/auth.js';
import { loginUser } from '@/src/application/auth/authService.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import {
  sessionCookieName,
  isProduction,
  sessionDurationSeconds,
} from '@/src/infrastructure/config/env.js';
import { cookies } from 'next/headers';

export async function POST(req) {
  const body = await req.json();
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Validation failed',
      422,
      result.error.errors,
    );
  }

  try {
    const { user, sessionToken } = await loginUser(result.data);
    const cookieStore = await cookies();
    cookieStore.set({
      name: sessionCookieName,
      value: sessionToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: sessionDurationSeconds,
    });

    return jsonResponse({ user }, 'Login successful', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to login',
      error.status || 500,
    );
  }
}
