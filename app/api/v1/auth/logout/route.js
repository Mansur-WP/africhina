import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { deleteSessionToken } from '@/src/infrastructure/auth/sessionManager.js';
import {
  sessionCookieName,
  isProduction,
} from '@/src/infrastructure/config/env.js';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(sessionCookieName)?.value;
    await deleteSessionToken(sessionToken);
    cookieStore.set({
      name: sessionCookieName,
      value: '',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return jsonResponse({}, 'Logout successful', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to logout',
      error.status || 500,
    );
  }
}
