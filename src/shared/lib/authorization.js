export const AUTHENTICATED_ROLES = ['buyer', 'admin', 'logistics', 'support'];

const PUBLIC_PAGE_PATHS = new Set([
  '/',
  '/403',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]);

const PUBLIC_API_PATHS = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/verify-email',
  // Product catalogue is public per docs/api-contract.md (Auth: No). Guests and
  // all authenticated roles may read products and categories. These are the
  // ONLY additional public API paths; every other /api/v1 route below still
  // defaults to authRequired.
  '/api/v1/products',
  '/api/v1/categories',
]);

// RFQ API routes — buyer-only.
function isRfqApi(normalizedPath) {
  return (
    normalizedPath === '/api/v1/rfqs' ||
    normalizedPath.startsWith('/api/v1/rfqs/')
  );
}

// Read-only catalogue detail routes are public (e.g. /api/v1/products/:id).
// This deliberately does NOT match /api/v1/admin/products (a different prefix),
// so admin product management stays protected.
function isPublicCatalogueApi(normalizedPath) {
  return (
    PUBLIC_API_PATHS.has(normalizedPath) ||
    normalizedPath.startsWith('/api/v1/products/')
  );
}

export function normalizePathname(pathname) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.replace(/\/+$/, '') || '/';
}

export function isPublicAsset(pathname) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    /\.(?:css|js|png|jpg|jpeg|gif|svg|webp|ico|txt|map)$/i.test(pathname)
  );
}

export function getAuthorizationPolicy(pathname) {
  const normalizedPath = normalizePathname(pathname);

  if (isPublicAsset(normalizedPath)) {
    return { type: 'public', authRequired: false, allowRoles: [] };
  }

  if (PUBLIC_PAGE_PATHS.has(normalizedPath)) {
    return { type: 'public', authRequired: false, allowRoles: [] };
  }

  if (normalizedPath.startsWith('/api/v1/')) {
    if (isPublicCatalogueApi(normalizedPath)) {
      return { type: 'public', authRequired: false, allowRoles: [] };
    }

    if (isRfqApi(normalizedPath)) {
      return { type: 'api', authRequired: true, allowRoles: ['buyer'] };
    }

    if (normalizedPath.startsWith('/api/v1/quotations/')) {
      return { type: 'api', authRequired: true, allowRoles: ['buyer'] };
    }

    if (normalizedPath.startsWith('/api/v1/admin/')) {
      return { type: 'api', authRequired: true, allowRoles: ['admin'] };
    }

    if (normalizedPath.startsWith('/api/v1/logistics/')) {
      return { type: 'api', authRequired: true, allowRoles: ['logistics'] };
    }

    if (normalizedPath.startsWith('/api/v1/support/')) {
      return { type: 'api', authRequired: true, allowRoles: ['support'] };
    }

    if (normalizedPath.startsWith('/api/v1/customer/')) {
      return { type: 'api', authRequired: true, allowRoles: ['buyer'] };
    }

    return {
      type: 'api',
      authRequired: true,
      allowRoles: AUTHENTICATED_ROLES,
    };
  }

  const pagePolicies = {
    '/dashboard': { type: 'page', authRequired: true, allowRoles: ['buyer'] },
    '/logistics': {
      type: 'page',
      authRequired: true,
      allowRoles: ['logistics'],
    },
    '/support': { type: 'page', authRequired: true, allowRoles: ['support'] },
    '/profile': {
      type: 'page',
      authRequired: true,
      allowRoles: AUTHENTICATED_ROLES,
    },
  };

  // /admin and all sub-routes (/admin/rfqs, etc.) are admin-only pages.
  if (normalizedPath === '/admin' || normalizedPath.startsWith('/admin/')) {
    return { type: 'page', authRequired: true, allowRoles: ['admin'] };
  }

  // /rfq and all sub-routes (/rfq/new, /rfq/:id) are buyer-only pages.
  if (normalizedPath === '/rfq' || normalizedPath.startsWith('/rfq/')) {
    return { type: 'page', authRequired: true, allowRoles: ['buyer'] };
  }

  return (
    pagePolicies[normalizedPath] || {
      type: 'public',
      authRequired: false,
      allowRoles: [],
    }
  );
}

export function canAccessPath(user, pathname) {
  const policy = getAuthorizationPolicy(pathname);

  if (!policy.authRequired) {
    return true;
  }

  if (!user) {
    return false;
  }

  return policy.allowRoles.includes(user.role?.code);
}
