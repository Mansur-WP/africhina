import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  updateProfileSchema,
} from '../src/shared/validators/auth.js';
import { roleHomePage } from '../src/shared/lib/roleRoutes.js';
import {
  canAccessPath,
  getAuthorizationPolicy,
} from '../src/shared/lib/authorization.js';
import { isSessionExpired } from '../src/infrastructure/auth/sessionManager.js';

describe('Authentication validation', () => {
  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse({
      name: 'Ada Obi',
      email: 'ada@example.com',
      phone: '+2348012345678',
      password: 'secret123',
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.role, 'buyer');
  });

  it('rejects registration with a weak password', () => {
    const result = registerSchema.safeParse({
      name: 'Ada Obi',
      email: 'ada@example.com',
      phone: '+2348012345678',
      password: 'short',
    });
    assert.strictEqual(result.success, false);
  });

  it('accepts a valid login payload', () => {
    const result = loginSchema.safeParse({
      email: 'ada@example.com',
      password: 'secret123',
    });
    assert.strictEqual(result.success, true);
  });

  it('rejects invalid email on forgot password', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'not-an-email' });
    assert.strictEqual(result.success, false);
  });

  it('accepts reset password payload with token', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc',
      password: 'newpassword',
    });
    assert.strictEqual(result.success, true);
  });

  it('accepts verify email token payload', () => {
    const result = verifyEmailSchema.safeParse({ token: 'abc' });
    assert.strictEqual(result.success, true);
  });

  it('accepts profile update payload with optional fields', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Ada Obi',
      phone: '+2348012345678',
      avatarUrl: 'https://example.com/avatar.png',
    });
    assert.strictEqual(result.success, true);
  });
});

describe('Role route mapping', () => {
  it('maps buyer to dashboard', () => {
    assert.strictEqual(roleHomePage.buyer, '/dashboard');
  });

  it('maps admin to admin route', () => {
    assert.strictEqual(roleHomePage.admin, '/admin');
  });
});

describe('Server-side authorization policy', () => {
  const buyer = { role: { code: 'buyer' } };
  const admin = { role: { code: 'admin' } };
  const logistics = { role: { code: 'logistics' } };
  const support = { role: { code: 'support' } };

  it('rejects guest access to protected routes', () => {
    assert.strictEqual(canAccessPath(null, '/dashboard'), false);
  });

  it('allows customer access to customer routes', () => {
    assert.strictEqual(canAccessPath(buyer, '/dashboard'), true);
  });

  it('rejects customer access to admin routes', () => {
    assert.strictEqual(canAccessPath(buyer, '/admin'), false);
  });

  it('rejects customer access to logistics routes', () => {
    assert.strictEqual(canAccessPath(buyer, '/logistics'), false);
  });

  it('rejects customer access to support management routes', () => {
    assert.strictEqual(canAccessPath(buyer, '/support'), false);
  });

  it('allows admin access to admin routes', () => {
    assert.strictEqual(canAccessPath(admin, '/admin'), true);
  });

  it('allows logistics access to logistics routes', () => {
    assert.strictEqual(canAccessPath(logistics, '/logistics'), true);
  });

  it('allows support access to support routes', () => {
    assert.strictEqual(canAccessPath(support, '/support'), true);
  });

  it('rejects expired sessions', () => {
    const expiredSession = { expiresAt: new Date(Date.now() - 1000) };
    assert.strictEqual(isSessionExpired(expiredSession), true);
  });

  it('requires authentication for protected APIs', () => {
    const policy = getAuthorizationPolicy('/api/v1/auth/me');
    assert.strictEqual(policy.authRequired, true);
    assert.strictEqual(canAccessPath(null, '/api/v1/auth/me'), false);
  });

  it('requires authentication for the notification unread-count API', () => {
    const policy = getAuthorizationPolicy('/api/v1/notifications/unread-count');
    assert.strictEqual(policy.authRequired, true);
    assert.strictEqual(
      canAccessPath(null, '/api/v1/notifications/unread-count'),
      false,
    );
    assert.strictEqual(
      canAccessPath(buyer, '/api/v1/notifications/unread-count'),
      true,
    );
  });

  it('rejects wrong role on protected APIs', () => {
    assert.strictEqual(canAccessPath(buyer, '/api/v1/admin/users'), false);
    assert.strictEqual(canAccessPath(admin, '/api/v1/admin/users'), true);
  });

  it('allows correct role on protected APIs', () => {
    assert.strictEqual(
      canAccessPath(logistics, '/api/v1/logistics/shipping'),
      true,
    );
    assert.strictEqual(canAccessPath(support, '/api/v1/support/tickets'), true);
  });

  it('allows public auth endpoints to remain open', () => {
    const policy = getAuthorizationPolicy('/api/v1/auth/login');
    assert.strictEqual(policy.authRequired, false);
  });
});
