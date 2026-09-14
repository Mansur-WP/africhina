import crypto from 'crypto';
import { cache } from 'react';
import { prisma } from '../../../lib/prisma.js';
import { sessionDurationSeconds, sessionCookieName } from '../config/env.js';

let cookiesFactory = null;

async function getCookieStore() {
  if (!cookiesFactory) {
    try {
      const headersModule = await import('next/headers');
      cookiesFactory = headersModule.cookies;
    } catch {
      cookiesFactory = null;
    }
  }

  if (!cookiesFactory) {
    return null;
  }

  return await cookiesFactory();
}

export async function createSession(userId) {
  const sessionToken = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + sessionDurationSeconds * 1000);

  return prisma.session.create({
    data: {
      sessionToken,
      userId,
      expiresAt,
    },
  });
}

export async function getSessionByToken(sessionToken) {
  if (!sessionToken) {
    return null;
  }

  try {
    return await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: { include: { role: true } } },
    });
  } catch (error) {
    // Gracefully retry once on transient serverless TLS / DB connection resets
    if (
      error?.message?.includes('connection') ||
      error?.message?.includes('TLS') ||
      error?.code === 'P1001'
    ) {
      try {
        return await prisma.session.findUnique({
          where: { sessionToken },
          include: { user: { include: { role: true } } },
        });
      } catch {
        return null;
      }
    }
    throw error;
  }
}

export function isSessionExpired(session) {
  return !session || session.expiresAt < new Date();
}

function sanitizeUser(user) {
  const { passwordHash, roleId, ...rest } = user;
  return {
    ...rest,
    role: user.role ? { code: user.role.code, name: user.role.name } : null,
  };
}

export async function deleteSessionToken(sessionToken) {
  if (!sessionToken) {
    return;
  }

  await prisma.session.deleteMany({
    where: { sessionToken },
  });
}

export async function deleteSessionsForUser(userId) {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

export async function getCurrentUserForSessionToken(sessionToken) {
  if (!sessionToken) {
    return null;
  }

  const session = await getSessionByToken(sessionToken);
  if (!session || isSessionExpired(session)) {
    return null;
  }

  return sanitizeUser(session.user);
}

export const getSessionToken = cache(async () => {
  const cookieStore = await getCookieStore();
  return cookieStore?.get(sessionCookieName)?.value || null;
});

export const getCurrentUser = cache(async () => {
  const sessionToken = await getSessionToken();
  return getCurrentUserForSessionToken(sessionToken);
});
