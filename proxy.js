import { NextResponse } from 'next/server';
import { sessionCookieName } from '@/src/infrastructure/config/env.js';
import { getCurrentUserForSessionToken } from '@/src/infrastructure/auth/sessionManager.js';
import {
  canAccessPath,
  getAuthorizationPolicy,
  isPublicAsset,
} from '@/src/shared/lib/authorization.js';
import { errorResponse } from '@/src/shared/lib/response.js';

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;

  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  const policy = getAuthorizationPolicy(pathname);
  if (!policy.authRequired) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(sessionCookieName)?.value;
  const user = sessionToken
    ? await getCurrentUserForSessionToken(sessionToken)
    : null;

  if (!user) {
    if (policy.type === 'api') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (!canAccessPath(user, pathname)) {
    if (policy.type === 'api') {
      return errorResponse('FORBIDDEN', 'Access denied', 403);
    }

    return NextResponse.redirect(new URL('/403', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)).*)',
  ],
};
