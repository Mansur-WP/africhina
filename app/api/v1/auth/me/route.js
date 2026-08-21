import { updateProfileSchema } from '@/src/shared/validators/auth.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import {
  getProfile,
  updateProfile,
} from '@/src/application/auth/authService.js';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const profile = await getProfile(user.id);
    return jsonResponse({ user: profile }, 'Current user loaded', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to load user',
      error.status || 500,
    );
  }
}

export async function PUT(req) {
  const body = await req.json();
  const result = updateProfileSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Validation failed',
      422,
      result.error.errors,
    );
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const updated = await updateProfile(user.id, result.data);
    return jsonResponse({ user: updated }, 'Profile updated', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to update profile',
      error.status || 500,
    );
  }
}
