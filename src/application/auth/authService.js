import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import {
  createSession,
  deleteSessionToken,
  deleteSessionsForUser,
} from '@/src/infrastructure/auth/sessionManager.js';
import {
  deleteVerificationTokensByUser,
  getVerificationToken,
  createVerificationToken,
} from '@/src/infrastructure/auth/tokenManager.js';
import { sendPasswordResetEmail } from '@/src/infrastructure/email/resend.js';

export async function registerUser({ name, email, phone, password, role }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    const error = new Error('Email already registered');
    error.status = 409;
    error.code = 'CONFLICT';
    throw error;
  }

  const roleRecord = await prisma.role.findUnique({ where: { code: role } });
  if (!roleRecord) {
    const error = new Error('Invalid role');
    error.status = 422;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      passwordHash,
      roleId: roleRecord.id,
      emailVerified: true,
    },
    include: { role: true },
  });

  return sanitizeUser(user);
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { role: true },
  });

  if (!user || !user.passwordHash) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  const passwordIsValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordIsValid) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  if (user.status === 'suspended') {
    const error = new Error('Account suspended');
    error.status = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  const session = await createSession(user.id);
  return {
    user: sanitizeUser(user),
    sessionToken: session.sessionToken,
  };
}

export async function logoutUser(sessionToken) {
  await deleteSessionToken(sessionToken);
}

export async function getUserBySessionToken(sessionToken) {
  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: { include: { role: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return sanitizeUser(session.user);
}

export async function requestPasswordReset(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (!user) {
    return;
  }

  await deleteVerificationTokensByUser(user.id, 'passwordReset');
  const token = await createVerificationToken(user.id, 'passwordReset');
  await sendPasswordResetEmail({
    name: user.name,
    email: user.email,
    token: token.token,
  });
}

export async function resetPassword(token, password) {
  const record = await getVerificationToken(token);
  if (
    !record ||
    record.type !== 'passwordReset' ||
    record.expiresAt < new Date()
  ) {
    const error = new Error('Invalid or expired reset token');
    error.status = 400;
    error.code = 'INVALID_TOKEN';
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });
  await deleteVerificationTokensByUser(record.userId, 'passwordReset');
  await deleteSessionsForUser(record.userId);
}

export async function verifyEmail(token) {
  const record = await getVerificationToken(token);
  if (
    !record ||
    record.type !== 'emailVerification' ||
    record.expiresAt < new Date()
  ) {
    const error = new Error('Invalid or expired verification token');
    error.status = 400;
    error.code = 'INVALID_TOKEN';
    throw error;
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: true },
  });
  await deleteVerificationTokensByUser(record.userId, 'emailVerification');
}

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) {
    return null;
  }

  return sanitizeUser(user);
}

export async function updateProfile(userId, { name, phone, avatarUrl }) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      avatarUrl: avatarUrl?.trim() || null,
    },
    include: { role: true },
  });

  return sanitizeUser(user);
}

function sanitizeUser(user) {
  const { passwordHash, roleId, ...sanitized } = user;
  return {
    ...sanitized,
    role: user.role ? { code: user.role.code, name: user.role.name } : null,
  };
}
