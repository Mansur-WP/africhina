import crypto from 'crypto';
import { prisma } from '@/lib/prisma.js';
import { verificationTokenTTL } from '@/src/infrastructure/config/env.js';

export async function createVerificationToken(userId, type) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + verificationTokenTTL[type] * 1000);

  return prisma.verificationToken.create({
    data: {
      token,
      userId,
      type,
      expiresAt,
    },
  });
}

export async function getVerificationToken(token) {
  if (!token) {
    return null;
  }

  return prisma.verificationToken.findUnique({
    where: { token },
  });
}

export async function deleteVerificationToken(id) {
  if (!id) {
    return;
  }

  await prisma.verificationToken.deleteMany({
    where: { id },
  });
}

export async function deleteVerificationTokensByUser(userId, type) {
  await prisma.verificationToken.deleteMany({
    where: { userId, type },
  });
}
